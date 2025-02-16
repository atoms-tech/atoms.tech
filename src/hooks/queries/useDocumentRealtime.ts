import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Block } from '@/types/base/documents.types';
import { Requirement } from '@/types/base/requirements.types';
import { BlockSchema } from '@/types/validation/blocks.validation';
import { RequirementSchema } from '@/types/validation/requirements.validation';
import { useDocumentStore } from '@/lib/store/document.store';
import { RealtimeChannel } from '@supabase/supabase-js';

type BlockWithRequirements = Block & { requirements: Requirement[] };

// Separate fetching of blocks and requirements to avoid race conditions
const fetchInitialData = async (documentId: string) => {
  // First fetch all blocks
  const { data: blocksData, error: blocksError } = await supabase
    .from('blocks')
    .select('*')
    .eq('document_id', documentId)
    .eq('is_deleted', false)
    .order('position');

  if (blocksError) {
    console.error('Error fetching blocks:', blocksError);
    throw blocksError;
  }

  // Then fetch all active requirements for this document
  const { data: requirementsData, error: requirementsError } = await supabase
    .from('requirements')
    .select('*')
    .eq('document_id', documentId)
    .eq('is_deleted', false);

  if (requirementsError) {
    console.error('Error fetching requirements:', requirementsError);
    throw requirementsError;
  }

  // Parse and merge the data
  const blocks = blocksData.map(block => BlockSchema.parse(block));
  const requirements = requirementsData.map(req => RequirementSchema.parse(req));

  // Group requirements by block_id
  const requirementsByBlock = requirements.reduce((acc, req) => {
    if (!acc[req.block_id]) {
      acc[req.block_id] = [];
    }
    acc[req.block_id].push(req);
    return acc;
  }, {} as Record<string, Requirement[]>);

  // Merge blocks with their requirements
  return blocks.map(block => ({
    ...block,
    requirements: requirementsByBlock[block.id] || []
  }));
};

