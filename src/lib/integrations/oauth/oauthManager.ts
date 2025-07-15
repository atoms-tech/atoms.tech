import { supabase as supabaseClient } from '@/lib/supabase/supabaseBrowser';

import { supabaseVault } from './supabaseVault';
import {
    IntegrationError,
    OAuthError,
    OAuthIntegration,
    OAuthProviderType,
    OAuthToken,
} from './types';

// Type for Supabase query builder
interface SupabaseQueryBuilder {
    select: (columns?: string) => SupabaseQueryBuilder;
    insert: (data: Record<string, unknown>) => SupabaseQueryBuilder;
    update: (data: Record<string, unknown>) => SupabaseQueryBuilder;
    delete: () => SupabaseQueryBuilder;
    upsert: (data: Record<string, unknown>) => SupabaseQueryBuilder;
    eq: (column: string, value: unknown) => SupabaseQueryBuilder;
    single: () => Promise<{ data: unknown; error: unknown }>;
}

// Type for extended Supabase client with custom tables
type ExtendedSupabaseClient = typeof supabaseClient & {
    from(table: 'oauth_integrations'): SupabaseQueryBuilder;
};

export class OAuthManager {
    private supabase = supabaseClient as ExtendedSupabaseClient;

    // OAuth Provider Configurations
    private providers = {
        google: {
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scopes: [
                'openid',
                'profile',
                'email',
                'https://www.googleapis.com/auth/drive.readonly',
            ],
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        },
        github: {
            authUrl: 'https://github.com/login/oauth/authorize',
            tokenUrl: 'https://github.com/login/oauth/access_token',
            scopes: ['user:email', 'repo', 'read:org'],
            clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
        },
        jira: {
            authUrl: 'https://auth.atlassian.com/authorize',
            tokenUrl: 'https://auth.atlassian.com/oauth/token',
            scopes: ['read:jira-work', 'write:jira-work', 'read:jira-user'],
            clientId: process.env.NEXT_PUBLIC_JIRA_CLIENT_ID!,
        },
        slack: {
            authUrl: 'https://slack.com/oauth/v2/authorize',
            tokenUrl: 'https://slack.com/api/oauth.v2.access',
            scopes: ['channels:read', 'chat:write', 'users:read'],
            clientId: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
        },
    };

