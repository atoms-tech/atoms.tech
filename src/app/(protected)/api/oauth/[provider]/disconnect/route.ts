import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/supabaseServer';

interface MCPIntegrations {
    [key: string]: {
        connected: boolean;
        lastDisconnected?: string;
        disconnectedBy?: string;
    };
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> },
) {
    try {
        const { provider } = await params;
        const body = await request.json();
        const { orgId } = body;

        if (!orgId) {
            return NextResponse.json(
                { error: 'Organization ID required' },
                { status: 400 },
            );
        }

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

        // Remove OAuth token from Supabase Vault
        // TODO: Replace with actual Supabase Vault implementation
        const vaultKey = `oauth_${orgId}_${provider}`;

        console.log(
            `Mock: Removing OAuth token for ${provider} with vault key: ${vaultKey}`,
        );

        // For now, we'll simulate the vault removal
        // In a real implementation, this would be:
        // const { error: vaultError } = await supabase
        //     .from('vault')
        //     .delete()
        //     .eq('name', vaultKey);

        // if (vaultError) {
        //     console.error('Error removing OAuth token from vault:', vaultError);
        //     return NextResponse.json(
        //         { error: 'Failed to remove integration' },
        //         { status: 500 }
        //     );
        // }

        // Update integration status in organization settings
        try {
            const { data: settings, error: settingsError } = await supabase
                .from('organization_agent_settings')
                .select('mcp_integrations')
                .eq('organization_id', orgId)
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') {
                console.error(
                    'Error fetching integration settings:',
                    settingsError,
                );
                return NextResponse.json(
                    { error: 'Failed to update integration status' },
                    { status: 500 },
                );
            }

            const currentIntegrations =
                (settings?.mcp_integrations as MCPIntegrations) || {};
            const updatedIntegrations = {
                ...currentIntegrations,
                [provider]: {
                    connected: false,
                    lastDisconnected: new Date().toISOString(),
                    disconnectedBy: user.id,
                },
            };

            const { error: updateError } = await supabase
                .from('organization_agent_settings')
                .upsert({
                    organization_id: orgId,
                    mcp_integrations: updatedIntegrations,
                    updated_at: new Date().toISOString(),
                });

            if (updateError) {
                console.error(
                    'Error updating integration status:',
                    updateError,
                );
                return NextResponse.json(
                    { error: 'Failed to update integration status' },
                    { status: 500 },
                );
            }
        } catch (err) {
            console.error('Error updating integration status:', err);
            return NextResponse.json(
                { error: 'Failed to update integration status' },
                { status: 500 },
            );
        }

        // Optionally revoke the token with the OAuth provider
        // This is provider-specific and should be implemented for each provider
        try {
            await revokeProviderToken(provider, vaultKey);
        } catch (err) {
            console.warn(`Failed to revoke token with ${provider}:`, err);
            // Continue anyway - the token is removed from our system
        }

        return NextResponse.json({
            success: true,
            message: `${provider} integration disconnected successfully`,
        });
    } catch (error) {
        console.error(`Error in ${params} OAuth disconnect:`, error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

async function revokeProviderToken(provider: string, vaultKey: string) {
    // TODO: Implement token revocation for each provider
    // This would involve:
    // 1. Retrieving the token from vault
    // 2. Making a revocation request to the provider's revoke endpoint
    // 3. Handling provider-specific revocation logic

    console.log(`Mock: Revoking ${provider} token with key: ${vaultKey}`);

    switch (provider) {
        case 'google':
            // Google revocation endpoint: https://oauth2.googleapis.com/revoke
            // POST with token parameter
            break;
        case 'github':
            // GitHub doesn't have a standard revocation endpoint
            // The token becomes invalid when removed from our system
            break;
        case 'jira':
            // Atlassian revocation would be handled through their API
            break;
        case 'slack':
            // Slack revocation: https://slack.com/api/auth.revoke
            break;
        default:
            console.warn(`No revocation handler for provider: ${provider}`);
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> },
) {
    // Handle POST requests the same way as DELETE for flexibility
    return DELETE(request, { params });
}
