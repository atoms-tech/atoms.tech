import { CaretSortIcon } from '@radix-ui/react-icons';

import { EditableColumn } from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { Button } from '@/components/ui/button';
import {
    TableHead,
    TableRow,
    TableHeader as UITableHeader,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface TableHeaderProps<T> {
    columns: EditableColumn<T>[];
    sortKey: keyof T | null;
    sortOrder: 'asc' | 'desc';
    onSort: (key: keyof T) => void;
    isEditMode: boolean;
}

export function TableHeader<T>({
    columns,
    // sortKey and sortOrder are intentionally not used
    onSort,
    isEditMode,
}: Omit<TableHeaderProps<T>, 'sortKey' | 'sortOrder'> & {
    sortKey?: keyof T | null;
    sortOrder?: 'asc' | 'desc';
}) {
    return (
        <UITableHeader>
            <TableRow>
                {columns.map((column) => (
                    <TableHead
                        key={column.header}
                        style={{
                            width: column.width
                                ? `${column.width}px`
                                : undefined,
                        }}
                    >
                        <Button
                            variant="ghost"
                            onClick={() => {
                                if (column.isSortable) {
                                    onSort(column.accessor);
                                }
                            }}
                            className={cn(
                                'h-8 text-left font-medium',
                                column.isSortable && 'cursor-pointer',
                            )}
                            disabled={!column.isSortable}
                        >
                            {column.header}
                            {column.isSortable && (
                                <CaretSortIcon className="ml-2 h-4 w-4" />
                            )}
                        </Button>
                    </TableHead>
                ))}
                {isEditMode && (
                    <TableHead style={{ width: '100px' }}>Actions</TableHead>
                )}
            </TableRow>
        </UITableHeader>
    );
}
