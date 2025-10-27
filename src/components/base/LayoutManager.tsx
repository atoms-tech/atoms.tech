'use client';

import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';

import AppSidebar from '@/components/base/AppSidebar';
import { AgentDemo } from '@/components/custom/AgentChat';
import { useAgentStore } from '@/components/custom/AgentChat/hooks/useAgentStore';
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
        isLayoutReady,
        sidebarState,
        isMobile,
        isTablet,
        isDocumentPage,
        setCurrentPath,
        toggleSidebar,
    } = useLayout();

    // Get agent panel state for layout adjustments
    const { isOpen: isAgentPanelOpen, panelWidth } = useAgentStore();

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

    // Calculate right margin for main content when agent panel is open
    // Only apply on desktop (md and above) - mobile/tablet keep overlay behavior
    const rightMargin = !isMobile && !isTablet && isAgentPanelOpen ? panelWidth : 0;

    // If layout is not ready, render a minimal container with loading spinner to prevent layout shift
    if (!isLayoutReady) {
        return (
            <div className="w-full h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
            </div>
        );
    }

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

            {/* Main content area with animation and right margin for agent panel */}
            {/* Content wrapper */}
            <div
                className={cn(
                    'flex-1 md:pl-6 lg:pl-8 pt-16 transition-all duration-300 ease-out',
                    showHorizontalToolbar && 'pt-16', // Extra padding when horizontal toolbar is active
                )}
                style={{
                    marginRight: `${rightMargin}px`,
                }}
            >
                {children}
            </div>

            {/* Floating edit button for document pages */}
            {isDocumentPage && !isMobile && <EditModeFloatingToggle />}

            {/* Vertical toolbar - only on desktop when sidebar is collapsed */}
            {showVerticalToolbar && <VerticalToolbar />}

            {/* Horizontal toolbar - only on mobile/tablet */}
            {showHorizontalToolbar && <HorizontalToolbar />}

            {/* Agent Demo - positioned on the right side */}
            <AgentDemo autoInit={false} />
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