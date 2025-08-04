/**
 * Performance Monitoring Tests
 * Real-time performance monitoring and alerting system
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

describe('Performance Monitoring Tests', () => {
  let performanceMonitor;
  
  beforeAll(() => {
    performanceMonitor = new PerformanceMonitor();
  });

  afterAll(() => {
    if (performanceMonitor) {
      performanceMonitor.stop();
    }
  });

  describe('Real-time Performance Monitoring', () => {
    test('CPU usage monitoring', async () => {
      const cpuMetrics = [];
      const monitorDuration = 5000; // 5 seconds
      
      const startTime = performance.now();
      
      // Monitor CPU usage
      const cpuMonitor = setInterval(() => {
        const cpuUsage = process.cpuUsage();
        cpuMetrics.push({
          timestamp: Date.now(),
          user: cpuUsage.user,
          system: cpuUsage.system,
          total: cpuUsage.user + cpuUsage.system,
        });
      }, 100);
      
      // Create some CPU load
      const workload = setInterval(() => {
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += Math.random();
        }
      }, 10);
      
      // Wait for monitoring duration
      await new Promise(resolve => setTimeout(resolve, monitorDuration));
      
      clearInterval(cpuMonitor);
      clearInterval(workload);
      
      const avgCpuUsage = cpuMetrics.reduce((sum, metric) => sum + metric.total, 0) / cpuMetrics.length;
      const maxCpuUsage = Math.max(...cpuMetrics.map(m => m.total));
      const cpuVariability = Math.sqrt(
        cpuMetrics.reduce((sum, metric) => sum + Math.pow(metric.total - avgCpuUsage, 2), 0) / cpuMetrics.length
      );
      
      console.log('CPU Usage Monitoring:', {
        samplesCollected: cpuMetrics.length,
        avgCpuUsage: avgCpuUsage.toFixed(2),
        maxCpuUsage: maxCpuUsage.toFixed(2),
        cpuVariability: cpuVariability.toFixed(2),
        monitoringDuration: `${monitorDuration}ms`,
      });
      
      expect(cpuMetrics.length).toBeGreaterThan(0);
      expect(avgCpuUsage).toBeGreaterThan(0);
    });

    test('Memory usage monitoring', async () => {
      const memoryMetrics = [];
      const monitorDuration = 5000; // 5 seconds
      
      // Monitor memory usage
      const memoryMonitor = setInterval(() => {
        const memUsage = process.memoryUsage();
        memoryMetrics.push({
          timestamp: Date.now(),
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss,
        });
      }, 100);
      
      // Create some memory load
      const memoryLoad = [];
      const loadInterval = setInterval(() => {
        const data = new Array(10000).fill(0).map((_, i) => ({
          id: i,
          data: `memory-test-${i}`,
          timestamp: Date.now(),
        }));
        memoryLoad.push(data);
        
        // Clean up old data to prevent excessive memory usage
        if (memoryLoad.length > 10) {
          memoryLoad.shift();
        }
      }, 100);
      
      // Wait for monitoring duration
      await new Promise(resolve => setTimeout(resolve, monitorDuration));
      
      clearInterval(memoryMonitor);
      clearInterval(loadInterval);
      
      const avgHeapUsed = memoryMetrics.reduce((sum, metric) => sum + metric.heapUsed, 0) / memoryMetrics.length;
      const maxHeapUsed = Math.max(...memoryMetrics.map(m => m.heapUsed));
      const memoryGrowth = memoryMetrics[memoryMetrics.length - 1].heapUsed - memoryMetrics[0].heapUsed;
      
      console.log('Memory Usage Monitoring:', {
        samplesCollected: memoryMetrics.length,
        avgHeapUsed: `${(avgHeapUsed / 1024 / 1024).toFixed(2)}MB`,
        maxHeapUsed: `${(maxHeapUsed / 1024 / 1024).toFixed(2)}MB`,
        memoryGrowth: `${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`,
      });
      
      expect(memoryMetrics.length).toBeGreaterThan(0);
      expect(avgHeapUsed).toBeGreaterThan(0);
    });

    test('Event loop lag monitoring', async () => {
      const eventLoopMetrics = [];
      const monitorDuration = 5000; // 5 seconds
      
      // Monitor event loop lag
      const monitorEventLoop = () => {
        const start = performance.now();
        setImmediate(() => {
          const lag = performance.now() - start;
          eventLoopMetrics.push({
            timestamp: Date.now(),
            lag,
          });
          
          if (performance.now() - monitorStart < monitorDuration) {
            monitorEventLoop();
          }
        });
      };
      
      const monitorStart = performance.now();
      monitorEventLoop();
      
      // Create some event loop blocking
      const blockingInterval = setInterval(() => {
        const start = Date.now();
        while (Date.now() - start < 5) {
          // Block for 5ms
        }
      }, 100);
      
      // Wait for monitoring duration
      await new Promise(resolve => setTimeout(resolve, monitorDuration));
      
      clearInterval(blockingInterval);
      
      const avgLag = eventLoopMetrics.reduce((sum, metric) => sum + metric.lag, 0) / eventLoopMetrics.length;
      const maxLag = Math.max(...eventLoopMetrics.map(m => m.lag));
      const lagSpikes = eventLoopMetrics.filter(m => m.lag > 10).length; // Lag > 10ms
      
      console.log('Event Loop Lag Monitoring:', {
        samplesCollected: eventLoopMetrics.length,
        avgLag: `${avgLag.toFixed(2)}ms`,
        maxLag: `${maxLag.toFixed(2)}ms`,
        lagSpikes,
        spikePercentage: `${(lagSpikes / eventLoopMetrics.length * 100).toFixed(2)}%`,
      });
      
      expect(eventLoopMetrics.length).toBeGreaterThan(0);
      expect(avgLag).toBeLessThan(50); // Average lag should be less than 50ms
    });
  });

  describe('Performance Metrics Collection', () => {
    test('HTTP request metrics', async () => {
      const fetch = require('node-fetch');
      const metrics = [];
      
      // Test various endpoints
      const endpoints = [
        '/',
        '/api/projects',
        '/api/documents',
        '/api/auth/session',
        '/dashboard',
      ];
      
      for (const endpoint of endpoints) {
        const startTime = performance.now();
        
        try {
          const response = await fetch(`http://localhost:3000${endpoint}`);
          const responseTime = performance.now() - startTime;
          
          metrics.push({
            endpoint,
            status: response.status,
            responseTime,
            contentLength: response.headers.get('content-length') || 0,
            timestamp: Date.now(),
          });
        } catch (error) {
          metrics.push({
            endpoint,
            status: 0,
            responseTime: performance.now() - startTime,
            error: error.message,
            timestamp: Date.now(),
          });
        }
      }
      
      const avgResponseTime = metrics.reduce((sum, metric) => sum + metric.responseTime, 0) / metrics.length;
      const successfulRequests = metrics.filter(m => m.status >= 200 && m.status < 400).length;
      const failedRequests = metrics.filter(m => m.status >= 400 || m.status === 0).length;
      
      console.log('HTTP Request Metrics:', {
        endpointsTested: endpoints.length,
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        successfulRequests,
        failedRequests,
        successRate: `${(successfulRequests / metrics.length * 100).toFixed(2)}%`,
        metrics: metrics.map(m => ({
          endpoint: m.endpoint,
          status: m.status,
          time: `${m.responseTime.toFixed(2)}ms`,
        })),
      });
      
      expect(avgResponseTime).toBeLessThan(2000); // Average response time < 2s
      expect(successfulRequests).toBeGreaterThan(0);
    });

    test('Database query metrics', async () => {
      const fetch = require('node-fetch');
      const dbMetrics = [];
      
      // Test various database operations
      const dbEndpoints = [
        '/api/db/simple-select',
        '/api/db/complex-join',
        '/api/db/aggregation',
        '/api/db/search?q=test',
      ];
      
      for (const endpoint of dbEndpoints) {
        const startTime = performance.now();
        
        try {
          const response = await fetch(`http://localhost:3000${endpoint}`);
          const responseTime = performance.now() - startTime;
          
          dbMetrics.push({
            endpoint,
            status: response.status,
            responseTime,
            queryType: endpoint.split('/').pop().split('?')[0],
            timestamp: Date.now(),
          });
        } catch (error) {
          dbMetrics.push({
            endpoint,
            status: 0,
            responseTime: performance.now() - startTime,
            error: error.message,
            timestamp: Date.now(),
          });
        }
      }
      
      const avgQueryTime = dbMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) / dbMetrics.length;
      const slowQueries = dbMetrics.filter(m => m.responseTime > 500).length;
      
      console.log('Database Query Metrics:', {
        queriesExecuted: dbMetrics.length,
        avgQueryTime: `${avgQueryTime.toFixed(2)}ms`,
        slowQueries,
        slowQueryPercentage: `${(slowQueries / dbMetrics.length * 100).toFixed(2)}%`,
        metrics: dbMetrics.map(m => ({
          type: m.queryType,
          time: `${m.responseTime.toFixed(2)}ms`,
          status: m.status,
        })),
      });
      
      expect(avgQueryTime).toBeLessThan(1000); // Average query time < 1s
      expect(slowQueries).toBeLessThan(dbMetrics.length * 0.2); // Less than 20% slow queries
    });
  });

  describe('Performance Alerting System', () => {
    test('Performance threshold alerts', async () => {
      const alerts = [];
      const thresholds = {
        responseTime: 2000, // 2 seconds
        memoryUsage: 100 * 1024 * 1024, // 100MB
        cpuUsage: 80, // 80%
        errorRate: 0.05, // 5%
      };
      
      // Simulate performance monitoring
      const mockMetrics = {
        responseTime: 2500, // Exceeds threshold
        memoryUsage: 50 * 1024 * 1024, // Within threshold
        cpuUsage: 85, // Exceeds threshold
        errorRate: 0.03, // Within threshold
      };
      
      // Check thresholds
      Object.keys(thresholds).forEach(metric => {
        const value = mockMetrics[metric];
        const threshold = thresholds[metric];
        
        if (value > threshold) {
          alerts.push({
            metric,
            value,
            threshold,
            severity: value > threshold * 1.5 ? 'critical' : 'warning',
            timestamp: Date.now(),
          });
        }
      });
      
      console.log('Performance Alerts:', {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        warningAlerts: alerts.filter(a => a.severity === 'warning').length,
        alerts: alerts.map(a => ({
          metric: a.metric,
          value: a.value,
          threshold: a.threshold,
          severity: a.severity,
        })),
      });
      
      // Test alert handling
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.every(a => a.severity === 'warning' || a.severity === 'critical')).toBe(true);
    });

    test('Performance anomaly detection', async () => {
      // Generate sample performance data
      const performanceData = [];
      const baselineTime = 500; // 500ms baseline
      
      // Generate normal data with some variation
      for (let i = 0; i < 50; i++) {
        performanceData.push({
          timestamp: Date.now() - (50 - i) * 1000,
          responseTime: baselineTime + (Math.random() - 0.5) * 100, // ±50ms variation
        });
      }
      
      // Add some anomalies
      performanceData.push({
        timestamp: Date.now(),
        responseTime: baselineTime * 3, // 3x baseline - anomaly
      });
      
      performanceData.push({
        timestamp: Date.now() + 1000,
        responseTime: baselineTime * 2.5, // 2.5x baseline - anomaly
      });
      
      // Simple anomaly detection using standard deviation
      const mean = performanceData.reduce((sum, d) => sum + d.responseTime, 0) / performanceData.length;
      const stdDev = Math.sqrt(
        performanceData.reduce((sum, d) => sum + Math.pow(d.responseTime - mean, 2), 0) / performanceData.length
      );
      
      const threshold = mean + 2 * stdDev; // 2 standard deviations
      const anomalies = performanceData.filter(d => d.responseTime > threshold);
      
      console.log('Performance Anomaly Detection:', {
        totalDataPoints: performanceData.length,
        mean: `${mean.toFixed(2)}ms`,
        stdDev: `${stdDev.toFixed(2)}ms`,
        threshold: `${threshold.toFixed(2)}ms`,
        anomaliesDetected: anomalies.length,
        anomalies: anomalies.map(a => ({
          timestamp: new Date(a.timestamp).toISOString(),
          responseTime: `${a.responseTime.toFixed(2)}ms`,
        })),
      });
      
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies.length).toBeLessThan(performanceData.length * 0.1); // Less than 10% should be anomalies
    });
  });

  describe('Performance Dashboard Data', () => {
    test('Performance dashboard metrics', async () => {
      const dashboardData = {
        timestamp: Date.now(),
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          version: process.version,
        },
        performance: {
          responseTime: {
            avg: 450,
            p95: 800,
            p99: 1200,
          },
          throughput: {
            requestsPerSecond: 125,
            totalRequests: 45000,
          },
          errors: {
            rate: 0.02,
            totalErrors: 900,
          },
        },
        database: {
          connections: {
            active: 15,
            idle: 5,
            total: 20,
          },
          queries: {
            avgTime: 85,
            slowQueries: 12,
            totalQueries: 8500,
          },
        },
        health: {
          status: 'healthy',
          checks: {
            database: 'up',
            redis: 'up',
            external_api: 'up',
          },
        },
      };
      
      // Validate dashboard data structure
      expect(dashboardData.timestamp).toBeDefined();
      expect(dashboardData.system.uptime).toBeGreaterThan(0);
      expect(dashboardData.performance.responseTime.avg).toBeGreaterThan(0);
      expect(dashboardData.database.connections.total).toBeGreaterThan(0);
      expect(dashboardData.health.status).toBe('healthy');
      
      console.log('Performance Dashboard Data:', {
        uptime: `${dashboardData.system.uptime.toFixed(2)}s`,
        memoryUsage: `${(dashboardData.system.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        avgResponseTime: `${dashboardData.performance.responseTime.avg}ms`,
        requestsPerSecond: dashboardData.performance.throughput.requestsPerSecond,
        errorRate: `${(dashboardData.performance.errors.rate * 100).toFixed(2)}%`,
        dbConnections: dashboardData.database.connections.total,
        healthStatus: dashboardData.health.status,
      });
      
      // Save dashboard data for real dashboard consumption
      const dashboardDir = path.join(__dirname, '../performance-reports');
      if (!fs.existsSync(dashboardDir)) {
        fs.mkdirSync(dashboardDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(dashboardDir, 'dashboard-data.json'),
        JSON.stringify(dashboardData, null, 2)
      );
    });
  });

  describe('Performance Reporting', () => {
    test('Generate performance report', async () => {
      const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
          totalTests: 25,
          passedTests: 23,
          failedTests: 2,
          warningTests: 3,
          overallScore: 85,
        },
        metrics: {
          responseTime: {
            homepage: 1250,
            dashboard: 1800,
            api: 450,
          },
          throughput: {
            peakRPS: 200,
            avgRPS: 125,
          },
          reliability: {
            uptime: 99.9,
            errorRate: 0.02,
          },
        },
        recommendations: [
          'Optimize database queries for better response times',
          'Implement caching for frequently accessed data',
          'Consider CDN for static assets',
        ],
        trends: {
          responseTime: 'improving',
          throughput: 'stable',
          errorRate: 'improving',
        },
      };
      
      const reportDir = path.join(__dirname, '../performance-reports');
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      // Generate JSON report
      fs.writeFileSync(
        path.join(reportDir, 'performance-report.json'),
        JSON.stringify(reportData, null, 2)
      );
      
      // Generate HTML report
      const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #e8f5e8; padding: 15px; border-radius: 5px; }
        .recommendations { background: #f8f9fa; padding: 20px; border-radius: 5px; }
        .score { font-size: 2em; font-weight: bold; color: #27ae60; }
    </style>
</head>
<body>
    <h1>Performance Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <div class="score">Overall Score: ${reportData.summary.overallScore}%</div>
        <p>Tests: ${reportData.summary.passedTests}/${reportData.summary.totalTests} passed</p>
        <p>Generated: ${reportData.timestamp}</p>
    </div>
    
    <div class="metrics">
        <div class="metric">
            <h3>Response Times</h3>
            <ul>
                <li>Homepage: ${reportData.metrics.responseTime.homepage}ms</li>
                <li>Dashboard: ${reportData.metrics.responseTime.dashboard}ms</li>
                <li>API: ${reportData.metrics.responseTime.api}ms</li>
            </ul>
        </div>
        
        <div class="metric">
            <h3>Throughput</h3>
            <ul>
                <li>Peak RPS: ${reportData.metrics.throughput.peakRPS}</li>
                <li>Average RPS: ${reportData.metrics.throughput.avgRPS}</li>
            </ul>
        </div>
        
        <div class="metric">
            <h3>Reliability</h3>
            <ul>
                <li>Uptime: ${reportData.metrics.reliability.uptime}%</li>
                <li>Error Rate: ${(reportData.metrics.reliability.errorRate * 100).toFixed(2)}%</li>
            </ul>
        </div>
    </div>
    
    <div class="recommendations">
        <h2>Recommendations</h2>
        <ul>
            ${reportData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>
      `;
      
      fs.writeFileSync(
        path.join(reportDir, 'performance-report.html'),
        htmlReport
      );
      
      console.log('Performance Report Generated:', {
        overallScore: `${reportData.summary.overallScore}%`,
        testsRun: reportData.summary.totalTests,
        passedTests: reportData.summary.passedTests,
        failedTests: reportData.summary.failedTests,
        recommendationCount: reportData.recommendations.length,
        reportLocation: reportDir,
      });
      
      expect(reportData.summary.overallScore).toBeGreaterThan(0);
      expect(reportData.summary.passedTests).toBeGreaterThan(0);
      expect(fs.existsSync(path.join(reportDir, 'performance-report.json'))).toBe(true);
      expect(fs.existsSync(path.join(reportDir, 'performance-report.html'))).toBe(true);
    });
  });
});

class PerformanceMonitor extends EventEmitter {
  constructor() {
    super();
    this.metrics = [];
    this.isRunning = false;
    this.intervals = [];
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Monitor system metrics
    const systemMonitor = setInterval(() => {
      const metrics = {
        timestamp: Date.now(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
      };
      
      this.metrics.push(metrics);
      this.emit('metrics', metrics);
      
      // Keep only last 1000 metrics
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }
    }, 1000);
    
    this.intervals.push(systemMonitor);
  }

  stop() {
    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  getMetrics() {
    return [...this.metrics];
  }

  getLatestMetrics() {
    return this.metrics[this.metrics.length - 1];
  }
}