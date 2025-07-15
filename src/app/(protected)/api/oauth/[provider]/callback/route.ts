import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/supabaseServer';

interface MCPIntegrations {
    [key: string]: {
        connected: boolean;
        lastConnected?: string;
        userEmail?: string | null;
        connectedBy?: string;
    };
}

const TOKEN_ENDPOINTS = {
    google: 'https://oauth2.googleapis.com/token',
    github: 'https://github.com/login/oauth/access_token',
    jira: 'https://auth.atlassian.com/oauth/token',
    slack: 'https://slack.com/api/oauth.v2.access',
};

const CLIENT_SECRETS = {
    google: process.env.GOOGLE_CLIENT_SECRET,
    github: process.env.GITHUB_CLIENT_SECRET,
    jira: process.env.JIRA_CLIENT_SECRET,
    slack: process.env.SLACK_CLIENT_SECRET,
};

const CLIENT_IDS = {
    google: process.env.GOOGLE_CLIENT_ID,
    github: process.env.GITHUB_CLIENT_ID,
    jira: process.env.JIRA_CLIENT_ID,
    slack: process.env.SLACK_CLIENT_ID,
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> },
) {
    try {
        const { provider } = await params;
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Handle OAuth errors
        if (error) {
            const errorDescription =
                searchParams.get('error_description') ||
                'OAuth authorization failed';
            console.error(
                `OAuth error for ${provider}:`,
                error,
                errorDescription,
            );
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/org/error?message=${encodeURIComponent(errorDescription)}`,
            );
        }

        if (!code || !state) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/org/error?message=Missing authorization code or state`,
            );
        }

        // Decode and validate state
        let stateData;
        try {
            stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
        } catch (err) {
            console.error('Invalid state parameter:', err);
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/org/error?message=Invalid state parameter`,
            );
        }

        const { orgId, userId, provider: stateProvider, timestamp } = stateData;

        // Validate state
        if (stateProvider !== provider) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/org/error?message=Provider mismatch`,
            );
        }

        // Check if state is not too old (10 minutes)
        if (Date.now() - timestamp > 10 * 60 * 1000) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/org/error?message=Authorization expired`,
            );
        }

        const supabase = await createClient();

        // Verify user still has access to organization
        const { data: membership, error: membershipError } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgId)
            .eq('user_id', userId)
            .single();

        if (membershipError || !membership) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/org/error?message=Access denied`,
            );
        }

        // Exchange code for access token
        const tokenEndpoint =
            TOKEN_ENDPOINTS[provider as keyof typeof TOKEN_ENDPOINTS];
        const clientSecret =
            CLIENT_SECRETS[provider as keyof typeof CLIENT_SECRETS];
        const clientId = CLIENT_IDS[provider as keyof typeof CLIENT_IDS];

        if (!tokenEndpoint || !clientSecret || !clientId) {
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/org/error?message=OAuth not configured for ${provider}`,
            );
        }

        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/${provider}/callback`;

        const tokenResponse = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error(`Token exchange failed for ${provider}:`, errorText);
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/org/error?message=Token exchange failed`,
            );
        }

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error(`Token error for ${provider}:`, tokenData.error);
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/org/error?message=${tokenData.error_description || tokenData.error}`,
            );
        }

        // Get user info from the provider
        let userInfo = null;
        try {
            if (provider === 'google') {
                const userResponse = await fetch(
                    'https://www.googleapis.com/oauth2/v2/userinfo',
                    {
                        headers: {
                            Authorization: `Bearer ${tokenData.access_token}`,
                        },
                    },
                );
                if (userResponse.ok) {
                    userInfo = await userResponse.json();
                }
            } else if (provider === 'github') {
                const userResponse = await fetch(
                    'https://api.github.com/user',
                    {
                        headers: {
                            Authorization: `Bearer ${tokenData.access_token}`,
                            'User-Agent': 'Atoms-Tech-App',
                        },
                    },
                );
                if (userResponse.ok) {
                    userInfo = await userResponse.json();
                }
            }
            // Add other providers as needed
        } catch (err) {
            console.error(`Error fetching user info for ${provider}:`, err);
        }

        // Store the token in Supabase Vault (mock implementation for now)
        // TODO: Replace with actual Supabase Vault implementation
        const vaultKey = `oauth_${orgId}_${provider}`;
        const vaultData = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type,
            scope: tokenData.scope,
            userInfo,
            connectedAt: new Date().toISOString(),
            connectedBy: userId,
        };

        console.log(
            `Mock: Storing OAuth token for ${provider} in vault with key: ${vaultKey}`,
        );
        console.log('Token data (truncated):', {
            ...vaultData,
            access_token: vaultData.access_token?.substring(0, 10) + '...',
            refresh_token: vaultData.refresh_token?.substring(0, 10) + '...',
        });

        // Update integration status in organization settings
        try {
            const { data: settings, error: _settingsError } = await supabase
                .from('organization_agent_settings')
                .select('mcp_integrations')
                .eq('organization_id', orgId)
                .single();

            const currentIntegrations =
                (settings?.mcp_integrations as MCPIntegrations) || {};
            const updatedIntegrations = {
                ...currentIntegrations,
                [provider]: {
                    connected: true,
                    lastConnected: new Date().toISOString(),
                    userEmail: userInfo?.email || null,
                    connectedBy: userId,
                },
            };

            await supabase.from('organization_agent_settings').upsert({
                organization_id: orgId,
                mcp_integrations: updatedIntegrations,
                updated_at: new Date().toISOString(),
            });
        } catch (err) {
            console.error('Error updating integration status:', err);
        }

        // Redirect back to settings page with success message
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/org/${orgId}/settings/agent?tab=integrations&connected=${provider}`,
        );
    } catch (error) {
        console.error(`Error in ${params} OAuth callback:`, error);
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/org/error?message=OAuth callback failed`,
        );
    }
}
