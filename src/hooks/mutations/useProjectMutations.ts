import { useMutation, useQueryClient } from '@tanstack/react-query';

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
                console.error('Failed to create project', projectError);
                throw projectError;
            }
            if (!project) {
                throw new Error('Failed to create project');
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
