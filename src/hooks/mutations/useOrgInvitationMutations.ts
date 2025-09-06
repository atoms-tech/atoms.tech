import { useMutation, useQueryClient } from '@tanstack/react-query';

import { atomsApiClient } from '@/lib/atoms-api';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Database } from '@/types/base/database.types';

export type OrganizationInvitationInput = Omit<
    Database['public']['Tables']['organization_invitations']['Insert'],
    'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'deleted_by' | 'is_deleted'
>;

export function useCreateOrgInvitation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: OrganizationInvitationInput) => {
            const api = atomsApiClient();
            return api.organizations.invite(input as any);
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.organizationInvitations.byOrg(data.organization_id),
            });
        },
    });
}
