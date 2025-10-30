'use client';

import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';

import AppSidebar from '@/components/base/AppSidebar';
import { AgentDemo } from '@/components/custom/AgentChat';
import { useAgentStore } from '@/components/custom/AgentChat/hooks/useAgentStore';
import HorizontalToolbar from '@/components/custom/HorizontalToolbar';
import LayoutViewToggle from '@/components/custom/toggles/LayoutViewToggle';
import ThemeToggle from '@/components/custom/toggles/ThemeToggle';
import { Sidebar } from '@/components/ui/sidebar';
import { LayoutProvider, useLayout } from '@/lib/providers/layout.provider';

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

            {/* Top Bar for sidebar trigger, breadcrumbs, and avatar */}
            <HorizontalToolbar />

            {/* Main Content Area */}
            <div
                className="flex-1 transition-all duration-200 ease-linear pt-16"
                style={{
                    marginRight: `${rightMargin}px`,
                }}
            >
                {/* Toggles for Theme and Layout */}
                <div className="fixed z-30 flex flex-col gap-2 m-1 bg-background">
                    <ThemeToggle />
                    <LayoutViewToggle />
                </div>
                <div className="flex flex-row">
                    {/* Hidden div used to allocate space for toggles*/}
                    <div className="w-10" />
                    {/* Actual Page Content */}
                    {children}
                </div>
            </div>

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
