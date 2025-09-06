'use client';

import {
    ChevronDown,
    FlaskConical,
    GitBranch,
    Hammer,
    Home,
    LayoutDashboard,
    ListTree,
    LucideIcon,
    Sparkles,
    Table,
    User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect } from 'react';

import { setCookie } from '@/app/(protected)/org/actions';
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
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useSignOut } from '@/hooks/useSignOut';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';
import { atomsApiClient } from '@/lib/atoms-api';
import { OrganizationType } from '@/types';

interface MenuItem {
    title: string;
    url: string;
    icon: LucideIcon;
}

// Menu items with app router paths
const _items: MenuItem[] = [
    {
        title: 'Home',
        url: '/home',
        icon: Home,
    },
];

function AppSidebar() {
    // State for traceability dropdown
    const [traceOpen, setTraceOpen] = React.useState(false);
    // Get traceView from URL
    let traceView = '';
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        traceView = params.get('view') || '';
    }
    const router = useRouter();
    const pathname = usePathname();
    const { signOut, isLoading: isSigningOut } = useSignOut();
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

    const _isOrgPage = pathname?.startsWith('/org') ?? false;
    const _isPlaygroundPage = currentOrganization?.type === OrganizationType.personal;
    const _isUserDashboardPage = pathname?.startsWith('/home/user') ?? false;

    // Check if user has only a personal org and no other memberships
    const _hasOnlyPersonalOrg =
        personalOrg &&
        (!organizations ||
            organizations.length === 0 ||
            (organizations.length === 1 && organizations[0].id === personalOrg.id));

    const navigateToPlayground = useCallback(() => {
        if (personalOrg) {
            console.log('Navigating to playground:', personalOrg.id);
            // Only set preferred_org_id if there's no enterprise org
            if (!enterpriseOrg) {
                setCookie('preferred_org_id', personalOrg.id);
            }
            router.push(`/org/${personalOrg.id}`);
        } else {
            console.log('No personal organization found');
        }
    }, [personalOrg, router, enterpriseOrg]);

    const navigateToAdmin = () => {
        console.log('Navigating to admin page:');
        router.push('/admin');
    };

    const navigateToPinnedOrganization = useCallback(async () => {
        try {
            const api = atomsApiClient();
            const prof = user?.id ? await api.auth.getProfile(user.id) : null;
            if (prof) {
                let targetOrgId = (prof as any).pinned_organization_id as string | null;
                const personalOrgId = (prof as any).personal_organization_id as string | null;
                if (!targetOrgId && personalOrgId && user?.id) {
                    await api.auth.updateProfile(user.id, {
                        pinned_organization_id: personalOrgId,
                    } as any);
                    targetOrgId = personalOrgId;
                }
                if (targetOrgId) {
                    console.log('Navigating to pinned organization:', targetOrgId);
                    router.push(`/org/${targetOrgId}`);
                } else {
                    console.log('No pinned or personal organization found');
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        }
    }, [user?.id, router]);

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
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src="/atom.png"
                                alt="Atoms logo"
                                width={32}
                                height={32}
                                className="object-contain dark:invert"
                            />
                            <span className="font-semibold text-base">ATOMS</span>
                        </Link>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem className="mb-0.5">
                                <SidebarMenuButton asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start"
                                        asChild
                                    >
                                        <Link href="/home/user">
                                            <Home className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                            <span className="text-xs font-medium">
                                                Home
                                            </span>
                                        </Link>
                                    </Button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {primaryEnterpriseOrg && (
                                <SidebarMenuItem className="mb-0.5">
                                    <SidebarMenuButton asChild>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start"
                                            onClick={navigateToPinnedOrganization}
                                        >
                                            <LayoutDashboard className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                            <span className="text-xs font-medium">
                                                Dashboard
                                            </span>
                                        </Button>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}

                            {personalOrg && (
                                <SidebarMenuItem className="mb-0.5">
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

                            {profile?.job_title === 'admin' && (
                                <SidebarMenuItem className="mb-0.5">
                                    <SidebarMenuButton asChild>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start"
                                            onClick={navigateToAdmin}
                                        >
                                            <Hammer className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                            <span className="text-xs font-medium">
                                                Admin
                                            </span>
                                        </Button>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}

                            {/* Create Organization button (only if user has only personal org) */}
                            {/* {!isLoading && hasOnlyPersonalOrg && (
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
                            )} */}

                            {/* Create New button (only on org pages) */}
                            {/* {isOrgPage && (
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
                            )} */}

                            {/* <CreatePanel
                                isOpen={isCreatePanelOpen}
                                onClose={() => setIsCreatePanelOpen(false)}
                                showTabs={createPanelType}
                                initialTab={createPanelType}
                            /> */}
                            {/* Traceability Dropdown */}
                            <SidebarMenuItem className="mb-0.5">
                                <SidebarMenuButton asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={() => setTraceOpen((open) => !open)}
                                    >
                                        <GitBranch className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                        <span className="text-xs font-medium">
                                            Traceability
                                        </span>
                                        <ChevronDown
                                            className={`ml-auto h-3 w-3 transition-transform ${traceOpen ? 'rotate-180' : ''}`}
                                        />
                                    </Button>
                                </SidebarMenuButton>
                                {traceOpen && (
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={
                                                    pathname === '/traceability' &&
                                                    (!traceView || traceView === 'matrix')
                                                }
                                            >
                                                <Link href="/traceability?view=matrix">
                                                    <Table className="h-3.5 w-3.5" />
                                                    <span>Matrix View</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={
                                                    pathname === '/traceability' &&
                                                    traceView === 'hierarchy'
                                                }
                                            >
                                                <Link href="/traceability?view=hierarchy">
                                                    <ListTree className="h-3.5 w-3.5" />
                                                    <span>Hierarchy View</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={
                                                    pathname === '/traceability' &&
                                                    traceView === 'test'
                                                }
                                            >
                                                <Link href="/traceability?view=test">
                                                    <FlaskConical className="h-3.5 w-3.5" />
                                                    <span>Test Requirement</span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                )}
                            </SidebarMenuItem>
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
                                    <Link href="/home/user/account">Account</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/billing">Billing</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => signOut()}
                                    disabled={isSigningOut}
                                >
                                    <span>
                                        {isSigningOut ? 'Signing out...' : 'Sign out'}
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
