import { useMutation, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import {
    getDocumentBlocksAndRequirements,
    getProjectDocuments,
} from '@/lib/db/client';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import {
    QueryFilters as GenericQueryFilters,
    buildQuery,
} from '@/lib/utils/queryFactory';
import { Block, Document } from '@/types/base/documents.types';
import { QueryFilters } from '@/types/base/filters.types';

export function useProjectDocuments(projectId: string) {
    return useQuery({
        queryKey: queryKeys.documents.byProject(projectId),
        queryFn: async () => {
            const data = await getProjectDocuments(projectId);
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
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('id', documentId)
                .eq('is_deleted', false)
                .single();

            if (error) throw error;
            return data as Document;
        },
        enabled: !!documentId,
    });
}

export function useDocuments(queryFilters?: GenericQueryFilters<'documents'>) {
    return useQuery({
        queryKey: queryKeys.documents.list(
            (queryFilters as QueryFilters) || {},
        ),
        queryFn: async () => {
            const { data } = await buildQuery('documents', queryFilters);
            return data;
        },
    });
}

export function useUpdateDocument(documentId: string) {
    return useMutation({
        mutationFn: async (document: Document) => {
            const { data, error } = await supabase
                .from('documents')
                .update(document)
                .eq('id', documentId)
                .single();
            if (error) throw error;
            return data;
        },
    });
}

export function useDocumentBlocksAndRequirements(documentId: string) {
    return useQuery({
        queryKey: queryKeys.blocks.byDocument(documentId),
        queryFn: () => getDocumentBlocksAndRequirements(documentId),
    });
}

export function useBlock(blockId: string) {
    return useQuery({
        queryKey: queryKeys.blocks.detail(blockId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('blocks')
                .select('*')
                .eq('id', blockId)
                .single();

            if (error) throw error;
            return data as Block;
        },
        enabled: !!blockId,
    });
}
