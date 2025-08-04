/**
 * Load Testing Suite
 * Comprehensive load testing for API endpoints and system performance
 */

const { performance } = require('perf_hooks');
const fetch = require('node-fetch');

describe('Load Testing', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  
  // Configuration
  const CONCURRENT_USERS = 50;
  const TEST_DURATION = 30000; // 30 seconds
  const RAMP_UP_TIME = 5000; // 5 seconds
  const ACCEPTABLE_ERROR_RATE = 0.05; // 5%
  const RESPONSE_TIME_THRESHOLD = 2000; // 2 seconds

  // Utility functions
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  const makeRequest = async (url, options = {}) => {
    const start = performance.now();
    try {
      const response = await fetch(url, {
        timeout: 10000,
        ...options,
      });
      const end = performance.now();
      
      return {
        success: response.ok,
        status: response.status,
        responseTime: end - start,
        error: null,
      };
    } catch (error) {
      const end = performance.now();
      return {
        success: false,
        status: 0,
        responseTime: end - start,
        error: error.message,
      };
    }
  };

  const runLoadTest = async (testConfig) => {
    const {
      url,
      concurrentUsers = CONCURRENT_USERS,
      duration = TEST_DURATION,
      rampUpTime = RAMP_UP_TIME,
      requestOptions = {},
    } = testConfig;

    const results = [];
    const userPromises = [];
    const startTime = performance.now();

    // Ramp up users gradually
    for (let i = 0; i < concurrentUsers; i++) {
      const userDelay = (rampUpTime / concurrentUsers) * i;
      
      const userPromise = (async () => {
        await delay(userDelay);
        const userResults = [];
        const userStartTime = performance.now();
        
        while (performance.now() - startTime < duration) {
          const result = await makeRequest(url, requestOptions);
          userResults.push(result);
          
          // Small delay between requests to simulate real user behavior
          await delay(100);
        }
        
        return userResults;
      })();
      
      userPromises.push(userPromise);
    }

    // Wait for all users to complete
    const allUserResults = await Promise.all(userPromises);
    
    // Flatten results
    for (const userResults of allUserResults) {
      results.push(...userResults);
    }

    // Calculate metrics
    const totalRequests = results.length;
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const errorRate = failedRequests / totalRequests;
    
    const responseTimes = results.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    // Calculate percentiles
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    
    const requestsPerSecond = totalRequests / (duration / 1000);
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      errorRate,
      avgResponseTime,
      maxResponseTime,
      minResponseTime,
      p95ResponseTime: p95,
      p99ResponseTime: p99,
      requestsPerSecond,
      concurrentUsers,
      duration,
      results,
    };
  };

  describe('Homepage Load Testing', () => {
    test('Homepage handles concurrent users', async () => {
      const results = await runLoadTest({
        url: BASE_URL,
        concurrentUsers: 25,
        duration: 15000,
      });

      console.log('Homepage Load Test Results:', {
        totalRequests: results.totalRequests,
        errorRate: `${(results.errorRate * 100).toFixed(2)}%`,
        avgResponseTime: `${results.avgResponseTime.toFixed(2)}ms`,
        p95ResponseTime: `${results.p95ResponseTime.toFixed(2)}ms`,
        requestsPerSecond: results.requestsPerSecond.toFixed(2),
      });

      // Assertions
      expect(results.errorRate).toBeLessThan(ACCEPTABLE_ERROR_RATE);
      expect(results.avgResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
      expect(results.p95ResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD * 2);
      expect(results.requestsPerSecond).toBeGreaterThan(1);
    });

    test('Homepage stress test with high concurrency', async () => {
      const results = await runLoadTest({
        url: BASE_URL,
        concurrentUsers: 100,
        duration: 20000,
      });

      console.log('Homepage Stress Test Results:', {
        totalRequests: results.totalRequests,
        errorRate: `${(results.errorRate * 100).toFixed(2)}%`,
        avgResponseTime: `${results.avgResponseTime.toFixed(2)}ms`,
        p95ResponseTime: `${results.p95ResponseTime.toFixed(2)}ms`,
        requestsPerSecond: results.requestsPerSecond.toFixed(2),
      });

      // More lenient thresholds for stress test
      expect(results.errorRate).toBeLessThan(0.1); // 10%
      expect(results.avgResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD * 2);
      expect(results.p95ResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD * 3);
    });
  });

  describe('API Endpoint Load Testing', () => {
    test('API endpoints handle concurrent requests', async () => {
      const apiEndpoints = [
        '/api/health',
        '/api/projects',
        '/api/documents',
        '/api/auth/session',
      ];

      const testResults = {};

      for (const endpoint of apiEndpoints) {
        const results = await runLoadTest({
          url: `${BASE_URL}${endpoint}`,
          concurrentUsers: 30,
          duration: 10000,
        });

        testResults[endpoint] = results;

        console.log(`API Load Test Results for ${endpoint}:`, {
          totalRequests: results.totalRequests,
          errorRate: `${(results.errorRate * 100).toFixed(2)}%`,
          avgResponseTime: `${results.avgResponseTime.toFixed(2)}ms`,
          p95ResponseTime: `${results.p95ResponseTime.toFixed(2)}ms`,
          requestsPerSecond: results.requestsPerSecond.toFixed(2),
        });

        // API endpoints should be faster
        expect(results.errorRate).toBeLessThan(ACCEPTABLE_ERROR_RATE);
        expect(results.avgResponseTime).toBeLessThan(1000); // 1 second
        expect(results.p95ResponseTime).toBeLessThan(2000); // 2 seconds
      }
    });

    test('Database query performance under load', async () => {
      const results = await runLoadTest({
        url: `${BASE_URL}/api/projects`,
        concurrentUsers: 50,
        duration: 20000,
        requestOptions: {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      });

      console.log('Database Query Load Test Results:', {
        totalRequests: results.totalRequests,
        errorRate: `${(results.errorRate * 100).toFixed(2)}%`,
        avgResponseTime: `${results.avgResponseTime.toFixed(2)}ms`,
        p95ResponseTime: `${results.p95ResponseTime.toFixed(2)}ms`,
        requestsPerSecond: results.requestsPerSecond.toFixed(2),
      });

      // Database queries should be optimized
      expect(results.errorRate).toBeLessThan(0.02); // 2%
      expect(results.avgResponseTime).toBeLessThan(500); // 500ms
      expect(results.p95ResponseTime).toBeLessThan(1000); // 1 second
    });
  });

  describe('Real-time Features Load Testing', () => {
    test('WebSocket connections handle concurrent users', async () => {
      const WebSocket = require('ws');
      const connections = [];
      const messagesSent = [];
      const messagesReceived = [];

      const connectionsCount = 50;
      const messagesPerConnection = 10;

      // Create multiple WebSocket connections
      for (let i = 0; i < connectionsCount; i++) {
        const ws = new WebSocket(`ws://localhost:3000/ws`);
        connections.push(ws);

        ws.on('open', () => {
          // Send messages
          for (let j = 0; j < messagesPerConnection; j++) {
            const message = {
              type: 'test',
              data: `Message ${j} from connection ${i}`,
              timestamp: Date.now(),
            };
            ws.send(JSON.stringify(message));
            messagesSent.push(message);
          }
        });

        ws.on('message', (data) => {
          messagesReceived.push(JSON.parse(data));
        });

        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
        });
      }

      // Wait for all connections and messages
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Close all connections
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });

      console.log('WebSocket Load Test Results:', {
        connectionsCreated: connectionsCount,
        messagesSent: messagesSent.length,
        messagesReceived: messagesReceived.length,
        messageDeliveryRate: `${(messagesReceived.length / messagesSent.length * 100).toFixed(2)}%`,
      });

      // WebSocket performance expectations
      expect(messagesReceived.length).toBeGreaterThan(messagesSent.length * 0.8); // 80% delivery rate
    });

    test('Server-Sent Events performance', async () => {
      const EventSource = require('eventsource');
      const connections = [];
      const eventsReceived = [];

      const connectionsCount = 30;
      const testDuration = 10000; // 10 seconds

      // Create multiple SSE connections
      for (let i = 0; i < connectionsCount; i++) {
        const eventSource = new EventSource(`${BASE_URL}/api/events`);
        connections.push(eventSource);

        eventSource.onmessage = (event) => {
          eventsReceived.push({
            data: event.data,
            timestamp: Date.now(),
          });
        };

        eventSource.onerror = (error) => {
          console.error('SSE error:', error);
        };
      }

      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, testDuration));

      // Close all connections
      connections.forEach(eventSource => {
        eventSource.close();
      });

      console.log('SSE Load Test Results:', {
        connectionsCreated: connectionsCount,
        eventsReceived: eventsReceived.length,
        eventsPerSecond: (eventsReceived.length / (testDuration / 1000)).toFixed(2),
        eventsPerConnection: (eventsReceived.length / connectionsCount).toFixed(2),
      });

      // SSE performance expectations
      expect(eventsReceived.length).toBeGreaterThan(0);
      expect(eventsReceived.length / connectionsCount).toBeGreaterThan(1); // At least 1 event per connection
    });
  });

  describe('Memory and Resource Usage Tests', () => {
    test('Memory usage under load', async () => {
      const initialMemory = process.memoryUsage();
      
      const results = await runLoadTest({
        url: BASE_URL,
        concurrentUsers: 100,
        duration: 30000,
      });

      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryGrowthMB = memoryGrowth / (1024 * 1024);

      console.log('Memory Usage Under Load:', {
        initialMemoryMB: (initialMemory.heapUsed / (1024 * 1024)).toFixed(2),
        finalMemoryMB: (finalMemory.heapUsed / (1024 * 1024)).toFixed(2),
        memoryGrowthMB: memoryGrowthMB.toFixed(2),
        totalRequests: results.totalRequests,
        memoryPerRequest: (memoryGrowth / results.totalRequests).toFixed(2),
      });

      // Memory growth should be reasonable
      expect(memoryGrowthMB).toBeLessThan(100); // Less than 100MB growth
    });

    test('CPU usage patterns', async () => {
      const startCPU = process.cpuUsage();
      
      const results = await runLoadTest({
        url: BASE_URL,
        concurrentUsers: 50,
        duration: 15000,
      });

      const endCPU = process.cpuUsage(startCPU);
      const cpuUsagePercent = (endCPU.user + endCPU.system) / (15000 * 1000); // Convert to percentage

      console.log('CPU Usage Under Load:', {
        cpuUsagePercent: `${(cpuUsagePercent * 100).toFixed(2)}%`,
        userCPU: endCPU.user,
        systemCPU: endCPU.system,
        totalRequests: results.totalRequests,
        requestsPerSecond: results.requestsPerSecond.toFixed(2),
      });

      // CPU usage should be reasonable
      expect(cpuUsagePercent).toBeLessThan(0.8); // Less than 80% CPU
    });
  });

  describe('Error Handling Under Load', () => {
    test('Graceful degradation under extreme load', async () => {
      const results = await runLoadTest({
        url: BASE_URL,
        concurrentUsers: 200, // Extreme load
        duration: 30000,
      });

      console.log('Extreme Load Test Results:', {
        totalRequests: results.totalRequests,
        errorRate: `${(results.errorRate * 100).toFixed(2)}%`,
        avgResponseTime: `${results.avgResponseTime.toFixed(2)}ms`,
        p95ResponseTime: `${results.p95ResponseTime.toFixed(2)}ms`,
        requestsPerSecond: results.requestsPerSecond.toFixed(2),
      });

      // Even under extreme load, error rate should be manageable
      expect(results.errorRate).toBeLessThan(0.2); // 20% error rate acceptable under extreme load
      
      // Response times may be higher but should not timeout
      expect(results.avgResponseTime).toBeLessThan(10000); // 10 seconds max
    });

    test('Recovery after load spike', async () => {
      // First, create a load spike
      const spikeResults = await runLoadTest({
        url: BASE_URL,
        concurrentUsers: 150,
        duration: 10000,
      });

      // Wait for system to recover
      await delay(5000);

      // Test normal load after spike
      const recoveryResults = await runLoadTest({
        url: BASE_URL,
        concurrentUsers: 25,
        duration: 10000,
      });

      console.log('Recovery Test Results:', {
        spike: {
          errorRate: `${(spikeResults.errorRate * 100).toFixed(2)}%`,
          avgResponseTime: `${spikeResults.avgResponseTime.toFixed(2)}ms`,
        },
        recovery: {
          errorRate: `${(recoveryResults.errorRate * 100).toFixed(2)}%`,
          avgResponseTime: `${recoveryResults.avgResponseTime.toFixed(2)}ms`,
        },
      });

      // System should recover to normal performance
      expect(recoveryResults.errorRate).toBeLessThan(ACCEPTABLE_ERROR_RATE);
      expect(recoveryResults.avgResponseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });
  });
});