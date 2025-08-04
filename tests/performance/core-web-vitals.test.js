/**
 * Core Web Vitals Performance Tests
 * Comprehensive testing of Core Web Vitals metrics
 */

const { test, expect } = require('@playwright/test');
const { performance } = require('perf_hooks');

describe('Core Web Vitals Tests', () => {
  let page;
  let browser;
  let context;

  beforeAll(async () => {
    const { chromium } = require('playwright');
    browser = await chromium.launch({
      headless: process.env.CI !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  const measureWebVitals = async (url, testName) => {
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle' });

    // Inject Web Vitals library
    await page.addScriptTag({
      url: 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js',
    });

    // Collect Web Vitals metrics
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics = {};
        let metricsCollected = 0;
        const expectedMetrics = 5;

        const onMetric = (metric) => {
          metrics[metric.name] = {
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            id: metric.id,
          };
          metricsCollected++;
          
          if (metricsCollected >= expectedMetrics) {
            resolve(metrics);
          }
        };

        // Collect all Core Web Vitals
        webVitals.getCLS(onMetric);
        webVitals.getFCP(onMetric);
        webVitals.getFID(onMetric);
        webVitals.getLCP(onMetric);
        webVitals.getTTFB(onMetric);

        // Fallback timeout
        setTimeout(() => {
          resolve(metrics);
        }, 10000);
      });
    });

    // Get additional performance metrics
    const perfMetrics = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('navigation')[0];
      const paintEntries = performance.getEntriesByType('paint');
      
      return {
        navigation: perfEntries ? {
          domContentLoaded: perfEntries.domContentLoadedEventEnd - perfEntries.domContentLoadedEventStart,
          loadComplete: perfEntries.loadEventEnd - perfEntries.loadEventStart,
          domInteractive: perfEntries.domInteractive - perfEntries.fetchStart,
          domComplete: perfEntries.domComplete - perfEntries.fetchStart,
        } : {},
        paint: paintEntries.reduce((acc, entry) => {
          acc[entry.name] = entry.startTime;
          return acc;
        }, {}),
      };
    });

    // Save metrics to file
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '../performance-reports');
    fs.mkdirSync(reportPath, { recursive: true });
    
    const report = {
      testName,
      url,
      timestamp: new Date().toISOString(),
      vitals,
      perfMetrics,
    };
    
    fs.writeFileSync(
      path.join(reportPath, `${testName}-web-vitals.json`),
      JSON.stringify(report, null, 2)
    );

    return report;
  };

  const assertWebVitals = (vitals, budgets) => {
    const results = [];
    
    Object.keys(budgets).forEach(metric => {
      const vital = vitals[metric];
      const budget = budgets[metric];
      
      if (vital) {
        const passed = vital.value <= budget.value;
        const rating = vital.rating;
        
        results.push({
          metric,
          value: vital.value,
          budget: budget.value,
          unit: budget.unit,
          passed,
          rating,
          description: budget.description,
        });

        console.log(`${metric}: ${vital.value.toFixed(2)}${budget.unit} (${rating}) - Budget: ${budget.value}${budget.unit}`);
        
        if (!passed) {
          console.warn(`⚠️  ${metric} exceeded budget: ${vital.value.toFixed(2)}${budget.unit} > ${budget.value}${budget.unit}`);
        }
      } else {
        console.warn(`⚠️  ${metric} not measured`);
      }
    });

    return results;
  };

  describe('Homepage Core Web Vitals', () => {
    test('Homepage meets Core Web Vitals thresholds', async () => {
      const report = await measureWebVitals('http://localhost:3000', 'homepage');
      
      const budgets = {
        CLS: { value: 0.1, unit: '', description: 'Cumulative Layout Shift' },
        FCP: { value: 1800, unit: 'ms', description: 'First Contentful Paint' },
        FID: { value: 100, unit: 'ms', description: 'First Input Delay' },
        LCP: { value: 2500, unit: 'ms', description: 'Largest Contentful Paint' },
        TTFB: { value: 600, unit: 'ms', description: 'Time to First Byte' },
      };

      const results = assertWebVitals(report.vitals, budgets);
      
      // All metrics should pass or be within acceptable range
      const failedMetrics = results.filter(r => !r.passed);
      const allowedFailures = process.env.CI ? 2 : 1;
      
      expect(failedMetrics.length).toBeLessThanOrEqual(allowedFailures);
      
      // Check individual metrics
      if (report.vitals.LCP) {
        expect(report.vitals.LCP.value).toBeLessThan(budgets.LCP.value);
      }
      if (report.vitals.FCP) {
        expect(report.vitals.FCP.value).toBeLessThan(budgets.FCP.value);
      }
      if (report.vitals.CLS) {
        expect(report.vitals.CLS.value).toBeLessThan(budgets.CLS.value);
      }
    });

    test('Homepage performance on mobile simulation', async () => {
      // Simulate mobile device
      await page.emulateNetworkConditions({
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps
        latency: 40, // 40ms
      });

      await page.setViewportSize({ width: 375, height: 667 });
      await page.setCPUThrottlingRate(4); // 4x slower CPU

      const report = await measureWebVitals('http://localhost:3000', 'homepage-mobile');
      
      const mobileBudgets = {
        CLS: { value: 0.25, unit: '', description: 'Cumulative Layout Shift' },
        FCP: { value: 3000, unit: 'ms', description: 'First Contentful Paint' },
        FID: { value: 300, unit: 'ms', description: 'First Input Delay' },
        LCP: { value: 4000, unit: 'ms', description: 'Largest Contentful Paint' },
        TTFB: { value: 1200, unit: 'ms', description: 'Time to First Byte' },
      };

      const results = assertWebVitals(report.vitals, mobileBudgets);
      
      // Mobile should meet relaxed thresholds
      const failedMetrics = results.filter(r => !r.passed);
      expect(failedMetrics.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Dashboard Core Web Vitals', () => {
    test('Dashboard meets performance thresholds', async () => {
      const report = await measureWebVitals('http://localhost:3000/dashboard', 'dashboard');
      
      const budgets = {
        CLS: { value: 0.15, unit: '', description: 'Cumulative Layout Shift' },
        FCP: { value: 2000, unit: 'ms', description: 'First Contentful Paint' },
        FID: { value: 150, unit: 'ms', description: 'First Input Delay' },
        LCP: { value: 3000, unit: 'ms', description: 'Largest Contentful Paint' },
        TTFB: { value: 800, unit: 'ms', description: 'Time to First Byte' },
      };

      const results = assertWebVitals(report.vitals, budgets);
      
      // Dashboard is more complex, allow more flexibility
      const failedMetrics = results.filter(r => !r.passed);
      expect(failedMetrics.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Document Editor Core Web Vitals', () => {
    test('Document editor meets performance thresholds', async () => {
      const report = await measureWebVitals('http://localhost:3000/document/123', 'document-editor');
      
      const budgets = {
        CLS: { value: 0.2, unit: '', description: 'Cumulative Layout Shift' },
        FCP: { value: 2500, unit: 'ms', description: 'First Contentful Paint' },
        FID: { value: 200, unit: 'ms', description: 'First Input Delay' },
        LCP: { value: 4000, unit: 'ms', description: 'Largest Contentful Paint' },
        TTFB: { value: 1000, unit: 'ms', description: 'Time to First Byte' },
      };

      const results = assertWebVitals(report.vitals, budgets);
      
      // Document editor is complex, allow more flexibility
      const failedMetrics = results.filter(r => !r.passed);
      expect(failedMetrics.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Performance under different conditions', () => {
    test('Performance with slow 3G network', async () => {
      // Simulate slow 3G
      await page.emulateNetworkConditions({
        offline: false,
        downloadThroughput: 500 * 1024 / 8, // 500 Kbps
        uploadThroughput: 500 * 1024 / 8, // 500 Kbps
        latency: 300, // 300ms
      });

      const report = await measureWebVitals('http://localhost:3000', 'homepage-slow3g');
      
      const slow3gBudgets = {
        CLS: { value: 0.3, unit: '', description: 'Cumulative Layout Shift' },
        FCP: { value: 6000, unit: 'ms', description: 'First Contentful Paint' },
        FID: { value: 500, unit: 'ms', description: 'First Input Delay' },
        LCP: { value: 8000, unit: 'ms', description: 'Largest Contentful Paint' },
        TTFB: { value: 2000, unit: 'ms', description: 'Time to First Byte' },
      };

      const results = assertWebVitals(report.vitals, slow3gBudgets);
      
      // Slow network should still be usable
      const failedMetrics = results.filter(r => !r.passed);
      expect(failedMetrics.length).toBeLessThanOrEqual(3);
    });

    test('Performance with slow CPU', async () => {
      // Simulate slow CPU
      await page.setCPUThrottlingRate(6); // 6x slower CPU
      
      const report = await measureWebVitals('http://localhost:3000', 'homepage-slow-cpu');
      
      const slowCPUBudgets = {
        CLS: { value: 0.2, unit: '', description: 'Cumulative Layout Shift' },
        FCP: { value: 4000, unit: 'ms', description: 'First Contentful Paint' },
        FID: { value: 300, unit: 'ms', description: 'First Input Delay' },
        LCP: { value: 6000, unit: 'ms', description: 'Largest Contentful Paint' },
        TTFB: { value: 1000, unit: 'ms', description: 'Time to First Byte' },
      };

      const results = assertWebVitals(report.vitals, slowCPUBudgets);
      
      // Slow CPU should still be usable
      const failedMetrics = results.filter(r => !r.passed);
      expect(failedMetrics.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Core Web Vitals Monitoring', () => {
    test('Performance metrics consistency', async () => {
      const measurements = [];
      const iterations = 5;
      
      for (let i = 0; i < iterations; i++) {
        const report = await measureWebVitals('http://localhost:3000', `consistency-${i}`);
        measurements.push(report.vitals);
        
        // Wait between measurements
        await page.waitForTimeout(2000);
      }
      
      // Analyze consistency
      const metrics = ['LCP', 'FCP', 'CLS', 'FID', 'TTFB'];
      const consistency = {};
      
      metrics.forEach(metric => {
        const values = measurements
          .filter(m => m[metric])
          .map(m => m[metric].value);
        
        if (values.length > 0) {
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
          const stdDev = Math.sqrt(variance);
          const coefficientOfVariation = stdDev / avg;
          
          consistency[metric] = {
            avg,
            stdDev,
            coefficientOfVariation,
            values,
          };
        }
      });
      
      console.log('Performance Consistency Analysis:');
      Object.keys(consistency).forEach(metric => {
        const data = consistency[metric];
        console.log(`${metric}: avg=${data.avg.toFixed(2)}, stdDev=${data.stdDev.toFixed(2)}, cv=${(data.coefficientOfVariation * 100).toFixed(2)}%`);
      });
      
      // Performance should be consistent
      Object.keys(consistency).forEach(metric => {
        const data = consistency[metric];
        expect(data.coefficientOfVariation).toBeLessThan(0.3); // CV < 30%
      });
    });

    test('Performance regression detection', async () => {
      // Simulate baseline performance
      const baseline = await measureWebVitals('http://localhost:3000', 'baseline');
      
      // Simulate current performance
      const current = await measureWebVitals('http://localhost:3000', 'current');
      
      // Compare metrics
      const regressions = [];
      const metrics = ['LCP', 'FCP', 'CLS', 'FID', 'TTFB'];
      
      metrics.forEach(metric => {
        const baselineValue = baseline.vitals[metric]?.value;
        const currentValue = current.vitals[metric]?.value;
        
        if (baselineValue && currentValue) {
          const regression = (currentValue - baselineValue) / baselineValue;
          const isRegression = regression > 0.1; // 10% regression threshold
          
          regressions.push({
            metric,
            baselineValue,
            currentValue,
            regression: regression * 100,
            isRegression,
          });
        }
      });
      
      console.log('Performance Regression Analysis:');
      regressions.forEach(reg => {
        console.log(`${reg.metric}: ${reg.regression.toFixed(2)}% ${reg.isRegression ? 'REGRESSION' : 'OK'}`);
      });
      
      // Should not have significant regressions
      const significantRegressions = regressions.filter(r => r.isRegression);
      expect(significantRegressions.length).toBeLessThanOrEqual(1);
    });
  });

  describe('User Experience Metrics', () => {
    test('Interaction to Next Paint (INP)', async () => {
      await page.goto('http://localhost:3000');
      
      // Simulate user interactions
      const interactions = [];
      
      // Click interaction
      const clickStart = performance.now();
      await page.click('button'); // Assuming there's a button
      const clickEnd = performance.now();
      interactions.push({ type: 'click', duration: clickEnd - clickStart });
      
      // Type interaction
      const typeStart = performance.now();
      await page.type('input[type="text"]', 'test'); // Assuming there's an input
      const typeEnd = performance.now();
      interactions.push({ type: 'type', duration: typeEnd - typeStart });
      
      // Calculate INP (longest interaction)
      const inp = Math.max(...interactions.map(i => i.duration));
      
      console.log('Interaction to Next Paint (INP):', {
        inp: `${inp.toFixed(2)}ms`,
        interactions: interactions.map(i => `${i.type}: ${i.duration.toFixed(2)}ms`),
      });
      
      // INP should be under 200ms for good user experience
      expect(inp).toBeLessThan(200);
    });

    test('Total Blocking Time (TBT)', async () => {
      await page.goto('http://localhost:3000');
      
      // Measure Total Blocking Time
      const tbt = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            let totalBlockingTime = 0;
            
            entries.forEach((entry) => {
              if (entry.duration > 50) {
                totalBlockingTime += entry.duration - 50;
              }
            });
            
            observer.disconnect();
            resolve(totalBlockingTime);
          });
          
          observer.observe({ entryTypes: ['longtask'] });
          
          // Fallback timeout
          setTimeout(() => {
            observer.disconnect();
            resolve(0);
          }, 10000);
        });
      });
      
      console.log('Total Blocking Time (TBT):', `${tbt.toFixed(2)}ms`);
      
      // TBT should be under 200ms
      expect(tbt).toBeLessThan(200);
    });
  });
});