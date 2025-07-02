'use client';

import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import {
    getAnalyticsActivities,
    getAnalyticsMetrics,
    getEntityDetails,
    getVersionHistory,
} from '@/lib/db/client/analytics.client';
import {
    AnalyticsActivity,
    AnalyticsMetrics,
    AnalyticsQueryParams,
    VersionHistoryItem,
} from '@/types/analytics.types';

// Query keys for analytics
export const analyticsQueryKeys = {
    all: ['analytics'] as const,
    activities: (orgId: string, projectId?: string) =>
        [...analyticsQueryKeys.all, 'activities', orgId, projectId] as const,
    activitiesWithParams: (
        orgId: string,
        projectId?: string,
        params?: AnalyticsQueryParams,
    ) => [...analyticsQueryKeys.activities(orgId, projectId), params] as const,
    metrics: (orgId: string, projectId?: string, timeRange?: string) =>
        [
            ...analyticsQueryKeys.all,
            'metrics',
            orgId,
            projectId,
            timeRange,
        ] as const,
    versionHistory: (entityId: string, entityType: string) =>
        [...analyticsQueryKeys.all, 'versions', entityId, entityType] as const,
    entityDetails: (entityId: string, entityType: string) =>
        [...analyticsQueryKeys.all, 'entity', entityId, entityType] as const,
};

// Hook to get analytics activities
export function useAnalyticsActivities(
    orgId: string,
    projectId?: string,
    params?: AnalyticsQueryParams,
    options?: UseQueryOptions<{ data: AnalyticsActivity[]; total: number }>,
) {
    return useQuery({
        queryKey: analyticsQueryKeys.activitiesWithParams(
            orgId,
            projectId,
            params,
        ),
        queryFn: () => getAnalyticsActivities(orgId, projectId, params),
        enabled: !!orgId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        ...options,
    });
}

// Hook to get analytics metrics
export function useAnalyticsMetrics(
    orgId: string,
    projectId?: string,
    timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month',
    options?: UseQueryOptions<AnalyticsMetrics>,
) {
    return useQuery({
        queryKey: analyticsQueryKeys.metrics(orgId, projectId, timeRange),
        queryFn: () => getAnalyticsMetrics(orgId, projectId, timeRange),
        enabled: !!orgId,
        staleTime: 1000 * 60 * 10, // 10 minutes
        ...options,
    });
}

// Hook to get version history for an entity
export function useVersionHistory(
    entityId: string,
    entityType: 'document' | 'block' | 'requirement',
    options?: UseQueryOptions<VersionHistoryItem[]>,
) {
    return useQuery({
        queryKey: analyticsQueryKeys.versionHistory(entityId, entityType),
        queryFn: () => getVersionHistory(entityId, entityType),
        enabled: !!entityId && !!entityType,
        staleTime: 1000 * 60 * 5, // 5 minutes
        ...options,
    });
}

// Hook to get entity details
export function useEntityDetails(
    entityId: string,
    entityType: 'document' | 'block' | 'requirement',
    options?: UseQueryOptions<{ name: string; [key: string]: any } | null>,
) {
    return useQuery({
        queryKey: analyticsQueryKeys.entityDetails(entityId, entityType),
        queryFn: () => getEntityDetails(entityId, entityType),
        enabled: !!entityId && !!entityType,
        staleTime: 1000 * 60 * 15, // 15 minutes
        ...options,
    });
}

// Hook for real-time analytics activities with auto-refresh
export function useRealTimeAnalyticsActivities(
    orgId: string,
    projectId?: string,
    params?: AnalyticsQueryParams,
    refreshInterval: number = 30000, // 30 seconds
) {
    return useAnalyticsActivities(orgId, projectId, params, {
        refetchInterval: refreshInterval,
        refetchIntervalInBackground: true,
    } as any);
}

// Hook for real-time analytics metrics with auto-refresh
export function useRealTimeAnalyticsMetrics(
    orgId: string,
    projectId?: string,
    timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month',
    refreshInterval: number = 60000, // 1 minute
) {
    return useAnalyticsMetrics(orgId, projectId, timeRange, {
        refetchInterval: refreshInterval,
        refetchIntervalInBackground: true,
    } as any);
}

// Custom hook for paginated analytics activities
export function usePaginatedAnalyticsActivities(
    orgId: string,
    projectId?: string,
    initialParams?: AnalyticsQueryParams,
) {
    const [params, setParams] = useState<AnalyticsQueryParams>(
        initialParams || {
            pagination: { page: 1, pageSize: 50 },
        },
    );

    const query = useAnalyticsActivities(orgId, projectId, params);

    const nextPage = () => {
        if (params.pagination) {
            setParams((prev) => ({
                ...prev,
                pagination: {
                    ...prev.pagination!,
                    page: prev.pagination!.page + 1,
                },
            }));
        }
    };

    const previousPage = () => {
        if (params.pagination && params.pagination.page > 1) {
            setParams((prev) => ({
                ...prev,
                pagination: {
                    ...prev.pagination!,
                    page: prev.pagination!.page - 1,
                },
            }));
        }
    };

    const setFilters = (filters: Partial<AnalyticsQueryParams>) => {
        setParams(
            (prev: AnalyticsQueryParams): AnalyticsQueryParams => ({
                ...prev,
                ...filters,
                pagination: {
                    page: 1, // Reset to first page when filters change
                    pageSize: prev.pagination?.pageSize || 50,
                    total: prev.pagination?.total,
                },
            }),
        );
    };

    const setPageSize = (pageSize: number) => {
        setParams((prev) => ({
            ...prev,
            pagination: {
                ...prev.pagination!,
                pageSize,
                page: 1, // Reset to first page when page size changes
            },
        }));
    };

    return {
        ...query,
        params,
        nextPage,
        previousPage,
        setFilters,
        setPageSize,
        hasNextPage: query.data
            ? params.pagination!.page * params.pagination!.pageSize <
              query.data.total
            : false,
        hasPreviousPage: params.pagination ? params.pagination.page > 1 : false,
        totalPages:
            query.data && params.pagination
                ? Math.ceil(query.data.total / params.pagination.pageSize)
                : 0,
        currentPage: params.pagination?.page || 1,
    };
}
