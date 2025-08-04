/**
 * Lighthouse Performance Tests
 * Automated Lighthouse auditing for comprehensive performance analysis
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

describe('Lighthouse Performance Tests', () => {
  let chrome;
  
  const testUrls = [
    { path: '/', name: 'Landing Page', strictThresholds: true },
    { path: '/login', name: 'Login Page', strictThresholds: true },
    { path: '/signup', name: 'Signup Page', strictThresholds: true },
    { path: '/home', name: 'Home Dashboard', strictThresholds: false }
  ];
  
  const performanceThresholds = {
    strict: {
      performance: 90,
      accessibility: 95,
      bestPractices: 90,
      seo: 90,
      pwa: 80
    },
    lenient: {
      performance: 75,
      accessibility: 90,
      bestPractices: 85,
      seo: 85,
      pwa: 70
    }
  };

  beforeAll(async () => {
    // Launch Chrome for Lighthouse
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    });
  });

  afterAll(async () => {
    if (chrome) {
      await chrome.kill();
    }
  });

  describe('Performance Audits', () => {
    testUrls.forEach(({ path: urlPath, name, strictThresholds }) => {
      test(`${name} should meet performance standards`, async () => {
        const url = `http://localhost:3000${urlPath}`;
        const thresholds = strictThresholds ? performanceThresholds.strict : performanceThresholds.lenient;
        
        try {
          const options = {
            logLevel: 'error',
            output: 'json',
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
            port: chrome.port,
            settings: {
              throttling: {
                rttMs: 40,
                throughputKbps: 10240,
                cpuSlowdownMultiplier: 1,
                requestLatencyMs: 0,
                downloadThroughputKbps: 0,
                uploadThroughputKbps: 0
              }
            }
          };

          const runnerResult = await lighthouse(url, options);
          
          if (!runnerResult) {
            throw new Error('Lighthouse failed to run');
          }

          const { report, lhr } = runnerResult;
          
          // Extract scores
          const scores = {
            performance: Math.round(lhr.categories.performance.score * 100),
            accessibility: Math.round(lhr.categories.accessibility.score * 100),
            bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
            seo: Math.round(lhr.categories.seo.score * 100)
          };

          // Log results
          console.log(`\n📊 ${name} Lighthouse Scores:`);
          console.log(`   Performance: ${scores.performance}/100 (threshold: ${thresholds.performance})`);
          console.log(`   Accessibility: ${scores.accessibility}/100 (threshold: ${thresholds.accessibility})`);
          console.log(`   Best Practices: ${scores.bestPractices}/100 (threshold: ${thresholds.bestPractices})`);
          console.log(`   SEO: ${scores.seo}/100 (threshold: ${thresholds.seo})`);

          // Assert thresholds
          expect(scores.performance).toBeGreaterThanOrEqual(thresholds.performance);
          expect(scores.accessibility).toBeGreaterThanOrEqual(thresholds.accessibility);
          expect(scores.bestPractices).toBeGreaterThanOrEqual(thresholds.bestPractices);
          expect(scores.seo).toBeGreaterThanOrEqual(thresholds.seo);

          // Save detailed report
          const reportDir = './test-results/lighthouse-reports';
          await fs.mkdir(reportDir, { recursive: true });
          
          const reportPath = path.join(reportDir, `lighthouse-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`);
          await fs.writeFile(reportPath, report);

          console.log(`   📄 Detailed report: ${reportPath}`);

          // Check Core Web Vitals
          const audits = lhr.audits;
          const webVitals = {
            lcp: audits['largest-contentful-paint']?.numericValue,
            fid: audits['max-potential-fid']?.numericValue,
            cls: audits['cumulative-layout-shift']?.numericValue,
            fcp: audits['first-contentful-paint']?.numericValue,
            speedIndex: audits['speed-index']?.numericValue,
            tbt: audits['total-blocking-time']?.numericValue
          };

          console.log(`   🎯 Core Web Vitals:`);
          if (webVitals.lcp) console.log(`      LCP: ${webVitals.lcp.toFixed(0)}ms`);
          if (webVitals.fcp) console.log(`      FCP: ${webVitals.fcp.toFixed(0)}ms`);
          if (webVitals.cls) console.log(`      CLS: ${webVitals.cls.toFixed(3)}`);
          if (webVitals.speedIndex) console.log(`      Speed Index: ${webVitals.speedIndex.toFixed(0)}ms`);
          if (webVitals.tbt) console.log(`      TBT: ${webVitals.tbt.toFixed(0)}ms`);

          // Core Web Vitals assertions
          if (webVitals.lcp) {
            expect(webVitals.lcp).toBeLessThan(strictThresholds ? 2500 : 3000);
          }
          if (webVitals.cls) {
            expect(webVitals.cls).toBeLessThan(0.1);
          }
          if (webVitals.fcp) {
            expect(webVitals.fcp).toBeLessThan(strictThresholds ? 1800 : 2200);
          }

        } catch (error) {
          console.error(`❌ Lighthouse audit failed for ${name}:`, error.message);
          throw error;
        }
      }, 60000);
    });
  });

  describe('Performance Optimization Opportunities', () => {
    test('should identify optimization opportunities', async () => {
      const url = 'http://localhost:3000';
      
      const options = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance'],
        port: chrome.port
      };

      const runnerResult = await lighthouse(url, options);
      const { lhr } = runnerResult;
      
      // Check for optimization opportunities
      const opportunities = Object.entries(lhr.audits)
        .filter(([, audit]) => audit.score !== null && audit.score < 1 && audit.details?.overallSavingsMs > 100)
        .map(([id, audit]) => ({
          id,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          displayValue: audit.displayValue,
          savings: audit.details?.overallSavingsMs || 0
        }))
        .sort((a, b) => b.savings - a.savings);

      console.log(`\n💡 Performance Optimization Opportunities (${opportunities.length} found):`);
      
      opportunities.slice(0, 5).forEach((opp, index) => {
        console.log(`   ${index + 1}. ${opp.title}`);
        console.log(`      Potential savings: ${opp.savings.toFixed(0)}ms`);
        console.log(`      Score: ${(opp.score * 100).toFixed(0)}/100`);
      });

      // Should not have critical opportunities (>1000ms savings)
      const criticalOpportunities = opportunities.filter(opp => opp.savings > 1000);
      expect(criticalOpportunities.length).toBeLessThanOrEqual(2);
      
      if (criticalOpportunities.length > 0) {
        console.warn(`⚠️ ${criticalOpportunities.length} critical optimization opportunities found!`);
      }
    }, 45000);
  });

  describe('Resource Performance', () => {
    test('should analyze resource loading performance', async () => {
      const url = 'http://localhost:3000';
      
      const options = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance'],
        port: chrome.port
      };

      const runnerResult = await lighthouse(url, options);
      const { lhr } = runnerResult;
      
      // Analyze resource loading
      const resourceAudits = {
        renderBlocking: lhr.audits['render-blocking-resources'],
        unusedCss: lhr.audits['unused-css-rules'],
        unusedJs: lhr.audits['unused-javascript'],
        efficientImages: lhr.audits['uses-optimized-images'],
        modernImages: lhr.audits['modern-image-formats'],
        textCompression: lhr.audits['uses-text-compression']
      };

      console.log(`\n📦 Resource Performance Analysis:`);
      
      Object.entries(resourceAudits).forEach(([key, audit]) => {
        if (audit && audit.score !== null) {
          const score = Math.round(audit.score * 100);
          const status = score >= 90 ? '✅' : score >= 75 ? '⚠️' : '❌';
          console.log(`   ${status} ${audit.title}: ${score}/100`);
          
          if (audit.displayValue) {
            console.log(`      ${audit.displayValue}`);
          }
        }
      });

      // Resource performance assertions
      if (resourceAudits.renderBlocking?.score !== null) {
        expect(resourceAudits.renderBlocking.score).toBeGreaterThan(0.7);
      }
      
      if (resourceAudits.unusedCss?.score !== null) {
        expect(resourceAudits.unusedCss.score).toBeGreaterThan(0.8);
      }
      
      if (resourceAudits.textCompression?.score !== null) {
        expect(resourceAudits.textCompression.score).toBeGreaterThan(0.9);
      }
    }, 45000);
  });

  describe('Accessibility Performance', () => {
    test('should meet accessibility standards', async () => {
      const url = 'http://localhost:3000';
      
      const options = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['accessibility'],
        port: chrome.port
      };

      const runnerResult = await lighthouse(url, options);
      const { lhr } = runnerResult;
      
      const accessibilityScore = Math.round(lhr.categories.accessibility.score * 100);
      
      console.log(`\n♿ Accessibility Score: ${accessibilityScore}/100`);
      
      // Check specific accessibility audits
      const a11yAudits = {
        colorContrast: lhr.audits['color-contrast'],
        imageAlt: lhr.audits['image-alt'],
        ariaAttrs: lhr.audits['aria-allowed-attr'],
        buttonName: lhr.audits['button-name'],
        linkName: lhr.audits['link-name']
      };

      const failedAudits = Object.entries(a11yAudits)
        .filter(([, audit]) => audit && audit.score !== null && audit.score < 1)
        .map(([key, audit]) => ({ key, ...audit }));

      if (failedAudits.length > 0) {
        console.log(`\n❌ Accessibility Issues (${failedAudits.length} found):`);
        failedAudits.forEach(audit => {
          console.log(`   • ${audit.title}`);
          if (audit.description) {
            console.log(`     ${audit.description}`);
          }
        });
      } else {
        console.log(`✅ No critical accessibility issues found`);
      }

      expect(accessibilityScore).toBeGreaterThanOrEqual(90);
      expect(failedAudits.length).toBeLessThanOrEqual(3); // Allow minor issues
    }, 45000);
  });

  describe('Progressive Web App Features', () => {
    test('should evaluate PWA capabilities', async () => {
      const url = 'http://localhost:3000';
      
      const options = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['pwa'],
        port: chrome.port
      };

      try {
        const runnerResult = await lighthouse(url, options);
        const { lhr } = runnerResult;
        
        if (lhr.categories.pwa) {
          const pwaScore = Math.round(lhr.categories.pwa.score * 100);
          
          console.log(`\n📱 PWA Score: ${pwaScore}/100`);
          
          // Check key PWA features
          const pwaAudits = {
            serviceWorker: lhr.audits['service-worker'],
            installable: lhr.audits['installable-manifest'],
            splashScreen: lhr.audits['splash-screen'],
            viewport: lhr.audits['viewport']
          };

          Object.entries(pwaAudits).forEach(([key, audit]) => {
            if (audit && audit.score !== null) {
              const score = Math.round(audit.score * 100);
              const status = score === 100 ? '✅' : '⚠️';
              console.log(`   ${status} ${audit.title}: ${score}/100`);
            }
          });

          // PWA is optional, so we just log the results
          console.log(`📊 PWA readiness: ${pwaScore >= 80 ? 'Good' : 'Needs improvement'}`);
        }
      } catch (error) {
        console.log(`ℹ️ PWA audit not available or failed: ${error.message}`);
      }
    }, 30000);
  });

  describe('Performance Regression Detection', () => {
    test('should detect performance regressions', async () => {
      const url = 'http://localhost:3000';
      
      const options = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance'],
        port: chrome.port
      };

      const runnerResult = await lighthouse(url, options);
      const { lhr } = runnerResult;
      
      const currentMetrics = {
        performance: Math.round(lhr.categories.performance.score * 100),
        lcp: lhr.audits['largest-contentful-paint']?.numericValue,
        fcp: lhr.audits['first-contentful-paint']?.numericValue,
        cls: lhr.audits['cumulative-layout-shift']?.numericValue,
        speedIndex: lhr.audits['speed-index']?.numericValue,
        tbt: lhr.audits['total-blocking-time']?.numericValue,
        timestamp: Date.now()
      };

      // Save current metrics for trend analysis
      const metricsFile = './test-results/lighthouse-metrics.json';
      let historicalMetrics = [];
      
      try {
        const data = await fs.readFile(metricsFile, 'utf-8');
        historicalMetrics = JSON.parse(data);
      } catch (error) {
        // No historical data yet
      }

      historicalMetrics.push(currentMetrics);
      
      // Keep only last 30 runs
      historicalMetrics = historicalMetrics.slice(-30);
      
      await fs.mkdir(path.dirname(metricsFile), { recursive: true });
      await fs.writeFile(metricsFile, JSON.stringify(historicalMetrics, null, 2));

      console.log(`\n📈 Performance Trends (${historicalMetrics.length} data points):`);
      console.log(`   Current Performance Score: ${currentMetrics.performance}/100`);

      // Check for regressions if we have enough data
      if (historicalMetrics.length >= 5) {
        const recent = historicalMetrics.slice(-5);
        const baseline = historicalMetrics.slice(-10, -5);
        
        if (baseline.length > 0) {
          const recentAvg = recent.reduce((sum, m) => sum + m.performance, 0) / recent.length;
          const baselineAvg = baseline.reduce((sum, m) => sum + m.performance, 0) / baseline.length;
          const change = recentAvg - baselineAvg;
          
          console.log(`   Trend: ${change > 0 ? '+' : ''}${change.toFixed(1)} points`);
          
          // Detect significant regressions (>5 point drop)
          if (change < -5) {
            console.warn(`⚠️ Performance regression detected: ${Math.abs(change).toFixed(1)} point drop`);
            // Don't fail the test, just warn
          } else if (change > 5) {
            console.log(`✅ Performance improvement detected: ${change.toFixed(1)} point gain`);
          }
        }
      }

      // Current run should still meet minimum standards
      expect(currentMetrics.performance).toBeGreaterThanOrEqual(70);
    }, 45000);
  });
});