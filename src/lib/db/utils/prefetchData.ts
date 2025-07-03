// lib/prefetch/prefetchData.ts
import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

import { getQueryClient } from '@/lib/constants/queryClient';
import { queryKeys } from '@/lib/constants/queryKeys';
import {
    ensureUserPersonalOrganizationServer,
    getAuthUserServer,
    getExternalDocumentsByOrgServer,
    getOrganizationServer,
    getProjectByIdServer,
    getProjectDocumentsServer,
    getUserOrganizationsServer,
    getUserProfileServer,
    getUserProjectsServer,
} from '@/lib/db/server';

// Cache this function to prevent multiple executions in the same request
export const prefetchUserDashboard = cache(
    async (queryClient?: QueryClient) => {
        const client = queryClient || getQueryClient();

        // Fetch user data in parallel
        const userResult = await getAuthUserServer();
        const user = userResult.user;

        // Now fetch profile and organizations with the user ID
        // The getUserProfileServer will automatically create a profile if it doesn't exist
        const profile = await getUserProfileServer(user.id);

        // Ensure user has a personal organization (especially important for OAuth users)
        if (profile.email) {
            await ensureUserPersonalOrganizationServer(user.id, profile.email);
        }

        // Now fetch all organizations
        const organizations = await getUserOrganizationsServer(user.id);

        // Cache all fetched data
        if (queryClient) {
            client.setQueryData(['user'], user);
            client.setQueryData(queryKeys.profiles.detail(user.id), profile);
            client.setQueryData(
                queryKeys.organizations.byMembership(user.id),
                organizations,
            );
        }

        return { user, profile, organizations };
    },
);

// Optimized org page data prefetching
export const prefetchOrgPageData = async (
    orgId: string,
    userId: string,
    queryClient?: QueryClient,
) => {
    const client = queryClient || getQueryClient();

    // Check cache first - if data exists, don't refetch
    const cachedOrg = client.getQueryData(
        queryKeys.organizations.detail(orgId),
    );

    if (!cachedOrg) {
        // Fetch org data directly instead of getting all orgs again
        const organization = await getOrganizationServer(orgId);
        client.setQueryData(
            queryKeys.organizations.detail(orgId),
            organization,
        );
    }

    // Parallel fetch all org page data
    const [projects, documents] = await Promise.all([
        getUserProjectsServer(userId, orgId).then((data) => {
            client.setQueryData(queryKeys.projects.byOrg(orgId), data);
            return data;
        }),
        getExternalDocumentsByOrgServer(orgId).then((data) => {
            client.setQueryData(queryKeys.externalDocuments.byOrg(orgId), data);
            return data;
        }),
    ]);

    return { projects, documents };
};

// Cache this function to prevent duplicate calls
export const fetchProjectData = cache(
    async (orgId: string, projectId: string, queryClient?: QueryClient) => {
        const client = queryClient || getQueryClient();

        // Check cache first for project
        let project = client.getQueryData(queryKeys.projects.detail(projectId));
        let documents = client.getQueryData(
            queryKeys.documents.byProject(projectId),
        );

        // If not in cache, fetch everything in parallel
        if (!project || !documents) {
            [project, documents] = await Promise.all([
                getProjectByIdServer(projectId).then((data) => {
                    // Update cache
                    client.setQueryData(
                        queryKeys.projects.detail(projectId),
                        data,
                    );
                    return data;
                }),
                getProjectDocumentsServer(projectId).then((data) => {
                    // The data is already typed as Document[] from the database
                    client.setQueryData(
                        queryKeys.documents.byProject(projectId),
                        data,
                    );
                    return data;
                }),
            ]);
        }

        return { project, documents };
    },
);
