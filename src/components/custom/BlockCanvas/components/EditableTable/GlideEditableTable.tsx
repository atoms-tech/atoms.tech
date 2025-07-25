'use client';

import DataEditor, {
    //Rectangle,
    DataEditorRef,
    GridCell,
    GridCellKind,
    GridColumn,
    //GridDragEventArgs,
    Item,
} from '@glideapps/glide-data-grid';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import '@glideapps/glide-data-grid/dist/index.css';

import debounce from 'lodash/debounce';

import { useUser } from '@/lib/providers/user.provider';

import { DeleteConfirmDialog, TableControls, TableLoadingSkeleton } from './components';
//import { useColumnActions } from '@/components/custom/BlockCanvas/hooks/useColumnActions';

import { /*CellValue,*/ GlideTableProps } from './types';

export function GlideEditableTable<T extends { id: string; position?: number }>(
    props: GlideTableProps<T>,
) {
    const {
        data,
        columns,
        //onCellChange,
        onSave,
        onPostSave,
        //onBlur,
        isEditMode = false,
        showFilter = false,
        filterComponent,
        onAddRow,
        //onSaveNewRow,
        //onCancelNewRow,
        //isAddingNew = false,
        deleteConfirmOpen = false,
        onDeleteConfirm,
        setDeleteConfirmOpen,
        onColumnOrderChange,
        isLoading = false,
    } = props;
    //console.debug('[GlideEditableTable] isEditMode:', isEditMode);

    const tableRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<DataEditorRef | null>(null);
    const lastEditedCellRef = useRef<Item | undefined>(undefined);
    const prevEditModeRef = useRef<boolean>(isEditMode);
    const isSavingRef = useRef(false);

    // Get user site profile info for saves.
    const { profile } = useUser();
    const userId = profile?.id;
    const userName = profile?.full_name || '';

    // Debugs for tracing loading issues, ignore.
    const instanceId = useMemo(() => Math.random().toString(36).slice(2), []);
    console.debug(`[GlideEditableTable] MOUNT instance=${instanceId}`);

    const [editingData, setEditingData] = useState<Record<string, Partial<T>>>({});
    // Ref to refresh editing data when autosave evaluated.
    const editingDataRef = useRef(editingData);
    useEffect(() => {
        editingDataRef.current = editingData;
    }, [editingData]);

    // Debounce saves, should be abstracted to table props and switched off when realtime collaboration enabled.
    const useDebouncedSave = (saveFn: () => void, delay = 5000) => {
        const debounced = useRef(debounce(saveFn, delay));
        useEffect(() => () => debounced.current.cancel(), []);
        return debounced.current;
    };

    const handleSaveAll = useCallback(async () => {
        const currentEdits = editingDataRef.current;

        if (isSavingRef.current) {
            console.debug('[GlideEditableTable] Save already in progress. Skipping.');
            return;
        }

        isSavingRef.current = true;
        console.debug('[GlideEditableTable] Saving all pending data...');

        try {
            const hasEdits = Object.keys(currentEdits).length > 0;

            if (!hasEdits) {
                console.debug('[GlideEditableTable] No changes to save.');
                return;
            }

            // Save row changes
            for (const [rowId, changes] of Object.entries(currentEdits)) {
                const originalItem = data.find((d) => d.id === rowId);
                if (!originalItem) continue;

                const fullItem: T = {
                    ...originalItem,
                    ...changes,
                };

                await onSave?.(fullItem, false, userId, userName);
                console.debug(`[GlideEditableTable] Saved row ${rowId}`);
            }

            // TODO: Update Column metadata (also need to track w/ local columns vs passed.)

            setEditingData({});
            await onPostSave?.();
        } catch (err) {
            console.error('[GlideEditableTable] Error saving all changes:', err);
        } finally {
            isSavingRef.current = false;
        }
    }, [onPostSave, data, onSave, userId, userName]);

    const debouncedSave = useDebouncedSave(() => void handleSaveAll(), 5000);

    // Normalize columns to use `title` instead of `header` if needed
    const normalizedColumns = useMemo(() => {
        // return columns.map((col) => ({
        //     ...col,
        //     title:
        //         'title' in col
        //             ? (col.title as string)
        //             : 'header' in col
        //               ? (col as { header: string }).header
        //               : '', // Fallback to `header` if `title` missing
        // }));
        return columns.map((col) => ({
            ...col,
            title: col.header, // <--- map header to title here
        }));
    }, [columns]);

    //console.debug('[GlideEditableTable] Normalized Columns:', normalizedColumns);

    const [localColumns, setLocalColumns] = useState(
        [...normalizedColumns].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    );

    const [localData, setLocalData] = useState<T[]>(() => [...data]);

    const [colSizes, setColSizes] = useState<Partial<Record<keyof T, number>>>({});

    const columnDefs: GridColumn[] = useMemo(
        () =>
            localColumns.map((col, idx) => ({
                title: col.title,
                width: colSizes[col.accessor] || col.width || 120,
                trailingRowOptions:
                    idx === 0
                        ? {
                              hint: 'Add row',
                              addIcon: 'plus',
                              targetColumn: 0,
                          }
                        : undefined,
            })),
        [localColumns, colSizes],
    );

    const sortedData = localData;

    // Debugs for tracing loading issues, ignore.
    // const instanceId = useMemo(() => Math.random().toString(36).slice(2), []);
    // console.debug(`[GlideEditableTable] MOUNT instance=${instanceId}`);
    /*
    useEffect(() => {
        console.debug(`[GlideEditableTable] PROPS for instance=${instanceId}:`, {
            dataLength: data.length,
            columnCount: columns.length,
            firstRow: data[0],
            columns,
        });
    }, [data, columns, instanceId]);

    useEffect(() => {
        console.debug('[GlideEditableTable] Props:', {
            dataLength: data?.length,
            columns,
            firstRow: data?.[0],
        });
    }, [data, columns]);

    useEffect(() => {
        console.debug('[Glide TABLE INIT] Local Columns:', localColumns);
    }, [localColumns]);
    */

    const handleColumnResize = useCallback(
        (col: GridColumn, newSize: number) => {
            setColSizes((prev) => {
                const updated = { ...prev };
                const target = localColumns.find((c) => c.title === col.title);
                if (target) {
                    updated[target.accessor] = newSize;
                }
                return updated;
            });

            setLocalColumns((prev) => {
                return prev.map((c) =>
                    c.title === col.title ? { ...c, width: newSize } : c,
                );
            });

            // Optional: persist to DB. Prob call in onSaveAll. Or just a new script to get block level metadata.
            const updated = localColumns.map((c) =>
                c.title === col.title ? { ...c, width: newSize } : c,
            );
            onColumnOrderChange?.(updated);
        },
        [localColumns, onColumnOrderChange],
    );

    const handleColumnMoved = useCallback(
        (startIndex: number, endIndex: number) => {
            setLocalColumns((prevCols) => {
                const updated = [...prevCols];
                const [moved] = updated.splice(startIndex, 1);
                updated.splice(endIndex, 0, moved);

                const reindexed = updated.map((col, i) => ({
                    ...col,
                    position: i,
                }));

                console.debug(
                    '[COLUMN ORDER CHANGED]:',
                    reindexed.map((c) => ({
                        accessor: c.accessor,
                        pos: c.position,
                    })),
                );

                onColumnOrderChange?.(reindexed); // <-- SAVE TO DB
                return reindexed;
            });
        },
        [onColumnOrderChange],
    );

    const getCellContent = useCallback(
        ([col, row]: Item): GridCell => {
            const rowData = sortedData[row];
            const accessor = localColumns[col].accessor;
            const value = rowData?.[accessor];

            return {
                kind: GridCellKind.Text,
                allowOverlay: true,
                data: value?.toString() ?? '',
                displayData: value?.toString() ?? '',
            };
        },
        [sortedData, localColumns],
    );

    const onCellEdited = useCallback(
        async (cell: Item, newValue: GridCell) => {
            const [col, row] = cell;
            if (newValue.kind !== GridCellKind.Text) return;

            const rowData = localData[row];
            const accessor = localColumns[col].accessor;
            const rowId = rowData.id;

            const newValueStr = newValue.data;
            const originalValue = rowData?.[accessor];

            if (originalValue?.toString() === newValueStr) return;

            console.debug('[onCellEdited] Detected change:', {
                rowId,
                accessor,
                oldValue: originalValue,
                newValue: newValueStr,
            });

            // Optimistically update local data
            setLocalData((prev) => {
                const updated = [...prev];
                updated[row] = {
                    ...updated[row],
                    [accessor]: newValueStr,
                };
                return updated;
            });

            // Update the editing buffer and log changes
            setEditingData((prev) => {
                const existing = prev[rowId] ?? {};
                const updatedRow = {
                    ...existing,
                    [accessor]: newValueStr,
                };
                const updatedEditingData = {
                    ...prev,
                    [rowId]: updatedRow,
                };

                console.debug('[onCellEdited] Updated editingData entry:', updatedRow);
                console.debug(
                    '[onCellEdited] Full editingData after change:',
                    updatedEditingData,
                );

                return updatedEditingData;
            });

            debouncedSave(); // Debounce save if set, else leave in buffer and handle on edit exit or manual save.

            lastEditedCellRef.current = cell;
        },
        [localData, localColumns, debouncedSave],
    );

    // Add a new row.
    const handleRowAppended = useCallback(() => {
        const maxPosition = Math.max(0, ...data.map((d) => d.position ?? 0));
        const newRow = {
            ...columns.reduce(
                (acc, col) => {
                    if (col.accessor !== 'id') acc[col.accessor as string] = '';
                    return acc;
                },
                {} as Record<string, unknown>,
            ),
            id: crypto.randomUUID(),
            position: maxPosition + 1,
        } as T;

        console.debug('[handleRowAppended] New row created:', newRow);
        setLocalData((prev) => [...prev, newRow]);
        onSave?.(newRow, true);
    }, [columns, data, onSave]);

    const handleRowMoved = useCallback((from: number, to: number) => {
        if (from === to) return;

        setLocalData((prev) => {
            const updated = [...prev];
            const [moved] = updated.splice(from, 1);
            updated.splice(to, 0, moved);
            return updated;
        });
    }, []);

    // Modify Trailing Row Visuals
    columns.map((col, idx) => ({
        title: col.header,
        width: colSizes[col.accessor] || col.width || 120,
        trailingRowOptions:
            idx === 0
                ? {
                      hint: 'Add row',
                      addIcon: true,
                      targetColumn: true,
                  }
                : undefined,
    }));

    // Called when edit mode is turned false. Curr salls HandleSaveAll ...
    useEffect(() => {
        const wasEditMode = prevEditModeRef.current;
        prevEditModeRef.current = isEditMode;
        if (wasEditMode && !isEditMode) {
            console.debug(
                '[GlideEditableTable] Edit mode exited. Checking for unsaved edits...',
            );

            const hasPendingEdits = Object.keys(editingDataRef.current).length > 0;

            if (hasPendingEdits) {
                console.debug(
                    '[GlideEditableTable] Flushing pending edits on edit mode exit...',
                );
                void handleSaveAll();
            } else {
                console.debug('[GlideEditableTable] No edits to save on exit.');
            }

            // const updates = localColumns.map((col, index) => ({
            //     propertyName: col.accessor as string, // accessor is the name of the property
            //     width: col.width,
            //     position: index,
            // }));

            // updateColumnsMetadata(blockId, updates)
            //     .then(() => {
            //         console.debug('[GlideEditableTable] Column changes saved to DB.');
            //     })
            //     .catch((err) => {
            //         console.error('[GlideEditableTable] Failed to save columns:', err);
            //     });
        }
    }, [isEditMode, localColumns, editingData, onSave, onPostSave, handleSaveAll]);

    // Save hotkey, temp fix for dev. 'Ctrl' + 's'
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const isMac =
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (navigator as any).userAgentData?.platform === 'macOS' ||
                navigator.userAgent.toLowerCase().includes('mac');
            const isSaveKey =
                (isMac && e.metaKey && e.key === 's') ||
                (!isMac && e.ctrlKey && e.key === 's');

            if (isSaveKey) {
                e.preventDefault(); // Prevent browser's save dialog
                console.debug(
                    '[GlideEditableTable] Ctrl+S detected. Saving pending changes...',
                );
                void handleSaveAll();
            }
        },
        [handleSaveAll],
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    if (isLoading) {
        return <TableLoadingSkeleton columns={columns.length} />;
    }

    return (
        <div className="w-full">
            {showFilter && (
                <TableControls
                    filterComponent={filterComponent}
                    showFilter={showFilter}
                    onNewRow={onAddRow || (() => {})}
                    onEnterEditMode={() => {}}
                    isVisible={true}
                    orgId=""
                    projectId=""
                    documentId=""
                />
            )}
            <div
                className="relative w-full overflow-x-auto brutalist-scrollbar"
                style={{ maxWidth: '100%' }}
                ref={tableRef}
                //onBlur={handleTableBlur}
                tabIndex={-1}
            >
                <div
                    style={{
                        minWidth: '100%',
                        maxWidth: '1000px',
                        width: 'max-content',
                    }}
                >
                    <div style={{ height: 500 }}>
                        <DataEditor
                            ref={gridRef}
                            columns={columnDefs}
                            getCellContent={getCellContent}
                            //onVisibleRegionChanged={onVisibleRegionChanged}
                            onCellEdited={isEditMode ? onCellEdited : undefined} // <- only attach handler in edit mode
                            rows={sortedData.length}
                            onColumnResize={handleColumnResize}
                            onColumnMoved={handleColumnMoved}
                            trailingRowOptions={{
                                tint: true,
                                sticky: true,
                            }}
                            onRowAppended={isEditMode ? handleRowAppended : undefined}
                            rowMarkers="both"
                            onRowMoved={handleRowMoved} // Enable row reordering
                        />
                    </div>
                </div>
            </div>
            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={(open) => setDeleteConfirmOpen?.(open)}
                onConfirm={onDeleteConfirm || (() => {})}
            />
        </div>
    );
}
