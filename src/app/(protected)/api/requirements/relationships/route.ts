import { NextRequest, NextResponse } from 'next/server';

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
    auth: {
        getUser: () => Promise<{
            data: { user: { id: string } | null };
            error: unknown;
        }>;
    };
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
        const supabase = (await createClient()) as unknown as SupabaseMinimal;

        // Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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
            p_created_by: user.id,
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
        console.error('API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove a requirement relationship
export async function DELETE(request: NextRequest) {
    try {
        const supabase = (await createClient()) as unknown as SupabaseMinimal;

        // Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = (await request.json()) as DeleteRelationshipRequest;
        const { ancestorId, descendantId } = body;

        // Debug logging
        console.log('DELETE API called with body:', body);
        console.log('ancestorId:', ancestorId, 'type:', typeof ancestorId);
        console.log('descendantId:', descendantId, 'type:', typeof descendantId);
        console.log('user.id:', user.id);

        // Validate input
        if (!ancestorId || !descendantId) {
            console.log('Validation failed: missing required parameters');
            return NextResponse.json(
                { error: 'ancestorId and descendantId are required' },
                { status: 400 },
            );
        }

        // UUID validation
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(ancestorId)) {
            console.log('Invalid ancestorId format:', ancestorId);
            return NextResponse.json(
                { error: 'Invalid ancestorId format' },
                { status: 400 },
            );
        }
        if (!uuidRegex.test(descendantId)) {
            console.log('Invalid descendantId format:', descendantId);
            return NextResponse.json(
                { error: 'Invalid descendantId format' },
                { status: 400 },
            );
        }

        console.log('Calling database function with parameters:', {
            p_ancestor_id: ancestorId,
            p_descendant_id: descendantId,
            p_updated_by: user.id,
        });

        // Call database function to delete relationship
        const { data, error } = await supabase.rpc('delete_requirement_relationship', {
            p_ancestor_id: ancestorId,
            p_descendant_id: descendantId,
            p_updated_by: user.id,
        });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to delete relationship' },
                { status: 500 },
            );
        }

        console.log('Database function response:', data);

        // Check if the operation was successful
        const result = Array.isArray(data)
            ? (data[0] as {
                  success: boolean;
                  message?: string;
                  relationships_deleted?: number;
                  error_code?: string;
              })
            : undefined;
        console.log('Result object:', result);

        if (!result?.success) {
            console.log('Database function reported failure:', result);
            return NextResponse.json(
                {
                    error: result?.error_code,
                    message: result?.message,
                },
                { status: 400 },
            );
        }

        console.log(
            'Database function succeeded, relationships deleted:',
            result.relationships_deleted,
        );

        return NextResponse.json({
            success: true,
            message: result?.message,
            relationshipsDeleted: result?.relationships_deleted,
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET: Retrieve requirement relationships
export async function GET(request: NextRequest) {
    try {
        const supabase = (await createClient()) as unknown as SupabaseMinimal;

        // Get authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const requirementId = searchParams.get('requirementId');
        const projectId = searchParams.get('projectId');
        const type = searchParams.get('type'); // 'descendants', 'ancestors', or 'tree'
        const maxDepth = searchParams.get('maxDepth');

        if (!requirementId && !projectId && type !== 'tree') {
            return NextResponse.json(
                { error: 'requirementId or projectId is required' },
                { status: 400 },
            );
        }

        let response: RPCResponse<unknown>;

        switch (type) {
            case 'descendants':
                if (!requirementId) {
                    return NextResponse.json(
                        { error: 'requirementId is required for descendants query' },
                        { status: 400 },
                    );
                }
                response = await supabase.rpc('get_requirement_descendants', {
                    p_ancestor_id: requirementId,
                    p_max_depth: maxDepth ? parseInt(maxDepth) : null,
                });
                break;

            case 'ancestors':
                if (!requirementId) {
                    return NextResponse.json(
                        { error: 'requirementId is required for ancestors query' },
                        { status: 400 },
                    );
                }
                response = await supabase.rpc('get_requirement_ancestors', {
                    p_descendant_id: requirementId,
                    p_max_depth: maxDepth ? parseInt(maxDepth) : null,
                });
                break;

            case 'tree':
                response = await supabase.rpc('get_requirement_tree', {
                    p_project_id: projectId || null,
                });
                break;

            default:
                // Default: return all direct relationships for the requirement
                if (!requirementId) {
                    return NextResponse.json(
                        { error: 'requirementId is required' },
                        { status: 400 },
                    );
                }
                response = await supabase
                    .from('requirements_closure')
                    .select(
                        `
                        *,
                        ancestor:ancestor_id (id, title),
                        descendant:descendant_id (id, title)
                    `,
                    )
                    .or(
                        `ancestor_id.eq.${requirementId},descendant_id.eq.${requirementId}`,
                    )
                    .eq('depth', 1);
        }

        if (response.error) {
            console.error('Database error:', response.error);
            return NextResponse.json(
                { error: 'Failed to retrieve relationships' },
                { status: 500 },
            );
        }

        return NextResponse.json({ data: response.data });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
