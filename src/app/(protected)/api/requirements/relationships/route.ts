import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createSupabaseClientWithToken } from '@/lib/supabase/supabase-authkit';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

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
        const { user, accessToken } = await withAuth();
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

        if (!accessToken) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
        }

        const serviceClient = getSupabaseServiceRoleClient();
        if (!serviceClient) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
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

        // Resolve project via requirements -> documents
        const { data: ancReq, error: ancErr } = await serviceClient
            .from('requirements')
            .select('id, document_id, documents!inner(id, project_id)')
            .eq('id', ancestorId)
            .eq('is_deleted', false)
            .maybeSingle();
        if (ancErr) {
            return NextResponse.json(
                {
                    error: 'Failed to resolve ancestor requirement',
                    details: ancErr.message,
                },
                { status: 500 },
            );
        }
        const { data: descReq, error: descErr } = await serviceClient
            .from('requirements')
            .select('id, document_id, documents!inner(id, project_id)')
            .eq('id', descendantId)
            .eq('is_deleted', false)
            .maybeSingle();
        if (descErr) {
            return NextResponse.json(
                {
                    error: 'Failed to resolve descendant requirement',
                    details: descErr.message,
                },
                { status: 500 },
            );
        }

        const projectId = (ancReq as unknown as { documents?: { project_id?: string } })
            ?.documents?.project_id;
        const projectId2 = (descReq as unknown as { documents?: { project_id?: string } })
            ?.documents?.project_id;
        if (!projectId || !projectId2 || projectId !== projectId2) {
            return NextResponse.json(
                { error: 'Ancestor and descendant must belong to the same project' },
                { status: 400 },
            );
        }

        // Membership enforcement
        const { data: membership, error: membershipError } = await serviceClient
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
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

        const userClient = createSupabaseClientWithToken(accessToken);

        // Call database function to create relationship with cycle detection (user-scoped)
        const { data, error } = await userClient.rpc('create_requirement_relationship', {
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
        const { user, accessToken } = await withAuth();
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

        if (!accessToken) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
        }

        const serviceClient = getSupabaseServiceRoleClient();
        if (!serviceClient) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        const body = (await request.json()) as DeleteRelationshipRequest;
        const { ancestorId, descendantId } = body;
        console.log('[Relationships API] DELETE payload', {
            ancestorId,
            descendantId,
            userId: user.id,
            profileId: profile.id,
        });

        // Validate input
        if (!ancestorId || !descendantId) {
            return NextResponse.json(
                { error: 'ancestorId and descendantId are required' },
                { status: 400 },
            );
        }

        // Resolve project and enforce membership
        const { data: ancReq, error: ancErr } = await serviceClient
            .from('requirements')
            .select('id, document_id, documents!inner(id, project_id)')
            .eq('id', ancestorId)
            .eq('is_deleted', false)
            .maybeSingle();
        if (ancErr) {
            return NextResponse.json(
                {
                    error: 'Failed to resolve ancestor requirement',
                    details: ancErr.message,
                },
                { status: 500 },
            );
        }
        const { data: descReq, error: descErr } = await serviceClient
            .from('requirements')
            .select('id, document_id, documents!inner(id, project_id)')
            .eq('id', descendantId)
            .eq('is_deleted', false)
            .maybeSingle();
        if (descErr) {
            return NextResponse.json(
                {
                    error: 'Failed to resolve descendant requirement',
                    details: descErr.message,
                },
                { status: 500 },
            );
        }
        const projectId = (ancReq as unknown as { documents?: { project_id?: string } })
            ?.documents?.project_id;
        const projectId2 = (descReq as unknown as { documents?: { project_id?: string } })
            ?.documents?.project_id;
        if (!projectId || !projectId2 || projectId !== projectId2) {
            return NextResponse.json(
                { error: 'Ancestor and descendant must belong to the same project' },
                { status: 400 },
            );
        }
        const { data: membership, error: membershipError } = await serviceClient
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
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

        const userClient = createSupabaseClientWithToken(accessToken);

        // Call database function to delete relationship (user-scoped)
        const { data, error } = await userClient.rpc('delete_requirement_relationship', {
            p_ancestor_id: ancestorId,
            p_descendant_id: descendantId,
            p_updated_by: profile.id,
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
                  relationships_deleted?: number;
              })
            : undefined;

        console.log('[Relationships API] DELETE RPC result', {
            success: result?.success,
            relationships_deleted: result?.relationships_deleted,
            message: result?.message,
            error_code: result?.error_code,
        });

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
            relationshipsDeleted: result?.relationships_deleted ?? null,
        });
    } catch (error) {
        console.error('DELETE /api/requirements/relationships error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}

// GET: Fetch requirement relationships data
export async function GET(request: NextRequest) {
    try {
        // Authenticate via WorkOS
        const { user, accessToken } = await withAuth();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure a Supabase profile exists; we don't use the id here but keep parity
        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            );
        }

        if (!accessToken) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
        }

        const userClient = createSupabaseClientWithToken(accessToken);
        const serviceClient = getSupabaseServiceRoleClient();
        if (!serviceClient) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (type === 'tree') {
            const projectId = searchParams.get('projectId');
            if (!projectId) {
                return NextResponse.json(
                    { error: 'projectId is required for type=tree' },
                    { status: 400 },
                );
            }

            // Membership enforcement for project
            const { data: membership, error: membershipError } = await serviceClient
                .from('project_members')
                .select('role')
                .eq('project_id', projectId)
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

            const { data, error } = await userClient.rpc('get_requirement_tree', {
                p_project_id: projectId,
            });

            if (error) {
                console.error('Database error (get_requirement_tree):', error);
                return NextResponse.json(
                    { error: 'Failed to fetch requirement tree' },
                    { status: 500 },
                );
            }

            return NextResponse.json({ data });
        }

        if (type === 'descendants') {
            const requirementId = searchParams.get('requirementId');
            const maxDepth = searchParams.get('maxDepth');
            if (!requirementId) {
                return NextResponse.json(
                    { error: 'requirementId is required for type=descendants' },
                    { status: 400 },
                );
            }

            // Resolve project via requirement -> document
            const { data: reqRow, error: reqErr } = await serviceClient
                .from('requirements')
                .select('id, document_id, documents!inner(id, project_id)')
                .eq('id', requirementId)
                .eq('is_deleted', false)
                .maybeSingle();
            if (reqErr) {
                return NextResponse.json(
                    { error: 'Failed to resolve requirement', details: reqErr.message },
                    { status: 500 },
                );
            }
            const projectId = (
                reqRow as unknown as { documents?: { project_id?: string } }
            )?.documents?.project_id;
            if (!projectId) {
                return NextResponse.json(
                    { error: 'Requirement missing project context' },
                    { status: 500 },
                );
            }
            const { data: membership, error: membershipError } = await serviceClient
                .from('project_members')
                .select('role')
                .eq('project_id', projectId)
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

            const { data, error } = await userClient.rpc('get_requirement_descendants', {
                p_ancestor_id: requirementId,
                p_max_depth: maxDepth ? Number(maxDepth) : undefined,
            });

            if (error) {
                console.error('Database error (get_requirement_descendants):', error);
                return NextResponse.json(
                    { error: 'Failed to fetch descendants' },
                    { status: 500 },
                );
            }

            return NextResponse.json({ data });
        }

        if (type === 'ancestors') {
            const requirementId = searchParams.get('requirementId');
            const maxDepth = searchParams.get('maxDepth');
            if (!requirementId) {
                return NextResponse.json(
                    { error: 'requirementId is required for type=ancestors' },
                    { status: 400 },
                );
            }

            // Resolve project and enforce membership
            const { data: reqRow, error: reqErr } = await serviceClient
                .from('requirements')
                .select('id, document_id, documents!inner(id, project_id)')
                .eq('id', requirementId)
                .eq('is_deleted', false)
                .maybeSingle();
            if (reqErr) {
                return NextResponse.json(
                    { error: 'Failed to resolve requirement', details: reqErr.message },
                    { status: 500 },
                );
            }
            const projectId = (
                reqRow as unknown as { documents?: { project_id?: string } }
            )?.documents?.project_id;
            if (!projectId) {
                return NextResponse.json(
                    { error: 'Requirement missing project context' },
                    { status: 500 },
                );
            }
            const { data: membership, error: membershipError } = await serviceClient
                .from('project_members')
                .select('role')
                .eq('project_id', projectId)
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

            const { data, error } = await userClient.rpc('get_requirement_ancestors', {
                p_descendant_id: requirementId,
                p_max_depth: maxDepth ? Number(maxDepth) : undefined,
            });

            if (error) {
                console.error('Database error (get_requirement_ancestors):', error);
                return NextResponse.json(
                    { error: 'Failed to fetch ancestors' },
                    { status: 500 },
                );
            }

            return NextResponse.json({ data });
        }

        if (type === 'check') {
            const requirementId = searchParams.get('requirementId');
            if (!requirementId) {
                return NextResponse.json(
                    { error: 'requirementId is required for type=check' },
                    { status: 400 },
                );
            }

            // Resolve project and enforce membership
            const { data: reqRow, error: reqErr } = await serviceClient
                .from('requirements')
                .select('id, document_id, documents!inner(id, project_id)')
                .eq('id', requirementId)
                .eq('is_deleted', false)
                .maybeSingle();
            if (reqErr) {
                return NextResponse.json(
                    { error: 'Failed to resolve requirement', details: reqErr.message },
                    { status: 500 },
                );
            }
            const projectId = (
                reqRow as unknown as { documents?: { project_id?: string } }
            )?.documents?.project_id;
            if (!projectId) {
                return NextResponse.json(
                    { error: 'Requirement missing project context' },
                    { status: 500 },
                );
            }
            const { data: membership, error: membershipError } = await serviceClient
                .from('project_members')
                .select('role')
                .eq('project_id', projectId)
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

            // Check for relationships in closure table (depth > 0)
            const { data: relationships, error: relationshipsError } = await serviceClient
                .from('requirements_closure')
                .select(
                    `
                        ancestor_id,
                        descendant_id,
                        depth
                    `,
                )
                .or(`ancestor_id.eq.${requirementId},descendant_id.eq.${requirementId}`)
                .gt('depth', 0);

            if (relationshipsError) {
                console.error(
                    'Database error (check relationships):',
                    relationshipsError,
                );
                return NextResponse.json(
                    { error: 'Failed to check relationships' },
                    { status: 500 },
                );
            }

            // Get unique related requirement IDs (excluding the requirement itself)
            const relatedIds = new Set<string>();
            relationships?.forEach((rel) => {
                if (rel.ancestor_id !== requirementId) {
                    relatedIds.add(rel.ancestor_id);
                }
                if (rel.descendant_id !== requirementId) {
                    relatedIds.add(rel.descendant_id);
                }
            });

            // Fetch details of related requirements if any exist
            let relatedRequirements: Array<{
                id: string;
                name: string;
                external_id: string | null;
            }> = [];
            if (relatedIds.size > 0) {
                const { data: reqData, error: reqDataError } = await serviceClient
                    .from('requirements')
                    .select('id, name, external_id')
                    .in('id', Array.from(relatedIds))
                    .eq('is_deleted', false);

                if (reqDataError) {
                    console.error(
                        'Database error (fetch related requirements):',
                        reqDataError,
                    );
                    return NextResponse.json(
                        { error: 'Failed to fetch related requirements' },
                        { status: 500 },
                    );
                }

                relatedRequirements = reqData || [];
            }

            return NextResponse.json({
                hasRelationships: relatedIds.size > 0,
                relationshipCount: relationships?.length || 0,
                relatedRequirements,
            });
        }

        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    } catch (error) {
        console.error('GET /api/requirements/relationships error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
