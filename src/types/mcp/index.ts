/**
 * MCP Types - Main Export
 *
 * Centralized export for all MCP (Model Context Protocol) types.
 */

// Export all OAuth types
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
} from './oauth.types';

// Export error classes and utilities
export {
  OAuthError,
  OAuthNetworkError,
  OAuthValidationError,
  OAuthProviderError,
  isOAuthError,
  isOAuthNetworkError,
  isOAuthValidationError,
  isOAuthProviderError,
  parseOAuthCallbackParams,
  validateOAuthCallbackParams,
} from './oauth.types';
