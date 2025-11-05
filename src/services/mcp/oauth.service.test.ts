/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for OAuth Service
 *
 * Comprehensive test suite covering:
 * - OAuth initialization
 * - OAuth callback handling
 * - Token refresh with retry logic
 * - Token revocation
 * - Error handling
 * - Retry mechanisms
 */

// @ts-expect-error - vitest may not be installed
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  OAuthService,
  OAuthError,
  OAuthNetworkError,
  OAuthValidationError,
  OAuthProviderError,
} from './oauth.service';
import { tokenService } from './token.service';

// Mock fetch globally
global.fetch = vi.fn();

// Mock token service
vi.mock('./token.service', () => ({
  tokenService: {
    storeToken: vi.fn(),
    getToken: vi.fn(),
    clearToken: vi.fn(),
  },
}));

describe('OAuthService', () => {
  let service: OAuthService;

  beforeEach(() => {
    service = new OAuthService({ debug: false });
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initiateOAuth', () => {
    it('should successfully initiate OAuth flow', async () => {
      const mockResponse = {
        authUrl: 'https://oauth.provider.com/authorize?client_id=123',
        state: 'random-state-123',
        codeVerifier: 'code-verifier-123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.initiateOAuth('google');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/mcp/oauth/init',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: 'google' }),
        })
      );

      // Verify state was stored
      const storedState = sessionStorage.getItem(`oauth_state_${mockResponse.state}`);
      expect(storedState).toBeTruthy();

      const parsedState = JSON.parse(storedState!);
      expect(parsedState.provider).toBe('google');
      expect(parsedState.state).toBe(mockResponse.state);
      expect(parsedState.codeVerifier).toBe(mockResponse.codeVerifier);
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Network error'));

      await expect(service.initiateOAuth('google')).rejects.toThrow(OAuthNetworkError);
    });

    it('should handle invalid responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      });

      await expect(service.initiateOAuth('google')).rejects.toThrow(OAuthValidationError);
    });

    it('should handle provider errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: 'Invalid provider' }),
      });

      await expect(service.initiateOAuth('invalid')).rejects.toThrow(OAuthProviderError);
    });
  });

  describe('completeOAuth', () => {
    beforeEach(() => {
      // Setup OAuth state
      const stateData = {
        provider: 'google',
        state: 'test-state',
        codeVerifier: 'test-verifier',
        timestamp: Date.now(),
      };
      sessionStorage.setItem('oauth_state_test-state', JSON.stringify(stateData));
    });

    it('should successfully complete OAuth flow', async () => {
      const mockToken = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'read write',
      };

      const mockResponse = {
        success: true,
        provider: 'google',
        token: mockToken,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.completeOAuth('auth-code-123', 'test-state');

      expect(result.success).toBe(true);
      expect(result.provider).toBe('google');
      expect(tokenService.storeToken).toHaveBeenCalledWith('google', mockToken);

      // Verify state was cleared
      const storedState = sessionStorage.getItem('oauth_state_test-state');
      expect(storedState).toBeNull();
    });

    it('should reject invalid state', async () => {
      await expect(
        service.completeOAuth('auth-code-123', 'invalid-state')
      ).rejects.toThrow(OAuthValidationError);
    });

    it('should reject expired state', async () => {
      // Setup expired state
      const expiredStateData = {
        provider: 'google',
        state: 'expired-state',
        codeVerifier: 'test-verifier',
        timestamp: Date.now() - (11 * 60 * 1000), // 11 minutes ago
      };
      sessionStorage.setItem('oauth_state_expired-state', JSON.stringify(expiredStateData));

      await expect(
        service.completeOAuth('auth-code-123', 'expired-state')
      ).rejects.toThrow(OAuthValidationError);
    });

    it('should handle callback errors', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid authorization code',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(
        service.completeOAuth('invalid-code', 'test-state')
      ).rejects.toThrow(OAuthProviderError);
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const currentToken = {
        accessToken: 'old-access-token',
        refreshToken: 'refresh-token-123',
        expiresAt: Date.now() - 1000,
        tokenType: 'Bearer',
      };

      const newToken = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
      };

      (tokenService.getToken as any).mockResolvedValueOnce(currentToken);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          token: newToken,
        }),
      });

      const result = await service.refreshToken('google');

      expect(result.success).toBe(true);
      expect(tokenService.storeToken).toHaveBeenCalledWith('google', newToken);
    });

    it('should handle missing refresh token', async () => {
      (tokenService.getToken as any).mockResolvedValueOnce({
        accessToken: 'access-token',
        expiresAt: Date.now() + 3600000,
      });

      await expect(service.refreshToken('google')).rejects.toThrow(OAuthValidationError);
    });

    it('should handle refresh errors', async () => {
      (tokenService.getToken as any).mockResolvedValueOnce({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 1000,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Invalid refresh token',
        }),
      });

      await expect(service.refreshToken('google')).rejects.toThrow(OAuthProviderError);
    });

    it('should retry on network errors', async () => {
      const currentToken = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 1000,
      };

      (tokenService.getToken as any).mockResolvedValue(currentToken);

      // First two attempts fail with network error
      (global.fetch as any)
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            token: {
              accessToken: 'new-token',
              refreshToken: 'new-refresh',
              expiresAt: Date.now() + 3600000,
            },
          }),
        });

      const result = await service.refreshToken('google');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const currentToken = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 1000,
      };

      (tokenService.getToken as any).mockResolvedValue(currentToken);

      // All attempts fail
      (global.fetch as any).mockRejectedValue(new TypeError('Network error'));

      await expect(service.refreshToken('google')).rejects.toThrow(OAuthNetworkError);
      expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('revokeToken', () => {
    it('should successfully revoke token', async () => {
      const currentToken = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: Date.now() + 3600000,
      };

      (tokenService.getToken as any).mockResolvedValueOnce(currentToken);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
        }),
      });

      const result = await service.revokeToken('google');

      expect(result.success).toBe(true);
      expect(tokenService.clearToken).toHaveBeenCalledWith('google');
    });

    it('should handle no token to revoke', async () => {
      (tokenService.getToken as any).mockResolvedValueOnce(null);

      const result = await service.revokeToken('google');

      expect(result.success).toBe(true);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should clear token even if revocation fails', async () => {
      const currentToken = {
        accessToken: 'access-token-123',
        expiresAt: Date.now() + 3600000,
      };

      (tokenService.getToken as any).mockResolvedValueOnce(currentToken);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Revocation failed',
        }),
      });

      await expect(service.revokeToken('google')).rejects.toThrow();
      expect(tokenService.clearToken).toHaveBeenCalledWith('google');
    });
  });

  describe('getStoredToken', () => {
    it('should return stored token without refresh token', async () => {
      const fullToken = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: Date.now() + 3600000,
        tokenType: 'Bearer',
        scope: 'read write',
      };

      (tokenService.getToken as any).mockResolvedValueOnce(fullToken);

      const result = await service.getStoredToken('google');

      expect(result).toEqual({
        accessToken: fullToken.accessToken,
        expiresAt: fullToken.expiresAt,
        tokenType: fullToken.tokenType,
        scope: fullToken.scope,
      });
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('should return empty object if no token exists', async () => {
      (tokenService.getToken as any).mockResolvedValueOnce(null);

      const result = await service.getStoredToken('google');

      expect(result).toEqual({});
    });

    it('should handle errors gracefully', async () => {
      (tokenService.getToken as any).mockRejectedValueOnce(new Error('Storage error'));

      const result = await service.getStoredToken('google');

      expect(result).toEqual({});
    });
  });

  describe('Retry Logic', () => {
    it('should use exponential backoff for retries', async () => {
      const service = new OAuthService({
        maxRetries: 3,
        retryDelay: 100,
        retryBackoffMultiplier: 2,
      });

      (tokenService.getToken as any).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() - 1000,
      });

      const fetchMock = vi.fn()
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            token: {
              accessToken: 'new-token',
              refreshToken: 'new-refresh',
              expiresAt: Date.now() + 3600000,
            },
          }),
        });

      global.fetch = fetchMock as any;

      const startTime = Date.now();
      await service.refreshToken('google');
      const duration = Date.now() - startTime;

      // First retry after 100ms, second after 200ms = ~300ms total
      expect(duration).toBeGreaterThanOrEqual(300);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should retry on 5xx errors', async () => {
      const mockResponse = {
        success: true,
        token: {
          accessToken: 'new-token',
          refreshToken: 'new-refresh',
          expiresAt: Date.now() + 3600000,
        },
      };

      (tokenService.getToken as any).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() - 1000,
      });

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          text: async () => JSON.stringify({ message: 'Service Unavailable' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const result = await service.refreshToken('google');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx errors (except specific ones)', async () => {
      (tokenService.getToken as any).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() - 1000,
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: 'Unauthorized' }),
      });

      await expect(service.refreshToken('google')).rejects.toThrow(OAuthProviderError);
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retry
    });

    it('should retry on 429 Too Many Requests', async () => {
      const mockResponse = {
        success: true,
        token: {
          accessToken: 'new-token',
          refreshToken: 'new-refresh',
          expiresAt: Date.now() + 3600000,
        },
      };

      (tokenService.getToken as any).mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() - 1000,
      });

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => JSON.stringify({ message: 'Too Many Requests' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const result = await service.refreshToken('google');

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Request Timeout', () => {
    it('should timeout long-running requests', async () => {
      const service = new OAuthService({
        requestTimeout: 100,
        maxRetries: 1,
      });

      // Mock a slow request
      (global.fetch as any).mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      await expect(service.initiateOAuth('google')).rejects.toThrow(OAuthNetworkError);
    });
  });

  describe('Error Types', () => {
    it('should create OAuthError with correct properties', () => {
      const error = new OAuthError('Test error', 'TEST_CODE', 400, { detail: 'test' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('OAuthError');
    });

    it('should create OAuthNetworkError', () => {
      const error = new OAuthNetworkError('Network failed', { reason: 'timeout' });

      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.name).toBe('OAuthNetworkError');
      expect(error.details).toEqual({ reason: 'timeout' });
    });

    it('should create OAuthValidationError', () => {
      const error = new OAuthValidationError('Invalid data', { field: 'email' });

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('OAuthValidationError');
    });

    it('should create OAuthProviderError', () => {
      const error = new OAuthProviderError('Provider error', 500, { provider: 'google' });

      expect(error.code).toBe('PROVIDER_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('OAuthProviderError');
    });
  });
});
