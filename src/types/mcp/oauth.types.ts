/**
 * MCP OAuth Types
 *
 * Comprehensive TypeScript types for OAuth 2.0 flow with MCP providers
 * This is the single source of truth for all OAuth-related types.
 */

// ============================================================================
// Core OAuth Types
// ============================================================================

// OAuth 2.0 Grant Types
export type OAuthGrantType = 'authorization_code' | 'refresh_token' | 'client_credentials';

// OAuth 2.0 Response Types
export type OAuthResponseType = 'code' | 'token';

// Supported OAuth Providers (unified from all sources)
export type MCPOAuthProvider =
    | 'github'
    | 'gitlab'
    | 'google'
    | 'microsoft'
    | 'slack'
    | 'linear'
    | 'notion'
    | 'azure'
    | 'auth0'
    | 'custom';

// Alias for backward compatibility
export type OAuthProvider = MCPOAuthProvider;

// ============================================================================
// OAuth Request/Response Types
// ============================================================================

/**
 * OAuth initialization request
 */
export interface OAuthInitRequest {
  provider: string;
  redirectUri?: string;
  redirectUrl?: string; // Alias
  scope?: string[];
  state?: string;
}

/**
 * OAuth initialization response
 */
export interface OAuthInitResponse {
  authUrl: string;
  state: string;
  provider?: string;
  codeVerifier?: string; // For PKCE flow
}

/**
 * OAuth callback request
 */
export interface OAuthCallbackRequest {
  code: string;
  state: string;
  codeVerifier?: string; // For PKCE flow
}

/**
 * OAuth callback response
 */
export interface OAuthCallbackResponse {
  success: boolean;
  provider?: string | MCPOAuthProvider;
  tokenData?: OAuthTokenResponse;
  error?: string;
  errorCode?: OAuthErrorCode;
}

/**
 * OAuth refresh request
 */
export interface OAuthRefreshRequest {
  provider: string | MCPOAuthProvider;
  refreshToken?: string;
}

/**
 * OAuth refresh response
 */
export interface OAuthRefreshResponse {
  success: boolean;
  error?: string;
}

/**
 * OAuth revoke request
 */
export interface OAuthRevokeRequest {
  provider: string;
}

/**
 * OAuth revoke response
 */
export interface OAuthRevokeResponse {
  success: boolean;
  error?: string;
}

/**
 * Stored token response (without sensitive refresh token)
 */
export interface StoredTokenResponse {
  accessToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
}

// ============================================================================
// OAuth Token Types
// ============================================================================

/**
 * OAuth Token Request
 */
export interface OAuthTokenRequest {
  code: string;
  state: string;
  provider: MCPOAuthProvider;
  codeVerifier?: string; // For PKCE
  redirectUri: string;
}

/**
 * OAuth Token Response
 */
export interface OAuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
  refreshToken?: string;
  scope?: string;
  idToken?: string; // For OpenID Connect
}

/**
 * Stored OAuth Token Data
 */
