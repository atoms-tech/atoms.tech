import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Organization } from '@/types/base/organizations.types';
import { Profile } from '@/types/base/profiles.types';

export function usePrefetch() {
    const queryClient = useQueryClient();
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    const ensureSupabaseClient = useCallback(() => {
        if (authLoading) {
            throw new Error('Supabase client is still initializing');
        }
        if (!supabase) {
            throw new Error(authError ?? 'Supabase client not available');
        }

        return supabase;
    }, [authLoading, supabase, authError]);

    const prefetchOrganization = useCallback(
        async (orgId: string) => {
            await queryClient.prefetchQuery({
                queryKey: queryKeys.organizations.detail(orgId),
                queryFn: async () => {
                    const client = ensureSupabaseClient();
                    const { data, error } = await client
                        .from('organizations')
                        .select('*')
                        .eq('id', orgId)
                        .single();

                    if (error) throw error;
                    return data as Organization;
                },
            });
        },
        [queryClient, ensureSupabaseClient],
    );

    const prefetchProfile = useCallback(
        async (userId: string) => {
            await queryClient.prefetchQuery({
                queryKey: queryKeys.profiles.detail(userId),
                queryFn: async () => {
                    const client = ensureSupabaseClient();
                    const { data, error } = await client
                        .from('profiles')
                        .select('*')
                        .eq('id', userId)
                        .single();

                    if (error) throw error;
                    return data as Profile;
                },
            });
        },
        [queryClient, ensureSupabaseClient],
    );

    return {
        prefetchOrganization,
        prefetchProfile,
    };
}
