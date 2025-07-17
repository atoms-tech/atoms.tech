import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Database } from '@/types/base/database.types';

export type OrganizationInvitationInput = Omit<
    Database['public']['Tables']['organization_invitations']['Insert'],
    'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'deleted_by' | 'is_deleted'
>;

export function useCreateOrgInvitation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: OrganizationInvitationInput) => {
            const { data, error } = await supabase
                .from('organization_invitations')
                .insert(input)
                .select()
                .single();

            if (error) {
                console.error('Failed to create organization invitation', error);
                throw error;
            }

            if (!data) {
                throw new Error('Failed to create organization invitation');
            }

            return data;
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.organizationInvitations.byOrg(data.organization_id),
            });
        },
    });
}
