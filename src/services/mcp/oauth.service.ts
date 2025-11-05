/**
 * OAuth Service for MCP Integration
 *
 * Provides a comprehensive OAuth flow management for MCP providers including:
 * - OAuth initialization and authorization URL generation
 * - OAuth callback handling and token exchange
 * - Token refresh with automatic retry logic
 * - Token revocation
 * - Secure token storage integration
 *
 * Features:
 * - Automatic retry logic with exponential backoff
 * - Request/response validation with Zod
 * - Comprehensive error handling
 * - TypeScript type safety
 * - Integration with TokenService for secure storage
 *
 * @module OAuthService
 */

import { z } from 'zod';
import { tokenService, type Token, type OAuthProvider } from './token.service';
import type {
  OAuthInitResponse,
  OAuthCallbackResponse,
  OAuthRefreshResponse,
  OAuthRevokeResponse,
  StoredTokenResponse,
  OAuthServiceConfig,
} from '@/types/mcp/oauth.types';
import {
  OAuthNetworkError,
  OAuthValidationError,
  OAuthProviderError,
} from '@/types/mcp/oauth.types';

// Re-export error classes for backward compatibility
export {
  OAuthError,
  OAuthNetworkError,
  OAuthValidationError,
  OAuthProviderError,
} from '@/types/mcp/oauth.types';

// ============================================================================
// Types & Schemas
// ============================================================================

// Validation Schemas
const OAuthInitResponseSchema = z.object({
  authUrl: z.string().url(),
  state: z.string(),
  codeVerifier: z.string().optional(),
});

const OAuthCallbackResponseSchema = z.object({
  success: z.boolean(),
  provider: z.string().optional(),
  token: z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiresAt: z.number(),
    tokenType: z.string().optional(),
    scope: z.string().optional(),
    idToken: z.string().optional(),
  }).optional(),
  error: z.string().optional(),
});

const OAuthRefreshResponseSchema = z.object({
  success: z.boolean(),
  token: z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiresAt: z.number(),
    tokenType: z.string().optional(),
    scope: z.string().optional(),
    idToken: z.string().optional(),
  }).optional(),
  error: z.string().optional(),
});

const OAuthRevokeResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<OAuthServiceConfig> = {
  apiBaseUrl: '/api/mcp/oauth',
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryBackoffMultiplier: 2,
  requestTimeout: 30000, // 30 seconds
  debug: process.env.NODE_ENV === 'development',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof OAuthNetworkError) {
    return true;
  }

  if (error instanceof OAuthProviderError) {
    // Retry on 5xx errors and specific 4xx errors
    const statusCode = error.statusCode;
    return (
      (statusCode !== undefined && statusCode >= 500) ||
      statusCode === 408 || // Request Timeout
      statusCode === 429    // Too Many Requests
    );
  }

  return false;
}

// ============================================================================
// OAuth Service Implementation
// ============================================================================

/**
 * OAuth Service for managing OAuth flows with MCP providers
 */
export class OAuthService {
  private config: Required<OAuthServiceConfig>;

  constructor(config: OAuthServiceConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Public API Methods
  // ==========================================================================

  /**
   * Initiate OAuth flow and get authorization URL
   *
   * @param provider - OAuth provider name
   * @returns Promise with authorization URL and state
   * @throws {OAuthError} If initialization fails
   *
   * @example
   * ```typescript
   * const { authUrl } = await oauthService.initiateOAuth('google');
   * window.location.href = authUrl;
   * ```
   */
  async initiateOAuth(provider: string): Promise<OAuthInitResponse> {
    this.log(`Initiating OAuth for provider: ${provider}`);

    try {
      const response = await this.fetchWithRetry<OAuthInitResponse>(
        `${this.config.apiBaseUrl}/init`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ provider }),
        },
        OAuthInitResponseSchema
      );

      this.log(`OAuth initiated successfully for provider: ${provider}`);

      // Store state and code verifier for PKCE if provided
      if (response.state) {
        this.storeOAuthState(provider, response.state, response.codeVerifier);
      }

