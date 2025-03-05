'use client';

import { Building, Home, LucideIcon, Plus, Sparkles, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

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
import { useOrganizationsByMembership } from '@/hooks/queries/useOrganization';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';
import { OrganizationType } from '@/types/base/enums.types';

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

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
    const [isSidebarHidden, setIsSidebarHidden] = useState(false);
    const [createPanelType, setCreatePanelType] = useState<
        'project' | 'requirement' | 'document' | 'organization'
    >('project');
    const { user, profile } = useUser();
    const { organization } = useOrganization();
    const { data: memberOrgs, isLoading: isLoadingMemberOrgs } =
        useOrganizationsByMembership(user?.id || '');

    const personalOrg = memberOrgs?.find(
        (org) => org.type === OrganizationType.personal,
    );
    const enterpriseOrg = memberOrgs?.find(
        (org) => org.type === OrganizationType.enterprise,
    );

    // Define primaryEnterpriseOrg based on enterpriseOrg
    const primaryEnterpriseOrg = enterpriseOrg;

    // Debug logging
    useEffect(() => {
        console.log('Sidebar - Current Organization:', organization);
        console.log('Sidebar - Personal Orgs:', personalOrg);
        console.log('Sidebar - Member Orgs:', memberOrgs);
    }, [organization, personalOrg, memberOrgs]);

    const isOrgPage = pathname.startsWith('/org');
    const isPlaygroundPage = organization?.type === OrganizationType.personal;
    const isUserDashboardPage = pathname.startsWith('/home/user');

    // Check if user has only a personal org and no other memberships
    const hasOnlyPersonalOrg =
        personalOrg &&
        (!memberOrgs ||
            memberOrgs.length === 0 ||
            (memberOrgs.length === 1 && memberOrgs[0].id === personalOrg.id));

    const navigateToPlayground = useCallback(() => {
        if (personalOrg) {
            console.log('Navigating to playground:', personalOrg.id);
            router.push(`/org/${personalOrg.id}`);
        } else {
            console.log('No personal organization found');
        }
    }, [personalOrg, router]);

    const navigateToEnterprise = useCallback(() => {
        if (primaryEnterpriseOrg) {
            console.log('Navigating to enterprise:', primaryEnterpriseOrg.id);
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
                setIsSidebarHidden(true);
            } else {
                setIsSidebarHidden(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isLoadingOrgs = isLoadingMemberOrgs;

    return (
        <SidebarContainer inert={isSidebarHidden}>
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

                            {/* Playground option - show when not in playground and user has a personal org */}
                            {!isLoadingOrgs &&
                                personalOrg &&
                                (isUserDashboardPage ||
                                    (organization &&
                                        organization.id !==
                                            personalOrg.id)) && (
                                    <SidebarMenuItem className="mb-1">
                                        <SidebarMenuButton asChild>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                                onClick={navigateToPlayground}
                                            >
                                                <Sparkles className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span className="text-sm font-medium">
                                                    Playground
                                                </span>
                                            </Button>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )}

                            {/* Enterprise option - show when in playground or user dashboard and user has an enterprise org */}
                            {!isLoadingOrgs &&
                                primaryEnterpriseOrg &&
                                (isPlaygroundPage || isUserDashboardPage) && (
                                    <SidebarMenuItem className="mb-1">
                                        <SidebarMenuButton asChild>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                                onClick={navigateToEnterprise}
                                            >
                                                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span className="text-sm font-medium">
                                                    Enterprise
                                                </span>
                                            </Button>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )}

                            {/* Create Organization button (only if user has only personal org) */}
                            {!isLoadingOrgs && hasOnlyPersonalOrg && (
                                <SidebarMenuItem className="mb-1">
                                    <SidebarMenuButton asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={handleCreateOrganization}
                                        >
                                            <Building className="h-4 w-4 mr-2" />
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
                                            className="w-full relative z-20"
                                            onClick={handleCreateNew}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
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
        </SidebarContainer>
    );
}
