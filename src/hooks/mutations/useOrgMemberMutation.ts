import { useMutation, useQueryClient } from '@tanstack/react-query';

import { OrganizationRole } from '@/lib/auth/permissions';
import { queryKeys } from '@/lib/constants/queryKeys';
import { atomsApiClient } from '@/lib/atoms-api';
import { Database } from '@/types/base/database.types';

export type OrganizationMemberInput = Pick<
    Database['public']['Tables']['organization_members']['Insert'],
    | 'organization_id'
    | 'user_id'
    | 'role'
    | 'status'
    | 'last_active_at'
    | 'permissions'
    | 'created_at'
    | 'updated_at'
    | 'is_deleted'
    | 'deleted_by'
    | 'deleted_at'
>;

export function useCreateOrgMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: OrganizationMemberInput) => {
            const api = atomsApiClient();
            return api.organizations.addMember(input as any);
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.organizations.detail(data.organization_id),
            });
        },
    });
}

export function useSetOrgMemberCount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (orgId: string) => {
            // Query the organization_members table to count members
            const api = atomsApiClient();
            return api.organizations.updateMemberCount(orgId);
        },
        onSuccess: (_, orgId) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.organizations.detail(orgId),
            });
        },
    });
}

export function useSetOrgMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            userId,
            orgId,
            role,
        }: {
            userId: string;
            orgId: string;
            role: OrganizationRole;
        }) => {
            // Update the role of the user in the organization_members table
            const api = atomsApiClient();
            return api.organizations.setMemberRole(orgId, userId, role);
        },
        onSuccess: (_, { orgId }) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.organizations.detail(orgId),
            });
            queryClient.invalidateQueries({
                queryKey: [queryKeys.organizations.list, orgId],
            });
        },
    });
}
