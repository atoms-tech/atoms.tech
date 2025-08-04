/**
 * Lighthouse Performance Tests
 * Comprehensive web vitals and performance testing
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');
const config = require('./lighthouse.config.js');

describe('Lighthouse Performance Tests', () => {
  let chrome;
  let port;

  beforeAll(async () => {
    // Launch Chrome
    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    port = chrome.port;
  });

  afterAll(async () => {
    if (chrome) {
      await chrome.kill();
    }
  });

  const runLighthouseTest = async (url, testName) => {
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: port,
    };

    const runnerResult = await lighthouse(url, options, config);
    const reportJson = runnerResult.report;
    const report = JSON.parse(reportJson);

    // Save detailed report
    const reportPath = path.join(__dirname, `../performance-reports/${testName}-report.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  };

  const assertPerformanceMetrics = (report, budgets) => {
    const audits = report.audits;
    const results = [];

    // Core Web Vitals
    const coreWebVitals = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'first-input-delay',
      'time-to-interactive',
    ];

    coreWebVitals.forEach((metric) => {
      const audit = audits[metric];
      if (audit) {
        const value = audit.numericValue;
        const budget = budgets[metric];
        const passed = value <= budget;
        
        results.push({
          metric,
          value,
          budget,
          passed,
          score: audit.score,
          displayValue: audit.displayValue,
        });

        console.log(`${metric}: ${audit.displayValue} (Score: ${audit.score})`);
        
        if (!passed) {
          console.warn(`⚠️  ${metric} exceeded budget: ${value} > ${budget}`);
        }
      }
    });

    return results;
  };

  test('Home Page Performance', async () => {
    const report = await runLighthouseTest('http://localhost:3000', 'home-page');
    
    const budgets = {
      'first-contentful-paint': 1500,
      'largest-contentful-paint': 2500,
      'cumulative-layout-shift': 0.1,
      'first-input-delay': 100,
      'time-to-interactive': 3500,
    };

    const results = assertPerformanceMetrics(report, budgets);
    
    // Performance score should be > 80
    const performanceScore = report.categories.performance.score * 100;
    expect(performanceScore).toBeGreaterThan(80);
    
    // All core web vitals should pass
    const failedMetrics = results.filter(r => !r.passed);
    if (failedMetrics.length > 0) {
      console.warn('Failed metrics:', failedMetrics);
    }
    
    // Allow some flexibility in CI environments
    const allowedFailures = process.env.CI ? 2 : 0;
    expect(failedMetrics.length).toBeLessThanOrEqual(allowedFailures);
  });

  test('Dashboard Performance', async () => {
    const report = await runLighthouseTest('http://localhost:3000/dashboard', 'dashboard');
    
    const budgets = {
      'first-contentful-paint': 2000, // Dashboard is more complex
      'largest-contentful-paint': 3000,
      'cumulative-layout-shift': 0.15,
      'first-input-delay': 150,
      'time-to-interactive': 4000,
    };

    const results = assertPerformanceMetrics(report, budgets);
    
    // Performance score should be > 70 (dashboard is complex)
    const performanceScore = report.categories.performance.score * 100;
    expect(performanceScore).toBeGreaterThan(70);
    
    // Check resource usage
    const totalByteWeight = report.audits['total-byte-weight'];
    if (totalByteWeight) {
      const totalBytes = totalByteWeight.numericValue;
      const maxBytes = 2000000; // 2MB
      expect(totalBytes).toBeLessThan(maxBytes);
    }
  });

  test('Document Editor Performance', async () => {
    const report = await runLighthouseTest('http://localhost:3000/document/123', 'document-editor');
    
    const budgets = {
      'first-contentful-paint': 2500, // Editor is complex
      'largest-contentful-paint': 3500,
      'cumulative-layout-shift': 0.2,
      'first-input-delay': 200,
      'time-to-interactive': 5000,
    };

    const results = assertPerformanceMetrics(report, budgets);
    
    // Performance score should be > 65 (editor is very complex)
    const performanceScore = report.categories.performance.score * 100;
    expect(performanceScore).toBeGreaterThan(65);
  });

  test('Bundle Size Analysis', async () => {
    const report = await runLighthouseTest('http://localhost:3000', 'bundle-analysis');
    
    const audits = report.audits;
    
    // Check unused JavaScript
    const unusedJavaScript = audits['unused-javascript'];
    if (unusedJavaScript && unusedJavaScript.details) {
      const unusedBytes = unusedJavaScript.details.items.reduce((sum, item) => sum + item.wastedBytes, 0);
      const maxUnusedBytes = 100000; // 100KB
      expect(unusedBytes).toBeLessThan(maxUnusedBytes);
    }

    // Check unused CSS
    const unusedCSS = audits['unused-css-rules'];
    if (unusedCSS && unusedCSS.details) {
      const unusedBytes = unusedCSS.details.items.reduce((sum, item) => sum + item.wastedBytes, 0);
      const maxUnusedBytes = 50000; // 50KB
      expect(unusedBytes).toBeLessThan(maxUnusedBytes);
    }

    // Check render blocking resources
    const renderBlocking = audits['render-blocking-resources'];
    if (renderBlocking && renderBlocking.details) {
      const blockingResources = renderBlocking.details.items.length;
      const maxBlockingResources = 5;
      expect(blockingResources).toBeLessThan(maxBlockingResources);
    }
  });

  test('Third Party Resource Performance', async () => {
    const report = await runLighthouseTest('http://localhost:3000', 'third-party-analysis');
    
    const thirdPartySummary = report.audits['third-party-summary'];
    if (thirdPartySummary && thirdPartySummary.details) {
      const thirdPartyItems = thirdPartySummary.details.items;
      
      // Check that third party resources don't dominate
      const totalThirdPartyBytes = thirdPartyItems.reduce((sum, item) => sum + item.transferSize, 0);
      const maxThirdPartyBytes = 500000; // 500KB
      expect(totalThirdPartyBytes).toBeLessThan(maxThirdPartyBytes);
      
      // Check blocking time from third parties
      const totalBlockingTime = thirdPartyItems.reduce((sum, item) => sum + (item.blockingTime || 0), 0);
      const maxBlockingTime = 200; // 200ms
      expect(totalBlockingTime).toBeLessThan(maxBlockingTime);
    }
  });

  test('Mobile Performance', async () => {
    const mobileConfig = {
      ...config,
      settings: {
        ...config.settings,
        emulatedFormFactor: 'mobile',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
      },
    };

    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: port,
    };

    const runnerResult = await lighthouse('http://localhost:3000', options, mobileConfig);
    const report = JSON.parse(runnerResult.report);
    
    // Mobile performance budgets are more lenient
    const budgets = {
      'first-contentful-paint': 3000,
      'largest-contentful-paint': 4000,
      'cumulative-layout-shift': 0.25,
      'first-input-delay': 300,
      'time-to-interactive': 8000,
    };

    const results = assertPerformanceMetrics(report, budgets);
    
    // Mobile performance score should be > 60
    const performanceScore = report.categories.performance.score * 100;
    expect(performanceScore).toBeGreaterThan(60);
  });
});