/**
 * Token Service Usage Examples
 *
 * Comprehensive examples showing how to use the TokenService
 * in different scenarios within atoms.tech
 */

import { tokenService, TokenService, Token, OAuthProvider } from './token.service';

// ============================================================================
// Example 1: Basic Usage - Store and Retrieve Token
// ============================================================================

export async function basicExample() {
  // Store a Google OAuth token
  const googleToken: Token = {
    accessToken: 'ya29.a0AfH6SMBx...',
    refreshToken: '1//0gw...',
    expiresAt: Date.now() + 3600000, // 1 hour from now
    tokenType: 'Bearer',
    scope: 'openid profile email https://www.googleapis.com/auth/drive.readonly',
  };

  await tokenService.storeToken('google', googleToken);

  // Retrieve the token
  const token = await tokenService.getToken('google');
  if (token) {
    console.log('Token retrieved successfully');
    console.log('Expires in:', Math.round((token.expiresAt - Date.now()) / 1000), 'seconds');
  }
}

// ============================================================================
// Example 2: Auto-Refresh Token
// ============================================================================

export async function autoRefreshExample() {
  const provider: OAuthProvider = 'google';

  // Get token and refresh if needed
  const freshToken = await tokenService.refreshTokenIfNeeded(provider);

  if (freshToken) {
    console.log('Got fresh token:', freshToken.accessToken.substring(0, 10) + '...');
  } else {
    console.log('No token available or refresh failed');
    // Redirect to OAuth flow
    window.location.href = '/api/auth/google';
  }
}

// ============================================================================
// Example 3: Using Token in API Request
// ============================================================================

export async function apiRequestExample() {
  const provider: OAuthProvider = 'google';

  // Get and refresh token if needed
  const token = await tokenService.refreshTokenIfNeeded(provider);

  if (!token) {
    throw new Error('Authentication required');
  }

  // Use token in API request
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    // Token invalid, clear and re-authenticate
    await tokenService.clearToken(provider);
    window.location.href = '/api/auth/google';
    return;
  }

  return response.json();
}

// ============================================================================
// Example 4: Multiple Provider Management
// ============================================================================

export async function multiProviderExample() {
  // Store tokens for multiple providers
  const providers: OAuthProvider[] = ['google', 'microsoft'];

  for (const provider of providers) {
    // Check if we have valid tokens
    const token = await tokenService.getToken(provider);

    if (token) {
      console.log(`${provider}: Token valid until`, new Date(token.expiresAt));
    } else {
      console.log(`${provider}: No valid token`);
    }
  }

  // Get all valid providers
  const validProviders = await tokenService.getValidProviders();
  console.log('Connected providers:', validProviders);
}

// ============================================================================
// Example 5: Custom Storage Strategy
// ============================================================================

export function customStorageExample() {
  // Create a service instance with encrypted localStorage
  const customService = new TokenService({
    storageStrategy: 'encrypted-local',
    encryptionKey: process.env.NEXT_PUBLIC_TOKEN_ENCRYPTION_KEY || 'default-key',
    refreshBufferMs: 10 * 60 * 1000, // Refresh 10 minutes before expiry
    debug: true,
  });

  return customService;
}

// ============================================================================
// Example 6: React Hook - useOAuthToken
// ============================================================================

import { useEffect, useState } from 'react';

