// Define a more specific type for filters
import { QueryFilters } from '@/types/base/filters.types';

export const queryKeys = {
    externalDocuments: {
        all: ['externalDocuments'] as const,
        lists: () => [...queryKeys.externalDocuments.all, 'list'] as const,
        list: (filters: QueryFilters) =>
            [...queryKeys.externalDocuments.lists(), { filters }] as const,
        details: () => [...queryKeys.externalDocuments.all, 'detail'] as const,
        detail: (id: string) =>
            [...queryKeys.externalDocuments.details(), id] as const,
        byOrg: (orgId: string) =>
            [
                ...queryKeys.externalDocuments.all,
                'organization_id',
                orgId,
            ] as const,
    },

    documents: {
        all: ['documents'] as const,
        lists: () => [...queryKeys.documents.all, 'list'] as const,
        list: (filters: QueryFilters) =>
            [...queryKeys.documents.lists(), { filters }] as const,
        details: () => [...queryKeys.documents.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.documents.details(), id] as const,
        byProject: (projectId: string) =>
            [...queryKeys.documents.all, 'project', projectId] as const,
    },
    blocks: {
        all: ['blocks'] as const,
        lists: () => [...queryKeys.blocks.all, 'list'] as const,
        list: (filters: QueryFilters) =>
            [...queryKeys.blocks.lists(), { filters }] as const,
        details: () => [...queryKeys.blocks.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.blocks.details(), id] as const,
        byDocument: (documentId: string) =>
            [...queryKeys.documents.detail(documentId), 'blocks'] as const,
    },
    requirements: {
        all: ['requirements'] as const,
        lists: () => [...queryKeys.requirements.all, 'list'] as const,
        list: (filters: QueryFilters) =>
            [...queryKeys.requirements.lists(), { filters }] as const,
        details: () => [...queryKeys.requirements.all, 'detail'] as const,
        detail: (id: string) =>
            [...queryKeys.requirements.details(), id] as const,
        byDocument: (documentId: string) =>
            [
                ...queryKeys.documents.detail(documentId),
                'requirements',
            ] as const,
        byBlock: (blockId: string) =>
            [...queryKeys.blocks.detail(blockId), 'requirements'] as const,
    },
    documentPropertySchemas: {
        all: ['documentPropertySchemas'] as const,
        details: () =>
            [...queryKeys.documentPropertySchemas.all, 'detail'] as const,
        detail: (id: string) =>
            [...queryKeys.documentPropertySchemas.details(), id] as const,
        byDocument: (documentId: string) =>
            [
                ...queryKeys.documents.detail(documentId),
                'propertySchemas',
            ] as const,
    },
    blockPropertySchemas: {
        all: ['blockPropertySchemas'] as const,
        details: () =>
            [...queryKeys.blockPropertySchemas.all, 'detail'] as const,
        detail: (id: string) =>
            [...queryKeys.blockPropertySchemas.details(), id] as const,
        byBlock: (blockId: string) =>
            [...queryKeys.blocks.detail(blockId), 'propertySchemas'] as const,
    },
    requirementPropertyKVs: {
        all: ['requirementPropertyKVs'] as const,
        details: () =>
            [...queryKeys.requirementPropertyKVs.all, 'detail'] as const,
        detail: (id: string) =>
            [...queryKeys.requirementPropertyKVs.details(), id] as const,
        byBlock: (blockId: string) =>
            [...queryKeys.blocks.detail(blockId), 'propertyKVs'] as const,
        byRequirement: (requirementId: string) =>
            [
                ...queryKeys.requirements.detail(requirementId),
                'propertyKVs',
            ] as const,
        byBlockAndRequirement: (blockId: string, requirementId?: string) =>
            requirementId
                ? ([
                      ...queryKeys.blocks.detail(blockId),
                      'propertyKVs',
                      requirementId,
                  ] as const)
                : ([
                      ...queryKeys.blocks.detail(blockId),
                      'propertyKVs',
                  ] as const),
    },
    projects: {
        all: ['projects'] as const,
        lists: () => [...queryKeys.projects.all, 'list'] as const,
        list: (filters: QueryFilters) =>
            [...queryKeys.projects.lists(), { filters }] as const,
        details: () => [...queryKeys.projects.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.projects.details(), id] as const,
        byOrganization: (orgId: string) =>
            [...queryKeys.organizations.detail(orgId), 'projects'] as const,
        byUser: (userId: string) =>
            [...queryKeys.profiles.detail(userId), 'projects'] as const,
    },
    profiles: {
        all: ['profiles'] as const,
        detail: (id: string) => [...queryKeys.profiles.all, id] as const,
    },
    organizations: {
        all: ['organizations'] as const,
        lists: () => [...queryKeys.organizations.all, 'list'] as const,
        list: (filters: QueryFilters) =>
            [...queryKeys.organizations.lists(), { filters }] as const,
        details: () => [...queryKeys.organizations.all, 'detail'] as const,
        detail: (id: string) =>
            [...queryKeys.organizations.details(), id] as const,
        byUser: (userId: string) =>
            [...queryKeys.organizations.all, 'byUser', userId] as const,
        byMembership: (userId: string) =>
            [...queryKeys.organizations.all, 'byMembership', userId] as const,
        createdBy: (userId: string) =>
            [...queryKeys.organizations.all, 'createdBy', userId] as const,
    },
    traceLinks: {
        all: ['traceLinks'] as const,
        bySource: (sourceId: string, sourceType: string) =>
            [
                ...queryKeys.traceLinks.all,
                'source',
                sourceId,
                sourceType,
            ] as const,
        byTarget: (targetId: string, targetType: string) =>
            [
                ...queryKeys.traceLinks.all,
                'target',
                targetId,
                targetType,
            ] as const,
    },
    assignments: {
        all: ['assignments'] as const,
        byEntity: (entityId: string, entityType: string) =>
            [
                ...queryKeys.assignments.all,
                'entity',
                entityId,
                entityType,
            ] as const,
        byUser: (userId: string) =>
            [...queryKeys.assignments.all, 'user', userId] as const,
    },
    auditLogs: {
        all: ['auditLogs'] as const,
        byEntity: (entityId: string, entityType: string) =>
            [...queryKeys.auditLogs.all, entityId, entityType] as const,
    },
    notifications: {
        all: ['notifications'] as const,
        byUser: (userId: string) =>
            [...queryKeys.notifications.all, userId] as const,
        unreadCount: (userId: string) =>
            [
                ...queryKeys.notifications.byUser(userId),
                'unread',
                'count',
            ] as const,
    },
} as const;

export type QueryKeys = typeof queryKeys;
