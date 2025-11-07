import { useQuery } from '@tanstack/react-query';

/**
 * Check if the current user is a platform admin
 */
export function useIsPlatformAdmin() {
    return useQuery<boolean>({
        queryKey: ['is-platform-admin'],
        queryFn: async () => {
            const res = await fetch('/api/auth/check-admin');

            if (!res.ok) {
                return false;
            }

            const data = await res.json();
            return data.isAdmin || false;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

