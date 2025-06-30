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
                // Base styles - hidden by default
                'absolute left-[-10000px] top-auto w-1 h-1 overflow-hidden',
                // Focus styles - visible when focused
                'focus:left-6 focus:top-6 focus:w-auto focus:h-auto focus:overflow-visible',
                'focus:bg-primary focus:text-primary-foreground',
                'focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg',
                'focus:z-50 focus:outline-none focus:ring-2 focus:ring-ring',
                'transition-all duration-200',
                className
            )}
            onFocus={(e) => {
                // Ensure the skip link is visible when focused
                e.currentTarget.style.position = 'fixed';
            }}
            onBlur={(e) => {
                // Reset position when focus is lost
                e.currentTarget.style.position = 'absolute';
            }}
        >
            {children}
        </a>
    );
}

interface SkipLinksProps {
    links: Array<{
        href: string;
        label: string;
    }>;
    className?: string;
}

export function SkipLinks({ links, className }: SkipLinksProps) {
    return (
        <nav
            className={cn('sr-only focus-within:not-sr-only', className)}
            aria-label="Skip navigation"
        >
            {links.map((link, index) => (
                <SkipLink key={index} href={link.href}>
                    {link.label}
                </SkipLink>
            ))}
        </nav>
    );
}

// Common skip link configurations
export const DEFAULT_SKIP_LINKS = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#navigation', label: 'Skip to navigation' },
    { href: '#sidebar', label: 'Skip to sidebar' },
    { href: '#footer', label: 'Skip to footer' },
];

export const DASHBOARD_SKIP_LINKS = [
    { href: '#main-content', label: 'Skip to main content' },
    { href: '#sidebar', label: 'Skip to sidebar' },
    { href: '#project-list', label: 'Skip to project list' },
    { href: '#user-menu', label: 'Skip to user menu' },
];

export const EDITOR_SKIP_LINKS = [
    { href: '#main-content', label: 'Skip to editor' },
    { href: '#toolbar', label: 'Skip to toolbar' },
    { href: '#sidebar', label: 'Skip to sidebar' },
    { href: '#properties-panel', label: 'Skip to properties' },
];
