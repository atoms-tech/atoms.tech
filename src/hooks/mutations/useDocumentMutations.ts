import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

import { DocumentPropertySchema } from '@/components/custom/BlockCanvas/types';
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
        mutationFn: async (document: Partial<Document>) => {
            const { data, error } = await supabase
                .from('documents')
                .insert({
                    ...document,
                    id: document.id || uuidv4(),
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
        mutationFn: async (document: Partial<Document>) => {
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

export function useCreateDocumentPropertySchema() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (schema: Partial<DocumentPropertySchema>) => {
            const { data, error } = await supabase
                .from('document_property_schemas')
                .insert({
                    ...schema,
                    id: schema.id || uuidv4(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_deleted: false,
                    version: 1,
                })
                .select()
                .single();

            if (error) throw error;
            return data as DocumentPropertySchema;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.documentPropertySchemas.byDocument(
                    data.document_id,
                ),
            });
        },
    });
}

export function useCreateDocumentWithDefaultSchemas() {
    const createDocumentMutation = useCreateDocument();
    const createDocumentPropertySchemaMutation =
        useCreateDocumentPropertySchema();

    return useMutation({
        mutationFn: async (document: Partial<Document>) => {
            const createdDocument =
                await createDocumentMutation.mutateAsync(document);

            const defaultSchemas: Partial<DocumentPropertySchema>[] = [
                {
                    document_id: createdDocument.id,
                    name: 'ReqID',
                    data_type: 'string',
                    created_by: document.created_by,
                    updated_by: document.updated_by,
                },
                {
                    document_id: createdDocument.id,
                    name: 'Name',
                    data_type: 'string',
                    created_by: document.created_by,
                    updated_by: document.updated_by,
                },
                {
                    document_id: createdDocument.id,
                    name: 'Description',
                    data_type: 'string',
                    created_by: document.created_by,
                    updated_by: document.updated_by,
                },
                {
                    document_id: createdDocument.id,
                    name: 'Status',
                    data_type: 'string',
                    created_by: document.created_by,
                    updated_by: document.updated_by,
                },
                {
                    document_id: createdDocument.id,
                    name: 'Priority',
                    data_type: 'string',
                    created_by: document.created_by,
                    updated_by: document.updated_by,
                },
            ];

            await Promise.all(
                defaultSchemas.map(async (schema) => {
                    return await createDocumentPropertySchemaMutation.mutateAsync(
                        schema,
                    );
                }),
            );

            return createdDocument;
        },
    });
}