export function useOAuthToken(provider: OAuthProvider) {
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let refreshTimer: NodeJS.Timeout;

    async function loadToken() {
      try {
        setLoading(true);
        const freshToken = await tokenService.refreshTokenIfNeeded(provider);

        if (mounted) {
          setToken(freshToken);
          setError(null);

          // Schedule next refresh check
          if (freshToken) {
            const timeUntilRefresh = freshToken.expiresAt - Date.now() - 5 * 60 * 1000;
            if (timeUntilRefresh > 0) {
              refreshTimer = setTimeout(loadToken, timeUntilRefresh);
            }
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load token');
          setToken(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadToken();

    return () => {
      mounted = false;
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [provider]);

  const refresh = async () => {
    setLoading(true);
    try {
      const freshToken = await tokenService.refreshTokenIfNeeded(provider);
      setToken(freshToken);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh token');
    } finally {
      setLoading(false);
    }
  };

  const clear = async () => {
    await tokenService.clearToken(provider);
    setToken(null);
  };

  return { token, loading, error, refresh, clear };
}

// ============================================================================
// Example 7: Server-Side Usage (API Route)
// ============================================================================

export async function serverSideExample(_request: Request) {
  // In a Next.js API route or server action
  const provider: OAuthProvider = 'google';

  // Get token (server-side services should use memory storage)
  const serverTokenService = new TokenService({
    storageStrategy: 'memory',
  });

  const token = await serverTokenService.getToken(provider);

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Use token for API call
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  return response;
}

// ============================================================================
// Example 8: Error Handling
// ============================================================================

export async function errorHandlingExample() {
  const provider: OAuthProvider = 'google';

  try {
    // Attempt to get token
    const token = await tokenService.getToken(provider);

    if (!token) {
      // No token available - redirect to OAuth
      console.log('No token found, redirecting to OAuth...');
      return { action: 'redirect', url: '/api/auth/google' };
    }

    // Check if token will expire soon
    const willExpireSoon = tokenService.isTokenExpired(token, 5 * 60 * 1000);

    if (willExpireSoon && token.refreshToken) {
      // Attempt refresh
      const freshToken = await tokenService.refreshTokenIfNeeded(provider);

      if (!freshToken) {
        console.log('Refresh failed, redirecting to OAuth...');
        return { action: 'redirect', url: '/api/auth/google' };
      }

      return { action: 'success', token: freshToken };
    }

    return { action: 'success', token };
  } catch (error) {
    console.error('Token error:', error instanceof Error ? error.message : 'Unknown error');
    return { action: 'error', error };
  }
}

// ============================================================================
// Example 9: Logout / Clear All Tokens
// ============================================================================

export async function logoutExample() {
  // Clear all OAuth tokens
  await tokenService.clearAllTokens();

  // Optionally, also clear session/local storage
  if (typeof window !== 'undefined') {
    sessionStorage.clear();
    localStorage.clear();
  }

  // Redirect to login
  window.location.href = '/login';
}

// ============================================================================
// Example 10: Token Validation Before API Call
// ============================================================================

export async function validatedApiCallExample(
  provider: OAuthProvider,
  apiUrl: string,
  options: RequestInit = {}
) {
  // Get fresh token
  const token = await tokenService.refreshTokenIfNeeded(provider);

  if (!token) {
    throw new Error('No valid token available. Please authenticate.');
  }

  // Make API call with token
  const response = await fetch(apiUrl, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  // Handle token expiration
  if (response.status === 401) {
    await tokenService.clearToken(provider);
    throw new Error('Token expired. Please re-authenticate.');
  }

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// Example 11: Middleware Integration
// ============================================================================

export async function middlewareExample(provider: OAuthProvider) {
  // Check if user has valid token
  const token = await tokenService.getToken(provider);

  if (!token) {
    return {
      authenticated: false,
      redirect: '/api/auth/google',
    };
  }

  // Refresh if needed
  if (tokenService.isTokenExpired(token, 5 * 60 * 1000)) {
    const freshToken = await tokenService.refreshTokenIfNeeded(provider);

    if (!freshToken) {
      return {
        authenticated: false,
        redirect: '/api/auth/google',
      };
    }
  }

  return {
    authenticated: true,
    token,
  };
}

// ============================================================================
// Example 12: OAuth Callback Handler
// ============================================================================

export async function oauthCallbackExample(
  provider: OAuthProvider,
  code: string,
  redirectUri: string
) {
  // Exchange authorization code for tokens
  const response = await fetch('/api/mcp/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider,
      code,
      redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange authorization code');
  }

  const { token } = await response.json();

  // Store the token
  await tokenService.storeToken(provider, token);

  console.log('OAuth flow completed successfully');

  return token;
}
