import { useQuery } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
import { getUserProjects } from '@/lib/db/client';
import { QueryFilters } from '@/types/base/filters.types';
import { Project } from '@/types/base/projects.types';

export function useProject(projectId: string) {
    return useQuery({
        queryKey: queryKeys.projects.detail(projectId),
        queryFn: async () => {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'GET',
                cache: 'no-store',
            });

            if (!response.ok) {
                const message = `Error fetching project: ${response.statusText}`;
                console.error(message);
                throw new Error(message);
            }

            const payload = (await response.json()) as {
                project: Project;
            };

            return payload.project;
        },
        enabled: !!projectId,
    });
}

export function useProjects(filters?: QueryFilters) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.projects.list(filters || {}),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

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
        enabled: !authLoading && !!supabase,
    });
}

export function useOrganizationProjects(organizationId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.projects.byOrg(organizationId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Project[];
        },
        enabled: !!organizationId && !authLoading && !!supabase,
    });
}

export function useUserProjects(userId: string, orgId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.projects.byOrg(orgId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            return getUserProjects(supabase, userId, orgId);
        },
        enabled: !!userId && !!orgId && !authLoading && !!supabase,
    });
}

export function useProjectsByMembershipForOrg(orgId: string, userId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.projects.byOrg(orgId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

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
        enabled: !!orgId && !!userId && !authLoading && !!supabase,
    });
}
