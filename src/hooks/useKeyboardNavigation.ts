import { useCallback, useEffect, useState } from 'react';

export interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    description: string;
    action: () => void;
    category?: string;
}

export interface KeyboardNavigationOptions {
    enableGlobalShortcuts?: boolean;
    enableArrowNavigation?: boolean;
    enableTabNavigation?: boolean;
    enableEscapeHandling?: boolean;
}

/**
 * Comprehensive keyboard navigation and accessibility hook
 */
export function useKeyboardNavigation(
    shortcuts: KeyboardShortcut[] = [],
    options: KeyboardNavigationOptions = {},
) {
    const [isHelpVisible, setIsHelpVisible] = useState(false);
    const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(
        null,
    );

    const {
        enableGlobalShortcuts = true,
        enableArrowNavigation = true,
        enableTabNavigation: _enableTabNavigation = true,
        enableEscapeHandling = true,
    } = options;

    // Toggle help dialog with Shift + ?
    const toggleHelp = useCallback(() => {
        setIsHelpVisible((prev) => !prev);
    }, []);

    // Focus management
    const focusElement = useCallback((element: HTMLElement | null) => {
        if (element) {
            element.focus();
            setFocusedElement(element);
        }
    }, []);

    // Get all focusable elements on the page
    const getFocusableElements = useCallback(() => {
        const selector = [
            'button:not([disabled])',
            'input:not([disabled])',
            'textarea:not([disabled])',
            'select:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled])',
            '[role="link"]:not([disabled])',
            '[role="menuitem"]:not([disabled])',
            '[role="tab"]:not([disabled])',
        ].join(', ');

        return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    }, []);

    // Navigate to next/previous focusable element
    const navigateToElement = useCallback(
        (direction: 'next' | 'previous') => {
            const focusableElements = getFocusableElements();
            const currentIndex = focusedElement
                ? focusableElements.indexOf(focusedElement)
                : -1;

            let nextIndex;
            if (direction === 'next') {
                nextIndex =
                    currentIndex < focusableElements.length - 1
                        ? currentIndex + 1
                        : 0;
            } else {
                nextIndex =
                    currentIndex > 0
                        ? currentIndex - 1
                        : focusableElements.length - 1;
            }

            const nextElement = focusableElements[nextIndex];
            if (nextElement) {
                focusElement(nextElement);
            }
        },
        [focusedElement, getFocusableElements, focusElement],
    );

    // Arrow key navigation within containers
    const handleArrowNavigation = useCallback(
        (event: KeyboardEvent) => {
            if (!enableArrowNavigation) return;

            const target = event.target as HTMLElement;
            const container = target.closest(
                '[role="menu"], [role="tablist"], [role="grid"], .keyboard-nav-container',
            );

            if (!container) return;

            const items = Array.from(
                container.querySelectorAll(
                    '[role="menuitem"], [role="tab"], [role="gridcell"], .keyboard-nav-item',
                ),
            ) as HTMLElement[];

            const currentIndex = items.indexOf(target);
            if (currentIndex === -1) return;

            let nextIndex = currentIndex;

            switch (event.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    nextIndex =
                        currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                    break;
                case 'ArrowUp':
                case 'ArrowLeft':
                    nextIndex =
                        currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                    break;
                case 'Home':
                    nextIndex = 0;
                    break;
                case 'End':
                    nextIndex = items.length - 1;
                    break;
                default:
                    return;
            }

            event.preventDefault();
            const nextItem = items[nextIndex];
            if (nextItem) {
                focusElement(nextItem);
            }
        },
        [enableArrowNavigation, focusElement],
    );

    // Main keyboard event handler
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Handle Shift + ? for help
            if (event.shiftKey && event.key === '?') {
                event.preventDefault();
                toggleHelp();
                return;
            }

            // Handle Escape key
            if (enableEscapeHandling && event.key === 'Escape') {
                if (isHelpVisible) {
                    setIsHelpVisible(false);
                    return;
                }

                // Close any open modals, dropdowns, etc.
                if (typeof window !== 'undefined') {
                    const activeElement = document.activeElement as HTMLElement;
                    if (activeElement && activeElement.blur) {
                        activeElement.blur();
                    }
                }
            }

            // Handle arrow navigation
            if (
                [
                    'ArrowUp',
                    'ArrowDown',
                    'ArrowLeft',
                    'ArrowRight',
                    'Home',
                    'End',
                ].includes(event.key)
            ) {
                handleArrowNavigation(event);
            }

            // Handle custom shortcuts
            if (enableGlobalShortcuts) {
                for (const shortcut of shortcuts) {
                    const ctrlMatch = shortcut.ctrlKey
                        ? event.ctrlKey
                        : !event.ctrlKey;
                    const metaMatch = shortcut.metaKey
                        ? event.metaKey
                        : !event.metaKey;
                    const shiftMatch = shortcut.shiftKey
                        ? event.shiftKey
                        : !event.shiftKey;
                    const altMatch = shortcut.altKey
                        ? event.altKey
                        : !event.altKey;

                    if (
                        event.key.toLowerCase() ===
                            shortcut.key.toLowerCase() &&
                        ctrlMatch &&
                        metaMatch &&
                        shiftMatch &&
                        altMatch
                    ) {
                        event.preventDefault();
                        shortcut.action();
                        return;
                    }
                }
            }
        },
        [
            enableGlobalShortcuts,
            enableEscapeHandling,
            isHelpVisible,
            shortcuts,
            toggleHelp,
            handleArrowNavigation,
        ],
    );

    // Set up event listeners
    useEffect(() => {
        if (typeof window === 'undefined') return;

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Track focused element
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleFocus = (event: FocusEvent) => {
            setFocusedElement(event.target as HTMLElement);
        };

        document.addEventListener('focusin', handleFocus);
        return () => document.removeEventListener('focusin', handleFocus);
    }, []);

    return {
        isHelpVisible,
        setIsHelpVisible,
        toggleHelp,
        focusedElement,
        focusElement,
        navigateToElement,
        getFocusableElements,
    };
}

/**
 * Default keyboard shortcuts for the application
 */
export const defaultKeyboardShortcuts: KeyboardShortcut[] = [
    {
        key: 'b',
        ctrlKey: true,
        description: 'Toggle sidebar',
        action: () => {
            // This will be overridden by the component using it
        },
        category: 'Navigation',
    },
    {
        key: 'k',
        ctrlKey: true,
        description: 'Open command palette',
        action: () => {
            // This will be overridden by the component using it
        },
        category: 'Navigation',
    },
    {
        key: 'n',
        ctrlKey: true,
        description: 'Create new document',
        action: () => {
            // This will be overridden by the component using it
        },
        category: 'Actions',
    },
    {
        key: 'e',
        ctrlKey: true,
        description: 'Toggle edit mode',
        action: () => {
            // This will be overridden by the component using it
        },
        category: 'Editing',
    },
    {
        key: 's',
        ctrlKey: true,
        description: 'Save document',
        action: () => {
            // This will be overridden by the component using it
        },
        category: 'Editing',
    },
    {
        key: '/',
        description: 'Focus search',
        action: () => {
            // This will be overridden by the component using it
        },
        category: 'Navigation',
    },
    {
        key: 'h',
        ctrlKey: true,
        description: 'Go to home',
        action: () => {
            if (typeof window !== 'undefined') {
                window.location.href = '/home';
            }
        },
        category: 'Navigation',
    },
    {
        key: '?',
        shiftKey: true,
        description: 'Show keyboard shortcuts',
        action: () => {
            // This is handled directly in the hook
        },
        category: 'Help',
    },
];
