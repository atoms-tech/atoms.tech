import { useCallback, useEffect, useState } from 'react';

import { BlockWithRequirements, Column } from '@/components/custom/BlockCanvas/types';
import { atomsApiClient } from '@/lib/atoms-api';
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

    // Fetch blocks and their requirements
    const fetchBlocks = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch blocks
            const api = atomsApiClient();
            const blocksData = await api.documents.listBlocks(documentId);

            // Fetch requirements for all blocks
            const requirementsData = await api.requirements.listByDocument(documentId);

            // Fetch columns for table blocks
            const tableBlocks = blocksData.filter((block) => block.type === 'table');
            console.log(
                '🔍 Table blocks found:',
                tableBlocks.length,
                tableBlocks.map((b) => b.id),
            );

            const columnsData = await api.documents.listColumnsByBlockIds(
                tableBlocks.map((block) => block.id),
            );
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

        let blocksSub: any;
        let reqSub: any;
        let colSub: any;

        const run = async () => {
            // Initial fetch
            await fetchBlocks();

            // Subscribe to blocks changes
            const api = atomsApiClient();
            blocksSub = api.realtime.subscribeBlocks(documentId, {
                onInsert: () => fetchBlocks(),
                onUpdate: (newBlock) => {
                    // Handle individual block changes instead of fetching all blocks
                    setBlocks((prevBlocks) => {
                        if (!prevBlocks) return prevBlocks;
                        return prevBlocks.map((block) =>
                            block.id === newBlock.id
                                ? {
                                      ...block,
                                      ...newBlock,
                                      requirements: block.requirements,
                                      columns: block.columns,
                                  }
                                : block,
                        );
                    });
                },
                onDelete: () => fetchBlocks(),
            });
            await blocksSub.subscribe();

            // Subscribe to requirements changes
            reqSub = api.realtime.subscribeRequirements(documentId, {
                onUpdate: (updated) => {
                    setBlocks((prevBlocks) => {
                        if (!prevBlocks) return prevBlocks;

                        return prevBlocks.map((block) => {
                            if (block.id === updated.block_id) {
                                return {
                                    ...block,
                                    requirements: block.requirements.map((req) =>
                                        req.id === updated.id
                                            ? (updated as Requirement)
                                            : req,
                                    ),
                                };
                            }
                            return block;
                        });
                    });
                },
                onInsert: (inserted) => {
                    setBlocks((prevBlocks) => {
                        if (!prevBlocks) return prevBlocks;

                        return prevBlocks.map((block) => {
                            if (block.id === inserted.block_id) {
                                return {
                                    ...block,
                                    requirements: [
                                        ...block.requirements,
                                        inserted as Requirement,
                                    ],
                                };
                            }
                            return block;
                        });
                    });
                },
                onDelete: (oldItem) => {
                    setBlocks((prevBlocks) => {
                        if (!prevBlocks) return prevBlocks;

                        return prevBlocks.map((block) => {
                            if (block.id === oldItem.block_id) {
                                return {
                                    ...block,
                                    requirements: block.requirements.filter(
                                        (req) => req.id !== oldItem.id,
                                    ),
                                };
                            }
                            return block;
                        });
                    });
                },
            });
            await reqSub.subscribe();

            // Subscribe to columns changes
            colSub = api.realtime.subscribeColumns(documentId, () => fetchBlocks());
            await colSub.subscribe();
        };

        run();

        return () => {
            blocksSub?.unsubscribe?.();
            reqSub?.unsubscribe?.();
            colSub?.unsubscribe?.();
        };
    }, [documentId, fetchBlocks]);

    return {
        blocks,
        loading,
        error,
        setDocument: setBlocks,
    };
};
