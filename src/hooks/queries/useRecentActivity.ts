import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { queryKeys } from '@/lib/constants/queryKeys';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';
import { supabase } from '@/lib/supabase/supabaseBrowser';

// Database response types
interface DocumentResponse extends Record<string, unknown> {
    id: string;
    name: string | null;
    description: string | null;
    updated_at: string | null;
    projects: {
        id: string;
        name: string;
        organizations: {
            id: string;
            name: string;
        };
    };
}

interface ProjectResponse extends Record<string, unknown> {
    id: string;
    name: string | null;
    description: string | null;
    updated_at: string | null;
    organizations: {
        id: string;
        name: string;
    };
}

interface RequirementResponse extends Record<string, unknown> {
    id: string;
    name: string | null;
    external_id: string | null;
    description: string | null;
    updated_at: string | null;
    documents: {
        id: string;
        projects: {
            id: string;
            name: string;
            organizations: {
                id: string;
                name: string;
            };
        };
    };
}

// Type guards and helper functions
function isDocumentResponse(
    obj: Record<string, unknown>,
): obj is DocumentResponse {
    return (
        typeof obj.id === 'string' &&
        typeof obj.updated_at === 'string' &&
        obj.projects !== null &&
        typeof obj.projects === 'object'
    );
}

function isProjectResponse(
    obj: Record<string, unknown>,
): obj is ProjectResponse {
    return (
        typeof obj.id === 'string' &&
        typeof obj.updated_at === 'string' &&
        obj.organizations !== null &&
        typeof obj.organizations === 'object'
    );
}

function isRequirementResponse(
    obj: Record<string, unknown>,
): obj is RequirementResponse {
    return (
        typeof obj.id === 'string' &&
        typeof obj.updated_at === 'string' &&
        obj.documents !== null &&
        typeof obj.documents === 'object'
    );
}

// Helper functions to safely extract data
function safeGetString(obj: Record<string, unknown>, key: string): string {
    return typeof obj[key] === 'string' ? (obj[key] as string) : '';
}

function safeGetNestedString(
    obj: Record<string, unknown>,
    path: string[],
): string {
    let current: unknown = obj;
    for (const key of path) {
        if (current && typeof current === 'object' && current !== null) {
            current = (current as Record<string, unknown>)[key];
        } else {
            return '';
        }
    }
    return typeof current === 'string' ? current : '';
}

export interface RecentItem {
    id: string;
    title: string;
    type: 'document' | 'project' | 'requirement';
    lastModified: string;
    organization: string;
    organizationId: string;
    projectName?: string;
    projectId?: string;
    path: string;
    description?: string;
}

/**
 * Hook to get recent documents across all user's organizations
 */
