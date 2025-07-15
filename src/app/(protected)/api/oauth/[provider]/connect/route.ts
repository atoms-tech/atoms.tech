import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/supabaseServer';

const OAUTH_CONFIGS = {
    google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scopes: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/calendar.readonly',
        ],
        clientId: process.env.GOOGLE_CLIENT_ID,
    },
    github: {
        authUrl: 'https://github.com/login/oauth/authorize',
        scopes: ['user:email', 'repo', 'read:org'],
        clientId: process.env.GITHUB_CLIENT_ID,
    },
    jira: {
        authUrl: 'https://auth.atlassian.com/authorize',
        scopes: ['read:jira-work', 'write:jira-work', 'read:jira-user'],
        clientId: process.env.JIRA_CLIENT_ID,
    },
    slack: {
        authUrl: 'https://slack.com/oauth/v2/authorize',
        scopes: ['channels:read', 'chat:write', 'users:read', 'team:read'],
        clientId: process.env.SLACK_CLIENT_ID,
    },
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> },
) {
    try {
        const { provider } = await params;
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

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

        // Get OAuth configuration for the provider
        const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS];
        if (!config || !config.clientId) {
            return NextResponse.json(
                { error: `OAuth not configured for ${provider}` },
                { status: 400 },
            );
        }

        // Generate state parameter for security
        const state = Buffer.from(
            JSON.stringify({
                orgId,
                userId: user.id,
                provider,
                timestamp: Date.now(),
            }),
        ).toString('base64url');

        // Build OAuth URL
        const authUrl = new URL(config.authUrl);
        authUrl.searchParams.set('client_id', config.clientId);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', config.scopes.join(' '));
        authUrl.searchParams.set('state', state);

        // Set redirect URI
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/${provider}/callback`;
        authUrl.searchParams.set('redirect_uri', redirectUri);

        // For Jira, add audience parameter
        if (provider === 'jira') {
            authUrl.searchParams.set('audience', 'api.atlassian.com');
            authUrl.searchParams.set('prompt', 'consent');
        }

        // For Slack, use different parameter names
        if (provider === 'slack') {
            authUrl.searchParams.delete('response_type');
            authUrl.searchParams.delete('scope');
            authUrl.searchParams.set('scope', config.scopes.join(','));
        }

        // Redirect to OAuth provider
        return NextResponse.redirect(authUrl.toString());
    } catch (error) {
        console.error(`Error in ${params} OAuth connect:`, error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function POST(
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

        // Get OAuth configuration for the provider
        const config = OAUTH_CONFIGS[provider as keyof typeof OAUTH_CONFIGS];
        if (!config || !config.clientId) {
            return NextResponse.json(
                { error: `OAuth not configured for ${provider}` },
                { status: 400 },
            );
        }

        // Generate state parameter for security
        const state = Buffer.from(
            JSON.stringify({
                orgId,
                userId: user.id,
                provider,
                timestamp: Date.now(),
            }),
        ).toString('base64url');

        // Build OAuth URL
        const authUrl = new URL(config.authUrl);
        authUrl.searchParams.set('client_id', config.clientId);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', config.scopes.join(' '));
        authUrl.searchParams.set('state', state);

        // Set redirect URI
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/${provider}/callback`;
        authUrl.searchParams.set('redirect_uri', redirectUri);

        // For Jira, add audience parameter
        if (provider === 'jira') {
            authUrl.searchParams.set('audience', 'api.atlassian.com');
            authUrl.searchParams.set('prompt', 'consent');
        }

        // For Slack, use different parameter names
        if (provider === 'slack') {
            authUrl.searchParams.delete('response_type');
            authUrl.searchParams.delete('scope');
            authUrl.searchParams.set('scope', config.scopes.join(','));
        }

        return NextResponse.json({ authUrl: authUrl.toString() });
    } catch (error) {
        console.error(`Error in ${params} OAuth connect POST:`, error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
