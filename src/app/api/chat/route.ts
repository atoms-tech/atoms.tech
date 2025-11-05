/**
 * Chat API Route
 *
 * Handles chat requests using AI SDK 6 Agent
 */

import { withAuth } from '@workos-inc/authkit-nextjs';
import { createAgentUIStreamResponse } from 'ai';
import { createChatAgent } from '@/lib/agents/chat.agent';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { logger } from '@/lib/utils/logger';

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
            logger.warn('Profile sync failed in chat API, continuing anyway', profileError);
            // Continue - we can use user.id as fallback
        }

        const { messages, model, metadata, systemPrompt } = await request.json();

        // Create agent with selected model and optional system prompt
        const agent = createChatAgent(model, systemPrompt);

        // Stream response with metadata for atomsAgent
        return createAgentUIStreamResponse({
            agent,
            messages,
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
