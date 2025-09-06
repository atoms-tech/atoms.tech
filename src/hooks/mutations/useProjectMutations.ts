import { useMutation, useQueryClient } from '@tanstack/react-query';

import { atomsApiClient } from '@/lib/atoms-api';
import { ProjectRole } from '@/lib/auth/permissions';
import { queryKeys } from '@/lib/constants/queryKeys';
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
            const api = atomsApiClient();
            return api.projects.create({
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
            } as any) as unknown as Project;
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
            const api = atomsApiClient();
            return api.projects.addMember(projectId, userId, role, orgId);
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
            const api = atomsApiClient();
            return api.projects.update(projectId, {
                name: input.name,
                description: input.description,
                visibility: input.visibility,
                status: input.status,
                metadata: input.metadata,
                updated_by: input.updated_by,
            } as any) as unknown as Project;
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
            const api = atomsApiClient();
            const originalProject = await api.projects.getById(projectId);
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

            const newProject = await api.projects.create(duplicatedProject as any);

            // Add the user as owner of the new project
            await api.projects.addMember(
                (newProject as any).id,
                userId,
                'owner',
                (originalProject as any).organization_id,
            );

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
            const api = atomsApiClient();
            return api.projects.softDelete(projectId, userId) as unknown as Project;
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
