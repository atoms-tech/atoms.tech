import { createClient } from '@/lib/supabase/supabaseServer';
import {
    AnalyticsActivity,
    AnalyticsMetrics,
    AnalyticsQueryParams,
    VersionHistoryItem,
} from '@/types/analytics.types';

// Server-side analytics activities query for SSR
export const getAnalyticsActivitiesServer = async (
    orgId: string,
    projectId?: string,
    params?: AnalyticsQueryParams,
): Promise<{ data: AnalyticsActivity[]; total: number }> => {
    const supabase = await createClient();

    let query = supabase.from('audit_logs').select(
        `
            *
        `,
        { count: 'exact' },
    );

    // Base filtering by organization
    if (projectId) {
        // For project-level, we need to filter by entities belonging to the project
        const { data: projectEntities } = await supabase
            .from('documents')
            .select('id')
            .eq('project_id', projectId);

        const entityIds = projectEntities?.map((doc) => doc.id) || [];
        if (entityIds.length > 0) {
            query = query.in('entity_id', entityIds);
        }
    } else {
        // For org-level, filter by organization through project relationships
        const { data: orgProjects } = await supabase
            .from('projects')
            .select('id')
            .eq('organization_id', orgId);

        const projectIds = orgProjects?.map((proj) => proj.id) || [];
        if (projectIds.length > 0) {
            const { data: orgDocuments } = await supabase
                .from('documents')
                .select('id')
                .in('project_id', projectIds);

            const entityIds = orgDocuments?.map((doc) => doc.id) || [];
            if (entityIds.length > 0) {
                query = query.in('entity_id', entityIds);
            }
        }
    }

    // Apply filters
    if (params?.dateRange) {
        query = query
            .gte('created_at', params.dateRange.start)
            .lte('created_at', params.dateRange.end);
    }

    if (params?.userIds && params.userIds.length > 0) {
        query = query.in('actor_id', params.userIds);
    }

    if (params?.actions && params.actions.length > 0) {
        query = query.in('action', params.actions);
    }

    if (params?.entityTypes && params.entityTypes.length > 0) {
        query = query.in('entity_type', params.entityTypes);
    }

    if (params?.entityIds && params.entityIds.length > 0) {
        query = query.in('entity_id', params.entityIds);
    }

    // Apply sorting
    const sortBy = params?.sortBy || 'created_at';
    const sortOrder = params?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (params?.pagination) {
        const { page, pageSize } = params.pagination;
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;
        query = query.range(start, end);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Get user profiles for actor names
    const actorIds = [...new Set((data || []).map((item) => item.actor_id))];
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', actorIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Transform data to include actor names
    const activities: AnalyticsActivity[] = (data || []).map((item) => {
        const profile = profileMap.get(item.actor_id);
        return {
            ...item,
            actor_name: profile?.full_name || 'Unknown User',
            actor_email: profile?.email || '',
            changes_summary: generateChangesSummary(
                item.old_data,
                item.new_data,
                item.action,
            ),
        };
    });

    return { data: activities, total: count || 0 };
};

// Server-side analytics metrics query for SSR
export const getAnalyticsMetricsServer = async (
    orgId: string,
    projectId?: string,
    timeRange: 'week' | 'month' | 'quarter' | 'year' = 'month',
): Promise<AnalyticsMetrics> => {
    const supabase = await createClient();

    const now = new Date();
    const timeRanges = {
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    };

    const startDate = timeRanges[timeRange].toISOString();

    // Get entity IDs for filtering
    let entityIds: string[] = [];
    if (projectId) {
        const { data: projectEntities } = await supabase
            .from('documents')
            .select('id')
            .eq('project_id', projectId);
        entityIds = projectEntities?.map((doc) => doc.id) || [];
    } else {
        const { data: orgProjects } = await supabase
            .from('projects')
            .select('id')
            .eq('organization_id', orgId);

        const projectIds = orgProjects?.map((proj) => proj.id) || [];
        if (projectIds.length > 0) {
            const { data: orgDocuments } = await supabase
                .from('documents')
                .select('id')
                .in('project_id', projectIds);
            entityIds = orgDocuments?.map((doc) => doc.id) || [];
        }
    }

    // Get total activities
    const { count: totalActivities } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .in('entity_id', entityIds);

    // Get activities in time range
    const { count: activitiesInRange } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .in('entity_id', entityIds)
        .gte('created_at', startDate);

    // Get unique users
    const { data: uniqueUsers } = await supabase
        .from('audit_logs')
        .select('actor_id')
        .in('entity_id', entityIds)
        .gte('created_at', startDate);

    const totalUsers = new Set(uniqueUsers?.map((u) => u.actor_id) || []).size;

    // Get document and block counts
    const { count: totalDocuments } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false)
        .in('id', entityIds);

    const { count: totalBlocks } = await supabase
        .from('blocks')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false)
        .in('document_id', entityIds);

    // Get most active users
    const { data: userActivity } = await supabase
        .from('audit_logs')
        .select('actor_id')
        .in('entity_id', entityIds)
        .gte('created_at', startDate);

    // Get unique user IDs and their profiles
    const uniqueUserIds = [
        ...new Set(userActivity?.map((a) => a.actor_id) || []),
    ];
    const { data: userProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueUserIds);

    const userProfileMap = new Map(
        userProfiles?.map((p) => [p.id, p.full_name]) || [],
    );

    const userActivityMap = new Map<string, { name: string; count: number }>();
    userActivity?.forEach((activity) => {
        const userId = activity.actor_id;
        const userName = userProfileMap.get(userId) || 'Unknown User';
        const current = userActivityMap.get(userId) || {
            name: userName,
            count: 0,
        };
        userActivityMap.set(userId, { ...current, count: current.count + 1 });
    });

    const mostActiveUsers = Array.from(userActivityMap.entries())
        .map(([user_id, { name, count }]) => ({
            user_id,
            user_name: name,
            activity_count: count,
        }))
        .sort((a, b) => b.activity_count - a.activity_count)
        .slice(0, 10);

    // Get activity by day (last 30 days)
    const { data: dailyActivity } = await supabase
        .from('audit_logs')
        .select('created_at')
        .in('entity_id', entityIds)
        .gte(
            'created_at',
            new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .order('created_at', { ascending: true });

    const activityByDay = generateDailyActivityChart(dailyActivity || []);

    // Get activity by type
    const { data: activityTypes } = await supabase
        .from('audit_logs')
        .select('action')
        .in('entity_id', entityIds)
        .gte('created_at', startDate);

    const activityTypeMap = new Map<string, number>();
    activityTypes?.forEach((activity) => {
        const action = activity.action;
        activityTypeMap.set(action, (activityTypeMap.get(action) || 0) + 1);
    });

    const activityByType = Array.from(activityTypeMap.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count);

    return {
        totalActivities: totalActivities || 0,
        totalUsers,
        totalDocuments: totalDocuments || 0,
        totalBlocks: totalBlocks || 0,
        activitiesThisWeek: timeRange === 'week' ? activitiesInRange || 0 : 0,
        activitiesThisMonth: timeRange === 'month' ? activitiesInRange || 0 : 0,
        mostActiveUsers,
        mostModifiedEntities: [], // TODO: Implement this
        activityByDay,
        activityByType,
    };
};

