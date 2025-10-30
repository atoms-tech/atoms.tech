import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
import { generateNextRequirementId } from '@/lib/utils/requirementIdGenerator';
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
>;

const useSupabaseClientOrThrow = () => {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return () => {
        if (authLoading) {
            throw new Error('Supabase client is still initializing');
        }
        if (!supabase) {
            throw new Error(authError ?? 'Supabase client not available');
        }

        return supabase;
    };
};

export function useCreateRequirement() {
    const queryClient = useQueryClient();
    const ensureSupabaseClient = useSupabaseClientOrThrow();

    return useMutation({
        mutationFn: async (input: CreateRequirementInput) => {
            console.log('Creating requirement', input);

            // Get the organization ID from the document
            const client = ensureSupabaseClient();
            const { data: document, error: docError } = await client
                .from('documents')
                .select(
                    `
                    project_id,
                    projects!inner(organization_id)
                `,
                )
                .eq('id', input.document_id)
                .single();

            if (docError) {
                console.error('Error fetching document for org ID:', docError);
                throw new Error('Failed to fetch document information');
            }

            // Generate the next requirement ID for this organization
            const organizationId = (
                document as { projects?: { organization_id?: string } }
            )?.projects?.organization_id;
            let externalId = 'REQ-001'; // fallback

            if (organizationId) {
                try {
                    externalId = await generateNextRequirementId(client, organizationId);
                } catch (error) {
                    console.error('Error generating requirement ID:', error);
                    // Use fallback ID with timestamp
                    const timestamp = Date.now().toString().slice(-6);
                    externalId = `REQ-${timestamp}`;
                }
            }

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

            const { data: requirement, error: requirementError } = await client
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

            return RequirementSchema.parse(requirement) as Requirement;
        },
        onSuccess: (data) => {
            invalidateRequirementQueries(queryClient, data);
        },
    });
}

export function useUpdateRequirement() {
    const queryClient = useQueryClient();
    const ensureSupabaseClient = useSupabaseClientOrThrow();

    return useMutation({
        mutationFn: async ({ id, ...input }: Partial<Requirement> & { id: string }) => {
            console.log('Updating requirement', id, input);

            const client = ensureSupabaseClient();
            const { data: requirement, error: requirementError } = await client
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

            return RequirementSchema.parse(requirement) as Requirement;
        },
        onSuccess: (data) => {
            invalidateRequirementQueries(queryClient, data);
        },
    });
}

export function useDeleteRequirement() {
    const queryClient = useQueryClient();
    const ensureSupabaseClient = useSupabaseClientOrThrow();

    return useMutation({
        mutationFn: async ({ id, deletedBy }: { id: string; deletedBy: string }) => {
            console.log('Deleting requirement', id);

            const client = ensureSupabaseClient();
            const { data: requirement, error: requirementError } = await client
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

            return RequirementSchema.parse(requirement) as Requirement;
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
