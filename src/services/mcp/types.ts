/**
 * Type definitions for MCP OAuth and Token Management
 *
 * Centralized type definitions for OAuth flows, token structures,
 * and MCP-related data types.
 */

// ============================================================================
// OAuth Token Types
// ============================================================================

/**
 * Standard OAuth 2.0 token structure
 */
export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in milliseconds
  tokenType?: string;
  scope?: string;
  idToken?: string; // For OpenID Connect
}

/**
 * OAuth provider identifiers
 */
export type OAuthProvider = 'google' | 'microsoft' | 'github' | 'custom';

/**
 * OAuth grant types
 */
export type OAuthGrantType =
  | 'authorization_code'
  | 'refresh_token'
  | 'client_credentials'
  | 'password';

/**
 * OAuth response types
 */
export type OAuthResponseType = 'code' | 'token' | 'id_token';

// ============================================================================
// OAuth Configuration Types
// ============================================================================

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scope: string[];
  responseType?: OAuthResponseType;
  usePKCE?: boolean;
}

/**
 * OAuth authorization parameters
 */
export interface OAuthAuthorizationParams {
  clientId: string;
  redirectUri: string;
  responseType: OAuthResponseType;
  scope: string;
  state: string;
  codeChallenge?: string; // For PKCE
  codeChallengeMethod?: 'S256' | 'plain';
  prompt?: 'none' | 'login' | 'consent' | 'select_account';
  accessType?: 'online' | 'offline';
}

/**
 * OAuth token request parameters
 */
export interface OAuthTokenRequest {
  code?: string;
  refreshToken?: string;
  grantType: OAuthGrantType;
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  codeVerifier?: string; // For PKCE
}

/**
 * OAuth token response from provider
 */
export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

// ============================================================================
// MCP-Specific Types
// ============================================================================

/**
 * MCP provider metadata
 */
export interface MCPProvider {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  description?: string;
  website?: string;
  oauthConfig: OAuthProviderConfig;
  supportedScopes: MCPScope[];
  features: MCPFeature[];
}

/**
 * MCP OAuth scopes
 */
export interface MCPScope {
  value: string;
  label: string;
  description: string;
  required: boolean;
}

/**
 * MCP features supported by provider
 */
export type MCPFeature =
  | 'file-access'
  | 'email-access'
  | 'calendar-access'
  | 'contacts-access'
  | 'drive-access'
  | 'chat-access'
  | 'video-access';

/**
 * MCP connection status
 */
export interface MCPConnection {
  provider: OAuthProvider;
  connected: boolean;
  connectedAt?: number;
  lastRefreshed?: number;
  expiresAt?: number;
  scopes: string[];
  email?: string;
  name?: string;
}

// ============================================================================
// Token Storage Types
// ============================================================================

/**
 * Token storage strategy
 */
export type TokenStorageStrategy =
  | 'memory'
  | 'session'
  | 'encrypted-local'
  | 'cookie';

/**
 * Token storage metadata
 */
export interface TokenStorageMetadata {
  version: string;
  timestamp: number;
  provider: OAuthProvider;
  encrypted: boolean;
}

/**
 * Stored token structure
 */
export interface StoredToken {
  metadata: TokenStorageMetadata;
  token: OAuthToken;
}

// ============================================================================
// Token Service Types
// ============================================================================

/**
 * Token refresh result
 */
export interface TokenRefreshResult {
  success: boolean;
  token?: OAuthToken;
  error?: string;
  retryAfter?: number;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  expired: boolean;
  expiresIn?: number;
  needsRefresh: boolean;
  error?: string;
}

/**
 * Token service configuration
 */
export interface TokenServiceConfig {
  storageStrategy?: TokenStorageStrategy;
  encryptionKey?: string;
  refreshEndpoint?: string;
  refreshBufferMs?: number;
  debug?: boolean;
}

// ============================================================================
// PKCE Types
// ============================================================================

/**
 * PKCE (Proof Key for Code Exchange) parameters
 */
export interface PKCEParams {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256' | 'plain';
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * OAuth error codes
 */
export type OAuthErrorCode =
  | 'invalid_request'
  | 'invalid_client'
  | 'invalid_grant'
  | 'unauthorized_client'
  | 'unsupported_grant_type'
  | 'invalid_scope'
  | 'access_denied'
  | 'server_error'
  | 'temporarily_unavailable';

/**
 * OAuth error structure
 */
export interface OAuthError {
  code: OAuthErrorCode;
  description?: string;
  uri?: string;
}

/**
 * Token service error
 */
export class TokenServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: OAuthProvider,
    public details?: unknown
  ) {
    super(message);
    this.name = 'TokenServiceError';
  }
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * OAuth callback response
 */
export interface OAuthCallbackResponse {
  token: OAuthToken;
  provider: OAuthProvider;
  connection: MCPConnection;
}

/**
 * Token refresh API request
 */
export interface TokenRefreshRequest {
  provider: OAuthProvider;
  refreshToken: string;
}

/**
 * Token refresh API response
 */
export interface TokenRefreshResponse {
  token: OAuthToken;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Deep partial - makes all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Prettify - expands type for better IDE display
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Provider-specific token type
 */
export type ProviderToken<P extends OAuthProvider> = OAuthToken & {
  provider: P;
};

// ============================================================================
// Constants
// ============================================================================

/**
 * Default OAuth scopes by provider
 */
export const DEFAULT_OAUTH_SCOPES: Record<OAuthProvider, string[]> = {
  google: [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/drive.readonly',
  ],
  microsoft: [
    'openid',
    'profile',
    'email',
    'Files.Read',
    'User.Read',
  ],
  github: [
    'read:user',
    'user:email',
    'repo',
  ],
  custom: [],
};

/**
 * OAuth endpoint URLs by provider
 */
export const OAUTH_ENDPOINTS: Record<OAuthProvider, { auth: string; token: string }> = {
  google: {
    auth: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
  },
  microsoft: {
    auth: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  },
  github: {
    auth: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
  },
  custom: {
    auth: '',
    token: '',
  },
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if value is a valid OAuth token
 */
export function isOAuthToken(value: unknown): value is OAuthToken {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as OAuthToken).accessToken === 'string' &&
    (value as OAuthToken).accessToken.length > 0 &&
    typeof (value as OAuthToken).expiresAt === 'number' &&
    (value as OAuthToken).expiresAt > 0
  );
}

/**
 * Check if value is a valid OAuth provider
 */
export function isOAuthProvider(value: unknown): value is OAuthProvider {
  return (
    typeof value === 'string' &&
    ['google', 'microsoft', 'github', 'custom'].includes(value)
  );
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: OAuthToken, bufferMs = 0): boolean {
  return Date.now() + bufferMs >= token.expiresAt;
}

/**
 * Get time until token expiry in milliseconds
 */
export function getTokenExpiryTime(token: OAuthToken): number {
  return Math.max(0, token.expiresAt - Date.now());
}

/**
 * Get time until token expiry in seconds
 */
export function getTokenExpirySeconds(token: OAuthToken): number {
  return Math.floor(getTokenExpiryTime(token) / 1000);
}