    /**
     * Generate OAuth authorization URL
     */
    async generateAuthUrl(
        provider: OAuthProviderType,
        organizationId: string,
        userId: string,
        returnTo?: string,
    ): Promise<string> {
        try {
            const config = this.providers[provider];
            if (!config) {
                throw new IntegrationError(
                    `Unsupported provider: ${provider}`,
                    'INVALID_PROVIDER',
                );
            }

            const state = this.generateState(organizationId, userId, returnTo);
            const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback/${provider}`;

            const params = new URLSearchParams({
                client_id: config.clientId,
                redirect_uri: redirectUri,
                scope: config.scopes.join(' '),
                response_type: 'code',
                state,
                access_type: 'offline', // For refresh tokens
                prompt: 'consent', // Force consent screen
            });

            return `${config.authUrl}?${params.toString()}`;
        } catch (error) {
            console.error('Failed to generate auth URL:', error);
            throw new IntegrationError(
                'Failed to generate authorization URL',
                'AUTH_URL_GENERATION_FAILED',
                provider,
            );
        }
    }

    /**
     * Handle OAuth callback and exchange code for tokens
     */
    async handleCallback(
        provider: OAuthProviderType,
        code: string,
        state: string,
    ): Promise<OAuthIntegration> {
        try {
            const { organizationId, userId } = this.parseState(state);
            const tokens = await this.exchangeCodeForTokens(provider, code);

            // Store tokens in Supabase Vault
            const accessTokenKey = await supabaseVault.storeSecret(
                organizationId,
                `oauth_${provider}_access_token`,
                tokens.access_token,
            );

            let refreshTokenKey: string | undefined;
            if (tokens.refresh_token) {
                refreshTokenKey = await supabaseVault.storeSecret(
                    organizationId,
                    `oauth_${provider}_refresh_token`,
                    tokens.refresh_token,
                );
            }

            // Save integration to database
            const integration = await this.saveIntegration({
                organization_id: organizationId,
                provider,
                access_token_vault_key: accessTokenKey,
                refresh_token_vault_key: refreshTokenKey,
                expires_at: tokens.expires_at
                    ? new Date(tokens.expires_at * 1000)
                    : undefined,
                scopes: this.providers[provider].scopes,
                user_id: userId,
                status: 'active',
            });

            return integration;
        } catch (error) {
            console.error('OAuth callback failed:', error);
            if (error instanceof IntegrationError) {
                throw error;
            }
            throw new OAuthError(
                'OAuth callback processing failed',
                'CALLBACK_PROCESSING_FAILED',
                error instanceof Error ? error.message : 'Unknown error',
                provider,
            );
        }
    }

    /**
     * Disconnect OAuth integration
     */
    async disconnect(
        organizationId: string,
        provider: OAuthProviderType,
    ): Promise<void> {
        try {
            // Get existing integration
            const { data: integration, error } = await this.supabase
                .from('oauth_integrations')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('provider', provider)
                .single();

            if (error || !integration) {
                throw new IntegrationError(
                    'Integration not found',
                    'INTEGRATION_NOT_FOUND',
                    provider,
                );
            }

            // Remove tokens from vault
            await supabaseVault.deleteSecret(
                organizationId,
                integration.access_token_vault_key,
            );
            if (integration.refresh_token_vault_key) {
                await supabaseVault.deleteSecret(
                    organizationId,
                    integration.refresh_token_vault_key,
                );
            }

            // Update integration status
            const { error: updateError } = await this.supabase
                .from('oauth_integrations')
                .update({ status: 'revoked', updated_at: new Date() })
                .eq('id', integration.id);

            if (updateError) {
                throw new IntegrationError(
                    'Failed to update integration status',
                    'UPDATE_FAILED',
                    provider,
                );
            }
        } catch (error) {
            console.error('Failed to disconnect integration:', error);
            if (error instanceof IntegrationError) {
                throw error;
            }
            throw new IntegrationError(
                'Failed to disconnect integration',
                'DISCONNECT_FAILED',
                provider,
            );
        }
    }

    /**
     * Get integration status
     */
    async getIntegrationStatus(
        organizationId: string,
        provider: OAuthProviderType,
    ): Promise<OAuthIntegration | null> {
        try {
            const { data, error } = await this.supabase
                .from('oauth_integrations')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('provider', provider)
                .eq('status', 'active')
                .single();

            if (error && error.code !== 'PGRST116') {
                // PGRST116 = no rows returned
                throw new IntegrationError(
                    'Failed to fetch integration status',
                    'FETCH_FAILED',
                    provider,
                );
            }

            return data || null;
        } catch (error) {
            console.error('Failed to get integration status:', error);
            if (error instanceof IntegrationError) {
                throw error;
            }
            throw new IntegrationError(
                'Failed to get integration status',
                'STATUS_FETCH_FAILED',
                provider,
            );
        }
    }

    /**
     * Test integration connection
     */
    async testConnection(
        organizationId: string,
        provider: OAuthProviderType,
    ): Promise<boolean> {
        try {
            const integration = await this.getIntegrationStatus(
                organizationId,
                provider,
            );
            if (!integration) {
                return false;
            }

            const accessToken = await supabaseVault.getSecret(
                organizationId,
                integration.access_token_vault_key,
            );

            // Test API call based on provider
            const testEndpoints = {
                google: 'https://www.googleapis.com/oauth2/v1/userinfo',
                github: 'https://api.github.com/user',
                jira: 'https://api.atlassian.com/me',
                slack: 'https://slack.com/api/auth.test',
            };

            const response = await fetch(testEndpoints[provider], {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            return response.ok;
        } catch (_error) {
            console.error('Connection test failed:', _error);
            return false;
        }
    }

    // Private helper methods
    private generateState(
        organizationId: string,
        userId: string,
        returnTo?: string,
    ): string {
        const stateData = {
            organizationId,
            userId,
            returnTo,
            timestamp: Date.now(),
        };
        return Buffer.from(JSON.stringify(stateData)).toString('base64');
    }

    private parseState(state: string): {
        organizationId: string;
        userId: string;
        returnTo?: string;
    } {
        try {
            const decoded = Buffer.from(state, 'base64').toString('utf-8');
            const stateData = JSON.parse(decoded);

            // Validate timestamp (state should be used within 10 minutes)
            if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
                throw new OAuthError('State expired', 'EXPIRED_STATE');
            }

            return stateData;
        } catch {
            throw new OAuthError('Invalid state parameter', 'INVALID_STATE');
        }
    }

    private async exchangeCodeForTokens(
        provider: OAuthProviderType,
        code: string,
    ): Promise<OAuthToken> {
        const config = this.providers[provider];
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback/${provider}`;

        const params = new URLSearchParams({
            client_id: config.clientId,
            client_secret:
                process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]!,
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
        });

        const response = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new OAuthError(
                'Token exchange failed',
                (errorData as { error?: string }).error ||
                    'TOKEN_EXCHANGE_FAILED',
                (errorData as { error_description?: string }).error_description,
                provider,
            );
        }

        return (await response.json()) as OAuthToken;
    }

    private async saveIntegration(
        data: Omit<OAuthIntegration, 'id' | 'created_at' | 'updated_at'>,
    ): Promise<OAuthIntegration> {
        const { data: integration, error } = await this.supabase
            .from('oauth_integrations')
            .upsert({
                ...data,
                created_at: new Date(),
                updated_at: new Date(),
            })
            .select()
            .single();

        if (error) {
            throw new IntegrationError(
                'Failed to save integration',
                'SAVE_FAILED',
                data.provider,
            );
        }

        return integration;
    }
}

export const oauthManager = new OAuthManager();
