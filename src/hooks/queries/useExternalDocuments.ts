import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { atomsApiClient } from '@/lib/atoms-api';

export function useExternalDocument(documentId: string) {
    return useQuery({
        queryKey: queryKeys.externalDocuments.detail(documentId),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.externalDocuments.getById(documentId);
        },
        enabled: !!documentId,
    });
}

export function useExternalDocumentsByOrg(orgId: string) {
    return useQuery({
        queryKey: queryKeys.externalDocuments.byOrg(orgId),
        queryFn: async () => {
            if (!orgId) return [];
            const api = atomsApiClient();
            return api.externalDocuments.listByOrg(orgId);
        },
        enabled: !!orgId,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
    });
}
