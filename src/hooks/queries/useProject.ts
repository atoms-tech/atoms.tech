import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { getUserProjects } from '@/lib/db/client';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { QueryFilters } from '@/types/base/filters.types';
import { Project } from '@/types/base/projects.types';

export function useProject(projectId: string) {
    return useQuery({
        queryKey: queryKeys.projects.detail(projectId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (error) throw error;
            return data as Project;
        },
        enabled: !!projectId,
    });
}

export function useProjects(filters?: QueryFilters) {
    return useQuery({
        queryKey: queryKeys.projects.list(filters || {}),
        queryFn: async () => {
            let query = supabase.from('projects').select('*');

            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined) {
                        query = query.eq(key, value);
                    }
                });
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as Project[];
        },
    });
}

export function useOrganizationProjects(organizationId: string) {
    return useQuery({
        queryKey: queryKeys.projects.byOrg(organizationId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Project[];
        },
        enabled: !!organizationId,
    });
}

export function useUserProjects(userId: string, orgId: string) {
    return useQuery({
        queryKey: queryKeys.projects.byOrg(orgId),
        queryFn: async () => getUserProjects(userId, orgId),
        enabled: !!userId && !!orgId,
    });
}

export function useProjectsByMembershipForOrg(orgId: string, userId: string) {
    return useQuery({
        queryKey: queryKeys.projects.byOrg(orgId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('project_members')
                .select('project_id')
                .eq('org_id', orgId) // Filter by organization ID
                .eq('user_id', userId) // Filter by user ID
                .eq('status', 'active'); // Ensure the membership is active

            if (error) throw error;

            const projectIds = data.map((member) => member.project_id);

            const { data: projects, error: projectError } = await supabase
                .from('projects')
                .select('*')
                .in('id', projectIds)
                .eq('organization_id', orgId) // Ensure projects belong to the organization
                .eq('is_deleted', false); // Exclude deleted projects

            if (projectError) throw projectError;

            return projects;
        },
        enabled: !!orgId && !!userId,
    });
}
