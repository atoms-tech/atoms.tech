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
            // Validate that orgId is a valid UUID format before querying
            if (
                !orgId ||
                orgId === 'user' ||
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    orgId,
                )
            ) {
                console.error('Invalid organization ID format:', orgId);
                throw new Error('Invalid organization ID format');
            }

            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', orgId)
                .eq('is_deleted', false)
                .single();

            if (error) {
                console.error('Error fetching organization:', error);
                throw error;
            }
            return data;
        },
        enabled: !!orgId && orgId !== 'user',
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
                console.log(
                    `Retrieved ${orgs.length} organizations for user ${userId}`,
                );
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

// export function useOrgsByUser(userId: string) {
//     return useQuery({
//         queryKey: queryKeys.organizations.byUser(userId),
//         queryFn: async () => {
//             const { data: organizations, error } = await supabase
//                 .from('organizations')
//                 .select('*')
//                 .eq('created_by', userId)
//                 .eq('is_deleted', false);

//             if (error) {
//                 console.error('Error fetching organizations:', error);
//                 throw error;
//             }

//             return organizations;
//         },
//         enabled: !!userId,
//     });
// }
