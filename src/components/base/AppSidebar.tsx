'use client';

import { ChevronDown, GitBranch, Hammer, Home, Pin, Sparkles, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

import { useAgentStore } from '@/components/custom/AgentChat/hooks/useAgentStore';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarContainer,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubAction,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useUpdateProfile } from '@/hooks/mutations/useProfileMutation';
import { useProfile } from '@/hooks/queries/useProfile';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';
import { Organization, OrganizationType } from '@/types';

function AppSidebar() {
    const router = useRouter();
    const { user } = useUser();
    const { data: profile } = useProfile(user?.id || '');
    const { mutate: updateProfile } = useUpdateProfile();
    const { organizations, setCurrentOrganization } = useOrganization();
    const { setUserContext } = useAgentStore();

    const personalOrganization = organizations.find(
        (org) => org.type === OrganizationType.personal,
    );

    const filteredOrganizations = organizations.filter(
        (org) => org.id !== personalOrganization?.id,
    );
    const sortedOrganizations = [
        ...filteredOrganizations.filter(
            (org) => org.id === profile?.pinned_organization_id,
        ),
        ...filteredOrganizations.filter(
            (org) => org.id !== profile?.pinned_organization_id,
        ),
    ];

    // States for collapsibles
    const [isOrganizationOpen, setIsOrganizationOpen] = React.useState<boolean>(true);

    const ORGS_PER_CLICK = 5;
    const [organizationLimit, setOrgLimit] = React.useState<number>(ORGS_PER_CLICK);
    const [isShowMore, setIsShowMore] = React.useState<boolean>(
        filteredOrganizations.length < organizationLimit + 1,
    );

    const navigateToPlayground = () => {
        if (!personalOrganization) {
            return console.error('No personal organization found');
        }
        console.log('Navigating to Playground:');
        router.push(`/org/${personalOrganization.id}`);
    };

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
    const handlePinOrganization = async (orgId: string) => {
        try {
            const newPinnedOrganizationId =
                profile?.pinned_organization_id === orgId ? null : orgId;

            // Update Agent Store context
            setUserContext({
                orgId: newPinnedOrganizationId || undefined,
                pinnedOrganizationId: newPinnedOrganizationId || undefined,
            });

            updateProfile({
                id: user?.id || '',
                pinned_organization_id: newPinnedOrganizationId || null,
            });
        } catch (err) {
            console.error('Unexpected error:', err);
        }
    };

    const handleClickShowMore = () => {
        setIsShowMore(
            filteredOrganizations.length < organizationLimit + ORGS_PER_CLICK + 1,
        );
        setOrgLimit(organizationLimit + ORGS_PER_CLICK);
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
            <SidebarHeader className="flex items-start gap-2 px-1 ml-4 pt-4 pb-0">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/atom.png"
                        alt="Atoms logo"
                        width={32}
                        height={32}
                        className="object-contain dark:invert"
                    />
                    <span className="font-bold">ATOMS</span>
                </Link>
            </SidebarHeader>
            <SidebarContent className="px-3 py-2">
                <SidebarGroup>
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

                            {personalOrganization && (
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

                            {/* Organizations Collapsible */}
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
                                                .slice(0, organizationLimit)
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
                                                                    org.id,
                                                                )
                                                            }
                                                        >
                                                            <Pin
                                                                fill={`${org.id === profile?.pinned_organization_id ? 'grey' : 'none'}`}
                                                                stroke="grey"
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
                                                            <span className="text-xs font-medium text-muted-foreground">
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

                            {/* Traceability Single Link */}
                            <SidebarMenuItem className="mb-0.5">
                                <SidebarMenuButton asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start"
                                        onClick={() => {
                                            if (
                                                !profile?.pinned_organization_id &&
                                                filteredOrganizations.length === 0
                                            )
                                                return;
                                            const orgId =
                                                profile?.pinned_organization_id ||
                                                filteredOrganizations[0]?.id;
                                            if (orgId)
                                                router.push(`/org/${orgId}/traceability`);
                                        }}
                                    >
                                        <GitBranch className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                        <span className="text-xs font-medium">
                                            Traceability
                                        </span>
                                    </Button>
                                </SidebarMenuButton>
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
        </SidebarContainer>
    );
}

export default AppSidebar;
