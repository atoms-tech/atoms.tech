'use client';

import React, { useEffect, useState } from 'react';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/custom/toggles/ThemeToggle';
import { ViewModeToggle } from '@/components/custom/toggles/ViewModeToggle';
import Breadcrumb from '@/components/custom/Breadcrumb';
import { cn } from '@/lib/utils';

const VerticalToolbar = () => {
    const { state } = useSidebar();
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            // Use a more precise breakpoint system
            const width = window.innerWidth;
            setIsMobile(width < 640);
            setIsTablet(width >= 640 && width < 1024);
        };

        // Initial check
        handleResize();

        // Debounce the resize handler for better performance
        let timeoutId: NodeJS.Timeout;
        const debouncedResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleResize, 100);
        };

        window.addEventListener('resize', debouncedResize);

        return () => {
            window.removeEventListener('resize', debouncedResize);
            clearTimeout(timeoutId);
        };
    }, []);

    if (isMobile || isTablet) {
        // Mobile and tablet layout - horizontal toolbar at the top
        return (
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <SidebarTrigger
                        className={cn('h-5 w-5', isTablet && 'ml-2')}
                    />
                    <Breadcrumb className={cn('ml-0', isTablet && 'ml-2')} />
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <ViewModeToggle />
                </div>
            </div>
        );
    }

    // Desktop layout - vertical toolbar with horizontal breadcrumb
    return (
        <>
            {/* Floating toolbar buttons */}
            <div
                className={cn(
                    'fixed top-0 z-40 flex flex-col gap-2 pt-4 w-auto',
                    state === 'expanded' ? 'left-[14.25rem]' : 'left-0',
                )}
            >
                <div className="w-10 h-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md hover:bg-background/90 transition-colors">
                    <SidebarTrigger className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md hover:bg-background/90 transition-colors">
                    <ThemeToggle />
                </div>
                <div className="w-10 h-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md hover:bg-background/90 transition-colors">
                    <ViewModeToggle />
                </div>
            </div>

            {/* Horizontal breadcrumb bar */}
            <div
                className={cn(
                    'fixed top-0 right-0 z-40 h-10 flex items-center bg-background/80 backdrop-blur-sm transition-all duration-300 ease-in-out',
                    state === 'expanded'
                        ? 'left-[calc(14.25rem+2.5rem)]'
                        : 'left-10',
                )}
            >
                <Breadcrumb className="ml-2 mt-8" />
            </div>
        </>
    );
};

export default VerticalToolbar;
