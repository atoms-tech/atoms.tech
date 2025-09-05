'use client';

import { motion } from 'framer-motion';
import { Building, Folder, Pin, Plus, Users } from 'lucide-react'; // Import Pin icon
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import UserInvitations from '@/app/(protected)/user/components/UserInvitations.client'; // Import UserInvitations
import { CreatePanel } from '@/components/base/panels/CreatePanel';
import { useAgentStore } from '@/components/custom/AgentChat/hooks/useAgentStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LayoutView from '@/components/views/LayoutView';
import {
    useOrgInvitation,
    useOrganizationsByMembership,
} from '@/hooks/queries/useOrganization';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';
import { supabase } from '@/lib/supabase/supabaseBrowser'; // Import Supabase client
import { useContextStore } from '@/store/context.store';
import { InvitationStatus, OrganizationType } from '@/types/base/enums.types';
import { Organization } from '@/types/base/organizations.types';

export default function UserDashboard() {
    const { user, profile } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setCurrentUserId } = useContextStore();
    const { setCurrentOrganization } = useOrganization();
    const { data: allInvitations } = useOrgInvitation(user?.email || '');
    const { setUserContext } = useAgentStore();

    // Filter the invitations to only include pending ones
    const invitations = allInvitations?.filter(
        (invitation) => invitation.status === InvitationStatus.pending,
    );

    const [searchTerm, setSearchTerm] = useState(''); // Ensure the initial state is an empty string

    // Get current tab from URL params, default to 'all' if not present
    const currentTabFromUrl = searchParams.get('currentTab') || 'all';
    const [activeTab, setActiveTab] = useState(currentTabFromUrl);

    const [greeting, setGreeting] = useState('');
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
    const [createPanelType, setCreatePanelType] = useState<
        'project' | 'requirement' | 'document' | 'organization'
    >('organization');
    const [inviteCount, setInviteCount] = useState(0);
    const [pinnedOrgId, setPinnedOrgId] = useState<string | null>(null);

    // Fetch organizations
    const { data: organizations, refetch: refetchOrganizations } =
        useOrganizationsByMembership(user?.id || '');

    // Fetch the pinned organization ID on component mount
    useEffect(() => {
        const fetchPinnedOrg = async () => {
            try {
                // Fetch the user's profile to get pinned_organization_id and personal_organization_id
                const { data, error } = await supabase
                    .from('profiles')
                    .select('pinned_organization_id, personal_organization_id')
                    .eq('id', user?.id || '')
                    .single();

                if (error) {
                    console.error('Error fetching user profile:', error);
                    return;
                }

                if (data) {
                    if (data.pinned_organization_id) {
                        // If a pinned organization exists, set it
                        setPinnedOrgId(data.pinned_organization_id);

                        // Update Agent Store context
                        setUserContext({
                            userId: user?.id || undefined,
                            orgId: data.pinned_organization_id || undefined,
                            pinnedOrganizationId:
                                data.pinned_organization_id || undefined,
                            username: profile?.full_name || user?.email?.split('@')[0],
                        });
                    } else if (data.personal_organization_id) {
                        // If no pinned organization, set it to personal_organization_id by default
                        const { error: updateError } = await supabase
                            .from('profiles')
                            .update({
                                pinned_organization_id: data.personal_organization_id,
                            })
                            .eq('id', user?.id || '');

                        if (!updateError) {
                            setPinnedOrgId(data.personal_organization_id);

                            // Update Agent Store context
                            setUserContext({
                                userId: user?.id || undefined,
                                orgId: data.personal_organization_id || undefined,
                                pinnedOrganizationId:
                                    data.personal_organization_id || undefined,
                                username:
                                    profile?.full_name || user?.email?.split('@')[0],
                            });
                        } else {
                            console.error(
                                'Error updating pinned organization:',
                                updateError,
                            );
                        }
                    }
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            }
        };

        if (user?.id) fetchPinnedOrg();
    }, [user?.id, user?.email, profile, setUserContext]);

    // Handle pinning an organization
    const handlePinOrganization = useCallback(
        async (orgId: string) => {
            try {
                // Fetch the current user's profile to get their ID
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, pinned_organization_id')
                    .eq('email', user?.email || '')
                    .single();

                if (profileError || !profileData?.id) {
                    console.error('Error fetching user profile:', profileError);
                    return;
                }

                // Unpin: If the already pinned organization is clicked again, update to null
                const newPinnedOrgId = pinnedOrgId === orgId ? null : orgId;

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ pinned_organization_id: newPinnedOrgId })
                    .eq('id', profileData.id);

                if (!updateError) {
                    setPinnedOrgId(newPinnedOrgId);

                    // Update Agent Store context
                    setUserContext({
                        userId: user?.id || undefined,
                        orgId: newPinnedOrgId || undefined, // Current organization ID
                        pinnedOrganizationId: newPinnedOrgId || undefined,
                        username: profile?.full_name || user?.email?.split('@')[0],
                    });
                } else {
                    console.error('Error updating pinned organization:', updateError);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            }
        },
        [user?.email, user?.id, pinnedOrgId, profile, setUserContext],
    );

    // Ensure the pinned organization is displayed first
    const sortedOrganizations = useMemo(() => {
        if (!organizations) return [];
        if (!pinnedOrgId) return organizations;
        return [
            ...organizations.filter((org) => org.id === pinnedOrgId),
            ...organizations.filter((org) => org.id !== pinnedOrgId),
        ];
    }, [organizations, pinnedOrgId]);

    // Set greeting based on time of day
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

    // Update invite count whenever invitations change
    useEffect(() => {
        setInviteCount(invitations?.length || 0);
    }, [invitations]);

    const handleOrganizationClick = (organization: Organization) => {
        setCurrentUserId(user?.id || '');
        setCurrentOrganization(organization);
        router.push(`/org/${organization.id}`);
    };

    const handleCreateOrganization = useCallback(() => {
        setCreatePanelType('organization');
        setIsCreatePanelOpen(true);
    }, []);

    // Filter organizations based on search term and active tab
    const filteredOrganizations = sortedOrganizations.filter((org: Organization) => {
        const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (activeTab === 'all')
            return matchesSearch && org.type === OrganizationType.enterprise;
        if (activeTab === 'enterprise')
            return matchesSearch && org.type === OrganizationType.enterprise;
        if (activeTab === 'team')
            return (
                matchesSearch &&
                org.type !== OrganizationType.personal &&
                org.type !== OrganizationType.enterprise
            );
        if (activeTab === 'invites') return false; // No organizations for invites
        return matchesSearch;
    });

    // Get counts for each organization type
    const enterpriseCount = sortedOrganizations.filter(
        (org) => org.type === OrganizationType.enterprise,
    ).length;
    const teamCount = sortedOrganizations.filter(
        (org) =>
            org.type !== OrganizationType.personal &&
            org.type !== OrganizationType.enterprise,
    ).length;

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 },
    };

    // Update URL when tab changes
    const handleTabChange = (newTab: string) => {
        setActiveTab(newTab);
        const params = new URLSearchParams(searchParams);
        params.set('currentTab', newTab);
        // router.push(`?${params.toString()}`, { scroll: false });
    };

    // Sync tab state with URL params when they change
    useEffect(() => {
        const tabFromUrl = searchParams.get('currentTab');
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams, activeTab]);

    return (
        <LayoutView>
            <div className="container mx-auto p-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center"
                >
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {greeting}, {profile?.full_name || user?.email?.split('@')[0]}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Welcome to your dashboard. You have access to{' '}
                            {enterpriseCount + teamCount} organization
                            {enterpriseCount + teamCount !== 1 ? 's' : ''}.
                        </p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 md:mt-0"
                    >
                        <Button
                            size="lg"
                            className="w-full md:w-64 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/.9)] shadow-md dark:bg-purple-600 dark:hover:bg-purple-700"
                            onClick={handleCreateOrganization}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Organization
                        </Button>
                    </motion.div>
                </motion.div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <Tabs
                        defaultValue={currentTabFromUrl}
                        value={activeTab}
                        onValueChange={handleTabChange}
                        className="w-full md:w-auto"
                    >
                        <TabsList className="grid grid-cols-4 w-full md:w-auto">
                            <TabsTrigger value="all">All ({enterpriseCount})</TabsTrigger>
                            <TabsTrigger value="enterprise">
                                Enterprise ({enterpriseCount})
                            </TabsTrigger>
                            <TabsTrigger value="team">Teams ({teamCount})</TabsTrigger>
                            <TabsTrigger value="invites">
                                Invites ({inviteCount})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex w-full md:w-auto space-x-2">
                        <Input
                            type="text"
                            placeholder="Search organizations..."
                            value={searchTerm || ''}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 border border-gray-400"
                        />
                    </div>
                </div>

                {activeTab === 'invites' ? (
                    <div className="col-span-full flex flex-col">
                        {/* Pass refetchOrganizations to UserInvitations */}
                        <div>
                            <UserInvitations onAccept={refetchOrganizations} />
                        </div>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial={false}
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {filteredOrganizations.length > 0 ? (
                            filteredOrganizations.map((org: Organization) => (
                                <motion.div
                                    key={org.id}
                                    variants={itemVariants}
                                    initial={false}
                                >
                                    <Card
                                        className={`h-full hover:shadow-md transition-all duration-300 cursor-pointer border-2`}
                                        onClick={() => handleOrganizationClick(org)}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center space-x-2">
                                                    <Pin
                                                        className="h-5 w-5 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePinOrganization(org.id);
                                                        }}
                                                        style={{
                                                            fill:
                                                                org.id === pinnedOrgId
                                                                    ? 'hsl(var(--border))'
                                                                    : 'none',
                                                            stroke:
                                                                org.id === pinnedOrgId
                                                                    ? 'hsl(var(--border))'
                                                                    : 'hsl(var(--muted-foreground))',
                                                            strokeWidth: 2,
                                                        }}
                                                    />
                                                    <CardTitle className="text-lg font-semibold">
                                                        {org.name}
                                                    </CardTitle>
                                                </div>
                                                {org.type ===
                                                OrganizationType.enterprise ? (
                                                    <Building className="h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    <Users className="h-5 w-5 text-green-500" />
                                                )}
                                            </div>
                                            <CardDescription className="text-sm text-muted-foreground">
                                                {org.slug}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pb-3">
                                            <p className="text-sm">
                                                {org.description ||
                                                    'No description provided'}
                                            </p>
                                        </CardContent>
                                        <CardFooter className="flex justify-between pt-0">
                                            <Badge variant="secondary">
                                                {org.type === OrganizationType.enterprise
                                                    ? 'Enterprise'
                                                    : 'Team'}
                                            </Badge>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                                <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">
                                    No organizations found
                                </h3>
                                <p className="text-muted-foreground mt-1 mb-4">
                                    {searchTerm
                                        ? `No organizations match your search "${searchTerm}"`
                                        : "You don't have any organizations in this category yet"}
                                </p>
                                <Button onClick={handleCreateOrganization}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Organization
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}

                <CreatePanel
                    isOpen={isCreatePanelOpen}
                    onClose={() => setIsCreatePanelOpen(false)}
                    showTabs={createPanelType}
                    initialTab={createPanelType}
                />
            </div>
        </LayoutView>
    );
}
