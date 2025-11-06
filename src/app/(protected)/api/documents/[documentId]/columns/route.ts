import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getDocumentDataServer } from '@/lib/db/server/documents.server';
import { createServerClientWithToken } from '@/lib/database';
import { getServiceRoleClient } from '@/lib/database';
import { isFeatureEnabled } from '@/lib/utils/env-validation';
import { Json, TablesInsert } from '@/types/base/database.types';

/**
 * GET /api/documents/[documentId]/columns
 *
 * Returns columns for table blocks in the specified document.
 * Uses service role to bypass RLS while still enforcing membership checks.
 * Optional query param: ?blockId=<uuid> to fetch columns for a single block.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ documentId: string }> },
) {
    const startedAt = Date.now();
    const logs: string[] = [];
    const includeDebug =
        process.env.NODE_ENV !== 'production' || isFeatureEnabled.debugLogging();
    const emit = (level: 'log' | 'warn' | 'error', args: unknown[]) => {
        try {
            const msg = args
                .map((a) =>
                    typeof a === 'string'
                        ? a
                        : (() => {
                              try {
                                  return JSON.stringify(a);
                              } catch {
                                  return String(a);
                              }
                          })(),
                )
                .join(' ');
            logs.push(`[${level}] ${msg}`);
        } catch {
            // no-op
        }
        // Always also log to server console for SSR visibility
        console[level](...(args as []));
    };
    const debug = {
        log: (...args: unknown[]) => emit('log', args),
        warn: (...args: unknown[]) => emit('warn', args),
        error: (...args: unknown[]) => emit('error', args),
    };
    try {
        const { documentId } = await context.params;

        if (!documentId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
                { status: 400 },
            );
        }

        const { user, accessToken: _accessToken } = await withAuth();

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

        const supabase = getServiceRoleClient();
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

        // Helper to log completion timing
        const logDone = (label: string, extra?: unknown) => {
            const ms = Date.now() - startedAt;
            debug.log(`[Columns API] ${label} in ${ms}ms`, extra ?? '');
        };

        if (blockId) {
            debug.log('[Columns API] Fetching columns for single block', {
                documentId,
                blockId,
                userId: user.id,
                profileId: profile.id,
            });

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

            // First attempt: embed property join
            const { data: columnsJoined, error: joinErr } = await supabase
                .from('columns')
                .select('*, property:properties(*)')
                .eq('block_id', blockId)
                .order('position', { ascending: true });

            if (!joinErr) {
                logDone('Fetched columns (joined)', {
                    count: columnsJoined?.length ?? 0,
                });
                return NextResponse.json({ columns: columnsJoined ?? [] });
            }

            debug.warn(
                '[Columns API] ⚠️ Join fetch failed for single block, falling back',
                joinErr.message,
            );

            // Fallback: fetch columns plain, then hydrate properties if needed
            const { data: columnsPlain, error: plainErr } = await supabase
                .from('columns')
                .select('*')
                .eq('block_id', blockId)
                .order('position', { ascending: true });

            if (plainErr) {
                return NextResponse.json(
                    {
                        error: 'Failed to fetch block columns (fallback failed)',
                        details: plainErr.message,
                    },
                    { status: 500 },
                );
            }

            // Collect property ids to hydrate
            const propertyIds = Array.from(
                new Set((columnsPlain ?? []).map((c) => c.property_id).filter(Boolean)),
            ) as string[];

            let propertiesMap: Record<string, unknown> = {};
            if (propertyIds.length > 0) {
                const { data: propsData, error: propsErr } = await supabase
                    .from('properties')
                    .select('*')
                    .in('id', propertyIds);
                if (!propsErr && propsData) {
                    propertiesMap = Object.fromEntries(propsData.map((p) => [p.id, p]));
                } else if (propsErr) {
                    debug.warn(
                        '[Columns API] ⚠️ Properties hydrate failed',
                        propsErr.message,
                    );
                }
            }

            const hydrated = (columnsPlain ?? []).map((c) => ({
                ...c,
                property: c.property_id ? (propertiesMap[c.property_id] ?? null) : null,
            }));

            logDone('Fetched columns (fallback hydrated)', { count: hydrated.length });
            return NextResponse.json({
                columns: hydrated,
                ...(includeDebug ? { __debug: logs } : {}),
            });
        }

        debug.log('[Columns API] Fetching columns for all table blocks', {
            documentId,
            userId: user.id,
            profileId: profile.id,
        });

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
            logDone('No table blocks found');
            return NextResponse.json({ columns: [] });
        }

        // First attempt: embed property join
        const { data: columnsJoined, error: joinErr } = await supabase
            .from('columns')
            .select('*, property:properties(*)')
            .in('block_id', blockIds)
            .order('position', { ascending: true });

        if (!joinErr) {
            logDone('Fetched columns for all blocks (joined)', {
                count: columnsJoined?.length ?? 0,
                blocks: blockIds.length,
            });
            return NextResponse.json({
                columns: columnsJoined ?? [],
                ...(includeDebug ? { __debug: logs } : {}),
            });
        }

        debug.warn(
            '[Columns API] ⚠️ Join fetch failed (all blocks), falling back',
            joinErr.message,
        );

        // Fallback: fetch columns plain
        const { data: columnsPlain, error: plainErr } = await supabase
            .from('columns')
            .select('*')
            .in('block_id', blockIds)
            .order('position', { ascending: true });

        if (plainErr) {
            return NextResponse.json(
                {
                    error: 'Failed to fetch columns (fallback failed)',
                    details: plainErr.message,
                },
                { status: 500 },
            );
        }

        // Hydrate properties if needed
        const propertyIds = Array.from(
            new Set((columnsPlain ?? []).map((c) => c.property_id).filter(Boolean)),
        ) as string[];

        let propertiesMap: Record<string, unknown> = {};
        if (propertyIds.length > 0) {
            const { data: propsData, error: propsErr } = await supabase
                .from('properties')
                .select('*')
                .in('id', propertyIds);
            if (!propsErr && propsData) {
                propertiesMap = Object.fromEntries(propsData.map((p) => [p.id, p]));
            } else if (propsErr) {
                debug.warn(
                    '[Columns API] ⚠️ Properties hydrate failed',
                    propsErr.message,
                );
            }
        }

        const hydrated = (columnsPlain ?? []).map((c) => ({
            ...c,
            property: c.property_id ? (propertiesMap[c.property_id] ?? null) : null,
        }));

        logDone('Fetched columns for all blocks (fallback hydrated)', {
            count: hydrated.length,
            blocks: blockIds.length,
        });
        return NextResponse.json({
            columns: hydrated,
            ...(includeDebug ? { __debug: logs } : {}),
        });
    } catch (error) {
        console.error('Columns API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch columns',
                details: error instanceof Error ? error.message : 'Unknown error',
                ...(process.env.NODE_ENV !== 'production'
                    ? { __debug: [`[error] ${String(error)}`] }
                    : {}),
            },
            { status: 500 },
        );
    }
}

/**
 * POST /api/documents/[documentId]/columns
 *
 * Creates a column, with two modes:
 * - Create new property and then a column for the provided block
 * - Create column from an existing property for the provided block
 *
 * Body for new property:
 * {
 *   mode: 'new',
 *   blockId: string,
 *   name: string,
 *   propertyType: string, // DB enum string
 *   propertyConfig: { scope: string[]; is_base?: boolean; options?: string[] },
 *   defaultValue?: string
 * }
 *
 * Body for from property:
 * {
 *   mode: 'fromProperty',
 *   blockId: string,
 *   propertyId: string,
 *   defaultValue?: string
 * }
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ documentId: string }> },
) {
    const startedAt = Date.now();
    try {
        const { documentId } = await context.params;

        if (!documentId) {
            return NextResponse.json(
                { error: 'Document ID is required' },
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

        const body = (await request.json()) as
            | {
                  mode: 'new';
                  blockId: string;
                  name: string;
                  propertyType: string;
                  propertyConfig: {
                      scope: string[];
                      is_base?: boolean;
                      options?: string[];
                  };
                  defaultValue?: string;
              }
            | {
                  mode: 'fromProperty';
                  blockId: string;
                  propertyId: string;
                  defaultValue?: string;
              };

        const supabase = getServiceRoleClient();
        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        // Ensure document exists and collect project id for membership/org scope
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

        // Fetch project to derive organization id
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
        if (!organizationId) {
            return NextResponse.json(
                { error: 'Project missing organization_id' },
                { status: 500 },
            );
        }

        // Helper: compute max position for block columns
        const getNextPosition = async (blockId: string) => {
            const { data: existing } = await supabase
                .from('columns')
                .select('position')
                .eq('block_id', blockId);
            const max = (existing || [])
                .map((r) => (typeof r.position === 'number' ? r.position : 0))
                .reduce((m, v) => (v > m ? v : m), -1);
            return max + 1;
        };

        if (body.mode === 'new') {
            const position = await getNextPosition(body.blockId);

            const optionsJson = (() => {
                const values = body.propertyConfig?.options || [];
                if (Array.isArray(values) && values.length > 0) {
                    // People type flagging via format
                    return body.propertyType === 'multi_select' && values
                        ? ({ values, format: 'people' } as unknown as Json)
                        : ({ values } as unknown as Json);
                }
                return null;
            })();

            const propertyInsert: TablesInsert<'properties'> = {
                name: body.name,
                property_type: body.propertyType,
                org_id: organizationId,
                project_id: body.propertyConfig.scope?.includes('project')
                    ? document.project_id
                    : undefined,
                document_id: body.propertyConfig.scope?.includes('document')
                    ? documentId
                    : undefined,
                is_base: !!body.propertyConfig.is_base,
                options: optionsJson as Json | null,
                scope: Array.isArray(body.propertyConfig.scope)
                    ? body.propertyConfig.scope.join(',')
                    : undefined,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: profile.id,
                updated_by: profile.id,
            };

            const { data: property, error: propertyErr } = await supabase
                .from('properties')
                .insert(propertyInsert)
                .select('*')
                .single();
            if (propertyErr) {
                return NextResponse.json(
                    { error: 'Failed to create property', details: propertyErr.message },
                    { status: 500 },
                );
            }

            // Insert column using user-scoped client to align with table grants
            const userClient = accessToken
                ? createServerClientWithToken(accessToken)
                : null;
            const { data: column, error: columnErr } = await (userClient ?? supabase)
                .from('columns')
                .insert({
                    block_id: body.blockId,
                    property_id: property.id,
                    position,
                    width: 150,
                    is_hidden: false,
                    is_pinned: false,
                    default_value:
                        typeof body.defaultValue === 'string' &&
                        body.defaultValue.trim() === ''
                            ? null
                            : (body.defaultValue ?? null),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: profile.id,
                    updated_by: profile.id,
                })
                .select('*')
                .single();
            if (columnErr) {
                return NextResponse.json(
                    { error: 'Failed to create column', details: columnErr.message },
                    { status: 500 },
                );
            }

            return NextResponse.json({
                property,
                column,
                createdAtMs: Date.now() - startedAt,
            });
        }

        if (body.mode === 'fromProperty') {
            const position = await getNextPosition(body.blockId);

            const userClient2 = accessToken
                ? createServerClientWithToken(accessToken)
                : null;
            const { data: column, error: columnErr } = await (userClient2 ?? supabase)
                .from('columns')
                .insert({
                    block_id: body.blockId,
                    property_id: body.propertyId,
                    position,
                    width: 200,
                    is_hidden: false,
                    is_pinned: false,
                    default_value:
                        typeof body.defaultValue === 'string' &&
                        body.defaultValue.trim() === ''
                            ? null
                            : (body.defaultValue ?? null),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: profile.id,
                    updated_by: profile.id,
                })
                .select('*')
                .single();
            if (columnErr) {
                return NextResponse.json(
                    {
                        error: 'Failed to create column from property',
                        details: columnErr.message,
                    },
                    { status: 500 },
                );
            }
            // also fetch property to return for table-level creation expectations
            const { data: property, error: propErr } = await supabase
                .from('properties')
                .select('*')
                .eq('id', body.propertyId)
                .maybeSingle();
            if (propErr) {
                return NextResponse.json(
                    { error: 'Failed to fetch property', details: propErr.message },
                    { status: 500 },
                );
            }
            return NextResponse.json({
                property,
                column,
                createdAtMs: Date.now() - startedAt,
            });
        }

        return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    } catch (error) {
        console.error('Columns API POST error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create column/property',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
