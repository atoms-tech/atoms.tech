'use client';

// We still need to validate role perms so readers canot exit, ect.
import '@/styles/globals.css';

import DataEditor, {
    DataEditorRef,
    GridCell,
    GridCellKind,
    GridColumn,
    //GridDragEventArgs,
    Item,
    Rectangle,
} from '@glideapps/glide-data-grid';
import { useTheme } from 'next-themes';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { glideDarkTheme } from './glideDarkTheme';
import { glideLightTheme } from './glideLightTheme';

import '@glideapps/glide-data-grid/dist/index.css';

import debounce from 'lodash/debounce';
import { useParams } from 'next/navigation';
import { useLayer } from 'react-laag';

import {
    BlockTableMetadata,
    useBlockMetadataActions,
} from '@/components/custom/BlockCanvas/hooks/useBlockMetadataActions';
import { useUser } from '@/lib/providers/user.provider';

import { DeleteConfirmDialog, TableControls, TableLoadingSkeleton } from './components';
import { /*CellValue,*/ GlideTableProps } from './types';

export function GlideEditableTable<
    T extends { id: string; position?: number; height?: number },
>(props: GlideTableProps<T>) {
    const { resolvedTheme } = useTheme();

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
        //deleteConfirmOpen = false,
        //onDeleteConfirm,
        //onDeleteColumn,
        //setDeleteConfirmOpen,
        isLoading = false,
        blockId,
        //tableMetadata, // Unneeded: metadata is being used in parent to pass in settings, and saving uses local array to track.
    } = props;

    const tableRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<DataEditorRef | null>(null);
    const lastEditedCellRef = useRef<Item | undefined>(undefined);
    const prevEditModeRef = useRef<boolean>(isEditMode);
    const isSavingRef = useRef(false);

    // Get user site profile info for saves.
    const { profile } = useUser();
    const userId = profile?.id;
    const userName = profile?.full_name || '';

    const { updateBlockMetadata } = useBlockMetadataActions();
    const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // useEffect(() => {
    //     console.debug('[GlideEditableTable] Received tableMetadata:', tableMetadata);
    // }, [tableMetadata]);

    const [editingData, setEditingData] = useState<Record<string, Partial<T>>>({});
    // Ref to refresh editing data when autosave evaluated.
    const editingDataRef = useRef(editingData);
    useEffect(() => {
        editingDataRef.current = editingData;
    }, [editingData]);

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

    // Debounce saves, should be abstracted to table props and switched off when realtime collaboration enabled.
    const useDebouncedSave = (delay = 5000) => {
        const debounced = useRef(
            debounce(() => {
                void handleSaveAllRef.current?.();
                void saveTableMetadataRef.current?.();
            }, delay),
        );

        useEffect(() => {
            const d = debounced.current;
            return () => d.cancel(); // cleanup on unmount
        }, []);

        return debounced.current;
    };

    const debouncedSave = useDebouncedSave();

    const [_tableWidth, setTableWidth] = useState<number>(0);

    useEffect(() => {
        const handleResize = () => {
            if (tableRef.current) {
                setTableWidth(tableRef.current.offsetWidth);
            }
        };

        handleResize(); // Run immediately on mount
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const params = useParams();
    const orgId = params?.orgId || '';
    const projectId = params?.projectId || ''; // Ensure projectId is extracted correctly
    const documentId = params?.documentId || '';

    if (!orgId) {
        console.error('Project ID is missing from the URL.');
    }

    if (!projectId) {
        console.error('Project ID is missing from the URL.');
    }

    if (!documentId) {
        console.error('Project ID is missing from the URL.');
    }

    // Normalize columns to use `title` instead of `header` if needed
    const normalizedColumns = useMemo(() => {
        return columns.map((col) => ({
            ...col,
            title: col.header, // map header to title
        }));
    }, [columns]);

    //console.debug('[GlideEditableTable] Normalized Columns:', normalizedColumns);

    const [localColumns, setLocalColumns] = useState(
        [...normalizedColumns].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    );
    const localColumnsRef = useRef(localColumns);
    useEffect(() => {
        localColumnsRef.current = localColumns;
    }, [localColumns]);

    const [localData, setLocalData] = useState<T[]>(() => [...data]);

    const [colSizes, setColSizes] = useState<Partial<Record<keyof T, number>>>({});

    // Build column definitions using user-defined column sizes (if available)
    const columnDefs: GridColumn[] = useMemo(
        () =>
            localColumns.map((col, idx) => ({
                title: col.title,
                width: colSizes[col.accessor] || col.width || 120,
                hasMenu: true,
                menuIcon: 'dots',
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

    // Sort localData by metadata position key.
    const sortedData = useMemo(() => {
        return [...localData].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }, [localData]);

    const [columnMenu, setColumnMenu] = useState<
        | {
              colIndex: number;
              bounds: Rectangle;
          }
        | undefined
    >(undefined);

    const { renderLayer, layerProps } = useLayer({
        isOpen: columnMenu !== undefined,
        auto: true,
        placement: 'bottom-end',
        triggerOffset: 2,

        trigger: {
            getBounds: () => ({
                left: columnMenu?.bounds.x ?? 0,
                top: columnMenu?.bounds.y ?? 0,
                width: columnMenu?.bounds.width ?? 0,
                height: columnMenu?.bounds.height ?? 0,
                right: (columnMenu?.bounds.x ?? 0) + (columnMenu?.bounds.width ?? 0),
                bottom: (columnMenu?.bounds.y ?? 0) + (columnMenu?.bounds.height ?? 0),
            }),
        },

        onOutsideClick: () => setColumnMenu(undefined),
    });

    useEffect(() => {
        console.debug('[GlideEditableTable] Sorted Data:', sortedData);
    }, [sortedData]);

    // Needs to be validated, I dont think change checks properly catch changed.
    // So may be called more often then needed. Harmless but wastefull and may cause issues with concurrent editing.
    const saveTableMetadata = useCallback(async () => {
        if (!blockId) return;

        const latestLocalColumns = localColumnsRef.current;
        const latestSortedData = sortedData; // Already sorted by position

        const columnMetadata = latestLocalColumns.map((col, idx) => ({
            columnId: col.id,
            position: idx,
            ...(col.width !== undefined ? { width: col.width } : {}),
        }));

        const rowMetadata = latestSortedData.map((row, idx) => ({
            requirementId: row.id,
            position: idx,
            ...(row.height !== undefined ? { height: row.height } : {}),
        }));

        const originalColumnState = columns
            .map((col) => ({
                id: col.id,
                position: col.position ?? 0,
                width: col.width ?? undefined,
            }))
            .sort((a, b) => a.position - b.position);

        const currentColumnState = columnMetadata
            .map(({ columnId, position, width }) => ({
                id: columnId,
                position,
                width,
            }))
            .sort((a, b) => a.position - b.position);

        const isColumnMetadataChanged =
            originalColumnState.length !== currentColumnState.length ||
            originalColumnState.some((col, idx) => {
                const curr = currentColumnState[idx];
                return (
                    col.id !== curr.id ||
                    col.position !== curr.position ||
                    (col.width ?? null) !== (curr.width ?? null)
                );
            });

        // Always assume row position/height may change
        const hasRowChanges = true;

        if (!isColumnMetadataChanged && !hasRowChanges) {
            console.debug(
                '[GlideEditableTable] No metadata changes detected. Skipping save.',
            );
            return;
        }

        try {
            const metadataToSave: Partial<BlockTableMetadata> = {
                columns: columnMetadata,
                requirements: rowMetadata,
            };

            await updateBlockMetadata(blockId, metadataToSave);
            console.debug(
                '[GlideEditableTable] Saved combined row + column metadata:',
                metadataToSave,
            );
        } catch (err) {
            console.error(
                '[GlideEditableTable] Failed to save combined table metadata:',
                err,
            );
        }
    }, [blockId, columns, sortedData, updateBlockMetadata]);

    // References to latest version of save methods. Fixes stale reference when editing data on a newly added column.
    const handleSaveAllRef = useRef(handleSaveAll);
    useEffect(() => {
        handleSaveAllRef.current = handleSaveAll;
    }, [handleSaveAll]);

    const saveTableMetadataRef = useRef(saveTableMetadata);
    useEffect(() => {
        saveTableMetadataRef.current = saveTableMetadata;
    }, [saveTableMetadata]);

    // Sync db row changes with existing pending changes for local data.
    useEffect(() => {
        // 1. Build a map of pending edits
        const pendingEdits = editingDataRef.current;

        // 2. Detect any differences between new props.data and current localData + pendingEdits
        const mergedData = data.map((incomingRow) => {
            const pending = pendingEdits[incomingRow.id];
            return pending ? { ...incomingRow, ...pending } : incomingRow;
        });

        // 3. Compare mergedData with current localData
        //const isSameLength = mergedData.length === localData.length;
        const localIds = localData.map((r) => r.id);
        const mergedIds = mergedData.map((r) => r.id);

        // Check if the sets of IDs are equal (regardless of order)
        const localIdSet = new Set(localIds);
        const mergedIdSet = new Set(mergedIds);

        const sameIdSet =
            localIdSet.size === mergedIdSet.size &&
            [...localIdSet].every((id) => mergedIdSet.has(id));

        // Only consider content mismatch if sets are different or content differs.
        const contentMismatch =
            !sameIdSet ||
            mergedData.some((row) => {
                const localRow = localData.find((r) => r.id === row.id);
                if (!localRow) return true;

                for (const key of Object.keys(row)) {
                    if (key === 'position' || key === 'height') continue;
                    if (localRow[key as keyof T] !== row[key as keyof T]) return true;
                }
                return false;
            });

        if (contentMismatch) {
            console.debug(
                '[GlideEditableTable] External data change detected (excluding local row reorders). Syncing...',
            );
            setLocalData(mergedData);
        }
        // else {
        //     console.debug('[GlideEditableTable] No external row data changes detected.');
        // }
    }, [data, localData]);

    // Watch for changes in columns from db
    useEffect(() => {
        const normalized = columns.map((col) => ({
            ...col,
            title: col.header,
        }));
        const sortedNormalized = [...normalized].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0),
        );

        const localAccessors = new Set(localColumns.map((c) => c.accessor));
        const normalizedAccessors = new Set(sortedNormalized.map((c) => c.accessor));

        const columnsAdded = [...normalizedAccessors].filter(
            (a) => !localAccessors.has(a),
        );
        const columnsRemoved = [...localAccessors].filter(
            (a) => !normalizedAccessors.has(a),
        );

        if (columnsAdded.length || columnsRemoved.length) {
            //console.debug('[GlideEditableTable] Detected column count change. Updating localColumns...');

            // Merge new columns at end, preserving existing column order and metadata
            const merged = [...localColumns];

            for (const added of columnsAdded) {
                const newCol = sortedNormalized.find((c) => c.accessor === added);
                if (newCol) merged.push(newCol);
            }

            // Filter out removed columns
            const filtered = merged.filter((col) =>
                normalizedAccessors.has(col.accessor),
            );

            setLocalColumns(filtered);
        }
    }, [columns, localColumns]);

    // Debugs for tracing loading issues, ignore.
    // const instanceId = useMemo(() => Math.random().toString(36).slice(2), []);
    // console.debug(`[GlideEditableTable] MOUNT instance=${instanceId}`);
    // console.debug('[GlideEditableTable] Local Columns:', localColumns);
    // useEffect(() => {
    //     console.debug(`[GlideEditableTable] PROPS for instance=${instanceId}:`, {
    //         dataLength: data.length,
    //         columnCount: columns.length,
    //         firstRow: data[0],
    //         columns,
    //     });
    // }, [data, columns, instanceId]);

    // useEffect(() => {
    //     console.debug('[GlideEditableTable] Props:', {
    //         dataLength: data?.length,
    //         columns,
    //         firstRow: data?.[0],
    //     });
    // }, [data, columns]);

    // useEffect(() => {
    //     console.debug('[Glide TABLE INIT] Local Columns:', localColumns);
    // }, [localColumns]);

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
                const updated = prev.map((c) =>
                    c.title === col.title ? { ...c, width: newSize } : c,
                );

                debouncedSave(); // Call debounced save with newly updated columns.
                return updated;
            });
        },
        [debouncedSave, localColumns],
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

                return reindexed;
            });

            debouncedSave(); // Trigger debounced save on column metadata change
        },
        [debouncedSave],
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

            // console.debug('[onCellEdited] Detected change:', {
            //     rowId,
            //     accessor,
            //     oldValue: originalValue,
            //     newValue: newValueStr,
            // });

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

                // console.debug('[onCellEdited] Updated editingData entry:', updatedRow);
                // console.debug(
                //     '[onCellEdited] Full editingData after change:',
                //     updatedEditingData,
                // );

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

        //console.debug('[handleRowAppended] New row created:', newRow);
        setLocalData((prev) => [...prev, newRow]);
        onSave?.(newRow, true);
    }, [columns, data, onSave]);

    const handleRowMoved = useCallback(
        (from: number, to: number) => {
            if (from === to) return;

            setLocalData((prev) => {
                const updated = [...prev];
                const [moved] = updated.splice(from, 1);
                updated.splice(to, 0, moved);

                const reindexed = updated.map((row, index) => ({
                    ...row,
                    position: index,
                }));

                debouncedSave(); // Call debounced save with newly updated columns.

                return reindexed;
            });
        },
        [debouncedSave],
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleRowResize = useCallback(
        (rowIndex: number, newSize: number) => {
            const rowId = sortedData[rowIndex]?.id;
            if (!rowId) return;

            setLocalData((prev) => {
                const updated = prev.map((row) =>
                    row.id === rowId ? { ...row, height: newSize } : row,
                );
                debouncedSave(); // Call debounced save with newly updated columns.
                return updated;
            });
        },
        [debouncedSave, sortedData],
    );

    const handleColumnDeleteConfirm = useCallback(async () => {
        if (!columnToDelete) return;

        try {
            await props.onDeleteColumn?.(columnToDelete);

            // Compute updated local columns *before* triggering state update
            const newLocalColumns = localColumnsRef.current.filter(
                (col) => col.id !== columnToDelete,
            );

            // Update ref and state, then call metadata update.
            localColumnsRef.current = newLocalColumns;
            setLocalColumns(newLocalColumns);

            saveTableMetadata();
        } catch (err) {
            console.error('[GlideEditableTable] Failed to delete column:', err);
            return;
        }
        // Cleanup state on success.
        setColumnToDelete(null);
        setDeleteConfirmOpen(false);
    }, [columnToDelete, props, saveTableMetadata]);

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

            void saveTableMetadata();
        }
    }, [
        isEditMode,
        localColumns,
        editingData,
        onSave,
        onPostSave,
        handleSaveAll,
        saveTableMetadata,
    ]);

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
                void saveTableMetadata();
            }
        },
        [handleSaveAll, saveTableMetadata],
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

    function insertColumnAt(colIndex: number) {
        console.log('Function not implemented, but got index: ', colIndex);
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
                className="w-full"
                ref={tableRef}
                tabIndex={-1}
                style={{
                    overflowX: 'hidden',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{ width: '100%' }}>
                    <div style={{ height: 500 }}>
                        <DataEditor
                            ref={gridRef}
                            columns={columnDefs}
                            getCellContent={getCellContent}
                            onCellEdited={isEditMode ? onCellEdited : undefined}
                            rows={sortedData.length}
                            rowHeight={(row) => sortedData[row]?.height ?? 43}
                            onColumnResize={handleColumnResize}
                            onColumnMoved={handleColumnMoved}
                            trailingRowOptions={{
                                tint: true,
                                sticky: true,
                            }}
                            onRowAppended={isEditMode ? handleRowAppended : undefined}
                            rowMarkers="both"
                            onRowMoved={handleRowMoved}
                            theme={
                                resolvedTheme === 'dark'
                                    ? glideDarkTheme
                                    : glideLightTheme
                            }
                            //onRowResize={handleRowResize}
                            onHeaderMenuClick={(col, bounds) => {
                                setColumnMenu({ colIndex: col, bounds: bounds });
                            }}
                        />
                        {columnMenu &&
                            renderLayer(
                                <div
                                    {...layerProps}
                                    style={{
                                        ...layerProps.style,
                                        background: 'white',
                                        border: '1px solid #ccc',
                                        borderRadius: 4,
                                        boxShadow: '0px 2px 6px rgba(0,0,0,0.15)',
                                        padding: 8,
                                        zIndex: 1000,
                                    }}
                                >
                                    <div
                                        onClick={() => {
                                            insertColumnAt(columnMenu.colIndex);
                                            setColumnMenu(undefined);
                                        }}
                                        style={{
                                            padding: '6px 10px',
                                            cursor: 'pointer',
                                            color: 'black',
                                        }}
                                    >
                                        + Add column left
                                    </div>
                                    <div
                                        onClick={() => {
                                            insertColumnAt(columnMenu.colIndex + 1);
                                            setColumnMenu(undefined);
                                        }}
                                        style={{
                                            padding: '6px 10px',
                                            cursor: 'pointer',
                                            color: 'black',
                                        }}
                                    >
                                        + Add column right
                                    </div>
                                    <div
                                        onClick={() => {
                                            // Abstract to a handle method after testing
                                            const colId =
                                                localColumns[columnMenu.colIndex]?.id;
                                            if (colId) {
                                                console.log(
                                                    'Column ID to delete:',
                                                    colId,
                                                );
                                                setColumnToDelete(colId);
                                                setDeleteConfirmOpen?.(true);

                                                // Delay closing the menu slightly to ensure dialog opens cleanly
                                                setTimeout(() => {
                                                    setColumnMenu(undefined);
                                                }, 0);
                                            } else {
                                                setColumnMenu(undefined);
                                            }
                                        }}
                                        style={{
                                            padding: '6px 10px',
                                            cursor: 'pointer',
                                            color: 'red',
                                        }}
                                    >
                                        X Delete Column
                                    </div>
                                    <div
                                        onClick={() => {
                                            setColumnMenu(undefined);
                                        }}
                                        style={{
                                            padding: '6px 10px',
                                            cursor: 'pointer',
                                            color: 'black',
                                        }}
                                    >
                                        x Close Menu
                                    </div>
                                </div>,
                            )}
                    </div>
                </div>
                <DeleteConfirmDialog
                    open={deleteConfirmOpen}
                    onOpenChange={(open) => setDeleteConfirmOpen?.(open)}
                    onConfirm={handleColumnDeleteConfirm}
                />
            </div>
        </div>
    );
}
