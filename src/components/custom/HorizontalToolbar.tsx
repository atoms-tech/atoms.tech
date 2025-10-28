'use client';

import { GearIcon } from '@radix-ui/react-icons';
import { CreditCard, Lock, Unlock } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import React, { memo } from 'react';

import BreadCrumb from '@/components/custom/Breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useProfile } from '@/hooks/queries/useProfile';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSignOut } from '@/hooks/useSignOut';
import { useLayout } from '@/lib/providers/layout.provider';
import { useUser } from '@/lib/providers/user.provider';
import { useDocumentStore } from '@/store/document.store';

import { useAgentStore } from './AgentChat/hooks/useAgentStore';

/**
 * Horizontal toolbar component
 * Displays a top bar with sidebar trigger, breadcrumbs, and avatar
 */
const HorizontalToolbar = memo(() => {
    const { sidebarState } = useLayout();
    const isMobile = useIsMobile();
    const { isOpen: isAgentPanelOpen, panelWidth } = useAgentStore();

    const leftMargin = sidebarState === 'expanded' && !isMobile ? 224 : 0;
    const rightMargin =
        !isMobile && isAgentPanelOpen ? (panelWidth > 600 ? 600 : panelWidth) : 0;

    const { user } = useUser();
    const { data: profile } = useProfile(user?.id || '');

    const { theme, setTheme } = useTheme();
    const { layoutViewMode, setLayoutViewMode, isDocumentPage } = useLayout();
    const { signOut, isLoading: isSigningOut } = useSignOut();

    const { isEditMode, setIsEditMode } = useDocumentStore();
    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    return (
        <div
            className={`fixed top-0 right-0 z-30 flex items-center justify-between p-3 bg-background border-b transition-all duration-200 ease-linear`}
            style={{
                left: leftMargin,
                right: rightMargin,
            }}
        >
            {/* Left section with sidebar trigger and breadcrumb */}
            <div className="flex items-center gap-2">
                <SidebarTrigger />
                <BreadCrumb />
            </div>

            {/* Right section with edit mode toggle and avatar dropdown*/}
            <div className="flex items-center gap-2">
                {/* Edit Mode Toggle */}
                {isDocumentPage && (
                    <button
                        onClick={toggleEditMode}
                        className="p-2 rounded-md hover:bg-muted"
                    >
                        {isEditMode ? (
                            <div className="flex items-center gap-2">
                                <Unlock className="h-5 w-5" />
                                <span className="w-16 text-left font-normal">
                                    Editing
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                <span className="w-16 text-left font-normal">
                                    Viewing
                                </span>
                            </div>
                        )}
                    </button>
                )}
                {/* Avatar Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="cursor-pointer">
                            <AvatarImage
                                src={profile?.avatar_url || undefined}
                                alt="avatar"
                            />
                            <AvatarFallback className="bg-primary text-white">
                                {profile?.full_name ? profile?.full_name[0] : ''}
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="truncate">
                            {profile?.full_name || 'User'}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link
                                    className="cursor-pointer"
                                    href="/home/user/account"
                                >
                                    <GearIcon />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link className="cursor-pointer" href="/billing">
                                    <CreditCard />
                                    <span>Billing</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Theme</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                            <DropdownMenuRadioItem
                                className="cursor-pointer"
                                value="system"
                            >
                                System
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                                className="cursor-pointer"
                                value="light"
                            >
                                Light
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                                className="cursor-pointer"
                                value="dark"
                            >
                                Dark
                            </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Layout</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                            value={layoutViewMode}
                            onValueChange={setLayoutViewMode}
                        >
                            <DropdownMenuRadioItem
                                className="cursor-pointer"
                                value="standard"
                            >
                                Standard
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem
                                className="cursor-pointer"
                                value="wide"
                            >
                                Wide
                            </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onSelect={() => signOut()}
                                disabled={isSigningOut}
                                className="cursor-pointer"
                            >
                                <span>
                                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                                </span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
});

// Display name for debugging
HorizontalToolbar.displayName = 'HorizontalToolbar';

export default HorizontalToolbar;
