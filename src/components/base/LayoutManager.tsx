'use client';

import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';

import AppSidebar from '@/components/base/AppSidebar';
import { EditModeFloatingToggle } from '@/components/custom/BlockCanvas/components/EditModeToggle';
import HorizontalToolbar from '@/components/custom/HorizontalToolbar';
import VerticalToolbar from '@/components/custom/VerticalToolbar';
import { Sidebar } from '@/components/ui/sidebar';
import { LayoutProvider, useLayout } from '@/lib/providers/layout.provider';
import { cn } from '@/lib/utils';

interface LayoutManagerProps {
    children: React.ReactNode;
}

/**
 * LayoutManager orchestrates the application layout with responsiveness and animations
 * while preserving the original UI appearance
 */
const LayoutManagerInternal = ({ children }: LayoutManagerProps) => {
    const {
        sidebarState,
        isMobile,
        isTablet,
        isDocumentPage,
        setCurrentPath,
        toggleSidebar,
    } = useLayout();

    const pathname = usePathname();
    const _isSidebarExpanded = sidebarState === 'expanded';

    // Update current path in layout context
    useEffect(() => {
        if (pathname) {
            setCurrentPath(pathname);
        }
    }, [pathname, setCurrentPath]);

    // Show vertical toolbar only when sidebar is collapsed and on desktop
    const showVerticalToolbar = !isMobile && !isTablet;

    // Show horizontal toolbar on mobile and tablet
    const showHorizontalToolbar = isMobile || isTablet;

    return (
        <Sidebar
            defaultOpen={_isSidebarExpanded}
            open={_isSidebarExpanded}
            onOpenChange={(open) => {
                if (open !== _isSidebarExpanded) {
                    toggleSidebar();
                }
            }}
        >
            {/* Sidebar */}
            <AppSidebar />

            {/* Main content area with animation */}
            {/* Content wrapper */}
            <div
                className={cn(
                    'flex-1 p-4 md:p-6 lg:p-8 xl:p-16',
                    isMobile && 'pt-16', // Extra padding for mobile toolbar
                )}
            >
                {children}
            </div>

            {/* Floating edit button for document pages */}
            {isDocumentPage && !isMobile && <EditModeFloatingToggle />}

            {/* Vertical toolbar - only on desktop when sidebar is collapsed */}
            {showVerticalToolbar && <VerticalToolbar />}

            {/* Horizontal toolbar - only on mobile/tablet */}
            {showHorizontalToolbar && <HorizontalToolbar />}
        </Sidebar>
    );
};

const LayoutManager = ({ children }: LayoutManagerProps) => {
    return (
        <LayoutProvider>
            <LayoutManagerInternal>{children}</LayoutManagerInternal>
        </LayoutProvider>
    );
};

export default LayoutManager;
