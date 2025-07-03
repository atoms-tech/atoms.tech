'use client';

import { useCallback, useEffect, useRef } from 'react';

export interface KeyboardShortcut {
    key: string;
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    action: () => void;
    description: string;
    category?: string;
    preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
    shortcuts: KeyboardShortcut[];
    enabled?: boolean;
    target?: HTMLElement | Document;
}

export function useKeyboardShortcuts({
    shortcuts,
    enabled = true,
    target,
}: UseKeyboardShortcutsOptions) {
    const shortcutsRef = useRef<KeyboardShortcut[]>([]);

    // Update shortcuts ref when shortcuts change
    useEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            const activeElement = document.activeElement;
            const isInputField =
                activeElement &&
                (activeElement.tagName === 'INPUT' ||
                    activeElement.tagName === 'TEXTAREA' ||
                    activeElement.getAttribute('contenteditable') === 'true' ||
                    activeElement.getAttribute('role') === 'textbox');

            // Don't trigger shortcuts when in editable table context
            const isInEditableTable =
                activeElement &&
                (activeElement.closest('[role="grid"]') ||
                    activeElement.closest('.editable-table'));

            // Allow certain shortcuts even in input fields (like Cmd+C, Cmd+V, Shift+?)
            const allowedInInputs = ['c', 'v', 'x', 'a', 'z', 'y'];
            const isAllowedInInput =
                (allowedInInputs.includes(event.key.toLowerCase()) &&
                    (event.metaKey || event.ctrlKey)) ||
                (event.key === '?' && event.shiftKey) ||
                (event.key === '/' && event.shiftKey); // Some browsers report '/' for Shift+?

            // Skip if in input field and not allowed, or if in editable table (but allow help shortcut everywhere)
            const isHelpShortcut =
                (event.key === '?' || event.key === '/') && event.shiftKey;
            if (
                (isInputField && !isAllowedInInput && !isHelpShortcut) ||
                (isInEditableTable && !isHelpShortcut)
            )
                return;

            for (const shortcut of shortcutsRef.current) {
                // Handle special case for '?' key which might be detected as '/' with shift
                let keyMatches = false;
                if (
                    shortcut.key === '?' &&
                    event.key === '?' &&
                    event.shiftKey
                ) {
                    keyMatches = true;
                } else if (
                    shortcut.key === '?' &&
                    event.key === '/' &&
                    event.shiftKey
                ) {
                    keyMatches = true; // Some browsers report '/' for Shift+?
                } else {
                    keyMatches =
                        event.key.toLowerCase() === shortcut.key.toLowerCase();
                }

                const metaMatches = !!shortcut.metaKey === !!event.metaKey;
                const ctrlMatches = !!shortcut.ctrlKey === !!event.ctrlKey;
                const shiftMatches = !!shortcut.shiftKey === !!event.shiftKey;
                const altMatches = !!shortcut.altKey === !!event.altKey;

                console.log('Checking shortcut:', {
                    key: shortcut.key,
                    eventKey: event.key,
                    keyMatches,
                    metaMatches,
                    ctrlMatches,
                    shiftMatches,
                    altMatches,
                    shortcut: shortcut.description,
                });

                if (
                    keyMatches &&
                    metaMatches &&
                    ctrlMatches &&
                    shiftMatches &&
                    altMatches
                ) {
                    console.log('Shortcut matched:', shortcut.description);
                    if (shortcut.preventDefault !== false) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    try {
                        shortcut.action();
                    } catch (error) {
                        console.error('Shortcut action failed:', error);
                    }
                    break;
                }
            }
        },
        [enabled],
    );

    useEffect(() => {
        const targetElement = target || document;
        targetElement.addEventListener(
            'keydown',
            handleKeyDown as EventListener,
        );

        return () => {
            targetElement.removeEventListener(
                'keydown',
                handleKeyDown as EventListener,
            );
        };
    }, [handleKeyDown, target]);

    return {
        shortcuts: shortcutsRef.current,
    };
}

// Utility function to format shortcut display
export function formatShortcut(shortcut: KeyboardShortcut): string {
    const isMac =
        typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
    const parts: string[] = [];

    if (shortcut.metaKey) parts.push(isMac ? '⌘' : 'Ctrl');
    if (shortcut.ctrlKey && !shortcut.metaKey) parts.push('Ctrl');
    if (shortcut.altKey) parts.push(isMac ? '⌥' : 'Alt');
    if (shortcut.shiftKey) parts.push('⇧');

    parts.push(shortcut.key.toUpperCase());

    return parts.join(isMac ? '' : '+');
}

// Common shortcut patterns
export const createShortcut = (
    key: string,
    action: () => void,
    description: string,
    options: Partial<KeyboardShortcut> = {},
): KeyboardShortcut => {
    const isMac =
        typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

    return {
        key,
        metaKey: isMac,
        ctrlKey: !isMac,
        action,
        description,
        preventDefault: true,
        ...options,
    };
};

// Predefined shortcut categories
export const SHORTCUT_CATEGORIES = {
    NAVIGATION: 'Navigation',
    EDITING: 'Editing',
    CLIPBOARD: 'Clipboard',
    GENERAL: 'General',
    HELP: 'Help',
} as const;
