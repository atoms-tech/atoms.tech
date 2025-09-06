import { useQuery } from '@tanstack/react-query';

import { atomsApiClient } from '@/lib/atoms-api';
import { queryKeys } from '@/lib/constants/queryKeys';
import type { QueryFilters as GenericQueryFilters } from '@/types/base/filters.types';
import { QueryFilters } from '@/types/base/filters.types';
import { Requirement } from '@/types/base/requirements.types';

export function useRequirement(requirementId: string) {
    return useQuery({
        queryKey: queryKeys.requirements.detail(requirementId),
        queryFn: async () => {
            if (!requirementId) return null;

            const api = atomsApiClient();
            const req = await api.requirements.getById(requirementId);
            return req as Requirement;
        },
        enabled: !!requirementId,
    });
}

export function useRequirements(queryFilters?: GenericQueryFilters) {
    return useQuery({
        queryKey: queryKeys.requirements.list((queryFilters as QueryFilters) || {}),
        queryFn: async () => {
            const api = atomsApiClient();
            return await api.requirements.listWithFilters(
                queryFilters as Record<string, unknown>,
            );
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
            const api = atomsApiClient();
            return (await api.requirements.listByProject(projectId)) as Requirement[];
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

            const api = atomsApiClient();
            return (await api.requirements.listByIds(requirementIds)) as Requirement[];
        },
        enabled: requirementIds.length > 0,
    });
}

export function useDocumentRequirements(
    documentId: string,
    _queryFilters?: Omit<GenericQueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.requirements.byDocument(documentId),
        queryFn: async () => {
            const api = atomsApiClient();
            return await api.requirements.listByDocument(documentId);
        },
        enabled: !!documentId,
    });
}

export function useBlockRequirements(
    blockId: string,
    _queryFilters?: Omit<GenericQueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.requirements.byBlock(blockId),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.requirements.listByBlock(blockId);
        },
        enabled: !!blockId,
    });
}
