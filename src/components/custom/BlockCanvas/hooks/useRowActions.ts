import { useCallback, useRef } from 'react';

import {
    BaseRow,
    CellValue,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';

// Supabase client access removed in favor of API routes to avoid init races

interface UseRowActionsProps {
    blockId: string;
    documentId: string;
    localRows: BaseRow[];
    setLocalRows: React.Dispatch<React.SetStateAction<BaseRow[]>>;
}

// Minimal chainable types to satisfy TS without relying on generated Database types
// Removed old Supabase builder helper types now that API routes are used

export const useRowActions = ({
    blockId,
    documentId,
    localRows,
    setLocalRows,
}: UseRowActionsProps) => {
    const deletedRowIdsRef = useRef<Set<string>>(new Set());
    const isSavingRef = useRef(false);
    const pendingOpsRef = useRef<Array<() => Promise<void>>>([]);
    // No direct Supabase dependency here; use API routes with server-side membership checks

    const refreshRows = useCallback(async () => {
        console.log('[GenericRows] 🎯 refreshRows called', { blockId, documentId });
        try {
            // Use API route to avoid auth race conditions
            const res = await fetch(
                `/api/documents/${documentId}/rows?blockId=${blockId}`,
                { method: 'GET', cache: 'no-store' },
            );
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Rows API error: ${res.status} ${text}`);
            }
            const payload = (await res.json()) as {
                rows:
                    | {
                          id: string;
                          position?: number;
                          row_data?: Record<string, unknown>;
                      }[]
                    | null;
            };
            const list = Array.isArray(payload.rows) ? payload.rows : [];
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
    }, [blockId, documentId, setLocalRows]);

    const getDynamicRows = (): BaseRow[] => {
        return (localRows || [])
            .filter((r) => !deletedRowIdsRef.current.has(r.id))
            .map((r) => ({ ...r }));
    };

    const getLastPosition = useCallback(async (): Promise<number> => {
        console.log('[GenericRows] 🎯 getLastPosition called');
        try {
            const res = await fetch(
                `/api/documents/${documentId}/rows?blockId=${blockId}`,
                { method: 'GET', cache: 'no-store' },
            );
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Rows API error: ${res.status} ${text}`);
            }
            const payload = (await res.json()) as {
                rows: { position?: number }[] | null;
            };
            const list = Array.isArray(payload.rows) ? payload.rows : [];
            const maxPos = list.reduce((max, r) => {
                const p = typeof r.position === 'number' ? r.position : -1;
                return p > max ? p : max;
            }, -1);
            return (maxPos >= 0 ? maxPos : -1) + 1;
        } catch (e) {
            console.error('[useRowActions] Failed to get last position', e);
            return 0;
        }
    }, [blockId, documentId]);

    const saveRow = useCallback(
        async (row: BaseRow, isNew: boolean) => {
            console.log('[GenericRows] 🎯 saveRow called', { isNew, row });
            try {
                // Create via API to avoid client init issues
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
                    const res = await fetch(`/api/documents/${documentId}/rows`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id,
                            blockId,
                            position: pos,
                            rowData: rest as Record<string, CellValue>,
                        }),
                    });
                    if (!res.ok) {
                        const text = await res.text();
                        throw new Error(`Rows API insert error: ${res.status} ${text}`);
                    }
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
                    const res = await fetch(`/api/documents/${documentId}/rows`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id,
                            position: position ?? undefined,
                            rowData: rest as Record<string, CellValue>,
                        }),
                    });
                    if (!res.ok) {
                        const text = await res.text();
                        throw new Error(`Rows API update error: ${res.status} ${text}`);
                    }
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
        [blockId, documentId, getLastPosition, setLocalRows],
    );

    const deleteRow = useCallback(
        async (row: BaseRow) => {
            try {
                deletedRowIdsRef.current.add(row.id);
                const res = await fetch(`/api/documents/${documentId}/rows`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: row.id }),
                });
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`Rows API delete error: ${res.status} ${text}`);
                }
                setLocalRows((prev) => prev.filter((r) => r.id !== row.id));
            } catch (e) {
                deletedRowIdsRef.current.delete(row.id);
                console.error('[useRowActions] Failed to delete row', e);
                throw e;
            }
        },
        [documentId, setLocalRows],
    );

    return {
        getDynamicRows,
        saveRow,
        deleteRow,
        refreshRows,
    };
};
