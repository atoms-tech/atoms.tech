import { QueryFilters } from '@/types/base/filters.types';

/**
 * Centralized query key factory for React Query
 * Following React Query best practices for key structure and consistency
 */
export const queryKeys = {
    externalDocuments: {
        root: ['externalDocuments'] as const,
        list: (filters?: QueryFilters) =>
            [...queryKeys.externalDocuments.root, 'list', filters] as const,
        detail: (id: string) =>
            [...queryKeys.externalDocuments.root, 'detail', id] as const,
        byOrg: (orgId: string) =>
            [...queryKeys.externalDocuments.root, 'org', orgId] as const,
    },

    documents: {
        root: ['documents'] as const,
        list: (filters?: QueryFilters) =>
            [...queryKeys.documents.root, 'list', filters] as const,
        detail: (id: string) =>
            [...queryKeys.documents.root, 'detail', id] as const,
        byProject: (projectId: string) =>
            [...queryKeys.documents.root, 'project', projectId] as const,
    },

    blocks: {
        root: ['blocks'] as const,
        list: (filters?: QueryFilters) =>
            [...queryKeys.blocks.root, 'list', filters] as const,
        detail: (id: string) =>
            [...queryKeys.blocks.root, 'detail', id] as const,
        byDocument: (documentId: string) =>
            [...queryKeys.documents.detail(documentId), 'blocks'] as const,
    },

    requirements: {
        root: ['requirements'] as const,
        list: (filters?: QueryFilters) =>
            [...queryKeys.requirements.root, 'list', filters] as const,
        detail: (id: string) =>
            [...queryKeys.requirements.root, 'detail', id] as const,
        byDocument: (documentId: string) =>
            [
                ...queryKeys.documents.detail(documentId),
                'requirements',
            ] as const,
        byBlock: (blockId: string) =>
            [...queryKeys.blocks.detail(blockId), 'requirements'] as const,
    },

    // New properties query keys
    properties: {
        root: ['properties'] as const,
        list: (filters?: QueryFilters) =>
            [...queryKeys.properties.root, 'list', filters] as const,
        detail: (id: string) =>
            [...queryKeys.properties.root, 'detail', id] as const,
        byDocument: (documentId: string) =>
            [...queryKeys.documents.detail(documentId), 'properties'] as const,
        byBlock: (blockId: string) =>
            [...queryKeys.blocks.detail(blockId), 'properties'] as const,
    },

    projects: {
        root: ['projects'] as const,
        list: (filters?: QueryFilters) =>
            [...queryKeys.projects.root, 'list', filters] as const,
        detail: (id: string) =>
            [...queryKeys.projects.root, 'detail', id] as const,
        byOrg: (orgId: string) =>
            [...queryKeys.organizations.detail(orgId), 'projects'] as const,
        byUser: (userId: string) =>
            [...queryKeys.profiles.detail(userId), 'projects'] as const,
    },

    profiles: {
        root: ['profiles'] as const,
        detail: (id: string) =>
            [...queryKeys.profiles.root, 'detail', id] as const,
        byEmail: (email: string) =>
            [...queryKeys.profiles.root, 'byEmail', email] as const,
    },

    organizations: {
        root: ['organizations'] as const,
        list: (filters?: QueryFilters) =>
            [...queryKeys.organizations.root, 'list', filters] as const,
        detail: (id: string) =>
            [...queryKeys.organizations.root, 'detail', id] as const,
        byUser: (userId: string) =>
            [...queryKeys.organizations.root, 'byUser', userId] as const,
        byMembership: (userId: string) =>
            [...queryKeys.organizations.root, 'byMembership', userId] as const,
        createdBy: (userId: string) =>
            [...queryKeys.organizations.root, 'createdBy', userId] as const,
    },

    organizationInvitations: {
        root: ['organizationInvitations'] as const,
        byOrg: (orgId: string) =>
            [...queryKeys.organizationInvitations.root, 'org', orgId] as const,
        byEmail: (email: string) =>
            [
                ...queryKeys.organizationInvitations.root,
                'email',
                email,
            ] as const,
        byCreator: (userId: string) => [
            'organizationInvitations',
            'byCreator',
            userId,
        ],
        byOrganization: (orgId: string) =>
            [
                ...queryKeys.organizationInvitations.root,
                'byOrganization',
                orgId,
            ] as const, // New query key
    },

    traceLinks: {
        root: ['traceLinks'] as const,
        bySource: (sourceId: string, sourceType: string) =>
            [
                ...queryKeys.traceLinks.root,
                'source',
                sourceId,
                sourceType,
            ] as const,
        byTarget: (targetId: string, targetType: string) =>
            [
                ...queryKeys.traceLinks.root,
                'target',
                targetId,
                targetType,
            ] as const,
    },

    assignments: {
        root: ['assignments'] as const,
        byEntity: (entityId: string, entityType: string) =>
            [
                ...queryKeys.assignments.root,
                'entity',
                entityId,
                entityType,
            ] as const,
        byUser: (userId: string) =>
            [...queryKeys.assignments.root, 'user', userId] as const,
    },

    auditLogs: {
        root: ['auditLogs'] as const,
        byEntity: (entityId: string, entityType: string) =>
            [...queryKeys.auditLogs.root, entityId, entityType] as const,
    },

    notifications: {
        root: ['notifications'] as const,
        byUser: (userId: string) =>
            [...queryKeys.notifications.root, userId] as const,
        unreadCount: (userId: string) =>
            [
                ...queryKeys.notifications.byUser(userId),
                'unread',
                'count',
            ] as const,
    },

    auth: {
        root: ['auth'] as const,
        user: () => [...queryKeys.auth.root, 'user'] as const,
        session: () => [...queryKeys.auth.root, 'session'] as const,
    },
} as const;

export type QueryKeys = typeof queryKeys;
