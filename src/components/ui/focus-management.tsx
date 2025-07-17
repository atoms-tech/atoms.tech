'use client';

import { useEffect, useRef } from 'react';

interface FocusTrapProps {
    children: React.ReactNode;
    active?: boolean;
    restoreFocus?: boolean;
    className?: string;
}

export function FocusTrap({
    children,
    active = true,
    restoreFocus = true,
    className,
}: FocusTrapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!active) return;

        // Store the currently focused element
        previouslyFocusedElement.current = document.activeElement as HTMLElement;

        const container = containerRef.current;
        if (!container) return;

        // Get all focusable elements within the container
        const getFocusableElements = () => {
            return container.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            ) as NodeListOf<HTMLElement>;
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const focusableElements = getFocusableElements();
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        // Focus the first focusable element
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        // Add event listener
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);

            // Restore focus to the previously focused element
            if (restoreFocus && previouslyFocusedElement.current) {
                previouslyFocusedElement.current.focus();
            }
        };
    }, [active, restoreFocus]);

    if (!active) {
        return <div className={className}>{children}</div>;
    }

    return (
        <div ref={containerRef} className={className}>
            {children}
        </div>
    );
}

interface AutoFocusProps {
    children: React.ReactNode;
    delay?: number;
}

export function AutoFocus({ children, delay = 0 }: AutoFocusProps) {
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            const element = elementRef.current;
            if (!element) return;

            // Find the first focusable element
            const focusableElement = element.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            ) as HTMLElement;

            if (focusableElement) {
                focusableElement.focus();
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [delay]);

    return <div ref={elementRef}>{children}</div>;
}

// Hook for managing focus programmatically
export function useFocusManagement() {
    const focusElement = (selector: string, delay = 0) => {
        if (typeof window === 'undefined') return;

        setTimeout(() => {
            const element = document.querySelector(selector) as HTMLElement;
            if (element) {
                element.focus();
            }
        }, delay);
    };

    const focusById = (id: string, delay = 0) => {
        focusElement(`#${id}`, delay);
    };

    const focusFirstInContainer = (containerSelector: string, delay = 0) => {
        if (typeof window === 'undefined') return;

        setTimeout(() => {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            const focusableElement = container.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            ) as HTMLElement;

            if (focusableElement) {
                focusableElement.focus();
            }
        }, delay);
    };

    const restoreFocus = (element: HTMLElement | null) => {
        if (element) {
            element.focus();
        }
    };

    return {
        focusElement,
        focusById,
        focusFirstInContainer,
        restoreFocus,
    };
}
