import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { Project } from '@/types/base/projects.types';

export function useAuthenticatedProjectsByMembershipForOrg(
    orgId: string,
    userId: string,
) {
    return useQuery({
        queryKey: queryKeys.projects.byOrg(orgId),
        queryFn: async () => {
            const response = await fetch(`/api/organizations/${orgId}/projects`, {
                method: 'GET',
                cache: 'no-store',
            });

            if (!response.ok) {
                const message = `Error fetching project memberships: ${response.statusText}`;
                console.error(message);
                throw new Error(message);
            }

            const payload = (await response.json()) as {
                projects: Project[];
            };

            return payload.projects;
        },
        enabled: !!orgId && !!userId,
    });
}
