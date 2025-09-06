import { useQuery } from '@tanstack/react-query';

import { Property } from '@/components/custom/BlockCanvas/types';
import { atomsApiClient } from '@/lib/atoms-api';
import { queryKeys } from '@/lib/constants/queryKeys';

/**
 * Hook to fetch and cache properties for an organization
 */
export function useOrganizationProperties(orgId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.properties.byOrg(orgId),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.properties.listByOrg(orgId) as unknown as Property[];
        },
        enabled: !!orgId && enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to fetch and cache properties for a document
 */
export function useDocumentProperties(documentId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.properties.byDocument(documentId),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.properties.listByDocument(documentId) as unknown as Property[];
        },
        enabled: !!documentId && enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
