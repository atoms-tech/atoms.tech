import { atomsApiServer } from '@/lib/atoms-api/server';

export const getProjectDocumentsServer = async (projectId: string) => {
    const api = await atomsApiServer();
    return await api.documents.listByProject(projectId);
};

export const getDocumentBlocksAndRequirementsServer = async (documentId: string) => {
    const api = await atomsApiServer();
    return await api.documents.blocksAndRequirements(documentId);
};

export const getDocumentDataServer = async (documentId: string) => {
    const api = await atomsApiServer();
    const doc = await api.documents.getById(documentId);
    return doc ? [doc] : [];
};
