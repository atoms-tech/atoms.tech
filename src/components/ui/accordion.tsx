'use client';

import React, { ReactNode, createContext, useContext, useState } from 'react';

import { cn } from '@/lib/utils';

import { CollapsibleSection, type CollapsibleSectionProps } from './collapsible-section';

export interface AccordionItem {
    id: string;
    title: ReactNode;
    content: ReactNode;
    disabled?: boolean;
    defaultOpen?: boolean;
}

export interface AccordionProps {
    items: AccordionItem[];
    type?: 'single' | 'multiple';
    className?: string;
    itemClassName?: string;
    allowToggle?: boolean; // For single type, allow closing the open item
    persistKey?: string;
    sessionOnly?: boolean;
    animationType?: 'content' | 'fade' | 'scale' | 'slide';
    animationSpeed?: 'fast' | 'normal' | 'slow';
    onValueChange?: (value: string | string[]) => void;
}

interface AccordionContextType {
    type: 'single' | 'multiple';
    openItems: Set<string>;
    toggleItem: (id: string) => void;
    allowToggle: boolean;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

function useAccordion() {
    const context = useContext(AccordionContext);
    if (!context) {
        throw new Error('useAccordion must be used within an Accordion');
    }
    return context;
}

/**
 * Enhanced accordion component built on top of CollapsibleSection
 * Supports single/multiple selection modes with persistence
 */
export function Accordion({
    items,
    type = 'multiple',
    className,
    itemClassName,
    allowToggle = true,
    persistKey,
    sessionOnly = false,
    animationType = 'content',
    animationSpeed = 'normal',
    onValueChange,
}: AccordionProps) {
    const [openItems, setOpenItems] = useState<Set<string>>(() => {
        // Initialize with default open items
        const defaultOpen = new Set<string>();
        items.forEach(item => {
            if (item.defaultOpen) {
                defaultOpen.add(item.id);
            }
        });
        return defaultOpen;
    });

    const toggleItem = (id: string) => {
        setOpenItems(prev => {
            const newOpenItems = new Set(prev);

            if (type === 'single') {
                // Single mode: only one item can be open
                if (newOpenItems.has(id)) {
                    if (allowToggle) {
                        newOpenItems.clear();
                    }
                } else {
                    newOpenItems.clear();
                    newOpenItems.add(id);
                }
            } else {
                // Multiple mode: toggle the item
                if (newOpenItems.has(id)) {
                    newOpenItems.delete(id);
                } else {
                    newOpenItems.add(id);
                }
            }

            // Notify parent of changes
            if (onValueChange) {
                if (type === 'single') {
                    onValueChange(newOpenItems.size > 0 ? Array.from(newOpenItems)[0] : '');
                } else {
                    onValueChange(Array.from(newOpenItems));
                }
            }

            return newOpenItems;
        });
    };

    const contextValue: AccordionContextType = {
        type,
        openItems,
        toggleItem,
        allowToggle,
    };

    return (
        <AccordionContext.Provider value={contextValue}>
            <div className={cn('accordion space-y-2', className)} role="region">
                {items.map((item, index) => (
                    <AccordionItem
                        key={item.id}
                        item={item}
                        className={itemClassName}
                        persistKey={persistKey ? `${persistKey}-${item.id}` : undefined}
                        sessionOnly={sessionOnly}
                        animationType={animationType}
                        animationSpeed={animationSpeed}
                        index={index}
                    />
                ))}
            </div>
        </AccordionContext.Provider>
    );
}

interface AccordionItemProps {
    item: AccordionItem;
    className?: string;
    persistKey?: string;
    sessionOnly?: boolean;
    animationType?: 'content' | 'fade' | 'scale' | 'slide';
    animationSpeed?: 'fast' | 'normal' | 'slow';
    index: number;
}

function AccordionItem({
    item,
    className,
    persistKey: _persistKey,
    sessionOnly,
    animationType,
    animationSpeed,
    index: _index,
}: AccordionItemProps) {
    const { openItems, toggleItem } = useAccordion();
    const isOpen = openItems.has(item.id);

    const handleToggle = () => {
        if (!item.disabled) {
            toggleItem(item.id);
        }
    };

    // Override the collapsible section's internal state management
    // since the accordion manages the state
    const collapsibleProps: Partial<CollapsibleSectionProps> = {
        id: item.id,
        title: item.title,
        disabled: item.disabled,
        persistKey: undefined, // Accordion manages persistence
        sessionOnly,
        animationType,
        animationSpeed,
        className: cn(
            'accordion-item border border-border rounded-lg p-4',
            'hover:bg-muted/50 transition-colors',
            item.disabled && 'opacity-50 cursor-not-allowed',
            className
        ),
        headerClassName: 'py-2',
        contentClassName: 'pt-2',
        onToggle: handleToggle,
        renderHeader: ({ toggle, disabled }) => (
            <div
                className={cn(
                    'flex items-center justify-between w-full cursor-pointer select-none',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm',
                    disabled && 'cursor-not-allowed'
                )}
                onClick={toggle}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle();
                    }
                }}
                tabIndex={disabled ? -1 : 0}
                role="button"
                aria-expanded={isOpen}
                id={`accordion-header-${item.id}`}
            >
                <div className="flex-1 text-left font-medium">
                    {item.title}
                </div>
                <div className="flex-shrink-0 ml-2">
                    <svg
                        className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            isOpen && 'rotate-180'
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
            </div>
        ),
    };

    return (
        <CollapsibleSection {...collapsibleProps}>
            {item.content}
        </CollapsibleSection>
    );
}
