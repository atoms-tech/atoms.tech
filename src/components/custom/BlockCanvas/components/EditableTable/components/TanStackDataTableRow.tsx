import { Cell, Row } from '@tanstack/react-table';
import * as React from 'react';
import { memo } from 'react';

import { TanStackCellRenderer } from '@/components/custom/BlockCanvas/components/EditableTable/TanStackCellRenderer';
import { CellValue } from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { cn } from '@/lib/utils';

interface TanStackDataTableRowProps<
    T extends Record<string, CellValue> & { id: string },
> {
    row: Row<T>;
    isEditMode: boolean;
    selectedCell: { rowIndex: number; columnId: string } | null;
    onCellChange?: (
        itemId: string,
        accessor: keyof T,
        newValue: CellValue,
    ) => void;
    onCellBlur?: () => void;
    onCellSelect?: (rowIndex: number, columnId: string) => void;
}

// Individual memo-wrapped cell component
function CellComponent<T extends Record<string, CellValue> & { id: string }>({
    cell,
    isEditMode,
    isSelected,
    onCellChange,
    onCellBlur,
    onCellSelect,
    rowIndex,
}: {
    cell: Cell<T, unknown>;
    isEditMode: boolean;
    isSelected: boolean;
    onCellChange?: (
        itemId: string,
        accessor: keyof T,
        newValue: CellValue,
    ) => void;
    onCellBlur?: () => void;
    onCellSelect?: (rowIndex: number, columnId: string) => void;
    rowIndex: number;
}) {
    // Extract value from cell
    const value = cell.getValue() as CellValue;

    return (
        <td
            className={cn(
                'p-0 relative',
                isEditMode &&
                    isSelected &&
                    'before:absolute before:inset-0 before:border-2 before:border-blue-500 before:pointer-events-none',
            )}
        >
            <div
                className="relative w-full h-full min-h-[32px]"
                onClick={(e) => {
                    if (!isEditMode) return;
                    e.stopPropagation();
                    onCellSelect?.(rowIndex, cell.column.id);
                }}
            >
                <TanStackCellRenderer
                    cell={cell}
                    isEditing={isEditMode}
                    isSelected={isSelected}
                    value={value}
                    onSave={(newValue) => {
                        onCellChange?.(
                            cell.row.original.id,
                            cell.column.id as keyof T,
                            newValue,
                        );
                    }}
                    onBlur={onCellBlur}
                />
            </div>
        </td>
    );
}

// Use type assertion with memo to maintain proper typing
const MemoizedCell = memo(CellComponent) as typeof CellComponent;

function TanStackDataTableRowComponent<
    T extends Record<string, CellValue> & { id: string },
>({
    row,
    isEditMode,
    selectedCell,
    onCellChange,
    onCellBlur,
    onCellSelect,
}: TanStackDataTableRowProps<T>) {
    return (
        <tr
            className={cn(
                'font-mono hover:bg-muted/50',
                !isEditMode && 'cursor-pointer',
            )}
        >
            {row.getVisibleCells().map((cell) => (
                <MemoizedCell
                    key={cell.id}
                    cell={cell}
                    isEditMode={isEditMode}
                    isSelected={
                        selectedCell?.rowIndex === row.index &&
                        selectedCell?.columnId === cell.column.id
                    }
                    onCellChange={onCellChange}
                    onCellBlur={onCellBlur}
                    onCellSelect={onCellSelect}
                    rowIndex={row.index}
                />
            ))}
        </tr>
    );
}

// Use a more lenient comparison function that allows for cell editing
const arePropsEqual = <T extends Record<string, CellValue> & { id: string }>(
    prevProps: TanStackDataTableRowProps<T>,
    nextProps: TanStackDataTableRowProps<T>,
): boolean => {
    // Always re-render if editing mode changes
    if (prevProps.isEditMode !== nextProps.isEditMode) {
        return false;
    }

    // Always re-render if selected cell changes for this row
    if (
        (prevProps.selectedCell?.rowIndex === nextProps.row.index) !==
        (nextProps.selectedCell?.rowIndex === nextProps.row.index)
    ) {
        return false;
    }

    // If we're in edit mode, be more cautious about memoization
    if (nextProps.isEditMode) {
        // Re-render if row ID changes or callbacks change
        return (
            prevProps.row.id === nextProps.row.id &&
            prevProps.onCellChange === nextProps.onCellChange &&
            prevProps.onCellBlur === nextProps.onCellBlur &&
            prevProps.onCellSelect === nextProps.onCellSelect
        );
    }

    // For non-edit mode, we can be more aggressive with memoization
    return prevProps.row.id === nextProps.row.id;
};

// Export memoized component with the improved comparison function
export const TanStackDataTableRow = memo(
    TanStackDataTableRowComponent,
    arePropsEqual,
) as typeof TanStackDataTableRowComponent;
