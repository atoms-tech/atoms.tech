/**
 * Models API Route
 *
 * Proxies requests to atomsAgent's /v1/models endpoint
 */

import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { logger } from '@/lib/utils/logger';

const ATOMSAGENT_URL = process.env.NEXT_PUBLIC_AGENTAPI_URL || 'http://localhost:3284';

export async function GET() {
    try {
        // Authenticate user with WorkOS
        let user;
        try {
            const authResult = await withAuth();
            user = authResult.user;
        } catch (authError) {
            logger.error('Auth error in models API', authError);
            return new Response('Unauthorized', { status: 401 });
        }

        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        // Get or create profile (optional - not strictly needed for models)
        try {
            await getOrCreateProfileForWorkOSUser(user);
        } catch (profileError) {
            logger.warn('Profile sync failed, continuing anyway', { error: profileError });
            // Continue - profile not strictly needed for fetching models
        }

        // Fetch models from atomsAgent
        const response = await fetch(`${ATOMSAGENT_URL}/v1/models`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error('atomsAgent error', { status: response.status, error: errorText });

            // Return fallback models if atomsAgent is down
            return NextResponse.json({
                data: [
                    {
                        id: 'claude-3-5-sonnet-20241022',
                        object: 'model',
                        owned_by: 'anthropic',
                        context_length: 200000,
                        capabilities: ['chat', 'streaming']
                    }
                ],
                object: 'list'
            });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        logger.error('Error fetching models', error, { route: '/api/models' });

        // Return fallback models on error
        return NextResponse.json({
            data: [
                {
                    id: 'claude-3-5-sonnet-20241022',
                    object: 'model',
                    owned_by: 'anthropic',
                    context_length: 200000,
                    capabilities: ['chat', 'streaming']
                }
            ],
            object: 'list'
        });
    }
}
