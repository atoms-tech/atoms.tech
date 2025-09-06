import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import { atomsApiClient } from '@/lib/atoms-api';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Requirement } from '@/types';
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
>;

export function useCreateRequirement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateRequirementInput) => {
            console.log('Creating requirement', input);

            const api = atomsApiClient();
            const created = await api.requirements.create(input as any);
            return RequirementSchema.parse(created);
        },
        onSuccess: (data) => {
            invalidateRequirementQueries(queryClient, data);
        },
    });
}

export function useUpdateRequirement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...input }: Partial<Requirement> & { id: string }) => {
            console.log('Updating requirement', id, input);

            const api = atomsApiClient();
            const updated = await api.requirements.update(id, input as Requirement);
            return RequirementSchema.parse(updated);
        },
        onSuccess: (data) => {
            invalidateRequirementQueries(queryClient, data);
        },
    });
}

export function useDeleteRequirement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, deletedBy }: { id: string; deletedBy: string }) => {
            console.log('Deleting requirement', id);

            const api = atomsApiClient();
            const deleted = await api.requirements.softDelete(id, deletedBy);
            return RequirementSchema.parse(deleted);
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

const invalidateRequirementQueries = (queryClient: QueryClient, data: Requirement) => {
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
