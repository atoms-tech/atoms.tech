import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createServerClient } from '@/lib/database';
import { userInstallSchema, adminInstallSchema } from '@/lib/schemas/mcp-install';
import { logger } from '@/lib/utils/logger';
import { validateMCPServerURL } from '@/lib/utils/mcp-url-validation';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mcp/servers/install
 * User-initiated MCP server installation
 */
export async function POST(request: NextRequest) {
    try {
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const supabase = await createServerClient();
        const body = await request.json();

        // Check if user is platform admin
        const { data: adminCheck } = await supabase
            .from('platform_admins')
            .select('id')
            .eq('user_id', profile.id)
            .single();

        const isAdmin = !!adminCheck;

        // Validate based on user role
        const validatedData = isAdmin
            ? adminInstallSchema.parse(body)
            : userInstallSchema.parse(body);

        // Validate organization access if org scope
        if (validatedData.scope === 'organization') {
            if (!validatedData.organization_id) {
                return NextResponse.json(
                    { error: 'Organization ID is required for organization scope' },
                    { status: 400 }
                );
            }

            const { data: membership } = await supabase
                .from('organization_members')
                .select('id')
                .eq('organization_id', validatedData.organization_id)
                .eq('user_id', profile.id)
                .single();

            if (!membership) {
                return NextResponse.json(
                    { error: 'You are not a member of this organization' },
                    { status: 403 }
                );
            }
        }

        const now = new Date().toISOString();
        const slugify = (value: string) =>
            value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 60);

        const namespace = `user:${profile.id}:${slugify(validatedData.name) || 'server'}`;

        // Validate URL for HTTP/SSE transports
        if (validatedData.transport === 'http' || validatedData.transport === 'sse') {
            const urlValidation = validateMCPServerURL(validatedData.url, validatedData.transport);

            if (!urlValidation.valid) {
                return NextResponse.json(
                    { error: 'Invalid server URL', details: urlValidation.error },
                    { status: 400 }
                );
            }

            if (urlValidation.warning) {
                logger.warn('MCP server URL warning', {
                    route: '/api/mcp/servers/install',
                    url: validatedData.url,
                    warning: urlValidation.warning,
                });
            }

            // Use normalized URL if provided
            if (urlValidation.normalizedUrl) {
                validatedData.url = urlValidation.normalizedUrl;
            }
        }

        // Build transport config
        const transportConfig =
            'command' in validatedData && validatedData.transport === 'stdio'
                ? {
                      type: 'stdio',
                      command: validatedData.command,
                      args: validatedData.args || [],
                      env: validatedData.env_vars || {},
                  }
                : {
                      type: validatedData.transport,
                      url: validatedData.url,
                  };

        // Build auth config
        const authConfig =
            validatedData.auth === 'bearer'
                ? { bearerToken: validatedData.token }
                : validatedData.auth === 'oauth'
                  ? { oauthConfigured: false }
                  : null;

        // Build stdio config
        const stdioConfig =
            'command' in validatedData && validatedData.transport === 'stdio'
                ? {
                      command: validatedData.command,
                      workingDirectory: null,
                      environmentVariables: validatedData.env_vars || {},
                  }
                : null;

        // Insert server configuration
        const { data: server, error } = await supabase
            .from('mcp_servers')
            .insert({
                namespace,
                name: validatedData.name,
                description: null,
                version: '1.0.0',
                transport_type: validatedData.transport,
                transport: transportConfig,
                source: 'custom',
                tier: 'community',
                enabled: true,
                url: validatedData.transport === 'stdio' ? 'stdio://local' : validatedData.url,
                auth_type: validatedData.auth === 'none' ? 'bearer' : validatedData.auth,
                auth_config: authConfig,
                tags: [],
                category: null,
                scope: validatedData.scope,
                user_id: validatedData.scope === 'user' ? profile.id : null,
                organization_id:
                    validatedData.scope === 'organization' ? validatedData.organization_id : null,
                project_id: null,
                created_by: profile.id,
                created_at: now,
                updated_at: now,
                metadata: null,
                env: validatedData.transport === 'stdio' ? validatedData.env_vars || {} : null,
                transport_config: stdioConfig,
            })
            .select()
            .single();

        if (error) {
            logger.error('Error installing MCP server', error, {
                route: '/api/mcp/servers/install',
            });
            return NextResponse.json(
                { error: 'Failed to install server', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ server, message: 'Server installed successfully' }, { status: 201 });
    } catch (error) {
        logger.error('MCP server install error', error, { route: '/api/mcp/servers/install' });
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

