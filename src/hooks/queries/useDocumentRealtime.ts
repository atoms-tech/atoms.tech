import { useCallback, useEffect, useState } from 'react';

import {
    BlockWithRequirements,
    Column,
    Property,
} from '@/components/custom/BlockCanvas/types';
import { synthesizeNaturalColumns } from '@/components/custom/BlockCanvas/utils/naturalFields';
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

// Simple in-memory caches for org properties and document→org mapping
const ORG_PROPERTIES_CACHE = new Map<string, { properties: Property[]; ts: number }>();
const DOCUMENT_ORG_CACHE = new Map<string, string>();
const ORG_CACHE_TTL_MS = 5 * 60 * 1000;

const getCachedOrgProperties = (orgId: string | null | undefined): Property[] => {
    if (!orgId) return [];
    const entry = ORG_PROPERTIES_CACHE.get(orgId);
    if (!entry) return [];
    if (Date.now() - entry.ts > ORG_CACHE_TTL_MS) return [];
    return entry.properties;
};

const setCachedOrgProperties = (orgId: string, properties: Property[]) => {
    ORG_PROPERTIES_CACHE.set(orgId, { properties, ts: Date.now() });
};

const setCachedDocumentOrg = (documentId: string, orgId: string | null | undefined) => {
    if (orgId) DOCUMENT_ORG_CACHE.set(documentId, orgId);
};

