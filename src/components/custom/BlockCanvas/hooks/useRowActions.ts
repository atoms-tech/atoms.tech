import { useCallback, useRef } from 'react';

import {
    BaseRow,
    CellValue,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';

interface UseRowActionsProps {
    blockId: string;
    documentId: string;
    localRows: BaseRow[];
    setLocalRows: React.Dispatch<React.SetStateAction<BaseRow[]>>;
}

// Minimal chainable types to satisfy TS without relying on generated Database types
type SelectBuilder<T> = {
    select: (q: string) => SelectBuilder<T>;
    eq: (field: string, value: string) => SelectBuilder<T>;
    order: (col: string, opts: { ascending: boolean }) => SelectBuilder<T>;
    limit: (n: number) => Promise<{ data: T[] | null; error: unknown | null }>; // terminal form
};

type SelectBuilderFinal<T> = {
    select: (q: string) => SelectBuilderFinal<T>;
    eq: (field: string, value: string) => SelectBuilderFinal<T>;
    order: (col: string, opts: { ascending: boolean }) => SelectBuilderFinal<T>;
    limit: (n: number) => SelectBuilderFinal<T>;
    then?: unknown; // avoid Promise confusion
};

type InsertBuilder = {
    insert: (payload: Record<string, unknown>) => {
        select: () => { single: () => Promise<{ error: unknown | null }> };
    };
};

type UpdateBuilder = {
    update: (payload: Record<string, unknown>) => {
        eq: (
            field: string,
            value: string,
        ) => {
            select: () => { single: () => Promise<{ error: unknown | null }> };
        };
    };
};

type DeleteBuilder = {
    delete: () => {
        eq: (field: string, value: string) => Promise<{ error: unknown | null }>;
    };
};

export const useRowActions = ({
    blockId,
    documentId,
    localRows,
    setLocalRows,
}: UseRowActionsProps) => {
    const deletedRowIdsRef = useRef<Set<string>>(new Set());
    const isSavingRef = useRef(false);
    const pendingOpsRef = useRef<Array<() => Promise<void>>>([]);
    const { getClientOrThrow } = useAuthenticatedSupabase();

    const refreshRows = useCallback(async () => {
        console.log('[GenericRows] 🎯 refreshRows called', { blockId, documentId });
        try {
            const supabase = getClientOrThrow();
            const qb = (
                supabase.from as unknown as (table: string) => SelectBuilderFinal<{
                    id: string;
                    position?: number;
                    row_data?: Record<string, unknown>;
                }>
            )('table_rows');
            const { data, error } = (await qb
                .select('*')
                .eq('block_id', blockId)
                .eq('document_id', documentId)
                .order('position', { ascending: true })) as unknown as {
                data:
                    | {
                          id: string;
                          position?: number;
                          row_data?: Record<string, unknown>;
                      }[]
                    | null;
                error: unknown | null;
            };
            if (error) throw error;

            const list = Array.isArray(data) ? data : [];
            const mapped: BaseRow[] = list.map((r, idx: number) => ({
                id: r.id,
                position: r.position ?? idx,
                ...(r.row_data || {}),
            }));
            setLocalRows(mapped);
            console.log('[GenericRows] ✅ refreshRows completed', {
                count: mapped.length,
            });
        } catch (e) {
            console.error('[useRowActions] Failed to refresh rows', e);
        }
    }, [blockId, documentId, getClientOrThrow, setLocalRows]);

    const getDynamicRows = (): BaseRow[] => {
        return (localRows || [])
            .filter((r) => !deletedRowIdsRef.current.has(r.id))
            .map((r) => ({ ...r }));
    };

    const getLastPosition = useCallback(async (): Promise<number> => {
        console.log('[GenericRows] 🎯 getLastPosition called');
        try {
            const supabase = getClientOrThrow();
            const qb = (
                supabase.from as unknown as (
                    table: string,
                ) => SelectBuilder<{ position: number }>
            )('table_rows');
            const { data, error } = await qb
                .select('position')
                .eq('block_id', blockId)
                .eq('document_id', documentId)
                .order('position', { ascending: false })
                .limit(1);
            if (error) throw error;
            if (!data || data.length === 0) return 0;
            return (data[0].position || 0) + 1;
        } catch (e) {
            console.error('[useRowActions] Failed to get last position', e);
            return 0;
        }
    }, [blockId, documentId, getClientOrThrow]);

    const saveRow = useCallback(
        async (row: BaseRow, isNew: boolean) => {
            console.log('[GenericRows] 🎯 saveRow called', { isNew, row });
            try {
                const supabase = getClientOrThrow();
                // If another save is in progress, enqueue this operation to run after
                if (isSavingRef.current) {
                    pendingOpsRef.current.push(async () => saveRow(row, isNew));
                    return;
                }
                isSavingRef.current = true;
                const { id, position, height: _height, ...rest } = row;
                if (isNew) {
                    const pos = position ?? (await getLastPosition());
                    console.log('[GenericRows] 🎯 inserting new row', {
                        id,
                        pos,
                        row_data: rest,
                    });
                    const insertPayload = {
                        id,
                        block_id: blockId,
                        document_id: documentId,
                        position: pos,
                        row_data: rest as Record<string, CellValue>,
                    };
                    const ins = (
                        supabase.from as unknown as (table: string) => InsertBuilder
                    )('table_rows');
                    const { error } = await ins.insert(insertPayload).select().single();
                    if (error) throw error;
                    setLocalRows((prev) => [...prev, { ...row, position: pos }]);
                    console.log(
                        '[GenericRows] ✅ new row inserted and local state updated',
                    );
                } else {
                    console.log('[GenericRows] 🎯 updating existing row', {
                        id,
                        position,
                        rest,
                    });
                    const updatePayload = {
                        position: position ?? undefined,
                        row_data: rest as Record<string, CellValue>,
                    };
                    const upd = (
                        supabase.from as unknown as (table: string) => UpdateBuilder
                    )('table_rows');
                    const { error } = await upd
                        .update(updatePayload)
                        .eq('id', id)
                        .select()
                        .single();
                    if (error) throw error;
                    setLocalRows((prev) =>
                        prev.map((r) => (r.id === id ? { ...r, ...row } : r)),
                    );
                    console.log('[GenericRows] ✅ row updated and local state merged');
                }
            } catch (e) {
                console.error('[useRowActions] Failed to save row', e);
                throw e;
            } finally {
                isSavingRef.current = false;
                // Drain any queued operations sequentially
                const next = pendingOpsRef.current.shift();
                if (next) {
                    try {
                        await next();
                    } catch (err) {
                        console.error('[GenericRows] Queued op failed:', err);
                    }
                }
            }
        },
        [blockId, documentId, getClientOrThrow, getLastPosition, setLocalRows],
    );

    const deleteRow = useCallback(
        async (row: BaseRow) => {
            try {
                deletedRowIdsRef.current.add(row.id);
                const supabase = getClientOrThrow();
                const del = (
                    supabase.from as unknown as (table: string) => DeleteBuilder
                )('table_rows');
                const { error } = await del.delete().eq('id', row.id);
                if (error) throw error;
                setLocalRows((prev) => prev.filter((r) => r.id !== row.id));
            } catch (e) {
                deletedRowIdsRef.current.delete(row.id);
                console.error('[useRowActions] Failed to delete row', e);
                throw e;
            }
        },
        [getClientOrThrow, setLocalRows],
    );

    return {
        getDynamicRows,
        saveRow,
        deleteRow,
        refreshRows,
    };
};
