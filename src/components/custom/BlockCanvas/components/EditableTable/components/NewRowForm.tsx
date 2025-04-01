import { Check, X } from 'lucide-react';

import { CellRenderer } from '@/components/custom/BlockCanvas/components/EditableTable/CellRenderer';
import {
    CellValue,
    EditableColumn,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';

interface NewRowFormProps<T> {
    columns: EditableColumn<T>[];
    editingData: Record<string, T>;
    onCellChange: (itemId: string, accessor: keyof T, value: CellValue) => void;
    onSave: () => void;
    onCancel: () => void;
}

export function NewRowForm<
    T extends Record<string, CellValue> & { id: string },
>({
    columns,
    editingData,
    onCellChange,
    onSave,
    onCancel,
}: NewRowFormProps<T>) {
    const newItem = editingData['new'] as T;

    if (!newItem) return null;

    return (
        <TableRow className="font-mono">
            {columns.map((column, _colIndex) => (
                <TableCell key={`new-${String(column.accessor)}`}>
                    <CellRenderer
                        item={newItem}
                        column={column}
                        isEditing={true}
                        value={newItem[column.accessor] ?? null}
                        onCellChange={onCellChange}
                    />
                </TableCell>
            ))}
            <TableCell>
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={onSave}>
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
