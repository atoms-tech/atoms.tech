import { Plus } from 'lucide-react';

import { EditableColumn } from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface AddRowPlaceholderProps<T> {
    columns: EditableColumn<T>[];
    onClick: () => void;
    isEditMode: boolean;
}

export function AddRowPlaceholder<T>({
    columns,
    onClick,
    isEditMode,
}: AddRowPlaceholderProps<T>) {
    return (
        <TableRow
            className={cn('font-mono cursor-pointer group/mock-row')}
            onClick={onClick}
        >
            {columns.map((column, colIndex) => (
                <TableCell
                    key={`mock-${String(column.accessor)}`}
                    className={cn(
                        'text-muted-foreground/50',
                        colIndex === 0 && 'font-medium',
                    )}
                >
                    {colIndex === 0 ? (
                        <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Row
                        </div>
                    ) : (
                        '...'
                    )}
                </TableCell>
            ))}
            {isEditMode && <TableCell />}
        </TableRow>
    );
}
