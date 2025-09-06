import type {
    RealtimeChannel,
    RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import type { Tables } from '@/types/base/database.types';

export type Block = Tables<'blocks'>;
export type Requirement = Tables<'requirements'>;
export type Column = Tables<'columns'>;

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export function createRealtimeDomain(supabase: SupabaseAny) {
    return {
        subscribeBlocks(
            documentId: string,
            handlers: {
                onInsert?: (b: Block) => void;
                onUpdate?: (b: Block) => void;
                onDelete?: (oldId: string) => void;
            },
        ) {
            const channelFactory = (
                supabase as unknown as { channel: (name: string) => RealtimeChannel }
            ).channel;
            const channel = channelFactory(`blocks:${documentId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'blocks',
                        filter: `document_id=eq.${documentId}`,
                    },
                    (payload: unknown) => {
                        const p = payload as RealtimePostgresChangesPayload<Block>;
                        handlers.onInsert?.(p.new as Block);
                    },
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'blocks',
                        filter: `document_id=eq.${documentId}`,
                    },
                    (payload: unknown) => {
                        const p = payload as RealtimePostgresChangesPayload<Block>;
                        handlers.onUpdate?.(p.new as Block);
                    },
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'blocks',
                        filter: `document_id=eq.${documentId}`,
                    },
                    (payload: unknown) => {
                        const p = payload as RealtimePostgresChangesPayload<Block>;
                        handlers.onDelete?.((p.old as unknown as { id: string }).id);
                    },
                );
            return {
                channel: channel as RealtimeChannel,
                subscribe: () => channel.subscribe(),
                unsubscribe: () => channel.unsubscribe(),
            };
        },

        subscribeRequirements(
            documentId: string,
            handlers: {
                onInsert?: (r: Requirement) => void;
                onUpdate?: (r: Requirement) => void;
                onDelete?: (old: Requirement) => void;
            },
        ) {
            const channelFactory = (
                supabase as unknown as { channel: (name: string) => RealtimeChannel }
            ).channel;
            const channel = channelFactory(`requirements:${documentId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'requirements',
                        filter: `document_id=eq.${documentId}`,
                    },
                    (payload: unknown) => {
                        const p = payload as RealtimePostgresChangesPayload<Requirement>;
                        handlers.onInsert?.(p.new as Requirement);
                    },
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'requirements',
                        filter: `document_id=eq.${documentId}`,
                    },
                    (payload: unknown) => {
                        const p = payload as RealtimePostgresChangesPayload<Requirement>;
                        handlers.onUpdate?.(p.new as Requirement);
                    },
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'requirements',
                        filter: `document_id=eq.${documentId}`,
                    },
                    (payload: unknown) => {
                        const p = payload as RealtimePostgresChangesPayload<Requirement>;
                        handlers.onDelete?.(p.old as Requirement);
                    },
                );
            return {
                channel: channel as RealtimeChannel,
                subscribe: () => channel.subscribe(),
                unsubscribe: () => channel.unsubscribe(),
            };
        },

        subscribeColumns(documentId: string, onAnyChange: () => void) {
            const channelFactory = (
                supabase as unknown as { channel: (name: string) => RealtimeChannel }
            ).channel;
            const channel = channelFactory(`columns:${documentId}`).on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'columns',
                },
                () => onAnyChange(),
            );
            return {
                channel: channel as RealtimeChannel,
                subscribe: () => channel.subscribe(),
                unsubscribe: () => channel.unsubscribe(),
            };
        },
    };
}

export type RealtimeDomain = ReturnType<typeof createRealtimeDomain>;
