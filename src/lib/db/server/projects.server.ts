import { atomsApiServer } from '@/lib/atoms-api/server';

export const getProjectByIdServer = async (id: string) => {
    const api = await atomsApiServer();
    return await api.projects.getById(id);
};

export const getUserProjectsServer = async (userId: string, orgId: string) => {
    const api = await atomsApiServer();
    return await api.projects.listForUser(userId, orgId);
};

export const getProjectMembersServer = async (projectId: string) => {
    const api = await atomsApiServer();
    return await api.projects.listMembers(projectId);
};
