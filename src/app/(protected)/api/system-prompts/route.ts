import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/system-prompts
 * List system prompts with optional scope filter
 * Query params:
 * - scope: 'user' | 'organization' | 'system' | 'all'
 * - organization_id: filter by organization (for organization scope)
 * - include_public: include public system prompts
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        // Check authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const scope = searchParams.get('scope') || 'all';
        const organizationId = searchParams.get('organization_id');
        const includePublic = searchParams.get('include_public') === 'true';

        // Build query
        let query = supabase.from('system_prompts').select('*');

        // Filter by scope
        if (scope === 'user') {
            query = query.eq('scope', 'user').eq('user_id', user.id);
        } else if (scope === 'organization') {
            query = query.eq('scope', 'organization');
            if (organizationId) {
                query = query.eq('organization_id', organizationId);
            }
        } else if (scope === 'system') {
            query = query.eq('scope', 'system');
            if (!includePublic) {
                // Check if user is platform admin
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('admin_role')
                    .eq('id', user.id)
                    .single();

                if (!profile?.admin_role) {
                    query = query.eq('is_public', true);
                }
            }
        } else if (scope === 'all') {
            // Return all accessible prompts
            // This is handled by RLS policies
        }

        // Order by created_at desc
        query = query.order('created_at', { ascending: false });

        const { data: prompts, error } = await query;

        if (error) {
            logger.error('Error fetching system prompts', error, { route: '/api/system-prompts' });
            return NextResponse.json({ error: 'Failed to fetch system prompts' }, { status: 500 });
        }

        return NextResponse.json({ prompts });
    } catch (error) {
        logger.error('Error in GET /api/system-prompts', error, { route: '/api/system-prompts' });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/system-prompts
 * Create a new system prompt
 * Body:
 * - name: string (required)
 * - description: string (optional)
 * - content: string (required)
 * - scope: 'user' | 'organization' | 'system' (required)
 * - organization_id: string (required for organization scope)
 * - tags: string[] (optional)
 * - is_default: boolean (optional)
 * - is_public: boolean (optional, system scope only)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();

        // Check authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { name, description, content, scope, organization_id, tags, is_default, is_public } =
            body;

        // Validate required fields
        if (!name || !content || !scope) {
            return NextResponse.json(
                { error: 'Missing required fields: name, content, scope' },
                { status: 400 },
            );
        }

        // Validate scope
        if (!['user', 'organization', 'system'].includes(scope)) {
            return NextResponse.json(
                { error: 'Invalid scope. Must be user, organization, or system' },
                { status: 400 },
            );
        }

        // Validate scope-specific requirements
        if (scope === 'organization' && !organization_id) {
            return NextResponse.json(
                { error: 'organization_id is required for organization scope' },
                { status: 400 },
            );
        }

        // Check permissions for system scope
        if (scope === 'system') {
            const { data: profile } = await supabase
                .from('profiles')
                .select('admin_role')
                .eq('id', user.id)
                .single();

            if (!profile?.admin_role) {
                return NextResponse.json(
                    { error: 'Only platform administrators can create system prompts' },
                    { status: 403 },
                );
            }
        }

        // Check permissions for organization scope
        if (scope === 'organization') {
            const { data: membership } = await supabase
                .from('organization_members')
                .select('role')
                .eq('organization_id', organization_id)
                .eq('user_id', user.id)
                .single();

            if (!membership || !['owner', 'admin'].includes(membership.role)) {
                return NextResponse.json(
                    { error: 'Only organization owners and admins can create organization prompts' },
                    { status: 403 },
                );
            }
        }

        // Prepare insert data
        const insertData: any = {
            name,
            description,
            content,
            scope,
            tags: tags || [],
            is_default: is_default || false,
            is_public: scope === 'system' ? is_public || false : false,
            created_by: user.id,
            updated_by: user.id,
        };

        // Add scope-specific fields
        if (scope === 'user') {
            insertData.user_id = user.id;
        } else if (scope === 'organization') {
            insertData.organization_id = organization_id;
        }

        // If setting as default, unset other defaults in the same scope
        if (is_default) {
            const updateQuery = supabase
                .from('system_prompts')
                .update({ is_default: false })
                .eq('scope', scope)
                .eq('is_default', true);

            if (scope === 'user') {
                updateQuery.eq('user_id', user.id);
            } else if (scope === 'organization') {
                updateQuery.eq('organization_id', organization_id);
            }

            await updateQuery;
        }

        // Insert the new prompt
        const { data: prompt, error } = await supabase
            .from('system_prompts')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            logger.error('Error creating system prompt', error, { route: '/api/system-prompts' });
            return NextResponse.json({ error: 'Failed to create system prompt' }, { status: 500 });
        }

        return NextResponse.json({ prompt }, { status: 201 });
    } catch (error) {
    logger.error('Error in POST /api/system-prompts', error, { route: '/api/system-prompts' });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
