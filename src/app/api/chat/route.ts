/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Enhanced Chat API Route
 *
 * Handles chat requests using AI SDK 6 Agent with session management
 */

import { withAuth } from '@workos-inc/authkit-nextjs';
import { streamText, convertToModelMessages } from 'ai';
import { DEFAULT_AGENT_INSTRUCTIONS, mcpTools } from '@/lib/agents/chat.agent';
import { atomsChatModel, DEFAULT_MODEL } from '@/lib/providers/atomsagent.provider';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { logger } from '@/lib/utils/logger';
import { createServerClient } from '@/lib/database';
import { createHash, randomUUID } from 'crypto';

/**
 * Generate a unique session ID (UUID format)
 */
function generateSessionId(): string {
    return randomUUID();
}

/**
 * Validate if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

function normalizeUUID(value: string | null | undefined): string | null {
    if (!value) return null;
    if (isValidUUID(value)) return value;
    const hash = createHash('md5').update(String(value)).digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function normalizeMessageContent(content: unknown): string {
    if (typeof content === 'string') return content;
    if (content === null || content === undefined) return '';
    try {
        return JSON.stringify(content);
    } catch (error) {
        logger.warn('Failed to stringify message content, using fallback', { error });
        return String(content);
    }
}

/**
 * Create a new chat session in the database
 */
