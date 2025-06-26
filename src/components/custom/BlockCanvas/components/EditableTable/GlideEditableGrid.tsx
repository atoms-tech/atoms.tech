'use client';

import React, { useMemo, useCallback, useRef } from 'react';
import DataEditor, {
    GridColumn,
    GridCellKind,
    Item,
    GridCell,
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';

import { CellValue } from './types';

interface GlideEditableGridProps<T extends { id: string }> {
    data: T[];
    columns: { accessor: keyof T; title: string; width?: number }[];
    onCellChange: (rowId: string, accessor: keyof T, value: CellValue) => void;
    onBlur?: () => void;
    isEditMode?: boolean;
    showFilter?: boolean;
    filterComponent?: React.ReactNode;
    onAddRow?: () => void;
    onSaveNewRow?: () => void;
    onCancelNewRow?: () => void;
    isAddingNew?: boolean;
}

export function GlideEditableGrid<T extends { id: string }>({
    data,
    columns,
    onCellChange,
    onBlur,
    isEditMode = false,
    showFilter = false,
    filterComponent,
    onAddRow,
    onSaveNewRow,
    onCancelNewRow,
    isAddingNew = false,
}: GlideEditableGridProps<T>) {
    const tableRef = useRef<HTMLDivElement>(null);

    const columnDefs: GridColumn[] = useMemo(
        () =>
            columns.map((col) => ({
                title: col.title,
                width: col.width || 120,
            })),
        [columns]
    );

    /* const getCellContent = useCallback(
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
        [columns, data]
    ); */

    const getCellContent = useMemo(() => {
    return ([col, row]: Item): GridCell => {
        const rowData = data[row];
        const accessor = columns[col].accessor;
        const value = rowData[accessor];

        return {
            kind: GridCellKind.Text,
            allowOverlay: true,
            data: value?.toString() || '',
            displayData: value?.toString() || '',
        };
    };
    }, [columns, data]);

    const onCellEdited = useCallback(
        (cell: Item, newValue: GridCell) => {
            const [col, row] = cell;
            if (newValue.kind !== GridCellKind.Text) return;

            const rowData = data[row];
            const rowId = rowData.id;
            const accessor = columns[col].accessor;

            onCellChange(rowId, accessor, newValue.data);
        },
        [columns, data, onCellChange]
    );

    return (
        <div className="w-full">
            {showFilter && (
                <div className="mb-2">{filterComponent}</div>
            )}
            <div
                className="relative w-full overflow-x-auto brutalist-scrollbar"
                style={{ maxWidth: '100%' }}
                ref={tableRef}
                onBlur={onBlur}
                tabIndex={-1}
            >
                <div style={{ minWidth: '100%', maxWidth: '1000px', width: 'max-content' }}>
                    <div style={{ height: 500 }}>
                        <DataEditor
                            columns={columnDefs}
                            getCellContent={getCellContent}
                            onCellEdited={onCellEdited}
                            rows={data.length}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

