import { isEqual } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';

import { BlockWithRequirements, Column } from '@/components/custom/BlockCanvas/types';
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
    setDocument: (blocks: BlockWithRequirements[]) => void;
}

export const useDocumentRealtime = ({
    documentId,
    // These parameters are currently unused but kept for future use
    _orgId,
    _projectId,
    _userProfile,
}: {
    documentId: string;
    _orgId: string;
    _projectId: string;
    _userProfile: Profile | null;
}): DocumentState => {
    const [blocks, setBlocks] = useState<BlockWithRequirements[]>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // To keep previous state for comparison to avoid unnecessary setState calls
    const blocksRef = useRef<BlockWithRequirements[] | undefined>(blocks);
    blocksRef.current = blocks;

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
            const { data: requirementsData, error: requirementsError } = await supabase
                .from('requirements')
                .select('*')
                .is('is_deleted', false)
                .eq('document_id', documentId)
                .order('position');

            if (requirementsError) throw requirementsError;

            // Fetch columns for table blocks
            const tableBlocks = blocksData.filter((block) => block.type === 'table');
            console.log(
                '🔍 Table blocks found:',
                tableBlocks.length,
                tableBlocks.map((b) => b.id),
            );

            const { data: columnsData, error: columnsError } = await supabase
                .from('columns')
                .select('*, property:properties(*)')
                .in(
                    'block_id',
                    tableBlocks.map((block) => block.id),
                )
                .order('position', { ascending: true });

            if (columnsError) {
                console.error('❌ Columns fetch error:', columnsError);
                throw columnsError;
            }
            console.log('✅ Columns fetched:', columnsData?.length || 0, columnsData);

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
            console.log('🔍 Columns grouped by block:', columnsByBlock);

            // Combine blocks with their requirements and columns
            const blocksWithRequirements: BlockWithRequirements[] = blocksData.map(
                (block: Block) => {
                    const blockColumns = columnsByBlock[block.id] || [];
                    console.log('🔍 Block data assembly:', {
                        blockId: block.id,
                        blockType: block.type,
                        hasColumnsData: !!columnsByBlock[block.id],
                        columnsCount: blockColumns.length,
                        columns: blockColumns,
                    });

                    return {
                        ...block,
                        order: block.position || 0,
                        requirements: requirementsByBlock[block.id] || [],
                        columns: blockColumns,
                    };
                },
            );

            // Only update if blocks have actually changed
            if (!isEqual(blocksRef.current, blocksWithRequirements)) {
                setBlocks(blocksWithRequirements);
            }
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
                        setBlocks((prevBlocks) => {
                            if (!prevBlocks) return prevBlocks;

                            const updated = prevBlocks.map((block) =>
                                block.id === payload.new.id
                                    ? {
                                          ...block,
                                          ...payload.new,
                                          requirements: block.requirements,
                                          columns: block.columns,
                                      }
                                    : block,
                            );

                            // Only update state if changed
                            return isEqual(prevBlocks, updated) ? prevBlocks : updated;
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

                            const updated = prevBlocks.map((block) => {
                                if (block.id === payload.new.block_id) {
                                    return {
                                        ...block,
                                        requirements: block.requirements.map((req) =>
                                            req.id === payload.new.id
                                                ? (payload.new as Requirement)
                                                : req,
                                        ),
                                    };
                                }
                                return block;
                            });

                            return isEqual(prevBlocks, updated) ? prevBlocks : updated;
                        });
                    } else if (payload.eventType === 'INSERT') {
                        setBlocks((prevBlocks) => {
                            if (!prevBlocks) return prevBlocks;

                            const updated = prevBlocks.map((block) => {
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

                            return isEqual(prevBlocks, updated) ? prevBlocks : updated;
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setBlocks((prevBlocks) => {
                            if (!prevBlocks) return prevBlocks;

                            const updated = prevBlocks.map((block) => {
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

                            return isEqual(prevBlocks, updated) ? prevBlocks : updated;
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
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        setBlocks((prevBlocks) => {
                            if (!prevBlocks) return prevBlocks;

                            const updated = prevBlocks.map((block) => {
                                if (block.id !== payload.new.block_id) return block;

                                const newColumns = (block.columns ?? []).map((col) =>
                                    col.id === payload.new.id
                                        ? (payload.new as Column)
                                        : col,
                                );

                                return { ...block, columns: newColumns };
                            });

                            return isEqual(prevBlocks, updated) ? prevBlocks : updated;
                        });
                    } else if (payload.eventType === 'INSERT') {
                        setBlocks((prevBlocks) => {
                            if (!prevBlocks) return prevBlocks;

                            const updated = prevBlocks.map((block) => {
                                if (block.id !== payload.new.block_id) return block;

                                return {
                                    ...block,
                                    columns: [
                                        ...(block.columns ?? []),
                                        payload.new as Column,
                                    ],
                                };
                            });

                            return isEqual(prevBlocks, updated) ? prevBlocks : updated;
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setBlocks((prevBlocks) => {
                            if (!prevBlocks) return prevBlocks;

                            const updated = prevBlocks.map((block) => {
                                if (block.id !== payload.old.block_id) return block;

                                return {
                                    ...block,
                                    columns: (block.columns ?? []).filter(
                                        (col) => col.id !== payload.old.id,
                                    ),
                                };
                            });

                            return isEqual(prevBlocks, updated) ? prevBlocks : updated;
                        });
                    } else {
                        // fallback or other event types: consider fetchBlocks or no-op
                    }
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
        setDocument: setBlocks,
    };
};
