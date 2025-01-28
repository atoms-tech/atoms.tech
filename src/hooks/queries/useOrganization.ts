import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';
// import { supabase } from '@/lib/supabase/supabaseClient'
import { queryKeys } from '@/lib/constants/queryKeys';
import {
    Organization,
    OrganizationMembers,
} from '@/types/base/organizations.types';
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

export function useOrganizations(organizationIds?: string[]) {
    return useQuery({
        queryKey: queryKeys.organizations.list(organizationIds || {}),
        queryFn: async () => {
            let query = supabase
                .from('organizations')
                .select('*')
                .in('id', organizationIds || [])
                .eq('is_deleted', false);

            const { data, error } = await query;
            if (error) throw error;
            return data.map((org) => OrganizationSchema.parse(org));
        },
        enabled: !!organizationIds,
    });
}

export function useOrganizationsWithFilters(filters?: Record<string, any>) {
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
