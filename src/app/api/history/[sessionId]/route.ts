/**
 * Chat Session Detail API Route
 * 
 * Gets detailed chat session with messages
 */

import { NextResponse } from 'next/server';
import { agentAPIService } from '@/lib/services/agentapi.service';
import { createClient } from '@/lib/utils/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function GET(
    request: Request,
    context: { params: { sessionId: string } },
) {
    const { params } = context;

    try {
        // Get authenticated user
        const supabase = await createClient();
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

        // Fetch session detail
        try {
            const data = await agentAPIService.getChatSession(params.sessionId, user.id);
            return NextResponse.json(data);
        } catch (serviceError) {
            logger.error('AgentAPI service error', serviceError, {
                route: '/api/history/[sessionId]',
                sessionId: params.sessionId,
                userId: user.id,
            });
            
            return NextResponse.json(
                {
                    error: 'Failed to fetch chat session',
                    details: serviceError instanceof Error ? serviceError.message : 'Unknown error',
                },
                { status: 500 },
            );
        }
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
