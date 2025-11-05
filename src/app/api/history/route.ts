/**
 * Chat History API Route
 *
 * Lists chat sessions for the authenticated user
 */

import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';
import { agentAPIService } from '@/lib/services/agentapi.service';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { logger } from '@/lib/utils/logger';

export async function GET(request: Request) {
    // Parse query parameters outside try block for error logging
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '20');

    try {
        // Authenticate user with WorkOS
        let user;
        try {
            const authResult = await withAuth();
            user = authResult.user;
        } catch (authError) {
            logger.error('Auth error in history API', authError);
            return NextResponse.json(
                { error: 'Unauthorized', sessions: [], total: 0, page, page_size: pageSize, has_more: false },
                { status: 401 }
            );
        }

        if (!user) {
            logger.warn('Unauthorized chat history request');
            return NextResponse.json(
                { error: 'Unauthorized', sessions: [], total: 0, page, page_size: pageSize, has_more: false },
                { status: 401 }
            );
        }

        // Get or create profile
        let profile;
        try {
            profile = await getOrCreateProfileForWorkOSUser(user);
        } catch (profileError) {
            logger.error('Profile sync failed in history API', profileError);
            return NextResponse.json(
                { error: 'Profile sync failed', sessions: [], total: 0, page, page_size: pageSize, has_more: false },
                { status: 500 }
            );
        }

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not found', sessions: [], total: 0, page, page_size: pageSize, has_more: false },
                { status: 404 }
            );
        }

        // Fetch chat sessions
        try {
            const data = await agentAPIService.getChatSessions(profile.id, page, pageSize);
            return NextResponse.json(data);
        } catch (serviceError) {
            logger.error('AgentAPI service error', serviceError, {
                route: '/api/history',
                page,
                pageSize,
                userId: profile.id,
            });

            // Return empty result instead of error if service is unavailable
            // This allows the UI to show "no history" instead of an error
            return NextResponse.json({
                sessions: [],
                total: 0,
                page,
                page_size: pageSize,
                has_more: false,
            });
        }
    } catch (error) {
        logger.error('Error fetching chat sessions', error, {
            route: '/api/history',
            page,
            pageSize,
        });
        return NextResponse.json(
            {
                error: 'Failed to fetch chat sessions',
                details: error instanceof Error ? error.message : 'Unknown error',
                sessions: [],
                total: 0,
                page,
                page_size: pageSize,
                has_more: false,
            },
            { status: 500 },
        );
    }
}
