'use client';

import React, { ReactNode, memo } from 'react';

import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ToggleProps {
    icon: ReactNode;
    activeIcon?: ReactNode;
    tooltip: string;
    isActive?: boolean;
    onClick: () => void;
    className?: string;
    tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
    showTooltip?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'ghost' | 'outline' | 'destructive';
}

const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
};

const BaseToggle = memo(
    ({
        icon,
        activeIcon,
        tooltip,
        isActive = false,
        onClick,
        className,
        tooltipSide = 'right',
        showTooltip = true,
        size = 'md',
        variant = 'ghost',
    }: ToggleProps) => {
        // Determine which icon to display
        const displayIcon = isActive && activeIcon ? activeIcon : icon;

        const buttonContent = (
            <Button
                variant={variant}
                size="icon"
                onClick={onClick}
                className={cn(sizeClasses[size], className)}
                aria-pressed={isActive}
            >
                {displayIcon}
                <span className="sr-only">{tooltip}</span>
            </Button>
        );

        // If tooltips are disabled, just return the button
        if (!showTooltip) {
            return buttonContent;
        }

        // Otherwise, wrap in tooltip
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                    <TooltipContent side={tooltipSide}>
                        <p>{tooltip}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    },
);

// Display name for debugging
BaseToggle.displayName = 'BaseToggle';

export default BaseToggle;
