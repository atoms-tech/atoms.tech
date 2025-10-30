import { useMutation, useQuery } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
import { getDocumentBlocksAndRequirements } from '@/lib/db/client';
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
            const response = await fetch(`/api/projects/${projectId}/documents`, {
                method: 'GET',
                cache: 'no-store',
            });

            if (!response.ok) {
                const message = `Error fetching project documents: ${response.statusText}`;
                console.error(message);
                throw new Error(message);
            }

            const payload = (await response.json()) as {
                documents: Document[];
            };

            return payload.documents;
        },
        enabled: !!projectId,
    });
}

export function useDocument(documentId: string) {
    return useQuery({
        queryKey: queryKeys.documents.detail(documentId),
        queryFn: async () => {
            const response = await fetch(`/api/documents/${documentId}`, {
                method: 'GET',
                cache: 'no-store',
            });

            if (!response.ok) {
                const message = `Error fetching document: ${response.statusText}`;
                console.error(message);
                throw new Error(message);
            }

            const payload = (await response.json()) as {
                document: Document;
            };

            return payload.document;
        },
        enabled: !!documentId,
    });
}

export function useDocuments(queryFilters?: GenericQueryFilters<'documents'>) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.documents.list((queryFilters as QueryFilters) || {}),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data } = await buildQuery(supabase, 'documents', queryFilters);
            return data;
        },
        enabled: !authLoading && !!supabase,
    });
}

export function useUpdateDocument(documentId: string) {
    const { supabase, error: authError } = useAuthenticatedSupabase();

    return useMutation({
        mutationFn: async (document: Document) => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

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
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.blocks.byDocument(documentId),
        queryFn: () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            return getDocumentBlocksAndRequirements(supabase, documentId);
        },
        enabled: !!documentId && !authLoading && !!supabase,
    });
}

export function useBlock(blockId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.blocks.detail(blockId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data, error } = await supabase
                .from('blocks')
                .select('*')
                .eq('id', blockId)
                .single();

            if (error) throw error;
            return data as Block;
        },
        enabled: !!blockId && !authLoading && !!supabase,
    });
}
