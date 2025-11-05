/**
 * MCP Services - Main Export
 *
 * Centralized export for all MCP (Model Context Protocol) services.
 * This includes OAuth management and token services.
 */

// Import singleton instances first (before use)
import { oauthService } from './oauth.service';
import { tokenService } from './token.service';

// Export OAuth Service
export { oauthService, OAuthService } from './oauth.service';

// Export Token Service
export {
  TokenService,
  tokenService,
  type Token,
  type OAuthProvider,
  type TokenServiceConfig,
  type TokenRefreshResult,
} from './token.service';

// Export all types from centralized location
export type {
  // OAuth types
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

  // Additional types
  OAuthFlowState,
  OAuthConnectionStatus,
  OAuthProviderConfig,
  OAuthHookState,
  OAuthStoreState,
  OAuthEventType,
  OAuthEvent,
  OAuthRetryOptions,
  OAuthRequestOptions,
  OAuthMultiProviderState,
  OAuthAnalyticsEvent,
  OAuthCallbackParams,
  OAuthAsyncFunction,
  OAuthCallbackHandler,
  OAuthErrorHandler,
  OAuthSuccessHandler,
  MCPOAuthProvider,
} from '@/types/mcp/oauth.types';

// Export error classes
export {
  OAuthError,
  OAuthNetworkError,
  OAuthValidationError,
  OAuthProviderError,

  // Type guards
  isOAuthError,
  isOAuthNetworkError,
  isOAuthValidationError,
  isOAuthProviderError,

  // Helpers
  parseOAuthCallbackParams,
  validateOAuthCallbackParams,
} from '@/types/mcp/oauth.types';

/**
 * Re-export singleton instances for convenience
 *
 * Usage:
 * ```typescript
 * import { oauthService, tokenService } from '@/services/mcp';
 *
 * // Use OAuth service
 * const { authUrl } = await oauthService.initiateOAuth('google');
 *
 * // Use Token service
 * const token = await tokenService.getToken('google');
 * ```
 */

/**
 * Version information
 */
export const MCP_SERVICES_VERSION = '1.0.0';

/**
 * Default providers supported
 */
export const DEFAULT_OAUTH_PROVIDERS = [
  'google',
  'microsoft',
  'github',
] as const;

export type DefaultOAuthProvider = typeof DEFAULT_OAUTH_PROVIDERS[number];

/**
 * Service status check
 */
export function checkServiceHealth(): {
  oauth: boolean;
  token: boolean;
  version: string;
} {
  try {
    return {
      oauth: typeof oauthService !== 'undefined' && oauthService !== null,
      token: typeof tokenService !== 'undefined' && tokenService !== null,
      version: MCP_SERVICES_VERSION,
    };
  } catch {
    // If services aren't initialized yet, return safe defaults
    return {
      oauth: false,
      token: false,
      version: MCP_SERVICES_VERSION,
    };
  }
}

// Re-export for convenience
export { tokenService as default } from './token.service';
