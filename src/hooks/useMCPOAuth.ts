/**
 * useMCPOAuth Hook - MCP OAuth Management
 *
 * Production-ready React hook for managing MCP OAuth flows including:
 * - OAuth initialization and completion
 * - Token refresh and revocation
 * - Connection state management
 * - Automatic token refresh
 * - Error handling and recovery
 * - Window message handling for OAuth popups
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// Types
export type OAuthProvider = 'github' | 'google' | 'azure' | 'auth0';

export interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  token_type: string;
  scope: string;
  provider: OAuthProvider;
  mcp_name: string;
}

export interface OAuthState {
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  selectedProvider: string | null;
  tokens: Record<string, OAuthToken>;
}

export interface MCPOAuthHookReturn {
  // State
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  selectedProvider: string | null;

  // Methods
  initiateOAuth: (provider: OAuthProvider, mcpName: string) => Promise<void>;
  completeOAuth: (code: string, state: string) => Promise<void>;
  revokeConnection: (provider: OAuthProvider, mcpName: string) => Promise<void>;
  refreshToken: (provider: OAuthProvider, mcpName: string) => Promise<void>;
  getToken: (provider: OAuthProvider, mcpName: string) => OAuthToken | null;
  clearError: () => void;

  // Connection status
  getConnectionStatus: (provider: OAuthProvider, mcpName: string) => boolean;
}

// Constants
const OAUTH_CALLBACK_MESSAGE = 'mcp_oauth_callback';
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Helper Functions
function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || '';
}

function shouldRefreshToken(expiresAt: string): boolean {
  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  return expiryTime - now < TOKEN_EXPIRY_BUFFER;
}

function parseTokenKey(provider: OAuthProvider, mcpName: string): string {
  return `${provider}_${mcpName}`;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRY_ATTEMPTS
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      if (response.ok || attempt === retries - 1) {
        return response;
      }

      // Exponential backoff for retries
      const delay = RETRY_DELAY * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === retries - 1) {
        throw lastError;
      }

      // Wait before retrying
      const delay = RETRY_DELAY * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Main hook implementation
 */
