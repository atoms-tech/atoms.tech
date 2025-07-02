import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import {
    QueryFilters as GenericQueryFilters,
    buildQuery,
} from '@/lib/utils/queryFactory';
import { QueryFilters } from '@/types/base/filters.types';
import { Requirement } from '@/types/base/requirements.types';

export function useRequirement(requirementId: string) {
    return useQuery({
        queryKey: queryKeys.requirements.detail(requirementId),
        queryFn: async () => {
            if (!requirementId) return null;

            const { data, error } = await supabase
                .from('requirements')
                .select('*')
                .eq('id', requirementId)
                .single();

            if (error) throw error;
            return data as Requirement;
        },
        enabled: !!requirementId,
    });
}

export function useRequirements(
    queryFilters?: GenericQueryFilters<'requirements'>,
) {
    return useQuery({
        queryKey: queryKeys.requirements.list(
            (queryFilters as QueryFilters) || {},
        ),
        queryFn: async () => {
            const { data } = await buildQuery('requirements', queryFilters);
            return data;
        },
    });
}

/**
 * Hook to fetch requirements by project ID.
 * This will first get all document IDs for the project, then fetch all requirements for those documents.
 */
export function useProjectRequirements(projectId: string) {
    return useQuery({
        queryKey: [...queryKeys.requirements.root, 'byProject', projectId],
        queryFn: async () => {
            if (!projectId) return [];

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
        enabled: !!projectId,
    });
}

/**
 * Hook to fetch multiple requirements by their IDs
 */
export function useRequirementsByIds(requirementIds: string[]) {
    return useQuery({
        queryKey: [...queryKeys.requirements.root, 'byIds', requirementIds],
        queryFn: async () => {
            if (!requirementIds.length) return [];

            const { data, error } = await supabase
                .from('requirements')
                .select('*')
                .in('id', requirementIds);

            if (error) throw error;
            return data as Requirement[];
        },
        enabled: requirementIds.length > 0,
    });
}

export function useDocumentRequirements(
    documentId: string,
    _queryFilters?: Omit<GenericQueryFilters<'requirements'>, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.requirements.byDocument(documentId),
        queryFn: async () => {
            const { data } = await supabase
                .from('requirements')
                .select('*')
                .eq('document_id', documentId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });
            return data;
        },
        enabled: !!documentId,
    });
}

export function useBlockRequirements(
    blockId: string,
    queryFilters?: Omit<GenericQueryFilters<'requirements'>, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.requirements.byBlock(blockId),
        queryFn: async () => {
            const { data } = await buildQuery('requirements', {
                ...queryFilters,
                filters: [
                    { field: 'block_id', operator: 'eq', value: blockId },
                ],
                sort: queryFilters?.sort || [
                    { field: 'created_at', direction: 'desc' },
                ],
            });
            return data;
        },
        enabled: !!blockId,
    });
}