export interface StoredOAuthToken extends OAuthTokenResponse {
  provider: MCPOAuthProvider;
  storedAt: number;
  expiresAt?: number;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// OAuth Provider Configuration
// ============================================================================

/**
 * OAuth Provider Configuration
 */
export interface OAuthProviderConfig {
  name: string;
  displayName: string;
  authUrl: string;
  authorizationEndpoint?: string; // Alias
  tokenUrl: string;
  tokenEndpoint?: string; // Alias
  clientId: string;
  clientSecret?: string;
  scope: string[];
  scopes?: string[]; // Alias
  redirectUri: string;
  usePKCE?: boolean;
  additionalParams?: Record<string, string>;
}

/**
 * MCP OAuth Provider Configuration
 */
export interface MCPOAuthProviderConfig {
  provider: MCPOAuthProvider;
  clientId: string;
  clientSecret?: string; // Not needed for PKCE flow
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scopes: string[];
  redirectUri: string;
  usePKCE?: boolean; // Use PKCE for enhanced security
  additionalParams?: Record<string, string>;
}

/**
 * MCP Server OAuth Configuration
 */
export interface MCPServerOAuthConfig {
  serverId: string;
  serverName: string;
  provider: MCPOAuthProvider;
  requiredScopes: string[];
  optionalScopes?: string[];
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl?: string;
}

// ============================================================================
// OAuth State & Connection Types
// ============================================================================

/**
 * OAuth State Data
 */
export interface OAuthStateData {
  state: string;
  provider: MCPOAuthProvider;
  codeVerifier?: string;
  timestamp: number;
  returnUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * OAuth Flow State
 * Used to track the current state of an OAuth flow
 */
export type OAuthFlowState =
  | 'idle'
  | 'initiating'
  | 'awaiting-callback'
  | 'completing'
  | 'completed'
  | 'failed';

/**
 * OAuth Connection Status
 * Represents the connection status for a provider
 */
export interface OAuthConnectionStatus {
  provider: string | MCPOAuthProvider;
  connected: boolean;
  isConnected?: boolean; // Alias
  connectedAt?: number | string;
  expiresAt?: number;
  scope?: string;
  scopes?: string[];
  lastRefreshed?: number;
  userIdentifier?: string;
  userInfo?: {
    id?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  };
  error?: string;
}

/**
 * MCP OAuth Connection (extended)
 */
export interface MCPOAuthConnection {
  provider: MCPOAuthProvider;
  isConnected: boolean;
  connectedAt?: number;
  expiresAt?: number;
  scopes?: string[];
  userInfo?: {
    id?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  };
}

// ============================================================================
// OAuth Authorization Types
// ============================================================================

/**
 * OAuth Authorization Request Parameters
 */
export interface OAuthAuthorizationRequest {
  provider: MCPOAuthProvider;
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  responseType: OAuthResponseType;
  codeChallenge?: string; // For PKCE
  codeChallengeMethod?: 'S256' | 'plain';
  additionalParams?: Record<string, string>;
}

/**
 * PKCE Code Verifier and Challenge
 */
export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256' | 'plain';
}

// ============================================================================
// OAuth Error Types
// ============================================================================

/**
 * OAuth Error Codes (RFC 6749)
 */
export type OAuthErrorCode =
  | 'invalid_request'
  | 'unauthorized_client'
  | 'access_denied'
  | 'unsupported_response_type'
  | 'invalid_scope'
  | 'server_error'
  | 'temporarily_unavailable'
  | 'invalid_client'
  | 'invalid_grant'
  | 'unsupported_grant_type';

/**
 * OAuth Error Response
 */
export interface OAuthErrorResponse {
  error: OAuthErrorCode | string;
  errorDescription?: string;
  errorUri?: string;
  state?: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * OAuth Error Classes
 */
export class OAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

export class OAuthNetworkError extends OAuthError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', undefined, details);
    this.name = 'OAuthNetworkError';
  }
}

export class OAuthValidationError extends OAuthError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'OAuthValidationError';
  }
}

export class OAuthProviderError extends OAuthError {
  constructor(message: string, statusCode: number, details?: unknown) {
    super(message, 'PROVIDER_ERROR', statusCode, details);
    this.name = 'OAuthProviderError';
  }
}

// ============================================================================
// OAuth Hook & State Management Types
// ============================================================================

/**
 * OAuth Hook State
 * State returned by useOAuth hook
 */
export interface OAuthHookState {
  token: StoredTokenResponse | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * OAuth Hook Return Type
 */
export interface UseOAuthReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getAccessToken: () => string | null;
}

/**
 * OAuth Store State
 * State managed by Zustand store
 */
export interface OAuthStoreState {
  tokens: Record<string, StoredTokenResponse>;
  loading: boolean;
  error: string | null;
  connect: (provider: string) => Promise<void>;
  disconnect: (provider: string) => Promise<void>;
  refresh: (provider: string) => Promise<void>;
  loadToken: (provider: string) => Promise<void>;
}

/**
 * OAuth Multi-Provider State
 * State for managing multiple providers
 */
export interface OAuthMultiProviderState {
  providers: string[];
  connections: Record<string, OAuthConnectionStatus>;
  loadingProviders: Set<string>;
  errors: Record<string, string>;
}

// ============================================================================
// OAuth Event Types
// ============================================================================

/**
 * OAuth Event Types
 * Events that can be emitted during OAuth flow
 */
export type OAuthEventType =
  | 'oauth:initiated'
  | 'oauth:callback:started'
  | 'oauth:callback:completed'
  | 'oauth:token:refreshed'
  | 'oauth:token:revoked'
  | 'oauth:error'
  | 'authorization_started'
  | 'authorization_completed'
  | 'authorization_failed'
  | 'token_refreshed'
  | 'token_expired'
  | 'connection_revoked';

