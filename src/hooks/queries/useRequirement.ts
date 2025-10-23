import { useQuery } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
import {
    QueryFilters as GenericQueryFilters,
    buildQuery,
} from '@/lib/utils/queryFactory';
import { QueryFilters } from '@/types/base/filters.types';
import { Requirement } from '@/types/base/requirements.types';

export function useRequirement(requirementId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.requirements.detail(requirementId),
        queryFn: async () => {
            if (!requirementId) return null;

            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data, error } = await supabase
                .from('requirements')
                .select('*')
                .eq('id', requirementId)
                .single();

            if (error) throw error;
            return data as Requirement;
        },
        enabled: !!requirementId && !authLoading && !!supabase,
    });
}

export function useRequirements(queryFilters?: GenericQueryFilters<'requirements'>) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.requirements.list((queryFilters as QueryFilters) || {}),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data } = await buildQuery(supabase, 'requirements', queryFilters);
            return data;
        },
        enabled: !authLoading && !!supabase,
    });
}

/**
 * Hook to fetch requirements by project ID.
 * This will first get all document IDs for the project, then fetch all requirements for those documents.
 */
export function useProjectRequirements(projectId: string) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: [...queryKeys.requirements.root, 'byProject', projectId],
        queryFn: async () => {
            if (!projectId) return [];

            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            // Get all requirements that belong to documents in this project
            const { data, error } = await supabase
                .from('requirements')
                .select(
                    `
                    *,
                    documents!inner (
                        id,
                        project_id
                    )
                `,
                )
                .eq('documents.project_id', projectId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Requirement[];
        },
        enabled: !!projectId && !authLoading && !!supabase,
    });
}

/**
 * Hook to fetch multiple requirements by their IDs
 */
export function useRequirementsByIds(requirementIds: string[]) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: [...queryKeys.requirements.root, 'byIds', requirementIds],
        queryFn: async () => {
            if (!requirementIds.length) return [];

            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data, error } = await supabase
                .from('requirements')
                .select('*')
                .in('id', requirementIds);

            if (error) throw error;
            return data as Requirement[];
        },
        enabled: requirementIds.length > 0 && !authLoading && !!supabase,
    });
}

export function useDocumentRequirements(
    documentId: string,
    _queryFilters?: Omit<GenericQueryFilters<'requirements'>, 'filters'>,
) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.requirements.byDocument(documentId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data } = await supabase
                .from('requirements')
                .select('*')
                .eq('document_id', documentId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });
            return data;
        },
        enabled: !!documentId && !authLoading && !!supabase,
    });
}

export function useBlockRequirements(
    blockId: string,
    queryFilters?: Omit<GenericQueryFilters<'requirements'>, 'filters'>,
) {
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.requirements.byBlock(blockId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error(authError ?? 'Supabase client not available');
            }

            const { data } = await buildQuery(supabase, 'requirements', {
                ...queryFilters,
                filters: [{ field: 'block_id', operator: 'eq', value: blockId }],
                sort: queryFilters?.sort || [{ field: 'created_at', direction: 'desc' }],
            });
            return data;
        },
        enabled: !!blockId && !authLoading && !!supabase,
    });
}
