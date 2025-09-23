import { Cell } from '@tanstack/react-table';
import * as React from 'react';
import { memo, useEffect, useMemo, useRef } from 'react';

import {
    BaseRow,
    CellValue,
    EditableColumn,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { MultiSelect } from '@/components/ui/multi-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// Specialized cell components
const TextCell = memo(
    ({
        value,
        onChange,
        onBlur,
    }: {
        value: string;
        onChange: (value: string) => void;
        onBlur?: () => void;
    }) => {
        const inputRef = React.useRef<HTMLInputElement>(null);

        // Focus the input when mounted
        React.useEffect(() => {
            inputRef.current?.focus();
        }, []);

        return (
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={(e) => {
                    // Only trigger blur if we're not clicking within the same cell
                    const isClickingWithinCell = e.currentTarget.parentElement?.contains(
                        e.relatedTarget as Node,
                    );
                    if (!isClickingWithinCell) {
                        onBlur?.();
                    }
                }}
                className="w-full h-full bg-transparent focus:outline-none py-0.5 px-1"
                data-editing="true"
            />
        );
    },
);
TextCell.displayName = 'TextCell';

const NumberCell = memo(
    ({
        value,
        onChange,
        onBlur,
    }: {
        value: string;
        onChange: (value: number | null) => void;
        onBlur?: () => void;
    }) => {
        const inputRef = React.useRef<HTMLInputElement>(null);

        // Focus the input when mounted
        React.useEffect(() => {
            inputRef.current?.focus();
        }, []);

        return (
            <input
                ref={inputRef}
                type="number"
                value={value}
                onChange={(e) =>
                    onChange(e.target.value === '' ? null : parseFloat(e.target.value))
                }
                onBlur={(e) => {
                    // Only trigger blur if we're not clicking within the same cell
                    const isClickingWithinCell = e.currentTarget.parentElement?.contains(
                        e.relatedTarget as Node,
                    );
                    if (!isClickingWithinCell) {
                        onBlur?.();
                    }
                }}
                className="w-full h-full bg-transparent focus:outline-none py-0.5 px-1"
                data-editing="true"
            />
        );
    },
);
NumberCell.displayName = 'NumberCell';

const DateCell = memo(
    ({
        value,
        onChange,
        onBlur,
    }: {
        value: string;
        onChange: (value: Date | null) => void;
        onBlur?: () => void;
    }) => {
        const inputRef = React.useRef<HTMLInputElement>(null);

        // Focus the input when mounted
        React.useEffect(() => {
            inputRef.current?.focus();
        }, []);

        return (
            <input
                ref={inputRef}
                type="date"
                value={value}
                onChange={(e) =>
                    onChange(e.target.value === '' ? null : new Date(e.target.value))
                }
                onBlur={(e) => {
                    // Only trigger blur if we're not clicking within the same cell
                    const isClickingWithinCell = e.currentTarget.parentElement?.contains(
                        e.relatedTarget as Node,
                    );
                    if (!isClickingWithinCell) {
                        onBlur?.();
                    }
                }}
                className="w-full h-full bg-transparent focus:outline-none py-0.5 px-1"
                data-editing="true"
            />
        );
    },
);
DateCell.displayName = 'DateCell';

const SelectCell = memo(
    ({
        value,
        options,
        onChange,
        onBlur,
    }: {
        value: string;
        options: string[];
        onChange: (value: string | null) => void;
        onBlur?: () => void;
    }) => {
        const selectValue =
            value === null || value === undefined || value === '' ? '__EMPTY__' : value;

        return (
            <Select
                value={selectValue}
                onValueChange={(newValue) => {
                    onChange(newValue === '__EMPTY__' ? null : newValue);
                    onBlur?.();
                }}
                onOpenChange={(open) => {
                    if (!open) {
                        onBlur?.();
                    }
                }}
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
        onBlur,
    }: {
        values: string[];
        options: { label: string; value: string }[];
        onChange: (values: string[] | null) => void;
        onBlur?: () => void;
    }) => (
        <MultiSelect
            values={values}
            options={options}
            onChange={(newValues: string[]) => {
                onChange(newValues.length > 0 ? newValues : null);
                onBlur?.();
            }}
            placeholder="Select options..."
        />
    ),
);
MultiSelectCell.displayName = 'MultiSelectCell';

// Display cell for non-editing mode
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

// Wrapper components for each cell type to enhance memoization
const TextCellWrapper = memo(
    ({
        value,
        onChange,
        onBlur,
    }: {
        value: string;
        onChange: (value: string) => void;
        onBlur?: () => void;
    }) => <TextCell value={value} onChange={onChange} onBlur={onBlur} />,
);
TextCellWrapper.displayName = 'TextCellWrapper';

const NumberCellWrapper = memo(
    ({
        value,
        onChange,
        onBlur,
    }: {
        value: string;
        onChange: (value: number | null) => void;
        onBlur?: () => void;
    }) => <NumberCell value={value} onChange={onChange} onBlur={onBlur} />,
);
NumberCellWrapper.displayName = 'NumberCellWrapper';

const DateCellWrapper = memo(
    ({
        value,
        onChange,
        onBlur,
    }: {
        value: string;
        onChange: (value: Date | null) => void;
        onBlur?: () => void;
    }) => <DateCell value={value} onChange={onChange} onBlur={onBlur} />,
);
DateCellWrapper.displayName = 'DateCellWrapper';

const SelectCellWrapper = memo(
    ({
        value,
        options,
        onChange,
        onBlur,
    }: {
        value: string;
        options: string[];
        onChange: (value: string | null) => void;
        onBlur?: () => void;
    }) => (
        <SelectCell value={value} options={options} onChange={onChange} onBlur={onBlur} />
    ),
);
SelectCellWrapper.displayName = 'SelectCellWrapper';

const MultiSelectCellWrapper = memo(
    ({
        values,
        options,
        onChange,
        onBlur,
    }: {
        values: string[];
        options: { label: string; value: string }[];
        onChange: (values: string[] | null) => void;
        onBlur?: () => void;
    }) => (
        <MultiSelectCell
            values={values}
            options={options}
            onChange={onChange}
            onBlur={onBlur}
        />
    ),
);
MultiSelectCellWrapper.displayName = 'MultiSelectCellWrapper';

interface TanStackCellRendererProps<T extends BaseRow> {
    cell: Cell<T, unknown>;
    isEditing: boolean;
    onSave: (value: CellValue) => void;
    onBlur?: () => void;
    isSelected?: boolean;
    value: CellValue | undefined;
}

// Main cell renderer component for TanStack Table
function TanStackCellRendererComponent<T extends BaseRow>({
    cell,
    isEditing,
    onSave,
    onBlur,
    isSelected,
    value,
}: TanStackCellRendererProps<T>) {
    const column = cell.column.columnDef as unknown as EditableColumn<T>;

    // Memoize string and array values
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

    // Use stable handler references to avoid unnecessary rerenders
    const handlersRef = useRef({
        text: (newValue: string) => onSave(newValue),
        number: (newValue: number | null) => onSave(newValue),
        date: (newValue: Date | null) => onSave(newValue),
        select: (newValue: string | null) => {
            onSave(newValue);
            onBlur?.();
        },
        multiSelect: (newValues: string[] | null) => {
            onSave(newValues);
            onBlur?.();
        },
    });

    // Update handlers only when onSave or onBlur changes
    useEffect(() => {
        handlersRef.current = {
            text: (newValue: string) => onSave(newValue),
            number: (newValue: number | null) => onSave(newValue),
            date: (newValue: Date | null) => onSave(newValue),
            select: (newValue: string | null) => {
                onSave(newValue);
                onBlur?.();
            },
            multiSelect: (newValues: string[] | null) => {
                onSave(newValues);
                onBlur?.();
            },
        };
    }, [onSave, onBlur]);

    // Memoize the edit state check
    const shouldShowEditComponent = useMemo(
        () => isEditing && (isSelected || cell.row.original.id === 'new'),
        [isEditing, isSelected, cell.row.original.id],
    );

    // Simplified memoized cell content with fewer dependencies
    const cellContent = useMemo(() => {
        if (!shouldShowEditComponent) {
            return <DisplayCell value={(value ?? null) as CellValue} />;
        }

        switch (column.type) {
            case 'multi_select':
                return (
                    <MultiSelectCellWrapper
                        values={arrayValue}
                        options={multiSelectOptions}
                        onChange={handlersRef.current.multiSelect}
                        onBlur={onBlur}
                    />
                );
            case 'select':
                return (
                    <SelectCellWrapper
                        value={stringValue}
                        options={column.options || []}
                        onChange={handlersRef.current.select}
                        onBlur={onBlur}
                    />
                );
            case 'number':
                return (
                    <NumberCellWrapper
                        value={stringValue}
                        onChange={handlersRef.current.number}
                        onBlur={onBlur}
                    />
                );
            case 'date':
                return (
                    <DateCellWrapper
                        value={stringValue}
                        onChange={handlersRef.current.date}
                        onBlur={onBlur}
                    />
                );
            default:
                return (
                    <TextCellWrapper
                        value={stringValue}
                        onChange={handlersRef.current.text}
                        onBlur={onBlur}
                    />
                );
        }
    }, [
        shouldShowEditComponent,
        column.type,
        column.options,
        stringValue,
        arrayValue,
        multiSelectOptions,
        onBlur,
        value,
    ]);

    return cellContent;
}

// Export memoized component with proper type
export const TanStackCellRenderer = memo(
    TanStackCellRendererComponent,
) as typeof TanStackCellRendererComponent;
