import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/lib/constants/queryKeys';
import { atomsApiClient } from '@/lib/atoms-api';
import { QueryFilters } from '@/types/base/filters.types';
import { Project } from '@/types/base/projects.types';

export function useProject(projectId: string) {
    return useQuery({
        queryKey: queryKeys.projects.detail(projectId),
        queryFn: async () => {
            const api = atomsApiClient();
            const project = await api.projects.getById(projectId);
            return project as Project;
        },
        enabled: !!projectId,
    });
}

export function useProjects(filters?: QueryFilters) {
    return useQuery({
        queryKey: queryKeys.projects.list(filters || {}),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.projects.listWithFilters(filters || {});
        },
    });
}

export function useOrganizationProjects(organizationId: string) {
    return useQuery({
        queryKey: queryKeys.projects.byOrg(organizationId),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.projects.listByOrg(organizationId);
        },
        enabled: !!organizationId,
    });
}

export function useUserProjects(userId: string, orgId: string) {
    return useQuery({
        queryKey: queryKeys.projects.byOrg(orgId),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.projects.listForUser(userId, orgId);
        },
        enabled: !!userId && !!orgId,
    });
}

export function useProjectsByMembershipForOrg(orgId: string, userId: string) {
    return useQuery({
        queryKey: queryKeys.projects.byOrg(orgId),
        queryFn: async () => {
            const api = atomsApiClient();
            return api.projects.listByMembershipForOrg(orgId, userId);
        },
        enabled: !!orgId && !!userId,
    });
}
