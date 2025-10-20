import { useQuery } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Profile } from '@/types/base/profiles.types';

export function useProfile(userId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.profiles.detail(userId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) {
                console.log(error);
                throw error;
            }
            return data as Profile;
        },
        enabled: !!userId && !authLoading && !!supabase,
    });
}

export function useProfileByEmail(email: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.profiles.byEmail(email),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .ilike('email', email)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // Handle case where no rows are returned
                    return null;
                }
                console.log(error);
                throw error;
            }
            return data as Profile;
        },
        enabled: !!email && !authLoading && !!supabase,
    });
}
