'use client';

import DataEditor, {
    GridCell,
    GridCellKind,
    GridColumn,
    GridDragEventArgs,
    Item,
} from '@glideapps/glide-data-grid';
import React, { useCallback, useMemo, useRef } from 'react';

import '@glideapps/glide-data-grid/dist/index.css';

import { DeleteConfirmDialog, TableControls } from './components';

//import { CellValue } from './types';

interface GlideEditableTableProps<T extends { id: string }> {
    data: T[];
    columns: { accessor: keyof T; title: string; width?: number }[];
    //onCellChange: (rowId: string, accessor: keyof T, value: CellValue) => void;
    onBlur?: () => void;
    isEditMode?: boolean;
    showFilter?: boolean;
    filterComponent?: React.ReactNode;
    onSave?: (item: Partial<T>, isNew: boolean) => Promise<void>;
    onPostSave?: () => Promise<void>;
    onDelete?: (item: T) => Promise<void>;
    onAddRow?: () => void;
    onSaveNewRow?: () => void;
    onCancelNewRow?: () => void;
    isAddingNew?: boolean;
    deleteConfirmOpen?: boolean;
    onDeleteConfirm?: () => void;
    setDeleteConfirmOpen?: (open: boolean) => void;
    onDragStart?: (args: GridDragEventArgs) => void;
    onDragOverCell?: (cell: Item, dataTransfer: DataTransfer | null) => void;
    onDrop?: (cell: Item, dataTransfer: DataTransfer | null) => void;
}

export function GlideEditableTable<T extends { id: string }>({
    data,
    columns,
    //onCellChange,
    onSave,
    onBlur,
    isEditMode = true,
    showFilter = false,
    filterComponent,
    onAddRow,
    //onSaveNewRow,
    //onCancelNewRow,
    //isAddingNew = false,
    deleteConfirmOpen = false,
    onDeleteConfirm,
    setDeleteConfirmOpen,
}: GlideEditableTableProps<T>) {
    const tableRef = useRef<HTMLDivElement>(null);

    const columnDefs: GridColumn[] = useMemo(
        () =>
            columns.map((col) => ({
                title: col.title,
                width: col.width || 120,
            })),
        [columns],
    );

    const getCellContent = useCallback(
        ([col, row]: Item): GridCell => {
            const rowData = data[row];
            const accessor = columns[col].accessor;
            const value = rowData[accessor];

            return {
                kind: GridCellKind.Text,
                allowOverlay: true,
                data: value?.toString() || '',
                displayData: value?.toString() || '',
            };
        },
        [columns, data],
    );

    const onCellEdited = useCallback(
        (cell: Item, newValue: GridCell) => {
            const [col, row] = cell;
            if (newValue.kind !== GridCellKind.Text) return;

            const rowData = data[row];
            //const rowId = rowData.id;
            const accessor = columns[col].accessor;

            const updatedRow = {
                ...rowData,
                [accessor]: newValue.data,
            };

            // Send update
            onSave?.(updatedRow, false);
        },
        [columns, data, onSave],
    );

    // const savePendingChanges = useCallback(async () => {
    // if (!onSave || !data) return;

    //     try {
    //         const modifiedItems = Object.entries(editingData || {}).filter(([id, item]) => {
    //             if (id === 'new') return false;
    //             const original = data.find(d => d.id === id);
    //             if (!original) return false;
    //             return Object.keys(item).some(k => item[k] !== original[k]);
    //         });

    //         if (modifiedItems.length === 0) return;

    //         for (const [_id, item] of modifiedItems) {
    //             await onSave(item, false);
    //         }

    //         if (onPostSave) await onPostSave();
    //     } catch (error) {
    //         console.error('Failed to save pending changes:', error);
    //     }
    // }, [onSave, data, editingData, onPostSave]);

    // const handleTableBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    //     if (isEditMode && tableRef.current && !tableRef.current.contains(e.relatedTarget as Node)) {
    //         console.log('Focus left the table — auto-saving...');
    //         savePendingChanges();
    //     }
    // }, [isEditMode, savePendingChanges]);

    const handleDragStart = useCallback((args: GridDragEventArgs) => {
        console.log('Drag started:', args);
        // You could set some dragging state here if needed
    }, []);

    // const handleDragOverCell = useCallback(
    //     (cell: Item, dataTransfer: DataTransfer | null) => {
    //         console.log('Drag over cell:', cell);
    //         // You can check or update UI
    //     },
    //     [],
    // );

    // const handleDrop = useCallback(
    //     (cell: Item, dataTransfer: DataTransfer | null) => {
    //         console.log('Dropped on cell:', cell);
    //         // Handle drop logic here
    //     },
    //     [],
    // );

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
                onBlur={onBlur}
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
                            columns={columnDefs}
                            getCellContent={getCellContent}
                            onCellEdited={isEditMode ? onCellEdited : undefined} // ← only attach handler in edit mode
                            rows={data.length}
                            isDraggable="cell" //Use header for only column changes
                            onDragStart={handleDragStart}
                            //onDragOverCell={handleDragOverCell}
                            //onDrop={handleDrop}
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
