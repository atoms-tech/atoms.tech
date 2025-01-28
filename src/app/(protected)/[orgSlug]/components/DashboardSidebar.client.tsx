'use client';

import { Home, Plus, Settings, User, LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
// import { useAuth } from "@/hooks/useAuth";
// import History from "./History";
import { useEffect, useState } from 'react';
// import { CreatePanel } from "@/components/private";
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Profile } from '@/types';
import { useRouter } from 'next/navigation';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { CreatePanel } from '@/components/base/panels/CreatePanel';
import { useUser } from '@/lib/providers/user.provider';

interface MenuItem {
    title: string;
    url: string;
    icon: LucideIcon;
}

// Menu items with app router paths
const items: MenuItem[] = [
    {
        title: 'Home',
        url: '/home',
        icon: Home,
    },
    {
        title: 'Teams',
        url: '/teams',
        icon: User,
    },
    {
        title: 'Settings',
        url: '/settings',
        icon: Settings,
    },
];

export function DashboardSidebar() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
    const [isSidebarHidden, setIsSidebarHidden] = useState(false);
    const { user, profile } = useUser();

    const handleSignOut = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/auth/signout', {
                method: 'POST',
            });

            if (response.ok) {
                router.push('/login');
            } else {
                console.error('Failed to sign out');
            }
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                // Move focus to a visible element before hiding the sidebar
                const firstFocusableElement = document.querySelector(
                    '.main-content button, .main-content [href], .main-content input',
                );
                if (firstFocusableElement) {
                    (firstFocusableElement as HTMLElement).focus();
                }

                // Hide the sidebar
                setIsSidebarHidden(true);
            } else {
                // Show the sidebar
                setIsSidebarHidden(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <Sidebar inert={isSidebarHidden}>
            <SidebarContent className="px-3 py-2">
                <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center gap-2 px-1 mb-6">
                        <Image
                            src="/atoms.png"
                            alt="Atoms logo"
                            width={24}
                            height={24}
                            className="object-contain dark:invert"
                        />
                        <span className="font-semibold text-lg">Atoms</span>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <Link
                                    key={item.title}
                                    href={item.url}
                                    className="block mb-1"
                                >
                                    <SidebarMenuItem className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-secondary transition-colors">
                                        <item.icon className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">
                                            {item.title}
                                        </span>
                                    </SidebarMenuItem>
                                </Link>
                            ))}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full relative z-20"
                                        onClick={() =>
                                            setIsCreatePanelOpen(true)
                                        }
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>Create New</span>
                                    </Button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <CreatePanel
                                isOpen={isCreatePanelOpen}
                                onClose={() => setIsCreatePanelOpen(false)}
                                showTabs="show"
                            />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="px-3 py-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="w-full">
                                    <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-secondary transition-colors">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">
                                            {profile?.full_name || user?.email}
                                        </span>
                                    </div>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="w-[--radix-popper-anchor-width]"
                            >
                                <DropdownMenuItem asChild>
                                    <Link href="/account">Account</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/billing">Billing</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={handleSignOut}
                                    disabled={isLoading}
                                >
                                    <span>
                                        {isLoading
                                            ? 'Signing out...'
                                            : 'Sign out'}
                                    </span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
