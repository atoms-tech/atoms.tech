import { useQuery } from '@tanstack/react-query';

import { OrganizationRole } from '@/lib/auth/permissions';
import { queryKeys } from '@/lib/constants/queryKeys';

export function useOrgMemberRole(orgId: string, userId: string) {
    return useQuery({
        queryKey: queryKeys.roles.byOrg(orgId),
        queryFn: async () => {
            const response = await fetch(`/api/organizations/${orgId}/role`, {
                method: 'GET',
                cache: 'no-store',
            });

            if (!response.ok) {
                const message = `Error fetching organization role: ${response.statusText}`;
                console.error(message);
                throw new Error(message);
            }

            const payload = (await response.json()) as {
                role: OrganizationRole;
            };

            return payload.role;
        },
        enabled: !!orgId && !!userId,
    });
}
