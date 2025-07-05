'use client';

import { useParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { useOrganization } from '@/lib/providers/organization.provider';

export interface WorkspaceContext {
    level: 'home' | 'org' | 'project' | 'document';
    breadcrumb: string[];
    searchScope: string;
    contextId?: string;
    orgId?: string;
    projectId?: string;
    documentId?: string;
    searchPlaceholder: string;
}

export function useWorkspaceContext(): WorkspaceContext {
    const pathname = usePathname();
    const params = useParams();
    const { currentOrganization } = useOrganization();

    return useMemo(() => {
        // Home context
        if (pathname.startsWith('/home')) {
            return {
                level: 'home',
                breadcrumb: ['Home'],
                searchScope: 'global',
                searchPlaceholder: 'Search across all workspaces...',
            };
        }

        // Organization context
        if (pathname.startsWith('/org/') && params.orgId) {
            const orgId = params.orgId as string;
            const orgName = currentOrganization?.name || 'Organization';

            // Project context
            if (params.projectId) {
                const projectId = params.projectId as string;
                
                // Document context
                if (params.documentId) {
                    return {
                        level: 'document',
                        breadcrumb: [orgName, 'Project', 'Document'],
                        searchScope: `org:${orgId} project:${projectId}`,
                        contextId: params.documentId as string,
                        orgId,
                        projectId,
                        documentId: params.documentId as string,
                        searchPlaceholder: 'Search in document...',
                    };
                }

                return {
                    level: 'project',
                    breadcrumb: [orgName, 'Project'],
                    searchScope: `org:${orgId} project:${projectId}`,
                    contextId: projectId,
                    orgId,
                    projectId,
                    searchPlaceholder: 'Search in project...',
                };
            }

            return {
                level: 'org',
                breadcrumb: [orgName],
                searchScope: `org:${orgId}`,
                contextId: orgId,
                orgId,
                searchPlaceholder: `Search in ${orgName}...`,
            };
        }

        // Default fallback
        return {
            level: 'home',
            breadcrumb: ['Home'],
            searchScope: 'global',
            searchPlaceholder: 'Search...',
        };
    }, [pathname, params, currentOrganization]);
}
