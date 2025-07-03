'use client';

import React, { forwardRef, useCallback, useRef } from 'react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useSlashCommands } from '@/hooks/useSlashCommands';
import { SlashCommandAutocomplete } from './SlashCommandAutocomplete';

interface SlashCommandInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    /** Input variant - 'input' or 'textarea' */
    variant?: 'input' | 'textarea';
    /** Controlled value */
    value?: string;
    /** Change handler */
    onChange?: (value: string) => void;
    /** Callback when command is executed */
    onCommandExecuted?: (commandId: string) => void;
    /** Disable slash commands */
    disableSlashCommands?: boolean;
    /** Additional props for textarea variant */
    textareaProps?: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'>;
}

export const SlashCommandInput = forwardRef<
    HTMLInputElement | HTMLTextAreaElement,
    SlashCommandInputProps
>(({
    variant = 'input',
    value,
    onChange,
    onCommandExecuted,
    disableSlashCommands = false,
    className,
    onKeyDown,
    textareaProps,
    ...props
}, ref) => {
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    
    // Combine refs
    const combinedRef = useCallback((node: HTMLInputElement | HTMLTextAreaElement | null) => {
        if (inputRef) {
            inputRef.current = node;
        }
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            ref.current = node;
        }
    }, [ref]);

    const {
        state,
        handleInputChange,
        handleKeyDown,
        executeSelectedCommand,
        closeAutocomplete,
        setSelectedIndex,
    } = useSlashCommands({
        inputRef,
        onCommandExecuted,
        onInsertText: (text: string) => {
            if (!inputRef.current || !onChange) return;
            
            const input = inputRef.current;
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const currentValue = value || input.value || '';
            
            const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
            onChange(newValue);
            
            // Set cursor position after the inserted text
            setTimeout(() => {
                if (input) {
                    input.setSelectionRange(start + text.length, start + text.length);
                }
            }, 0);
        },
        onReplaceText: (start: number, end: number, text: string) => {
            if (!onChange) return;
            
            const currentValue = value || inputRef.current?.value || '';
            const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
            onChange(newValue);
            
            // Set cursor position after the replaced text
            setTimeout(() => {
                if (inputRef.current) {
                    const newPosition = start + text.length;
                    inputRef.current.setSelectionRange(newPosition, newPosition);
                }
            }, 0);
        },
    });

    const handleChange = useCallback((
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const newValue = event.target.value;
        const cursorPosition = event.target.selectionStart || 0;
        
        onChange?.(newValue);
        
        if (!disableSlashCommands) {
            handleInputChange(newValue, cursorPosition);
        }
    }, [onChange, handleInputChange, disableSlashCommands]);

    const handleKeyDownEvent = useCallback((
        event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        // Handle slash command navigation first
        if (!disableSlashCommands && handleKeyDown(event)) {
            return; // Event was handled by slash commands
        }

        // Call original onKeyDown if provided
        if (onKeyDown) {
            onKeyDown(event as React.KeyboardEvent<HTMLInputElement>);
        }
    }, [handleKeyDown, onKeyDown, disableSlashCommands]);

    const handleBlur = useCallback(() => {
        // Close autocomplete when input loses focus
        // Use a small delay to allow for command selection
        setTimeout(() => {
            closeAutocomplete();
        }, 150);
    }, [closeAutocomplete]);

    return (
        <div className="relative">
            {variant === 'textarea' ? (
                <textarea
                    ref={combinedRef as unknown as React.RefObject<HTMLTextAreaElement>}
                    value={value}
                    onChange={handleChange as React.ChangeEventHandler<HTMLTextAreaElement>}
                    onKeyDown={handleKeyDownEvent as React.KeyboardEventHandler<HTMLTextAreaElement>}
                    onBlur={handleBlur}
                    className={cn(
                        'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                        className
                    )}
                    {...textareaProps}
                />
            ) : (
                <Input
                    ref={combinedRef as unknown as React.RefObject<HTMLInputElement>}
                    value={value}
                    onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
                    onKeyDown={handleKeyDownEvent as React.KeyboardEventHandler<HTMLInputElement>}
                    onBlur={handleBlur}
                    className={cn(className)}
                    {...props}
                />
            )}
            
            {!disableSlashCommands && (
                <SlashCommandAutocomplete
                    state={state}
                    onSelect={setSelectedIndex}
                    onExecute={executeSelectedCommand}
                />
            )}
        </div>
    );
});

SlashCommandInput.displayName = 'SlashCommandInput';
