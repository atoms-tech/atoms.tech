import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Database } from '@/types/base/database.types';

export type OrganizationInvitationInput = Omit<
    Database['public']['Tables']['organization_invitations']['Insert'],
    'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'deleted_by' | 'is_deleted'
>;

const useSupabaseClientOrThrow = () => {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return () => {
        if (authLoading) {
            throw new Error('Supabase client is still initializing');
        }
        if (!supabase) {
            throw new Error(authError ?? 'Supabase client not available');
        }

        return supabase;
    };
};

export function useCreateOrgInvitation() {
    const queryClient = useQueryClient();
    const ensureSupabaseClient = useSupabaseClientOrThrow();

    return useMutation({
        mutationFn: async (input: OrganizationInvitationInput) => {
            const client = ensureSupabaseClient();
            const { data, error } = await client
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
