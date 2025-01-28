import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Project } from '@/types/base/projects.types';
import { ProjectSchema } from '@/types/validation/projects.validation';

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

export function useProjects(filters?: Record<string, any>) {
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
        queryKey: queryKeys.projects.byOrganization(organizationId),
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

export function useUserProjects(userId: string) {
    return useQuery({
        queryKey: queryKeys.projects.byUser(userId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('owned_by', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Project[];
        },
        enabled: !!userId,
    });
}

export function useProjectsByMembershipForOrg(orgId: string, userId: string) {
    return useQuery({
        queryKey: queryKeys.projects.byOrganization(orgId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('project_members')
                .select('project_id')
                .eq('org_id', orgId)
                .eq('user_id', userId)
                .eq('status', 'active')
                .order('created_at', { ascending: false });
            console.log('Project members', data);
            if (error) throw error;
            const projectIds = data.map((member) => member.project_id);
            const { data: projects, error: projectError } = await supabase
                .from('projects')
                .select('*')
                .in('id', projectIds)
                .eq('is_deleted', false);
            if (projectError) throw projectError;
            return projects.map((project) => ProjectSchema.parse(project));
        },
        enabled: !!orgId && !!userId,
    });
}
