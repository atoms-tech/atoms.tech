'use client';

import { cn } from '@/lib/utils';

interface SkipLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
    return (
        <a
            href={href}
            className={cn(
                // Skip link styles - hidden by default, visible on focus
                'skip-link absolute left-[-9999px] top-4 z-[100] px-4 py-2 text-sm font-medium',
                'bg-primary text-primary-foreground rounded-md shadow-lg',
                'focus:left-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'transition-all duration-200 ease-in-out',
                className,
            )}
            onFocus={(e) => {
                // Ensure the link is visible when focused
                e.currentTarget.style.left = '1rem';
            }}
            onBlur={(e) => {
                // Hide the link when focus is lost
                e.currentTarget.style.left = '-9999px';
            }}
        >
            {children}
        </a>
    );
}

export function SkipLinks() {
    return (
        <>
            <SkipLink href="#main-content">Skip to main content</SkipLink>
            <SkipLink href="#primary-navigation">Skip to navigation</SkipLink>
        </>
    );
}
