import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/system-prompts/[id]
 * Update a system prompt
 * Body:
 * - name: string (optional)
 * - description: string (optional)
 * - content: string (optional)
 * - tags: string[] (optional)
 * - is_default: boolean (optional)
 * - is_public: boolean (optional, system scope only)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    let promptId: string | undefined;
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

        const { id } = await params;
        promptId = id;

        // Get the existing prompt to check permissions
        const { data: existingPrompt, error: fetchError } = await supabase
            .from('system_prompts')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existingPrompt) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }

        // Check permissions based on scope
        if (existingPrompt.scope === 'user' && existingPrompt.user_id !== user.id) {
            return NextResponse.json(
                { error: 'You do not have permission to update this prompt' },
                { status: 403 },
            );
        }

        if (existingPrompt.scope === 'organization') {
            const { data: membership } = await supabase
                .from('organization_members')
                .select('role')
                .eq('organization_id', existingPrompt.organization_id)
                .eq('user_id', user.id)
                .single();

            if (!membership || !['owner', 'admin'].includes(membership.role)) {
                return NextResponse.json(
                    { error: 'You do not have permission to update this prompt' },
                    { status: 403 },
                );
            }
        }

        if (existingPrompt.scope === 'system') {
            const { data: profile } = await supabase
                .from('profiles')
                .select('admin_role')
                .eq('id', user.id)
                .single();

            if (!profile?.admin_role) {
                return NextResponse.json(
                    { error: 'Only platform administrators can update system prompts' },
                    { status: 403 },
                );
            }
        }

        // Parse request body
        const body = await request.json();
        const { name, description, content, tags, is_default, is_public } = body;

        // Prepare update data
        const updateData: any = {
            updated_by: user.id,
        };

        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (content !== undefined) updateData.content = content;
        if (tags !== undefined) updateData.tags = tags;
        if (is_default !== undefined) updateData.is_default = is_default;
        if (is_public !== undefined && existingPrompt.scope === 'system') {
            updateData.is_public = is_public;
        }

        // If setting as default, unset other defaults in the same scope
        if (is_default && !existingPrompt.is_default) {
            const updateQuery = supabase
                .from('system_prompts')
                .update({ is_default: false })
                .eq('scope', existingPrompt.scope)
                .eq('is_default', true)
                .neq('id', id);

            if (existingPrompt.scope === 'user') {
                updateQuery.eq('user_id', user.id);
            } else if (existingPrompt.scope === 'organization') {
                updateQuery.eq('organization_id', existingPrompt.organization_id);
            }

            await updateQuery;
        }

        // Update the prompt
        const { data: prompt, error } = await supabase
            .from('system_prompts')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logger.error('Error updating system prompt', error, {
                route: '/api/system-prompts/[id]',
                promptId: id,
            });
            return NextResponse.json({ error: 'Failed to update system prompt' }, { status: 500 });
        }

        return NextResponse.json({ prompt });
    } catch (error) {
        logger.error('Error in PUT /api/system-prompts/[id]', error, {
            route: '/api/system-prompts/[id]',
            promptId,
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/system-prompts/[id]
 * Delete a system prompt
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    let promptId: string | undefined;
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

        const { id } = await params;
        promptId = id;

        // Get the existing prompt to check permissions
        const { data: existingPrompt, error: fetchError } = await supabase
            .from('system_prompts')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existingPrompt) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }

        // Check permissions based on scope
        if (existingPrompt.scope === 'user' && existingPrompt.user_id !== user.id) {
            return NextResponse.json(
                { error: 'You do not have permission to delete this prompt' },
                { status: 403 },
            );
        }

        if (existingPrompt.scope === 'organization') {
            const { data: membership } = await supabase
                .from('organization_members')
                .select('role')
                .eq('organization_id', existingPrompt.organization_id)
                .eq('user_id', user.id)
                .single();

            if (!membership || !['owner', 'admin'].includes(membership.role)) {
                return NextResponse.json(
                    { error: 'You do not have permission to delete this prompt' },
                    { status: 403 },
                );
            }
        }

        if (existingPrompt.scope === 'system') {
            const { data: profile } = await supabase
                .from('profiles')
                .select('admin_role')
                .eq('id', user.id)
                .single();

            if (!profile?.admin_role) {
                return NextResponse.json(
                    { error: 'Only platform administrators can delete system prompts' },
                    { status: 403 },
                );
            }
        }

        // Delete the prompt
        const { error } = await supabase.from('system_prompts').delete().eq('id', id);

        if (error) {
            logger.error('Error deleting system prompt', error, {
                route: '/api/system-prompts/[id]',
                promptId: id,
            });
            return NextResponse.json({ error: 'Failed to delete system prompt' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Prompt deleted successfully' });
    } catch (error) {
        logger.error('Error in DELETE /api/system-prompts/[id]', error, {
            route: '/api/system-prompts/[id]',
            promptId,
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * GET /api/system-prompts/[id]
 * Get a single system prompt
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    let promptId: string | undefined;
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

        const { id } = await params;
        promptId = id;

        // Get the prompt (RLS will handle access control)
        const { data: prompt, error } = await supabase
            .from('system_prompts')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !prompt) {
            return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
        }

        return NextResponse.json({ prompt });
    } catch (error) {
        logger.error('Error in GET /api/system-prompts/[id]', error, {
            route: '/api/system-prompts/[id]',
            promptId,
        });
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
