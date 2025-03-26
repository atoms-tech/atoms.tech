import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';

export function useUploadExternalDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ file, orgId }: { file: File; orgId: string }) => {
            // Start a Supabase transaction to ensure atomicity
            const { data: document, error: documentError } = await supabase
                .from('external_documents')
                .insert({
                    name: file.name,
                    type: file.type,
                    organization_id: orgId,
                    size: file.size,
                })
                .select('*')
                .single();

            if (documentError) throw documentError;

            const filePath = `${orgId}/${document.id}`;
            const { error } = await supabase.storage
                .from('external_documents')
                .upload(filePath, file, {
                    cacheControl: '3600', // Add cache control for better performance
                    upsert: false, // Prevent overwriting existing files
                });

            if (error) {
                // If storage upload fails, clean up the database record
                await supabase
                    .from('external_documents')
                    .delete()
                    .eq('id', document.id);

                throw error;
            }

            return document;
        },
        onSuccess: (data, variables) => {
            // Invalidate both all documents and organization-specific documents
            queryClient.invalidateQueries({
                queryKey: queryKeys.externalDocuments.root,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.externalDocuments.byOrg(variables.orgId),
            });
        },
    });
}

export function useDeleteExternalDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            documentId,
        }: {
            documentId: string;
            orgId: string;
        }) => {
            // First get the document to ensure it exists
            const { data: document, error: fetchError } = await supabase
                .from('external_documents')
                .select('id, organization_id')
                .eq('id', documentId)
                .single();

            if (fetchError) throw fetchError;

            // Construct the correct file path for storage
            const filePath = `${document.organization_id}/${document.id}`;

            // Delete from storage first
            const { error: storageError } = await supabase.storage
                .from('external_documents')
                .remove([filePath]);

            if (storageError) throw storageError;

            // Then delete the database record
            const { data, error } = await supabase
                .from('external_documents')
                .delete()
                .eq('id', documentId);

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            // Invalidate both all documents and organization-specific documents
            queryClient.invalidateQueries({
                queryKey: queryKeys.externalDocuments.root,
            });
            if (variables.orgId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.externalDocuments.byOrg(
                        variables.orgId,
                    ),
                });
            }
        },
    });
}

export function useUpdateExternalDocumentGumloopName() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            documentId,
            gumloopName,
        }: {
            documentId: string;
            gumloopName: string;
            orgId: string;
        }) => {
            const { data, error } = await supabase
                .from('external_documents')
                .update({ gumloop_name: gumloopName })
                .eq('id', documentId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            // Invalidate both all documents and organization-specific documents
            queryClient.invalidateQueries({
                queryKey: queryKeys.externalDocuments.root,
            });
            if (variables.orgId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.externalDocuments.byOrg(
                        variables.orgId,
                    ),
                });
            }
        },
    });
}
