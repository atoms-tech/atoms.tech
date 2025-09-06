import { useQuery } from '@tanstack/react-query';

import { atomsApiClient } from '@/lib/atoms-api';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Profile } from '@/types/base/profiles.types';

export function useProfile(userId: string) {
    return useQuery({
        queryKey: queryKeys.profiles.detail(userId),
        queryFn: async () => {
            const api = atomsApiClient();
            const profile = await api.auth.getProfile(userId);
            return profile as Profile;
        },
        enabled: !!userId,
    });
}

export function useProfileByEmail(email: string) {
    return useQuery({
        queryKey: queryKeys.profiles.byEmail(email),
        queryFn: async () => {
            const api = atomsApiClient();
            const profile = await api.auth.getByEmail(email);
            return profile as Profile | null;
        },
        enabled: !!email,
    });
}
