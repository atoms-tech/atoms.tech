'use client';

import { Building, Home, LucideIcon, Plus, Sparkles, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { setCookie } from '@/app/(protected)/org/actions';
import { CreatePanel } from '@/components/base/panels/CreatePanel';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarContainer,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';
import { OrganizationType } from '@/types';

interface MenuItem {
    title: string;
    url: string;
    icon: LucideIcon;
}

// Menu items with app router paths
const items: MenuItem[] = [
    {
        title: 'Home',
        url: '/home/user',
        icon: Home,
    },
];

function AppSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
    const [createPanelType, setCreatePanelType] = useState<
        'project' | 'requirement' | 'document' | 'organization'
    >('project');

    const { user, profile } = useUser();
    const { organizations, currentOrganization } = useOrganization();

    // Find personal and enterprise organizations from context
    const personalOrg = organizations.find(
        (org) => org.type === OrganizationType.personal,
    );
    const enterpriseOrg = organizations.find(
        (org) => org.type === OrganizationType.enterprise,
    );

    // Define primaryEnterpriseOrg based on enterpriseOrg
    const primaryEnterpriseOrg = enterpriseOrg;

    const isOrgPage = pathname.startsWith('/org');
    const isPlaygroundPage =
        currentOrganization?.type === OrganizationType.personal;
    const isUserDashboardPage = pathname.startsWith('/home/user');

    // Check if user has only a personal org and no other memberships
    const hasOnlyPersonalOrg =
        personalOrg &&
        (!organizations ||
            organizations.length === 0 ||
            (organizations.length === 1 &&
                organizations[0].id === personalOrg.id));

    const navigateToPlayground = useCallback(() => {
        if (personalOrg) {
            console.log('Navigating to playground:', personalOrg.id);
            setCookie('preferred_org_id', personalOrg.id);
            router.push(`/org/${personalOrg.id}`);
        } else {
            console.log('No personal organization found');
        }
    }, [personalOrg, router]);

    const navigateToEnterprise = useCallback(() => {
        if (primaryEnterpriseOrg) {
            console.log('Navigating to enterprise:', primaryEnterpriseOrg.id);
            setCookie('preferred_org_id', primaryEnterpriseOrg.id);
            router.push(`/org/${primaryEnterpriseOrg.id}`);
        } else {
            console.log('No enterprise organization found');
        }
    }, [primaryEnterpriseOrg, router]);

    const handleCreateOrganization = useCallback(() => {
        setCreatePanelType('organization');
        setIsCreatePanelOpen(true);
    }, []);

    const handleCreateNew = useCallback(() => {
        setCreatePanelType('project');
        setIsCreatePanelOpen(true);
    }, []);

    const handleSignOut = useCallback(async () => {
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
    }, [router]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                const firstFocusableElement = document.querySelector(
                    '.main-content button, .main-content [href], .main-content input',
                );
                if (firstFocusableElement) {
                    (firstFocusableElement as HTMLElement).focus();
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <SidebarContainer variant="sidebar" collapsible="offcanvas">
            <SidebarContent className="px-3 py-2">
                <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center gap-2 px-1 mb-4">
                        <Image
                            src="/atoms.png"
                            alt="Atoms logo"
                            width={20}
                            height={20}
                            className="object-contain dark:invert"
                        />
                        <span className="font-semibold text-base">Atoms</span>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <Link
                                    key={item.title}
                                    href={item.url}
                                    className="block mb-0.5"
                                >
                                    <SidebarMenuItem className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary transition-colors">
                                        <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs font-medium">
                                            {item.title}
                                        </span>
                                    </SidebarMenuItem>
                                </Link>
                            ))}

                            {/* Playground option - show when not in playground and user has a personal org */}
                            {!isLoading &&
                                personalOrg &&
                                (isUserDashboardPage ||
                                    (currentOrganization &&
                                        currentOrganization.id !==
                                            personalOrg.id)) && (
                                    <SidebarMenuItem className="mb-1">
                                        <SidebarMenuButton asChild>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                                onClick={navigateToPlayground}
                                            >
                                                <Sparkles className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                                <span className="text-xs font-medium">
                                                    Playground
                                                </span>
                                            </Button>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )}

                            {/* Enterprise option - show when in playground or user dashboard and user has an enterprise org */}
                            {!isLoading &&
                                primaryEnterpriseOrg &&
                                (isPlaygroundPage || isUserDashboardPage) && (
                                    <SidebarMenuItem className="mb-1">
                                        <SidebarMenuButton asChild>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                                onClick={navigateToEnterprise}
                                            >
                                                <Building className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                                <span className="text-xs font-medium">
                                                    Enterprise
                                                </span>
                                            </Button>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )}

                            {/* Create Organization button (only if user has only personal org) */}
                            {!isLoading && hasOnlyPersonalOrg && (
                                <SidebarMenuItem className="mb-1">
                                    <SidebarMenuButton asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full text-xs"
                                            onClick={handleCreateOrganization}
                                        >
                                            <Building className="h-3.5 w-3.5 mr-2" />
                                            <span>Create Organization</span>
                                        </Button>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}

                            {/* Create New button (only on org pages) */}
                            {isOrgPage && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full relative z-20 text-xs"
                                            onClick={handleCreateNew}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-2" />
                                            <span>Create New</span>
                                        </Button>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}

                            <CreatePanel
                                isOpen={isCreatePanelOpen}
                                onClose={() => setIsCreatePanelOpen(false)}
                                showTabs={createPanelType}
                                initialTab={createPanelType}
                            />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="px-3 py-1.5">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="w-full">
                                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary transition-colors">
                                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs font-medium">
                                            {profile?.full_name || user?.email}
                                        </span>
                                    </div>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="w-[--radix-popper-anchor-width] text-xs"
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
        </SidebarContainer>
    );
}

export default AppSidebar;
