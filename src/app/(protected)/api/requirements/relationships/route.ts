import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createClient } from '@/lib/supabase/supabaseServer';

// Minimal Supabase types to avoid using `any` for RPCs and generic selects
type RPCResponse<T = unknown> = { data: T; error: unknown };
type QueryBuilder = {
    select: (columns: string) => QueryBuilder;
    or: (cond: string) => QueryBuilder;
    eq: (
        col: string,
        val: string | number | boolean | null,
    ) => Promise<RPCResponse<unknown>>;
};
type SupabaseMinimal = {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<RPCResponse<unknown>>;
    from: (table: string) => QueryBuilder;
};

interface CreateRelationshipRequest {
    ancestorId: string;
    descendantId: string;
}

interface DeleteRelationshipRequest {
    ancestorId: string;
    descendantId: string;
}

// POST: Create a new requirement relationship
export async function POST(request: NextRequest) {
    try {
        // Get authenticated user and token from WorkOS
        const { user } = await withAuth();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            );
        }

        const supabase = (await createClient()) as unknown as SupabaseMinimal;

        const body = (await request.json()) as CreateRelationshipRequest;
        const { ancestorId, descendantId } = body;

        // Validate input
        if (!ancestorId || !descendantId) {
            return NextResponse.json(
                { error: 'ancestorId and descendantId are required' },
                { status: 400 },
            );
        }

        // Call database function to create relationship with cycle detection
        const { data, error } = await supabase.rpc('create_requirement_relationship', {
            p_ancestor_id: ancestorId,
            p_descendant_id: descendantId,
            p_created_by: profile.id,
        });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to create relationship' },
                { status: 500 },
            );
        }

        // Check if the operation was successful
        const result = Array.isArray(data)
            ? (data[0] as {
                  success: boolean;
                  message?: string;
                  relationships_created?: number;
                  error_code?: string;
              })
            : undefined;
        if (!result?.success) {
            return NextResponse.json(
                {
                    error: result?.error_code,
                    message: result?.message,
                },
                { status: 400 },
            );
        }

        return NextResponse.json({
            success: true,
            message: result?.message,
            relationshipsCreated: result?.relationships_created,
        });
    } catch (error) {
        console.error('POST /api/requirements/relationships error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}

// DELETE: Remove a requirement relationship
export async function DELETE(request: NextRequest) {
    try {
        // Get authenticated user and token from WorkOS
        const { user } = await withAuth();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            );
        }

        const supabase = (await createClient()) as unknown as SupabaseMinimal;

        const body = (await request.json()) as DeleteRelationshipRequest;
        const { ancestorId, descendantId } = body;

        // Validate input
        if (!ancestorId || !descendantId) {
            return NextResponse.json(
                { error: 'ancestorId and descendantId are required' },
                { status: 400 },
            );
        }

        // Call database function to delete relationship
        const { data, error } = await supabase.rpc('delete_requirement_relationship', {
            p_ancestor_id: ancestorId,
            p_descendant_id: descendantId,
            p_deleted_by: profile.id,
        });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to delete relationship' },
                { status: 500 },
            );
        }

        const result = Array.isArray(data)
            ? (data[0] as {
                  success: boolean;
                  message?: string;
                  error_code?: string;
              })
            : undefined;

        if (!result?.success) {
            return NextResponse.json(
                {
                    error: result?.error_code,
                    message: result?.message,
                },
                { status: 400 },
            );
        }

        return NextResponse.json({
            success: true,
            message: result?.message,
        });
    } catch (error) {
        console.error('DELETE /api/requirements/relationships error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
