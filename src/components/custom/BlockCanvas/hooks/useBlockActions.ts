import { useCreateBlock, useUpdateBlock, useDeleteBlock } from '@/hooks/mutations/useBlockMutations';
import { Json } from '@/types/base/database.types';
import { UseBlockActionsProps, BlockWithRequirements } from '../types';
import { useDocumentStore } from '@/lib/store/document.store';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';

export const useBlockActions = ({ documentId, userProfile, blocks, setLocalBlocks }: UseBlockActionsProps) => {
  const createBlockMutation = useCreateBlock();
  const updateBlockMutation = useUpdateBlock();
  const deleteBlockMutation = useDeleteBlock();
  const { addBlock } = useDocumentStore();
  const queryClient = useQueryClient();

  const handleAddBlock = async (type: 'text' | 'table', content: Json) => {
    if (!userProfile?.id) return;

    const newBlock = {
      type,
      content,
      position: blocks?.length || 0,
      document_id: documentId,
      created_by: userProfile.id,
      updated_by: userProfile.id,
    };

    try {
      const createdBlock = await createBlockMutation.mutateAsync(newBlock);
      // Update both document store and local state immediately
      addBlock(createdBlock);
      setLocalBlocks(prev => [...prev, { ...createdBlock, requirements: [] }].sort((a, b) => a.position - b.position));
    } catch (error) {
      console.error('Failed to create block:', error);
    }
  };

  const handleUpdateBlock = async (blockId: string, content: Json) => {
    if (!userProfile?.id) return;

    try {
      const currentBlock = blocks?.find(b => b.id === blockId);
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
      setLocalBlocks(prev => prev.filter(block => block.id !== blockId));

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
      await Promise.all(reorderedBlocks.map(block => 
        updateBlockMutation.mutateAsync({
          id: block.id,
          position: block.position,
          content: block.content,
          updated_by: userProfile.id,
          version: (block.version || 1) + 1,
          updated_at: new Date().toISOString(),
        })
      ));
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