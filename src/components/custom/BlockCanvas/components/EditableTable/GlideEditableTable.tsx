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

import { DeleteConfirmDialog, TableControls, TableLoadingSkeleton } from './components';
//import { useColumnActions } from '@/components/custom/BlockCanvas/hooks/useColumnActions';

import { /*CellValue, EditableTableProps,*/ GlideTableProps } from './types';

// interface GlideEditableTableProps<T extends { id: string; position?: number }> {
//     data: T[];
//     columns: {
//         accessor: keyof T;
//         title: string;
//         width?: number;
//         position?: number;
//     }[];
//     //onCellChange: (rowId: string, accessor: keyof T, value: CellValue) => void;
//     onBlur?: () => void;
//     isEditMode?: boolean;
//     showFilter?: boolean;
//     filterComponent?: React.ReactNode;
//     onSave?: (item: Partial<T>, isNew: boolean) => Promise<void>;
//     onPostSave?: () => Promise<void>;
//     onDelete?: (item: T) => Promise<void>;
//     onAddRow?: () => void;
//     onSaveNewRow?: () => void;
//     onCancelNewRow?: () => void;
//     isLoading?: boolean;
//     isAddingNew?: boolean;
//     deleteConfirmOpen?: boolean;
//     onDeleteConfirm?: () => void;
//     setDeleteConfirmOpen?: (open: boolean) => void;
//     onDragStart?: (args: GridDragEventArgs) => void;
//     onDragOverCell?: (cell: Item, dataTransfer: DataTransfer | null) => void;
//     onDrop?: (cell: Item, dataTransfer: DataTransfer | null) => void;
//     onColumnOrderChange?: (
//         columns: {
//             accessor: keyof T;
//             title: string;
//             width?: number;
//             position?: number;
//         }[],
//     ) => void;
// }

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
    const prevIsEditModeRef = useRef<boolean>(false);

    //const [focusedCell, setFocusedCell] = useState<Item | undefined>();

    // const onVisibleRegionChanged = useCallback((
    //     range: Rectangle,
    //     tx: number,
    //     ty: number,
    //     extras: { selected?: Item; freezeRegion?: Rectangle }
    //     ) => {
    //     if (extras.selected) {
    //         setFocusedCell(extras.selected);
    //     } else {
    //         setFocusedCell(undefined);
    //     }
    // }, []);

    // Import to reorder columns. Properties not used for Metadata method. Need to change to block level json later.
    // const { updateColumnsMetadata } = useColumnActions({
    //     orgId: '',
    //     projectId: '',
    //     documentId: '',
    // });

    // useEffect(() => {
    //     console.debug('[GlideEditableTable] useEffect blockId check:', blockId);
    // }, [blockId]);

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

    console.debug('[GlideEditableTable] Normalized Columns:', normalizedColumns);

    const [localColumns, setLocalColumns] = useState(
        [...normalizedColumns].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    );

    const [localData, setLocalData] = useState<T[]>(() => [...data]);

    const [colSizes, setColSizes] = useState<Partial<Record<keyof T, number>>>({});

    const instanceId = useMemo(() => Math.random().toString(36).slice(2), []);
    console.debug(`[GlideEditableTable] MOUNT instance=${instanceId}`);

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

    //const [editingData, setEditingData] = useState<Record<string, Partial<T>>>({});
    //const [isEditingCell, setIsEditingCell] = useState(false);

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

    // const sortedData = useMemo(() => {
    //     const sorted = [...data].sort(
    //         (a, b) => (a.position ?? 0) - (b.position ?? 0),
    //     );
    //     console.debug(
    //         `[GlideEditableTable] Sorted Data for instance=${instanceId}:`,
    //         sorted,
    //     );

    //     console.debug('[TABLE INIT] Sorted Data:', sorted);
    //     sorted.forEach((row, index) => {
    //         console.debug(
    //             `[ROW ${index}] id=${row.id} position=${row.position}`,
    //         );
    //         if ('properties' in row && typeof row.properties === 'object') {
    //             console.debug(`[ROW ${index}] properties:`, row.properties);
    //         }
    //     });

    //     return sorted;
    // }, [data, instanceId]);
    const sortedData = localData;

    useEffect(() => {
        console.debug('[Glide TABLE INIT] Local Columns:', localColumns);
    }, [localColumns]);

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

            // Optional: persist to DB
            const updated = localColumns.map((c) =>
                c.title === col.title ? { ...c, width: newSize } : c,
            );
            onColumnOrderChange?.(updated); // You could rename this to `onColumnsChanged` or similar
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

            const updatedRow = {
                ...rowData,
                [accessor]: newValueStr,
            };

            console.debug('[onCellEdited] Changed cell:', {
                rowId,
                accessor,
                oldValue: originalValue,
                newValue: newValueStr,
            });

            lastEditedCellRef.current = cell;

            await onSave?.(updatedRow, false);
            await onPostSave?.();

            // Refocus after the render
            requestAnimationFrame(() => {
                const editor = gridRef.current;
                if (editor && lastEditedCellRef.current) {
                    console.debug('[Refocusing Cell]', lastEditedCellRef.current);
                    if (editor && lastEditedCellRef.current) {
                        const [col, row] = lastEditedCellRef.current;
                        editor.scrollTo(col, row);
                    }
                }
            });
        },
        [localData, localColumns, onSave, onPostSave],
    );

    // const savePendingChanges = useCallback(async () => {
    //     if (!onSave || Object.keys(editingData).length === 0) return;

    //     try {
    //         for (const [rowId, changes] of Object.entries(editingData)) {
    //             const changedFields = Object.entries(changes).reduce(
    //                 (acc, [key, value]) => {
    //                     // Only include fields that are actually changed and not undefined
    //                     if (value !== undefined) acc[key as keyof T] = value;
    //                     return acc;
    //                 },
    //                 { id: rowId } as Partial<T>,
    //             );

    //             console.debug(`[savePendingChanges] Saving ONLY changed fields:`, changedFields);
    //             await onSave(changedFields, false);
    //         }
    //         setEditingData({});
    //         await onPostSave?.();
    //     } catch (error) {
    //         console.error('[savePendingChanges] Failed to save:', error);
    //     }
    // }, [editingData, onSave, onPostSave]);

    // const handleEditorClose = useCallback(async () => {
    //     if (!isEditingCell) return;
    //     setIsEditingCell(false);
    //     await savePendingChanges();
    // }, [isEditingCell, savePendingChanges]);

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

    // Called when edit mode is turned off. Curr used for batch updating col metadata (width and pos).
    useEffect(() => {
        if (prevIsEditModeRef.current === true && isEditMode === false) {
            console.debug(
                '[GlideEditableTable] Edit mode exited. Saving column changes...',
            );

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

            // Update the ref for next render
            prevIsEditModeRef.current = isEditMode;
        }
    }, [isEditMode, localColumns]);

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
                            // onKeyDown={(e) => {
                            //     if (!isEditMode) return;
                            //     if (e.key === 'Enter' || e.key === 'Tab') { // Keys that trigger saving (buffer locally, save later).
                            //         handleEditorClose();
                            //     }
                            // }}
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
