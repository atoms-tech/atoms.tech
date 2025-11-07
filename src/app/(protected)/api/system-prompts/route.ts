import { NextRequest, NextResponse } from 'next/server';

import { withAuth } from '@workos-inc/authkit-nextjs';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createServerClient } from '@/lib/database';
import type { Database } from '@/types/base/database.types';
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
type SystemPromptRow = Database['public']['Tables']['system_prompts']['Row'];
type SystemPromptInsert = Database['public']['Tables']['system_prompts']['Insert'];

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

        const supabase = await createServerClient();

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const scope = searchParams.get('scope') || 'all';
        const organizationId = searchParams.get('organization_id');
        const includePublic = searchParams.get('include_public') === 'true';

        // Build query
        let query = supabase.from('system_prompts').select('*');

        // Filter by scope
        if (scope === 'user') {
            query = query.eq('scope', 'user').eq('user_id', profile.id);
        } else if (scope === 'organization') {
            query = query.eq('scope', 'organization');
            if (organizationId) {
                query = query.eq('organization_id', organizationId);
            }
        } else if (scope === 'system') {
            query = query.eq('scope', 'system');
            if (!includePublic) {
                // Check if user is platform admin
                const { data: adminCheck } = await supabase
                    .from('platform_admins')
                    .select('id')
                    .eq('user_id', profile.id)
                    .single();

                if (!adminCheck) {
                    query = query.eq('is_public', true);
                }
            }
        } else if (scope === 'all') {
            // For 'all', we need to explicitly fetch prompts from all accessible scopes
            // Build an OR condition to get user, organization, and system prompts
            
            // Check if user is platform admin for system prompts
            const { data: adminCheck } = await supabase
                .from('platform_admins')
                .select('id')
                .eq('user_id', profile.id)
                .single();

            const isPlatformAdmin = !!adminCheck;

            // Get user's organization memberships for filtering org prompts
            const { data: memberships } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', profile.id);
            
            const userOrgIds = new Set((memberships || []).map((m: { organization_id: string }) => m.organization_id));

            // Use multiple queries and combine results since Supabase doesn't support complex OR easily
            const [userPrompts, orgPrompts, systemPrompts] = await Promise.all([
                // User prompts
                supabase
                    .from('system_prompts')
                    .select('*')
                    .eq('scope', 'user')
                    .eq('user_id', profile.id),
                // Organization prompts (RLS will filter by membership)
                supabase
                    .from('system_prompts')
                    .select('*')
                    .eq('scope', 'organization'),
                // System prompts: all if admin, otherwise only public
                isPlatformAdmin
                    ? supabase
                          .from('system_prompts')
                          .select('*')
                          .eq('scope', 'system')
                    : supabase
                          .from('system_prompts')
                          .select('*')
                          .eq('scope', 'system')
                          .eq('is_public', true),
            ]);

            // Combine and deduplicate
              const allPrompts: SystemPromptRow[] = [];
            const seenIds = new Set<string>();

            // Process user prompts
              if (userPrompts.data) {
                  userPrompts.data.forEach((prompt) => {
                    if (!seenIds.has(prompt.id)) {
                        allPrompts.push(prompt);
                        seenIds.add(prompt.id);
                    }
                });
            }

            // Process organization prompts (RLS filters by membership)
            if (orgPrompts.data) {
                  orgPrompts.data.forEach((prompt) => {
                    if (!seenIds.has(prompt.id)) {
                        // Only include prompts from organizations the user is a member of
                          if (prompt.organization_id && userOrgIds.has(prompt.organization_id)) {
                            allPrompts.push(prompt);
                            seenIds.add(prompt.id);
                        }
                    }
                });
            }

            // Process system prompts
            if (systemPrompts.data) {
                  systemPrompts.data.forEach((prompt) => {
                    if (!seenIds.has(prompt.id)) {
                        // Additional check: if not admin, only include public prompts
                        if (prompt.scope === 'system') {
                              if (isPlatformAdmin || prompt.is_public) {
                                allPrompts.push(prompt);
                                seenIds.add(prompt.id);
                            }
                        } else {
                            allPrompts.push(prompt);
                            seenIds.add(prompt.id);
                        }
                    }
                });
            }

            // Log any errors but don't fail the request
            if (userPrompts.error) {
                logger.warn('Error fetching user prompts', { error: userPrompts.error });
            }
            if (orgPrompts.error) {
                logger.warn('Error fetching organization prompts', { error: orgPrompts.error });
            }
            if (systemPrompts.error) {
                logger.warn('Error fetching system prompts', { error: systemPrompts.error });
            }

            // Sort by created_at desc
              allPrompts.sort((a, b) => {
                  const dateA = new Date(a.created_at ?? 0).getTime();
                  const dateB = new Date(b.created_at ?? 0).getTime();
                return dateB - dateA;
            });

            return NextResponse.json({ prompts: allPrompts });
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
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const supabase = await createServerClient();

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
            const { data: adminCheck } = await supabase
                .from('platform_admins')
                .select('id')
                .eq('user_id', profile.id)
                .single();

            if (!adminCheck) {
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
                .eq('user_id', profile.id)
                .single();

            if (!membership || !['owner', 'admin'].includes(membership.role)) {
                return NextResponse.json(
                    { error: 'Only organization owners and admins can create organization prompts' },
                    { status: 403 },
                );
            }
        }

        // Prepare insert data
          const insertData: SystemPromptInsert = {
              name,
              description: description ?? null,
              content,
              scope,
              tags: tags ?? [],
              is_default: is_default ?? false,
              is_public: scope === 'system' ? Boolean(is_public) : false,
              created_by: profile.id,
              updated_by: profile.id,
              enabled: true,
              priority: 0,
          };

        // Add scope-specific fields
        if (scope === 'user') {
              insertData.user_id = profile.id;
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
                updateQuery.eq('user_id', profile.id);
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
