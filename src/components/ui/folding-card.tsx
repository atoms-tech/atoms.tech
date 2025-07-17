'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';
import { cloneElement, useState } from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FoldingCardProps extends ComponentProps<typeof Card> {
    icon?: ReactElement<SVGSVGElement>;
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
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card className={cn(`p-6 cursor-pointer`, className)} {...props}>
            <button
                className="flex items-center gap-4 w-full cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
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
