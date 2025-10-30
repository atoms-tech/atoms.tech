import { Column, Property } from '@/components/custom/BlockCanvas/types';
import { Database } from '@/types/base/database.types';

import { synthesizeNaturalColumns } from './naturalFields';

type BlockRow = Database['public']['Tables']['blocks']['Row'];

export type MetadataColumn = {
    name?: string;
    columnId?: string;
    position?: number;
    width?: number;
};

export const getMetadataColumnsFromBlock = (block: BlockRow): MetadataColumn[] => {
    const content = block?.content as unknown;
    const isObj = typeof content === 'object' && content !== null;
    const cols =
        isObj && Array.isArray((content as { columns?: unknown[] })?.columns)
            ? ((content as { columns?: unknown[] })?.columns as MetadataColumn[])
            : [];
    return cols;
};

export const hasVirtualNativePlaceholders = (
    metadataColumns: MetadataColumn[],
): boolean => {
    return metadataColumns.some(
        (mc) =>
            (mc.columnId || '').startsWith('virtual-') ||
            ['external_id', 'name', 'description', 'status', 'priority'].includes(
                (mc.name || '').toLowerCase(),
            ),
    );
};

export const mergeNaturalColumnsFromPlaceholders = (
    block: BlockRow,
    existingColumns: Column[] | undefined,
    orgProperties: Property[],
) => {
    const metadataColumns = getMetadataColumnsFromBlock(block);
    const shouldMerge = hasVirtualNativePlaceholders(metadataColumns);
    if (!shouldMerge) {
        return { mergedColumns: existingColumns || [], persistColumns: [] as Column[] };
    }

    const synthesized: Column[] = synthesizeNaturalColumns(block.id, orgProperties);
    const blockColumns = existingColumns || [];

    const existingNames = new Set(
        blockColumns.map((c) =>
            (
                (c.property?.name ||
                    (c as unknown as { name?: string }).name ||
                    '') as string
            ).toLowerCase(),
        ),
    );

    const nameToMeta = new Map<string, { position?: number; width?: number }>();
    for (const mc of metadataColumns) {
        const key = (mc.name || '').toLowerCase();
        if (key) nameToMeta.set(key, { position: mc.position, width: mc.width });
    }

    const toAdd: Column[] = [];
    for (const s of synthesized) {
        const sName = (s.property?.name || (s as unknown as { name?: string }).name || '')
            .toString()
            .toLowerCase();
        if (!existingNames.has(sName)) {
            const meta = nameToMeta.get(sName);
            toAdd.push({
                ...s,
                position:
                    typeof meta?.position === 'number' ? meta?.position : s.position,
                width: typeof meta?.width === 'number' ? meta?.width : s.width,
            });
        }
    }

    const mergedColumns = [...blockColumns, ...toAdd].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );

    // If we added anything, suggest persisting those new virtuals to metadata
    const persistColumns = toAdd;
    return { mergedColumns, persistColumns };
};

export const buildColumnMetadataPayload = (columns: Column[]) =>
    columns.map((c, idx) => ({
        columnId: c.id,
        position: typeof c.position === 'number' ? c.position : idx,
        width: c.width ?? 200,
        name: (c.property?.name ||
            (c as unknown as { name?: string }).name ||
            '') as string,
    }));
