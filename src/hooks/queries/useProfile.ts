import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Profile } from '@/types/base/profiles.types';

export function useProfile(userId: string) {
    return useQuery({
        queryKey: queryKeys.profiles.detail(userId),
        queryFn: async () => {
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
        enabled: !!userId,
    });
}

export function useProfileByEmail(email: string) {
    return useQuery({
        queryKey: queryKeys.profiles.byEmail(email),
        queryFn: async () => {
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
        enabled: !!email,
    });
}