/**
 * OAuth Event
 * Event payload for OAuth events
 */
export interface OAuthEvent {
  type: OAuthEventType;
  provider: string | MCPOAuthProvider;
  timestamp: number;
  data?: unknown | Record<string, unknown>;
  error?: Error;
}

// ============================================================================
// OAuth Configuration Types
// ============================================================================

/**
 * OAuth Service Configuration
 */
export interface OAuthServiceConfig {
  apiBaseUrl?: string;
  maxRetries?: number;
  retryDelay?: number;
  retryBackoffMultiplier?: number;
  requestTimeout?: number;
  debug?: boolean;
}

/**
 * OAuth Retry Options
 * Configuration for retry behavior
 */
export interface OAuthRetryOptions {
  maxRetries: number;
  retryDelay: number;
  retryBackoffMultiplier: number;
  retryableStatusCodes: number[];
}

/**
 * OAuth Request Options
 * Options for making OAuth requests
 */
export interface OAuthRequestOptions {
  timeout?: number;
  retryOptions?: Partial<OAuthRetryOptions>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// ============================================================================
// OAuth Storage Types
// ============================================================================

/**
 * OAuth Token Storage Interface
 */
export interface IOAuthTokenStorage {
  setToken(provider: MCPOAuthProvider, tokenData: StoredOAuthToken): void;
  getToken(provider: MCPOAuthProvider): StoredOAuthToken | null;
  removeToken(provider: MCPOAuthProvider): void;
  clearAllTokens(): void;
  hasValidToken(provider: MCPOAuthProvider): boolean;
}

// ============================================================================
// OAuth Analytics & Monitoring Types
// ============================================================================

/**
 * OAuth Analytics Event
 * Analytics event for tracking OAuth flows
 */
export interface OAuthAnalyticsEvent {
  event: string;
  provider: string;
  timestamp: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// OAuth Helper Types
// ============================================================================

/**
 * Helper type for OAuth callback URL parameters
 */
export interface OAuthCallbackParams {
  code?: string | null;
  state?: string | null;
  error?: string | null;
  error_description?: string | null;
}

/**
 * Async function that returns OAuth response
 */
export type OAuthAsyncFunction<T = void> = () => Promise<T>;

/**
 * OAuth callback handler function
 */
export type OAuthCallbackHandler = (
  code: string,
  state: string
) => Promise<OAuthCallbackResponse>;

/**
 * OAuth error handler function
 */
export type OAuthErrorHandler = (error: OAuthError) => void | Promise<void>;

/**
 * OAuth success handler function
 */
export type OAuthSuccessHandler<T = unknown> = (data: T) => void | Promise<void>;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if error is an OAuth error
 */
export function isOAuthError(error: unknown): error is OAuthError {
  return error instanceof Error && 'code' in error;
}

/**
 * Type guard to check if error is a network error
 */
export function isOAuthNetworkError(error: unknown): error is OAuthNetworkError {
  return isOAuthError(error) && error.code === 'NETWORK_ERROR';
}

/**
 * Type guard to check if error is a validation error
 */
export function isOAuthValidationError(error: unknown): error is OAuthValidationError {
  return isOAuthError(error) && error.code === 'VALIDATION_ERROR';
}

/**
 * Type guard to check if error is a provider error
 */
export function isOAuthProviderError(error: unknown): error is OAuthProviderError {
  return isOAuthError(error) && error.code === 'PROVIDER_ERROR';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper to parse OAuth callback URL parameters
 */
export function parseOAuthCallbackParams(
  searchParams: URLSearchParams
): OAuthCallbackParams {
  return {
    code: searchParams.get('code'),
    state: searchParams.get('state'),
    error: searchParams.get('error'),
    error_description: searchParams.get('error_description'),
  };
}

/**
 * Helper to validate OAuth callback parameters
 */
export function validateOAuthCallbackParams(
  params: OAuthCallbackParams
): { valid: boolean; error?: string } {
  if (params.error) {
    return {
      valid: false,
      error: params.error_description || params.error,
    };
  }

  if (!params.code || !params.state) {
    return {
      valid: false,
      error: 'Missing required parameters (code or state)',
    };
  }

  return { valid: true };
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Provider configuration for UI display
 */
export interface ProviderConfig {
  id: OAuthProvider;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

/**
 * Props for MCPOAuthConnect component
 */
export interface MCPOAuthConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
