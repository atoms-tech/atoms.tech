// import { supabase } from '@/lib/supabase/supabaseClient'
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { getUserOrganizations } from '@/lib/db/client';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { QueryFilters } from '@/types/base/filters.types';
import { OrganizationSchema } from '@/types/validation/organizations.validation';

export function useOrganization(orgId: string) {
    return useQuery({
        queryKey: queryKeys.organizations.detail(orgId),
        queryFn: async () => {
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
            return OrganizationSchema.parse(data);
        },
        enabled: !!orgId,
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
            return data.map((org) => OrganizationSchema.parse(org));
        },
    });
}

export function useOrganizationsByMembership(userId: string) {
    return useQuery({
        queryKey: queryKeys.organizations.byUser(userId),
        queryFn: async () => {
            // Fetch the organization IDs the user is part of
            const { data: memberships, error: membershipsError } =
                await supabase
                    .from('organization_members')
                    .select('organization_id')
                    .eq('user_id', userId)
                    .eq('status', 'active')
                    .eq('is_deleted', false);

            if (membershipsError) {
                console.error('Error fetching memberships:', membershipsError);
                throw membershipsError;
            }

            if (!memberships || memberships.length === 0) {
                console.log('No memberships found for user:', userId);
                return []; // Return an empty array if no memberships are found
            }

            const organizationIds = memberships.map(
                (member) => member.organization_id,
            ) as string[];

            const { data: organizations, error: organizationsError } =
                await supabase
                    .from('organizations')
                    .select('*')
                    .in('id', organizationIds)
                    .eq('is_deleted', false);

            if (organizationsError) throw organizationsError;
            return organizations.map((org) => OrganizationSchema.parse(org));
        },
        enabled: !!userId, // Only run the query if userId is provided
    });
}

export function useOrgByUser(userId: string) {
    return useQuery({
        queryKey: queryKeys.organizations.all,
        queryFn: async () => {
            return await getUserOrganizations(userId);
        },
    });
}

export function useOrgsByUser(userId: string) {
    return useQuery({
        queryKey: queryKeys.organizations.byUser(userId),
        queryFn: async () => {
            const { data: organizations, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('created_by', userId)
                .eq('is_deleted', false);

            if (error) {
                console.error('Error fetching organizations:', error);
                throw error;
            }

            return organizations.map((org) => OrganizationSchema.parse(org));
        },
        enabled: !!userId,
    });
}
