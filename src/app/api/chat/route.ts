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
import { createClient } from '@/lib/utils/supabase/server';
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
    const supabase = await createClient();
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
    const supabase = await createClient();
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
    messages: Array<{ role: string; content: unknown }>;
}): Promise<void> {
    const supabase = await createClient();

    const messageRecords = params.messages
        .map((msg, index) => ({
            session_id: params.sessionId,
            role: msg.role,
            content: normalizeMessageContent(msg.content),
            message_index: index,
            created_at: new Date().toISOString(),
        }))
        // Filter out messages with empty content (e.g., tool calls without content)
        .filter(msg => msg.content && msg.content.trim().length > 0);

    // Only insert if we have messages with content
    if (messageRecords.length > 0) {
        const { error } = await (supabase.from('chat_messages' as any)).insert(messageRecords);

        if (error) {
            logger.error('Failed to save messages', error);
            // Don't throw - chat can continue without persistence
        }
    }

    // Update session metadata
    await (supabase
        .from('chat_sessions' as any))
        .update({
            message_count: params.messages.length,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', params.sessionId);
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

        // Get or create session
    let sessionId = metadata?.session_id;
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
                organizationId: metadata?.organization_id,
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
                organizationId: metadata?.organization_id,
                model: model || 'claude-sonnet-4-5@20250929',
                title,
            });
        }

        const formattedMessages = convertToModelMessages(messages || []);

        const chatModel = atomsChatModel((model as string) || DEFAULT_MODEL);

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
            messages: [
                ...messages,
                // Note: We don't have the assistant response yet
                // This will be saved on the next request or via a separate endpoint
            ],
        }).catch((error) => {
            logger.error('Failed to save messages asynchronously', error);
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
