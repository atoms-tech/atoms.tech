'use client';

import { Lock, Unlock } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import Breadcrumb from '@/components/custom/Breadcrumb';
import { ThemeToggle } from '@/components/custom/toggles/ThemeToggle';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useProjectMemberRole } from '@/hooks/queries/useProjectMember';
import { ProjectRole } from '@/lib/auth/permissions';
import { useUser } from '@/lib/providers/user.provider';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store/document.store';

import { LayoutViewToggle } from './toggles/LayoutViewToggle';

const VerticalToolbar = () => {
    const { state } = useSidebar();
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const pathname = usePathname();

    // Check if we're on a document page
    const isDocumentPage = pathname?.includes('/documents/');

    // Get edit mode state from document store
    const { isEditMode, setIsEditMode } = useDocumentStore();

    const { user } = useUser();
    const { data: userRoleQuery } = useProjectMemberRole(
        pathname?.split('/')[4] || '',
        user?.id || '',
    );
    const userRole: ProjectRole | null = userRoleQuery ?? null;

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

    const canEdit = ['owner', 'editor'].includes(userRole || '');

    const toggleEditMode = () => {
        if (!canEdit) {
            alert('You do not have permission to edit.');
            return;
        }
        setIsEditMode(!isEditMode);
    };

    if (isMobile || isTablet) {
        // Mobile and tablet layout - horizontal toolbar at the top
        return (
            <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2 bg-background backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className={cn('h-5 w-5', isTablet && 'ml-2')} />
                    <Breadcrumb className={cn('ml-0', isTablet && 'ml-2')} />
                </div>
                <div className="flex items-center gap-2">
                    {isDocumentPage && canEdit && (
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
                    'fixed top-0 z-30 flex flex-col gap-2 pt-4 w-auto',
                    'transition-all duration-200 ease-linear',
                    state === 'expanded' ? 'left-[14.25rem]' : 'left-0',
                )}
            >
                <div className="w-9 h-9 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                    <SidebarTrigger className="h-full w-full" />
                </div>

                <div className="w-9 h-9 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md hover:bg-background/90 transition-colors">
                    <ThemeToggle />
                </div>

                {/* Edit Mode Toggle - Only show on document pages */}
                {isDocumentPage && canEdit && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        'w-9 h-9 flex items-center justify-center backdrop-blur-sm rounded-md transition-colors cursor-pointer',
                                        isEditMode
                                            ? 'bg-destructive/80 hover:bg-destructive/90 text-destructive-foreground'
                                            : 'bg-background/80 hover:bg-background/90',
                                    )}
                                    onClick={toggleEditMode}
                                >
                                    {isEditMode ? (
                                        <Unlock className="h-5 w-5" />
                                    ) : (
                                        <Lock className="h-5 w-5" />
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                <div className="w-9 h-9 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md hover:bg-background/90 transition-colors">
                    <LayoutViewToggle />
                </div>
            </div>

            {/* Horizontal breadcrumb bar */}
            <div
                className={cn(
                    'fixed top-0 right-0 z-30 h-10 flex items-center bg-background/80 backdrop-blur-sm transition-all duration-200 ease-linear',
                    state === 'expanded' ? 'left-[calc(14.25rem+2.5rem)]' : 'left-10',
                )}
            >
                <Breadcrumb className="ml-2 mt-8" />
            </div>
        </>
    );
};

export default VerticalToolbar;