const getCachedDocumentOrg = (documentId: string): string | undefined => {
    return DOCUMENT_ORG_CACHE.get(documentId);
};

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

                // Resolve organization id (for default property options) via API
                let organizationId: string | null = null;
                try {
                    const resp = await fetch(`/api/documents/${documentId}`, {
                        method: 'GET',
                        cache: 'no-store',
                    });
                    if (resp.ok) {
                        const payload = (await resp.json()) as {
                            organizationId?: string | null;
                        };
                        organizationId = payload.organizationId ?? null;
                        setCachedDocumentOrg(documentId, organizationId);
                    }
                } catch {
                    // no-op
                }

                // Fetch org properties to hydrate virtual columns (status/priority options, capitalization)
                let orgProperties: Property[] = getCachedOrgProperties(organizationId);
                if (organizationId) {
                    try {
                        if (orgProperties.length === 0) {
                            const resProps = await fetch(
                                `/api/organizations/${organizationId}/properties`,
                                { method: 'GET', cache: 'no-store' },
                            );
                            if (resProps.ok) {
                                const payload = (await resProps.json()) as {
                                    properties?: Property[];
                                };
                                orgProperties = payload.properties || [];
                                setCachedOrgProperties(organizationId, orgProperties);
                            }
                        }
                    } catch {
                        // no-op
                    }
                }

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
                // centralized natural field config from utils

                const synthesizedForPersist: Array<{
                    blockId: string;
                    columns: Column[];
                }> = [];
                const blocksWithRequirements: BlockWithRequirements[] = blocksData.map(
                    (block: Block) => {
                        let blockColumns = columnsByBlock[block.id] || [];
                        console.log('🔍 Block data assembly:', {
                            blockId: block.id,
                            blockType: block.type,
                            hasColumnsData: !!columnsByBlock[block.id],
                            columnsCount: blockColumns.length,
                            columns: blockColumns,
                        });

                        // If this is a requirements table with no DB columns yet, synthesize
                        // virtual columns for natural fields so UI can render immediately.
                        try {
                            const contentAny = block.content as unknown as {
                                tableKind?: string;
                                columns?: Array<{
                                    name?: string;
                                    columnId?: string;
                                    position?: number;
                                    width?: number;
                                }>;
                            };
                            const tableKind = contentAny?.tableKind;
                            const metadataColumns = Array.isArray(contentAny?.columns)
                                ? (contentAny?.columns as Array<{
                                      name?: string;
                                      columnId?: string;
                                      position?: number;
                                      width?: number;
                                  }>)
                                : [];

                            const hasVirtualPlaceholders = metadataColumns.some(
                                (mc) =>
                                    (mc.columnId || '').startsWith('virtual-') ||
                                    [
                                        'external_id',
                                        'name',
                                        'description',
                                        'status',
                                        'priority',
                                    ].includes((mc.name || '').toLowerCase()),
                            );

                            const isReqTable =
                                block.type === 'table' && tableKind === 'requirements';

                            if (isReqTable && hasVirtualPlaceholders) {
                                // Always ensure natural fields are present by merging synthesized with existing
                                const synthesized: Column[] = synthesizeNaturalColumns(
                                    block.id,
                                    orgProperties,
                                );

                                // Build a case-insensitive set of existing column names
                                const existingNames = new Set(
                                    (blockColumns || []).map((c) =>
                                        (
                                            (c.property?.name ||
                                                (c as unknown as { name?: string })
                                                    .name ||
                                                '') as string
                                        ).toLowerCase(),
                                    ),
                                );

                                // Attempt to carry over positions from metadata for virtuals
                                const nameToMeta = new Map<
                                    string,
                                    { position?: number; width?: number }
                                >();
                                for (const mc of metadataColumns) {
                                    const key = (mc.name || '').toLowerCase();
                                    if (key)
                                        nameToMeta.set(key, {
                                            position: mc.position,
                                            width: mc.width,
                                        });
                                }

                                const toAdd: Column[] = [];
                                for (const s of synthesized) {
                                    const sName = (
                                        s.property?.name ||
                                        (s as unknown as { name?: string }).name ||
                                        ''
                                    )
                                        .toString()
                                        .toLowerCase();
                                    if (!existingNames.has(sName)) {
                                        const meta = nameToMeta.get(sName);
                                        toAdd.push({
                                            ...s,
                                            position:
                                                typeof meta?.position === 'number'
                                                    ? meta?.position
                                                    : s.position,
                                            width:
                                                typeof meta?.width === 'number'
                                                    ? meta?.width
                                                    : s.width,
                                        });
                                    }
                                }

                                if (
                                    blockColumns.length === 0 ||
                                    hasVirtualPlaceholders ||
                                    toAdd.length > 0
                                ) {
                                    blockColumns = [...blockColumns, ...toAdd].sort(
                                        (a, b) => (a.position ?? 0) - (b.position ?? 0),
                                    );

                                    if (
                                        blockColumns.length === 0 ||
                                        hasVirtualPlaceholders
                                    ) {
                                        // Queue a non-blocking metadata persist so virtuals are durable
                                        const persistColumns =
                                            toAdd.length > 0 ? toAdd : synthesized;
                                        synthesizedForPersist.push({
                                            blockId: block.id,
                                            columns: persistColumns,
                                        });
                                    }
                                }
                            }
                        } catch {
                            // no-op on fallback creation errors
                        }

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

                // Persist synthesized virtual columns into block metadata (best-effort, non-blocking)
                if (synthesizedForPersist.length > 0) {
                    (async () => {
                        try {
                            for (const entry of synthesizedForPersist) {
                                const { blockId, columns } = entry;
                                // Read existing content
                                const { data: blk, error: readErr } = await client
                                    .from('blocks')
                                    .select('content')
                                    .eq('id', blockId)
                                    .single();
                                if (readErr) continue;

                                const content: unknown = blk?.content ?? {};
                                const isObj =
                                    typeof content === 'object' && content !== null;
                                const current = (isObj ? content : {}) as {
                                    columns?: unknown[];
                                    requirements?: unknown[];
                                    rows?: unknown[];
                                    tableKind?: string;
                                };

                                const columnMetadata = columns.map((c, idx) => ({
                                    columnId: c.id,
                                    position:
                                        typeof c.position === 'number' ? c.position : idx,
                                    width: c.width ?? 200,
                                    // include name for legacy readers
                                    name: (c.property?.name ||
                                        (c as unknown as { name?: string }).name ||
                                        '') as string,
                                }));

                                const updated = {
                                    ...current,
                                    tableKind: current.tableKind ?? 'requirements',
                                    columns: columnMetadata,
                                } as Record<string, unknown>;

                                await client
                                    .from('blocks')
                                    .update({
                                        content:
                                            updated as unknown as Database['public']['Tables']['blocks']['Row']['content'],
                                    })
                                    .eq('id', blockId);
                            }
                        } catch {
                            // best-effort only
                        }
                    })();
                }
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
                    // schedule background hydration if a requirements table was inserted
                    if (payload.eventType === 'INSERT') {
                        scheduleHydrationOnInsert(payload as unknown as { new: unknown });
                    }
                    setBlocks((prevBlocks) => {
                        if (!prevBlocks) return prevBlocks;

                        if (payload.eventType === 'INSERT') {
                            // Avoid duplicates when we already optimistically added the block
                            const exists = prevBlocks.some(
                                (b) => b.id === (payload.new as Block).id,
                            );
                            if (exists) return prevBlocks;

                            // For requirement tables, synthesize virtual natural columns immediately
                            let synthesizedColumns: Column[] = [];
                            try {
                                const contentAny = (
                                    payload.new as unknown as {
                                        content?: { tableKind?: string };
                                    }
                                )?.content;
                                const tableKind = contentAny?.tableKind;
                                if (
                                    (payload.new as Block).type === 'table' &&
                                    tableKind === 'requirements'
                                ) {
                                    const cachedOrgId = getCachedDocumentOrg(documentId);
                                    const cachedProps =
                                        getCachedOrgProperties(cachedOrgId);
                                    synthesizedColumns = synthesizeNaturalColumns(
                                        (payload.new as Block).id,
                                        cachedProps,
                                    );
                                }
                            } catch {
                                // no-op
                            }

                            return [
                                ...prevBlocks,
                                {
                                    ...(payload.new as Block),
                                    order: payload.new.position,
                                    requirements: [],
                                    columns: synthesizedColumns,
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

        // Background hydrator: when a new requirements table is inserted, refresh org props and hydrate options
        const _maybeHydrateInsertedBlock = async (blockId: string) => {
            try {
                const cachedOrgId = getCachedDocumentOrg(documentId);
                let orgId = cachedOrgId ?? null;
                if (!orgId) {
                    const resp = await fetch(`/api/documents/${documentId}`, {
                        method: 'GET',
                        cache: 'no-store',
                    });
                    if (resp.ok) {
                        const payload = (await resp.json()) as {
                            organizationId?: string | null;
                        };
                        orgId = payload.organizationId ?? null;
                        setCachedDocumentOrg(documentId, orgId);
                    }
                }

                if (!orgId) return;

                let props = getCachedOrgProperties(orgId);
                if (props.length === 0) {
                    const resProps = await fetch(
                        `/api/organizations/${orgId}/properties`,
                        { method: 'GET', cache: 'no-store' },
                    );
                    if (resProps.ok) {
                        const payload = (await resProps.json()) as {
                            properties?: Property[];
                        };
                        props = payload.properties || [];
                        setCachedOrgProperties(orgId, props);
                    }
                }

                if (props.length === 0) return;

                setBlocks((prev) => {
                    if (!prev) return prev;
                    return prev.map((b) => {
                        if (b.id !== blockId) return b;
                        const nextCols = (b.columns || []).map((c) => {
                            const nameLc = (c.property?.name || '').toLowerCase();
                            if (nameLc === 'status' || nameLc === 'priority') {
                                const matching = props.find(
                                    (p) => p.name.toLowerCase() === nameLc,
                                );
                                if (matching) {
                                    return {
                                        ...c,
                                        property: {
                                            ...(c.property || ({} as Property)),
                                            name: matching.name,
                                            property_type: matching.property_type,
                                            options: matching.options,
                                        },
                                    } as Column;
                                }
                            }
                            return c;
                        });
                        return { ...b, columns: nextCols };
                    });
                });
            } catch {
                // no-op
            }
        };

        // Schedule hydration on block INSERT events
        const scheduleHydrationOnInsert = (payload: { new: unknown }) => {
            try {
                const newBlock = payload.new as Block;
                const contentAny = (
                    newBlock as unknown as { content?: { tableKind?: string } }
                )?.content;
                const tableKind = contentAny?.tableKind;
                if (newBlock.type === 'table' && tableKind === 'requirements') {
                    setTimeout(() => _maybeHydrateInsertedBlock(newBlock.id), 200);
                    // Also persist initial virtual columns metadata best-effort
                    setTimeout(async () => {
                        try {
                            const cachedOrgId = getCachedDocumentOrg(documentId);
                            const props = getCachedOrgProperties(cachedOrgId);
                            const virtual = synthesizeNaturalColumns(newBlock.id, props);
                            // Read and update block content
                            const { data: blk } = await client
                                .from('blocks')
                                .select('content')
                                .eq('id', newBlock.id)
                                .single();
                            const content: unknown = blk?.content ?? {};
                            const isObj = typeof content === 'object' && content !== null;
                            const current = (isObj ? content : {}) as {
                                columns?: unknown[];
                                requirements?: unknown[];
                                rows?: unknown[];
                                tableKind?: string;
                            };
                            const columnMetadata = virtual.map((c, idx) => ({
                                columnId: c.id,
                                position:
                                    typeof c.position === 'number' ? c.position : idx,
                                width: c.width ?? 200,
                                name: (c.property?.name ||
                                    (c as unknown as { name?: string }).name ||
                                    '') as string,
                            }));
                            const updated = {
                                ...current,
                                tableKind: current.tableKind ?? 'requirements',
                                columns: columnMetadata,
                            } as Record<string, unknown>;
                            await client
                                .from('blocks')
                                .update({
                                    content:
                                        updated as unknown as Database['public']['Tables']['blocks']['Row']['content'],
                                })
                                .eq('id', newBlock.id);
                        } catch {
                            // best-effort only
                        }
                    }, 250);
                }
            } catch {
                // no-op
            }
        };

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
