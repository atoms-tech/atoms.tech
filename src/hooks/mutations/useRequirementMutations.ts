import {
    QueryClient,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { generateNextReqId } from '@/lib/utils/reqIdGenerator';
import { Requirement } from '@/types';
import { TablesInsert } from '@/types/base/database.types';
import { RequirementSchema } from '@/types/validation/requirements.validation';

export type CreateRequirementInput = Omit<
    Requirement,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'deleted_at'
    | 'deleted_by'
    | 'is_deleted'
    | 'version'
> & {
    external_id?: string; // Make external_id optional for auto-generation
};



export function useCreateRequirement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateRequirementInput & { project_id?: string }) => {
            console.log('Creating requirement', input);

            // Get project ID from document if not provided directly
            let projectId = input.project_id;
            if (!projectId) {
                const { data: document, error: docError } = await supabase
                    .from('documents')
                    .select('project_id')
                    .eq('id', input.document_id)
                    .single();

                if (docError) {
                    console.error('Error fetching document for project ID:', docError);
                    throw docError;
                }
                projectId = document.project_id;
            }

            // Generate the next REQ-ID
            const externalId = await generateNextReqId(projectId);

            const insertData: TablesInsert<'requirements'> = {
                block_id: input.block_id,
                document_id: input.document_id,
                name: input.name,
                ai_analysis: input.ai_analysis,
                description: input.description,
                enchanced_requirement: input.enchanced_requirement,
                external_id: externalId,
                format: input.format,
                level: input.level,
                original_requirement: input.original_requirement,
                priority: input.priority,
                status: input.status,
                tags: input.tags,
                created_by: input.created_by,
                updated_by: input.updated_by,
                properties: input.properties || {},
                version: 1,
                position: input.position,
                type: input.type || null,
            };

            const { data: requirement, error: requirementError } =
                await supabase
                    .from('requirements')
                    .insert(insertData)
                    .select()
                    .single();

            if (requirementError) {
                console.error('Failed to create requirement', requirementError);
                throw requirementError;
            }

            if (!requirement) {
                throw new Error('Failed to create requirement');
            }

            return RequirementSchema.parse(requirement);
        },
        onSuccess: (data) => {
            invalidateRequirementQueries(queryClient, data);
        },
    });
}

export function useUpdateRequirement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            ...input
        }: Partial<Requirement> & { id: string }) => {
            console.log('Updating requirement', id, input);

            const { data: requirement, error: requirementError } =
                await supabase
                    .from('requirements')
                    .update({
                        ...input,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id)
                    .select()
                    .single();

            if (requirementError) {
                console.error('Failed to update requirement', requirementError);
                throw requirementError;
            }

            if (!requirement) {
                throw new Error('Failed to update requirement');
            }

            return RequirementSchema.parse(requirement);
        },
        onSuccess: (data) => {
            invalidateRequirementQueries(queryClient, data);
        },
    });
}

export function useDeleteRequirement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            deletedBy,
        }: {
            id: string;
            deletedBy: string;
        }) => {
            console.log('Deleting requirement', id);

            const { data: requirement, error: requirementError } =
                await supabase
                    .from('requirements')
                    .update({
                        is_deleted: true,
                        deleted_at: new Date().toISOString(),
                        deleted_by: deletedBy,
                    })
                    .eq('id', id)
                    .select()
                    .single();

            if (requirementError) {
                console.error('Failed to delete requirement', requirementError);
                throw requirementError;
            }

            if (!requirement) {
                throw new Error('Failed to delete requirement');
            }

            return RequirementSchema.parse(requirement);
        },
        onSuccess: (data) => {
            invalidateRequirementQueries(queryClient, data);
        },
    });
}

// Helper function to update requirement data
export function useSyncRequirementData() {
    const updateRequirementMutation = useUpdateRequirement();

    return useMutation({
        mutationFn: async ({
            requirementId,
            data,
            userId,
        }: {
            requirementId: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: Record<string, any>;
            userId: string;
        }) => {
            return await updateRequirementMutation.mutateAsync({
                id: requirementId,
                properties: data,
                updated_by: userId,
            });
        },
    });
}

const invalidateRequirementQueries = (
    queryClient: QueryClient,
    data: Requirement,
) => {
    queryClient.invalidateQueries({
        queryKey: queryKeys.requirements.list({}),
    });
    queryClient.invalidateQueries({
        queryKey: queryKeys.requirements.detail(data.id),
    });
    queryClient.invalidateQueries({
        queryKey: queryKeys.requirements.byDocument(data.document_id),
    });
    queryClient.invalidateQueries({
        queryKey: queryKeys.requirements.byBlock(data.block_id),
    });
};
