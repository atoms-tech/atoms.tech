export const queryKeys = {
    documents: {
        all: ['documents'] as const,
        lists: () => [...queryKeys.documents.all, 'list'] as const,
        list: (filters: Record<string, any>) =>
            [...queryKeys.documents.lists(), { filters }] as const,
        details: () => [...queryKeys.documents.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.documents.details(), id] as const,
    },
    blocks: {
        all: ['blocks'] as const,
        lists: () => [...queryKeys.blocks.all, 'list'] as const,
        list: (filters: Record<string, any>) =>
            [...queryKeys.blocks.lists(), { filters }] as const,
        details: () => [...queryKeys.blocks.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.blocks.details(), id] as const,
        byDocument: (documentId: string) =>
            [...queryKeys.documents.detail(documentId), 'blocks'] as const,
    },
    requirements: {
        all: ['requirements'] as const,
        lists: () => [...queryKeys.requirements.all, 'list'] as const,
        list: (filters: Record<string, any>) =>
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
    projects: {
        all: ['projects'] as const,
        lists: () => [...queryKeys.projects.all, 'list'] as const,
        list: (filters: Record<string, any>) =>
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
        list: (filters: Record<string, any>) =>
            [...queryKeys.organizations.lists(), { filters }] as const,
        details: () => [...queryKeys.organizations.all, 'detail'] as const,
        detail: (id: string) =>
            [...queryKeys.organizations.details(), id] as const,
        byUser: (userId: string) =>
            [...queryKeys.organizations.all, 'byUser', userId] as const,
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
