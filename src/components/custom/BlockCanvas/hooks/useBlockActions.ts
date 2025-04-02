import { useQueryClient } from '@tanstack/react-query';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import {
    BlockType,
    BlockWithRequirements /* eslint-disable-next-line @typescript-eslint/no-unused-vars */,
    DefaultPropertyKeys /* eslint-disable-next-line @typescript-eslint/no-unused-vars */,
    Property /* eslint-disable-next-line @typescript-eslint/no-unused-vars */,
    PropertyType,
    UseBlockActionsProps,
} from '@/components/custom/BlockCanvas/types';
import {
    useCreateBlock,
    useDeleteBlock,
    useUpdateBlock,
} from '@/hooks/mutations/useBlockMutations';
import {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    BLOCKS_GUTTER_SIZE,
    BLOCK_TEXT_DEFAULT_HEIGHT,
} from '@/lib/constants/blocks';
import { queryKeys } from '@/lib/constants/queryKeys';
import { useDocumentStore } from '@/lib/store/document.store';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Json } from '@/types/base/database.types';
import {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    RequirementPriority /* eslint-disable-next-line @typescript-eslint/no-unused-vars */,
    RequirementStatus,
} from '@/types/base/enums.types';

export const useBlockActions = ({
    documentId,
    userProfile,
    blocks,
    setLocalBlocks,
    orgId,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    projectId,
}: UseBlockActionsProps) => {
    const createBlockMutation = useCreateBlock();
    const updateBlockMutation = useUpdateBlock();
    const deleteBlockMutation = useDeleteBlock();
    const { addBlock } = useDocumentStore();
    const queryClient = useQueryClient();

    // Add null check for blocks
    const getNewBlockOrder = () => {
        if (!blocks || blocks.length === 0) return 1;
        return Math.max(0, ...blocks.map((b) => b.order)) + 1;
    };

    // Add null check for blocks
    const getBlocksBelow = (order: number) => {
        if (!blocks) return [];
        // Return blocks that are below the current order
        return blocks.filter((b) => b.order > order);
    };

    const makeSpaceForBlock = (
        targetOrder: number,
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
        makeLocalOnly: boolean = false,
    ) => {
        const blocksBelow = getBlocksBelow(targetOrder);
        if (blocksBelow.length === 0) {
            return;
        }

        // Update the order of blocks below
        setLocalBlocks((prevBlocks) => {
            return prevBlocks.map((block) =>
                block.order >= targetOrder
                    ? { ...block, order: block.order + 1 }
                    : block,
            );
        });
    };

    // Create a default table block with basic properties
    const getDefaultTableBlock = () => {
        const newBlock: BlockWithRequirements = {
            id: uuidv4(),
            document_id: documentId,
            order: getNewBlockOrder(),
            height: BLOCK_TEXT_DEFAULT_HEIGHT,
            type: BlockType.table.toString(),
            content: null, // Use content instead of data
            position: getNewBlockOrder(), // Use position as required by Block type
            requirements: [], // Initialize with empty requirements array
            org_id: orgId, // Add the required org_id field
            name: 'Table Block', // Add the required name property
            created_at: null,
            updated_at: null,
            deleted_at: null,
            created_by: null,
            updated_by: null,
            deleted_by: null,
            is_deleted: null,
            version: 1,
        };

        return newBlock;
    };

    const getDefaultTextBlock = (content?: string) => {
        const newBlock: BlockWithRequirements = {
            id: uuidv4(),
            document_id: documentId,
            order: getNewBlockOrder(),
            height: BLOCK_TEXT_DEFAULT_HEIGHT,
            type: BlockType.text.toString(),
            content: { text: content || '<p></p>', format: 'default' } as Json,
            position: getNewBlockOrder(), // Use position as required by Block type
            requirements: [], // Initialize with empty requirements array
            org_id: orgId, // Add the required org_id field
            name: 'Text Block', // Add the required name property
            created_at: null,
            updated_at: null,
            deleted_at: null,
            created_by: null,
            updated_by: null,
            deleted_by: null,
            is_deleted: null,
            version: 1,
        };

        return newBlock;
    };

    // Create default properties for a block (using the new properties table)
    const createDefaultBlockProperties = async (blockId: string) => {
        if (!userProfile?.id) {
            console.error(
                'Cannot create default properties without user profile',
            );
            throw new Error('User profile not found');
        }

        if (!orgId) {
            console.error('No organization ID available');
            throw new Error('Organization ID not found');
        }

        console.log('Creating default properties for block', blockId);

        try {
            // Fetch base properties for the organization
            const { data: baseProperties, error: basePropertiesError } =
                await supabase
                    .from('properties')
                    .select('*')
                    .eq('org_id', orgId)
                    .eq('is_base', true)
                    .is('document_id', null)
                    .is('project_id', null)
                    .eq('scope', 'org');

            if (basePropertiesError) {
                console.error(
                    'Error fetching base properties:',
                    basePropertiesError,
                );
                throw basePropertiesError;
            }

            // Create columns for each base property
            const columnPromises = baseProperties.map(async (baseProp) => {
                const { data: column, error: columnError } = await supabase
                    .from('columns')
                    .insert({
                        block_id: blockId,
                        property_id: baseProp.id,
                        position: 0,
                        width: 200, // Default width
                        is_hidden: false,
                        is_pinned: false,
                    })
                    .select()
                    .single();

                if (columnError) {
                    console.error('Error creating column:', columnError);
                    throw columnError;
                }

                return column;
            });

            try {
                const columns = await Promise.all(columnPromises);
                console.log('Created columns:', columns);
                return columns;
            } catch (error) {
                console.error('Error creating columns:', error);
                // Delete the block since column creation failed
                const { error: deleteError } = await supabase
                    .from('blocks')
                    .delete()
                    .eq('id', blockId);

                if (deleteError) {
                    console.error(
                        'Error deleting block after column creation failure:',
                        deleteError,
                    );
                }
                throw error;
            }
        } catch (error) {
            console.error('Error in createDefaultBlockProperties:', error);
            throw error;
        }
    };

    const handleAddBlock = async (type: BlockType, content: Json) => {
        if (!userProfile?.id) {
            console.error('Cannot create block: User profile not found');
            throw new Error('User profile not found');
        }

        if (!orgId) {
            console.error('Cannot create block: Organization ID not found');
            throw new Error('Organization ID not found');
        }

        try {
            console.log('Creating new block', { type, content });
            const createdBlock = await createBlockMutation.mutateAsync({
                type,
                content,
                position: blocks?.length || 0,
                document_id: documentId,
                created_by: userProfile.id,
                updated_by: userProfile.id,
                org_id: orgId,
                name: `${type.toString().charAt(0).toUpperCase() + type.toString().slice(1)} Block`,
            });
            console.log('Block created successfully', createdBlock);

            // Update both document store and local state immediately
            addBlock(createdBlock);
            setLocalBlocks((prevBlocks) => {
                const newBlock: BlockWithRequirements = {
                    ...createdBlock,
                    requirements: [],
                    order: (prevBlocks || []).length,
                };
                return [...(prevBlocks || []), newBlock].map(
                    (block, index) => ({
                        ...block,
                        order: index,
                    }),
                );
            });
            console.log('Local state updated with new block');

            // If it's a table block, create columns based on base properties
            if (type === BlockType.table) {
                console.log('Creating columns for table block', {
                    blockId: createdBlock.id,
                });

                try {
                    await createDefaultBlockProperties(createdBlock.id);
                    console.log('Successfully created columns for table block');
                } catch (error) {
                    console.error(
                        'Failed to create columns for table block:',
                        error,
                    );
                    throw error;
                }
            }

            return createdBlock;
        } catch (error) {
            console.error('Failed to create block:', error);
            console.error('Error details:', JSON.stringify(error));
            throw error;
        }
    };

    const handleUpdateBlock = async (blockId: string, updates: Json) => {
        if (!userProfile?.id) {
            console.error('Cannot update block: User profile not found');
            throw new Error('User profile not found');
        }

        try {
            // Update local state first for optimistic updates
            setLocalBlocks((prevBlocks) =>
                prevBlocks.map((block) =>
                    block.id === blockId
                        ? {
                              ...block,
                              content: updates,
                              updated_by: userProfile.id,
                              updated_at: new Date().toISOString(),
                          }
                        : block,
                ),
            );

            // Then update the server
            await updateBlockMutation.mutateAsync({
                id: blockId,
                content: updates,
                updated_by: userProfile.id,
            });
        } catch (error) {
            console.error('Failed to update block:', error);
            // Revert local state on error
            queryClient.invalidateQueries({
                queryKey: queryKeys.blocks.byDocument(documentId),
            });
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
        _createDefaultBlockProperties: createDefaultBlockProperties,
        getNewBlockOrder,
        getBlocksBelow,
        makeSpaceForBlock,
        getDefaultTextBlock,
        getDefaultTableBlock,
    };
};
