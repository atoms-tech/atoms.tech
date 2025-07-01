import { Tables } from './base/database.types';

// Base types from database
export type AuditLog = Tables<'audit_logs'>;
export type Document = Tables<'documents'>;
export type Block = Tables<'blocks'>;
export type Profile = Tables<'profiles'>;

// Analytics-specific types
export interface AnalyticsActivity extends AuditLog {
    actor_name?: string;
    actor_email?: string;
    entity_name?: string;
    changes_summary?: string;
}

export interface VersionHistoryItem {
    id: string;
    entity_id: string;
    entity_type: 'document' | 'block' | 'requirement';
    version: number;
    created_at: string;
    created_by: string;
    actor_name?: string;
    actor_email?: string;
    data: Record<string, unknown>;
    changes?: {
        added: Record<string, unknown>;
        modified: Record<string, unknown>;
        removed: Record<string, unknown>;
    };
}

export interface AnalyticsMetrics {
    totalActivities: number;
    totalUsers: number;
    totalDocuments: number;
    totalBlocks: number;
    activitiesThisWeek: number;
    activitiesThisMonth: number;
    mostActiveUsers: Array<{
        user_id: string;
        user_name: string;
        activity_count: number;
    }>;
    mostModifiedEntities: Array<{
        entity_id: string;
        entity_name: string;
        entity_type: string;
        modification_count: number;
    }>;
    activityByDay: Array<{
        date: string;
        count: number;
    }>;
    activityByType: Array<{
        action: string;
        count: number;
    }>;
}

export interface AnalyticsFilters {
    dateRange?: {
        start: string;
        end: string;
    };
    userIds?: string[];
    actions?: string[];
    entityTypes?: string[];
    entityIds?: string[];
    search?: string;
}

export interface AnalyticsPagination {
    page: number;
    pageSize: number;
    total?: number;
}

export interface AnalyticsQueryParams extends AnalyticsFilters {
    pagination?: AnalyticsPagination;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface RestoreVersionInput {
    entityId: string;
    entityType: 'document' | 'block' | 'requirement';
    targetVersion: number;
    auditLogId: string;
    reason?: string;
}

export interface RestoreVersionResult {
    success: boolean;
    newVersion: number;
    restoredData: Record<string, unknown>;
    auditLogId: string;
}

// Chart data types
export interface ChartDataPoint {
    date: string;
    value: number;
    label?: string;
}

export interface PieChartDataPoint {
    name: string;
    value: number;
    color?: string;
}

// Export types
export interface ExportOptions {
    format: 'csv' | 'json' | 'pdf';
    includeMetadata: boolean;
    dateRange?: {
        start: string;
        end: string;
    };
    filters?: AnalyticsFilters;
}

// Real-time update types
export interface AnalyticsUpdate {
    type: 'activity' | 'metrics' | 'version';
    data: AnalyticsActivity | AnalyticsMetrics | VersionHistoryItem;
    timestamp: string;
}

// Component prop types
export interface AnalyticsDataGridProps {
    orgId: string;
    projectId?: string;
    initialFilters?: AnalyticsFilters;
    height?: number;
    enableExport?: boolean;
    enableRestore?: boolean;
}

export interface VersionComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityId: string;
    entityType: 'document' | 'block' | 'requirement';
    currentVersion: VersionHistoryItem;
    compareVersion: VersionHistoryItem;
    onRestore?: (version: VersionHistoryItem) => void;
}

export interface RestoreConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    versionItem: VersionHistoryItem;
    isLoading?: boolean;
}

export interface AnalyticsDashboardProps {
    orgId: string;
    projectId?: string;
    timeRange?: 'week' | 'month' | 'quarter' | 'year';
}
