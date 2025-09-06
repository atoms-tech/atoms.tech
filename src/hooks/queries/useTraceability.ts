import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { atomsApiClient } from '@/lib/atoms-api';
import type { EEntityType } from '@/types';
import { QueryFilters } from '@/types/base/filters.types';

export function useTraceLinks(
    sourceId: string,
    sourceType: EEntityType,
    _queryFilters?: Omit<QueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.traceLinks.bySource(sourceId, sourceType),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.traceLinks.listBySource(sourceId, sourceType as unknown as string);
        },
        enabled: !!sourceId && !!sourceType,
    });
}

export function useReverseTraceLinks(
    targetId: string,
    targetType: EEntityType,
    _queryFilters?: Omit<QueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.traceLinks.byTarget(targetId, targetType),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.traceLinks.listByTarget(targetId, targetType as unknown as string);
        },
        enabled: !!targetId && !!targetType,
    });
}

export function useAssignments(
    entityId: string,
    entityType: EEntityType,
    _queryFilters?: Omit<QueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.assignments.byEntity(entityId, entityType),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.assignments.listByEntity(entityId, entityType as unknown as string);
        },
        enabled: !!entityId && !!entityType,
    });
}

export function useUserAssignments(
    userId: string,
    _queryFilters?: Omit<QueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.assignments.byUser(userId),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.assignments.listByUser(userId);
        },
        enabled: !!userId,
    });
}

export function useAuditLogs(
    entityId: string,
    entityType: string,
    _queryFilters?: Omit<QueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.auditLogs.byEntity(entityId, entityType),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.auditLogs.listByEntity(entityId, entityType);
        },
        enabled: !!entityId && !!entityType,
    });
}

export function useNotifications(
    userId: string,
    _queryFilters?: Omit<QueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.notifications.byUser(userId),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.notifications.listByUser(userId);
        },
        enabled: !!userId,
    });
}

export function useUnreadNotificationsCount(userId: string) {
    return useQuery({
        queryKey: queryKeys.notifications.unreadCount(userId),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.notifications.unreadCount(userId);
        },
        enabled: !!userId,
    });
}
