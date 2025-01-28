import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { queryKeys } from '@/lib/constants/queryKeys';
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
