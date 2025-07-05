'use client';

import { ExternalLink, Link, X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onLinkToRequirement: () => void;
    onOpenExternalLink?: () => void;
    hasExistingLink?: boolean;
    existingLinkUrl?: string;
    className?: string;
}

export const CustomContextMenu: React.FC<ContextMenuProps> = ({
    x,
    y,
    onClose,
    onLinkToRequirement,
    onOpenExternalLink,
    hasExistingLink = false,
    existingLinkUrl,
    className,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click or ESC key
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Adjust position if menu would go off screen
    const adjustedPosition = React.useMemo(() => {
        if (!menuRef.current) return { x, y };

        const menuRect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let adjustedX = x;
        let adjustedY = y;

        // Adjust horizontal position
        if (x + menuRect.width > viewportWidth) {
            adjustedX = viewportWidth - menuRect.width - 10;
        }

        // Adjust vertical position
        if (y + menuRect.height > viewportHeight) {
            adjustedY = viewportHeight - menuRect.height - 10;
        }

        return { x: Math.max(10, adjustedX), y: Math.max(10, adjustedY) };
    }, [x, y]);

    const isValidAtomsUrl = (url: string): boolean => {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;

            // Check for allowed domains
            const allowedDomains = [
                'localhost',
                'atoms.tech',
                'www.atoms.tech',
            ];

            // Check for Vercel deployment URLs
            const isVercelApp = hostname.endsWith('.vercel.app');
            const isAllowedDomain = allowedDomains.some(
                (domain) =>
                    hostname === domain || hostname.endsWith(`.${domain}`),
            );

            return isAllowedDomain || isVercelApp;
        } catch {
            return false;
        }
    };

    const handleLinkToRequirement = () => {
        onLinkToRequirement();
        onClose();
    };

    const handleOpenExternalLink = () => {
        if (onOpenExternalLink) {
            onOpenExternalLink();
        }
        onClose();
    };

    return (
        <div
            ref={menuRef}
            className={cn(
                'fixed z-[9999] bg-popover border border-border shadow-lg min-w-[200px]',
                'animate-in fade-in-0 zoom-in-95 duration-100',
                className,
            )}
            style={{
                left: adjustedPosition.x,
                top: adjustedPosition.y,
            }}
            role="menu"
            aria-label="Context menu"
        >
            <div className="p-1">
                {/* Header */}
                <div className="flex items-center justify-between px-2 py-1 border-b border-border mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                        Element Actions
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={onClose}
                        aria-label="Close menu"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>

                {/* Link to Requirement */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 h-8 px-2 text-sm"
                    onClick={handleLinkToRequirement}
                >
                    <Link className="h-4 w-4" />
                    {hasExistingLink
                        ? 'Update Requirement Link'
                        : 'Link to Requirement'}
                </Button>

                {/* Open External Link (if exists) */}
                {hasExistingLink &&
                    existingLinkUrl &&
                    isValidAtomsUrl(existingLinkUrl) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 h-8 px-2 text-sm"
                            onClick={handleOpenExternalLink}
                        >
                            <ExternalLink className="h-4 w-4" />
                            Open Requirement
                        </Button>
                    )}

                {/* Existing Link Info */}
                {hasExistingLink && existingLinkUrl && (
                    <div className="px-2 py-1 mt-1 border-t border-border">
                        <div className="text-xs text-muted-foreground mb-1">
                            Current Link:
                        </div>
                        <div
                            className="text-xs text-primary truncate max-w-[180px]"
                            title={existingLinkUrl}
                        >
                            {existingLinkUrl}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
