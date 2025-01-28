import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Document, Block } from '@/types/base/documents.types';
import { QueryFilters } from '@/types/base/filters.types';
import { buildQuery } from '@/lib/utils/queryFactory';

export function useDocument(documentId: string) {
    return useQuery({
        queryKey: queryKeys.documents.detail(documentId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('id', documentId)
                .single();

            if (error) throw error;
            return data as Document;
        },
        enabled: !!documentId,
    });
}

export function useDocuments(queryFilters?: QueryFilters) {
    return useQuery({
        queryKey: queryKeys.documents.list(queryFilters || {}),
        queryFn: async () => {
            const { data } = await buildQuery('documents', queryFilters);
            return data;
        },
    });
}

export function useUpdateDocument(documentId: string) {
    const queryClient = useQueryClient();

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

export function useDocumentBlocks(
    documentId: string,
    queryFilters?: Omit<QueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.blocks.byDocument(documentId),
        queryFn: async () => {
            const { data } = await buildQuery('blocks', {
                ...queryFilters,
                filters: [
                    { field: 'document_id', operator: 'eq', value: documentId },
                ],
                sort: queryFilters?.sort || [
                    { field: 'position', direction: 'asc' },
                ],
            });
            return data;
        },
        enabled: !!documentId,
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
