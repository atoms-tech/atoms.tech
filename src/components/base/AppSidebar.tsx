'use client';

import {
    ChevronDown,
    FlaskConical,
    GitBranch,
    Hammer,
    Home,
    ListTree,
    LucideIcon,
    Pin,
    Sparkles,
    Table,
    User,
    Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect } from 'react';

import { setCookie } from '@/app/(protected)/org/actions';
import { useAgentStore } from '@/components/custom/AgentChat/hooks/useAgentStore';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
    SidebarMenuSubAction,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useSignOut } from '@/hooks/useSignOut';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Organization, OrganizationType } from '@/types';

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
    const [traceOpen, setTraceOpen] = React.useState<boolean>(false);
    const [isOrganizationOpen, setIsOrganizationOpen] = React.useState<boolean>(true);
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
    const { organizations, currentOrganization, setCurrentOrganization } =
        useOrganization();
    const { setUserContext } = useAgentStore();

    // Find personal and enterprise organizations from context
    const personalOrg = organizations.find(
        (org) => org.type === OrganizationType.personal,
    );
    const enterpriseOrg = organizations.find(
        (org) => org.type === OrganizationType.enterprise,
    );
    const [pinnedOrganization, setPinnedOrganization] = React.useState<
        Organization | undefined
    >(organizations.find((org) => org.id === profile?.pinned_organization_id));

    const filteredOrganizations = organizations.filter(
        (org) => org.id !== personalOrg?.id,
    );
    const ORGS_PER_CLICK = 5;
    const [orgLimit, setOrgLimit] = React.useState<number>(ORGS_PER_CLICK);
    const [isShowMore, setIsShowMore] = React.useState<boolean>(
        filteredOrganizations.length < orgLimit + 1,
    );

    const sortedOrganizations = [
        ...filteredOrganizations.filter((org) => org.id === pinnedOrganization?.id),
        ...filteredOrganizations.filter((org) => org.id !== pinnedOrganization?.id),
    ];

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

    const navigateToOrganization = (org: Organization) => {
        console.log('Navigating to Organization:');
        setCurrentOrganization(org);
        router.push(`/org/${org.id}`);
    };

    const navigateToAdmin = () => {
        console.log('Navigating to admin page:');
        router.push('/admin');
    };

    // Handle pinning an organization
    const handlePinOrganization = async (org: Organization) => {
        try {
            setPinnedOrganization(org);

            // Update Agent Store context
            setUserContext({
                orgId: org.id || undefined,
                pinnedOrganizationId: org.id || undefined,
            });

            const { error } = await supabase
                .from('profiles')
                .update({ pinned_organization_id: org.id })
                .eq('id', user?.id || '');
            if (error) console.error('Error Updating Pinned Organization: ', error);
        } catch (err) {
            console.error('Unexpected error:', err);
        }
    };

    const handleClickShowMore = () => {
        setIsShowMore(filteredOrganizations.length < orgLimit + ORGS_PER_CLICK + 1);
        setOrgLimit(orgLimit + ORGS_PER_CLICK);
    };

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

                            <Collapsible
                                open={isOrganizationOpen}
                                onOpenChange={setIsOrganizationOpen}
                            >
                                <SidebarMenuItem className="mb-0.5">
                                    <CollapsibleTrigger asChild className="mb-0.5">
                                        <SidebarMenuButton asChild>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                            >
                                                <Users className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                                <span className="text-xs font-medium">
                                                    Organizations
                                                </span>
                                                <ChevronDown
                                                    className={`ml-auto h-3 w-3 transition-transform ${isOrganizationOpen ? '-rotate-180' : ''}`}
                                                />
                                            </Button>
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {sortedOrganizations
                                                .slice(0, orgLimit)
                                                .map((org: Organization) => (
                                                    <SidebarMenuSubItem
                                                        key={org.id}
                                                        className="mb-0.5"
                                                    >
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            className="mr-5"
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-start"
                                                                onClick={() =>
                                                                    navigateToOrganization(
                                                                        org,
                                                                    )
                                                                }
                                                            >
                                                                <span className="text-xs font-medium truncate">
                                                                    {org.name}
                                                                </span>
                                                            </Button>
                                                        </SidebarMenuSubButton>
                                                        <SidebarMenuSubAction
                                                            onClick={() =>
                                                                handlePinOrganization(
                                                                    organizations.find(
                                                                        (orgIndex) =>
                                                                            orgIndex.id ===
                                                                            org.id,
                                                                    ) as Organization,
                                                                )
                                                            }
                                                        >
                                                            <Pin
                                                                fill={`${org.id === pinnedOrganization?.id ? 'hsl(var(--border))' : ''}`}
                                                                stroke={`${org.id === pinnedOrganization?.id ? 'hsl(var(--border))' : 'hsl(var(--muted-foreground))'}`}
                                                                strokeWidth={2}
                                                            />
                                                        </SidebarMenuSubAction>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            {!isShowMore && (
                                                <SidebarMenuSubItem className="mb-0.5">
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        className="mr-5"
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start"
                                                            onClick={() =>
                                                                handleClickShowMore()
                                                            }
                                                        >
                                                            <span className="text-xs font-medium text-muted-foreground truncate">
                                                                Show More
                                                            </span>
                                                        </Button>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            )}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>

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
                                            className={`ml-auto h-3 w-3 transition-transform ${traceOpen ? '-rotate-180' : ''}`}
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
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="px-3 py-1.5">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton>
                                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
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
