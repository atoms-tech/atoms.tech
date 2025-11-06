import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getDocumentDataServer } from '@/lib/db/server/documents.server';
// No user-scoped client needed here; use service role for insertion to avoid UUID casting issues in policies
import { getServiceRoleClient } from '@/lib/database';
import { Json, TablesInsert } from '@/types/base/database.types';

/**
 * POST /api/documents/[documentId]/blocks
 *
 * Creates a block within a document. If the block is a table with content.tableKind === 'requirements',
 * this route will also create default columns for base requirement properties in a deterministic order.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ documentId: string }> },
) {
    try {
        const { documentId } = await context.params;
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

        const body = (await request.json()) as {
            type: string;
            position?: number | null;
            content?: unknown;
            name?: string | null;
            orgId?: string | null;
        };

        if (!body?.type) {
            return NextResponse.json(
                { error: 'Block type is required' },
                { status: 400 },
            );
        }

        const supabase = getServiceRoleClient();
        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        // Validate document and capture project for membership scope
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

        // Resolve organization id from project for optional defaults
        const { data: projectRow, error: projectErr } = await supabase
            .from('projects')
            .select('id, organization_id')
            .eq('id', document.project_id)
            .maybeSingle();
        if (projectErr) {
            return NextResponse.json(
                { error: 'Failed to resolve project', details: projectErr.message },
                { status: 500 },
            );
        }
        const organizationId = projectRow?.organization_id ?? null;

        // Compute position if not provided
        let position = typeof body.position === 'number' ? body.position : null;
        if (position == null) {
            const { data: existingBlocks } = await supabase
                .from('blocks')
                .select('position')
                .eq('document_id', documentId);
            const max = (existingBlocks || [])
                .map((r) => (typeof r.position === 'number' ? r.position : 0))
                .reduce((m, v) => (v > m ? v : m), -1);
            position = max + 1;
        }

        const insertPayload: TablesInsert<'blocks'> = {
            document_id: documentId,
            type: body.type,
            position,
            content: (body.content as Json) ?? ({} as Json),
            created_by: profile.id,
            updated_by: profile.id,
            org_id: (body.orgId ?? organizationId) || null,
        };
        if (typeof body.name === 'string' && body.name.trim().length > 0) {
            insertPayload.name = body.name;
        }

        const { data: block, error: blockErr } = await supabase
            .from('blocks')
            .insert(insertPayload)
            .select('*')
            .single();
        if (blockErr) {
            return NextResponse.json(
                { error: 'Failed to create block', details: blockErr.message },
                { status: 500 },
            );
        }

        // If it's a requirements table, insert default columns for base properties
        const content = (body.content || {}) as { tableKind?: unknown };
        const tableKind =
            typeof content === 'object' && content && 'tableKind' in content
                ? (content as { tableKind?: unknown }).tableKind
                : undefined;
        const isRequirementsTable =
            tableKind === 'requirements' || tableKind === 'requirements_default';

        const createdColumns: unknown[] = [];
        if (isRequirementsTable && organizationId) {
            // Fetch base properties (org-scoped)
            const { data: baseProps, error: propsErr } = await supabase
                .from('properties')
                .select('*')
                .eq('org_id', organizationId)
                .eq('is_base', true)
                .is('document_id', null)
                .is('project_id', null);
            if (propsErr) {
                // Non-fatal: return block without columns
                console.error(
                    'Failed to fetch base properties for default columns:',
                    propsErr,
                );
            } else if (Array.isArray(baseProps) && baseProps.length > 0) {
                // Desired order for requirement defaults
                const order = [
                    'external_id',
                    'name',
                    'description',
                    'status',
                    'priority',
                ];
                const normalize = (s: unknown) =>
                    typeof s === 'string' ? s.toLowerCase().trim() : '';
                const sorted = baseProps.slice().sort((a, b) => {
                    const ia = order.indexOf(normalize(a.name));
                    const ib = order.indexOf(normalize(b.name));
                    const va = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
                    const vb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
                    return va - vb || normalize(a.name).localeCompare(normalize(b.name));
                });

                // Insert columns in order using service-role client to avoid user-id casting issues
                let pos = 0;
                for (const prop of sorted) {
                    const { data: col, error: colErr } = await supabase
                        .from('columns')
                        .insert({
                            block_id: block.id,
                            property_id: prop.id,
                            position: pos,
                            width: 200,
                            is_hidden: false,
                            is_pinned: false,
                            created_by: profile.id,
                            updated_by: profile.id,
                        })
                        .select('*')
                        .single();
                    if (!colErr && col) {
                        createdColumns.push(col);
                        pos += 1;
                    }
                }
            }
        }

        return NextResponse.json({ block, columns: createdColumns });
    } catch (error) {
        console.error('Blocks API POST error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create block',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
