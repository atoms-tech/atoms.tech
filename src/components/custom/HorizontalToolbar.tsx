'use client';

import { Lock, Unlock } from 'lucide-react';
import React, { memo } from 'react';

import Breadcrumb from '@/components/custom/Breadcrumb';
import { LayoutViewToggle } from '@/components/custom/toggles/LayoutViewToggle';
import ThemeToggle from '@/components/custom/toggles/ThemeToggle';
import { ViewModeToggle } from '@/components/custom/toggles/ViewModeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLayout } from '@/lib/providers/layout.provider';
import { useDocumentStore } from '@/lib/store/document.store';
import { cn } from '@/lib/utils';

interface HorizontalToolbarProps {
    className?: string;
}

/**
 * Horizontal toolbar component for mobile and tablet layouts
 * Displays a top bar with sidebar trigger, breadcrumb, and toolbar buttons
 */
const HorizontalToolbar = memo(({ className }: HorizontalToolbarProps) => {
    const { isDocumentPage, toggleSidebar } = useLayout();
    const { isEditMode, setIsEditMode } = useDocumentStore();

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    return (
        <div
            className={cn(
                'fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-background/80 backdrop-blur-sm border-b border-border/40',
                className,
            )}
        >
            {/* Left section with sidebar trigger and breadcrumb */}
            <div className="flex items-center gap-2">
                <SidebarTrigger className="h-5 w-5" onClick={toggleSidebar} />
                <Breadcrumb className="ml-2" />
            </div>

            {/* Right section with toggle buttons */}
            <div className="flex items-center gap-2">
                {isDocumentPage && (
                    <button
                        onClick={toggleEditMode}
                        className="p-2 rounded-md hover:bg-muted"
                    >
                        {isEditMode ? (
                            <Unlock className="h-5 w-5" />
                        ) : (
                            <Lock className="h-5 w-5" />
                        )}
                    </button>
                )}
                <ThemeToggle />
                <ViewModeToggle />
                <LayoutViewToggle />
            </div>
        </div>
    );
});

// Display name for debugging
HorizontalToolbar.displayName = 'HorizontalToolbar';

export default HorizontalToolbar;
