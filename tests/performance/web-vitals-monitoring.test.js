/**
 * Real-time Web Vitals Monitoring Tests
 * Comprehensive real-time performance monitoring with alerts
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

describe('Real-time Web Vitals Monitoring', () => {
  let page;
  let browser;
  let context;
  let vitalsData = [];

  beforeAll(async () => {
    const { chromium } = require('playwright');
    browser = await chromium.launch({
      headless: process.env.CI !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    context = await browser.newContext();
    page = await context.newPage();

    // Set up real-time monitoring
    await setupRealTimeMonitoring();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    
    // Generate monitoring report
    await generateMonitoringReport();
  });

  const setupRealTimeMonitoring = async () => {
    // Inject Web Vitals monitoring script
    await page.addInitScript(() => {
      window.vitalsCollector = {
        data: [],
        collect: function(metric) {
          this.data.push({
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            timestamp: Date.now(),
            id: metric.id,
            delta: metric.delta,
          });
          
          // Real-time alerts
          this.checkAlerts(metric);
        },
        
        checkAlerts: function(metric) {
          const thresholds = {
            LCP: { warning: 2500, critical: 4000 },
            FCP: { warning: 1800, critical: 3000 },
            CLS: { warning: 0.1, critical: 0.25 },
            FID: { warning: 100, critical: 300 },
            TTFB: { warning: 800, critical: 1800 },
          };
          
          const threshold = thresholds[metric.name];
          if (threshold) {
            if (metric.value > threshold.critical) {
              console.error(`🚨 CRITICAL: ${metric.name} exceeded critical threshold: ${metric.value}`);
            } else if (metric.value > threshold.warning) {
              console.warn(`⚠️ WARNING: ${metric.name} exceeded warning threshold: ${metric.value}`);
            }
          }
        },
        
        getMetrics: function() {
          return this.data;
        },
        
        getLatestMetric: function(name) {
          return this.data.filter(d => d.name === name).slice(-1)[0];
        },
        
        calculateTrends: function(name, windowSize = 10) {
          const metrics = this.data.filter(d => d.name === name).slice(-windowSize);
          if (metrics.length < 2) return null;
          
          const values = metrics.map(m => m.value);
          const trend = values[values.length - 1] - values[0];
          const avgTrend = trend / values.length;
          
          return {
            trend,
            avgTrend,
            isImproving: trend < 0,
            samples: values.length,
          };
        },
      };
    });
  };

  const injectWebVitalsLibrary = async () => {
    await page.addScriptTag({
      url: 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js',
    });

    // Set up metric collection
    await page.evaluate(() => {
      const onMetric = (metric) => {
        window.vitalsCollector.collect(metric);
      };

      // Collect all Web Vitals
      webVitals.getCLS(onMetric);
      webVitals.getFCP(onMetric);
      webVitals.getFID(onMetric);
      webVitals.getLCP(onMetric);
      webVitals.getTTFB(onMetric);
      webVitals.getINP && webVitals.getINP(onMetric);
    });
  };

  const collectVitalsData = async () => {
    const vitals = await page.evaluate(() => {
      return window.vitalsCollector.getMetrics();
    });
    
    vitalsData.push(...vitals);
    return vitals;
  };

  const generateMonitoringReport = async () => {
    const report = {
      testSuite: 'Real-time Web Vitals Monitoring',
      timestamp: new Date().toISOString(),
      totalSamples: vitalsData.length,
      metrics: {},
      alerts: [],
      trends: {},
      summary: {},
    };

    // Process collected data
    const metricNames = ['LCP', 'FCP', 'CLS', 'FID', 'TTFB', 'INP'];
    
    metricNames.forEach(metricName => {
      const metricData = vitalsData.filter(v => v.name === metricName);
      
      if (metricData.length > 0) {
        const values = metricData.map(m => m.value);
        const ratings = metricData.map(m => m.rating);
        
        report.metrics[metricName] = {
          samples: metricData.length,
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          p50: percentile(values, 50),
          p75: percentile(values, 75),
          p90: percentile(values, 90),
          p95: percentile(values, 95),
          ratings: {
            good: ratings.filter(r => r === 'good').length,
            needs_improvement: ratings.filter(r => r === 'needs-improvement').length,
            poor: ratings.filter(r => r === 'poor').length,
          },
        };
      }
    });

    // Save report
    const reportsDir = path.join(__dirname, '../performance-reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    fs.writeFileSync(
      path.join(reportsDir, 'web-vitals-monitoring-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('📊 Web Vitals Monitoring Report Generated');
    console.log(`Total samples collected: ${report.totalSamples}`);
    Object.keys(report.metrics).forEach(metric => {
      const data = report.metrics[metric];
      console.log(`${metric}: avg=${data.avg.toFixed(2)}, p95=${data.p95.toFixed(2)}, samples=${data.samples}`);
    });
  };

  const percentile = (arr, p) => {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    if (Math.floor(index) === index) {
      return sorted[index];
    }
    const lower = sorted[Math.floor(index)];
    const upper = sorted[Math.ceil(index)];
    return lower + (upper - lower) * (index - Math.floor(index));
  };

  describe('Continuous Web Vitals Monitoring', () => {
    test('Homepage continuous monitoring', async () => {
      await page.goto('http://localhost:3000');
      await injectWebVitalsLibrary();

      // Monitor for 30 seconds with interactions
      const monitoringDuration = 30000;
      const startTime = Date.now();
      let interactionCount = 0;

      while (Date.now() - startTime < monitoringDuration) {
        // Simulate user interactions
        if (interactionCount % 5 === 0) {
          try {
            await page.mouse.move(Math.random() * 800, Math.random() * 600);
            await page.waitForTimeout(500);
          } catch (e) {
            // Ignore interaction errors
          }
        }

        // Collect vitals data
        await collectVitalsData();
        
        interactionCount++;
        await page.waitForTimeout(1000);
      }

      const finalVitals = await collectVitalsData();
      
      // Verify continuous monitoring collected data
      expect(finalVitals.length).toBeGreaterThan(0);
      
      // Check for real-time alerts
      const criticalMetrics = finalVitals.filter(v => 
        (v.name === 'LCP' && v.value > 4000) ||
        (v.name === 'FCP' && v.value > 3000) ||
        (v.name === 'CLS' && v.value > 0.25) ||
        (v.name === 'FID' && v.value > 300)
      );

      console.log(`Continuous monitoring collected ${finalVitals.length} data points`);
      if (criticalMetrics.length > 0) {
        console.warn(`🚨 Critical performance issues detected: ${criticalMetrics.length}`);
      }

      // Performance should not have critical issues
      expect(criticalMetrics.length).toBeLessThanOrEqual(2);
    });

    test('Real-time performance regression detection', async () => {
      const testPages = [
        'http://localhost:3000',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/projects',
      ];

      const baseline = {};
      const current = {};

      // Collect baseline data
      for (const pageUrl of testPages) {
        await page.goto(pageUrl);
        await injectWebVitalsLibrary();
        await page.waitForTimeout(5000); // Let metrics stabilize

        const pageVitals = await collectVitalsData();
        baseline[pageUrl] = pageVitals;
      }

      // Wait and collect current data (simulating later measurement)
      await page.waitForTimeout(2000);

      for (const pageUrl of testPages) {
        await page.goto(pageUrl);
        await injectWebVitalsLibrary();
        await page.waitForTimeout(5000);

        const pageVitals = await collectVitalsData();
        current[pageUrl] = pageVitals;
      }

      // Analyze for regressions
      const regressions = [];
      const regressionThreshold = 0.10; // 10% regression threshold

      Object.keys(baseline).forEach(pageUrl => {
        const baselineMetrics = baseline[pageUrl];
        const currentMetrics = current[pageUrl];

        ['LCP', 'FCP', 'CLS', 'FID'].forEach(metricName => {
          const baselineMetric = baselineMetrics.find(m => m.name === metricName);
          const currentMetric = currentMetrics.find(m => m.name === metricName);

          if (baselineMetric && currentMetric) {
            const regression = (currentMetric.value - baselineMetric.value) / baselineMetric.value;
            
            if (regression > regressionThreshold) {
              regressions.push({
                page: pageUrl,
                metric: metricName,
                baseline: baselineMetric.value,
                current: currentMetric.value,
                regression: regression * 100,
              });
            }
          }
        });
      });

      console.log('📈 Regression Analysis Results:');
      regressions.forEach(reg => {
        console.warn(`⚠️ ${reg.metric} on ${reg.page}: ${reg.regression.toFixed(2)}% regression`);
      });

      // Should not have significant regressions
      expect(regressions.length).toBeLessThanOrEqual(1);
    });

    test('Performance monitoring with user journey simulation', async () => {
      const userJourney = [
        { action: 'navigate', url: 'http://localhost:3000', description: 'Landing page' },
        { action: 'click', selector: 'a[href="/dashboard"]', description: 'Navigate to dashboard' },
        { action: 'wait', duration: 2000, description: 'Wait for dashboard load' },
        { action: 'click', selector: 'button', description: 'Interact with UI' },
        { action: 'type', selector: 'input', text: 'test search', description: 'Search functionality' },
        { action: 'navigate', url: 'http://localhost:3000/projects', description: 'View projects' },
      ];

      const journeyVitals = [];

      for (const step of userJourney) {
        console.log(`📱 Executing: ${step.description}`);

        try {
          if (step.action === 'navigate') {
            await page.goto(step.url);
            await injectWebVitalsLibrary();
          } else if (step.action === 'click' && step.selector) {
            await page.click(step.selector);
          } else if (step.action === 'type' && step.selector && step.text) {
            await page.type(step.selector, step.text);
          } else if (step.action === 'wait') {
            await page.waitForTimeout(step.duration);
          }

          // Collect vitals after each step
          await page.waitForTimeout(1000);
          const stepVitals = await collectVitalsData();
          
          journeyVitals.push({
            step: step.description,
            vitals: stepVitals,
            timestamp: Date.now(),
          });

        } catch (error) {
          console.warn(`⚠️ Step failed: ${step.description} - ${error.message}`);
        }
      }

      // Analyze user journey performance
      const journeyReport = {
        totalSteps: userJourney.length,
        completedSteps: journeyVitals.length,
        avgMetrics: {},
        criticalIssues: [],
      };

      // Calculate average metrics across journey
      const allVitals = journeyVitals.flatMap(jv => jv.vitals);
      ['LCP', 'FCP', 'CLS', 'FID'].forEach(metricName => {
        const metricValues = allVitals
          .filter(v => v.name === metricName)
          .map(v => v.value);
        
        if (metricValues.length > 0) {
          journeyReport.avgMetrics[metricName] = {
            avg: metricValues.reduce((sum, val) => sum + val, 0) / metricValues.length,
            max: Math.max(...metricValues),
            samples: metricValues.length,
          };
        }
      });

      console.log('🗺️ User Journey Performance Report:');
      Object.keys(journeyReport.avgMetrics).forEach(metric => {
        const data = journeyReport.avgMetrics[metric];
        console.log(`${metric}: avg=${data.avg.toFixed(2)}, max=${data.max.toFixed(2)}, samples=${data.samples}`);
      });

      // User journey should be performant
      expect(journeyReport.completedSteps).toBeGreaterThanOrEqual(userJourney.length * 0.8);
      
      // Critical metrics should be reasonable
      if (journeyReport.avgMetrics.LCP) {
        expect(journeyReport.avgMetrics.LCP.avg).toBeLessThan(4000);
      }
      if (journeyReport.avgMetrics.CLS) {
        expect(journeyReport.avgMetrics.CLS.avg).toBeLessThan(0.25);
      }
    });
  });

  describe('Performance Monitoring Alerts', () => {
    test('Performance budget alert system', async () => {
      const alerts = [];
      const budgetThresholds = {
        LCP: { warning: 2500, critical: 4000 },
        FCP: { warning: 1800, critical: 3000 },
        CLS: { warning: 0.1, critical: 0.25 },
        FID: { warning: 100, critical: 300 },
        TTFB: { warning: 800, critical: 1800 },
      };

      // Monitor multiple pages for alerts
      const testPages = [
        'http://localhost:3000',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/projects',
      ];

      for (const pageUrl of testPages) {
        await page.goto(pageUrl);
        await injectWebVitalsLibrary();
        await page.waitForTimeout(3000);

        const pageVitals = await collectVitalsData();
        
        // Check each metric against budgets
        Object.keys(budgetThresholds).forEach(metricName => {
          const metric = pageVitals.find(v => v.name === metricName);
          if (metric) {
            const threshold = budgetThresholds[metricName];
            
            if (metric.value > threshold.critical) {
              alerts.push({
                page: pageUrl,
                metric: metricName,
                value: metric.value,
                threshold: threshold.critical,
                level: 'critical',
                severity: 'high',
              });
            } else if (metric.value > threshold.warning) {
              alerts.push({
                page: pageUrl,
                metric: metricName,
                value: metric.value,
                threshold: threshold.warning,
                level: 'warning',
                severity: 'medium',
              });
            }
          }
        });
      }

      // Generate alert report
      const alertReport = {
        timestamp: new Date().toISOString(),
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.level === 'critical').length,
        warningAlerts: alerts.filter(a => a.level === 'warning').length,
        alerts: alerts.sort((a, b) => {
          const severityOrder = { high: 0, medium: 1, low: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        }),
      };

      console.log('🚨 Performance Alert Report:');
      console.log(`Total alerts: ${alertReport.totalAlerts}`);
      console.log(`Critical alerts: ${alertReport.criticalAlerts}`);
      console.log(`Warning alerts: ${alertReport.warningAlerts}`);

      alerts.forEach(alert => {
        const icon = alert.level === 'critical' ? '🚨' : '⚠️';
        console.log(`${icon} ${alert.metric} on ${alert.page}: ${alert.value} > ${alert.threshold}`);
      });

      // Save alert report
      const reportsDir = path.join(__dirname, '../performance-reports');
      fs.mkdirSync(reportsDir, { recursive: true });
      fs.writeFileSync(
        path.join(reportsDir, 'performance-alerts.json'),
        JSON.stringify(alertReport, null, 2)
      );

      // Should not have too many critical alerts
      expect(alertReport.criticalAlerts).toBeLessThanOrEqual(2);
    });

    test('Performance trend monitoring', async () => {
      const measurements = [];
      const measurementInterval = 2000; // 2 seconds
      const totalMeasurements = 10;

      // Take multiple measurements over time
      for (let i = 0; i < totalMeasurements; i++) {
        await page.goto('http://localhost:3000');
        await injectWebVitalsLibrary();
        await page.waitForTimeout(3000);

        const vitals = await collectVitalsData();
        measurements.push({
          iteration: i + 1,
          timestamp: Date.now(),
          vitals,
        });

        console.log(`📊 Measurement ${i + 1}/${totalMeasurements} complete`);
        
        if (i < totalMeasurements - 1) {
          await page.waitForTimeout(measurementInterval);
        }
      }

      // Analyze trends
      const trendAnalysis = {};
      ['LCP', 'FCP', 'CLS', 'FID'].forEach(metricName => {
        const metricMeasurements = measurements.map(m => {
          const metric = m.vitals.find(v => v.name === metricName);
          return metric ? metric.value : null;
        }).filter(v => v !== null);

        if (metricMeasurements.length >= 3) {
          const trend = calculateTrend(metricMeasurements);
          trendAnalysis[metricName] = {
            measurements: metricMeasurements,
            trend: trend.slope,
            correlation: trend.correlation,
            isImproving: trend.slope < 0,
            stability: calculateStability(metricMeasurements),
          };
        }
      });

      console.log('📈 Performance Trend Analysis:');
      Object.keys(trendAnalysis).forEach(metric => {
        const data = trendAnalysis[metric];
        const direction = data.isImproving ? '📉 Improving' : '📈 Degrading';
        console.log(`${metric}: ${direction}, trend=${data.trend.toFixed(4)}, stability=${data.stability.toFixed(2)}`);
      });

      // Trends should be stable or improving
      const degradingTrends = Object.values(trendAnalysis).filter(t => 
        !t.isImproving && Math.abs(t.trend) > 0.1
      );
      
      expect(degradingTrends.length).toBeLessThanOrEqual(1);
    });
  });

  const calculateTrend = (values) => {
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumXX = values.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgX = sumX / n;
    const avgY = sumY / n;
    
    const correlation = values.reduce((sum, val, i) => {
      return sum + (i - avgX) * (val - avgY);
    }, 0) / Math.sqrt(
      values.reduce((sum, _, i) => sum + Math.pow(i - avgX, 2), 0) *
      values.reduce((sum, val) => sum + Math.pow(val - avgY, 2), 0)
    );

    return { slope, correlation };
  };

  const calculateStability = (values) => {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avg;
    
    return 1 - Math.min(coefficientOfVariation, 1); // Stability score 0-1
  };
});