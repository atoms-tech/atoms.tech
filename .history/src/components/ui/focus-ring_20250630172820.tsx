'use client';

import React from 'react';

import { cn } from '@/lib/utils';

interface FocusRingProps {
    children: React.ReactNode;
    className?: string;
    focusRingClassName?: string;
    within?: boolean;
    visible?: boolean;
}

export function FocusRing({
    children,
    className,
    focusRingClassName,
    within = false,
    visible,
}: FocusRingProps) {
    const [isFocusVisible, setIsFocusVisible] = React.useState(false);
    const [isWithinFocus, setIsWithinFocus] = React.useState(false);

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.key === 'Tab' ||
                event.key === 'Enter' ||
                event.key === ' '
            ) {
                setIsFocusVisible(true);
            }
        };

        const handleMouseDown = () => {
            setIsFocusVisible(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    const shouldShowFocusRing =
        visible !== undefined ? visible : isFocusVisible;
    const shouldShowWithinRing = within && isWithinFocus;

    return (
        <div
            className={cn(
                'relative',
                className,
                // Focus ring styles
                shouldShowFocusRing && [
                    'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
                    focusRingClassName,
                ],
                // Focus within styles
                shouldShowWithinRing && [
                    'ring-2 ring-ring ring-offset-2',
                    focusRingClassName,
                ],
            )}
            onFocusCapture={() => {
                if (within) setIsWithinFocus(true);
            }}
            onBlurCapture={(e) => {
                if (
                    within &&
                    !e.currentTarget.contains(e.relatedTarget as Node)
                ) {
                    setIsWithinFocus(false);
                }
            }}
        >
            {children}
        </div>
    );
}

interface FocusableProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    focusRingClassName?: string;
}

export function Focusable({
    children,
    className,
    focusRingClassName,
    ...props
}: FocusableProps) {
    return (
        <FocusRing focusRingClassName={focusRingClassName}>
            <div
                className={cn(
                    'outline-none focus-visible:outline-none',
                    className,
                )}
                tabIndex={0}
                {...props}
            >
                {children}
            </div>
        </FocusRing>
    );
}

// Custom focus ring component for specific use cases
interface CustomFocusRingProps {
    children: React.ReactNode;
    className?: string;
    ringColor?: 'primary' | 'secondary' | 'destructive' | 'warning';
    ringWidth?: '1' | '2' | '4' | '8';
    ringOffset?: '0' | '1' | '2' | '4';
    visible?: boolean;
}

export function CustomFocusRing({
    children,
    className,
    ringColor = 'primary',
    ringWidth = '2',
    ringOffset = '2',
    visible,
}: CustomFocusRingProps) {
    const ringColorClasses = {
        primary: 'ring-primary',
        secondary: 'ring-secondary',
        destructive: 'ring-destructive',
        warning: 'ring-yellow-500',
    };

    const ringWidthClasses = {
        '1': 'ring-1',
        '2': 'ring-2',
        '4': 'ring-4',
        '8': 'ring-8',
    };

    const ringOffsetClasses = {
        '0': 'ring-offset-0',
        '1': 'ring-offset-1',
        '2': 'ring-offset-2',
        '4': 'ring-offset-4',
    };

    return (
        <FocusRing
            className={className}
            focusRingClassName={cn(
                ringColorClasses[ringColor],
                ringWidthClasses[ringWidth],
                ringOffsetClasses[ringOffset],
            )}
            visible={visible}
        >
            {children}
        </FocusRing>
    );
}

// Hook for managing focus ring state
export function useFocusRing() {
    const [isFocusVisible, setIsFocusVisible] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const focusProps = React.useMemo(
        () => ({
            onFocus: () => setIsFocused(true),
            onBlur: () => setIsFocused(false),
        }),
        [],
    );

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                event.key === 'Tab' ||
                event.key === 'Enter' ||
                event.key === ' '
            ) {
                setIsFocusVisible(true);
            }
        };

        const handleMouseDown = () => {
            setIsFocusVisible(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    return {
        isFocusVisible: isFocusVisible && isFocused,
        isFocused,
        focusProps,
    };
}
