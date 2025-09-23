import { useCallback, useEffect, useState } from 'react';

import {
    BaseRow,
    CellValue,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { supabase } from '@/lib/supabase/supabaseBrowser';

interface UseTableRowsOptions {
    blockId: string;
    documentId: string;
}

// Minimal builder types to avoid any
type SelectBuilder<T> = {
    select: (q: string) => SelectBuilder<T>;
    eq: (field: string, value: string) => SelectBuilder<T>;
    order: (
        col: string,
        opts: { ascending: boolean },
    ) => Promise<{ data: T[] | null; error: unknown | null }>;
};

export function useTableRows({ blockId, documentId }: UseTableRowsOptions) {
    const [rows, setRows] = useState<BaseRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const refresh = useCallback(async () => {
        if (!blockId || !documentId) return;
        setIsLoading(true);
        try {
            const qb = (
                supabase.from as unknown as (table: string) => SelectBuilder<{
                    id: string;
                    position?: number;
                    row_data?: Record<string, CellValue>;
                }>
            )('table_rows');
            const { data, error } = await qb
                .select('id, position, row_data')
                .eq('block_id', blockId)
                .eq('document_id', documentId)
                .order('position', { ascending: true });

            if (error) throw error;
            const mapped: BaseRow[] = (data || []).map((r, idx: number) => ({
                id: r.id,
                position: r.position ?? idx,
                ...(r.row_data || {}),
            }));
            setRows(mapped);
        } finally {
            setIsLoading(false);
        }
    }, [blockId, documentId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { rows, setRows, isLoading, refresh };
}
