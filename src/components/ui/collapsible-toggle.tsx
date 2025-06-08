'use client';

import { ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';
import React, { ReactNode } from 'react';

import BaseToggle, { type ToggleProps } from '@/components/custom/toggles/BaseToggle';
import { cn } from '@/lib/utils';

export interface CollapsibleToggleProps extends Omit<ToggleProps, 'icon' | 'activeIcon'> {
    iconType?: 'chevron' | 'plus-minus' | 'custom';
    icon?: ReactNode;
    activeIcon?: ReactNode;
    direction?: 'horizontal' | 'vertical';
}

/**
 * Standalone toggle component for controlling collapsible sections
 * Extends the existing BaseToggle with collapsible-specific icons and behaviors
 */
export function CollapsibleToggle({
    iconType = 'chevron',
    icon: customIcon,
    activeIcon: customActiveIcon,
    direction = 'vertical',
    isActive = false,
    className,
    ...props
}: CollapsibleToggleProps) {
    // Determine icons based on type and direction
    const getIcons = () => {
        if (customIcon && customActiveIcon) {
            return { icon: customIcon, activeIcon: customActiveIcon };
        }

        switch (iconType) {
            case 'plus-minus':
                return {
                    icon: <Plus className="h-[1.2rem] w-[1.2rem]" />,
                    activeIcon: <Minus className="h-[1.2rem] w-[1.2rem]" />,
                };
            case 'chevron':
            default:
                if (direction === 'horizontal') {
                    return {
                        icon: <ChevronRight className="h-[1.2rem] w-[1.2rem]" />,
                        activeIcon: <ChevronDown className="h-[1.2rem] w-[1.2rem]" />,
                    };
                } else {
                    return {
                        icon: <ChevronDown className="h-[1.2rem] w-[1.2rem]" />,
                        activeIcon: <ChevronDown className="h-[1.2rem] w-[1.2rem] rotate-180" />,
                    };
                }
        }
    };

    const { icon, activeIcon } = getIcons();

    return (
        <BaseToggle
            icon={icon}
            activeIcon={activeIcon}
            isActive={isActive}
            className={cn(
                'collapsible-toggle',
                iconType === 'chevron' && 'transition-transform duration-200',
                className
            )}
            {...props}
        />
    );
}

/**
 * Group toggle component for controlling multiple collapsible sections
 */
export interface CollapsibleGroupToggleProps {
    allOpen: boolean;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    onToggleAll: () => void;
    expandAllTooltip?: string;
    collapseAllTooltip?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function CollapsibleGroupToggle({
    allOpen,
    onExpandAll,
    onCollapseAll,
    onToggleAll: _onToggleAll,
    expandAllTooltip = 'Expand All',
    collapseAllTooltip = 'Collapse All',
    className,
    size = 'md',
}: CollapsibleGroupToggleProps) {
    return (
        <div className={cn('flex items-center gap-1', className)}>
            <CollapsibleToggle
                iconType="plus-minus"
                tooltip={expandAllTooltip}
                onClick={onExpandAll}
                size={size}
                disabled={allOpen}
            />
            <CollapsibleToggle
                iconType="plus-minus"
                tooltip={collapseAllTooltip}
                onClick={onCollapseAll}
                size={size}
                disabled={!allOpen}
                isActive={true}
            />
        </div>
    );
}

/**
 * Smart toggle that automatically determines state from target element
 */
export interface SmartCollapsibleToggleProps extends Omit<CollapsibleToggleProps, 'isActive'> {
    targetId: string;
    onToggle?: (isOpen: boolean) => void;
}

export function SmartCollapsibleToggle({
    targetId,
    onToggle,
    ...props
}: SmartCollapsibleToggleProps) {
    const [isActive, setIsActive] = React.useState(false);

    React.useEffect(() => {
        const targetElement = document.getElementById(targetId);
        if (!targetElement) return;

        // Check if target is expanded based on aria-expanded or data attributes
        const checkExpanded = () => {
            const ariaExpanded = targetElement.getAttribute('aria-expanded');
            const dataExpanded = targetElement.getAttribute('data-expanded');
            return ariaExpanded === 'true' || dataExpanded === 'true';
        };

        setIsActive(checkExpanded());

        // Set up mutation observer to watch for changes
        const observer = new MutationObserver(() => {
            setIsActive(checkExpanded());
        });

        observer.observe(targetElement, {
            attributes: true,
            attributeFilter: ['aria-expanded', 'data-expanded'],
        });

        return () => observer.disconnect();
    }, [targetId]);

    const handleToggle = () => {
        const newState = !isActive;
        setIsActive(newState);
        onToggle?.(newState);

        // Dispatch custom event for the target element
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.dispatchEvent(
                new CustomEvent('collapsible-toggle', {
                    detail: { isOpen: newState },
                    bubbles: true,
                })
            );
        }
    };

    return (
        <CollapsibleToggle
            isActive={isActive}
            onClick={handleToggle}
            {...props}
        />
    );
}
