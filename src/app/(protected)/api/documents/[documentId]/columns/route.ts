import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getDocumentDataServer } from '@/lib/db/server/documents.server';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

/**
 * GET /api/documents/[documentId]/columns
 *
 * Returns columns for table blocks in the specified document.
 * Uses service role to bypass RLS while still enforcing membership checks.
 * Optional query param: ?blockId=<uuid> to fetch columns for a single block.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { documentId: string } },
) {
    try {
        const documentId = params.documentId;

        if (!documentId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 },
            );
        }

        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            );
        }

        const supabase = getSupabaseServiceRoleClient();
        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        // Ensure document exists and collect project id for membership check
        const documents = await getDocumentDataServer(documentId);
        if (!documents || documents.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }
        const document = documents[0];

        // Membership enforcement
        const { data: membership, error: membershipError } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', document.project_id)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();

        if (membershipError) {
            return NextResponse.json(
                {
                    error: 'Failed to verify project membership',
                    details: membershipError.message,
                },
                { status: 500 },
            );
        }
        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const blockId = searchParams.get('blockId');

        if (blockId) {
            // Validate the block belongs to the document
            const { data: block, error: blockError } = await supabase
                .from('blocks')
                .select('id, document_id, is_deleted')
                .eq('id', blockId)
                .is('is_deleted', false)
                .maybeSingle();

            if (blockError) {
                return NextResponse.json(
                    { error: 'Failed to fetch block', details: blockError.message },
                    { status: 500 },
                );
            }
            if (!block || block.document_id !== documentId) {
                return NextResponse.json({ error: 'Block not found' }, { status: 404 });
            }

            const { data: columns, error: columnsError } = await supabase
                .from('columns')
                .select('*, property:properties(*)')
                .eq('block_id', blockId)
                .order('position', { ascending: true });

            if (columnsError) {
                return NextResponse.json(
                    {
                        error: 'Failed to fetch block columns',
                        details: columnsError.message,
                    },
                    { status: 500 },
                );
            }

            return NextResponse.json({ columns: columns ?? [] });
        }

        // Fetch all table blocks for the document
        const { data: tableBlocks, error: blocksError } = await supabase
            .from('blocks')
            .select('id, type, is_deleted')
            .eq('document_id', documentId)
            .is('is_deleted', false)
            .eq('type', 'table');

        if (blocksError) {
            return NextResponse.json(
                { error: 'Failed to fetch blocks', details: blocksError.message },
                { status: 500 },
            );
        }

        const blockIds = (tableBlocks ?? []).map((b) => b.id);
        if (blockIds.length === 0) {
            return NextResponse.json({ columns: [] });
        }

        const { data: columns, error: columnsError } = await supabase
            .from('columns')
            .select('*, property:properties(*)')
            .in('block_id', blockIds)
            .order('position', { ascending: true });

        if (columnsError) {
            return NextResponse.json(
                { error: 'Failed to fetch columns', details: columnsError.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ columns: columns ?? [] });
    } catch (error) {
        console.error('Columns API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch columns',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
