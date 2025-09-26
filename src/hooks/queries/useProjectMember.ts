import { useQuery } from '@tanstack/react-query';

import { ProjectRole } from '@/lib/auth/permissions';
import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';

export function useProjectMemberRole(projectId: string, userId: string) {
    return useQuery({
        queryKey: queryKeys.roles.byProject(projectId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('project_members')
                .select('role')
                .eq('project_id', projectId)
                .eq('user_id', userId)
                .single();
            if (error) {
                console.log(error);
                throw error;
            }
            return data.role as ProjectRole;
        },
        enabled: !!projectId && !!userId,
    });
}
