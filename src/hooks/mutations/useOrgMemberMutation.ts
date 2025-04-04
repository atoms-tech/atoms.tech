import { useMutation, useQueryClient } from '@tanstack/react-query';

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
