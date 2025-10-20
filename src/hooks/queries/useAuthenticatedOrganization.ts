import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { Organization } from '@/types/base/organizations.types';

export function useAuthenticatedOrganization(orgId: string) {
    return useQuery({
        queryKey: queryKeys.organizations.detail(orgId),
        queryFn: async () => {
            // Handle empty or invalid orgId more gracefully
            if (!orgId || orgId === '') {
                console.warn('Empty organization ID provided');
                return null;
            }

            // Skip validation for special cases like 'project'
            if (orgId === 'project') {
                console.warn('Special case organization ID:', orgId);
                return null;
            }

            // Validate that orgId is a valid UUID format before querying
            if (
                orgId === 'user' ||
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    orgId,
                )
            ) {
                console.error('Invalid organization ID format:', orgId);
                return null; // Return null instead of throwing to prevent UI errors
            }

            const response = await fetch(`/api/organizations/${orgId}`, {
                method: 'GET',
                cache: 'no-store',
            });

            if (!response.ok) {
                const message = `Error fetching organization: ${response.statusText}`;
                console.error('Error fetching organization:', message);
                throw new Error(message);
            }

            const payload = (await response.json()) as {
                organization: Organization | null;
            };

            return payload.organization;
        },
        enabled: !!orgId && orgId !== 'user' && orgId !== 'project',
    });
}
