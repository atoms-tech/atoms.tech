import { useQueryClient } from '@tanstack/react-query';

import {
    BlockPropertySchema,
    DocumentPropertySchema,
} from '@/components/custom/BlockCanvas/types';
import {
    useCreateBlockPropertySchema,
    useDocumentPropertySchemas,
} from '@/hooks/queries/usePropertySchemas';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/constants/queryKeys';

interface UseTableBlockActionsProps {
    documentId: string;
    blockId: string;
}

export const useTableBlockActions = ({
    documentId,
    blockId,
}: UseTableBlockActionsProps) => {
    const { userProfile } = useAuth();
    const { data: documentPropertySchemas } =
        useDocumentPropertySchemas(documentId);
    const createBlockPropertySchemaMutation = useCreateBlockPropertySchema();
    const queryClient = useQueryClient();

    /**
     * Creates block property schemas based on document property schemas
     * This is called when a new table block is created
     */
    const createBlockPropertySchemas = async () => {
        if (!userProfile?.id) {
            return [];
        }

        if (!blockId) {
            return [];
        }

        try {
            // If there are no document property schemas, create default ones
            if (
                !documentPropertySchemas ||
                documentPropertySchemas.length === 0
            ) {
                // This would require a mutation to create document property schemas
                // For now, we'll just return an empty array
                return [];
            }

            // Create block property schemas based on document property schemas
            const createdSchemas = await Promise.all(
                documentPropertySchemas.map(async (docSchema) => {
                    // Create a block property schema for each document property schema
                    const blockSchema: Partial<BlockPropertySchema> = {
                        block_id: blockId,
                        name: docSchema.name,
                        data_type: docSchema.data_type,
                        created_by: userProfile.id,
                        updated_by: userProfile.id,
                    };

                    // Create the block property schema
                    return await createBlockPropertySchemaMutation.mutateAsync(
                        blockSchema,
                    );
                }),
            );

            // Invalidate the query to trigger a refetch
            queryClient.invalidateQueries({
                queryKey: queryKeys.blockPropertySchemas.byBlock(blockId),
            });

            return createdSchemas;
        } catch (error) {
            throw error;
        }
    };

    /**
     * Creates a custom block property schema
     * This is called when a user adds a new column to the table
     */
    const createCustomBlockPropertySchema = async (
        name: string,
        dataType: string = 'string',
    ) => {
        if (!userProfile?.id) {
            throw new Error('User profile not found');
        }

        try {
            // Create a new block property schema
            const blockSchema: Partial<BlockPropertySchema> = {
                block_id: blockId,
                name,
                data_type: dataType,
                created_by: userProfile.id,
                updated_by: userProfile.id,
            };

            // Create the block property schema
            const createdSchema =
                await createBlockPropertySchemaMutation.mutateAsync(
                    blockSchema,
                );

            // Invalidate the query to trigger a refetch
            queryClient.invalidateQueries({
                queryKey: queryKeys.blockPropertySchemas.byBlock(blockId),
            });

            return createdSchema;
        } catch (error) {
            throw error;
        }
    };

    /**
     * Creates default document property schemas
     * This is called when a document doesn't have any property schemas
     */
    const createDefaultDocumentPropertySchemas = async (
        createDocumentPropertySchema: (
            schema: Partial<DocumentPropertySchema>,
        ) => Promise<DocumentPropertySchema>,
    ) => {
        if (!userProfile?.id) {
            throw new Error('User profile not found');
        }

        try {
            // Define default document property schemas
            const defaultSchemas = [
                {
                    name: 'Name',
                    data_type: 'string',
                },
                {
                    name: 'Description',
                    data_type: 'string',
                },
                {
                    name: 'Status',
                    data_type: 'enum',
                },
                {
                    name: 'Priority',
                    data_type: 'enum',
                },
                {
                    name: 'Assignee',
                    data_type: 'string',
                },
                {
                    name: 'Due Date',
                    data_type: 'date',
                },
            ];

            // Create document property schemas
            const createdSchemas = await Promise.all(
                defaultSchemas.map(async (schema) => {
                    const docSchema: Partial<DocumentPropertySchema> = {
                        document_id: documentId,
                        name: schema.name,
                        data_type: schema.data_type,
                        created_by: userProfile.id,
                        updated_by: userProfile.id,
                    };

                    return await createDocumentPropertySchema(docSchema);
                }),
            );

            // Invalidate the query to trigger a refetch
            queryClient.invalidateQueries({
                queryKey:
                    queryKeys.documentPropertySchemas.byDocument(documentId),
            });

            return createdSchemas;
        } catch (error) {
            throw error;
        }
    };

    return {
        createBlockPropertySchemas,
        createCustomBlockPropertySchema,
        createDefaultDocumentPropertySchemas,
    };
};
