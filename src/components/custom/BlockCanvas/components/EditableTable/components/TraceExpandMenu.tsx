import React, { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';

interface TraceExpandMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    position: { x: number; y: number } | null;
    _rowData: unknown;
    onExpand: () => void;
    onTrace: () => void;
}

export const TraceExpandMenu: React.FC<TraceExpandMenuProps> = ({
    open,
    onOpenChange,
    position,
    _rowData,
    onExpand,
    onTrace,
}) => {
    const menuRef = useRef<HTMLDivElement | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onOpenChange(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, onOpenChange]);

    // Close menu on escape key
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onOpenChange(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onOpenChange]);

    if (!open || !position) return null;

    return (
        <div
            ref={menuRef}
            className="fixed z-50 p-1 shadow-lg border bg-background rounded-md"
            style={{
                left: position.x,
                top: position.y,
                transform: 'translateY(-50%)', // Center vertically relative to cell
                minWidth: '70px', // Ensure consistent width for stacked buttons
            }}
        >
            <div className="flex flex-col gap-0.5">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        onTrace();
                        onOpenChange(false);
                    }}
                    className="text-xs w-full h-6 px-2 py-1"
                >
                    Trace
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        onExpand();
                        onOpenChange(false);
                    }}
                    className="text-xs w-full h-6 px-2 py-1"
                >
                    Expand
                </Button>
            </div>
        </div>
    );
};
