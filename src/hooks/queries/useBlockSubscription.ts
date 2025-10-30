import { RealtimeChannel } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { useDocumentStore } from '@/store/document.store';
import { Block } from '@/types';
import { Database } from '@/types/base/database.types';

const fetchBlocks = async (client: SupabaseClient<Database>, documentId: string) => {
    const { data: blocks, error } = await client
        .from('blocks')
        .select('*')
        .eq('document_id', documentId)
        .eq('is_deleted', false)
        .order('position');

    if (error) {
        console.error('Error fetching blocks:', error);
        throw error;
    }

    return blocks;
};

export function useBlockSubscription(documentId: string) {
    const { addBlock, updateBlock, deleteBlock, setBlocks } = useDocumentStore();
    const [blocks, setLocalBlocks] = useState<Block[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    // Initial fetch and subscription setup
    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!supabase) {
            if (authError) {
                console.error('Supabase client not available:', authError);
                setIsLoading(false);
            }
            return;
        }

        let channel: RealtimeChannel;
        let isMounted = true;

        const loadInitialBlocksAndSubscribe = async () => {
            setIsLoading(true);
            try {
                // First set up the subscription to not miss any events
                channel = supabase
                    .channel(`blocks:${documentId}`)
                    .on<Block>(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'blocks',
                            filter: `document_id=eq.${documentId}`,
                        },
                        async (payload) => {
                            const newBlock = payload.new;
                            setLocalBlocks((prev) => {
                                const exists = prev.some((b) => b.id === newBlock.id);
                                return exists
                                    ? prev
                                    : [...prev, newBlock].sort(
                                          (a, b) => a.position - b.position,
                                      );
                            });
                            addBlock(newBlock);
                        },
                    )
                    .on<Block>(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'blocks',
                            filter: `document_id=eq.${documentId}`,
                        },
                        async (payload) => {
                            const updatedBlock = payload.new;
                            // Handle soft deletes
                            if (updatedBlock.is_deleted) {
                                setLocalBlocks((prev) =>
                                    prev.filter((b) => b.id !== updatedBlock.id),
                                );
                                deleteBlock(updatedBlock.id);
                                return;
                            }
                            // Update local state
                            setLocalBlocks((prev) =>
                                prev
                                    .map((b) =>
                                        b.id === updatedBlock.id ? updatedBlock : b,
                                    )
                                    .sort((a, b) => a.position - b.position),
                            );
                            updateBlock(updatedBlock.id, updatedBlock.content);
                        },
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
                            setLocalBlocks((prev) =>
                                prev.filter((b) => b.id !== deletedBlockId),
                            );
                            deleteBlock(deletedBlockId);
                        },
                    );

                await channel.subscribe();

                // Then fetch initial data
                const initialBlocks = await fetchBlocks(supabase, documentId);
                if (!isMounted) return;
                setLocalBlocks(initialBlocks);
                setBlocks(initialBlocks);
            } catch (error) {
                console.error('Error in initial setup:', error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadInitialBlocksAndSubscribe();

        return () => {
            isMounted = false;
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, [
        documentId,
        addBlock,
        updateBlock,
        deleteBlock,
        setBlocks,
        supabase,
        authLoading,
        authError,
    ]);

    return { blocks, isLoading, setLocalBlocks };
}
