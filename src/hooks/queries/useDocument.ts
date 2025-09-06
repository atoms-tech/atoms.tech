import { useMutation, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { atomsApiClient } from '@/lib/atoms-api';
import type { QueryFilters as GenericQueryFilters } from '@/types/base/filters.types';
import { Block, Document } from '@/types/base/documents.types';
import { QueryFilters } from '@/types/base/filters.types';

export function useProjectDocuments(projectId: string) {
    return useQuery({
        queryKey: queryKeys.documents.byProject(projectId),
        queryFn: async () => {
            const api = atomsApiClient();
            const data = await api.documents.listByProject(projectId);
            if (!data) throw new Error('No documents found');
            return data;
        },
        enabled: !!projectId,
    });
}

export function useDocument(documentId: string) {
    return useQuery({
        queryKey: queryKeys.documents.detail(documentId),
        queryFn: async () => {
            const api = atomsApiClient();
            const doc = await api.documents.getById(documentId);
            return doc as Document;
        },
        enabled: !!documentId,
    });
}

export function useDocuments(queryFilters?: GenericQueryFilters) {
    return useQuery({
        queryKey: queryKeys.documents.list((queryFilters as QueryFilters) || {}),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.documents.listWithFilters(queryFilters as Record<string, unknown>);
        },
    });
}

export function useUpdateDocument(documentId: string) {
    return useMutation({
        mutationFn: async (document: Document) => {
            const api = atomsApiClient();
            return api.documents.update(documentId, document);
        },
    });
}

export function useDocumentBlocksAndRequirements(documentId: string) {
    return useQuery({
        queryKey: queryKeys.blocks.byDocument(documentId),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.documents.blocksAndRequirements(documentId);
        },
    });
}

export function useBlock(blockId: string) {
    return useQuery({
        queryKey: queryKeys.blocks.detail(blockId),
        queryFn: async () => {
            const api = atomsApiClient();
            const block = await api.documents.getBlockById(blockId);
            return block as Block;
        },
        enabled: !!blockId,
    });
}
