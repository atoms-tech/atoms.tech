import { useQuery } from '@tanstack/react-query';

import { OrganizationRole } from '@/lib/auth/permissions';
import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';

export function useOrgMemberRole(orgId: string, userId: string) {
    return useQuery({
        queryKey: queryKeys.roles.byOrg(orgId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('organization_members')
                .select('role')
                .eq('organization_id', orgId)
                .eq('user_id', userId)
                .single();
            if (error) {
                console.log(error);
                throw error;
            }
            return data.role as OrganizationRole;
        },
        enabled: !!orgId && !!userId,
    });
}
