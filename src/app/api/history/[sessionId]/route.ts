/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Chat Session Detail API Route
 * 
 * Gets detailed chat session with messages
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/database';
import { logger } from '@/lib/utils/logger';

export async function GET(
    request: Request,
    context: { params: { sessionId: string } },
) {
    const { params } = context;

    try {
        // Get authenticated user
        const supabase = await createServerClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            logger.warn('Unauthorized chat session request', { authError });
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { data: session, error: sessionError } = await supabase
            .from('chat_sessions' as any)
            .select('*')
            .eq('id', params.sessionId)
            .maybeSingle();

        if (sessionError) {
            logger.error('Failed to fetch chat session metadata', sessionError, {
                route: '/api/history/[sessionId]',
                sessionId: params.sessionId,
            });
            return NextResponse.json(
                {
                    error: 'Failed to fetch chat session',
                    details: sessionError.message,
                },
                { status: 500 },
            );
        }

        if (!session || (session as any).user_id !== user.id) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const { data: messageRows, error: messageError } = await supabase
            .from('chat_messages' as any)
            .select('id, role, content, metadata, tokens, created_at, parent_id, variant_index, is_active')
            .eq('session_id', params.sessionId)
            .order('created_at', { ascending: true })
            .order('variant_index', { ascending: true, nullsFirst: true });

        if (messageError) {
            logger.error('Failed to load chat messages', messageError, {
                route: '/api/history/[sessionId]',
                sessionId: params.sessionId,
            });
            return NextResponse.json(
                {
                    error: 'Failed to fetch chat session',
                    details: messageError.message,
                },
                { status: 500 },
            );
        }

        const assistantMap = new Map<string, any>();
        const orderedMessages: any[] = [];

        const pushAssistantVariant = (row: any) => {
            const parentKey = row.parent_id ?? row.id;
            let entry = assistantMap.get(parentKey);

            if (!entry) {
                entry = {
                    id: parentKey,
                    role: 'assistant',
                    content: row.content,
                    metadata: row.metadata,
                    created_at: row.created_at,
                    tokens: row.tokens,
                    variants: [] as any[],
                    activeVariantIndex: row.is_active ? row.variant_index ?? 0 : 0,
                };
                assistantMap.set(parentKey, entry);
                orderedMessages.push(entry);
            }

            entry.variants.push({
                id: row.id,
                parent_id: parentKey,
                content: row.content,
                metadata: row.metadata,
                tokens: (row as any).tokens,
                created_at: (row as any).created_at,
                variant_index: row.variant_index ?? 0,
                is_active: row.is_active,
            });

            if (row.is_active) {
                entry.activeVariantIndex = row.variant_index ?? 0;
                entry.content = row.content;
                entry.metadata = row.metadata;
                entry.tokens = row.tokens;
            }

            if (entry.created_at && row.created_at && new Date(row.created_at) < new Date(entry.created_at)) {
                entry.created_at = row.created_at;
            }
        };

        for (const row of messageRows ?? []) {
            if ((row as any).role === 'assistant') {
                pushAssistantVariant(row as any);
                continue;
            }

            orderedMessages.push({
                id: (row as any).id,
                role: (row as any).role,
                content: (row as any).content,
                metadata: (row as any).metadata,
                tokens: (row as any).tokens,
                created_at: (row as any).created_at,
            });
        }

        for (const entry of assistantMap.values()) {
            entry.variants.sort((a: any, b: any) => (a.variant_index ?? 0) - (b.variant_index ?? 0));
            if (entry.variants.length === 0) {
                continue;
            }

            if (entry.activeVariantIndex < 0 || entry.activeVariantIndex >= entry.variants.length) {
                entry.activeVariantIndex = 0;
            }

            const activeVariant = entry.variants[entry.activeVariantIndex] ?? entry.variants[0];
            entry.content = activeVariant?.content ?? null;
            entry.metadata = activeVariant?.metadata ?? null;
            entry.tokens = activeVariant?.tokens ?? null;
        }

        return NextResponse.json({
            session,
            messages: orderedMessages,
        });
    } catch (error) {
        logger.error('Error fetching chat session', error, {
            route: '/api/history/[sessionId]',
            sessionId: params.sessionId,
        });
        return NextResponse.json(
            {
                error: 'Failed to fetch chat session',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
