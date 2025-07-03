import { useCallback, useEffect, useRef, useState } from 'react';

import {
    BlockWithRequirements,
    Column,
} from '@/components/custom/BlockCanvas/types';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Database } from '@/types/base/database.types';
import { Block } from '@/types/base/documents.types';
import { Profile } from '@/types/base/profiles.types';
import { Requirement } from '@/types/base/requirements.types';

type ColumnRow = Database['public']['Tables']['columns']['Row'];

// This interface is currently unused but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface UseDocumentRealtimeProps {
    documentId: string;
    orgId: string;
    projectId: string;
    userProfile: Profile | null;
}

interface DocumentState {
    blocks: BlockWithRequirements[] | undefined;
    loading: boolean;
    error: Error | null;
    setDocument: (
        updater: React.SetStateAction<BlockWithRequirements[] | undefined>,
        trackingBlockId?: string,
    ) => void;
}

export const useDocumentRealtime = ({
    documentId,
}: {
    documentId: string;
    _orgId: string;
    _projectId: string;
    _userProfile: Profile | null;
}): DocumentState => {
    const [blocks, setBlocks] = useState<BlockWithRequirements[]>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Track recent updates to prevent real-time conflicts
    const recentUpdatesRef = useRef<Set<string>>(new Set());
    const updateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Function to track when we make an optimistic update
    const trackOptimisticUpdate = useCallback((blockId: string) => {
        recentUpdatesRef.current.add(blockId);

        // Clear the timeout if it exists
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }

        // Remove the block from recent updates after a delay
        updateTimeoutRef.current = setTimeout(() => {
            recentUpdatesRef.current.delete(blockId);
        }, 1000); // 1 second delay to allow for database round-trip
    }, []);

    // Enhanced setBlocks that can track optimistic updates
    const setBlocksWithTracking = useCallback(
        (
            updater: React.SetStateAction<BlockWithRequirements[] | undefined>,
            trackingBlockId?: string,
        ) => {
            if (trackingBlockId) {
                trackOptimisticUpdate(trackingBlockId);
            }

            if (typeof updater === 'function') {
                setBlocks(updater);
            } else {
                setBlocks(updater);
            }
        },
        [trackOptimisticUpdate],
    );

    // Fetch blocks and their requirements
    const fetchBlocks = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch blocks
            const { data: blocksData, error: blocksError } = await supabase
                .from('blocks')
                .select('*')
                .eq('document_id', documentId)
                .is('is_deleted', false)
                .order('position');

            if (blocksError) throw blocksError;

            // Fetch requirements for all blocks
            const { data: requirementsData, error: requirementsError } =
                await supabase
                    .from('requirements')
                    .select('*')
                    .is('is_deleted', false)
                    .eq('document_id', documentId)
                    .order('position');

            if (requirementsError) throw requirementsError;

            // Fetch columns for table blocks
            const tableBlocks = blocksData.filter(
                (block) => block.type === 'table',
            );
            const { data: columnsData, error: columnsError } = await supabase
                .from('columns')
                .select('*, property:properties(*)')
                .in(
                    'block_id',
                    tableBlocks.map((block) => block.id),
                );

            if (columnsError) throw columnsError;

            // Group requirements by block_id
            const requirementsByBlock = requirementsData.reduce(
                (acc: { [key: string]: Requirement[] }, req: Requirement) => {
                    if (!acc[req.block_id]) {
                        acc[req.block_id] = [];
                    }
                    acc[req.block_id].push(req);
                    return acc;
                },
                {},
            );

            // Group columns by block_id
            const columnsByBlock = (columnsData as ColumnRow[]).reduce(
                (acc: { [key: string]: Column[] }, col) => {
                    const blockId = col.block_id;
                    if (blockId && !acc[blockId]) {
                        acc[blockId] = [];
                    }
                    if (blockId) {
                        acc[blockId].push(col as unknown as Column);
                    }
                    return acc;
                },
                {},
            );

            // Combine blocks with their requirements and columns
            const blocksWithRequirements: BlockWithRequirements[] =
                blocksData.map((block: Block) => ({
                    ...block,
                    order: block.position || 0,
                    requirements: requirementsByBlock[block.id] || [],
                    columns: columnsByBlock[block.id] || [],
                }));

            setBlocks(blocksWithRequirements);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [documentId]);

    // Subscribe to changes
    useEffect(() => {
        if (!documentId) return;

        // Initial fetch
        fetchBlocks();

        // Subscribe to blocks changes
        const blocksSubscription = supabase
            .channel(`blocks:${documentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'blocks',
                    filter: `document_id=eq.${documentId}`,
                },
                (payload) => {
                    // Handle individual block changes instead of fetching all blocks
                    if (payload.eventType === 'UPDATE') {
                        // Check if this block was recently updated optimistically
                        const blockId = payload.new.id;
                        if (recentUpdatesRef.current.has(blockId)) {
                            console.log(
                                'Skipping real-time update for recently modified block:',
                                blockId,
                            );
                            return;
                        }

                        setBlocks((prevBlocks) => {
                            if (!prevBlocks) return prevBlocks;
                            return prevBlocks.map((block) =>
                                block.id === payload.new.id
                                    ? {
                                          ...block,
                                          ...payload.new,
                                          requirements: block.requirements,
                                          columns: block.columns,
                                      }
                                    : block,
                            );
                        });
                    } else {
                        // For INSERT and DELETE, fetch all blocks
                        fetchBlocks();
                    }
                },
            )
            .subscribe();

        // Subscribe to requirements changes
        const requirementsSubscription = supabase
            .channel(`requirements:${documentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'requirements',
                    filter: `document_id=eq.${documentId}`,
                },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        setBlocks((prevBlocks) => {
                            if (!prevBlocks) return prevBlocks;
                            return prevBlocks.map((block) => {
                                if (block.id === payload.new.block_id) {
                                    return {
                                        ...block,
                                        requirements: block.requirements.map(
                                            (req) =>
                                                req.id === payload.new.id
                                                    ? (payload.new as Requirement)
                                                    : req,
                                        ),
                                    };
                                }
                                return block;
                            });
                        });
                    } else if (payload.eventType === 'INSERT') {
                        setBlocks((prevBlocks) => {
                            if (!prevBlocks) return prevBlocks;
                            return prevBlocks.map((block) => {
                                if (block.id === payload.new.block_id) {
                                    return {
                                        ...block,
                                        requirements: [
                                            ...block.requirements,
                                            payload.new as Requirement,
                                        ],
                                    };
                                }
                                return block;
                            });
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setBlocks((prevBlocks) => {
                            if (!prevBlocks) return prevBlocks;
                            return prevBlocks.map((block) => {
                                if (block.id === payload.old.block_id) {
                                    return {
                                        ...block,
                                        requirements: block.requirements.filter(
                                            (req) => req.id !== payload.old.id,
                                        ),
                                    };
                                }
                                return block;
                            });
                        });
                    }
                },
            )
            .subscribe();

        // Subscribe to columns changes
        const columnsSubscription = supabase
            .channel(`columns:${documentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'columns',
                },
                () => {
                    fetchBlocks();
                },
            )
            .subscribe();

        return () => {
            blocksSubscription.unsubscribe();
            requirementsSubscription.unsubscribe();
            columnsSubscription.unsubscribe();
        };
    }, [documentId, fetchBlocks]);

    return {
        blocks,
        loading,
        error,
        setDocument: setBlocksWithTracking,
    };
};
