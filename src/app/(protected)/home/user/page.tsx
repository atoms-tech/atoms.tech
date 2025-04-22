'use client';

import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Building, Folder, Pin, Plus, Users } from 'lucide-react'; // Import Pin icon
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import UserInvitations from '@/app/(protected)/user/components/UserInvitations.client'; // Import UserInvitations
import { CreatePanel } from '@/components/base/panels/CreatePanel';
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
import { useOrgInvitation } from '@/hooks/queries/useOrganization';
import { queryKeys } from '@/lib/constants/queryKeys';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';
import { supabase } from '@/lib/supabase/supabaseBrowser'; // Import Supabase client
import { useContextStore } from '@/store/context.store';
import { InvitationStatus, OrganizationType } from '@/types/base/enums.types';
import { Organization } from '@/types/base/organizations.types';

export default function UserDashboard() {
    const { user, profile } = useUser();
    const router = useRouter();
    const { setCurrentUserId } = useContextStore();
    const { setCurrentOrganization } = useOrganization();
    const { data: allInvitations } = useOrgInvitation(user?.email || '');
    const queryClient = useQueryClient();

    const refetchOrganizations = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: queryKeys.organizations.byMembership(user?.id || ''),
        });
    }, [queryClient, user?.id]);

    // Re-fetch organizations on component mount
    useEffect(() => {
        refetchOrganizations();
    }, [refetchOrganizations]);

    // Filter the invitations to only include pending ones
    const invitations = allInvitations?.filter(
        (invitation) => invitation.status === InvitationStatus.pending,
    );

    const [searchTerm, setSearchTerm] = useState(''); // Ensure the initial state is an empty string
    const [activeTab, setActiveTab] = useState('all');
    const [greeting, setGreeting] = useState('');
    const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
    const [createPanelType, setCreatePanelType] = useState<
        'project' | 'requirement' | 'document' | 'organization'
    >('organization');
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [inviteCount, setInviteCount] = useState(0);
    const [pinnedOrgId, setPinnedOrgId] = useState<string | null>(null);
    const [safeOrganizations, setSafeOrganizations] = useState<Organization[]>(
        [],
    );

    // Fetch organizations and update safeOrganizations
    useEffect(() => {
        const fetchOrganizations = async () => {
            const organizations =
                (queryClient.getQueryData(
                    queryKeys.organizations.byMembership(user?.id || ''),
                ) as Organization[]) || [];
            setSafeOrganizations(
                Array.isArray(organizations) ? organizations : [],
            );
        };

        fetchOrganizations();

        // Refetch organizations whenever the query is invalidated
        const unsubscribe = queryClient.getQueryCache().subscribe(() => {
            fetchOrganizations();
        });

        return () => {
            unsubscribe();
        };
    }, [queryClient, user?.id]);

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
                    } else if (data.personal_organization_id) {
                        // If no pinned organization, set it to personal_organization_id by default
                        const { error: updateError } = await supabase
                            .from('profiles')
                            .update({
                                pinned_organization_id:
                                    data.personal_organization_id,
                            })
                            .eq('id', user?.id || '');

                        if (!updateError) {
                            setPinnedOrgId(data.personal_organization_id);
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
    }, [user?.id]);

    // Handle pinning an organization
    const handlePinOrganization = useCallback(
        async (orgId: string) => {
            try {
                // Fetch the current user's profile to get their ID
                const { data: profileData, error: profileError } =
                    await supabase
                        .from('profiles')
                        .select('id')
                        .eq('email', user?.email || '')
                        .single();

                if (profileError || !profileData?.id) {
                    console.error('Error fetching user profile:', profileError);
                    return;
                }

                // Update the pinned organization ID for the user
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ pinned_organization_id: orgId })
                    .eq('id', profileData.id);

                if (!updateError) {
                    setPinnedOrgId(orgId);
                } else {
                    console.error(
                        'Error updating pinned organization:',
                        updateError,
                    );
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            }
        },
        [user?.email],
    );

    // Ensure the pinned organization is displayed first
    const sortedOrganizations = useMemo(() => {
        if (!pinnedOrgId) return safeOrganizations;
        return [
            ...safeOrganizations.filter((org) => org.id === pinnedOrgId),
            ...safeOrganizations.filter((org) => org.id !== pinnedOrgId),
        ];
    }, [safeOrganizations, pinnedOrgId]);

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

    // Handle organization selection and navigation
    useEffect(() => {
        if (selectedOrgId) {
            const selectedOrg = sortedOrganizations.find(
                (org) => org.id === selectedOrgId,
            );
            if (selectedOrg) {
                setCurrentUserId(user?.id || '');
                setCurrentOrganization(selectedOrg);
                // Make sure we're using a valid UUID for the route
                if (selectedOrgId && selectedOrgId !== 'user') {
                    router.push(`/org/${selectedOrgId}`);
                }
            }
            // Reset the selected org ID after navigation
            setSelectedOrgId(null);
        }
    }, [
        selectedOrgId,
        sortedOrganizations,
        setCurrentUserId,
        setCurrentOrganization,
        router,
        user?.id,
    ]);

    const handleRowClick = useCallback((item: Organization) => {
        // Ensure we're only setting a valid UUID as the selected org ID
        if (item && item.id && item.id !== 'user') {
            setSelectedOrgId(item.id);
        }
    }, []);

    const handleCreateOrganization = useCallback(() => {
        setCreatePanelType('organization');
        setIsCreatePanelOpen(true);
    }, []);

    // Filter organizations based on search term and active tab
    const filteredOrganizations = sortedOrganizations.filter(
        (org: Organization) => {
            const matchesSearch = org.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
            if (activeTab === 'all')
                return (
                    matchesSearch && org.type === OrganizationType.enterprise
                );
            if (activeTab === 'enterprise')
                return (
                    matchesSearch && org.type === OrganizationType.enterprise
                );
            if (activeTab === 'team')
                return (
                    matchesSearch &&
                    org.type !== OrganizationType.personal &&
                    org.type !== OrganizationType.enterprise
                );
            if (activeTab === 'invites') return false; // No organizations for invites
            return matchesSearch;
        },
    );

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
                            {greeting},{' '}
                            {profile?.full_name || user?.email?.split('@')[0]}
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
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                            onClick={handleCreateOrganization}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Organization
                        </Button>
                    </motion.div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 h-full">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-blue-700">
                                    Organizations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-700">
                                    {enterpriseCount + teamCount}
                                </div>
                                <p className="text-sm text-blue-600 mt-1">
                                    Total workspaces
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 h-full">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-purple-700">
                                    Enterprise
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-700">
                                    {enterpriseCount}
                                </div>
                                <p className="text-sm text-purple-600 mt-1">
                                    Business workspaces
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                    >
                        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 h-full">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg text-green-700">
                                    Teams
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-700">
                                    {teamCount}
                                </div>
                                <p className="text-sm text-green-600 mt-1">
                                    Collaborative spaces
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <Tabs
                        defaultValue="all"
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full md:w-auto"
                    >
                        <TabsList className="grid grid-cols-4 w-full md:w-auto">
                            <TabsTrigger value="all">
                                All ({enterpriseCount})
                            </TabsTrigger>
                            <TabsTrigger value="enterprise">
                                Enterprise ({enterpriseCount})
                            </TabsTrigger>
                            <TabsTrigger value="team">
                                Teams ({teamCount})
                            </TabsTrigger>
                            <TabsTrigger value="invites">
                                Invites ({inviteCount})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex w-full md:w-auto space-x-2">
                        <Input
                            type="text"
                            placeholder="Search organizations..."
                            value={searchTerm || ''} // Ensure value is always a string
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64"
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
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {filteredOrganizations.length > 0 ? (
                            filteredOrganizations.map((org: Organization) => (
                                <motion.div
                                    key={org.id}
                                    variants={itemVariants}
                                >
                                    <Card
                                        className={`h-full hover:shadow-md transition-all duration-300 cursor-pointer border-2 ${
                                            org.id === pinnedOrgId
                                                ? 'border-primary'
                                                : 'hover:border-primary/20'
                                        }`}
                                        onClick={() => handleRowClick(org)}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center space-x-2">
                                                    <Pin
                                                        className={`h-5 w-5 cursor-pointer ${
                                                            org.id ===
                                                            pinnedOrgId
                                                                ? 'text-primary'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent triggering card click
                                                            handlePinOrganization(
                                                                org.id,
                                                            );
                                                        }}
                                                    />
                                                    <CardTitle className="text-lg font-semibold">
                                                        {org.name}
                                                    </CardTitle>
                                                </div>
                                                {org.type ===
                                                OrganizationType.enterprise ? (
                                                    <Building className="h-5 w-5 text-blue-500" />
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
                                            <Badge
                                                variant="outline"
                                                className={
                                                    org.status === 'active'
                                                        ? 'border-green-500 text-green-500'
                                                        : org.status ===
                                                            'inactive'
                                                          ? 'border-gray-500 text-gray-500'
                                                          : 'border-yellow-500 text-yellow-500'
                                                }
                                            >
                                                {org.status}
                                            </Badge>
                                            <Badge variant="secondary">
                                                {org.type ===
                                                OrganizationType.enterprise
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
