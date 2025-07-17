// import { supabase } from '@/lib/supabase/supabaseClient'
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { getUserOrganizations } from '@/lib/db/client';
import { supabase } from '@/lib/supabase/supabaseBrowser';
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

            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', orgId)
                .eq('is_deleted', false)
                .single();

            if (error) {
                console.error('Error fetching organization:', error);
                return null; // Return null instead of throwing to prevent UI errors
            }
            return data;
        },
        enabled: !!orgId && orgId !== 'user' && orgId !== 'project',
    });
}

export function useOrganizationsWithFilters(filters?: QueryFilters) {
    return useQuery({
        queryKey: queryKeys.organizations.list(filters || {}),
        queryFn: async () => {
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
    });
}

export function useOrganizationsByMembership(userId: string) {
    return useQuery({
        queryKey: queryKeys.organizations.byMembership(userId),
        queryFn: async () => {
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
                const orgs = await getUserOrganizations(userId);
                console.log(`Retrieved ${orgs.length} organizations for user ${userId}`);
                return orgs;
            } catch (error) {
                console.error('Error in useOrganizationsByMembership:', error);
                throw error;
            }
        },
        enabled: !!userId && userId !== '' && userId !== 'user', // Only run the query if userId is valid
    });
}

export function useOrgsByUser(userId: string) {
    return useQuery({
        queryKey: queryKeys.organizations.byUser(userId),
        queryFn: async () => {
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
        enabled: !!userId && userId !== 'user',
    });
}

export function usePersonalOrg(userId: string) {
    return useQuery({
        queryKey: queryKeys.organizations.createdBy(userId),
        queryFn: async () => {
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
        enabled: !!userId && userId !== 'user',
    });
}

export function useOrgInvitation(email: string) {
    return useQuery({
        queryKey: queryKeys.organizationInvitations.byEmail(email),
        queryFn: async () => {
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
        enabled: !!email,
    });
}

export function useUserSentOrgInvitations(userId: string) {
    return useQuery({
        queryKey: queryKeys.organizationInvitations.byCreator(userId),
        queryFn: async () => {
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
        enabled: !!userId,
    });
}

export function useOrgInvitationsByOrgId(orgId: string) {
    return useQuery({
        queryKey: queryKeys.organizationInvitations.byOrganization(orgId),
        queryFn: async () => {
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
        enabled: !!orgId,
    });
}
//             return organizations;
//         },
//         enabled: !!userId,
//     });
// }
