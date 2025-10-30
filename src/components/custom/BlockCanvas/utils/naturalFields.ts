import { Column, Property, PropertyType } from '@/components/custom/BlockCanvas/types';

export const naturalFieldOrder: string[] = [
    'External_ID',
    'Name',
    'Description',
    'Status',
    'Priority',
];

export const uiNameToDbKey: Record<string, string> = {
    External_ID: 'external_id',
    Name: 'name',
    Description: 'description',
    Status: 'status',
    Priority: 'priority',
};

export function synthesizeNaturalColumns(
    blockId: string,
    orgProperties?: Property[] | null,
): Column[] {
    const propsList = Array.isArray(orgProperties) ? orgProperties : [];
    return naturalFieldOrder.map((uiName, idx) => {
        const dbKey = uiNameToDbKey[uiName] || uiName.toLowerCase();
        const matched = propsList.find((p) => p.name?.toLowerCase() === dbKey);
        const inferredType =
            dbKey === 'status' || dbKey === 'priority'
                ? PropertyType.select
                : PropertyType.text;
        const propType = matched?.property_type || inferredType;
        const propOptions = matched?.options || null;

        return {
            id: `virtual-${dbKey}`,
            block_id: blockId,
            property_id: `virtual-${dbKey}`,
            position: idx,
            width: 200,
            is_hidden: false,
            is_pinned: false,
            created_at: null,
            updated_at: null,
            default_value: null,
            property: {
                id: `virtual-${dbKey}`,
                name: uiName,
                property_type: propType,
                org_id: '',
                project_id: null,
                document_id: null,
                is_base: true,
                options: propOptions,
                scope: 'org',
                created_at: null,
                updated_at: null,
            } as unknown as Property,
        } as Column;
    });
}

export function ensureNaturalColumns(
    existing: Column[],
    blockId: string,
    orgProperties?: Property[] | null,
): Column[] {
    const byNameLc = new Map<string, Column>();
    for (const c of existing) {
        const nm =
            (c as unknown as { property?: { name?: string } })?.property?.name || '';
        const nmLc = (nm as string).toLowerCase();
        if (nmLc) byNameLc.set(nmLc, c);
    }
    const merged: Column[] = [...existing];
    for (const uiName of naturalFieldOrder) {
        const dbKey = uiNameToDbKey[uiName] || uiName.toLowerCase();
        const has = byNameLc.has(dbKey) || byNameLc.has(uiName.toLowerCase());
        if (!has) {
            merged.push(
                synthesizeNaturalColumns(blockId, orgProperties).find(
                    (c) => c.id === `virtual-${dbKey}`,
                ) as Column,
            );
        } else {
            // Enrich options for Status/Priority if missing
            const c = byNameLc.get(dbKey) || byNameLc.get(uiName.toLowerCase());
            if (
                c?.property &&
                (dbKey === 'status' || dbKey === 'priority') &&
                (!c.property.options || !('values' in (c.property.options || {})))
            ) {
                const matched = (orgProperties || []).find(
                    (p) => p.name?.toLowerCase() === dbKey,
                );
                if (matched?.options) {
                    c.property = { ...c.property, options: matched.options } as Property;
                }
            }
        }
    }
    merged.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return merged;
}
