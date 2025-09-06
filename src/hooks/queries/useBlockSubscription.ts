import { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { atomsApiClient } from '@/lib/atoms-api';
import { useDocumentStore } from '@/store/document.store';
import { Block } from '@/types';

const fetchBlocks = async (documentId: string) => {
    const api = atomsApiClient();
    const blocks = await api.documents.listBlocks(documentId);

    return blocks;
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
                const api = atomsApiClient();
                const subscription = api.realtime.subscribeBlocks(documentId, {
                    onInsert: (newBlock) => {
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
                    onUpdate: (updatedBlock) => {
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
                    onDelete: (deletedBlockId) => {
                            setLocalBlocks((prev) =>
                                prev.filter((b) => b.id !== deletedBlockId),
                            );
                            deleteBlock(deletedBlockId);
                    },
                });
                channel = subscription.channel;
                await subscription.subscribe();

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
            if (channel) channel.unsubscribe();
        };
    }, [documentId, addBlock, updateBlock, deleteBlock, setBlocks]);

    return { blocks, isLoading, setLocalBlocks };
}
