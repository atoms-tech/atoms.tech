'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FoldingCardProps extends React.ComponentProps<typeof Card> {
    icon?: React.ReactElement<SVGSVGElement>;
    title: string;
    defaultOpen?: boolean;
    disabled?: boolean;
    contentClassName?: string;
}

export function FoldingCard({
    icon,
    title,
    defaultOpen = false,
    disabled = false,
    className,
    contentClassName,
    children,
    ...props
}: FoldingCardProps) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
        <Card className={cn('p-6', className)} {...props}>
            <button
                className="flex items-center gap-4 w-full"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
            >
                {icon && (
                    <div className="rounded-full bg-primary/10 p-3">
                        {React.cloneElement(icon, {
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