async function createChatSession(params: {
    userId: string;
    organizationId?: string;
    model: string;
    title?: string;
}): Promise<string> {
    const supabase = await createServerClient();
    const sessionId = generateSessionId();

    const normalizedUserId = normalizeUUID(params.userId) ?? randomUUID();
    const normalizedOrgId = normalizeUUID(params.organizationId);

    const { error } = await (supabase.from('chat_sessions' as any)).insert({
        id: sessionId,
        user_id: normalizedUserId,
        org_id: normalizedOrgId,
        model: params.model,
        title: params.title || 'New Chat',
        message_count: 0,
        tokens_in: 0,
        tokens_out: 0,
        tokens_total: 0,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    if (error) {
        logger.error('Failed to create chat session', error);
        // Return session ID anyway - we can still function without DB
        return sessionId;
    }

    return sessionId;
}

async function ensureChatSession(params: {
    sessionId: string;
    userId: string;
    organizationId?: string;
    model: string;
    title?: string;
}): Promise<void> {
    const supabase = await createServerClient();
    const normalizedUserId = normalizeUUID(params.userId) ?? params.userId;
    const normalizedOrgId = normalizeUUID(params.organizationId);

    const { data, error } = await (supabase
        .from('chat_sessions' as any))
        .select('id')
        .eq('id', params.sessionId)
        .limit(1)
        .maybeSingle();

    if (error) {
        logger.error('Failed to fetch existing chat session', error);
        return;
    }

    if (data) {
        return;
    }

    const { error: insertError } = await (supabase.from('chat_sessions' as any)).insert({
        id: params.sessionId,
        user_id: normalizedUserId,
        org_id: normalizedOrgId,
        model: params.model,
        title: params.title || 'New Chat',
        message_count: 0,
        tokens_in: 0,
        tokens_out: 0,
        tokens_total: 0,
        archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    if (insertError) {
        logger.error('Failed to ensure chat session exists', insertError);
    }
}

/**
 * Save messages to the database
 */
async function saveMessages(params: {
    sessionId: string;
    messages: Array<Record<string, any>>;
}): Promise<string | null> {
    if (!params.messages?.length) {
        return null;
    }

    const latest = params.messages[params.messages.length - 1];
    if (!latest) {
        return null;
    }

    const normalizedContent = normalizeMessageContent(latest.content);
    const trimmedContent = normalizedContent.trim();

    if (!trimmedContent && !latest.metadata) {
        return null;
    }

    const supabase = await createServerClient();
    const messageId = normalizeUUID(latest.id) ?? randomUUID();

    const { data: existing, error: fetchError } = await (supabase
        .from('chat_messages' as any))
        .select('id')
        .eq('id', messageId)
        .eq('session_id', params.sessionId)
        .maybeSingle();

    if (fetchError) {
        logger.error('Failed to look up existing chat message', fetchError, { sessionId: params.sessionId, messageId });
        return null;
    }

    if (existing) {
        return messageId;
    }

    const resolvedTokens = typeof latest.tokens === 'number'
        ? latest.tokens
        : typeof latest.tokens?.total === 'number'
            ? latest.tokens.total
            : null;

    const payload = {
        id: messageId,
        session_id: params.sessionId,
        role: latest.role,
        content: trimmedContent.length > 0 ? normalizedContent : null,
        tokens: resolvedTokens,
        metadata: latest.metadata ?? null,
        created_at: new Date().toISOString(),
        parent_id: null,
        variant_index: 0,
        is_active: true,
    };

    const { error: insertError } = await (supabase
        .from('chat_messages' as any))
        .insert(payload);

    if (insertError) {
        logger.error('Failed to persist chat message', insertError, { sessionId: params.sessionId, role: latest.role });
        return null;
    }

    await refreshSessionStats(supabase, params.sessionId);
    return messageId;
}

async function refreshSessionStats(supabase: any, sessionId: string): Promise<void> {
    try {
        const { count } = await (supabase
            .from('chat_messages' as any))
            .select('id', { head: true, count: 'exact' })
            .eq('session_id', sessionId);

        const updatePayload: Record<string, unknown> = {
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        if (typeof count === 'number') {
            updatePayload.message_count = count;
        }

        await (supabase
            .from('chat_sessions' as any))
            .update(updatePayload)
            .eq('id', sessionId);
    } catch (error) {
        logger.error('Failed to refresh chat session stats', error, { sessionId });
    }
}

async function persistAssistantVariant(params: {
    sessionId: string;
    responseMessage: Record<string, any>;
    parentMessageId?: string | null;
    requestMetadata?: Record<string, any> | null;
}): Promise<void> {
    try {
        const supabase = await createServerClient();

        const responseMessageId = normalizeUUID(params.responseMessage.id) ?? randomUUID();
        const normalizedContent = normalizeMessageContent(params.responseMessage.content);
        const trimmedContent = normalizedContent.trim();

        if (!trimmedContent) {
            logger.warn('Skipping assistant variant persistence due to empty content', {
                sessionId: params.sessionId,
                messageId: responseMessageId,
            });
            return;
        }

        let resolvedParentId = params.parentMessageId ? normalizeUUID(params.parentMessageId) : null;

        if (resolvedParentId) {
            const { data: parentRecord } = await (supabase
                .from('chat_messages' as any))
                .select('id')
                .eq('id', resolvedParentId)
                .eq('session_id', params.sessionId)
                .maybeSingle();

            if (!parentRecord) {
                resolvedParentId = null;
            }
        }

        let nextVariantIndex = 0;

        if (resolvedParentId) {
            const { data: latestVariant } = await (supabase
                .from('chat_messages' as any))
                .select('variant_index')
                .eq('session_id', params.sessionId)
                .eq('parent_id', resolvedParentId)
                .order('variant_index', { ascending: false })
                .limit(1)
                .maybeSingle();

            if ((latestVariant as any)?.variant_index !== undefined && (latestVariant as any).variant_index !== null) {
                nextVariantIndex = (latestVariant as any).variant_index + 1;
            }

            await (supabase
                .from('chat_messages' as any))
                .update({ is_active: false })
                .eq('session_id', params.sessionId)
                .eq('parent_id', resolvedParentId);
        }

        const metadataPayload: Record<string, any> | null = params.responseMessage.metadata || params.requestMetadata
            ? {
                response: params.responseMessage.metadata ?? null,
                request: params.requestMetadata ?? null,
            }
            : null;

        // Check if message already exists to avoid duplicate key errors
        const { data: existingMessage } = await (supabase
            .from('chat_messages' as any))
            .select('id')
            .eq('id', responseMessageId)
            .eq('session_id', params.sessionId)
            .maybeSingle();

        let inserted: any = existingMessage;

        if (!existingMessage) {
            // Get the next message_index for this session
            const { data: lastMessage } = await (supabase
                .from('chat_messages' as any))
                .select('message_index')
                .eq('session_id', params.sessionId)
                .order('message_index', { ascending: false })
                .limit(1)
                .maybeSingle();

            const nextMessageIndex = (lastMessage as any)?.message_index !== undefined
                ? (lastMessage as any).message_index + 1
                : 0;

            const insertPayload = {
                id: responseMessageId,
                session_id: params.sessionId,
                role: 'assistant',
                content: normalizedContent,
                metadata: metadataPayload,
                tokens_in: params.responseMessage.tokens?.input ?? params.responseMessage.tokens_in ?? 0,
                tokens_out: params.responseMessage.tokens?.output ?? params.responseMessage.tokens_out ?? 0,
                tokens_total: params.responseMessage.tokens?.total ?? params.responseMessage.tokens_total ?? 0,
                parent_id: resolvedParentId,
                variant_index: nextVariantIndex,
                is_active: true,
                message_index: nextMessageIndex,
                sequence: nextMessageIndex,
                created_at: new Date().toISOString(),
            };

            const { data: insertedData, error: insertError } = await (supabase
                .from('chat_messages' as any))
                .insert(insertPayload)
                .select('id')
                .single();

            if (insertError) {
                logger.error('Failed to persist assistant variant', insertError, {
                    sessionId: params.sessionId,
                    parentMessageId: resolvedParentId,
                });
                return;
            }

            inserted = insertedData;
        } else {
            // Message already exists, just update it
            const { error: updateError } = await (supabase
                .from('chat_messages' as any))
                .update({
                    content: normalizedContent,
                    metadata: metadataPayload,
                    tokens_in: params.responseMessage.tokens?.input ?? params.responseMessage.tokens_in ?? 0,
                    tokens_out: params.responseMessage.tokens?.output ?? params.responseMessage.tokens_out ?? 0,
                    tokens_total: params.responseMessage.tokens?.total ?? params.responseMessage.tokens_total ?? 0,
                    is_active: true,
                })
                .eq('id', responseMessageId)
                .eq('session_id', params.sessionId);

            if (updateError) {
                logger.error('Failed to update existing assistant message', updateError, {
                    sessionId: params.sessionId,
                    messageId: responseMessageId,
                });
            }
        }

        const finalParentId = resolvedParentId ?? (inserted as any)?.id ?? responseMessageId;

        if (!resolvedParentId && finalParentId) {
            await (supabase
                .from('chat_messages' as any))
                .update({ parent_id: finalParentId })
                .eq('id', (inserted as any)?.id ?? responseMessageId)
                .eq('session_id', params.sessionId);
        }

        if (resolvedParentId === null && finalParentId) {
            // Ensure the initial variant marks itself active (others already handled)
            await (supabase
                .from('chat_messages' as any))
                .update({ is_active: true, variant_index: 0 })
                .eq('id', (inserted as any)?.id ?? responseMessageId)
                .eq('session_id', params.sessionId);
        }

        await refreshSessionStats(supabase, params.sessionId);
    } catch (error) {
        logger.error('Unexpected error while persisting assistant variant', error, {
            sessionId: params.sessionId,
        });
    }
}

export async function POST(request: Request) {
    try {
        // Authenticate user with WorkOS
        let user;
        try {
            const authResult = await withAuth();
            user = authResult.user;
        } catch (authError) {
            logger.error('Auth error in chat API', authError);
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Get or create profile
        let profile;
        try {
            profile = await getOrCreateProfileForWorkOSUser(user);
        } catch (profileError) {
            logger.warn('Profile sync failed in chat API, continuing anyway', { error: profileError });
        }

        const { messages, model, metadata, systemPrompt } = await request.json();
        const requestMetadata = metadata && typeof metadata === 'object' ? metadata : {};

        // Get or create session
        let sessionId = requestMetadata?.session_id;
        if (sessionId && !isValidUUID(sessionId)) {
            const normalized = normalizeUUID(sessionId);
            if (normalized) {
                sessionId = normalized;
            } else {
                logger.warn('Invalid session ID format, creating new session', { sessionId });
                sessionId = undefined;
            }
        }
        
        if (!sessionId) {
            // Create new session - extract title from first user message
            const firstUserMessage = messages?.find((m: any) => m.role === 'user');
            let title = 'New Chat';
            
            if (firstUserMessage) {
                // Handle UI message format (can have content string or parts array)
                if (typeof firstUserMessage.content === 'string') {
                    title = firstUserMessage.content.slice(0, 50);
                } else if (Array.isArray(firstUserMessage.parts)) {
                    const textPart = firstUserMessage.parts.find((part: any) => part.type === 'text');
                    if (textPart?.text) {
                        title = textPart.text.slice(0, 50);
                    }
                }
            }

            sessionId = await createChatSession({
                userId: profile?.id || user.id,
                organizationId: requestMetadata?.organization_id,
                model: model || 'claude-sonnet-4-5@20250929',
                title,
            });

            logger.info('Created new chat session', { sessionId, userId: user.id });
        } else {
            const firstUserMessage = messages?.find((m: any) => m.role === 'user');
            let title = 'New Chat';

            if (firstUserMessage) {
                if (typeof firstUserMessage.content === 'string') {
                    title = firstUserMessage.content.slice(0, 50);
                } else if (Array.isArray(firstUserMessage.parts)) {
                    const textPart = firstUserMessage.parts.find((part: any) => part.type === 'text');
                    if (textPart?.text) {
                        title = textPart.text.slice(0, 50);
                    }
                }
            }

            await ensureChatSession({
                sessionId,
                userId: profile?.id || user.id,
                organizationId: requestMetadata?.organization_id,
                model: model || 'claude-sonnet-4-5@20250929',
                title,
            });
        }

        const formattedMessages = convertToModelMessages(messages || []);

        const chatModel = atomsChatModel((model as string) || DEFAULT_MODEL);

        const parentMessageHint = requestMetadata?.parent_message_id
            ?? requestMetadata?.parentMessageId
            ?? requestMetadata?.atomsagent?.parent_message_id
            ?? requestMetadata?.atomsagent?.parentMessageId
            ?? null;

        // Note: MCP tools are now handled by atomsAgent backend
        // The backend reads the active profile and composes MCP servers
        // We just use the built-in tools here for the UI

        const result = streamText({
            model: chatModel,
            messages: formattedMessages,
            tools: mcpTools,
            toolChoice: 'auto',
            system: systemPrompt || DEFAULT_AGENT_INSTRUCTIONS,
        });

        const response = result.toUIMessageStreamResponse();
        const headers = new Headers(response.headers);
        headers.set('X-Session-Id', sessionId);

        // Save messages asynchronously (don't wait)
        saveMessages({
            sessionId,
            messages: messages || [],
        }).catch((error) => {
            logger.error('Failed to save messages asynchronously', error);
        });

        result.response
            .then(async (modelResponse) => {
                const assistantMessage = modelResponse.messages?.find((msg: any) => msg.role === 'assistant');
                if (!assistantMessage) {
                    return;
                }

                await persistAssistantVariant({
                    sessionId,
                    responseMessage: assistantMessage,
                    parentMessageId: parentMessageHint,
                    requestMetadata,
                });
            })
            .catch((error) => {
                logger.error('Failed to persist assistant variant from stream', error, { sessionId });
            });

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    } catch (error) {
        logger.error('Chat API error', error, { route: '/api/chat' });
        return new Response(
            JSON.stringify({
                error: 'Failed to process chat request',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }
}
