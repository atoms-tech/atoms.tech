'use client';

import React from 'react';

import { cn } from '@/lib/utils';

interface LiveRegionProps {
    children: React.ReactNode;
    politeness?: 'polite' | 'assertive' | 'off';
    atomic?: boolean;
    relevant?: 'additions' | 'removals' | 'text' | 'all';
    className?: string;
    id?: string;
}

export function LiveRegion({
    children,
    politeness = 'polite',
    atomic = false,
    relevant = 'additions',
    className,
    id,
}: LiveRegionProps) {
    return (
        <div
            id={id}
            aria-live={politeness}
            aria-atomic={atomic}
            aria-relevant={relevant}
            className={cn('sr-only', className)}
        >
            {children}
        </div>
    );
}

// Status region for general status updates
interface StatusRegionProps {
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    className?: string;
}

export function StatusRegion({
    message,
    type = 'info',
    className,
}: StatusRegionProps) {
    const politeness = type === 'error' ? 'assertive' : 'polite';

    return (
        <LiveRegion politeness={politeness} className={className}>
            {message && (
                <span>
                    {type === 'success' && 'Success: '}
                    {type === 'warning' && 'Warning: '}
                    {type === 'error' && 'Error: '}
                    {message}
                </span>
            )}
        </LiveRegion>
    );
}

// Loading region for loading states
interface LoadingRegionProps {
    isLoading: boolean;
    message?: string;
    className?: string;
}

export function LoadingRegion({
    isLoading,
    message = 'Loading...',
    className,
}: LoadingRegionProps) {
    return (
        <LiveRegion politeness="polite" className={className}>
            {isLoading && message}
        </LiveRegion>
    );
}

// Progress region for progress updates
interface ProgressRegionProps {
    progress: number;
    total?: number;
    message?: string;
    className?: string;
}

export function ProgressRegion({
    progress,
    total = 100,
    message,
    className,
}: ProgressRegionProps) {
    const percentage = Math.round((progress / total) * 100);

    return (
        <LiveRegion politeness="polite" className={className}>
            {message ? `${message} ${percentage}%` : `${percentage}% complete`}
        </LiveRegion>
    );
}

// Hook for managing live region announcements
export function useLiveRegion() {
    const [message, setMessage] = React.useState('');
    const [type, setType] = React.useState<
        'info' | 'success' | 'warning' | 'error'
    >('info');
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    const announce = React.useCallback(
        (
            newMessage: string,
            messageType: 'info' | 'success' | 'warning' | 'error' = 'info',
            duration = 5000,
        ) => {
            setMessage(newMessage);
            setType(messageType);

            // Clear previous timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Auto-clear message after duration
            if (duration > 0) {
                timeoutRef.current = setTimeout(() => {
                    setMessage('');
                }, duration);
            }
        },
        [],
    );

    const clear = React.useCallback(() => {
        setMessage('');
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        message,
        type,
        announce,
        clear,
        LiveRegionComponent: () => (
            <StatusRegion message={message} type={type} />
        ),
    };
}

// Context for global live region management
interface LiveRegionContextType {
    announce: (
        message: string,
        type?: 'info' | 'success' | 'warning' | 'error',
        duration?: number,
    ) => void;
    clear: () => void;
}

const LiveRegionContext = React.createContext<LiveRegionContextType | null>(
    null,
);

export function LiveRegionProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { announce, clear, LiveRegionComponent } = useLiveRegion();

    return (
        <LiveRegionContext.Provider value={{ announce, clear }}>
            {children}
            <LiveRegionComponent />
        </LiveRegionContext.Provider>
    );
}

export function useLiveRegionContext() {
    const context = React.useContext(LiveRegionContext);
    if (!context) {
        throw new Error(
            'useLiveRegionContext must be used within a LiveRegionProvider',
        );
    }
    return context;
}
