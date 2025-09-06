import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';

import { Property } from '@/components/custom/BlockCanvas/types';
import { queryKeys } from '@/lib/constants/queryKeys';
import { atomsApiClient } from '@/lib/atoms-api';
import { TablesInsert } from '@/types/base/database.types';
import { Document } from '@/types/base/documents.types';

// Define PropertyCreateData based on how it's used
interface PropertyCreateData {
    name: string;
    property_type: string;
    org_id: string;
    is_base?: boolean;
    scope?: 'org' | 'document' | 'project' | 'document,project' | 'org,document,project';
    document_id?: string;
    project_id?: string;
    options?: {
        values: string[];
    };
}

export type CreateDocumentInput = Omit<
    Document,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'deleted_at'
    | 'deleted_by'
    | 'is_deleted'
    | 'version'
>;

export function useCreateDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (document: Partial<Document>) => {
            if (!document.name || !document.project_id || !document.slug) {
                throw new Error('Missing required fields: name, project_id, or slug');
            }

            const insertData: TablesInsert<'documents'> = {
                name: document.name,
                project_id: document.project_id,
                slug: document.slug,
                description: document.description,
                tags: document.tags,
                created_by: document.created_by,
                updated_by: document.updated_by,
                id: document.id || uuidv4(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_deleted: false,
                version: 1,
            };

            const api = atomsApiClient();
            return api.documents.create(insertData);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.documents.byProject(data.project_id),
            });
        },
    });
}

export function useUpdateDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (document: Partial<Document>) => {
            if (!document.id) {
                throw new Error('Document ID is required for update');
            }

            const api = atomsApiClient();
            return api.documents.update(document.id, {
                ...document,
                updated_at: new Date().toISOString(),
                version: (document.version || 1) + 1,
            } as Document);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.documents.detail(data.id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.documents.byProject(data.project_id),
            });
        },
    });
}

export function useDeleteDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, deletedBy }: { id: string; deletedBy: string }) => {
            const api = atomsApiClient();
            return api.documents.softDelete(id, deletedBy);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.documents.byProject(data.project_id),
            });
        },
    });
}

export function useDuplicateDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            documentId,
            destinationProjectId,
            newName,
            userId,
        }: {
            documentId: string;
            destinationProjectId: string;
            newName: string;
            userId: string;
        }) => {
            // Get the original document
            const api = atomsApiClient();
            const originalDocument = await api.documents.getById(documentId);
            if (!originalDocument) throw new Error('Document not found');

            // Create a new document with duplicated data
            const duplicatedDocument = {
                name: newName,
                slug: `${originalDocument.slug}-copy-${Date.now()}`,
                description: originalDocument.description,
                project_id: destinationProjectId,
                tags: originalDocument.tags,
                created_by: userId,
                updated_by: userId,
                id: uuidv4(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_deleted: false,
                version: 1,
            };

            const newDocument = await api.documents.create(duplicatedDocument as any);
            return newDocument as Document;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.documents.byProject(data.project_id),
            });
        },
    });
}

export function useCreateBaseOrgProperties() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orgId, userId }: { orgId: string; userId: string }) => {
            // First check if base properties exist for the organization
            const api = atomsApiClient();
            const existingProperties = await api.properties.listOrgBase(orgId);

            // If base properties already exist, return them
            const existingPropertyNames = new Set(existingProperties.map((p) => p.name));
            const missingProperties = [
                'External_ID',
                'Name',
                'Description',
                'Status',
                'Priority',
            ].filter((name) => !existingPropertyNames.has(name));
            if (missingProperties.length === 0) {
                return existingProperties as Property[];
            }

            // If no base properties exist, create them
            const defaultProperties: PropertyCreateData[] = [
                {
                    name: 'External_ID',
                    property_type: 'text',
                    org_id: orgId,
                    is_base: true,
                    scope: 'org',
                    document_id: undefined,
                    project_id: undefined,
                },
                {
                    name: 'Name',
                    property_type: 'text',
                    org_id: orgId,
                    is_base: true,
                    scope: 'org',
                    document_id: undefined,
                    project_id: undefined,
                },
                {
                    name: 'Description',
                    property_type: 'text',
                    org_id: orgId,
                    is_base: true,
                    scope: 'org',
                    document_id: undefined,
                    project_id: undefined,
                },
                {
                    name: 'Status',
                    property_type: 'select',
                    org_id: orgId,
                    is_base: true,
                    scope: 'org',
                    document_id: undefined,
                    project_id: undefined,
                    options: {
                        values: [
                            'active',
                            'archived',
                            'draft',
                            'deleted',
                            'in_review',
                            'in_progress',
                            'approved',
                            'rejected',
                        ],
                    },
                },
                {
                    name: 'Priority',
                    property_type: 'select',
                    org_id: orgId,
                    is_base: true,
                    scope: 'org',
                    document_id: undefined,
                    project_id: undefined,
                    options: {
                        values: ['low', 'medium', 'high', 'critical'],
                    },
                },
            ];

            const timestamp = new Date().toISOString();
            const baseProperties = defaultProperties.map((prop) => ({
                ...prop,
                created_at: timestamp,
                updated_at: timestamp,
                created_by: userId,
                updated_by: userId,
            }));

            const api2 = atomsApiClient();
            const createdProperties = await api2.properties.createMany(baseProperties);
            return createdProperties as Property[];
        },
        onSuccess: (data) => {
            if (data.length > 0) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.properties.root,
                });
            }
        },
    });
}

export function useCreateDocumentProperties() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            documentId,
            orgId,
            _propertyIds,
        }: {
            documentId: string;
            orgId: string;
            _propertyIds?: string[];
        }) => {
            // Find the base properties for this org
            const api = atomsApiClient();
            const baseProperties = await api.properties.listOrgBase(orgId);

            if (!baseProperties || baseProperties.length === 0) {
                throw new Error('No base properties found for this organization');
            }

            // Create document-specific properties based on base properties
            const timestamp = new Date().toISOString();
            const documentProperties = baseProperties.map((baseProp) => ({
                name: baseProp.name,
                property_type: baseProp.property_type,
                org_id: orgId,
                document_id: documentId,
                options: baseProp.options,
                created_at: timestamp,
                updated_at: timestamp,
            }));

            const createdProperties = await api.properties.createMany(documentProperties as any);
            return createdProperties as Property[];
        },
        onSuccess: (data) => {
            if (data.length > 0 && data[0].document_id) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.properties.byDocument(data[0].document_id),
                });
            }
        },
    });
}

export function useCreateDocumentWithDefaultSchemas() {
    const createDocumentMutation = useCreateDocument();
    const createBaseOrgPropertiesMutation = useCreateBaseOrgProperties();

    return useMutation({
        mutationFn: async (document: Partial<Document>) => {
            if (!document.project_id) {
                throw new Error('Project ID is required to create a document');
            }

            const api = atomsApiClient();
            const project = await api.projects.getById(document.project_id as string);
            const orgId = (project as any)?.organization_id as string;

            // Check/create base property schemas for the organization
            // Only ensure base properties exist, don't create document properties
            await createBaseOrgPropertiesMutation.mutateAsync({
                orgId,
                userId: document.created_by as string,
            });

            console.log('baseProperties checked/created');

            // Create the document
            const createdDocument = await createDocumentMutation.mutateAsync(document);

            return createdDocument;
        },
    });
}
