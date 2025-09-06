import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { queryKeys } from '@/lib/constants/queryKeys';
import { atomsApiClient } from '@/lib/atoms-api';
import { Organization } from '@/types/base/organizations.types';
import { Profile } from '@/types/base/profiles.types';

export function usePrefetch() {
    const queryClient = useQueryClient();

    const prefetchOrganization = useCallback(
        async (orgId: string) => {
            await queryClient.prefetchQuery({
                queryKey: queryKeys.organizations.detail(orgId),
                queryFn: async () => {
                    const api = atomsApiClient();
                    return (await api.organizations.getById(orgId)) as Organization;
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
                    const api = atomsApiClient();
                    return (await api.auth.getProfile(userId)) as Profile;
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
