import { atomsApiServer } from '@/lib/atoms-api/server';

export async function getExternalDocumentsByOrgServer(orgId: string) {
    const api = await atomsApiServer();
    return await api.externalDocuments.listByOrg(orgId);
}
