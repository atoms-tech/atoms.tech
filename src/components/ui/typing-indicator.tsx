'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Typing Indicator Component
 * 
 * Shows an animated "..." indicator when the assistant is thinking
 * (before the first token arrives during streaming)
 */

interface TypingIndicatorProps {
    className?: string;
    dotClassName?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
    className,
    dotClassName,
    size = 'md',
}) => {
    const sizeClasses = {
        sm: 'h-1.5 w-1.5',
        md: 'h-2 w-2',
        lg: 'h-2.5 w-2.5',
    };

    const gapClasses = {
        sm: 'gap-1',
        md: 'gap-1.5',
        lg: 'gap-2',
    };

    return (
        <div className={cn('flex items-center', gapClasses[size], className)}>
            <div
                className={cn(
                    'rounded-full bg-current animate-bounce',
                    sizeClasses[size],
                    dotClassName,
                )}
                style={{
                    animationDelay: '0ms',
                    animationDuration: '1.4s',
                }}
            />
            <div
                className={cn(
                    'rounded-full bg-current animate-bounce',
                    sizeClasses[size],
                    dotClassName,
                )}
                style={{
                    animationDelay: '160ms',
                    animationDuration: '1.4s',
                }}
            />
            <div
                className={cn(
                    'rounded-full bg-current animate-bounce',
                    sizeClasses[size],
                    dotClassName,
                )}
                style={{
                    animationDelay: '320ms',
                    animationDuration: '1.4s',
                }}
            />
        </div>
    );
};

/**
 * Typing Indicator Message
 * 
 * A complete message bubble showing the typing indicator
 * Matches the style of assistant messages
 */

interface TypingIndicatorMessageProps {
    className?: string;
}

export const TypingIndicatorMessage: React.FC<TypingIndicatorMessageProps> = ({
    className,
}) => {
    return (
        <div className={cn('flex w-full justify-start', className)}>
            <div className="flex flex-col gap-1">
                <div className="w-fit max-w-full sm:max-w-[42rem] rounded-none px-4 py-3 text-sm shadow-sm bg-muted text-muted-foreground">
                    <TypingIndicator size="sm" />
                </div>
                <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                    <span>Thinking...</span>
                </div>
            </div>
        </div>
    );
};

