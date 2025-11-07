/**
 * Chat Session Detail API Route
 * 
 * Gets detailed chat session with messages
 */

import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';
import { agentAPIService } from '@/lib/services/agentapi.service';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { logger } from '@/lib/utils/logger';

export async function GET(
    request: Request,
    context: { params: { sessionId: string } },
) {
    const { params } = context;
    const sessionId = params.sessionId;

    try {
        // Authenticate user with WorkOS
        let user;
        try {
            const authResult = await withAuth();
            user = authResult.user;
        } catch (authError) {
            logger.error('Auth error in session detail API', authError, {
                route: '/api/history/[sessionId]',
                sessionId,
            });
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (\!user) {
            logger.warn('Unauthorized chat session request', {
                route: '/api/history/[sessionId]',
                sessionId,
            });
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get or create profile
        let profile;
        try {
            profile = await getOrCreateProfileForWorkOSUser(user);
        } catch (profileError) {
            logger.error('Profile sync failed in session detail API', profileError, {
                route: '/api/history/[sessionId]',
                sessionId,
            });
            return NextResponse.json(
                { error: 'Profile sync failed' },
                { status: 500 }
            );
        }

        if (\!profile) {
            logger.warn('Profile not found for user', {
                route: '/api/history/[sessionId]',
                sessionId,
                userId: user.id,
            });
            return NextResponse.json(
                { error: 'Profile not found' },
                { status: 404 }
            );
        }

        // Fetch chat session detail from agentapi
        try {
            const data = await agentAPIService.getChatSession(sessionId, profile.id);
            
            // Transform the response to match the expected format
            // The agentapi returns { session, messages }
            // We need to ensure messages have the right structure
            return NextResponse.json({
                session: data.session,
                messages: data.messages,
            });
        } catch (serviceError) {
            logger.error('AgentAPI service error', serviceError, {
                route: '/api/history/[sessionId]',
                sessionId,
                userId: profile.id,
            });

            // Check if it's a 404 (session not found)
            if (serviceError instanceof Error && serviceError.message.includes('404')) {
                return NextResponse.json(
                    { error: 'Session not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                {
                    error: 'Failed to fetch chat session',
                    details: serviceError instanceof Error ? serviceError.message : 'Unknown error',
                },
                { status: 500 }
            );
        }
    } catch (error) {
        logger.error('Error fetching chat session', error, {
            route: '/api/history/[sessionId]',
            sessionId,
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
