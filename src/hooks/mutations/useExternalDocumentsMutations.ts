import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { atomsApiClient } from '@/lib/atoms-api';
import { ExternalDocument } from '@/types';

export function useUploadExternalDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ file, orgId }: { file: File; orgId: string }) => {
            const api = atomsApiClient();
            return api.externalDocuments.upload(file, orgId);
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
        mutationFn: async ({ documentId }: { documentId: string; orgId: string }) => {
            const api = atomsApiClient();
            await api.externalDocuments.remove(documentId);
            return null;
        },
        onSuccess: (_, variables) => {
            // Invalidate both all documents and organization-specific documents
            queryClient.invalidateQueries({
                queryKey: queryKeys.externalDocuments.root,
            });
            if (variables.orgId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.externalDocuments.byOrg(variables.orgId),
                });
            }
        },
    });
}

export function useUpdateExternalDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            documentId,
            gumloopName,
            name,
        }: {
            documentId: string;
            gumloopName?: string;
            name?: string;
            orgId: string;
        }) => {
            const updateDict: Partial<ExternalDocument> = {};
            if (gumloopName) updateDict.gumloop_name = gumloopName;
            if (name) updateDict.name = name;
            const api = atomsApiClient();
            return api.externalDocuments.update(documentId, updateDict);
        },
        onSuccess: (_, variables) => {
            // Invalidate both all documents and organization-specific documents
            queryClient.invalidateQueries({
                queryKey: queryKeys.externalDocuments.root,
            });
            if (variables.orgId) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.externalDocuments.byOrg(variables.orgId),
                });
            }
        },
    });
}
