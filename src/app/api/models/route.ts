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

        // Define allowed models (Vertex AI Claude models only)
        const allowedModels = [
            {
                id: 'claude-sonnet-4-5@20250929',
                object: 'model',
                owned_by: 'anthropic',
                context_length: 200000,
                capabilities: ['chat', 'streaming'],
                description: 'Primary model - Claude Sonnet 4.5 (200K context)'
            },
            {
                id: 'claude-sonnet-4-5@20250929-1m',
                object: 'model',
                owned_by: 'anthropic',
                context_length: 1000000,
                capabilities: ['chat', 'streaming'],
                description: 'Claude Sonnet 4.5 with 1M context window (beta)',
                beta_header: 'context-1m-2025-08-07'
            },
            {
                id: 'claude-haiku-4-5@20251001',
                object: 'model',
                owned_by: 'anthropic',
                context_length: 200000,
                capabilities: ['chat', 'streaming'],
                description: 'Small/fast model - Claude Haiku 4.5'
            }
        ];

        // Try to fetch models from atomsAgent
        try {
            const response = await fetch(`${ATOMSAGENT_URL}/v1/models`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();

                // Filter to only allowed models
                const filteredModels = data.data?.filter((model: { id: string }) =>
                    allowedModels.some(allowed => model.id === allowed.id)
                ) || [];

                // If we got models from atomsAgent, use them
                if (filteredModels.length > 0) {
                    return NextResponse.json({
                        data: filteredModels,
                        object: 'list'
                    });
                }
            }
        } catch (fetchError) {
            logger.warn('Failed to fetch from atomsAgent, using fallback models', { error: fetchError });
        }

        // Return allowed models as fallback
        return NextResponse.json({
            data: allowedModels,
            object: 'list'
        });
    } catch (error) {
        logger.error('Error fetching models', error, { route: '/api/models' });

        // Return fallback models on error
        return NextResponse.json({
            data: [
                {
                    id: 'claude-sonnet-4-5@20250929',
                    object: 'model',
                    owned_by: 'anthropic',
                    context_length: 200000,
                    capabilities: ['chat', 'streaming'],
                    description: 'Primary model - Claude Sonnet 4.5'
                },
                {
                    id: 'claude-sonnet-4-5@20250929-1m',
                    object: 'model',
                    owned_by: 'anthropic',
                    context_length: 1000000,
                    capabilities: ['chat', 'streaming'],
                    description: 'Claude Sonnet 4.5 with 1M context (beta)'
                },
                {
                    id: 'claude-haiku-4-5@20251001',
                    object: 'model',
                    owned_by: 'anthropic',
                    context_length: 200000,
                    capabilities: ['chat', 'streaming'],
                    description: 'Small/fast model - Claude Haiku 4.5'
                }
            ],
            object: 'list'
        });
    }
}
