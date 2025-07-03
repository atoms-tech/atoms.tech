'use client';

import React, { useCallback, useEffect, useRef } from 'react';

export interface FocusableElement extends HTMLElement {
    focus(): void;
}

export interface UseFocusManagementOptions {
    trapFocus?: boolean;
    restoreFocus?: boolean;
    autoFocus?: boolean;
    focusableSelector?: string;
}

const DEFAULT_FOCUSABLE_SELECTOR = [
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'audio[controls]',
    'video[controls]',
    'iframe',
    'object',
    'embed',
    'area[href]',
    'summary',
].join(', ');

export function useFocusManagement(
    containerRef: React.RefObject<HTMLElement>,
    options: UseFocusManagementOptions = {},
) {
    const {
        trapFocus = false,
        restoreFocus = false,
        autoFocus = false,
        focusableSelector = DEFAULT_FOCUSABLE_SELECTOR,
    } = options;

    const previouslyFocusedElement = useRef<HTMLElement | null>(null);
    const isInitialized = useRef(false);

    const getFocusableElements = useCallback((): FocusableElement[] => {
        if (!containerRef.current) return [];

        const elements = Array.from(
            containerRef.current.querySelectorAll(focusableSelector),
        ) as FocusableElement[];

        return elements.filter((element) => {
            // Additional checks for truly focusable elements
            const style = window.getComputedStyle(element);
            return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                !element.hasAttribute('inert') &&
                element.offsetParent !== null
            );
        });
    }, [containerRef, focusableSelector]);

    const focusFirst = useCallback(() => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
            return true;
        }
        return false;
    }, [getFocusableElements]);

    const focusLast = useCallback(() => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[focusableElements.length - 1].focus();
            return true;
        }
        return false;
    }, [getFocusableElements]);

    const focusNext = useCallback(
        (wrap = true) => {
            const focusableElements = getFocusableElements();
            const currentIndex = focusableElements.findIndex(
                (element) => element === document.activeElement,
            );

            if (currentIndex === -1) {
                return focusFirst();
            }

            const nextIndex = currentIndex + 1;
            if (nextIndex < focusableElements.length) {
                focusableElements[nextIndex].focus();
                return true;
            } else if (wrap) {
                return focusFirst();
            }

            return false;
        },
        [getFocusableElements, focusFirst],
    );

    const focusPrevious = useCallback(
        (wrap = true) => {
            const focusableElements = getFocusableElements();
            const currentIndex = focusableElements.findIndex(
                (element) => element === document.activeElement,
            );

            if (currentIndex === -1) {
                return focusLast();
            }

            const previousIndex = currentIndex - 1;
            if (previousIndex >= 0) {
                focusableElements[previousIndex].focus();
                return true;
            } else if (wrap) {
                return focusLast();
            }

            return false;
        },
        [getFocusableElements, focusLast],
    );

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!trapFocus || !containerRef.current) return;

            if (event.key === 'Tab') {
                const focusableElements = getFocusableElements();
                if (focusableElements.length === 0) {
                    event.preventDefault();
                    return;
                }

                const firstElement = focusableElements[0];
                const lastElement =
                    focusableElements[focusableElements.length - 1];

                if (event.shiftKey) {
                    // Shift + Tab (backward)
                    if (document.activeElement === firstElement) {
                        event.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab (forward)
                    if (document.activeElement === lastElement) {
                        event.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        },
        [trapFocus, containerRef, getFocusableElements],
    );

    // Initialize focus management
    useEffect(() => {
        if (!containerRef.current || isInitialized.current) return;

        isInitialized.current = true;

        // Store previously focused element for restoration
        if (restoreFocus) {
            previouslyFocusedElement.current =
                document.activeElement as HTMLElement;
        }

        // Auto focus first element if requested
        if (autoFocus) {
            // Use setTimeout to ensure DOM is ready
            setTimeout(() => {
                focusFirst();
            }, 0);
        }

        // Add event listeners for focus trapping
        if (trapFocus) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            if (trapFocus) {
                document.removeEventListener('keydown', handleKeyDown);
            }

            // Restore focus when component unmounts
            if (restoreFocus && previouslyFocusedElement.current) {
                previouslyFocusedElement.current.focus();
            }
        };
    }, [trapFocus, restoreFocus, autoFocus, handleKeyDown, focusFirst]);

    return {
        focusFirst,
        focusLast,
        focusNext,
        focusPrevious,
        getFocusableElements,
    };
}

// Utility hook for managing focus visible state
export function useFocusVisible() {
    const [isFocusVisible, setIsFocusVisible] = React.useState(false);

    useEffect(() => {
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

    return isFocusVisible;
}
