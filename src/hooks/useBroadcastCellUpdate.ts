import { useCallback, useEffect, useRef } from 'react';

import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';

interface BroadcastCellUpdateOptions {
    documentId: string;
    userId?: string;
    enabled?: boolean;
}

/**
 * Hook for broadcasting real-time cell updates to other users
 * without waiting for DB save (Google Sheets-style collaboration)
 */
export const useBroadcastCellUpdate = ({
    documentId,
    userId,
    enabled = true,
}: BroadcastCellUpdateOptions) => {
    const { supabase } = useAuthenticatedSupabase();
    const channelRef = useRef<ReturnType<
        ReturnType<typeof supabase>['channel']
    > | null>(null);
    const presenceChannelRef = useRef<ReturnType<
        ReturnType<typeof supabase>['channel']
    > | null>(null);

    // Initialize broadcast channel
    useEffect(() => {
        if (!supabase || !documentId || !enabled) return;

        const channel = supabase.channel(`document:${documentId}:broadcasts`).subscribe();

        channelRef.current = channel;

        return () => {
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [supabase, documentId, enabled]);

    // Initialize presence channel for cursor tracking
    useEffect(() => {
        if (!supabase || !documentId || !enabled) return;

        const presenceChannel = supabase
            .channel(`document:${documentId}:presence`)
            .subscribe();

        presenceChannelRef.current = presenceChannel;

        return () => {
            presenceChannel.unsubscribe();
            presenceChannelRef.current = null;
        };
    }, [supabase, documentId, enabled]);

    /**
     * Broadcast cell update to other users immediately (before DB save)
     */
    const broadcastCellUpdate = useCallback(
        async (params: {
            blockId: string;
            rowId: string;
            columnId: string;
            value: unknown;
        }) => {
            if (!channelRef.current || !userId) {
                console.debug('[useBroadcastCellUpdate] Channel or userId not ready');
                return;
            }

            try {
                await channelRef.current.send({
                    type: 'broadcast',
                    event: 'cell_update',
                    payload: {
                        blockId: params.blockId,
                        rowId: params.rowId,
                        columnId: params.columnId,
                        value: params.value,
                        userId,
                        timestamp: Date.now(),
                    },
                });
                console.debug('[useBroadcastCellUpdate] Broadcasted cell update', params);
            } catch (error) {
                console.error('[useBroadcastCellUpdate] Failed to broadcast:', error);
            }
        },
        [userId],
    );

    /**
     * Broadcast cursor movement to show which cell user is editing
     */
    const broadcastCursorMove = useCallback(
        async (params: { blockId: string; rowId?: string; columnId?: string }) => {
            if (!presenceChannelRef.current || !userId) {
                console.debug('[useBroadcastCellUpdate] Presence channel or userId not ready');
                return;
            }

            try {
                await presenceChannelRef.current.send({
                    type: 'broadcast',
                    event: 'cursor_move',
                    payload: {
                        userId,
                        blockId: params.blockId,
                        rowId: params.rowId,
                        columnId: params.columnId,
                        timestamp: Date.now(),
                    },
                });
                console.debug('[useBroadcastCellUpdate] Broadcasted cursor move', params);
            } catch (error) {
                console.error('[useBroadcastCellUpdate] Failed to broadcast cursor:', error);
            }
        },
        [userId],
    );

    return {
        broadcastCellUpdate,
        broadcastCursorMove,
    };
};
