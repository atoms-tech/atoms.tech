import { useQueryClient } from '@tanstack/react-query';

import {
    BlockPropertySchema,
    BlockWithRequirements,
    UseBlockActionsProps,
} from '@/components/custom/BlockCanvas/types';
import {
    useCreateBlock,
    useDeleteBlock,
    useUpdateBlock,
} from '@/hooks/mutations/useBlockMutations';
import { useCreateBlockPropertySchema } from '@/hooks/queries/usePropertySchemas';
import { useDocumentPropertySchemas } from '@/hooks/queries/usePropertySchemas';
import { queryKeys } from '@/lib/constants/queryKeys';
import { useDocumentStore } from '@/lib/store/document.store';
import { Json } from '@/types/base/database.types';

export const useBlockActions = ({
    documentId,
    userProfile,
    blocks,
    setLocalBlocks,
}: UseBlockActionsProps) => {
    const createBlockMutation = useCreateBlock();
    const updateBlockMutation = useUpdateBlock();
    const deleteBlockMutation = useDeleteBlock();
    const createBlockPropertySchemaMutation = useCreateBlockPropertySchema();
    const { data: documentPropertySchemas } =
        useDocumentPropertySchemas(documentId);
    const { addBlock } = useDocumentStore();
    const queryClient = useQueryClient();

    const handleAddBlock = async (type: 'text' | 'table', content: Json) => {
        console.log('🏗️ handleAddBlock called', { type, content });

        if (!userProfile?.id) {
            console.log('⚠️ Cannot add block - missing user profile');
            return;
        }

        const newBlock = {
            type,
            content,
            position: blocks?.length || 0,
            document_id: documentId,
            created_by: userProfile.id,
            updated_by: userProfile.id,
        };

        try {
            console.log('🚀 Creating new block', newBlock);
            const createdBlock =
                await createBlockMutation.mutateAsync(newBlock);
            console.log('✅ Block created successfully', createdBlock);

            // Update both document store and local state immediately
            addBlock(createdBlock);
            setLocalBlocks((prev) =>
                [...prev, { ...createdBlock, requirements: [] }].sort(
                    (a, b) => a.position - b.position,
                ),
            );
            console.log('🔄 Local state updated with new block');

            // If it's a table block, create property schemas based on document property schemas
            if (type === 'table') {
                console.log('📊 Creating property schemas for table block', {
                    blockId: createdBlock.id,
                    docSchemasCount: documentPropertySchemas?.length,
                });

                if (!documentPropertySchemas?.length) {
                    console.warn(
                        '⚠️ No document property schemas found to mirror for table block',
                    );
                    return createdBlock;
                }

                try {
                    const createdSchemas = await Promise.all(
                        documentPropertySchemas.map(async (docSchema) => {
                            console.log(
                                '📝 Creating block schema from doc schema',
                                {
                                    schemaName: docSchema.name,
                                    dataType: docSchema.data_type,
                                },
                            );

                            const blockSchema: Partial<BlockPropertySchema> = {
                                block_id: createdBlock.id,
                                name: docSchema.name,
                                data_type: docSchema.data_type,
                                created_by: userProfile.id,
                                updated_by: userProfile.id,
                            };

                            try {
                                console.log(
                                    '🚀 Sending create block property schema mutation',
                                    blockSchema,
                                );
                                const createdSchema =
                                    await createBlockPropertySchemaMutation.mutateAsync(
                                        blockSchema,
                                    );
                                console.log(
                                    '✅ Block property schema created successfully',
                                    createdSchema,
                                );
                                return createdSchema;
                            } catch (err) {
                                console.error(
                                    '❌ Failed to create individual block property schema:',
                                    err,
                                );
                                console.error(
                                    'Error details:',
                                    JSON.stringify(err),
                                );
                                throw err;
                            }
                        }),
                    );

                    console.log(
                        '✅ All block property schemas created successfully',
                        {
                            count: createdSchemas.length,
                        },
                    );

                    // Invalidate block property schemas query to trigger a refetch
                    console.log('🔄 Invalidating block property schemas query');
                    queryClient.invalidateQueries({
                        queryKey: queryKeys.blockPropertySchemas.byBlock(
                            createdBlock.id,
                        ),
                    });
                } catch (schemaError) {
                    console.error(
                        '❌ Failed to create block property schemas:',
                        schemaError,
                    );
                    console.error(
                        'Error details:',
                        JSON.stringify(schemaError),
                    );
                }
            }

            return createdBlock;
        } catch (error) {
            console.error('❌ Failed to create block:', error);
            console.error('Error details:', JSON.stringify(error));
            throw error;
        }
    };

    const handleUpdateBlock = async (blockId: string, content: Json) => {
        if (!userProfile?.id) return;

        try {
            const currentBlock = blocks?.find((b) => b.id === blockId);
            if (!currentBlock) return;

            await updateBlockMutation.mutateAsync({
                id: blockId,
                content,
                updated_by: userProfile.id,
                version: (currentBlock.version || 1) + 1,
                updated_at: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Failed to update block:', error);
        }
    };

    const handleDeleteBlock = async (blockId: string) => {
        if (!userProfile?.id) return;

        try {
            // Update local state immediately
            setLocalBlocks((prev) =>
                prev.filter((block) => block.id !== blockId),
            );

            // Delete from server
            await deleteBlockMutation.mutateAsync({
                id: blockId,
                deletedBy: userProfile.id,
            });

            // Force a refetch to ensure consistency
            queryClient.invalidateQueries({
                queryKey: queryKeys.blocks.byDocument(documentId),
            });
        } catch (error) {
            console.error('Failed to delete block:', error);
            // Revert local state on error
            queryClient.invalidateQueries({
                queryKey: queryKeys.blocks.byDocument(documentId),
            });
        }
    };

    const handleReorder = async (reorderedBlocks: BlockWithRequirements[]) => {
        if (!userProfile?.id) return;

        try {
            // Update all positions in parallel for better performance
            await Promise.all(
                reorderedBlocks.map((block) =>
                    updateBlockMutation.mutateAsync({
                        id: block.id,
                        position: block.position,
                        content: block.content,
                        updated_by: userProfile.id,
                        version: (block.version || 1) + 1,
                        updated_at: new Date().toISOString(),
                    }),
                ),
            );
        } catch (error) {
            console.error('Failed to update block positions:', error);
        }
    };

    return {
        handleAddBlock,
        handleUpdateBlock,
        handleDeleteBlock,
        handleReorder,
    };
};
