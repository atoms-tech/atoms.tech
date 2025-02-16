import {
    QueryClient,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Document } from '@/types';
import { DocumentSchema } from '@/types/validation/documents.validation';

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
        mutationFn: async (input: CreateDocumentInput) => {
            console.log('Creating document', input);

            const { data: document, error: documentError } = await supabase
                .from('documents')
                .insert({
                    name: input.name,
                    slug: input.slug,
                    description: input.description,
                    project_id: input.project_id,
                    tags: input.tags,
                    created_by: input.created_by,
                    updated_by: input.updated_by,
                })
                .select()
                .single();

            if (documentError) {
                console.error('Failed to create document', documentError);
                throw documentError;
            }

            if (!document) {
                throw new Error('Failed to create document');
            }

            return DocumentSchema.parse(document);
        },
        onSuccess: (data) => {
            invalidateDocumentQueries(queryClient, data);
        },
    });
}

export function useUpdateDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            ...input
        }: Partial<Document> & { id: string }) => {
            console.log('Updating document', id, input);

            const { data: document, error: documentError } = await supabase
                .from('documents')
                .update({
                    ...input,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (documentError) {
                console.error('Failed to update document', documentError);
                throw documentError;
            }

            if (!document) {
                throw new Error('Failed to update document');
            }

            return DocumentSchema.parse(document);
        },
        onSuccess: (data) => {
            invalidateDocumentQueries(queryClient, data);
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
            console.log('Deleting document', id);

            const { data: document, error: documentError } = await supabase
                .from('documents')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: deletedBy,
                })
                .eq('id', id)
                .select()
                .single();

            if (documentError) {
                console.error('Failed to delete document', documentError);
                throw documentError;
            }

            if (!document) {
                throw new Error('Failed to delete document');
            }

            return DocumentSchema.parse(document);
        },
        onSuccess: (data) => {
            invalidateDocumentQueries(queryClient, data);
        },
    });
}

const invalidateDocumentQueries = (
    queryClient: QueryClient,
    data: Document,
) => {
    queryClient.invalidateQueries({
        queryKey: queryKeys.documents.list({}),
    });
    queryClient.invalidateQueries({
        queryKey: queryKeys.documents.detail(data.id),
    });
    queryClient.invalidateQueries({
        queryKey: queryKeys.documents.byProject(data.project_id),
    });
};
