import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Block } from '@/types';
import { BlockSchema } from '@/types/validation/blocks.validation';
import { useDocumentStore } from '@/lib/store/document.store';
import { RealtimeChannel } from '@supabase/supabase-js';

const fetchBlocks = async (documentId: string) => {
    const { data: blocks, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('document_id', documentId)
        .eq('is_deleted', false)
        .order('position');

    if (error) {
        console.error('Error fetching blocks:', error);
        throw error;
    }

    return blocks.map(block => BlockSchema.parse(block));
};

export function useBlockSubscription(documentId: string) {
    const { addBlock, updateBlock, deleteBlock, setBlocks } = useDocumentStore();
    const [blocks, setLocalBlocks] = useState<Block[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Initial fetch and subscription setup
    useEffect(() => {
        let channel: RealtimeChannel;

        const loadInitialBlocksAndSubscribe = async () => {
            try {
                // First set up the subscription to not miss any events
                channel = supabase
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
                            const newBlock = BlockSchema.parse(payload.new);
                            setLocalBlocks(prev => {
                                const exists = prev.some(b => b.id === newBlock.id);
                                return exists ? prev : [...prev, newBlock].sort((a, b) => a.position - b.position);
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
                            const updatedBlock = BlockSchema.parse(payload.new);
                            // Handle soft deletes
                            if (updatedBlock.is_deleted) {
                                setLocalBlocks(prev => prev.filter(b => b.id !== updatedBlock.id));
                                deleteBlock(updatedBlock.id);
                                return;
                            }
                            // Update local state
                            setLocalBlocks(prev => prev.map(b => b.id === updatedBlock.id ? updatedBlock : b).sort((a, b) => a.position - b.position));
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
                            const deletedBlockId = payload.old.id;
                            setLocalBlocks(prev => prev.filter(b => b.id !== deletedBlockId));
                            deleteBlock(deletedBlockId);
                        }
                    );

                await channel.subscribe();

                // Then fetch initial data
                const initialBlocks = await fetchBlocks(documentId);
                setLocalBlocks(initialBlocks);
                setBlocks(initialBlocks);
            } catch (error) {
                console.error('Error in initial setup:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialBlocksAndSubscribe();

        return () => {
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, [documentId, addBlock, updateBlock, deleteBlock, setBlocks]);

    return { blocks, isLoading, setLocalBlocks };
} 