// Get version history for an entity (server-side)
export const getVersionHistoryServer = async (
    entityId: string,
    entityType: 'document' | 'block' | 'requirement',
): Promise<VersionHistoryItem[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Get user profiles for actor names
    const actorIds = [...new Set((data || []).map((item) => item.actor_id))];
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', actorIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    return (data || []).map((item) => {
        const profile = profileMap.get(item.actor_id);
        return {
            id: item.id,
            entity_id: item.entity_id,
            entity_type: item.entity_type as
                | 'document'
                | 'block'
                | 'requirement',
            version: extractVersionFromMetadata(item.metadata) || 1,
            created_at: item.created_at,
            created_by: item.actor_id,
            actor_name: profile?.full_name || 'Unknown User',
            actor_email: profile?.email || '',
            data: item.new_data,
            changes: generateChangesDetail(item.old_data, item.new_data),
        };
    });
};

// Helper function to generate changes summary
function generateChangesSummary(
    oldData: Record<string, unknown> | string | null,
    newData: Record<string, unknown> | string | null,
    action: string,
): string {
    if (action === 'created') return 'Created new item';
    if (action === 'deleted') return 'Deleted item';

    if (!oldData || !newData) return 'Modified item';

    const changes: string[] = [];
    const oldObj = typeof oldData === 'string' ? JSON.parse(oldData) as Record<string, unknown> : oldData as Record<string, unknown>;
    const newObj = typeof newData === 'string' ? JSON.parse(newData) as Record<string, unknown> : newData as Record<string, unknown>;

    Object.keys(newObj).forEach((key) => {
        if (oldObj[key] !== newObj[key]) {
            changes.push(key);
        }
    });

    return changes.length > 0
        ? `Modified: ${changes.join(', ')}`
        : 'Modified item';
}

// Helper function to generate daily activity chart data
function generateDailyActivityChart(
    activities: Array<{ created_at: string }>,
): Array<{ date: string; count: number }> {
    const activityMap = new Map<string, number>();

    activities.forEach((activity) => {
        const date = new Date(activity.created_at).toISOString().split('T')[0];
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
    });

    // Fill in missing days with 0
    const result: Array<{ date: string; count: number }> = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
        result.push({
            date,
            count: activityMap.get(date) || 0,
        });
    }

    return result;
}

function extractVersionFromMetadata(metadata: Record<string, unknown> | string | null): number | null {
    if (!metadata) return null;
    if (typeof metadata === 'string') {
        try {
            const parsed = JSON.parse(metadata);
            return parsed.version || null;
        } catch {
            return null;
        }
    }
    return metadata.version || null;
}

function generateChangesDetail(
    oldData: Record<string, unknown> | string | null,
    newData: Record<string, unknown> | string | null,
): {
    added: Record<string, unknown>;
    modified: Record<string, unknown>;
    removed: Record<string, unknown>;
} {
    const changes = {
        added: {} as Record<string, unknown>,
        modified: {} as Record<string, unknown>,
        removed: {} as Record<string, unknown>,
    };

    if (!oldData || !newData) return changes;

    const oldObj = typeof oldData === 'string' ? JSON.parse(oldData) as Record<string, unknown> : oldData as Record<string, unknown>;
    const newObj = typeof newData === 'string' ? JSON.parse(newData) as Record<string, unknown> : newData as Record<string, unknown>;

    // Find added and modified fields
    Object.keys(newObj).forEach((key) => {
        if (!(key in oldObj)) {
            changes.added[key] = newObj[key];
        } else if (oldObj[key] !== newObj[key]) {
            changes.modified[key] = {
                from: oldObj[key],
                to: newObj[key],
            };
        }
    });

    // Find removed fields
    Object.keys(oldObj).forEach((key) => {
        if (!(key in newObj)) {
            changes.removed[key] = oldObj[key];
        }
    });

    return changes;
}
