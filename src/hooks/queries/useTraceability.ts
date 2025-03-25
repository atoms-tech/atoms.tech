import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { buildQuery } from '@/lib/utils/queryFactory';
import type { EEntityType } from '@/types';
import { QueryFilters } from '@/types/base/filters.types';

export function useTraceLinks(
    sourceId: string,
    sourceType: EEntityType,
    queryFilters?: Omit<QueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.traceLinks.bySource(sourceId, sourceType),
        queryFn: async () => {
            const { data } = await buildQuery('trace_links', {
                ...queryFilters,
                filters: [
                    { field: 'source_id', operator: 'eq', value: sourceId },
                    { field: 'source_type', operator: 'eq', value: sourceType },
                ],
            });
            return data;
        },
        enabled: !!sourceId && !!sourceType,
    });
}

export function useReverseTraceLinks(
    targetId: string,
    targetType: EEntityType,
    queryFilters?: Omit<QueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.traceLinks.byTarget(targetId, targetType),
        queryFn: async () => {
            const { data } = await buildQuery('trace_links', {
                ...queryFilters,
                filters: [
                    { field: 'target_id', operator: 'eq', value: targetId },
                    { field: 'target_type', operator: 'eq', value: targetType },
                ],
            });
            return data;
        },
        enabled: !!targetId && !!targetType,
    });
}

export function useAssignments(
    entityId: string,
    entityType: EEntityType,
    queryFilters?: Omit<QueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.assignments.byEntity(entityId, entityType),
        queryFn: async () => {
            const { data } = await buildQuery('assignments', {
                ...queryFilters,
                filters: [
                    { field: 'entity_id', operator: 'eq', value: entityId },
                    { field: 'entity_type', operator: 'eq', value: entityType },
                ],
            });
            return data;
        },
        enabled: !!entityId && !!entityType,
    });
}

export function useUserAssignments(
    userId: string,
    queryFilters?: Omit<QueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.assignments.byUser(userId),
        queryFn: async () => {
            const { data } = await buildQuery('assignments', {
                ...queryFilters,
                filters: [
                    { field: 'assignee_id', operator: 'eq', value: userId },
                ],
                sort: queryFilters?.sort || [
                    { field: 'created_at', direction: 'desc' },
                ],
            });
            return data;
        },
        enabled: !!userId,
    });
}

export function useAuditLogs(
    entityId: string,
    entityType: string,
    queryFilters?: Omit<QueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.auditLogs.byEntity(entityId, entityType),
        queryFn: async () => {
            const { data } = await buildQuery('audit_logs', {
                ...queryFilters,
                filters: [
                    { field: 'entity_id', operator: 'eq', value: entityId },
                    { field: 'entity_type', operator: 'eq', value: entityType },
                ],
                sort: queryFilters?.sort || [
                    { field: 'created_at', direction: 'desc' },
                ],
            });
            return data;
        },
        enabled: !!entityId && !!entityType,
    });
}

export function useNotifications(
    userId: string,
    queryFilters?: Omit<QueryFilters, 'filters'>,
) {
    return useQuery({
        queryKey: queryKeys.notifications.byUser(userId),
        queryFn: async () => {
            const { data } = await buildQuery('notifications', {
                ...queryFilters,
                filters: [{ field: 'user_id', operator: 'eq', value: userId }],
                sort: queryFilters?.sort || [
                    { field: 'created_at', direction: 'desc' },
                ],
            });
            return data;
        },
        enabled: !!userId,
    });
}

export function useUnreadNotificationsCount(userId: string) {
    return useQuery({
        queryKey: queryKeys.notifications.unreadCount(userId),
        queryFn: async () => {
            const { count } = await buildQuery('notifications', {
                filters: [
                    { field: 'user_id', operator: 'eq', value: userId },
                    { field: 'unread', operator: 'eq', value: true },
                ],
            });
            return count || 0;
        },
        enabled: !!userId,
    });
}
