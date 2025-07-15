import { NextRequest, NextResponse } from 'next/server';

import { oauthManager } from '@/lib/integrations/oauth/oauthManager';
import { OAuthProviderType } from '@/lib/integrations/oauth/types';
import { createClient } from '@/lib/supabase/supabaseServer';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');
        const provider = searchParams.get('provider') as OAuthProviderType;

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 },
            );
        }

        // Verify user has access to organization
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }

        // Check organization membership
        const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single();

        if (!membership) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 },
            );
        }

        if (provider) {
            // Get specific integration status
            const integration = await oauthManager.getIntegrationStatus(
                organizationId,
                provider,
            );
            return NextResponse.json({ integration });
        } else {
            // Get all integrations for organization
            const { data: integrations, error } = await (
                supabase as unknown as {
                    from: (table: string) => {
                        select: (columns?: string) => {
                            eq: (
                                column: string,
                                value: unknown,
                            ) => Promise<{ data: unknown; error: unknown }>;
                        };
                    };
                }
            )
                .from('oauth_integrations')
                .select('*')
                .eq('organization_id', organizationId);

            if (error) {
                console.error('Failed to fetch integrations:', error);
                return NextResponse.json(
                    { error: 'Failed to fetch integrations' },
                    { status: 500 },
                );
            }

            return NextResponse.json({ integrations });
        }
    } catch (error) {
        console.error('OAuth API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { organizationId, provider, action } = body;

        if (!organizationId || !provider || !action) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 },
            );
        }

        // Verify user has access to organization
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }

        // Check organization membership and admin role
        const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single();

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 },
            );
        }

        switch (action) {
            case 'connect': {
                // Generate OAuth authorization URL
                const authUrl = await oauthManager.generateAuthUrl(
                    provider as OAuthProviderType,
                    organizationId,
                    user.id,
                    body.returnTo,
                );
                return NextResponse.json({ authUrl });
            }

            case 'disconnect': {
                // Disconnect OAuth integration
                await oauthManager.disconnect(
                    organizationId,
                    provider as OAuthProviderType,
                );
                return NextResponse.json({ success: true });
            }

            case 'test': {
                // Test OAuth connection
                const isConnected = await oauthManager.testConnection(
                    organizationId,
                    provider as OAuthProviderType,
                );
                return NextResponse.json({ connected: isConnected });
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 },
                );
        }
    } catch (error) {
        console.error('OAuth API error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Internal server error',
            },
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');
        const provider = searchParams.get('provider') as OAuthProviderType;

        if (!organizationId || !provider) {
            return NextResponse.json(
                { error: 'Organization ID and provider are required' },
                { status: 400 },
            );
        }

        // Verify user has access to organization
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }

        // Check organization membership and admin role
        const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single();

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 },
            );
        }

        // Disconnect the integration
        await oauthManager.disconnect(organizationId, provider);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('OAuth delete error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Internal server error',
            },
            { status: 500 },
        );
    }
}
