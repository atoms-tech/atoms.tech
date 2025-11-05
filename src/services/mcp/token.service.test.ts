/**
 * Token Service Tests
 *
 * Comprehensive test suite for token storage, retrieval, and refresh logic
 */

import { TokenService, Token } from './token.service';

describe('TokenService', () => {
  let tokenService: TokenService;
  let mockToken: Token;

  beforeEach(() => {
    // Initialize fresh token service with memory storage for tests
    tokenService = new TokenService({
      storageStrategy: 'memory',
      debug: true,
    });

    // Create mock token
    mockToken = {
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      expiresAt: Date.now() + 3600000, // 1 hour from now
      tokenType: 'Bearer',
      scope: 'openid profile email',
    };
  });

  afterEach(() => {
    // Clean up
    tokenService.clearAllTokens();
  });

  describe('storeToken', () => {
    it('should store a valid token', async () => {
      await tokenService.storeToken('google', mockToken);
      const retrieved = await tokenService.getToken('google');
      expect(retrieved).toEqual(mockToken);
    });

    it('should reject invalid token structure', async () => {
      const invalidToken = {
        accessToken: '',
        expiresAt: -1,
      } as Token;

      await expect(tokenService.storeToken('google', invalidToken)).rejects.toThrow();
    });

    it('should overwrite existing token', async () => {
      await tokenService.storeToken('google', mockToken);

      const newToken = {
        ...mockToken,
        accessToken: 'new_access_token',
      };

      await tokenService.storeToken('google', newToken);
      const retrieved = await tokenService.getToken('google');
      expect(retrieved?.accessToken).toBe('new_access_token');
    });
  });

  describe('getToken', () => {
    it('should return null for non-existent provider', async () => {
      const token = await tokenService.getToken('google');
      expect(token).toBeNull();
    });

    it('should return stored token', async () => {
      await tokenService.storeToken('google', mockToken);
      const token = await tokenService.getToken('google');
      expect(token).toEqual(mockToken);
    });

    it('should return null for expired token', async () => {
      const expiredToken = {
        ...mockToken,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      await tokenService.storeToken('google', expiredToken);
      const token = await tokenService.getToken('google');
      expect(token).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const isExpired = tokenService.isTokenExpired(mockToken);
      expect(isExpired).toBe(false);
    });

    it('should return true for expired token', () => {
      const expiredToken = {
        ...mockToken,
        expiresAt: Date.now() - 1000,
      };

      const isExpired = tokenService.isTokenExpired(expiredToken);
      expect(isExpired).toBe(true);
    });

    it('should consider buffer time', () => {
      const soonToExpireToken = {
        ...mockToken,
        expiresAt: Date.now() + 60000, // Expires in 1 minute
      };

      const isExpired = tokenService.isTokenExpired(soonToExpireToken, 120000); // 2 minute buffer
      expect(isExpired).toBe(true);
    });
  });

  describe('clearToken', () => {
    it('should clear token for specific provider', async () => {
      await tokenService.storeToken('google', mockToken);
      await tokenService.clearToken('google');

      const token = await tokenService.getToken('google');
      expect(token).toBeNull();
    });

    it('should not affect other providers', async () => {
      await tokenService.storeToken('google', mockToken);
      await tokenService.storeToken('microsoft', mockToken);
      await tokenService.clearToken('google');

      const googleToken = await tokenService.getToken('google');
      const microsoftToken = await tokenService.getToken('microsoft');

      expect(googleToken).toBeNull();
      expect(microsoftToken).toEqual(mockToken);
    });
  });

  describe('clearAllTokens', () => {
    it('should clear all stored tokens', async () => {
      await tokenService.storeToken('google', mockToken);
      await tokenService.storeToken('microsoft', mockToken);
      await tokenService.clearAllTokens();

      const googleToken = await tokenService.getToken('google');
      const microsoftToken = await tokenService.getToken('microsoft');

      expect(googleToken).toBeNull();
      expect(microsoftToken).toBeNull();
    });
  });

  describe('getValidProviders', () => {
    it('should return empty array when no tokens stored', async () => {
      const providers = await tokenService.getValidProviders();
      expect(providers).toEqual([]);
    });

    it('should return providers with valid tokens', async () => {
      await tokenService.storeToken('google', mockToken);
      await tokenService.storeToken('microsoft', mockToken);

      const providers = await tokenService.getValidProviders();
      expect(providers).toContain('google');
      expect(providers).toContain('microsoft');
    });

    it('should exclude expired tokens', async () => {
      const expiredToken = {
        ...mockToken,
        expiresAt: Date.now() - 1000,
      };

      await tokenService.storeToken('google', mockToken);
      await tokenService.storeToken('microsoft', expiredToken);

      const providers = await tokenService.getValidProviders();
      expect(providers).toContain('google');
      expect(providers).not.toContain('microsoft');
    });
  });

  describe('Multiple Storage Strategies', () => {
    it('should work with session storage strategy', async () => {
      const sessionService = new TokenService({
        storageStrategy: 'session',
      });

      await sessionService.storeToken('google', mockToken);
      const token = await sessionService.getToken('google');
      expect(token).toEqual(mockToken);
    });

    it('should work with memory storage strategy', async () => {
      const memoryService = new TokenService({
        storageStrategy: 'memory',
      });

      await memoryService.storeToken('google', mockToken);
      const token = await memoryService.getToken('google');
      expect(token).toEqual(mockToken);
    });
  });

  describe('Security', () => {
    it('should not expose tokens in error messages', async () => {
      const invalidToken = {
        accessToken: 'secret_token',
        expiresAt: -1,
      } as Token;

      try {
        await tokenService.storeToken('google', invalidToken);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';
        expect(errorMessage).not.toContain('secret_token');
      }
    });

    it('should validate token structure before storage', async () => {
      const malformedToken = {
        randomField: 'value',
      } as unknown as Token;

      await expect(tokenService.storeToken('google', malformedToken)).rejects.toThrow();
    });
  });
});
