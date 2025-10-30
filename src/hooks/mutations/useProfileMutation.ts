import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Database } from '@/types/base/database.types';

export type ProfileInput = Database['public']['Tables']['profiles']['Update'];

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    const ensureSupabaseClient = () => {
        if (authLoading) {
            throw new Error('Supabase client is still initializing');
        }
        if (!supabase) {
            throw new Error(authError ?? 'Supabase client not available');
        }

        return supabase;
    };

    return useMutation({
        mutationFn: async (input: ProfileInput) => {
            if (!input.id) throw new Error('No Profile Id Provided');

            const client = ensureSupabaseClient();

            const { error } = await client
                .from('profiles')
                .update({
                    ...input,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', input.id);

            if (error) {
                throw new Error('Error Updating Profile');
            }
        },
        onSuccess: (_, variables) => {
            // Invalidate relevant queries
            if (!variables.id) return;
            queryClient.invalidateQueries({
                queryKey: queryKeys.profiles.detail(variables.id),
            });
            if (!variables.email) return;
            queryClient.invalidateQueries({
                queryKey: queryKeys.profiles.byEmail(variables.email),
            });
        },
    });
}
