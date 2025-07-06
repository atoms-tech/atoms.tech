'use client';

import { Wrench } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

interface InProgressContainerProps {
    children: React.ReactNode;
    title: string;
    description?: string;
    className?: string;
    requiresModal?: boolean;
    onModalOpen?: () => void;
}

export function InProgressContainer({
    children,
    title,
    description,
    className,
    requiresModal = false,
    onModalOpen,
}: InProgressContainerProps) {
    const handleClick = () => {
        if (requiresModal && onModalOpen) {
            onModalOpen();
        }
    };

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/30 p-4',
                requiresModal &&
                    'cursor-pointer hover:border-muted-foreground/50',
                className,
            )}
            onClick={handleClick}
        >
            {/* Content */}
            <div className="relative z-10">{children}</div>

            {/* Overlay */}
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm dark:bg-background/60">
                <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="flex items-center space-x-2 rounded-full bg-muted px-3 py-1.5">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                            In Progress
                        </span>
                    </div>
                    {title && (
                        <h4 className="text-sm font-medium text-foreground">
                            {title}
                        </h4>
                    )}
                    {description && (
                        <p className="text-xs text-muted-foreground max-w-xs">
                            {description}
                        </p>
                    )}
                    {requiresModal && (
                        <p className="text-xs text-muted-foreground">
                            Click to learn more
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