export function useRecentDocuments() {
    const { organizations } = useOrganization();
    const { user } = useUser();

    const orgIds = useMemo(
        () => organizations.map((org) => org.id),
        [organizations],
    );

    return useQuery({
        queryKey: [...queryKeys.documents.root, 'recent', user?.id, orgIds],
        queryFn: async () => {
            if (!user?.id || orgIds.length === 0) return [];

            // Get recent documents from projects in user's organizations
            const { data, error } = await supabase
                .from('documents')
                .select(
                    `
                    id,
                    name,
                    description,
                    updated_at,
                    project_id,
                    projects!inner (
                        id,
                        name,
                        organization_id,
                        organizations!inner (
                            id,
                            name
                        )
                    )
                `,
                )
                .in('projects.organization_id', orgIds)
                .eq('is_deleted', false)
                .order('updated_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            return (data || [])
                .filter((doc) =>
                    isDocumentResponse(doc as Record<string, unknown>),
                )
                .map(
                    (doc): RecentItem => ({
                        id: safeGetString(doc as Record<string, unknown>, 'id'),
                        title:
                            safeGetString(
                                doc as Record<string, unknown>,
                                'name',
                            ) || 'Untitled Document',
                        type: 'document',
                        lastModified:
                            safeGetString(
                                doc as Record<string, unknown>,
                                'updated_at',
                            ) || new Date().toISOString(),
                        organization: safeGetNestedString(
                            doc as Record<string, unknown>,
                            ['projects', 'organizations', 'name'],
                        ),
                        organizationId: safeGetNestedString(
                            doc as Record<string, unknown>,
                            ['projects', 'organizations', 'id'],
                        ),
                        projectName: safeGetNestedString(
                            doc as Record<string, unknown>,
                            ['projects', 'name'],
                        ),
                        projectId: safeGetNestedString(
                            doc as Record<string, unknown>,
                            ['projects', 'id'],
                        ),
                        path: `/org/${safeGetNestedString(doc as Record<string, unknown>, ['projects', 'organizations', 'id'])}/project/${safeGetNestedString(doc as Record<string, unknown>, ['projects', 'id'])}/documents/${safeGetString(doc as Record<string, unknown>, 'id')}`,
                        description:
                            safeGetString(
                                doc as Record<string, unknown>,
                                'description',
                            ) || undefined,
                    }),
                );
        },
        enabled: !!user?.id && orgIds.length > 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to get recent projects across all user's organizations
 */
export function useRecentProjects() {
    const { organizations } = useOrganization();
    const { user } = useUser();

    const orgIds = useMemo(
        () => organizations.map((org) => org.id),
        [organizations],
    );

    return useQuery({
        queryKey: [...queryKeys.projects.root, 'recent', user?.id, orgIds],
        queryFn: async () => {
            if (!user?.id || orgIds.length === 0) return [];

            const { data, error } = await supabase
                .from('projects')
                .select(
                    `
                    id,
                    name,
                    description,
                    updated_at,
                    organization_id,
                    organizations!inner (
                        id,
                        name
                    )
                `,
                )
                .in('organization_id', orgIds)
                .eq('is_deleted', false)
                .order('updated_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            return (data || [])
                .filter((project) =>
                    isProjectResponse(project as Record<string, unknown>),
                )
                .map(
                    (project): RecentItem => ({
                        id: safeGetString(
                            project as Record<string, unknown>,
                            'id',
                        ),
                        title:
                            safeGetString(
                                project as Record<string, unknown>,
                                'name',
                            ) || 'Untitled Project',
                        type: 'project',
                        lastModified:
                            safeGetString(
                                project as Record<string, unknown>,
                                'updated_at',
                            ) || new Date().toISOString(),
                        organization: safeGetNestedString(
                            project as Record<string, unknown>,
                            ['organizations', 'name'],
                        ),
                        organizationId: safeGetNestedString(
                            project as Record<string, unknown>,
                            ['organizations', 'id'],
                        ),
                        path: `/org/${safeGetNestedString(project as Record<string, unknown>, ['organizations', 'id'])}/project/${safeGetString(project as Record<string, unknown>, 'id')}`,
                        description:
                            safeGetString(
                                project as Record<string, unknown>,
                                'description',
                            ) || undefined,
                    }),
                );
        },
        enabled: !!user?.id && orgIds.length > 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to get recent requirements across all user's organizations
 */
export function useRecentRequirements() {
    const { organizations } = useOrganization();
    const { user } = useUser();

    const orgIds = useMemo(
        () => organizations.map((org) => org.id),
        [organizations],
    );

    return useQuery({
        queryKey: [...queryKeys.requirements.root, 'recent', user?.id, orgIds],
        queryFn: async () => {
            if (!user?.id || orgIds.length === 0) return [];

            const { data, error } = await supabase
                .from('requirements')
                .select(
                    `
                    id,
                    name,
                    description,
                    external_id,
                    updated_at,
                    document_id,
                    documents!inner (
                        id,
                        name,
                        project_id,
                        projects!inner (
                            id,
                            name,
                            organization_id,
                            organizations!inner (
                                id,
                                name
                            )
                        )
                    )
                `,
                )
                .in('documents.projects.organization_id', orgIds)
                .eq('is_deleted', false)
                .order('updated_at', { ascending: false })
                .limit(15);

            if (error) throw error;

            return (data || [])
                .filter((req) =>
                    isRequirementResponse(req as Record<string, unknown>),
                )
                .map(
                    (req): RecentItem => ({
                        id: safeGetString(req as Record<string, unknown>, 'id'),
                        title:
                            safeGetString(
                                req as Record<string, unknown>,
                                'name',
                            ) ||
                            safeGetString(
                                req as Record<string, unknown>,
                                'external_id',
                            ) ||
                            'Untitled Requirement',
                        type: 'requirement',
                        lastModified:
                            safeGetString(
                                req as Record<string, unknown>,
                                'updated_at',
                            ) || new Date().toISOString(),
                        organization: safeGetNestedString(
                            req as Record<string, unknown>,
                            ['documents', 'projects', 'organizations', 'name'],
                        ),
                        organizationId: safeGetNestedString(
                            req as Record<string, unknown>,
                            ['documents', 'projects', 'organizations', 'id'],
                        ),
                        projectName: safeGetNestedString(
                            req as Record<string, unknown>,
                            ['documents', 'projects', 'name'],
                        ),
                        projectId: safeGetNestedString(
                            req as Record<string, unknown>,
                            ['documents', 'projects', 'id'],
                        ),
                        path: `/org/${safeGetNestedString(req as Record<string, unknown>, ['documents', 'projects', 'organizations', 'id'])}/project/${safeGetNestedString(req as Record<string, unknown>, ['documents', 'projects', 'id'])}/documents/${safeGetNestedString(req as Record<string, unknown>, ['documents', 'id'])}`,
                        description:
                            safeGetString(
                                req as Record<string, unknown>,
                                'description',
                            ) || undefined,
                    }),
                );
        },
        enabled: !!user?.id && orgIds.length > 0,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Combined hook to get all recent activity
 */
export function useRecentActivity() {
    const { data: recentDocuments = [], isLoading: loadingDocs } =
        useRecentDocuments();
    const { data: recentProjects = [], isLoading: loadingProjects } =
        useRecentProjects();
    const { data: recentRequirements = [], isLoading: loadingReqs } =
        useRecentRequirements();

    const combinedData = useMemo(() => {
        const allItems = [
            ...recentDocuments,
            ...recentProjects,
            ...recentRequirements,
        ];

        // Sort by last modified date
        return allItems
            .sort(
                (a, b) =>
                    new Date(b.lastModified).getTime() -
                    new Date(a.lastModified).getTime(),
            )
            .slice(0, 20); // Limit to 20 most recent items
    }, [recentDocuments, recentProjects, recentRequirements]);

    return {
        data: combinedData,
        isLoading: loadingDocs || loadingProjects || loadingReqs,
        recentDocuments,
        recentProjects,
        recentRequirements,
    };
}

/**
 * Hook for searching across recent activity
 */
export function useSearchRecentActivity(query: string) {
    const { data: allItems, isLoading } = useRecentActivity();

    const filteredItems = useMemo(() => {
        if (!query.trim()) return allItems;

        const searchTerm = query.toLowerCase();
        return allItems.filter(
            (item) =>
                item.title.toLowerCase().includes(searchTerm) ||
                item.organization.toLowerCase().includes(searchTerm) ||
                item.projectName?.toLowerCase().includes(searchTerm) ||
                item.description?.toLowerCase().includes(searchTerm),
        );
    }, [allItems, query]);

    return {
        data: filteredItems,
        isLoading,
    };
}
