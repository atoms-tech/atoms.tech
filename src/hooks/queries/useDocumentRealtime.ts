import { useCallback, useEffect, useState } from 'react';

import {
    BlockWithRequirements,
    Column,
    Property,
} from '@/components/custom/BlockCanvas/types';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
import { Database } from '@/types/base/database.types';
import { Block } from '@/types/base/documents.types';
import { Profile } from '@/types/base/profiles.types';
import { Requirement } from '@/types/base/requirements.types';

type ColumnRow = Database['public']['Tables']['columns']['Row'];
type ColumnRowWithEmbeddedProperty = ColumnRow & {
    property?: Property | null;
};

const normalizeColumns = (
    rawColumns: ColumnRowWithEmbeddedProperty[],
    propertyMap?: Map<string, Property>,
): Column[] =>
    rawColumns.map((col) => {
        const propertyFromMap =
            propertyMap && col.property_id
                ? (propertyMap.get(col.property_id) ?? undefined)
                : undefined;
        const resolvedProperty = col.property ?? propertyFromMap;

        return {
            ...(col as Column),
            property: resolvedProperty ?? undefined,
        } satisfies Column;
    });

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
    setDocument: React.Dispatch<
        React.SetStateAction<BlockWithRequirements[] | undefined>
    >;
    // lightweight way to rescan a single block's relations when created
    hydrateBlockRelations?: (blockId: string) => Promise<void>;
    // full refetch of all blocks + relations
    refetchDocument: (options?: { silent?: boolean }) => Promise<void>;
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
    const {
        supabase,
        isLoading: authLoading,
        error: authError,
    } = useAuthenticatedSupabase();

    // Initial full fetch of blocks and their requirements
    const fetchBlocks = useCallback(
        async (opts?: { silent?: boolean }) => {
            try {
                if (!opts?.silent) setLoading(true);

                if (!supabase) {
                    if (authLoading) {
                        return;
                    }
                    throw new Error(authError ?? 'Supabase client not available');
                }

                const client = supabase;

                // Fetch blocks
                const { data: blocksData, error: blocksError } = await client
                    .from('blocks')
                    .select('*')
                    .eq('document_id', documentId)
                    .is('is_deleted', false)
                    .order('position');

                if (blocksError) throw blocksError;

                // Fetch requirements for all blocks
                const { data: requirementsData, error: requirementsError } = await client
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

                // Fetch columns through API to avoid client-side UUID/type issues and rely on server membership checks
                let columnsData: ColumnRow[] = [] as unknown as ColumnRow[];
                try {
                    const res = await fetch(`/api/documents/${documentId}/columns`, {
                        method: 'GET',
                        cache: 'no-store',
                    });
                    if (!res.ok) {
                        const errorText = await res.text();
                        throw new Error(`Columns API error: ${res.status} ${errorText}`);
                    }
                    const payload = (await res.json()) as { columns: unknown[] };
                    columnsData = (payload.columns || []) as unknown as ColumnRow[];
                } catch (e) {
                    console.error('❌ Columns fetch error:', e);
                    throw e;
                }
                const columnsWithProperty: Column[] = normalizeColumns(
                    (columnsData as unknown as ColumnRowWithEmbeddedProperty[]) || [],
                );
                console.log('✅ Columns fetched:', columnsWithProperty.length);

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
                const columnsByBlock = columnsWithProperty.reduce(
                    (acc: { [key: string]: Column[] }, col: Column) => {
                        const blockId = col.block_id;
                        if (blockId && !acc[blockId]) {
                            acc[blockId] = [];
                        }
                        if (blockId) {
                            acc[blockId].push(col);
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

                // Merge with any existing local state to avoid dropping optimistic updates
                setBlocks((prev) => {
                    if (!prev || prev.length === 0) return blocksWithRequirements;

                    const byId = new Map<string, BlockWithRequirements>();
                    for (const b of prev) byId.set(b.id, b);
                    for (const b of blocksWithRequirements) byId.set(b.id, b);
                    const merged = Array.from(byId.values()).sort(
                        (a, b) => (a.order || 0) - (b.order || 0),
                    );
                    return merged;
                });

                setError(null);
            } catch (err) {
                setError(err as Error);
            } finally {
                if (!opts?.silent) setLoading(false);
            }
        },
        [documentId, supabase, authLoading, authError],
    );

    // Hydrate a single block's relations (columns + requirements) without full refetch
    const hydrateBlockRelations = useCallback(
        async (blockId: string) => {
            try {
                if (!supabase) {
                    if (authLoading) {
                        return;
                    }
                    throw new Error(authError ?? 'Supabase client not available');
                }

                const client = supabase;

                // Fetch requirements for the block
                const { data: requirementsData, error: requirementsError } = await client
                    .from('requirements')
                    .select('*')
                    .is('is_deleted', false)
                    .eq('block_id', blockId)
                    .order('position');

                if (requirementsError) throw requirementsError;

                // Fetch columns for the block via API route
                let columnsData: ColumnRow[] = [] as unknown as ColumnRow[];
                {
                    const res = await fetch(
                        `/api/documents/${documentId}/columns?blockId=${blockId}`,
                        { method: 'GET', cache: 'no-store' },
                    );
                    if (!res.ok) {
                        const errorText = await res.text();
                        throw new Error(`Columns API error: ${res.status} ${errorText}`);
                    }
                    const payload = (await res.json()) as { columns: unknown[] };
                    columnsData = (payload.columns || []) as unknown as ColumnRow[];
                }
                const hydratedColumns: Column[] = normalizeColumns(
                    (columnsData as unknown as ColumnRowWithEmbeddedProperty[]) || [],
                );

                setBlocks((prev) => {
                    if (!prev) return prev;
                    return prev.map((b) =>
                        b.id === blockId
                            ? {
                                  ...b,
                                  requirements: (requirementsData || []) as Requirement[],
                                  columns: hydratedColumns,
                              }
                            : b,
                    );
                });
            } catch (err) {
                // Do not surface as hook error; this is a targeted hydration
                console.error('Failed to hydrate block relations:', err);
            }
        },
        [documentId, supabase, authLoading, authError],
    );

    // Subscribe to changes
    useEffect(() => {
        if (!documentId || authLoading) return;

        if (!supabase) {
            if (authError) {
                setError(new Error(authError ?? 'Supabase client not available'));
                setLoading(false);
            }
            return;
        }

        const client = supabase;

        // Initial fetch
        fetchBlocks({ silent: false });

        // Subscribe to blocks changes
        const blocksSubscription = client
            .channel(`blocks:${documentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'blocks',
                    filter: `document_id=eq.${documentId}`,
                },
                // Handle individual block changes instead of fetching all blocks
                (payload) => {
                    setBlocks((prevBlocks) => {
                        if (!prevBlocks) return prevBlocks;

                        if (payload.eventType === 'INSERT') {
                            // Avoid duplicates when we already optimistically added the block
                            const exists = prevBlocks.some(
                                (b) => b.id === (payload.new as Block).id,
                            );
                            if (exists) return prevBlocks;

                            return [
                                ...prevBlocks,
                                {
                                    ...(payload.new as Block),
                                    order: payload.new.position,
                                    requirements: [],
                                    columns: [],
                                },
                            ].sort((a, b) => (a.order || 0) - (b.order || 0));
                        }
                        if (payload.eventType === 'UPDATE') {
                            return prevBlocks.map((block) =>
                                block.id === payload.new.id
                                    ? {
                                          ...block,
                                          ...(payload.new as Block),
                                          order: payload.new.position,
                                          requirements: block.requirements,
                                          columns: block.columns,
                                      }
                                    : block,
                            );
                        }
                        if (payload.eventType === 'DELETE') {
                            return prevBlocks.filter(
                                (block) => block.id !== payload.old.id,
                            );
                        }
                        return prevBlocks;
                    });
                },
            )
            .subscribe();

        // Subscribe to requirements changes
        const requirementsSubscription = client
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
                                        requirements: block.requirements.map((req) =>
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
        const columnsSubscription = client
            .channel(`columns:${documentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'columns',
                },
                async (payload) => {
                    const newCol = payload.new as Column | undefined;
                    const oldCol = payload.old as Column | undefined;

                    // For INSERTs, enrich the column with its joined property via server API
                    let enrichedNewCol: Column | undefined = newCol;
                    if (payload.eventType === 'INSERT' && newCol?.id) {
                        try {
                            const res = await fetch(
                                `/api/documents/${documentId}/columns?blockId=${newCol.block_id}`,
                                { method: 'GET', cache: 'no-store' },
                            );
                            if (res.ok) {
                                const payload = (await res.json()) as {
                                    columns: unknown[];
                                };
                                const candidates = (payload.columns ||
                                    []) as unknown as ColumnRowWithEmbeddedProperty[];
                                const normalized = normalizeColumns(candidates);
                                const found = normalized.find((c) => c.id === newCol.id);
                                if (found) {
                                    enrichedNewCol = found;
                                }
                            }
                        } catch (e) {
                            console.error('⚠️ Column subscription API enrich failed:', e);
                        }
                    }

                    setBlocks((prevBlocks) => {
                        if (!prevBlocks) return prevBlocks;

                        return prevBlocks.map((block) => {
                            if (
                                block.id !== enrichedNewCol?.block_id &&
                                block.id !== oldCol?.block_id &&
                                block.id !== newCol?.block_id
                            ) {
                                return block;
                            }

                            if (
                                payload.eventType === 'INSERT' &&
                                (enrichedNewCol || newCol)
                            ) {
                                const colToAdd = (enrichedNewCol || newCol) as Column;
                                // de-dupe by id to avoid double insertions from parallel sources
                                const exists = (block.columns ?? []).some(
                                    (c) => c.id === colToAdd.id,
                                );
                                const nextColumns = exists
                                    ? [...(block.columns ?? [])]
                                    : [...(block.columns ?? []), colToAdd];
                                const sorted = nextColumns.sort(
                                    (a, b) => (a.position ?? 0) - (b.position ?? 0),
                                );
                                return {
                                    ...block,
                                    columns: sorted,
                                };
                            }

                            if (payload.eventType === 'UPDATE' && newCol) {
                                const nextColumns = (block.columns ?? [])
                                    .map((c) =>
                                        c.id === newCol.id
                                            ? { ...c, ...newCol, property: c.property }
                                            : c,
                                    )
                                    .sort(
                                        (a, b) => (a.position ?? 0) - (b.position ?? 0),
                                    );
                                return {
                                    ...block,
                                    columns: nextColumns,
                                };
                            }

                            if (payload.eventType === 'DELETE' && oldCol) {
                                const nextColumns = (block.columns ?? [])
                                    .filter((c) => c.id !== oldCol.id)
                                    .sort(
                                        (a, b) => (a.position ?? 0) - (b.position ?? 0),
                                    );
                                return {
                                    ...block,
                                    columns: nextColumns,
                                };
                            }

                            return block;
                        });
                    });
                },
            )
            .subscribe();

        return () => {
            blocksSubscription.unsubscribe();
            requirementsSubscription.unsubscribe();
            columnsSubscription.unsubscribe();
        };
    }, [documentId, fetchBlocks, supabase, authLoading, authError]);

    const refetchDocument = useCallback(
        async (options?: { silent?: boolean }) => {
            await fetchBlocks({ silent: options?.silent ?? false });
        },
        [fetchBlocks],
    );

    return {
        blocks,
        loading,
        error,
        setDocument: setBlocks,
        // expose a lightweight rescan for newly added blocks
        hydrateBlockRelations,
        refetchDocument,
    };
};
