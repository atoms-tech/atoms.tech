'use client';

import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { CellValue, EditableColumn } from './types';

interface CellRendererProps<
    T extends Record<string, CellValue> & { id: string },
> {
    item: T;
    column: EditableColumn<T>;
    isEditing: boolean;
    value: CellValue;
    onCellChange: (itemId: string, accessor: keyof T, value: CellValue) => void;
}

export function CellRenderer<
    T extends Record<string, CellValue> & { id: string },
>({ item, column, isEditing, value, onCellChange }: CellRendererProps<T>) {
    if (isEditing) {
        switch (column.type) {
            case 'select':
                return (
                    <Select
                        value={String(value ?? '')}
                        onValueChange={(newValue) =>
                            onCellChange(
                                item.id as string,
                                column.accessor,
                                newValue,
                            )
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {column.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'number':
                return (
                    <Input
                        type="number"
                        value={String(value ?? '')}
                        onChange={(e) =>
                            onCellChange(
                                item.id as string,
                                column.accessor,
                                parseFloat(e.target.value),
                            )
                        }
                        data-editing="true"
                    />
                );
            case 'date':
                return (
                    <Input
                        type="date"
                        value={String(value ?? '')}
                        onChange={(e) =>
                            onCellChange(
                                item.id as string,
                                column.accessor,
                                new Date(e.target.value),
                            )
                        }
                        data-editing="true"
                    />
                );
            default:
                return (
                    <Input
                        value={String(value ?? '')}
                        onChange={(e) =>
                            onCellChange(
                                item.id as string,
                                column.accessor,
                                e.target.value,
                            )
                        }
                        data-editing="true"
                    />
                );
        }
    }

    return (
        <div className="py-0.5 px-1 rounded transition-colors">
            {value instanceof Date
                ? value.toLocaleDateString()
                : String(value ?? '')}
        </div>
    );
}