      return response;
    } catch (error) {
      this.handleError('initiateOAuth', error);
      throw error;
    }
  }

  /**
   * Complete OAuth flow by exchanging authorization code for tokens
   *
   * @param code - Authorization code from OAuth callback
   * @param state - State parameter for CSRF protection
   * @returns Promise with success status
   * @throws {OAuthError} If callback handling fails
   *
   * @example
   * ```typescript
   * const { success } = await oauthService.completeOAuth(code, state);
   * if (success) {
   *   console.log('OAuth completed successfully');
   * }
   * ```
   */
  async completeOAuth(code: string, state: string): Promise<OAuthCallbackResponse> {
    this.log('Completing OAuth flow');

    try {
      // Validate state and retrieve stored OAuth data
      const oauthData = this.retrieveOAuthState(state);
      if (!oauthData) {
        throw new OAuthValidationError('Invalid or expired state parameter');
      }

      const { provider, codeVerifier } = oauthData;

      // Exchange code for tokens
      const response = await this.fetchWithRetry<{
        success: boolean;
        provider?: string;
        token?: Token;
        error?: string;
      }>(
        `${this.config.apiBaseUrl}/callback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
            codeVerifier,
          }),
        },
        OAuthCallbackResponseSchema
      );

      if (response.success && response.token) {
        // Store tokens securely
        await tokenService.storeToken(provider as OAuthProvider, response.token);
        this.log(`OAuth completed and tokens stored for provider: ${provider}`);
      } else {
        throw new OAuthProviderError(
          response.error || 'OAuth callback failed',
          400
        );
      }

      // Clear stored OAuth state
      this.clearOAuthState(state);

      return {
        success: response.success,
        provider: response.provider,
        error: response.error,
      };
    } catch (error) {
      this.handleError('completeOAuth', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   *
   * @param provider - OAuth provider name
   * @returns Promise with success status
   * @throws {OAuthError} If refresh fails
   *
   * @example
   * ```typescript
   * const { success } = await oauthService.refreshToken('google');
   * if (success) {
   *   const token = await oauthService.getStoredToken('google');
   * }
   * ```
   */
  async refreshToken(provider: string): Promise<OAuthRefreshResponse> {
    this.log(`Refreshing token for provider: ${provider}`);

    try {
      // Get current token to access refresh token
      const currentToken = await tokenService.getToken(provider as OAuthProvider);

      if (!currentToken?.refreshToken) {
        throw new OAuthValidationError('No refresh token available');
      }

      // Call refresh endpoint
      const response = await this.fetchWithRetry<{
        success: boolean;
        token?: Token;
        error?: string;
      }>(
        `${this.config.apiBaseUrl}/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider,
            refreshToken: currentToken.refreshToken,
          }),
        },
        OAuthRefreshResponseSchema
      );

      if (response.success && response.token) {
        // Update stored tokens
        await tokenService.storeToken(provider as OAuthProvider, response.token);
        this.log(`Token refreshed successfully for provider: ${provider}`);
      } else {
        throw new OAuthProviderError(
          response.error || 'Token refresh failed',
          401
        );
      }

      return {
        success: response.success,
        error: response.error,
      };
    } catch (error) {
      this.handleError('refreshToken', error);
      throw error;
    }
  }

  /**
   * Revoke OAuth token
   *
   * @param provider - OAuth provider name
   * @returns Promise with success status
   * @throws {OAuthError} If revocation fails
   *
   * @example
   * ```typescript
   * const { success } = await oauthService.revokeToken('google');
   * if (success) {
   *   console.log('Token revoked successfully');
   * }
   * ```
   */
  async revokeToken(provider: string): Promise<OAuthRevokeResponse> {
    this.log(`Revoking token for provider: ${provider}`);

    try {
      // Get current token
      const currentToken = await tokenService.getToken(provider as OAuthProvider);

      if (!currentToken) {
        this.log(`No token to revoke for provider: ${provider}`);
        return { success: true };
      }

      // Call revoke endpoint
      const response = await this.fetchWithRetry<OAuthRevokeResponse>(
        `${this.config.apiBaseUrl}/revoke`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider,
            token: currentToken.accessToken,
          }),
        },
        OAuthRevokeResponseSchema
      );

      // Clear stored token regardless of revocation result
      await tokenService.clearToken(provider as OAuthProvider);

      this.log(`Token revoked for provider: ${provider}`);

      return {
        success: response.success,
        error: response.error,
      };
    } catch (error) {
      // Clear token even if revocation fails
      await tokenService.clearToken(provider as OAuthProvider);

      this.handleError('revokeToken', error);
      throw error;
    }
  }

  /**
   * Get stored token for a provider
   *
   * @param provider - OAuth provider name
   * @returns Stored token information (without refresh token for security)
   *
   * @example
   * ```typescript
   * const token = await oauthService.getStoredToken('google');
   * if (token.accessToken) {
   *   console.log('Token expires at:', new Date(token.expiresAt));
   * }
   * ```
   */
  async getStoredToken(provider: string): Promise<StoredTokenResponse> {
    try {
      const token = await tokenService.getToken(provider as OAuthProvider);

      if (!token) {
        return {};
      }

      // Return token info without refresh token for security
      return {
        accessToken: token.accessToken,
        expiresAt: token.expiresAt,
        tokenType: token.tokenType,
        scope: token.scope,
      };
    } catch (error) {
      this.handleError('getStoredToken', error);
      return {};
    }
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Fetch with automatic retry logic and exponential backoff
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    schema: z.ZodSchema<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.requestTimeout
      );

      // Make request
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;

        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new OAuthProviderError(
          errorData.message || errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      // Parse and validate response
      const data = await response.json();

      try {
        return schema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new OAuthValidationError(
            'Invalid response from server',
            error.errors
          );
        }
        throw error;
      }
    } catch (error) {
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new OAuthNetworkError('Request timeout');

        if (attempt < this.config.maxRetries && isRetryableError(timeoutError)) {
          return this.retryRequest(url, options, schema, attempt);
        }

        throw timeoutError;
      }

      // Handle network errors
      if (error instanceof TypeError) {
        const networkError = new OAuthNetworkError(
          'Network request failed',
          error
        );

        if (attempt < this.config.maxRetries && isRetryableError(networkError)) {
          return this.retryRequest(url, options, schema, attempt);
        }

        throw networkError;
      }

      // Handle retryable errors
      if (attempt < this.config.maxRetries && isRetryableError(error)) {
        return this.retryRequest(url, options, schema, attempt);
      }

      throw error;
    }
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(
    url: string,
    options: RequestInit,
    schema: z.ZodSchema<T>,
    attempt: number
  ): Promise<T> {
    const delay = this.config.retryDelay * Math.pow(this.config.retryBackoffMultiplier, attempt - 1);

    this.log(`Retrying request (attempt ${attempt + 1}/${this.config.maxRetries}) after ${delay}ms`);

    await sleep(delay);

    return this.fetchWithRetry(url, options, schema, attempt + 1);
  }

  /**
   * Store OAuth state for CSRF protection and PKCE
   */
  private storeOAuthState(
    provider: string,
    state: string,
    codeVerifier?: string
  ): void {
    if (typeof window === 'undefined') return;

    const stateData = {
      provider,
      state,
      codeVerifier,
      timestamp: Date.now(),
    };

    sessionStorage.setItem(`oauth_state_${state}`, JSON.stringify(stateData));

    // Auto-cleanup after 10 minutes
    setTimeout(() => {
      this.clearOAuthState(state);
    }, 10 * 60 * 1000);
  }

  /**
   * Retrieve OAuth state
   */
  private retrieveOAuthState(state: string): {
    provider: string;
    codeVerifier?: string;
  } | null {
    if (typeof window === 'undefined') return null;

    const stateDataStr = sessionStorage.getItem(`oauth_state_${state}`);
    if (!stateDataStr) return null;

    try {
      const stateData = JSON.parse(stateDataStr);

      // Check if state is expired (10 minutes)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        this.clearOAuthState(state);
        return null;
      }

      return {
        provider: stateData.provider,
        codeVerifier: stateData.codeVerifier,
      };
    } catch {
      return null;
    }
  }

  /**
   * Clear OAuth state
   */
  private clearOAuthState(state: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(`oauth_state_${state}`);
  }

  /**
   * Log debug messages
   */
  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[OAuthService] ${message}`);
    }
  }

  /**
   * Handle and log errors
   */
  private handleError(method: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[OAuthService] Error in ${method}:`, errorMessage, error);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global singleton instance
 *
 * Usage:
 * ```typescript
 * import { oauthService } from '@/services/mcp/oauth.service';
 *
 * // Start OAuth flow
 * const { authUrl } = await oauthService.initiateOAuth('google');
 * window.location.href = authUrl;
 *
 * // Complete OAuth (in callback handler)
 * const { success } = await oauthService.completeOAuth(code, state);
 *
 * // Refresh token
 * await oauthService.refreshToken('google');
 *
 * // Get token
 * const token = await oauthService.getStoredToken('google');
 *
 * // Revoke token
 * await oauthService.revokeToken('google');
 * ```
 */
export const oauthService = new OAuthService();

// ============================================================================
// Exports
// ============================================================================

// Types are now imported from @/types/mcp/oauth.types
// Re-export for backward compatibility
export type {
  OAuthInitRequest,
  OAuthInitResponse,
  OAuthCallbackRequest,
  OAuthCallbackResponse,
  OAuthRefreshRequest,
  OAuthRefreshResponse,
  OAuthRevokeRequest,
  OAuthRevokeResponse,
  StoredTokenResponse,
  OAuthServiceConfig,
} from '@/types/mcp/oauth.types';
