'use client';

import React, { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';
import {
    SlashCommandAutocompleteState,
    SlashCommandSearchResult,
} from './types';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

interface SlashCommandAutocompleteProps {
    /** Current autocomplete state */
    state: SlashCommandAutocompleteState;
    /** Callback when a command is selected */
    onSelect: (index: number) => void;
    /** Callback when a command is executed */
    onExecute: () => void;
    /** Additional CSS classes */
    className?: string;
    /** Maximum height for the dropdown */
    maxHeight?: number;
}

export function SlashCommandAutocomplete({
    state,
    onSelect,
    onExecute,
    className,
    maxHeight = 300,
}: SlashCommandAutocompleteProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll selected item into view
    useEffect(() => {
        if (!containerRef.current) return;

        const selectedElement = containerRef.current.querySelector(
            `[data-command-index="${state.selectedIndex}"]`
        );

        if (selectedElement) {
            selectedElement.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
            });
        }
    }, [state.selectedIndex]);

    if (!state.isOpen || state.commands.length === 0) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                'absolute top-full left-0 z-50 min-w-[300px] max-w-[400px] rounded-md border bg-popover p-0 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 mt-1',
                className
            )}
            style={{ maxHeight: `${maxHeight}px` }}
        >
            <Command className="max-h-none">
                <CommandList className="max-h-none overflow-y-auto">
                    {state.commands.length === 0 ? (
                        <CommandEmpty>No commands found.</CommandEmpty>
                    ) : (
                        <CommandGroup>
                            {state.commands.map((result, index) => (
                                <SlashCommandItem
                                    key={result.command.id}
                                    result={result}
                                    index={index}
                                    isSelected={index === state.selectedIndex}
                                    onSelect={() => onSelect(index)}
                                    onExecute={onExecute}
                                />
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </Command>
        </div>
    );
}

interface SlashCommandItemProps {
    result: SlashCommandSearchResult;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
    onExecute: () => void;
}

function SlashCommandItem({
    result,
    index,
    isSelected,
    onSelect,
    onExecute,
}: SlashCommandItemProps) {
    const { command } = result;
    const IconComponent = command.icon;

    return (
        <CommandItem
            data-command-index={index}
            className={cn(
                'flex items-center gap-3 px-3 py-2 cursor-pointer',
                isSelected && 'bg-accent text-accent-foreground'
            )}
            onMouseEnter={onSelect}
            onSelect={onExecute}
        >
            {/* Command Icon */}
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                {IconComponent ? (
                    <IconComponent className="h-4 w-4" />
                ) : (
                    <div className="h-4 w-4 rounded bg-muted-foreground/20" />
                )}
            </div>

            {/* Command Info */}
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="font-medium">{command.name}</span>
                    {command.category && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {command.category}
                        </span>
                    )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                    {command.description}
                </p>
            </div>

            {/* Relevance Score (for debugging) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-muted-foreground">
                    {result.relevance}
                </div>
            )}
        </CommandItem>
    );
}

SlashCommandAutocomplete.displayName = 'SlashCommandAutocomplete';
