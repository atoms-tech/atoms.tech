import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Document } from '@/types/base/documents.types';

export type CreateDocumentInput = Omit<
    Document,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'deleted_at'
    | 'deleted_by'
    | 'is_deleted'
    | 'version'
>;

export function useCreateDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (document: CreateDocumentInput) => {
            const { data, error } = await supabase
                .from('documents')
                .insert({
                    ...document,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_deleted: false,
                    version: 1,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Document;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.documents.byProject(data.project_id),
            });
        },
    });
}

export function useUpdateDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (document: Document) => {
            const { data, error } = await supabase
                .from('documents')
                .update({
                    ...document,
                    updated_at: new Date().toISOString(),
                    version: (document.version || 1) + 1,
                })
                .eq('id', document.id)
                .select()
                .single();

            if (error) throw error;
            return data as Document;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.documents.detail(data.id),
            });
        },
    });
}

export function useDeleteDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            deletedBy,
        }: {
            id: string;
            deletedBy: string;
        }) => {
            const { data, error } = await supabase
                .from('documents')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: deletedBy,
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Document;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.documents.byProject(data.project_id),
            });
        },
    });
}

export function useCreateDocumentWithDefaultSchemas() {
    const createDocumentMutation = useCreateDocument();

    return useMutation({
        mutationFn: async (document: CreateDocumentInput) => {
            const createdDocument =
                await createDocumentMutation.mutateAsync(document);

            return createdDocument;
        },
    });
}
