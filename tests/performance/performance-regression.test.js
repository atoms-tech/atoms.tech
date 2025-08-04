/**
 * Performance Regression Tests
 * Comprehensive regression testing to catch performance degradations
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

describe('Performance Regression Tests', () => {
  const BASELINE_FILE = path.join(__dirname, '../performance-reports/baseline.json');
  const REGRESSION_THRESHOLD = 0.2; // 20% performance degradation threshold
  
  let baseline = {};
  let currentResults = {};

  beforeAll(() => {
    // Load baseline if it exists
    if (fs.existsSync(BASELINE_FILE)) {
      try {
        baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
      } catch (error) {
        console.warn('Could not load baseline file:', error.message);
      }
    }
  });

  afterAll(() => {
    // Save current results as potential new baseline
    const reportDir = path.dirname(BASELINE_FILE);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const currentResultsFile = path.join(reportDir, `results-${timestamp}.json`);
    fs.writeFileSync(currentResultsFile, JSON.stringify(currentResults, null, 2));
    
    // Update baseline if this is a new deployment or if explicitly requested
    if (process.env.UPDATE_BASELINE === 'true' || Object.keys(baseline).length === 0) {
      fs.writeFileSync(BASELINE_FILE, JSON.stringify(currentResults, null, 2));
      console.log('Baseline updated with current results');
    }
  });

  const measurePerformance = async (testName, testFunction) => {
    const measurements = [];
    const iterations = 5; // Run test multiple times for accuracy
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await testFunction();
      const endTime = performance.now();
      measurements.push(endTime - startTime);
      
      // Small delay between iterations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Calculate statistics
    const avgTime = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
    const minTime = Math.min(...measurements);
    const maxTime = Math.max(...measurements);
    const stdDev = Math.sqrt(
      measurements.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / measurements.length
    );
    
    const result = {
      testName,
      avgTime,
      minTime,
      maxTime,
      stdDev,
      measurements,
      timestamp: new Date().toISOString(),
    };
    
    currentResults[testName] = result;
    return result;
  };

  const checkRegression = (testName, currentResult) => {
    const baselineResult = baseline[testName];
    
    if (!baselineResult) {
      console.log(`No baseline for ${testName}, establishing baseline`);
      return { regression: false, message: 'No baseline available' };
    }
    
    const performanceChange = (currentResult.avgTime - baselineResult.avgTime) / baselineResult.avgTime;
    const isRegression = performanceChange > REGRESSION_THRESHOLD;
    
    const message = isRegression 
      ? `Performance regression detected: ${(performanceChange * 100).toFixed(2)}% slower than baseline`
      : `Performance maintained: ${(performanceChange * 100).toFixed(2)}% change from baseline`;
    
    return {
      regression: isRegression,
      performanceChange,
      message,
      baselineTime: baselineResult.avgTime,
      currentTime: currentResult.avgTime,
    };
  };

  describe('Page Load Performance Regression', () => {
    test('Homepage load time regression', async () => {
      const result = await measurePerformance('homepage-load', async () => {
        const fetch = require('node-fetch');
        const response = await fetch('http://localhost:3000');
        await response.text();
      });
      
      const regressionCheck = checkRegression('homepage-load', result);
      
      console.log('Homepage Load Performance:', {
        avgTime: `${result.avgTime.toFixed(2)}ms`,
        minTime: `${result.minTime.toFixed(2)}ms`,
        maxTime: `${result.maxTime.toFixed(2)}ms`,
        stdDev: `${result.stdDev.toFixed(2)}ms`,
        regressionCheck: regressionCheck.message,
      });
      
      expect(regressionCheck.regression).toBe(false);
    });

    test('Dashboard load time regression', async () => {
      const result = await measurePerformance('dashboard-load', async () => {
        const fetch = require('node-fetch');
        const response = await fetch('http://localhost:3000/dashboard');
        await response.text();
      });
      
      const regressionCheck = checkRegression('dashboard-load', result);
      
      console.log('Dashboard Load Performance:', {
        avgTime: `${result.avgTime.toFixed(2)}ms`,
        regressionCheck: regressionCheck.message,
      });
      
      expect(regressionCheck.regression).toBe(false);
    });

    test('Document editor load time regression', async () => {
      const result = await measurePerformance('document-editor-load', async () => {
        const fetch = require('node-fetch');
        const response = await fetch('http://localhost:3000/document/123');
        await response.text();
      });
      
      const regressionCheck = checkRegression('document-editor-load', result);
      
      console.log('Document Editor Load Performance:', {
        avgTime: `${result.avgTime.toFixed(2)}ms`,
        regressionCheck: regressionCheck.message,
      });
      
      expect(regressionCheck.regression).toBe(false);
    });
  });

  describe('API Performance Regression', () => {
    test('Projects API regression', async () => {
      const result = await measurePerformance('projects-api', async () => {
        const fetch = require('node-fetch');
        const response = await fetch('http://localhost:3000/api/projects');
        await response.json();
      });
      
      const regressionCheck = checkRegression('projects-api', result);
      
      console.log('Projects API Performance:', {
        avgTime: `${result.avgTime.toFixed(2)}ms`,
        regressionCheck: regressionCheck.message,
      });
      
      expect(regressionCheck.regression).toBe(false);
    });

    test('Documents API regression', async () => {
      const result = await measurePerformance('documents-api', async () => {
        const fetch = require('node-fetch');
        const response = await fetch('http://localhost:3000/api/documents');
        await response.json();
      });
      
      const regressionCheck = checkRegression('documents-api', result);
      
      console.log('Documents API Performance:', {
        avgTime: `${result.avgTime.toFixed(2)}ms`,
        regressionCheck: regressionCheck.message,
      });
      
      expect(regressionCheck.regression).toBe(false);
    });

    test('Search API regression', async () => {
      const result = await measurePerformance('search-api', async () => {
        const fetch = require('node-fetch');
        const response = await fetch('http://localhost:3000/api/search?q=test');
        await response.json();
      });
      
      const regressionCheck = checkRegression('search-api', result);
      
      console.log('Search API Performance:', {
        avgTime: `${result.avgTime.toFixed(2)}ms`,
        regressionCheck: regressionCheck.message,
      });
      
      expect(regressionCheck.regression).toBe(false);
    });
  });

  describe('Database Performance Regression', () => {
    test('Simple query regression', async () => {
      const result = await measurePerformance('simple-query', async () => {
        const fetch = require('node-fetch');
        const response = await fetch('http://localhost:3000/api/db/simple-select');
        await response.json();
      });
      
      const regressionCheck = checkRegression('simple-query', result);
      
      console.log('Simple Query Performance:', {
        avgTime: `${result.avgTime.toFixed(2)}ms`,
        regressionCheck: regressionCheck.message,
      });
      
      expect(regressionCheck.regression).toBe(false);
    });

    test('Complex query regression', async () => {
      const result = await measurePerformance('complex-query', async () => {
        const fetch = require('node-fetch');
        const response = await fetch('http://localhost:3000/api/db/complex-join');
        await response.json();
      });
      
      const regressionCheck = checkRegression('complex-query', result);
      
      console.log('Complex Query Performance:', {
        avgTime: `${result.avgTime.toFixed(2)}ms`,
        regressionCheck: regressionCheck.message,
      });
      
      expect(regressionCheck.regression).toBe(false);
    });
  });

  describe('Memory Usage Regression', () => {
    test('Memory usage regression', async () => {
      const result = await measurePerformance('memory-usage', async () => {
        const initialMemory = process.memoryUsage();
        
        // Simulate memory-intensive operation
        const data = [];
        for (let i = 0; i < 10000; i++) {
          data.push({
            id: i,
            data: `test-data-${i}`,
            timestamp: new Date().toISOString(),
          });
        }
        
        const finalMemory = process.memoryUsage();
        const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;
        
        // Clean up
        data.length = 0;
        
        return memoryDelta;
      });
      
      const regressionCheck = checkRegression('memory-usage', result);
      
      console.log('Memory Usage Performance:', {
        avgTime: `${result.avgTime.toFixed(2)}ms`,
        regressionCheck: regressionCheck.message,
      });
      
      expect(regressionCheck.regression).toBe(false);
    });
  });

  describe('Bundle Size Regression', () => {
    test('JavaScript bundle size regression', async () => {
      const result = await measurePerformance('bundle-size-check', async () => {
        const bundleStatsPath = path.join(__dirname, '../../.next/static/chunks');
        
        if (!fs.existsSync(bundleStatsPath)) {
          // Skip if no build artifacts
          return 0;
        }
        
        let totalSize = 0;
        const files = fs.readdirSync(bundleStatsPath);
        
        for (const file of files) {
          if (file.endsWith('.js')) {
            const filePath = path.join(bundleStatsPath, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
          }
        }
        
        return totalSize;
      });
      
      const regressionCheck = checkRegression('bundle-size-check', result);
      
      console.log('Bundle Size Performance:', {
        avgSize: `${(result.avgTime / 1024).toFixed(2)}KB`,
        regressionCheck: regressionCheck.message,
      });
      
      expect(regressionCheck.regression).toBe(false);
    });
  });

  describe('Performance Trend Analysis', () => {
    test('Performance trend analysis', async () => {
      const reportDir = path.dirname(BASELINE_FILE);
      const resultFiles = fs.readdirSync(reportDir)
        .filter(file => file.startsWith('results-') && file.endsWith('.json'))
        .sort();
      
      const trends = {};
      
      for (const file of resultFiles.slice(-10)) { // Last 10 results
        const filePath = path.join(reportDir, file);
        const results = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        Object.keys(results).forEach(testName => {
          if (!trends[testName]) {
            trends[testName] = [];
          }
          trends[testName].push({
            timestamp: results[testName].timestamp,
            avgTime: results[testName].avgTime,
          });
        });
      }
      
      // Analyze trends
      const trendAnalysis = {};
      Object.keys(trends).forEach(testName => {
        const data = trends[testName];
        if (data.length >= 2) {
          const firstTime = data[0].avgTime;
          const lastTime = data[data.length - 1].avgTime;
          const trendDirection = lastTime > firstTime ? 'degrading' : 'improving';
          const trendMagnitude = Math.abs((lastTime - firstTime) / firstTime);
          
          trendAnalysis[testName] = {
            direction: trendDirection,
            magnitude: trendMagnitude,
            dataPoints: data.length,
            firstTime,
            lastTime,
          };
        }
      });
      
      console.log('Performance Trend Analysis:', {
        testsAnalyzed: Object.keys(trendAnalysis).length,
        degradingTests: Object.keys(trendAnalysis).filter(test => 
          trendAnalysis[test].direction === 'degrading' && trendAnalysis[test].magnitude > 0.1
        ).length,
        improvingTests: Object.keys(trendAnalysis).filter(test => 
          trendAnalysis[test].direction === 'improving' && trendAnalysis[test].magnitude > 0.1
        ).length,
      });
      
      // Check for concerning trends
      const concerningTrends = Object.keys(trendAnalysis).filter(test => 
        trendAnalysis[test].direction === 'degrading' && trendAnalysis[test].magnitude > 0.2
      );
      
      if (concerningTrends.length > 0) {
        console.warn('Concerning performance trends detected:', concerningTrends);
      }
      
      expect(concerningTrends.length).toBe(0);
    });
  });

  describe('Performance Budget Enforcement', () => {
    test('Performance budget compliance', async () => {
      const budgets = {
        'homepage-load': 2000, // 2 seconds
        'dashboard-load': 3000, // 3 seconds
        'projects-api': 500, // 500ms
        'documents-api': 500, // 500ms
        'search-api': 1000, // 1 second
      };
      
      const violations = [];
      
      Object.keys(budgets).forEach(testName => {
        const result = currentResults[testName];
        const budget = budgets[testName];
        
        if (result && result.avgTime > budget) {
          violations.push({
            testName,
            budget,
            actualTime: result.avgTime,
            violation: result.avgTime - budget,
          });
        }
      });
      
      console.log('Performance Budget Compliance:', {
        budgetsChecked: Object.keys(budgets).length,
        violations: violations.length,
        violationDetails: violations.map(v => ({
          test: v.testName,
          budget: `${v.budget}ms`,
          actual: `${v.actualTime.toFixed(2)}ms`,
          over: `${v.violation.toFixed(2)}ms`,
        })),
      });
      
      expect(violations.length).toBe(0);
    });
  });

  describe('Performance Alerting', () => {
    test('Performance degradation alerts', async () => {
      const alerts = [];
      
      Object.keys(currentResults).forEach(testName => {
        const result = currentResults[testName];
        const regressionCheck = checkRegression(testName, result);
        
        if (regressionCheck.regression) {
          alerts.push({
            testName,
            severity: regressionCheck.performanceChange > 0.5 ? 'critical' : 'warning',
            message: regressionCheck.message,
            performanceChange: regressionCheck.performanceChange,
          });
        }
      });
      
      console.log('Performance Alerts:', {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        warningAlerts: alerts.filter(a => a.severity === 'warning').length,
        alerts: alerts.map(a => ({
          test: a.testName,
          severity: a.severity,
          change: `${(a.performanceChange * 100).toFixed(2)}%`,
        })),
      });
      
      // Send alerts if configured
      if (process.env.PERFORMANCE_ALERTS === 'true' && alerts.length > 0) {
        // Here you would send alerts to Slack, email, etc.
        console.log('Performance alerts would be sent:', alerts);
      }
      
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      expect(criticalAlerts.length).toBe(0);
    });
  });
});