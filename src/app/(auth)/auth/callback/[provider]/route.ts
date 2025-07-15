import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

import { oauthManager } from '@/lib/integrations/oauth/oauthManager';
import { OAuthProviderType } from '@/lib/integrations/oauth/types';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> },
) {
    try {
        const resolvedParams = await params;
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const provider = resolvedParams.provider as OAuthProviderType;

        // Handle OAuth errors
        if (error) {
            console.error('OAuth error:', error);
            const errorDescription = searchParams.get('error_description');
            return redirect(
                `/org/settings/integrations?error=${encodeURIComponent(
                    errorDescription || error,
                )}&provider=${provider}`,
            );
        }

        // Validate required parameters
        if (!code || !state) {
            console.error('Missing required OAuth parameters');
            return redirect(
                `/org/settings/integrations?error=${encodeURIComponent(
                    'Missing authorization code or state parameter',
                )}&provider=${provider}`,
            );
        }

        // Validate provider
        if (!['google', 'github', 'jira', 'slack'].includes(provider)) {
            console.error('Invalid OAuth provider:', provider);
            return redirect(
                `/org/settings/integrations?error=${encodeURIComponent(
                    'Invalid OAuth provider',
                )}`,
            );
        }

        // Process OAuth callback
        const integration = await oauthManager.handleCallback(
            provider,
            code,
            state,
        );

        console.log('OAuth integration successful:', {
            provider,
            integrationId: integration.id,
            organizationId: integration.organization_id,
        });

        // Redirect back to integrations page with success message
        return redirect(
            `/org/${integration.organization_id}/settings/integrations?success=${encodeURIComponent(
                `Successfully connected to ${provider}`,
            )}&provider=${provider}`,
        );
    } catch (error) {
        console.error('OAuth callback error:', error);

        // Extract error message
        let errorMessage = 'OAuth connection failed';
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        // Try to extract organization ID from state for redirect
        let redirectPath = '/org/settings/integrations';
        try {
            const state = new URL(request.url).searchParams.get('state');
            if (state) {
                const stateData = JSON.parse(
                    Buffer.from(state, 'base64').toString('utf-8'),
                );
                if (stateData.organizationId) {
                    redirectPath = `/org/${stateData.organizationId}/settings/integrations`;
                }
            }
        } catch {
            // Ignore state parsing errors, use default redirect
        }

        const finalParams = await params;
        return redirect(
            `${redirectPath}?error=${encodeURIComponent(errorMessage)}&provider=${finalParams.provider}`,
        );
    }
}

// Handle POST requests (some OAuth providers use POST for callbacks)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> },
) {
    // For providers that use POST callbacks, extract data from body
    try {
        const resolvedParams = await params;
        const body = await request.json();
        const { code, state, error } = body;

        // Create a new URL with the parameters as search params
        const callbackUrl = new URL(request.url);
        if (code) callbackUrl.searchParams.set('code', code);
        if (state) callbackUrl.searchParams.set('state', state);
        if (error) callbackUrl.searchParams.set('error', error);

        // Create a new request with GET method
        const getRequest = new NextRequest(callbackUrl.toString(), {
            method: 'GET',
        });

        // Delegate to GET handler
        return GET(getRequest, { params: Promise.resolve(resolvedParams) });
    } catch (error) {
        console.error('OAuth POST callback error:', error);
        const finalParams = await params;
        return redirect(
            `/org/settings/integrations?error=${encodeURIComponent(
                'Invalid OAuth callback data',
            )}&provider=${finalParams.provider}`,
        );
    }
}
