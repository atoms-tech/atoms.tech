import { queryKeys } from '@/lib/constants/queryKeys';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import {
    buildQuery,
    QueryFilters as GenericQueryFilters,
} from '@/lib/utils/queryFactory';
import { QueryFilters } from '@/types/base/filters.types';
import { Requirement } from '@/types/base/requirements.types';
import { useQuery } from '@tanstack/react-query';

export function useRequirement(requirementId: string) {
    return useQuery({
        queryKey: queryKeys.requirements.detail(requirementId),
        queryFn: async () => {
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

export function useDocumentRequirements(
    documentId: string,
    queryFilters?: Omit<GenericQueryFilters<'requirements'>, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.requirements.byDocument(documentId),
        queryFn: async () => {
            const { data } = await buildQuery('requirements', {
                ...queryFilters,
                filters: [
                    { field: 'document_id', operator: 'eq', value: documentId },
                ],
                sort: queryFilters?.sort || [
                    { field: 'created_at', direction: 'desc' },
                ],
            });
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
