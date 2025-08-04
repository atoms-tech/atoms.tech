/**
 * API Performance Tests
 * Comprehensive API endpoint performance testing
 */

const { performance } = require('perf_hooks');
const fetch = require('node-fetch');

describe('API Performance Tests', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const API_BASE = `${BASE_URL}/api`;
  
  // Performance thresholds
  const RESPONSE_TIME_THRESHOLD = 1000; // 1 second
  const SLOW_RESPONSE_THRESHOLD = 2000; // 2 seconds
  const TIMEOUT_THRESHOLD = 5000; // 5 seconds

  const makeAPIRequest = async (endpoint, options = {}) => {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        timeout: TIMEOUT_THRESHOLD,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
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
        error: null,
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        success: false,
        status: 0,
        responseTime: endTime - startTime,
        data: null,
        error: error.message,
      };
    }
  };

  describe('Authentication API Performance', () => {
    test('Session endpoint performance', async () => {
      const result = await makeAPIRequest('/auth/session');
      
      console.log('Session API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        success: result.success,
      });
      
      expect(result.responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
      expect(result.success || result.status === 401).toBe(true); // 401 is acceptable for non-authenticated
    });

    test('Login endpoint performance', async () => {
      const result = await makeAPIRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword',
        }),
      });
      
      console.log('Login API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(SLOW_RESPONSE_THRESHOLD);
    });

    test('Logout endpoint performance', async () => {
      const result = await makeAPIRequest('/auth/logout', {
        method: 'POST',
      });
      
      console.log('Logout API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });
  });

  describe('Projects API Performance', () => {
    test('Get projects performance', async () => {
      const result = await makeAPIRequest('/projects');
      
      console.log('Projects List API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        success: result.success,
      });
      
      expect(result.responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });

    test('Create project performance', async () => {
      const result = await makeAPIRequest('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Project',
          description: 'Performance test project',
        }),
      });
      
      console.log('Create Project API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(SLOW_RESPONSE_THRESHOLD);
    });

    test('Project details performance', async () => {
      const result = await makeAPIRequest('/projects/123');
      
      console.log('Project Details API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });
  });

  describe('Documents API Performance', () => {
    test('Get documents performance', async () => {
      const result = await makeAPIRequest('/documents');
      
      console.log('Documents List API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        success: result.success,
      });
      
      expect(result.responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });

    test('Create document performance', async () => {
      const result = await makeAPIRequest('/documents', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Document',
          content: 'Performance test document content',
          projectId: '123',
        }),
      });
      
      console.log('Create Document API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(SLOW_RESPONSE_THRESHOLD);
    });

    test('Document details performance', async () => {
      const result = await makeAPIRequest('/documents/123');
      
      console.log('Document Details API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });

    test('Document search performance', async () => {
      const result = await makeAPIRequest('/documents/search?q=test');
      
      console.log('Document Search API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(SLOW_RESPONSE_THRESHOLD);
    });
  });

  describe('Real-time API Performance', () => {
    test('Events endpoint performance', async () => {
      const result = await makeAPIRequest('/events');
      
      console.log('Events API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });

    test('Notifications endpoint performance', async () => {
      const result = await makeAPIRequest('/notifications');
      
      console.log('Notifications API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });
  });

  describe('File Upload API Performance', () => {
    test('Upload endpoint performance', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');
      
      const result = await makeAPIRequest('/upload', {
        method: 'POST',
        body: formData,
        headers: {}, // Let fetch set multipart headers
      });
      
      console.log('Upload API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(SLOW_RESPONSE_THRESHOLD);
    });
  });

  describe('Database Query Performance', () => {
    test('Complex query performance', async () => {
      const result = await makeAPIRequest('/analytics/performance');
      
      console.log('Complex Query API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(SLOW_RESPONSE_THRESHOLD);
    });

    test('Aggregation query performance', async () => {
      const result = await makeAPIRequest('/analytics/stats');
      
      console.log('Aggregation Query API Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(SLOW_RESPONSE_THRESHOLD);
    });
  });

  describe('Error Handling Performance', () => {
    test('404 error response performance', async () => {
      const result = await makeAPIRequest('/nonexistent');
      
      console.log('404 Error Response Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
      expect(result.status).toBe(404);
    });

    test('Rate limiting response performance', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const promises = Array.from({ length: 100 }, () => 
        makeAPIRequest('/projects')
      );
      
      const results = await Promise.all(promises);
      const rateLimitedResults = results.filter(r => r.status === 429);
      
      if (rateLimitedResults.length > 0) {
        const avgResponseTime = rateLimitedResults.reduce((sum, r) => sum + r.responseTime, 0) / rateLimitedResults.length;
        
        console.log('Rate Limiting Response Performance:', {
          avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
          rateLimitedCount: rateLimitedResults.length,
        });
        
        expect(avgResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
      }
    });
  });

  describe('API Batch Operations Performance', () => {
    test('Batch request performance', async () => {
      const batchRequests = [
        { endpoint: '/projects', method: 'GET' },
        { endpoint: '/documents', method: 'GET' },
        { endpoint: '/auth/session', method: 'GET' },
      ];
      
      const startTime = performance.now();
      const results = await Promise.all(
        batchRequests.map(req => makeAPIRequest(req.endpoint, { method: req.method }))
      );
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      
      console.log('Batch Request Performance:', {
        totalTime: `${totalTime.toFixed(2)}ms`,
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        requestCount: results.length,
      });
      
      expect(totalTime).toBeLessThan(SLOW_RESPONSE_THRESHOLD);
      expect(avgResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });
  });

  describe('API Response Size Performance', () => {
    test('Large response handling', async () => {
      const result = await makeAPIRequest('/documents?limit=1000');
      
      console.log('Large Response Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        dataSize: result.data ? JSON.stringify(result.data).length : 0,
      });
      
      expect(result.responseTime).toBeLessThan(SLOW_RESPONSE_THRESHOLD * 2);
    });
  });
});