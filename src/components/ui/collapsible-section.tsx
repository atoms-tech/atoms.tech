'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import React, { ReactNode, forwardRef, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import {
    chevronVariants,
    getAccessibleVariants,
    getTransition,
} from '@/lib/utils/collapsible-animations';

import { useCollapsibleState, type CollapsibleConfig } from '@/hooks/useCollapsibleState';

export interface CollapsibleSectionProps extends Omit<CollapsibleConfig, 'id'> {
    id: string;
    title?: ReactNode;
    children: ReactNode;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    disabled?: boolean;
    animationType?: 'content' | 'fade' | 'scale' | 'slide';
    animationSpeed?: 'fast' | 'normal' | 'slow';
    showChevron?: boolean;
    chevronPosition?: 'left' | 'right';
    onToggle?: (isOpen: boolean) => void;
    renderHeader?: (props: {
        isOpen: boolean;
        toggle: () => void;
        disabled?: boolean;
    }) => ReactNode;
    level?: number; // For nested sections
}

/**
 * Enhanced collapsible section component with persistence and animations
 * Supports nested sections, custom animations, and accessibility features
 */
export const CollapsibleSection = forwardRef<HTMLDivElement, CollapsibleSectionProps>(
    (
        {
            id,
            title,
            children,
            className,
            headerClassName,
            contentClassName,
            disabled = false,
            defaultOpen = false,
            persistKey,
            sessionOnly = false,
            animationType = 'content',
            animationSpeed = 'normal',
            showChevron = true,
            chevronPosition = 'right',
            onToggle,
            renderHeader,
            level = 0,
            ...props
        },
        ref
    ) => {
        const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
        const { isOpen, toggle } = useCollapsibleState({
            id,
            defaultOpen,
            persistKey,
            sessionOnly,
        });

        // Check for reduced motion preference
        useEffect(() => {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            setPrefersReducedMotion(mediaQuery.matches);

            const handleChange = (e: MediaQueryListEvent) => {
                setPrefersReducedMotion(e.matches);
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }, []);

        const handleToggle = () => {
            if (disabled) return;
            toggle();
            onToggle?.(!isOpen);
        };

        const handleKeyDown = (event: React.KeyboardEvent) => {
            if (disabled) return;
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleToggle();
            }
        };

        const variants = getAccessibleVariants(animationType, prefersReducedMotion);
        const transition = getTransition(animationSpeed);

        // Generate ARIA attributes
        const headerId = `${id}-header`;
        const contentId = `${id}-content`;

        // Default header renderer
        const defaultHeader = (
            <div
                className={cn(
                    'flex items-center justify-between w-full cursor-pointer select-none',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm',
                    disabled && 'cursor-not-allowed opacity-50',
                    chevronPosition === 'left' && 'flex-row-reverse',
                    headerClassName
                )}
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                tabIndex={disabled ? -1 : 0}
                role="button"
                aria-expanded={isOpen}
                aria-controls={contentId}
                id={headerId}
            >
                {title && (
                    <div className={cn('flex-1', chevronPosition === 'left' && 'text-right')}>
                        {title}
                    </div>
                )}
                {showChevron && (
                    <motion.div
                        variants={chevronVariants}
                        animate={isOpen ? 'expanded' : 'collapsed'}
                        transition={transition}
                        className={cn(
                            'flex-shrink-0',
                            chevronPosition === 'left' ? 'mr-2' : 'ml-2'
                        )}
                    >
                        <ChevronDown className="h-4 w-4" />
                    </motion.div>
                )}
            </div>
        );

        return (
            <div
                ref={ref}
                className={cn(
                    'collapsible-section',
                    level > 0 && 'ml-4 border-l border-border pl-4',
                    className
                )}
                data-level={level}
                {...props}
            >
                {/* Header */}
                {renderHeader ? (
                    renderHeader({ isOpen, toggle: handleToggle, disabled })
                ) : (
                    defaultHeader
                )}

                {/* Content */}
                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            key={`${id}-content`}
                            variants={variants}
                            initial="collapsed"
                            animate="expanded"
                            exit="collapsed"
                            transition={transition}
                            className={cn('collapsible-content', contentClassName)}
                            id={contentId}
                            role="region"
                            aria-labelledby={headerId}
                        >
                            <div className="pt-2">{children}</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }
);

CollapsibleSection.displayName = 'CollapsibleSection';

/**
 * Nested collapsible section with automatic level detection
 */
export const NestedCollapsibleSection = forwardRef<
    HTMLDivElement,
    Omit<CollapsibleSectionProps, 'level'>
>(({ ...props }, ref) => {
    const [level, setLevel] = useState(0);

    useEffect(() => {
        // Find the nesting level by counting parent collapsible sections
        let element = ref && 'current' in ref ? ref.current?.parentElement : null;
        let currentLevel = 0;

        while (element) {
            if (element.classList.contains('collapsible-section')) {
                currentLevel++;
            }
            element = element.parentElement;
        }

        setLevel(currentLevel);
    }, [ref]);

    return <CollapsibleSection ref={ref} level={level} {...props} />;
});

NestedCollapsibleSection.displayName = 'NestedCollapsibleSection';
