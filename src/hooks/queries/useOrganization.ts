// import { supabase } from '@/lib/supabase/supabaseClient'
import { useQuery } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
import { getUserOrganizations } from '@/lib/db/client';
import { OrganizationType } from '@/types';
import { QueryFilters } from '@/types/base/filters.types';

export function useOrganization(orgId: string) {
    return useQuery({
        queryKey: queryKeys.organizations.detail(orgId),
        queryFn: async () => {
            // Handle empty or invalid orgId more gracefully
            if (!orgId || orgId === '') {
                console.warn('Empty organization ID provided');
                return null;
            }

            // Skip validation for special cases like 'project'
            if (orgId === 'project') {
                console.warn('Special case organization ID:', orgId);
                return null;
            }

            // Validate that orgId is a valid UUID format before querying
            if (
                orgId === 'user' ||
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    orgId,
                )
            ) {
                console.error('Invalid organization ID format:', orgId);
                return null; // Return null instead of throwing to prevent UI errors
            }

            const response = await fetch(`/api/organizations/${orgId}`, {
                method: 'GET',
                cache: 'no-store',
            });

            if (!response.ok) {
                console.error(
                    'Error fetching organization via API:',
                    response.statusText,
                );
                return null;
            }

            const payload = (await response.json()) as { organization: unknown };
            return payload.organization ?? null;
        },
        enabled: !!orgId && orgId !== 'user' && orgId !== 'project',
    });
}

export function useOrganizationsWithFilters(filters?: QueryFilters) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.organizations.list(filters || {}),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            let query = supabase
                .from('organizations')
                .select('*')
                .eq('is_deleted', false);
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined) {
                        query = query.eq(key, value);
                    }
                });
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        },
        enabled: !authLoading && !!supabase,
    });
}

export function useOrganizationsByMembership(userId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.organizations.byMembership(userId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            // Validate userId
            if (
                !userId ||
                userId === 'user' ||
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    userId,
                )
            ) {
                console.log(
                    'useOrganizationsByMembership called with invalid userId:',
                    userId,
                );
                return [];
            }

            try {
                const orgs = await getUserOrganizations(supabase, userId);
                console.log(`Retrieved ${orgs.length} organizations for user ${userId}`);
                return orgs;
            } catch (error) {
                console.error('Error in useOrganizationsByMembership:', error);
                throw error;
            }
        },
        enabled:
            !!userId && userId !== '' && userId !== 'user' && !authLoading && !!supabase, // Only run the query if userId is valid
    });
}

export function useOrgsByUser(userId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.organizations.byUser(userId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            // Validate userId
            if (
                !userId ||
                userId === 'user' ||
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    userId,
                )
            ) {
                console.error('Invalid user ID format:', userId);
                return [];
            }

            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('created_by', userId)
                .eq('is_deleted', false);

            if (error) {
                console.error('Error fetching organizations by user:', error);
                throw error;
            }

            return data;
        },
        enabled: !!userId && userId !== 'user' && !authLoading && !!supabase,
    });
}

export function usePersonalOrg(userId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.organizations.createdBy(userId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            // Validate userId
            if (
                !userId ||
                userId === 'user' ||
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    userId,
                )
            ) {
                console.error('Invalid user ID format:', userId);
                throw new Error('Invalid user ID format');
            }

            const { data: organization, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('created_by', userId)
                .eq('type', OrganizationType.personal)
                .eq('is_deleted', false)
                .single();
            if (error) {
                console.error('Error fetching organizations:', error);
                throw error;
            }

            return organization;
        },
        enabled: !!userId && userId !== 'user' && !authLoading && !!supabase,
    });
}

export function useOrgInvitation(email: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.organizationInvitations.byEmail(email),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            // Validate email
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                console.error('Invalid email format:', email);
                throw new Error('Invalid email format');
            }

            const { data, error } = await supabase
                .from('organization_invitations')
                .select('*')
                .eq('email', email)
                .neq('status', 'rejected'); // Exclude rejected invitations

            if (error) {
                console.error('Error fetching organization invitations by email:', error);
                throw error;
            }

            return data;
        },
        enabled: !!email && !authLoading && !!supabase,
    });
}

export function useUserSentOrgInvitations(userId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.organizationInvitations.byCreator(userId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            // Validate userId
            if (
                !userId ||
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    userId,
                )
            ) {
                console.error('Invalid user ID format:', userId);
                throw new Error('Invalid user ID format');
            }

            const { data, error } = await supabase
                .from('organization_invitations')
                .select('*')
                .eq('created_by', userId);

            if (error) {
                console.error('Error fetching user sent invitations:', error);
                throw error;
            }

            return data;
        },
        enabled: !!userId && !authLoading && !!supabase,
    });
}

export function useOrgInvitationsByOrgId(orgId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.organizationInvitations.byOrganization(orgId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data, error } = await supabase
                .from('organization_invitations')
                .select('*')
                .eq('organization_id', orgId);

            if (error) {
                console.error('Error fetching invitations by organization ID:', error);
                throw error;
            }

            return data;
        },
        enabled: !!orgId && !authLoading && !!supabase,
    });
}
//             return organizations;
//         },
//         enabled: !!userId,
//     });
// }
