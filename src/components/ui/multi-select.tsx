'use client';

import { X } from 'lucide-react';
import * as React from 'react';

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { Badge } from './badge';

export interface MultiSelectOption {
    label: string;
    value: string;
}

interface MultiSelectProps {
    values: string[];
    options: MultiSelectOption[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function MultiSelect({
    values = [],
    options = [],
    onChange,
    placeholder = 'Select options...',
    disabled = false,
    className,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (option: MultiSelectOption) => {
        const newValues = values.includes(option.value)
            ? values.filter((value) => value !== option.value)
            : [...values, option.value];

        onChange(newValues);
    };

    const handleRemove = (value: string) => {
        onChange(values.filter((v) => v !== value));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        'flex min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                        disabled && 'cursor-not-allowed opacity-50',
                        className,
                    )}
                >
                    <div className="flex flex-wrap gap-1">
                        {values.length > 0 ? (
                            values.map((value) => {
                                const option = options.find(
                                    (o) => o.value === value,
                                );
                                return (
                                    <Badge
                                        key={value}
                                        variant="secondary"
                                        className="flex items-center gap-1"
                                    >
                                        {option?.label || value}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemove(value);
                                            }}
                                            className="rounded-full outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                );
                            })
                        ) : (
                            <span className="text-muted-foreground">
                                {placeholder}
                            </span>
                        )}
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search options..." />
                    <CommandEmpty>No options found.</CommandEmpty>
                    <CommandGroup>
                        {options.map((option) => {
                            const isSelected = values.includes(option.value);
                            return (
                                <CommandItem
                                    key={option.value}
                                    onSelect={() => handleSelect(option)}
                                    className={cn(
                                        'flex items-center gap-2',
                                        isSelected &&
                                            'bg-accent text-accent-foreground',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                            isSelected &&
                                                'bg-primary text-primary-foreground',
                                        )}
                                    >
                                        {isSelected && (
                                            <span className="h-2 w-2 rounded-sm bg-current" />
                                        )}
                                    </div>
                                    <span>{option.label}</span>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
