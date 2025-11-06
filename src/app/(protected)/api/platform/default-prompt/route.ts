import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@workos-inc/authkit-nextjs';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createClient } from '@/lib/supabase/supabaseServer';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/platform/default-prompt
 * Get the merged default prompt using the 3-scope hierarchy:
 * System (base) + Organization (merge/override) + User (final customization)
 *
 * Query params:
 * - organization_id: Organization ID to use for organization scope (optional)
 * - include_details: Include individual prompt details (default: false)
 */
export async function GET(request: NextRequest) {
    try {
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const supabase = await createClient();

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const organizationId = searchParams.get('organization_id');
        const includeDetails = searchParams.get('include_details') === 'true';

        // Call the database function to get merged prompt
        const { data: mergedData, error: mergeError } = await supabase.rpc(
            'get_merged_system_prompt',
            {
                p_user_id: profile.id,
                p_organization_id: organizationId,
            },
        );

        if (mergeError) {
            logger.error('Error getting merged prompt', mergeError, {
                route: '/api/platform/default-prompt',
                organizationId,
                includeDetails,
            });
            // Fallback to default if function fails
            return NextResponse.json({
                merged_content: 'You are a helpful AI assistant.',
                fallback: true,
            });
        }

        // The RPC returns an array with one row
        const result = mergedData?.[0];

        if (!result) {
            return NextResponse.json({
                merged_content: 'You are a helpful AI assistant.',
                fallback: true,
            });
        }

        // Build response
        const response: Record<string, unknown> = {
            merged_content: result.merged_content,
        };

        if (includeDetails) {
            response.details = {
                system_prompt_id: result.system_prompt_id,
                organization_prompt_id: result.organization_prompt_id,
                user_prompt_id: result.user_prompt_id,
                system_content: result.system_content,
                organization_content: result.organization_content,
                user_content: result.user_content,
            };
        }

        return NextResponse.json(response);
    } catch (error) {
        logger.error('Error in GET /api/platform/default-prompt', error);
        return NextResponse.json(
            {
                merged_content: 'You are a helpful AI assistant.',
                error: 'Failed to retrieve merged prompt, using fallback',
                fallback: true,
            },
            { status: 200 }, // Still return 200 with fallback
        );
    }
}

/**
 * POST /api/platform/default-prompt/preview
 * Preview merged prompt with custom values
 *
 * Body:
 * - system_content: string (optional)
 * - organization_content: string (optional)
 * - user_content: string (optional)
 */
export async function POST(request: NextRequest) {
    try {
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { system_content, organization_content, user_content } = body;

        // Build merged content
        const parts: string[] = [];

        if (system_content) {
            parts.push(system_content);
        }

        if (organization_content) {
            parts.push(organization_content);
        }

        if (user_content) {
            parts.push(user_content);
        }

        const merged_content =
            parts.length > 0 ? parts.join('\n\n') : 'You are a helpful AI assistant.';

        return NextResponse.json({
            merged_content,
            preview: true,
            parts: {
                system: system_content || null,
                organization: organization_content || null,
                user: user_content || null,
            },
        });
    } catch (error) {
        logger.error('Error in POST /api/platform/default-prompt', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
