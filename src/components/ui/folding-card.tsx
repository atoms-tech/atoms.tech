'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';
import { cloneElement, useState } from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { CollapsibleSection } from './collapsible-section';

interface FoldingCardProps extends ComponentProps<typeof Card> {
    icon?: ReactElement<SVGSVGElement>;
    title: string;
    defaultOpen?: boolean;
    disabled?: boolean;
    contentClassName?: string;
    // New props for enhanced functionality
    persistKey?: string;
    sessionOnly?: boolean;
    animationType?: 'content' | 'fade' | 'scale' | 'slide';
    animationSpeed?: 'fast' | 'normal' | 'slow';
    onToggle?: (isOpen: boolean) => void;
    // Legacy mode for backward compatibility
    legacyMode?: boolean;
}

/**
 * Enhanced FoldingCard component with optional persistence and animations
 * Maintains backward compatibility while offering new features
 */
export function FoldingCard({
    icon,
    title,
    defaultOpen = false,
    disabled = false,
    className,
    contentClassName,
    children,
    persistKey,
    sessionOnly = false,
    animationType = 'content',
    animationSpeed = 'normal',
    onToggle,
    legacyMode = false,
    ...props
}: FoldingCardProps) {
    // Legacy implementation for backward compatibility
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (legacyMode) {
        return (
            <Card className={cn(`p-6 cursor-pointer`, className)} {...props}>
                <button
                    className="flex items-center gap-4 w-full cursor-pointer"
                    onClick={() => {
                        const newState = !isOpen;
                        setIsOpen(newState);
                        onToggle?.(newState);
                    }}
                    disabled={disabled}
                >
                    {icon && (
                        <div className="rounded-full bg-primary/10 dark:bg-gray-800 p-3">
                            {cloneElement(icon, {
                                className: 'h-6 w-6 text-primary',
                            })}
                        </div>
                    )}
                    <div className="flex-grow text-left">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold mb-1">{title}</h3>
                            {isOpen ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </div>
                    </div>
                </button>
                {isOpen && (
                    <div className={cn('mt-4', icon && 'ml-16', contentClassName)}>
                        {children}
                    </div>
                )}
            </Card>
        );
    }

    // Enhanced implementation using CollapsibleSection
    const cardId = persistKey || `folding-card-${title.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <Card className={cn('p-6', className)} {...props}>
            <CollapsibleSection
                id={cardId}
                defaultOpen={defaultOpen}
                disabled={disabled}
                persistKey={persistKey}
                sessionOnly={sessionOnly}
                animationType={animationType}
                animationSpeed={animationSpeed}
                onToggle={onToggle}
                showChevron={false} // We'll render our own chevron
                renderHeader={({ isOpen, toggle }) => (
                    <button
                        className="flex items-center gap-4 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                        onClick={toggle}
                        disabled={disabled}
                    >
                        {icon && (
                            <div className="rounded-full bg-primary/10 dark:bg-gray-800 p-3">
                                {cloneElement(icon, {
                                    className: 'h-6 w-6 text-primary',
                                })}
                            </div>
                        )}
                        <div className="flex-grow text-left">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold mb-1">{title}</h3>
                                {isOpen ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </div>
                        </div>
                    </button>
                )}
                contentClassName={cn('mt-4', icon && 'ml-16', contentClassName)}
            >
                {children}
            </CollapsibleSection>
        </Card>
    );
}
