import { useMutation, useQuery } from '@tanstack/react-query';

interface OAuthStartParams {
    providerKey: string;
    mcpNamespace: string;
    organizationId?: string;
    scopes?: string[];
    authMetadata?: Record<string, unknown> | null;
}

interface OAuthTransaction {
    transaction_id: string;
    authorization_url: string;
    state: string;
    provider_key: string;
    mcp_namespace: string;
    status: 'pending' | 'completed' | 'failed' | 'expired';
    created_at: string;
    expires_at: string;
}

interface OAuthStatusResponse {
    transaction: OAuthTransaction;
    auth_result?: {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        token_type?: string;
        scope?: string;
    };
}

/**
 * Start OAuth flow for MCP server
 */
export function useStartOAuthFlow() {
    return useMutation({
        mutationFn: async (params: OAuthStartParams) => {
            const res = await fetch('/api/mcp/oauth/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to start OAuth flow');
            }

            const data = await res.json();
            return data.transaction as OAuthTransaction;
        },
    });
}

/**
 * Check OAuth transaction status
 */
export function useOAuthStatus(transactionId: string | null, enabled = true) {
    return useQuery<OAuthStatusResponse>({
        queryKey: ['oauth-status', transactionId],
        queryFn: async () => {
            if (!transactionId) {
                throw new Error('No transaction ID');
            }

            const res = await fetch(`/api/mcp/oauth/status/${transactionId}`);

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to check OAuth status');
            }

            return res.json();
        },
        enabled: enabled && !!transactionId,
        refetchInterval: (data) => {
            // Stop polling if completed or failed
            if (data?.transaction?.status === 'completed' || data?.transaction?.status === 'failed') {
                return false;
            }
            // Poll every 2 seconds while pending
            return 2000;
        },
    });
}

/**
 * Get available OAuth providers
 */
export function useOAuthProviders() {
    return useQuery<Array<{ key: string; name: string; scopes?: string[] }>>({
        queryKey: ['oauth-providers'],
        queryFn: async () => {
            const res = await fetch('/api/mcp/oauth/providers');

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to fetch OAuth providers');
            }

            const data = await res.json();
            return data.providers || [];
        },
    });
}

/**
 * Complete OAuth flow and update server
 */
export function useCompleteOAuthFlow() {
    return useMutation({
        mutationFn: async ({
            serverId,
            transactionId,
        }: {
            serverId: string;
            transactionId: string;
        }) => {
            // First, get the OAuth status to get the tokens
            const statusRes = await fetch(`/api/mcp/oauth/status/${transactionId}`);

            if (!statusRes.ok) {
                throw new Error('Failed to get OAuth status');
            }

            const statusData = await statusRes.json();

            if (statusData.transaction.status !== 'completed') {
                throw new Error('OAuth flow not completed');
            }

            // Update the server with the OAuth tokens
            const updateRes = await fetch(`/api/mcp/servers/${serverId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auth_config: {
                        oauthConfigured: true,
                        ...statusData.auth_result,
                    },
                }),
            });

            if (!updateRes.ok) {
                throw new Error('Failed to update server with OAuth tokens');
            }

            return updateRes.json();
        },
    });
}

