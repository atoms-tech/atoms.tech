'use client';

import { Keyboard, X } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { KeyboardShortcut } from '@/hooks/useKeyboardNavigation';
import { cn } from '@/lib/utils';

interface KeyboardShortcutsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsDialog({
    isOpen,
    onClose,
    shortcuts,
}: KeyboardShortcutsDialogProps) {
    // Group shortcuts by category
    const groupedShortcuts = shortcuts.reduce(
        (acc, shortcut) => {
            const category = shortcut.category || 'General';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(shortcut);
            return acc;
        },
        {} as Record<string, KeyboardShortcut[]>,
    );

    // Handle escape key to close dialog
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const formatShortcut = (shortcut: KeyboardShortcut) => {
        const keys = [];

        if (shortcut.ctrlKey) keys.push('Ctrl');
        if (shortcut.metaKey) keys.push('Cmd');
        if (shortcut.shiftKey) keys.push('Shift');
        if (shortcut.altKey) keys.push('Alt');

        keys.push(shortcut.key.toUpperCase());

        return keys;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Keyboard className="h-5 w-5" />
                        Keyboard Shortcuts
                    </DialogTitle>
                    <DialogDescription>
                        Use these keyboard shortcuts to navigate and interact
                        with the application more efficiently.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {Object.entries(groupedShortcuts).map(
                        ([category, categoryShortcuts]) => (
                            <div key={category}>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                                    {category}
                                </h3>
                                <div className="space-y-2">
                                    {categoryShortcuts.map(
                                        (shortcut, index) => (
                                            <div
                                                key={`${category}-${index}`}
                                                className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                                            >
                                                <span className="text-sm">
                                                    {shortcut.description}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {formatShortcut(
                                                        shortcut,
                                                    ).map((key, keyIndex) => (
                                                        <kbd
                                                            key={keyIndex}
                                                            className={cn(
                                                                'inline-flex items-center justify-center px-2 py-1 text-xs font-mono bg-muted border border-border rounded',
                                                                'min-w-[1.5rem] h-6',
                                                            )}
                                                        >
                                                            {key}
                                                        </kbd>
                                                    ))}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                                {category !==
                                    Object.keys(groupedShortcuts)[
                                        Object.keys(groupedShortcuts).length - 1
                                    ] && <Separator className="mt-4" />}
                            </div>
                        ),
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                        Press{' '}
                        <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border border-border rounded">
                            Shift
                        </kbd>{' '}
                        +{' '}
                        <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border border-border rounded">
                            ?
                        </kbd>{' '}
                        to toggle this dialog
                    </div>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        <X className="h-4 w-4 mr-2" />
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Floating keyboard shortcut indicator
 */
interface KeyboardShortcutIndicatorProps {
    shortcut: string;
    description: string;
    className?: string;
}

export function KeyboardShortcutIndicator({
    shortcut,
    description,
    className,
}: KeyboardShortcutIndicatorProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center gap-2 px-2 py-1 text-xs bg-muted/80 backdrop-blur-sm rounded border',
                className,
            )}
            title={description}
        >
            <span className="text-muted-foreground">{description}</span>
            <kbd className="px-1 py-0.5 text-xs font-mono bg-background border border-border rounded">
                {shortcut}
            </kbd>
        </div>
    );
}

/**
 * Keyboard navigation hint component
 */
interface KeyboardNavHintProps {
    children: React.ReactNode;
    shortcut?: string;
    className?: string;
}

export function KeyboardNavHint({
    children,
    shortcut,
    className,
}: KeyboardNavHintProps) {
    return (
        <div className={cn('relative group', className)}>
            {children}
            {shortcut && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs border shadow-md whitespace-nowrap">
                        Press{' '}
                        <kbd className="px-1 py-0.5 font-mono bg-muted border border-border rounded text-xs">
                            {shortcut}
                        </kbd>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Accessible focus indicator component
 */
interface FocusIndicatorProps {
    children: React.ReactNode;
    className?: string;
}

export function FocusIndicator({ children, className }: FocusIndicatorProps) {
    return (
        <div
            className={cn(
                'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background rounded-md transition-all duration-200',
                className,
            )}
        >
            {children}
        </div>
    );
}
