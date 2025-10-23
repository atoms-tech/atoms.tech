import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getDocumentDataServer } from '@/lib/db/server/documents.server';
import { createSupabaseClientWithToken } from '@/lib/supabase/supabase-authkit';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';
import { Json } from '@/types/base/database.types';

/**
 * GET /api/documents/[documentId]/rows?blockId=<uuid>
 * POST /api/documents/[documentId]/rows
 * PATCH /api/documents/[documentId]/rows
 * DELETE /api/documents/[documentId]/rows
 *
 * Row CRUD for table blocks using service role with project membership checks.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { documentId: string } },
) {
    try {
        const documentId = params.documentId;
        const { searchParams } = new URL(request.url);
        const blockId = searchParams.get('blockId');

        if (!documentId || !blockId) {
            return NextResponse.json(
                { error: 'documentId and blockId are required' },
                { status: 400 },
            );
        }

        const { user, accessToken } = await withAuth();
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

        const documents = await getDocumentDataServer(documentId);
        if (!documents || documents.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }
        const document = documents[0];

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
                    error: 'Failed to verify membership',
                    details: membershipError.message,
                },
                { status: 500 },
            );
        }
        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Use user-scoped client for row operations (RLS-compliant)
        if (!accessToken) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
        }
        const userClient = createSupabaseClientWithToken(accessToken);
        const { data: rows, error: rowsError } = await userClient
            .from('table_rows')
            .select('*')
            .eq('document_id', documentId)
            .eq('block_id', blockId)
            .order('position', { ascending: true });
        if (rowsError) {
            return NextResponse.json(
                { error: 'Failed to fetch rows', details: rowsError.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ rows: rows ?? [] });
    } catch (error) {
        console.error('Rows API GET error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch rows',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { documentId: string } },
) {
    try {
        const documentId = params.documentId;
        const body = (await request.json()) as {
            id: string;
            blockId: string;
            position: number;
            rowData: Record<string, unknown>;
        };

        if (!documentId || !body?.blockId || !body?.id) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 },
            );
        }

        const { user, accessToken } = await withAuth();
        if (!user)
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

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

        const documents = await getDocumentDataServer(documentId);
        if (!documents || documents.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }
        const document = documents[0];

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
                    error: 'Failed to verify membership',
                    details: membershipError.message,
                },
                { status: 500 },
            );
        }
        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const insertPayload = {
            id: body.id,
            block_id: body.blockId,
            document_id: documentId,
            position: body.position,
            row_data: body.rowData,
            created_by: profile.id,
            updated_by: profile.id,
        };

        if (!accessToken) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
        }
        const userClient = createSupabaseClientWithToken(accessToken);
        const { data, error } = await userClient
            .from('table_rows')
            .insert({
                ...insertPayload,
                row_data: insertPayload.row_data as Json,
            })
            .select('*')
            .single();
        if (error) {
            return NextResponse.json(
                { error: 'Failed to insert row', details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ row: data });
    } catch (error) {
        console.error('Rows API POST error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create row',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { documentId: string } },
) {
    try {
        const documentId = params.documentId;
        const body = (await request.json()) as {
            id: string;
            position?: number;
            rowData?: Record<string, unknown>;
        };

        if (!documentId || !body?.id) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 },
            );
        }

        const { user, accessToken } = await withAuth();
        if (!user)
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile)
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            );

        const supabase = getSupabaseServiceRoleClient();
        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        const documents = await getDocumentDataServer(documentId);
        if (!documents || documents.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }
        const document = documents[0];

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
                    error: 'Failed to verify membership',
                    details: membershipError.message,
                },
                { status: 500 },
            );
        }
        if (!membership)
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const updatePayload: Record<string, unknown> = {
            updated_by: profile.id,
            updated_at: new Date().toISOString(),
        };
        if (typeof body.position === 'number') updatePayload.position = body.position;
        if (body.rowData) updatePayload.row_data = body.rowData;

        if (!accessToken) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
        }
        const userClient = createSupabaseClientWithToken(accessToken);
        const { data, error } = await userClient
            .from('table_rows')
            .update(updatePayload)
            .eq('id', body.id)
            .eq('document_id', documentId)
            .select('*')
            .single();
        if (error) {
            return NextResponse.json(
                { error: 'Failed to update row', details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ row: data });
    } catch (error) {
        console.error('Rows API PATCH error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update row',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { documentId: string } },
) {
    try {
        const documentId = params.documentId;
        const body = (await request.json()) as { id: string };
        if (!documentId || !body?.id) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 },
            );
        }

        const { user, accessToken } = await withAuth();
        if (!user)
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile)
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            );

        const supabase = getSupabaseServiceRoleClient();
        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        const documents = await getDocumentDataServer(documentId);
        if (!documents || documents.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }
        const document = documents[0];

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
                    error: 'Failed to verify membership',
                    details: membershipError.message,
                },
                { status: 500 },
            );
        }
        if (!membership)
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        if (!accessToken) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
        }
        const userClient = createSupabaseClientWithToken(accessToken);
        const { error } = await userClient
            .from('table_rows')
            .delete()
            .eq('id', body.id)
            .eq('document_id', documentId);
        if (error) {
            return NextResponse.json(
                { error: 'Failed to delete row', details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Rows API DELETE error:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete row',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
