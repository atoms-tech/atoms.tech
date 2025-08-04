/**
 * Security Performance Tests
 * Testing authentication, authorization, and security feature performance
 */

const { performance } = require('perf_hooks');
const fetch = require('node-fetch');
const crypto = require('crypto');

describe('Security Performance Tests', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const API_BASE = `${BASE_URL}/api`;
  
  // Performance thresholds
  const AUTH_THRESHOLD = 2000; // 2 seconds for auth operations
  const VALIDATION_THRESHOLD = 100; // 100ms for validation
  const ENCRYPTION_THRESHOLD = 50; // 50ms for encryption/decryption
  
  const makeSecureRequest = async (endpoint, options = {}) => {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Performance-Test-Client',
        },
        ...options,
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      let data = null;
      if (response.headers.get('content-type')?.includes('application/json')) {
        data = await response.json();
      }
      
      return {
        success: response.ok,
        status: response.status,
        responseTime,
        data,
        headers: Object.fromEntries(response.headers.entries()),
        error: null,
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        success: false,
        status: 0,
        responseTime: endTime - startTime,
        data: null,
        headers: {},
        error: error.message,
      };
    }
  };

  describe('Authentication Performance', () => {
    test('Login performance', async () => {
      const result = await makeSecureRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword123',
        }),
      });
      
      console.log('Login Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        hasToken: !!result.data?.token,
      });
      
      expect(result.responseTime).toBeLessThan(AUTH_THRESHOLD);
      // Status could be 200 (success) or 401 (invalid credentials)
      expect([200, 401, 422]).toContain(result.status);
    });

    test('Token validation performance', async () => {
      // First, try to get a token or use a mock one
      const mockToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImV4cCI6MTYxNjIzOTAyMn0.test';
      
      const result = await makeSecureRequest('/auth/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
        },
      });
      
      console.log('Token Validation Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        valid: result.data?.valid || false,
      });
      
      expect(result.responseTime).toBeLessThan(VALIDATION_THRESHOLD);
    });

    test('Logout performance', async () => {
      const result = await makeSecureRequest('/auth/logout', {
        method: 'POST',
      });
      
      console.log('Logout Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(VALIDATION_THRESHOLD);
    });

    test('Session refresh performance', async () => {
      const result = await makeSecureRequest('/auth/refresh', {
        method: 'POST',
      });
      
      console.log('Session Refresh Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(AUTH_THRESHOLD);
    });
  });

  describe('Authorization Performance', () => {
    test('Role-based access control performance', async () => {
      const roles = ['admin', 'user', 'guest'];
      const results = [];
      
      for (const role of roles) {
        const result = await makeSecureRequest(`/auth/check-role/${role}`, {
          method: 'GET',
        });
        
        results.push({
          role,
          responseTime: result.responseTime,
          status: result.status,
        });
        
        console.log(`Role Check (${role}):`, {
          responseTime: `${result.responseTime.toFixed(2)}ms`,
          status: result.status,
        });
      }
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      
      console.log('RBAC Performance Summary:', {
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        rolesChecked: results.length,
      });
      
      expect(avgResponseTime).toBeLessThan(VALIDATION_THRESHOLD);
    });

    test('Permission validation performance', async () => {
      const permissions = [
        'read:documents',
        'write:documents',
        'delete:documents',
        'admin:users',
      ];
      
      const results = [];
      
      for (const permission of permissions) {
        const result = await makeSecureRequest(`/auth/check-permission/${permission}`, {
          method: 'GET',
        });
        
        results.push({
          permission,
          responseTime: result.responseTime,
          status: result.status,
        });
        
        console.log(`Permission Check (${permission}):`, {
          responseTime: `${result.responseTime.toFixed(2)}ms`,
          status: result.status,
        });
      }
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      
      console.log('Permission Validation Performance:', {
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        permissionsChecked: results.length,
      });
      
      expect(avgResponseTime).toBeLessThan(VALIDATION_THRESHOLD);
    });

    test('Resource access control performance', async () => {
      const resources = [
        'projects/123',
        'documents/456',
        'users/789',
      ];
      
      const results = [];
      
      for (const resource of resources) {
        const result = await makeSecureRequest(`/auth/check-access/${resource}`, {
          method: 'GET',
        });
        
        results.push({
          resource,
          responseTime: result.responseTime,
          status: result.status,
        });
        
        console.log(`Resource Access Check (${resource}):`, {
          responseTime: `${result.responseTime.toFixed(2)}ms`,
          status: result.status,
        });
      }
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      
      console.log('Resource Access Control Performance:', {
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        resourcesChecked: results.length,
      });
      
      expect(avgResponseTime).toBeLessThan(VALIDATION_THRESHOLD);
    });
  });

  describe('Encryption Performance', () => {
    test('Data encryption performance', async () => {
      const testData = 'This is sensitive data that needs to be encrypted for security testing purposes.';
      
      const result = await makeSecureRequest('/security/encrypt', {
        method: 'POST',
        body: JSON.stringify({
          data: testData,
          algorithm: 'AES-256-GCM',
        }),
      });
      
      console.log('Data Encryption Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        dataSize: testData.length,
        encryptedSize: result.data?.encrypted?.length || 0,
      });
      
      expect(result.responseTime).toBeLessThan(ENCRYPTION_THRESHOLD);
    });

    test('Data decryption performance', async () => {
      // First encrypt some data
      const testData = 'This is sensitive data for decryption testing.';
      const encryptResult = await makeSecureRequest('/security/encrypt', {
        method: 'POST',
        body: JSON.stringify({
          data: testData,
          algorithm: 'AES-256-GCM',
        }),
      });
      
      if (encryptResult.success && encryptResult.data?.encrypted) {
        const decryptResult = await makeSecureRequest('/security/decrypt', {
          method: 'POST',
          body: JSON.stringify({
            encrypted: encryptResult.data.encrypted,
            key: encryptResult.data.key,
            iv: encryptResult.data.iv,
          }),
        });
        
        console.log('Data Decryption Performance:', {
          responseTime: `${decryptResult.responseTime.toFixed(2)}ms`,
          status: decryptResult.status,
          dataMatches: decryptResult.data?.decrypted === testData,
        });
        
        expect(decryptResult.responseTime).toBeLessThan(ENCRYPTION_THRESHOLD);
      }
    });

    test('Password hashing performance', async () => {
      const passwords = [
        'password123',
        'verySecurePassword!@#',
        'shortPwd',
        'thisIsAVeryLongPasswordThatShouldTakeLongerToHash',
      ];
      
      const results = [];
      
      for (const password of passwords) {
        const result = await makeSecureRequest('/security/hash-password', {
          method: 'POST',
          body: JSON.stringify({
            password,
            saltRounds: 10,
          }),
        });
        
        results.push({
          passwordLength: password.length,
          responseTime: result.responseTime,
          status: result.status,
        });
        
        console.log(`Password Hash (${password.length} chars):`, {
          responseTime: `${result.responseTime.toFixed(2)}ms`,
          status: result.status,
        });
      }
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      
      console.log('Password Hashing Performance:', {
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        passwordsHashed: results.length,
      });
      
      expect(avgResponseTime).toBeLessThan(AUTH_THRESHOLD);
    });
  });

  describe('Rate Limiting Performance', () => {
    test('Rate limit enforcement performance', async () => {
      const requestCount = 100;
      const results = [];
      
      // Make rapid requests to trigger rate limiting
      for (let i = 0; i < requestCount; i++) {
        const result = await makeSecureRequest('/api/rate-limited-endpoint');
        results.push({
          requestNumber: i + 1,
          responseTime: result.responseTime,
          status: result.status,
          rateLimited: result.status === 429,
        });
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const rateLimitedRequests = results.filter(r => r.rateLimited);
      const successfulRequests = results.filter(r => r.status === 200);
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const avgRateLimitTime = rateLimitedRequests.length > 0 ? 
        rateLimitedRequests.reduce((sum, r) => sum + r.responseTime, 0) / rateLimitedRequests.length : 0;
      
      console.log('Rate Limiting Performance:', {
        totalRequests: requestCount,
        successfulRequests: successfulRequests.length,
        rateLimitedRequests: rateLimitedRequests.length,
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        avgRateLimitTime: `${avgRateLimitTime.toFixed(2)}ms`,
      });
      
      expect(avgResponseTime).toBeLessThan(VALIDATION_THRESHOLD);
      expect(avgRateLimitTime).toBeLessThan(VALIDATION_THRESHOLD);
    });
  });

  describe('Security Headers Performance', () => {
    test('Security headers validation performance', async () => {
      const result = await makeSecureRequest('/');
      
      const securityHeaders = {
        'x-frame-options': result.headers['x-frame-options'],
        'x-content-type-options': result.headers['x-content-type-options'],
        'x-xss-protection': result.headers['x-xss-protection'],
        'strict-transport-security': result.headers['strict-transport-security'],
        'content-security-policy': result.headers['content-security-policy'],
      };
      
      const presentHeaders = Object.entries(securityHeaders)
        .filter(([key, value]) => value !== undefined).length;
      
      console.log('Security Headers Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        securityHeadersPresent: presentHeaders,
        totalHeadersChecked: Object.keys(securityHeaders).length,
      });
      
      expect(result.responseTime).toBeLessThan(VALIDATION_THRESHOLD);
      expect(presentHeaders).toBeGreaterThan(0); // At least some security headers should be present
    });
  });

  describe('Input Validation Performance', () => {
    test('SQL injection prevention performance', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "1' UNION SELECT * FROM users--",
      ];
      
      const results = [];
      
      for (const input of maliciousInputs) {
        const result = await makeSecureRequest('/search', {
          method: 'POST',
          body: JSON.stringify({
            query: input,
          }),
        });
        
        results.push({
          input: input.substring(0, 20) + '...',
          responseTime: result.responseTime,
          status: result.status,
          blocked: result.status === 400 || result.status === 403,
        });
        
        console.log(`SQL Injection Test:`, {
          responseTime: `${result.responseTime.toFixed(2)}ms`,
          status: result.status,
          blocked: result.status === 400 || result.status === 403,
        });
      }
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const blockedCount = results.filter(r => r.blocked).length;
      
      console.log('SQL Injection Prevention Performance:', {
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        inputsBlocked: blockedCount,
        totalInputsTested: results.length,
        blockingRate: `${(blockedCount / results.length * 100).toFixed(2)}%`,
      });
      
      expect(avgResponseTime).toBeLessThan(VALIDATION_THRESHOLD);
    });

    test('XSS prevention performance', async () => {
      const xssInputs = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      ];
      
      const results = [];
      
      for (const input of xssInputs) {
        const result = await makeSecureRequest('/content', {
          method: 'POST',
          body: JSON.stringify({
            content: input,
          }),
        });
        
        results.push({
          input: input.substring(0, 20) + '...',
          responseTime: result.responseTime,
          status: result.status,
          sanitized: result.data?.sanitized || false,
        });
        
        console.log(`XSS Prevention Test:`, {
          responseTime: `${result.responseTime.toFixed(2)}ms`,
          status: result.status,
          sanitized: result.data?.sanitized || false,
        });
      }
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const sanitizedCount = results.filter(r => r.sanitized).length;
      
      console.log('XSS Prevention Performance:', {
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        inputsSanitized: sanitizedCount,
        totalInputsTested: results.length,
        sanitizationRate: `${(sanitizedCount / results.length * 100).toFixed(2)}%`,
      });
      
      expect(avgResponseTime).toBeLessThan(VALIDATION_THRESHOLD);
    });
  });

  describe('CSRF Protection Performance', () => {
    test('CSRF token generation performance', async () => {
      const result = await makeSecureRequest('/auth/csrf-token');
      
      console.log('CSRF Token Generation Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        hasToken: !!result.data?.token,
        tokenLength: result.data?.token?.length || 0,
      });
      
      expect(result.responseTime).toBeLessThan(VALIDATION_THRESHOLD);
    });

    test('CSRF token validation performance', async () => {
      // First get a CSRF token
      const tokenResult = await makeSecureRequest('/auth/csrf-token');
      
      if (tokenResult.success && tokenResult.data?.token) {
        const validationResult = await makeSecureRequest('/auth/validate-csrf', {
          method: 'POST',
          headers: {
            'X-CSRF-Token': tokenResult.data.token,
          },
          body: JSON.stringify({
            action: 'test',
          }),
        });
        
        console.log('CSRF Token Validation Performance:', {
          responseTime: `${validationResult.responseTime.toFixed(2)}ms`,
          status: validationResult.status,
          valid: validationResult.data?.valid || false,
        });
        
        expect(validationResult.responseTime).toBeLessThan(VALIDATION_THRESHOLD);
      }
    });
  });

  describe('Security Scanning Performance', () => {
    test('Vulnerability scanning performance', async () => {
      const result = await makeSecureRequest('/security/scan', {
        method: 'POST',
        body: JSON.stringify({
          target: 'self',
          scanType: 'basic',
        }),
      });
      
      console.log('Vulnerability Scanning Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        vulnerabilitiesFound: result.data?.vulnerabilities?.length || 0,
      });
      
      expect(result.responseTime).toBeLessThan(AUTH_THRESHOLD * 2); // Scans can take longer
    });
  });
});