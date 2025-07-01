import type { InputHTMLAttributes, Ref } from 'react';
import React from 'react';
import { RefCallBack } from 'react-hook-form';

import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    ref?: Ref<HTMLInputElement> | RefCallBack;
    label?: string;
    error?: string;
    description?: string;
    showClearButton?: boolean;
    onClear?: () => void;
}

const Input = ({
    className,
    type,
    label,
    error,
    description,
    showClearButton = false,
    onClear,
    id,
    'aria-describedby': ariaDescribedBy,
    ...props
}: InputProps) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const descriptionId = description ? `${inputId}-description` : undefined;

    const describedBy =
        [ariaDescribedBy, errorId, descriptionId].filter(Boolean).join(' ') ||
        undefined;

    return (
        <div className="space-y-1">
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    id={inputId}
                    type={type}
                    className={cn(
                        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                        error &&
                            'border-destructive focus-visible:ring-destructive',
                        showClearButton && 'pr-8',
                        className,
                    )}
                    aria-describedby={describedBy}
                    aria-invalid={error ? 'true' : 'false'}
                    {...props}
                />
                {showClearButton && props.value && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                        aria-label="Clear input"
                        tabIndex={-1}
                    >
                        ✕
                    </button>
                )}
            </div>
            {description && (
                <p id={descriptionId} className="text-sm text-muted-foreground">
                    {description}
                </p>
            )}
            {error && (
                <p
                    id={errorId}
                    className="text-sm text-destructive"
                    role="alert"
                >
                    {error}
                </p>
            )}
        </div>
    );
};
Input.displayName = 'Input';

export { Input };
