// import { supabase } from '@/lib/supabase/supabaseClient'
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { atomsApiClient } from '@/lib/atoms-api';
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

            const api = atomsApiClient();
            return api.organizations.getById(orgId);
        },
        enabled: !!orgId && orgId !== 'user' && orgId !== 'project',
    });
}

export function useOrganizationsWithFilters(filters?: QueryFilters) {
    return useQuery({
        queryKey: queryKeys.organizations.list(filters || {}),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.organizations.listWithFilters(filters || {});
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
                const api = atomsApiClient();
                const orgs = await api.organizations.listForUser(userId);
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

            const api = atomsApiClient();
            return api.organizations.listWithFilters({ created_by: userId });
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

            const api = atomsApiClient();
            return api.organizations.getPersonalOrg(userId);
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

            const api = atomsApiClient();
            return api.orgInvitations.listByEmail(email);
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

            const api = atomsApiClient();
            return api.orgInvitations.listByCreator(userId);
        },
        enabled: !!userId,
    });
}

export function useOrgInvitationsByOrgId(orgId: string) {
    return useQuery({
        queryKey: queryKeys.organizationInvitations.byOrganization(orgId),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.orgInvitations.listByOrganization(orgId);
        },
        enabled: !!orgId,
    });
}
//             return organizations;
//         },
//         enabled: !!userId,
//     });
// }
