import {
    QueryClient,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Requirement } from '@/types';

export type CreateRequirementInput = Omit<
    Requirement,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'deleted_at'
    | 'deleted_by'
    | 'is_deleted'
    | 'version'
>;

export function useCreateRequirement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateRequirementInput) => {
            console.log('Creating requirement', input);

            const { data: requirement, error: requirementError } =
                await supabase
                    .from('requirements')
                    .insert({
                        ai_analysis: input.ai_analysis,
                        block_id: input.block_id,
                        description: input.description,
                        document_id: input.document_id,
                        enchanced_requirement: input.enchanced_requirement,
                        external_id: 'REQ-001',
                        format: input.format,
                        level: input.level,
                        name: input.name,
                        original_requirement: input.original_requirement,
                        priority: input.priority,
                        status: input.status,
                        tags: input.tags,
                        created_by: input.created_by,
                        updated_by: input.updated_by,
                        version: 1,
                    })
                    .select()
                    .single();

            if (requirementError) {
                console.error('Failed to create requirement', requirementError);
                throw requirementError;
            }

            if (!requirement) {
                throw new Error('Failed to create requirement');
            }

            return requirement;
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

            return requirement;
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

            return requirement;
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
            data: Partial<Requirement>;
            userId: string;
        }) => {
            return await updateRequirementMutation.mutateAsync({
                id: requirementId,
                ...data,
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
