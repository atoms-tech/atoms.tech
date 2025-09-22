'use client';

import * as React from 'react';
import { memo, useMemo } from 'react';

import { MultiSelect } from '@/components/ui/multi-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { BaseRow, CellValue, EditableColumn } from './types';

interface CellRendererProps<T extends BaseRow> {
    item: T;
    column: EditableColumn<T>;
    isEditing: boolean;
    value: CellValue;
    onCellChange: (itemId: string, accessor: keyof T, value: CellValue) => void;
}

// Create individual cell type components for better separation of concerns
const TextCell = memo(
    ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
        <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full bg-transparent focus:outline-none py-0.5 px-1"
            data-editing="true"
        />
    ),
);
TextCell.displayName = 'TextCell';

const NumberCell = memo(
    ({
        value,
        onChange,
    }: {
        value: string;
        onChange: (value: number | null) => void;
    }) => (
        <input
            type="number"
            value={value}
            onChange={(e) =>
                onChange(e.target.value === '' ? null : parseFloat(e.target.value))
            }
            className="w-full h-full bg-transparent focus:outline-none py-0.5 px-1"
            data-editing="true"
        />
    ),
);
NumberCell.displayName = 'NumberCell';

const DateCell = memo(
    ({ value, onChange }: { value: string; onChange: (value: Date | null) => void }) => (
        <input
            type="date"
            value={value}
            onChange={(e) =>
                onChange(e.target.value === '' ? null : new Date(e.target.value))
            }
            className="w-full h-full bg-transparent focus:outline-none py-0.5 px-1"
            data-editing="true"
        />
    ),
);
DateCell.displayName = 'DateCell';

const SelectCell = memo(
    ({
        value,
        options,
        onChange,
    }: {
        value: string;
        options: string[];
        onChange: (value: string | null) => void;
    }) => {
        const selectValue =
            value === null || value === undefined || value === '' ? '__EMPTY__' : value;

        return (
            <Select
                value={selectValue}
                onValueChange={(newValue) =>
                    onChange(newValue === '__EMPTY__' ? null : newValue)
                }
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem key="empty" value="__EMPTY__">
                        -- Select --
                    </SelectItem>
                    {options?.map((option) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    },
);
SelectCell.displayName = 'SelectCell';

const MultiSelectCell = memo(
    ({
        values,
        options,
        onChange,
    }: {
        values: string[];
        options: { label: string; value: string }[];
        onChange: (values: string[] | null) => void;
    }) => (
        <MultiSelect
            values={values}
            options={options}
            onChange={(newValues) => onChange(newValues.length > 0 ? newValues : null)}
            placeholder="Select options..."
        />
    ),
);
MultiSelectCell.displayName = 'MultiSelectCell';

// Display cells
const DisplayCell = memo(({ value }: { value: CellValue }) => {
    if (value === null || value === undefined) {
        return <div className="py-0.5 px-1" />;
    }

    if (Array.isArray(value)) {
        return (
            <div className="py-0.5 px-1">{value.map((v) => String(v)).join(', ')}</div>
        );
    }

    if (value instanceof Date) {
        return <div className="py-0.5 px-1">{value.toISOString().split('T')[0]}</div>;
    }

    return <div className="py-0.5 px-1">{String(value)}</div>;
});
DisplayCell.displayName = 'DisplayCell';

// Main cell renderer with memoization
function CellRendererComponent<T extends BaseRow>({
    item,
    column,
    isEditing,
    value,
    onCellChange,
}: CellRendererProps<T>) {
    // Memoize stringValue and arrayValue calculations
    const stringValue = useMemo(() => {
        return value !== null && value !== undefined ? String(value) : '';
    }, [value]);

    const arrayValue = useMemo(() => {
        return Array.isArray(value) ? value : value ? [String(value)] : [];
    }, [value]);

    // Memoize option mapping for multi-select
    const multiSelectOptions = useMemo(() => {
        return column.options?.map((opt) => ({ label: opt, value: opt })) || [];
    }, [column.options]);

    // Handler callbacks
    const handleTextChange = React.useCallback(
        (newValue: string) => {
            onCellChange(item.id as string, column.accessor, newValue);
        },
        [item.id, column.accessor, onCellChange],
    );

    const handleNumberChange = React.useCallback(
        (newValue: number | null) => {
            onCellChange(item.id as string, column.accessor, newValue);
        },
        [item.id, column.accessor, onCellChange],
    );

    const handleDateChange = React.useCallback(
        (newValue: Date | null) => {
            onCellChange(item.id as string, column.accessor, newValue);
        },
        [item.id, column.accessor, onCellChange],
    );

    const handleSelectChange = React.useCallback(
        (newValue: string | null) => {
            onCellChange(item.id as string, column.accessor, newValue);
        },
        [item.id, column.accessor, onCellChange],
    );

    const handleMultiSelectChange = React.useCallback(
        (newValues: string[] | null) => {
            onCellChange(item.id as string, column.accessor, newValues);
        },
        [item.id, column.accessor, onCellChange],
    );

    // Render the appropriate cell component based on editing state and column type
    if (isEditing) {
        switch (column.type) {
            case 'multi_select':
                return (
                    <MultiSelectCell
                        values={arrayValue}
                        options={multiSelectOptions}
                        onChange={handleMultiSelectChange}
                    />
                );
            case 'select':
                return (
                    <SelectCell
                        value={stringValue}
                        options={column.options || []}
                        onChange={handleSelectChange}
                    />
                );
            case 'number':
                return <NumberCell value={stringValue} onChange={handleNumberChange} />;
            case 'date':
                return <DateCell value={stringValue} onChange={handleDateChange} />;
            default:
                return <TextCell value={stringValue} onChange={handleTextChange} />;
        }
    }

    // Display mode
    return <DisplayCell value={value} />;
}

// Export memoized component to prevent unnecessary re-renders
export const CellRenderer = memo(CellRendererComponent) as typeof CellRendererComponent;
