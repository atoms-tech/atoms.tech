/**
 * Type Definitions for OAuth Service
 *
 * This file re-exports types from the centralized location.
 * Import these types when using the OAuth service in your application.
 *
 * @deprecated Import directly from '@/types/mcp/oauth.types' instead
 */

// Re-export all types from centralized location
export type {
  // Core types
  OAuthGrantType,
  OAuthResponseType,
  MCPOAuthProvider,
  OAuthProvider,

  // Request/Response types
  OAuthInitRequest,
  OAuthInitResponse,
  OAuthCallbackRequest,
  OAuthCallbackResponse,
  OAuthRefreshRequest,
  OAuthRefreshResponse,
  OAuthRevokeRequest,
  OAuthRevokeResponse,
  StoredTokenResponse,

  // Token types
  OAuthTokenRequest,
  OAuthTokenResponse,
  StoredOAuthToken,

  // Provider configuration
  OAuthProviderConfig,
  MCPOAuthProviderConfig,
  MCPServerOAuthConfig,

  // State & connection types
  OAuthStateData,
  OAuthFlowState,
  OAuthConnectionStatus,
  MCPOAuthConnection,

  // Authorization types
  OAuthAuthorizationRequest,
  PKCEPair,

  // Error types
  OAuthErrorCode,
  OAuthErrorResponse,

  // Hook & state management
  OAuthHookState,
  UseOAuthReturn,
  OAuthStoreState,
  OAuthMultiProviderState,

  // Event types
  OAuthEventType,
  OAuthEvent,

  // Configuration types
  OAuthServiceConfig,
  OAuthRetryOptions,
  OAuthRequestOptions,

  // Storage types
  IOAuthTokenStorage,

  // Analytics types
  OAuthAnalyticsEvent,

  // Helper types
  OAuthCallbackParams,
  OAuthAsyncFunction,
  OAuthCallbackHandler,
  OAuthErrorHandler,
  OAuthSuccessHandler,

  // Component props
  ProviderConfig,
  MCPOAuthConnectProps,
} from '@/types/mcp/oauth.types';

// Re-export error classes
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
