import { useQuery } from '@tanstack/react-query';

import { ProjectRole } from '@/lib/auth/permissions';
import { queryKeys } from '@/lib/constants/queryKeys';

export function useProjectMemberRole(projectId: string, userId: string) {
    return useQuery({
        queryKey: queryKeys.roles.byProject(projectId),
        queryFn: async () => {
            const response = await fetch(`/api/projects/${projectId}/role`, {
                method: 'GET',
                cache: 'no-store',
            });

            if (!response.ok) {
                const message = `Error fetching project role: ${response.statusText}`;
                console.error(message);
                throw new Error(message);
            }

            const payload = (await response.json()) as {
                role: ProjectRole;
            };

            return payload.role;
        },
        enabled: !!projectId && !!userId,
    });
}
