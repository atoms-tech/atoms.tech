import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Database } from '@/types/base/database.types';

export type ProfileInput = Database['public']['Tables']['profiles']['Update'];

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: ProfileInput) => {
            if (!input.id) throw new Error('No Profile Id Provided');

            const { error } = await supabase
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
