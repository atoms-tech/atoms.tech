/**
 * Database Performance Tests
 * Testing database query performance, connection pooling, and optimization
 */

const { performance } = require('perf_hooks');
const fetch = require('node-fetch');

describe('Database Performance Tests', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const API_BASE = `${BASE_URL}/api`;
  
  // Performance thresholds
  const SIMPLE_QUERY_THRESHOLD = 100; // 100ms
  const COMPLEX_QUERY_THRESHOLD = 500; // 500ms
  const BATCH_QUERY_THRESHOLD = 1000; // 1 second
  
  const executeQuery = async (endpoint, options = {}) => {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
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

  describe('Basic Query Performance', () => {
    test('Simple SELECT query performance', async () => {
      const result = await executeQuery('/db/simple-select');
      
      console.log('Simple SELECT Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        success: result.success,
      });
      
      expect(result.responseTime).toBeLessThan(SIMPLE_QUERY_THRESHOLD);
      expect(result.success || result.status === 404).toBe(true);
    });

    test('Simple INSERT query performance', async () => {
      const result = await executeQuery('/db/simple-insert', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Performance Test Item',
          value: 'test-value',
        }),
      });
      
      console.log('Simple INSERT Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(SIMPLE_QUERY_THRESHOLD);
    });

    test('Simple UPDATE query performance', async () => {
      const result = await executeQuery('/db/simple-update', {
        method: 'PUT',
        body: JSON.stringify({
          id: 1,
          name: 'Updated Performance Test Item',
        }),
      });
      
      console.log('Simple UPDATE Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(SIMPLE_QUERY_THRESHOLD);
    });

    test('Simple DELETE query performance', async () => {
      const result = await executeQuery('/db/simple-delete', {
        method: 'DELETE',
        body: JSON.stringify({
          id: 1,
        }),
      });
      
      console.log('Simple DELETE Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(SIMPLE_QUERY_THRESHOLD);
    });
  });

  describe('Complex Query Performance', () => {
    test('JOIN query performance', async () => {
      const result = await executeQuery('/db/complex-join');
      
      console.log('JOIN Query Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        recordCount: result.data?.length || 0,
      });
      
      expect(result.responseTime).toBeLessThan(COMPLEX_QUERY_THRESHOLD);
    });

    test('Aggregation query performance', async () => {
      const result = await executeQuery('/db/aggregation');
      
      console.log('Aggregation Query Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        resultCount: result.data?.length || 0,
      });
      
      expect(result.responseTime).toBeLessThan(COMPLEX_QUERY_THRESHOLD);
    });

    test('Subquery performance', async () => {
      const result = await executeQuery('/db/subquery');
      
      console.log('Subquery Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        recordCount: result.data?.length || 0,
      });
      
      expect(result.responseTime).toBeLessThan(COMPLEX_QUERY_THRESHOLD);
    });

    test('Full-text search performance', async () => {
      const result = await executeQuery('/db/search?q=performance test');
      
      console.log('Full-text Search Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        resultCount: result.data?.length || 0,
      });
      
      expect(result.responseTime).toBeLessThan(COMPLEX_QUERY_THRESHOLD);
    });
  });

  describe('Index Performance', () => {
    test('Indexed column query performance', async () => {
      const result = await executeQuery('/db/indexed-query?id=123');
      
      console.log('Indexed Query Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(SIMPLE_QUERY_THRESHOLD);
    });

    test('Non-indexed column query performance', async () => {
      const result = await executeQuery('/db/non-indexed-query?description=test');
      
      console.log('Non-indexed Query Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      // Non-indexed queries are expected to be slower
      expect(result.responseTime).toBeLessThan(COMPLEX_QUERY_THRESHOLD);
    });

    test('Composite index performance', async () => {
      const result = await executeQuery('/db/composite-index?userId=123&status=active');
      
      console.log('Composite Index Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
      });
      
      expect(result.responseTime).toBeLessThan(SIMPLE_QUERY_THRESHOLD);
    });
  });

  describe('Pagination Performance', () => {
    test('LIMIT/OFFSET pagination performance', async () => {
      const pageSize = 50;
      const pages = [0, 1, 2, 10, 100]; // Test different offsets
      const results = [];
      
      for (const page of pages) {
        const result = await executeQuery(`/db/paginated?limit=${pageSize}&offset=${page * pageSize}`);
        results.push({
          page,
          responseTime: result.responseTime,
          recordCount: result.data?.length || 0,
        });
        
        console.log(`Page ${page} Performance: ${result.responseTime.toFixed(2)}ms`);
      }
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const maxResponseTime = Math.max(...results.map(r => r.responseTime));
      
      console.log('Pagination Performance Summary:', {
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        maxResponseTime: `${maxResponseTime.toFixed(2)}ms`,
        pagesTested: results.length,
      });
      
      expect(avgResponseTime).toBeLessThan(COMPLEX_QUERY_THRESHOLD);
      expect(maxResponseTime).toBeLessThan(COMPLEX_QUERY_THRESHOLD * 2);
    });

    test('Cursor-based pagination performance', async () => {
      const results = [];
      let cursor = null;
      
      // Test multiple pages
      for (let i = 0; i < 5; i++) {
        const url = cursor ? `/db/cursor-paginated?cursor=${cursor}` : '/db/cursor-paginated';
        const result = await executeQuery(url);
        
        results.push({
          page: i,
          responseTime: result.responseTime,
          recordCount: result.data?.items?.length || 0,
        });
        
        cursor = result.data?.nextCursor;
        
        console.log(`Cursor Page ${i} Performance: ${result.responseTime.toFixed(2)}ms`);
        
        if (!cursor) break;
      }
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      
      console.log('Cursor Pagination Performance:', {
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        pagesTested: results.length,
      });
      
      expect(avgResponseTime).toBeLessThan(COMPLEX_QUERY_THRESHOLD);
    });
  });

  describe('Connection Pool Performance', () => {
    test('Concurrent query performance', async () => {
      const concurrentQueries = 20;
      const startTime = performance.now();
      
      const queryPromises = Array.from({ length: concurrentQueries }, (_, i) => 
        executeQuery(`/db/concurrent-test?id=${i}`)
      );
      
      const results = await Promise.all(queryPromises);
      const totalTime = performance.now() - startTime;
      
      const successfulQueries = results.filter(r => r.success).length;
      const avgQueryTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const maxQueryTime = Math.max(...results.map(r => r.responseTime));
      
      console.log('Concurrent Query Performance:', {
        concurrentQueries,
        successfulQueries,
        totalTime: `${totalTime.toFixed(2)}ms`,
        avgQueryTime: `${avgQueryTime.toFixed(2)}ms`,
        maxQueryTime: `${maxQueryTime.toFixed(2)}ms`,
        successRate: `${(successfulQueries / concurrentQueries * 100).toFixed(2)}%`,
      });
      
      expect(successfulQueries).toBeGreaterThan(concurrentQueries * 0.9); // 90% success rate
      expect(avgQueryTime).toBeLessThan(COMPLEX_QUERY_THRESHOLD);
    });

    test('Connection pool exhaustion recovery', async () => {
      // Create more connections than pool size
      const overloadQueries = 100;
      const startTime = performance.now();
      
      const queryPromises = Array.from({ length: overloadQueries }, (_, i) => 
        executeQuery(`/db/long-query?delay=1000&id=${i}`)
      );
      
      const results = await Promise.all(queryPromises);
      const totalTime = performance.now() - startTime;
      
      const successfulQueries = results.filter(r => r.success).length;
      const timeoutQueries = results.filter(r => r.error?.includes('timeout')).length;
      
      console.log('Connection Pool Overload Test:', {
        overloadQueries,
        successfulQueries,
        timeoutQueries,
        totalTime: `${totalTime.toFixed(2)}ms`,
        successRate: `${(successfulQueries / overloadQueries * 100).toFixed(2)}%`,
      });
      
      // Should handle gracefully even under overload
      expect(successfulQueries).toBeGreaterThan(overloadQueries * 0.5); // At least 50% success
    });
  });

  describe('Transaction Performance', () => {
    test('Single transaction performance', async () => {
      const result = await executeQuery('/db/transaction', {
        method: 'POST',
        body: JSON.stringify({
          operations: [
            { type: 'insert', table: 'users', data: { name: 'Test User' } },
            { type: 'insert', table: 'profiles', data: { userId: 'generated', bio: 'Test bio' } },
          ],
        }),
      });
      
      console.log('Transaction Performance:', {
        responseTime: `${result.responseTime.toFixed(2)}ms`,
        status: result.status,
        success: result.success,
      });
      
      expect(result.responseTime).toBeLessThan(COMPLEX_QUERY_THRESHOLD);
    });

    test('Batch transaction performance', async () => {
      const batchSize = 10;
      const transactions = Array.from({ length: batchSize }, (_, i) => ({
        operations: [
          { type: 'insert', table: 'items', data: { name: `Item ${i}` } },
          { type: 'update', table: 'counters', data: { count: i } },
        ],
      }));
      
      const startTime = performance.now();
      
      const results = await Promise.all(
        transactions.map(transaction => 
          executeQuery('/db/transaction', {
            method: 'POST',
            body: JSON.stringify(transaction),
          })
        )
      );
      
      const totalTime = performance.now() - startTime;
      const successfulTransactions = results.filter(r => r.success).length;
      const avgTransactionTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      
      console.log('Batch Transaction Performance:', {
        batchSize,
        successfulTransactions,
        totalTime: `${totalTime.toFixed(2)}ms`,
        avgTransactionTime: `${avgTransactionTime.toFixed(2)}ms`,
        successRate: `${(successfulTransactions / batchSize * 100).toFixed(2)}%`,
      });
      
      expect(successfulTransactions).toBe(batchSize);
      expect(avgTransactionTime).toBeLessThan(COMPLEX_QUERY_THRESHOLD);
    });
  });

  describe('Database Stress Testing', () => {
    test('High-volume INSERT performance', async () => {
      const insertCount = 1000;
      const batchSize = 100;
      const batches = Math.ceil(insertCount / batchSize);
      
      const results = [];
      
      for (let i = 0; i < batches; i++) {
        const batchData = Array.from({ length: batchSize }, (_, j) => ({
          name: `Bulk Item ${i * batchSize + j}`,
          value: Math.random(),
          timestamp: new Date().toISOString(),
        }));
        
        const result = await executeQuery('/db/bulk-insert', {
          method: 'POST',
          body: JSON.stringify({ items: batchData }),
        });
        
        results.push(result);
      }
      
      const totalTime = results.reduce((sum, r) => sum + r.responseTime, 0);
      const avgBatchTime = totalTime / batches;
      const successfulBatches = results.filter(r => r.success).length;
      
      console.log('High-volume INSERT Performance:', {
        insertCount,
        batchSize,
        batches,
        successfulBatches,
        totalTime: `${totalTime.toFixed(2)}ms`,
        avgBatchTime: `${avgBatchTime.toFixed(2)}ms`,
        insertsPerSecond: Math.round(insertCount / (totalTime / 1000)),
      });
      
      expect(successfulBatches).toBeGreaterThan(batches * 0.9); // 90% success rate
      expect(avgBatchTime).toBeLessThan(BATCH_QUERY_THRESHOLD);
    });

    test('Database under sustained load', async () => {
      const testDuration = 30000; // 30 seconds
      const requestsPerSecond = 10;
      const interval = 1000 / requestsPerSecond;
      
      const results = [];
      const startTime = performance.now();
      
      const runLoadTest = async () => {
        while (performance.now() - startTime < testDuration) {
          const result = await executeQuery('/db/load-test');
          results.push(result);
          
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      };
      
      await runLoadTest();
      
      const totalTime = performance.now() - startTime;
      const successfulRequests = results.filter(r => r.success).length;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const actualRequestsPerSecond = results.length / (totalTime / 1000);
      
      console.log('Sustained Load Performance:', {
        testDuration: `${testDuration / 1000}s`,
        totalRequests: results.length,
        successfulRequests,
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        actualRequestsPerSecond: actualRequestsPerSecond.toFixed(2),
        successRate: `${(successfulRequests / results.length * 100).toFixed(2)}%`,
      });
      
      expect(successfulRequests).toBeGreaterThan(results.length * 0.95); // 95% success rate
      expect(avgResponseTime).toBeLessThan(COMPLEX_QUERY_THRESHOLD);
    });
  });

  describe('Query Optimization Performance', () => {
    test('Query plan performance', async () => {
      const queries = [
        '/db/explain-query?table=users&condition=id=123',
        '/db/explain-query?table=documents&condition=user_id=123',
        '/db/explain-query?table=projects&condition=status=active',
      ];
      
      const results = [];
      
      for (const query of queries) {
        const result = await executeQuery(query);
        results.push({
          query,
          responseTime: result.responseTime,
          queryPlan: result.data?.queryPlan || 'N/A',
          indexUsed: result.data?.indexUsed || false,
        });
        
        console.log(`Query Plan for ${query}:`, {
          responseTime: `${result.responseTime.toFixed(2)}ms`,
          indexUsed: result.data?.indexUsed || false,
        });
      }
      
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const indexUsageRate = results.filter(r => r.indexUsed).length / results.length;
      
      console.log('Query Optimization Summary:', {
        queriesAnalyzed: results.length,
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        indexUsageRate: `${(indexUsageRate * 100).toFixed(2)}%`,
      });
      
      expect(avgResponseTime).toBeLessThan(SIMPLE_QUERY_THRESHOLD);
      expect(indexUsageRate).toBeGreaterThan(0.5); // At least 50% should use indexes
    });
  });
});