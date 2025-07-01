import { createClient } from '@/lib/supabase/supabaseServer';
import { Organization } from '@/types/base/organizations.types';
import { Project } from '@/types/base/projects.types';
import { AuditLog } from '@/types/base/traceability.types';

export interface ProjectWithOrg extends Project {
    organization: Organization;
    last_accessed?: string;
    member_count?: number;
}

export interface RecentActivity {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    created_at: string;
    metadata?: any;
    entity_name?: string;
    project_name?: string;
    organization_name?: string;
}

export interface OnboardingProgress {
    is_new_user: boolean;
    project_count: number;
    requirement_count: number;
    document_count: number;
    has_invited_members: boolean;
    has_used_ai_analysis: boolean;
    completion_percentage: number;
}

/**
 * Get all projects across all user's organizations with organization info
 */
export const getUserProjectsAcrossOrgsServer = async (
    userId: string,
): Promise<ProjectWithOrg[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('project_members')
        .select(
            `
            project_id,
            last_accessed_at,
            projects!inner(
                *,
                organizations!inner(*)
            )
        `,
        )
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('projects.is_deleted', false)
        .order('last_accessed_at', { ascending: false });

    if (error) throw error;

    // Get member counts for each project
    const projectIds = data.map((item) => item.project_id);
    const { data: memberCounts, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .in('project_id', projectIds)
        .eq('status', 'active');

    if (memberError) throw memberError;

    const memberCountMap = memberCounts.reduce(
        (acc, member) => {
            acc[member.project_id] = (acc[member.project_id] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );

    return data.map((item) => ({
        ...item.projects,
        organization: item.projects.organizations,
        last_accessed: item.last_accessed_at,
        member_count: memberCountMap[item.project_id] || 0,
    })) as ProjectWithOrg[];
};

export interface PaginatedRecentActivity {
    activities: RecentActivity[];
    hasMore: boolean;
    nextCursor?: string;
    total: number;
}

/**
 * Get recent activity for user across all entities with pagination
 */
export const getUserRecentActivityServer = async (
    userId: string,
    limit: number = 15,
): Promise<RecentActivity[]> => {
    const supabase = await createClient();

    const { data: auditLogs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('actor_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;

    // Enrich audit logs with entity names
    const enrichedActivities: RecentActivity[] = [];

    for (const log of auditLogs) {
        let entityName = '';
        let projectName = '';
        let organizationName = '';

        try {
            // Get entity name based on type
            if (log.entity_type === 'project') {
                const { data: project } = await supabase
                    .from('projects')
                    .select('name, organizations(name)')
                    .eq('id', log.entity_id)
                    .single();

                if (project) {
                    entityName = project.name;
                    organizationName = project.organizations?.name || '';
                }
            } else if (log.entity_type === 'document') {
                const { data: document } = await supabase
                    .from('documents')
                    .select('name, projects(name, organizations(name))')
                    .eq('id', log.entity_id)
                    .single();

                if (document) {
                    entityName = document.name;
                    projectName = document.projects?.name || '';
                    organizationName =
                        document.projects?.organizations?.name || '';
                }
            } else if (log.entity_type === 'requirement') {
                const { data: requirement } = await supabase
                    .from('requirements')
                    .select(
                        'name, documents(name, projects(name, organizations(name)))',
                    )
                    .eq('id', log.entity_id)
                    .single();

                if (requirement) {
                    entityName = requirement.name || 'Untitled Requirement';
                    projectName = requirement.documents?.projects?.name || '';
                    organizationName =
                        requirement.documents?.projects?.organizations?.name ||
                        '';
                }
            }
        } catch (error) {
            // If entity is deleted or inaccessible, use fallback
            entityName = 'Deleted Item';
        }

        enrichedActivities.push({
            id: log.id,
            action: log.action,
            entity_type: log.entity_type,
            entity_id: log.entity_id,
            created_at: log.created_at,
            metadata: log.metadata,
            entity_name: entityName,
            project_name: projectName,
            organization_name: organizationName,
        });
    }

    return enrichedActivities;
};

/**
 * Get paginated recent activity for user with cursor-based pagination
 */
export const getUserRecentActivityPaginatedServer = async (
    userId: string,
    limit: number = 15,
    cursor?: string,
): Promise<PaginatedRecentActivity> => {
    const supabase = await createClient();

    // Build query with cursor-based pagination
    let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('actor_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit + 1); // Fetch one extra to check if there are more

    // Add cursor condition if provided
    if (cursor) {
        query = query.lt('created_at', cursor);
    }

    const { data: auditLogs, error } = await query;

    if (error) throw error;

    // Check if there are more items
    const hasMore = auditLogs.length > limit;
    const activities = auditLogs.slice(0, limit); // Remove the extra item

    // Get total count for progress indication
    const { count: total } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('actor_id', userId);

    // Enrich activities with entity names
    const enrichedActivities: RecentActivity[] = [];

    for (const log of activities) {
        let entityName = '';
        let projectName = '';
        let organizationName = '';

        try {
            // Get entity name based on type
            if (log.entity_type === 'project') {
                const { data: project } = await supabase
                    .from('projects')
                    .select('name, organizations(name)')
                    .eq('id', log.entity_id)
                    .single();

                if (project) {
                    entityName = project.name;
                    organizationName = project.organizations?.name || '';
                }
            } else if (log.entity_type === 'document') {
                const { data: document } = await supabase
                    .from('documents')
                    .select('name, projects(name, organizations(name))')
                    .eq('id', log.entity_id)
                    .single();

                if (document) {
                    entityName = document.name;
                    projectName = document.projects?.name || '';
                    organizationName =
                        document.projects?.organizations?.name || '';
                }
            } else if (log.entity_type === 'requirement') {
                const { data: requirement } = await supabase
                    .from('requirements')
                    .select(
                        'name, documents(name, projects(name, organizations(name)))',
                    )
                    .eq('id', log.entity_id)
                    .single();

                if (requirement) {
                    entityName = requirement.name || 'Untitled Requirement';
                    projectName = requirement.documents?.projects?.name || '';
                    organizationName =
                        requirement.documents?.projects?.organizations?.name ||
                        '';
                }
            }
        } catch (error) {
            // If entity is deleted or inaccessible, use fallback
            entityName = 'Deleted Item';
        }

        enrichedActivities.push({
            id: log.id,
            action: log.action,
            entity_type: log.entity_type,
            entity_id: log.entity_id,
            created_at: log.created_at,
            metadata: log.metadata,
            entity_name: entityName,
            project_name: projectName,
            organization_name: organizationName,
        });
    }

    return {
        activities: enrichedActivities,
        hasMore,
        nextCursor: hasMore
            ? activities[activities.length - 1].created_at
            : undefined,
        total: total || 0,
    };
};

/**
 * Get onboarding progress for user
 */
export const getUserOnboardingProgressServer = async (
    userId: string,
): Promise<OnboardingProgress> => {
    const supabase = await createClient();

    // Get user profile to check account age
    const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single();

    const accountAge = profile
        ? (Date.now() - new Date(profile.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
        : 0;

    const isNewUser = accountAge < 7; // Consider new if account is less than 7 days old

    // Get project count
    const { count: projectCount } = await supabase
        .from('project_members')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'active');

    // Get requirement count
    const { count: requirementCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('actor_id', userId)
        .eq('action', 'create')
        .eq('entity_type', 'requirement');

    // Get document count
    const { count: documentCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('actor_id', userId)
        .eq('action', 'create')
        .eq('entity_type', 'document');

    // Check if user has invited members
    const { count: inviteCount } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('actor_id', userId)
        .eq('action', 'invite')
        .eq('entity_type', 'organization');

    // Check if user has used AI analysis
    const { count: aiUsageCount } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('feature', 'ai_analysis');

    // Calculate completion percentage
    const completedSteps = [
        (projectCount || 0) > 0,
        (requirementCount || 0) > 0,
        (documentCount || 0) > 0,
        (inviteCount || 0) > 0,
        (aiUsageCount || 0) > 0,
    ].filter(Boolean).length;

    const completionPercentage = Math.round((completedSteps / 5) * 100);

    return {
        is_new_user: isNewUser,
        project_count: projectCount || 0,
        requirement_count: requirementCount || 0,
        document_count: documentCount || 0,
        has_invited_members: (inviteCount || 0) > 0,
        has_used_ai_analysis: (aiUsageCount || 0) > 0,
        completion_percentage: completionPercentage,
    };
};
