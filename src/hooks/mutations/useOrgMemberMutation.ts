import { useMutation, useQueryClient } from '@tanstack/react-query';

import { OrganizationRole } from '@/lib/auth/permissions';
import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
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
            const { data, error } = await supabase
                .from('organization_members')
                .insert(input)
                .select()
                .single();

            if (error) {
                console.error('Failed to create organization member', error);
                throw error;
            }

            if (!data) {
                throw new Error('Failed to create organization member');
            }

            return data;
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
            const { count, error: countError } = await supabase
                .from('organization_members')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', orgId);

            if (countError) {
                console.error('Failed to count organization members', countError);
                throw countError;
            }

            // Update the member_count in the organizations table
            const { error: updateError } = await supabase
                .from('organizations')
                .update({ member_count: count })
                .eq('id', orgId);

            if (updateError) {
                console.error(
                    'Failed to update member count in organizations',
                    updateError,
                );
                throw updateError;
            }

            return count;
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
            const { error } = await supabase
                .from('organization_members')
                .update({ role })
                .eq('organization_id', orgId)
                .eq('user_id', userId);

            if (error) {
                console.error('Failed to update organization member role', error);
                throw error;
            }

            return { userId, orgId, role };
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