export function useMCPOAuth(
  accessToken?: string,
  autoRefresh = true
): MCPOAuthHookReturn {
  // State
  const [state, setState] = useState<OAuthState>({
    isLoading: false,
    error: null,
    isConnected: false,
    selectedProvider: null,
    tokens: {},
  });

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const oauthWindowRef = useRef<Window | null>(null);
  const isUnmountedRef = useRef(false);

  // Safe state update that checks if component is mounted
  const safeSetState = useCallback((update: Partial<OAuthState> | ((prev: OAuthState) => Partial<OAuthState>)) => {
    if (!isUnmountedRef.current) {
      setState(prev => ({
        ...prev,
        ...(typeof update === 'function' ? update(prev) : update),
      }));
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    safeSetState({ error: null });
  }, [safeSetState]);

  /**
   * Get token for a specific provider and MCP
   */
  const getToken = useCallback((provider: OAuthProvider, mcpName: string): OAuthToken | null => {
    const key = parseTokenKey(provider, mcpName);
    return state.tokens[key] || null;
  }, [state.tokens]);

  /**
   * Get connection status for a specific provider and MCP
   */
  const getConnectionStatus = useCallback((provider: OAuthProvider, mcpName: string): boolean => {
    const token = getToken(provider, mcpName);

    if (!token) {
      return false;
    }

    // Check if token is expired
    const expiryTime = new Date(token.expires_at).getTime();
    const now = Date.now();

    return expiryTime > now;
  }, [getToken]);

  /**
   * Initiate OAuth flow
   */
  const initiateOAuth = useCallback(async (
    provider: OAuthProvider,
    mcpName: string
  ): Promise<void> => {
    if (!accessToken) {
      safeSetState({
        error: 'Authentication required. Please log in first.',
        isLoading: false,
      });
      return;
    }

    safeSetState({
      isLoading: true,
      error: null,
      selectedProvider: provider,
    });

    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetchWithRetry(
        `${apiUrl}/api/mcp/oauth/initiate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            provider,
            mcp_name: mcpName,
          }),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Unknown error',
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));

        throw new Error(errorData.message || errorData.error || 'Failed to initiate OAuth');
      }

      const data = await response.json();

      if (!data.success || !data.authorization_url) {
        throw new Error(data.error || 'Invalid response from server');
      }

      // Open OAuth popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      oauthWindowRef.current = window.open(
        data.authorization_url,
        'OAuth Authorization',
        `width=${width},height=${height},left=${left},top=${top},popup=yes`
      );

      if (!oauthWindowRef.current) {
        throw new Error('Failed to open OAuth popup. Please check popup blocker settings.');
      }

      // Monitor popup window
      const popupCheckInterval = setInterval(() => {
        if (oauthWindowRef.current?.closed) {
          clearInterval(popupCheckInterval);

          if (!isUnmountedRef.current) {
            safeSetState({
              isLoading: false,
              error: 'OAuth flow was cancelled',
            });
          }
        }
      }, 500);

    } catch (error) {
      console.error('OAuth initiation failed:', error);

      safeSetState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initiate OAuth flow',
        selectedProvider: null,
      });
    }
  }, [accessToken, safeSetState]);

  /**
   * Complete OAuth flow with code and state
   */
  const completeOAuth = useCallback(async (
    code: string,
    stateParam: string
  ): Promise<void> => {
    if (!accessToken) {
      safeSetState({
        error: 'Authentication required. Please log in first.',
        isLoading: false,
      });
      return;
    }

    safeSetState({ isLoading: true, error: null });

    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetchWithRetry(
        `${apiUrl}/api/mcp/oauth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(stateParam)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Unknown error',
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));

        throw new Error(errorData.message || errorData.error || 'OAuth callback failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'OAuth flow failed');
      }

      // Close OAuth popup if still open
      if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
        oauthWindowRef.current.close();
        oauthWindowRef.current = null;
      }

      safeSetState({
        isLoading: false,
        isConnected: true,
        error: null,
      });

    } catch (error) {
      console.error('OAuth completion failed:', error);

      safeSetState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to complete OAuth flow',
      });
    }
  }, [accessToken, safeSetState]);

  /**
   * Refresh OAuth token
   */
  const refreshToken = useCallback(async (
    provider: OAuthProvider,
    mcpName: string
  ): Promise<void> => {
    if (!accessToken) {
      return;
    }

    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetchWithRetry(
        `${apiUrl}/api/mcp/oauth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            provider,
            mcp_name: mcpName,
          }),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Token refresh failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Token refresh failed');
      }

      console.log(`Token refreshed successfully for ${provider}/${mcpName}`);

    } catch (error) {
      console.error('Token refresh failed:', error);

      // Don't update error state for background refresh failures
      // to avoid disrupting user experience
    }
  }, [accessToken]);

  /**
   * Revoke OAuth connection
   */
  const revokeConnection = useCallback(async (
    provider: OAuthProvider,
    mcpName: string
  ): Promise<void> => {
    if (!accessToken) {
      safeSetState({
        error: 'Authentication required. Please log in first.',
      });
      return;
    }

    safeSetState({ isLoading: true, error: null });

    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetchWithRetry(
        `${apiUrl}/api/mcp/oauth/revoke`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            provider,
            mcp_name: mcpName,
          }),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Token revocation failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Token revocation failed');
      }

      // Remove token from state
      const key = parseTokenKey(provider, mcpName);
      safeSetState(prev => {
        const newTokens = { ...prev.tokens };
        delete newTokens[key];

        return {
          isLoading: false,
          isConnected: Object.keys(newTokens).length > 0,
          tokens: newTokens,
          error: null,
        };
      });

    } catch (error) {
      console.error('Token revocation failed:', error);

      safeSetState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to revoke OAuth connection',
      });
    }
  }, [accessToken, safeSetState]);

  /**
   * Auto-refresh tokens that are about to expire
   */
  const autoRefreshTokens = useCallback(async () => {
    if (!autoRefresh || !accessToken) {
      return;
    }

    const tokensToRefresh: Array<{ provider: OAuthProvider; mcpName: string }> = [];

    // Find tokens that need refreshing
    Object.values(state.tokens).forEach(token => {
      if (shouldRefreshToken(token.expires_at) && token.refresh_token) {
        tokensToRefresh.push({
          provider: token.provider,
          mcpName: token.mcp_name,
        });
      }
    });

    // Refresh tokens in parallel
    if (tokensToRefresh.length > 0) {
      console.log(`Auto-refreshing ${tokensToRefresh.length} token(s)`);

      await Promise.allSettled(
        tokensToRefresh.map(({ provider, mcpName }) =>
          refreshToken(provider, mcpName)
        )
      );
    }
  }, [autoRefresh, accessToken, state.tokens, refreshToken]);

  /**
   * Handle OAuth callback from URL parameters
   */
  useEffect(() => {
    const handleCallbackFromUrl = async () => {
      if (typeof window === 'undefined') {
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const stateParam = params.get('state');

      if (code && stateParam) {
        // Clear URL parameters
        window.history.replaceState({}, '', window.location.pathname);

        // Complete OAuth flow
        await completeOAuth(code, stateParam);
      }
    };

    handleCallbackFromUrl();
  }, [completeOAuth]);

  /**
   * Handle window messages from OAuth popup
   */
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin for security
      const apiUrl = getApiBaseUrl();
      const allowedOrigins = [
        apiUrl,
        window.location.origin,
      ];

      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      if (event.data?.type === OAUTH_CALLBACK_MESSAGE) {
        const { code, state: stateParam, error } = event.data;

        if (error) {
          safeSetState({
            isLoading: false,
            error: `OAuth error: ${error}`,
          });
          return;
        }

        if (code && stateParam) {
          await completeOAuth(code, stateParam);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [completeOAuth, safeSetState]);

  /**
   * Set up auto-refresh interval
   */
  useEffect(() => {
    if (autoRefresh && accessToken) {
      // Initial refresh check
      autoRefreshTokens();

      // Set up periodic refresh
      refreshIntervalRef.current = setInterval(
        autoRefreshTokens,
        TOKEN_REFRESH_INTERVAL
      );
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, accessToken, autoRefreshTokens]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;

      // Close OAuth popup if still open
      if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
        oauthWindowRef.current.close();
        oauthWindowRef.current = null;
      }

      // Clear refresh interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    isConnected: state.isConnected,
    selectedProvider: state.selectedProvider,

    // Methods
    initiateOAuth,
    completeOAuth,
    revokeConnection,
    refreshToken,
    getToken,
    clearError,
    getConnectionStatus,
  };
}

export default useMCPOAuth;
