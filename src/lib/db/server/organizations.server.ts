import { atomsApiServer } from '@/lib/atoms-api/server';

export const getOrganizationIdBySlugServer = async (slug: string) => {
    const api = await atomsApiServer();
    const id = await api.organizations.getIdBySlug(slug);
    if (!id) throw new Error('Organization not found');
    return id;
};

export const getOrganizationServer = async (orgId: string) => {
    const api = await atomsApiServer();
    return await api.organizations.getById(orgId);
};

export const getUserOrganizationsServer = async (userId: string) => {
    const api = await atomsApiServer();
    return await api.organizations.listForUser(userId);
};

// Get all organization ids for a user by membership
export const getOrganizationIdsByMembershipServer = async (userId: string) => {
    const api = await atomsApiServer();
    return await api.organizations.listIdsByMembership(userId);
};

export const getOrganizationMembersServer = async (organizationId: string) => {
    const api = await atomsApiServer();
    return await api.organizations.listMembers(organizationId);
};
