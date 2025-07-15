import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/supabaseServer';

interface IntegrationStatus {
    connected: boolean;
    lastConnected?: Date;
    userEmail?: string;
    error?: string;
}

interface IntegrationsResponse {
    google: IntegrationStatus;
    github: IntegrationStatus;
    jira: IntegrationStatus;
    slack: IntegrationStatus;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> },
) {
    try {
        const { orgId } = await params;
        const supabase = await createClient();

        // Get the current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }

        // Verify user has access to this organization
        const { data: membership, error: membershipError } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgId)
            .eq('user_id', user.id)
            .single();

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get integration status from Supabase Vault
        // For now, we'll return mock data until Supabase Vault is fully implemented
        const integrations: IntegrationsResponse = {
            google: { connected: false },
            github: { connected: false },
            jira: { connected: false },
            slack: { connected: false },
        };

        // TODO: Replace with actual Supabase Vault queries
        // Check for stored OAuth tokens for each provider
        try {
            // Example of how this would work with Supabase Vault:
            // const { data: googleToken } = await supabase
            //     .from('vault')
            //     .select('*')
            //     .eq('name', `oauth_${orgId}_google`)
            //     .single();

            // if (googleToken) {
            //     integrations.google = {
            //         connected: true,
            //         lastConnected: new Date(googleToken.created_at),
            //         userEmail: googleToken.metadata?.userEmail,
            //     };
            // }

            // For demonstration, let's simulate some connected integrations
            // This would be replaced with actual vault queries
            const mockConnectedIntegrations =
                process.env.NODE_ENV === 'development';

            if (mockConnectedIntegrations) {
                integrations.github = {
                    connected: true,
                    lastConnected: new Date(Date.now() - 86400000), // 1 day ago
                    userEmail: user.email || 'user@example.com',
                };
            }
        } catch (error) {
            console.error('Error checking integration status:', error);
            // Continue with default disconnected state
        }

        return NextResponse.json(integrations);
    } catch (error) {
        console.error('Error in integrations GET:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> },
) {
    try {
        const { orgId } = await params;
        const body = await request.json();
        const { provider, action, tokenData } = body;
        const supabase = await createClient();

        // Get the current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }

        // Verify user has access to this organization
        const { data: membership, error: membershipError } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgId)
            .eq('user_id', user.id)
            .single();

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (action === 'connect' && tokenData) {
            // Store OAuth token in Supabase Vault
            // TODO: Implement actual Supabase Vault storage
            // const vaultKey = `oauth_${orgId}_${provider}`;
            // const { error: vaultError } = await supabase
            //     .from('vault')
            //     .upsert({
            //         name: vaultKey,
            //         secret: JSON.stringify(tokenData),
            //         metadata: {
            //             provider,
            //             organizationId: orgId,
            //             userId: user.id,
            //             userEmail: user.email,
            //             connectedAt: new Date().toISOString(),
            //         },
            //     });

            // if (vaultError) {
            //     console.error('Error storing OAuth token:', vaultError);
            //     return NextResponse.json(
            //         { error: 'Failed to store integration' },
            //         { status: 500 }
            //     );
            // }

            console.log(
                `Mock: Storing ${provider} OAuth token for org ${orgId}`,
            );

            return NextResponse.json({
                success: true,
                message: `${provider} integration connected successfully`,
            });
        }

        if (action === 'disconnect') {
            // Remove OAuth token from Supabase Vault
            // TODO: Implement actual Supabase Vault removal
            // const vaultKey = `oauth_${orgId}_${provider}`;
            // const { error: vaultError } = await supabase
            //     .from('vault')
            //     .delete()
            //     .eq('name', vaultKey);

            // if (vaultError) {
            //     console.error('Error removing OAuth token:', vaultError);
            //     return NextResponse.json(
            //         { error: 'Failed to remove integration' },
            //         { status: 500 }
            //     );
            // }

            console.log(
                `Mock: Removing ${provider} OAuth token for org ${orgId}`,
            );

            return NextResponse.json({
                success: true,
                message: `${provider} integration disconnected successfully`,
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error in integrations POST:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