export function useDocumentRealtime(documentId: string) {
  const { addBlock, updateBlock, deleteBlock, setBlocks } = useDocumentStore();
  const [blocks, setLocalBlocks] = useState<BlockWithRequirements[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to update both states - moved outside useEffect and memoized
  const updateBothStates = useCallback((updateFn: (prev: BlockWithRequirements[]) => BlockWithRequirements[]) => {
    setLocalBlocks(prev => {
      const updated = updateFn(prev);
      // Update document store with the same data
      setBlocks(updated as unknown as Block[]);
      return updated;
    });
  }, [setBlocks]);

  // Helper function to delete all requirements of a block
  const deleteBlockRequirements = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('requirements')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('block_id', blockId);

      if (error) {
        console.error('Error deleting block requirements:', error);
      }
    } catch (error) {
      console.error('Error in deleteBlockRequirements:', error);
    }
  };

  useEffect(() => {
    let blockChannel: RealtimeChannel;
    let requirementChannel: RealtimeChannel;

    const loadInitialDataAndSubscribe = async () => {
      try {
        // Set up block subscription
        blockChannel = supabase
          .channel(`blocks:${documentId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'blocks',
              filter: `document_id=eq.${documentId}`,
            },
            async (payload) => {
              console.log('Block INSERT event:', payload);
              const newBlock = BlockSchema.parse(payload.new);
              setLocalBlocks(prev => {
                const exists = prev.some(b => b.id === newBlock.id);
                return exists 
                  ? prev 
                  : [...prev, { ...newBlock, requirements: [] }].sort((a, b) => a.position - b.position);
              });
              addBlock(newBlock);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'blocks',
              filter: `document_id=eq.${documentId}`,
            },
            async (payload) => {
              console.log('Block UPDATE event:', payload);
              const updatedBlock = BlockSchema.parse(payload.new);
              if (updatedBlock.is_deleted) {
                // Delete all requirements of this block first
                await deleteBlockRequirements(updatedBlock.id);
                setLocalBlocks(prev => prev.filter(b => b.id !== updatedBlock.id));
                deleteBlock(updatedBlock.id);
                return;
              }
              setLocalBlocks(prev => prev.map(b => 
                b.id === updatedBlock.id 
                  ? { ...updatedBlock, requirements: b.requirements } 
                  : b
              ).sort((a, b) => a.position - b.position));
              updateBlock(updatedBlock.id, updatedBlock.content);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'blocks',
              filter: `document_id=eq.${documentId}`,
            },
            async (payload) => {
              console.log('Block DELETE event:', payload);
              const deletedBlockId = payload.old.id;
              // Delete all requirements of this block first
              await deleteBlockRequirements(deletedBlockId);
              setLocalBlocks(prev => prev.filter(b => b.id !== deletedBlockId));
              deleteBlock(deletedBlockId);
            }
          );

        // Set up requirements subscription with store updates
        requirementChannel = supabase
          .channel(`requirements:${documentId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'requirements',
              filter: `document_id=eq.${documentId}`,
            },
            async (payload) => {
              console.log('Requirement INSERT event:', payload);
              const newRequirement = RequirementSchema.parse(payload.new);
              if (newRequirement.is_deleted) {
                console.log('Skipping deleted requirement:', newRequirement);
                return;
              }
              
              updateBothStates(prev => 
                prev.map(block => ({
                  ...block,
                  requirements: block.id === newRequirement.block_id
                    ? [...block.requirements, newRequirement]
                    : block.requirements
                }))
              );
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'requirements',
              filter: `document_id=eq.${documentId}`,
            },
            async (payload) => {
              console.log('Requirement UPDATE event:', payload);
              const updatedRequirement = RequirementSchema.parse(payload.new);
              
              updateBothStates(prev => 
                prev.map(block => {
                  if (block.id === updatedRequirement.block_id) {
                    // If requirement is deleted, filter it out
                    if (updatedRequirement.is_deleted) {
                      return {
                        ...block,
                        requirements: block.requirements.filter(req => req.id !== updatedRequirement.id),
                      };
                    }
                    // Otherwise update the requirement
                    return {
                      ...block,
                      requirements: block.requirements.map(req =>
                        req.id === updatedRequirement.id ? updatedRequirement : req
                      ),
                    };
                  }
                  return block;
                })
              );
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'requirements',
              filter: `document_id=eq.${documentId}`,
            },
            async (payload) => {
              console.log('Requirement DELETE event:', payload);
              const deletedRequirement = payload.old;
              
              updateBothStates(prev => 
                prev.map(block => ({
                  ...block,
                  requirements: block.id === deletedRequirement.block_id
                    ? block.requirements.filter(req => req.id !== deletedRequirement.id)
                    : block.requirements
                }))
              );
            }
          );

        // Subscribe to both channels with status logging
        await Promise.all([
          blockChannel.subscribe((status) => {
            console.log('Block channel status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to block channel');
            }
          }),
          requirementChannel.subscribe((status) => {
            console.log('Requirement channel status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to requirement channel');
            }
          })
        ]);

        // Fetch initial data
        console.log('Fetching initial data...');
        const initialData = await fetchInitialData(documentId);
        console.log('Setting initial data:', initialData);
        setLocalBlocks(initialData);
        setBlocks(initialData);
      } catch (error) {
        console.error('Error in initial setup:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialDataAndSubscribe();

    return () => {
      console.log('Cleaning up subscriptions...');
      if (blockChannel) {
        console.log('Unsubscribing from block channel');
        blockChannel.unsubscribe();
      }
      if (requirementChannel) {
        console.log('Unsubscribing from requirement channel');
        requirementChannel.unsubscribe();
      }
    };
  }, [documentId, addBlock, updateBlock, deleteBlock, setBlocks, updateBothStates]);

  return { blocks, isLoading, setLocalBlocks };
} 