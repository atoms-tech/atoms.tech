import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Organization } from '@/types/base/organizations.types';
import { Profile } from '@/types/base/profiles.types';

export function usePrefetch() {
    const queryClient = useQueryClient();

    const prefetchOrganization = useCallback(
        async (orgId: string) => {
            await queryClient.prefetchQuery({
                queryKey: queryKeys.organizations.detail(orgId),
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from('organizations')
                        .select('*')
                        .eq('id', orgId)
                        .single();

                    if (error) throw error;
                    return data as Organization;
                },
            });
        },
        [queryClient],
    );

    const prefetchProfile = useCallback(
        async (userId: string) => {
            await queryClient.prefetchQuery({
                queryKey: queryKeys.profiles.detail(userId),
                queryFn: async () => {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', userId)
                        .single();

                    if (error) throw error;
                    return data as Profile;
                },
            });
        },
        [queryClient],
    );

    return {
        prefetchOrganization,
        prefetchProfile,
    };
}
