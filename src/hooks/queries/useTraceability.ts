import { useQuery } from '@tanstack/react-query';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { queryKeys } from '@/lib/constants/queryKeys';
import { QueryFilters, buildQuery } from '@/lib/utils/queryFactory';
import type { EEntityType } from '@/types';

export function useTraceLinks(
    sourceId: string,
    sourceType: EEntityType,
    queryFilters?: Omit<QueryFilters<'trace_links'>, 'filters'>,
) {
    const { supabase, isLoading: authLoading } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.traceLinks.bySource(sourceId, sourceType),
        queryFn: async () => {
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            const { data } = await buildQuery(supabase, 'trace_links', {
                ...queryFilters,
                filters: [
                    { field: 'source_id', operator: 'eq', value: sourceId },
                    { field: 'source_type', operator: 'eq', value: sourceType },
                    { field: 'is_deleted', operator: 'eq', value: false },
                ],
            });
            return data;
        },
        enabled: !!sourceId && !!sourceType && !!supabase && !authLoading,
    });
}

export function useReverseTraceLinks(
    targetId: string,
    targetType: EEntityType,
    queryFilters?: Omit<QueryFilters<'trace_links'>, 'filters'>,
) {
    const { supabase, isLoading: authLoading } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.traceLinks.byTarget(targetId, targetType),
        queryFn: async () => {
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            const { data } = await buildQuery(supabase, 'trace_links', {
                ...queryFilters,
                filters: [
                    { field: 'target_id', operator: 'eq', value: targetId },
                    { field: 'target_type', operator: 'eq', value: targetType },
                    { field: 'is_deleted', operator: 'eq', value: false },
                ],
            });
            return data;
        },
        enabled: !!targetId && !!targetType && !!supabase && !authLoading,
    });
}

export function useAssignments(
    entityId: string,
    entityType: EEntityType,
    queryFilters?: Omit<QueryFilters<'assignments'>, 'filters'>,
) {
    const { supabase, isLoading: authLoading } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.assignments.byEntity(entityId, entityType),
        queryFn: async () => {
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            const { data } = await buildQuery(supabase, 'assignments', {
                ...queryFilters,
                filters: [
                    { field: 'entity_id', operator: 'eq', value: entityId },
                    { field: 'entity_type', operator: 'eq', value: entityType },
                ],
            });
            return data;
        },
        enabled: !!entityId && !!entityType && !!supabase && !authLoading,
    });
}

export function useUserAssignments(
    userId: string,
    queryFilters?: Omit<QueryFilters<'assignments'>, 'filters'>,
) {
    const { supabase, isLoading: authLoading } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.assignments.byUser(userId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            const { data } = await buildQuery(supabase, 'assignments', {
                ...queryFilters,
                filters: [{ field: 'assignee_id', operator: 'eq', value: userId }],
                sort: queryFilters?.sort || [{ field: 'created_at', direction: 'desc' }],
            });
            return data;
        },
        enabled: !!userId && !!supabase && !authLoading,
    });
}

export function useAuditLogs(
    entityId: string,
    entityType: string,
    queryFilters?: Omit<QueryFilters<'audit_logs'>, 'filters'>,
) {
    const { supabase, isLoading: authLoading } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.auditLogs.byEntity(entityId, entityType),
        queryFn: async () => {
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            const { data } = await buildQuery(supabase, 'audit_logs', {
                ...queryFilters,
                filters: [
                    { field: 'entity_id', operator: 'eq', value: entityId },
                    { field: 'entity_type', operator: 'eq', value: entityType },
                ],
                sort: queryFilters?.sort || [{ field: 'created_at', direction: 'desc' }],
            });
            return data;
        },
        enabled: !!entityId && !!entityType && !!supabase && !authLoading,
    });
}

export function useNotifications(
    userId: string,
    queryFilters?: Omit<QueryFilters<'notifications'>, 'filters'>,
) {
    const { supabase, isLoading: authLoading } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.notifications.byUser(userId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            const { data } = await buildQuery(supabase, 'notifications', {
                ...queryFilters,
                filters: [{ field: 'user_id', operator: 'eq', value: userId }],
                sort: queryFilters?.sort || [{ field: 'created_at', direction: 'desc' }],
            });
            return data;
        },
        enabled: !!userId && !!supabase && !authLoading,
    });
}

export function useUnreadNotificationsCount(userId: string) {
    const { supabase, isLoading: authLoading } = useAuthenticatedSupabase();

    return useQuery({
        queryKey: queryKeys.notifications.unreadCount(userId),
        queryFn: async () => {
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
            const { count } = await buildQuery(supabase, 'notifications', {
                filters: [
                    { field: 'user_id', operator: 'eq', value: userId },
                    { field: 'unread', operator: 'eq', value: true },
                ],
            });
            return count || 0;
        },
        enabled: !!userId && !!supabase && !authLoading,
    });
}
