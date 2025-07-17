import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ProjectRole } from '@/lib/auth/permissions';
import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Project } from '@/types/base/projects.types';

export type CreateProjectInput = Omit<
    Project,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'deleted_at'
    | 'deleted_by'
    | 'is_deleted'
    | 'star_count'
    | 'version'
    | 'settings'
    | 'tags'
>;

export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateProjectInput) => {
            // Start a Supabase transaction
            console.log('Creating project', input);
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .insert({
                    name: input.name,
                    slug: input.slug,
                    description: input.description,
                    organization_id: input.organization_id,
                    visibility: input.visibility,
                    status: input.status,
                    metadata: input.metadata,
                    created_by: input.owned_by,
                    updated_by: input.owned_by,
                    owned_by: input.owned_by,
                })
                .select()
                .single();

            if (projectError) {
                throw new Error(
                    `Failed to create project, Supabase insert error: '${projectError.message || 'Unknown error'}`,
                );
            }
            if (!project) {
                throw new Error('Failed to create project, insert returned no data.');
            }

            return project;
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.list({}),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.byOrg(data.organization_id),
            });
            // Invalidate the specific project detail query to ensure ProjectDashboard updates correctly
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.detail(data.id),
            });
            // Also invalidate any project member queries that might be affected
            queryClient.invalidateQueries({
                queryKey: ['project_members'],
            });
        },
    });
}

export function useCreateProjectMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            userId,
            projectId,
            role,
            orgId,
        }: {
            userId: string;
            projectId: string;
            role: ProjectRole;
            orgId: string; // Add orgId to the parameters
        }) => {
            const { data, error } = await supabase
                .from('project_members')
                .insert({
                    user_id: userId,
                    project_id: projectId,
                    role,
                    org_id: orgId, // Include org_id in the insert
                    status: 'active',
                })
                .select()
                .single();

            if (error) {
                console.error('Failed to assign user to project', error);
                throw error;
            }

            return data;
        },
        onSuccess: (_, { projectId }) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.detail(projectId),
            });
        },
    });
}

export type UpdateProjectInput = Partial<
    Omit<
        Project,
        | 'id'
        | 'created_at'
        | 'updated_at'
        | 'deleted_at'
        | 'deleted_by'
        | 'is_deleted'
        | 'star_count'
        | 'version'
        | 'settings'
        | 'tags'
    >
>;

export function useUpdateProject(projectId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: UpdateProjectInput) => {
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .update({
                    name: input.name,
                    description: input.description,
                    visibility: input.visibility,
                    status: input.status,
                    metadata: input.metadata,
                    updated_by: input.updated_by,
                })
                .eq('id', projectId)
                .select()
                .single();

            if (projectError) {
                console.error('Failed to update project', projectError);
                throw projectError;
            }
            if (!project) {
                throw new Error('Failed to update project');
            }

            return project;
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.list({}),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.byOrg(data.organization_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.detail(data.id),
            });
        },
    });
}

export function useDuplicateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            projectId,
            userId,
            newName,
        }: {
            projectId: string;
            userId: string;
            newName?: string;
        }) => {
            // First, get the original project
            const { data: originalProject, error: fetchError } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single();

            if (fetchError) {
                console.error('Failed to fetch original project', fetchError);
                throw fetchError;
            }
            if (!originalProject) {
                throw new Error('Original project not found');
            }

            // Create a new project with duplicated data
            const duplicatedProject = {
                name: newName || `${originalProject.name} (Copy)`,
                slug: `${originalProject.slug}-copy-${Date.now()}`,
                description: originalProject.description,
                organization_id: originalProject.organization_id,
                visibility: originalProject.visibility,
                status: originalProject.status,
                metadata: originalProject.metadata,
                created_by: userId,
                updated_by: userId,
                owned_by: userId,
            };

            const { data: newProject, error: createError } = await supabase
                .from('projects')
                .insert(duplicatedProject)
                .select()
                .single();

            if (createError) {
                console.error('Failed to create duplicated project', createError);
                throw createError;
            }
            if (!newProject) {
                throw new Error('Failed to create duplicated project');
            }

            // Add the user as owner of the new project
            const { error: memberError } = await supabase.from('project_members').insert({
                user_id: userId,
                project_id: newProject.id,
                role: 'owner',
                org_id: originalProject.organization_id,
                status: 'active',
            });

            if (memberError) {
                console.error('Failed to add user as project member', memberError);
                // Don't throw here as the project was created successfully
            }

            return newProject;
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.list({}),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.byOrg(data.organization_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.detail(data.id),
            });
        },
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            projectId,
            userId,
        }: {
            projectId: string;
            userId: string;
        }) => {
            const { data: project, error: projectError } = await supabase
                .from('projects')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: userId,
                })
                .eq('id', projectId)
                .select()
                .single();

            if (projectError) {
                console.error('Failed to delete project', projectError);
                throw projectError;
            }
            if (!project) {
                throw new Error('Failed to delete project');
            }

            return project;
        },
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.list({}),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.byOrg(data.organization_id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.projects.detail(data.id),
            });
        },
    });
}
