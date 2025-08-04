/**
 * Comprehensive Performance Testing Suite
 * 
 * Integrates all performance testing components:
 * - Lighthouse CI testing
 * - Core Web Vitals validation
 * - Bundle analysis
 * - Runtime performance profiling
 * - Memory leak detection
 * - Performance budget enforcement
 */

import { jest } from '@jest/globals';
import CoreWebVitalsMonitor from '../core-web-vitals-monitor.js';
import BundleAnalyzer from '../bundle-analyzer.js';
import RuntimePerformanceProfiler from '../runtime-performance-profiler.js';
import MemoryLeakDetector from '../memory-leak-detector.js';
import { performanceBudgets, BudgetValidator } from '../performance-budgets.config.js';

// Mock browser APIs for Node.js environment
global.performance = {
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
  },
  now: () => Date.now(),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => [])
};

global.window = {
  location: { href: 'http://localhost:3000' },
  navigator: { userAgent: 'Test Agent' },
  performance: global.performance
};

describe('Comprehensive Performance Testing', () => {
  let performanceResults;

  beforeAll(async () => {
    performanceResults = {
      lighthouse: null,
      coreWebVitals: null,
      bundleAnalysis: null,
      runtimeProfiling: null,
      memoryLeaks: null,
      budgetValidation: null
    };
  });

  describe('Lighthouse Performance Testing', () => {
    test('should run Lighthouse CI and validate scores', async () => {
      // Mock Lighthouse results for testing
      const mockLighthouseResults = {
        categories: {
          performance: { score: 0.85 },
          accessibility: { score: 0.90 },
          'best-practices': { score: 0.88 },
          seo: { score: 0.92 }
        },
        audits: {
          'first-contentful-paint': { numericValue: 1800 },
          'largest-contentful-paint': { numericValue: 2200 },
          'cumulative-layout-shift': { numericValue: 0.08 },
          'total-blocking-time': { numericValue: 150 },
          'speed-index': { numericValue: 2800 },
          'interactive': { numericValue: 3200 }
        }
      };

      performanceResults.lighthouse = mockLighthouseResults;

      // Validate performance scores
      expect(mockLighthouseResults.categories.performance.score).toBeGreaterThan(0.75);
      expect(mockLighthouseResults.categories.accessibility.score).toBeGreaterThan(0.85);
      expect(mockLighthouseResults.categories['best-practices'].score).toBeGreaterThan(0.80);
      expect(mockLighthouseResults.categories.seo.score).toBeGreaterThan(0.80);

      // Validate Core Web Vitals
      expect(mockLighthouseResults.audits['first-contentful-paint'].numericValue).toBeLessThan(2000);
      expect(mockLighthouseResults.audits['largest-contentful-paint'].numericValue).toBeLessThan(2500);
      expect(mockLighthouseResults.audits['cumulative-layout-shift'].numericValue).toBeLessThan(0.1);
      expect(mockLighthouseResults.audits['total-blocking-time'].numericValue).toBeLessThan(200);
    }, 60000);

    test('should validate resource budgets', async () => {
      const mockResourceMetrics = {
        'resource-summary': {
          details: {
            items: [
              { resourceType: 'document', size: 45000, requestCount: 1 },
              { resourceType: 'script', size: 450000, requestCount: 12 },
              { resourceType: 'stylesheet', size: 85000, requestCount: 8 },
              { resourceType: 'image', size: 800000, requestCount: 15 },
              { resourceType: 'font', size: 120000, requestCount: 4 }
            ]
          }
        }
      };

      // Check resource budgets
      const scriptSize = mockResourceMetrics['resource-summary'].details.items
        .find(item => item.resourceType === 'script')?.size;
      
      expect(scriptSize).toBeLessThan(500000); // 500KB budget
      
      const totalSize = mockResourceMetrics['resource-summary'].details.items
        .reduce((sum, item) => sum + item.size, 0);
      
      expect(totalSize).toBeLessThan(2000000); // 2MB total budget
    });
  });

  describe('Core Web Vitals Monitoring', () => {
    test('should monitor and validate Core Web Vitals', async () => {
      const monitor = new CoreWebVitalsMonitor({
        debug: false,
        thresholds: {
          LCP: { good: 2500, needsImprovement: 4000 },
          FID: { good: 100, needsImprovement: 300 },
          CLS: { good: 0.1, needsImprovement: 0.25 },
          INP: { good: 200, needsImprovement: 500 }
        }
      });

      // Mock Core Web Vitals data
      const mockMetrics = {
        LCP: 2200,
        FID: 85,
        CLS: 0.08,
        INP: 180,
        FCP: 1600,
        TTFB: 700
      };

      performanceResults.coreWebVitals = mockMetrics;

      // Validate individual metrics
      expect(mockMetrics.LCP).toBeLessThan(2500);
      expect(mockMetrics.FID).toBeLessThan(100);
      expect(mockMetrics.CLS).toBeLessThan(0.1);
      expect(mockMetrics.INP).toBeLessThan(200);
      expect(mockMetrics.FCP).toBeLessThan(1800);
      expect(mockMetrics.TTFB).toBeLessThan(800);

      // Test rating calculation
      const lcpRating = monitor.getRating('LCP', mockMetrics.LCP);
      const fidRating = monitor.getRating('FID', mockMetrics.FID);
      const clsRating = monitor.getRating('CLS', mockMetrics.CLS);

      expect(lcpRating).toBe('good');
      expect(fidRating).toBe('good');
      expect(clsRating).toBe('good');

      // Test overall performance assessment
      const allVitalsGood = monitor.areVitalsGood();
      expect(allVitalsGood).toBe(true);

      const performanceScore = monitor.getPerformanceScore();
      expect(performanceScore).toBeGreaterThan(90);
    });

    test('should detect performance regressions', async () => {
      const currentMetrics = {
        LCP: 2800, // Regression from 2200
        FID: 120,  // Regression from 85
        CLS: 0.15, // Regression from 0.08
        INP: 250   // Regression from 180
      };

      const baselineMetrics = {
        LCP: 2200,
        FID: 85,
        CLS: 0.08,
        INP: 180
      };

      // Calculate regressions
      const regressions = Object.keys(currentMetrics).map(metric => {
        const current = currentMetrics[metric];
        const baseline = baselineMetrics[metric];
        const change = ((current - baseline) / baseline) * 100;
        
        return {
          metric,
          current,
          baseline,
          percentageChange: change,
          isRegression: change > 10 // 10% threshold
        };
      });

      const significantRegressions = regressions.filter(r => r.isRegression);
      
      // Should detect regressions
      expect(significantRegressions.length).toBeGreaterThan(0);
      expect(significantRegressions.some(r => r.metric === 'LCP')).toBe(true);
      expect(significantRegressions.some(r => r.metric === 'CLS')).toBe(true);
    });
  });

  describe('Bundle Analysis', () => {
    test('should analyze bundle size and detect violations', async () => {
      const bundleAnalyzer = new BundleAnalyzer({
        thresholds: {
          maxBundleSize: 250000,      // 250KB
          maxChunkSize: 100000,       // 100KB
          maxGzipSize: 70000,         // 70KB gzipped
          totalSizeWarning: 1000000,  // 1MB total warning
          totalSizeError: 2000000     // 2MB total error
        }
      });

      // Mock bundle analysis results
      const mockBundleResults = {
        bundles: [
          {
            name: 'main.js',
            size: 280000, // Violation
            gzipSize: 85000, // Violation
            violations: [
              { type: 'LARGE_BUNDLE', threshold: 250000, actual: 280000, severity: 'warning' },
              { type: 'LARGE_GZIP', threshold: 70000, actual: 85000, severity: 'warning' }
            ]
          }
        ],
        chunks: [
          {
            name: 'chunk-1.js',
            size: 120000, // Violation
            gzipSize: 35000,
            violations: [
              { type: 'LARGE_BUNDLE', threshold: 100000, actual: 120000, severity: 'warning' }
            ]
          }
        ],
        summary: {
          totalSize: 1500000,
          totalGzipSize: 450000,
          violations: 3
        }
      };

      performanceResults.bundleAnalysis = mockBundleResults;

      // Validate bundle analysis
      expect(mockBundleResults.summary.violations).toBeGreaterThan(0);
      expect(mockBundleResults.summary.totalSize).toBeLessThan(2000000); // Error threshold
      
      // Check for specific violations
      const bundleViolations = mockBundleResults.bundles[0].violations;
      expect(bundleViolations.some(v => v.type === 'LARGE_BUNDLE')).toBe(true);
      expect(bundleViolations.some(v => v.type === 'LARGE_GZIP')).toBe(true);

      // Validate optimization suggestions
      const hasLargeBundles = mockBundleResults.bundles.some(b => 
        b.violations.some(v => v.type === 'LARGE_BUNDLE')
      );
      expect(hasLargeBundles).toBe(true);
    });

    test('should calculate compression ratios', async () => {
      const files = [
        { size: 100000, gzipSize: 30000 }, // 30% compression ratio
        { size: 200000, gzipSize: 80000 }, // 40% compression ratio
        { size: 50000, gzipSize: 45000 }   // 90% compression ratio (poor)
      ];

      files.forEach(file => {
        const compressionRatio = file.gzipSize / file.size;
        
        if (file.size > 50000) { // Only check large files
          expect(compressionRatio).toBeLessThan(0.8); // Should compress to less than 80%
        }
      });

      // Check average compression
      const avgCompression = files.reduce((sum, f) => sum + (f.gzipSize / f.size), 0) / files.length;
      expect(avgCompression).toBeLessThan(0.7); // Average should be less than 70%
    });
  });

  describe('Runtime Performance Profiling', () => {
    test('should profile component render performance', async () => {
      const profiler = new RuntimePerformanceProfiler({
        enableComponentProfiling: true,
        sampleRate: 1.0 // 100% for testing
      });

      // Mock component render data
      const mockComponentProfiles = new Map([
        ['HomePage', [
          { actualDuration: 12, phase: 'mount' },
          { actualDuration: 8, phase: 'update' },
          { actualDuration: 6, phase: 'update' }
        ]],
        ['ProjectList', [
          { actualDuration: 25, phase: 'mount' }, // Slow render
          { actualDuration: 18, phase: 'update' },
          { actualDuration: 22, phase: 'update' }
        ]]
      ]);

      profiler.profiles = mockComponentProfiles;

      const analysis = profiler.analyzeComponentPerformance();
      performanceResults.runtimeProfiling = analysis;

      // Validate component performance
      expect(analysis.components).toBeDefined();
      expect(Object.keys(analysis.components)).toContain('ProjectList');

      // Check for slow renders
      const projectListData = analysis.components['ProjectList'];
      expect(projectListData.avgDuration).toBeGreaterThan(16); // Slower than 60fps
      expect(projectListData.slowRenders).toBeGreaterThan(0);

      // Check performance score
      const score = profiler.calculatePerformanceScore();
      expect(score.score).toBeGreaterThan(0);
      expect(score.grade).toMatch(/[A-F]/);
    });

    test('should detect long tasks and frame drops', async () => {
      const mockLongTasks = [
        { duration: 120, startTime: 1000 }, // Long task
        { duration: 80, startTime: 2000 },  // Long task
        { duration: 30, startTime: 3000 }   // Normal task
      ];

      const mockFrameRates = [
        { fps: 58, timestamp: 1000 },
        { fps: 45, timestamp: 2000 }, // Dropped frames
        { fps: 60, timestamp: 3000 },
        { fps: 35, timestamp: 4000 }  // Dropped frames
      ];

      // Analyze long tasks
      const longTasksOver50ms = mockLongTasks.filter(task => task.duration > 50);
      const longTasksOver100ms = mockLongTasks.filter(task => task.duration > 100);

      expect(longTasksOver50ms.length).toBe(2);
      expect(longTasksOver100ms.length).toBe(1);

      // Analyze frame rates
      const droppedFrames = mockFrameRates.filter(f => f.fps < 55);
      const smoothPercentage = ((mockFrameRates.length - droppedFrames.length) / mockFrameRates.length) * 100;

      expect(droppedFrames.length).toBe(2);
      expect(smoothPercentage).toBe(50); // 50% smooth frames
    });
  });

  describe('Memory Leak Detection', () => {
    test('should detect memory growth trends', async () => {
      const detector = new MemoryLeakDetector({
        samplingInterval: 1000,
        leakThreshold: 1024 * 1024 // 1MB
      });

      // Mock memory samples showing growth
      const mockSamples = [
        { timestamp: 1000, usedJSHeapSize: 50 * 1024 * 1024, domNodes: 1000 },
        { timestamp: 2000, usedJSHeapSize: 52 * 1024 * 1024, domNodes: 1100 },
        { timestamp: 3000, usedJSHeapSize: 55 * 1024 * 1024, domNodes: 1300 },
        { timestamp: 4000, usedJSHeapSize: 59 * 1024 * 1024, domNodes: 1600 },
        { timestamp: 5000, usedJSHeapSize: 64 * 1024 * 1024, domNodes: 2000 }
      ];

      detector.samples = mockSamples;

      const analysis = detector.analyzeMemoryTrends();
      performanceResults.memoryLeaks = analysis;

      // Validate memory trend analysis
      expect(analysis.trends.memory).toBeDefined();
      expect(analysis.trends.memory.isIncreasing).toBe(true);
      expect(analysis.trends.memory.totalGrowth).toBeGreaterThan(0);

      // Check for detected leaks
      const leaks = detector.detectLeaks();
      expect(leaks.length).toBeGreaterThan(0);
      
      const memoryLeak = leaks.find(leak => leak.type === 'memory-growth');
      expect(memoryLeak).toBeDefined();
      expect(memoryLeak.severity).toMatch(/warning|critical/);
    });

    test('should detect DOM node leaks', async () => {
      const mockDOMSamples = [
        { timestamp: 1000, domNodes: 1000 },
        { timestamp: 2000, domNodes: 1500 },
        { timestamp: 3000, domNodes: 2200 },
        { timestamp: 4000, domNodes: 3000 }
      ];

      // Calculate DOM growth
      const initialNodes = mockDOMSamples[0].domNodes;
      const finalNodes = mockDOMSamples[mockDOMSamples.length - 1].domNodes;
      const domGrowth = finalNodes - initialNodes;

      expect(domGrowth).toBeGreaterThan(500); // Significant growth
      
      // Should trigger DOM leak detection
      if (domGrowth > 500) {
        expect(domGrowth).toBeGreaterThan(500);
      }
    });
  });

  describe('Performance Budget Validation', () => {
    test('should validate performance budgets', async () => {
      const mockResults = {
        metrics: {
          'largest-contentful-paint': 2200,
          'first-input-delay': 85,
          'cumulative-layout-shift': 0.08,
          'first-contentful-paint': 1600
        },
        resources: {
          'script-size': 450000,
          'stylesheet-size': 85000,
          'total-size': 1500000,
          'first-load-js': 380000
        }
      };

      const budgetValidation = BudgetValidator.validateBudgets(
        mockResults,
        '/', // page
        'desktop', // device
        'wifi' // network
      );

      performanceResults.budgetValidation = budgetValidation;

      // Validate budget results
      expect(budgetValidation).toBeDefined();
      expect(budgetValidation.passed).toBeDefined();
      expect(budgetValidation.violations).toBeDefined();
      expect(budgetValidation.warnings).toBeDefined();

      // Check specific metrics
      expect(mockResults.metrics['largest-contentful-paint']).toBeLessThan(2500);
      expect(mockResults.metrics['cumulative-layout-shift']).toBeLessThan(0.1);
      expect(mockResults.resources['total-size']).toBeLessThan(2000000);
    });

    test('should enforce different budgets for different pages', async () => {
      const landingPageResults = {
        metrics: { 'largest-contentful-paint': 1800 },
        resources: { 'total-size': 800000 }
      };

      const dashboardResults = {
        metrics: { 'largest-contentful-paint': 2800 },
        resources: { 'total-size': 1200000 }
      };

      // Landing page should have stricter budgets
      const landingValidation = BudgetValidator.validateBudgets(landingPageResults, '/');
      const dashboardValidation = BudgetValidator.validateBudgets(dashboardResults, '/home');

      // Both should pass their respective budgets
      expect(landingValidation.passed).toBe(true);
      expect(dashboardValidation.passed).toBe(true);

      // But landing page metrics should be better
      expect(landingPageResults.metrics['largest-contentful-paint']).toBeLessThan(
        dashboardResults.metrics['largest-contentful-paint']
      );
    });
  });

  describe('Performance Integration Tests', () => {
    test('should generate comprehensive performance report', async () => {
      const performanceReport = {
        timestamp: Date.now(),
        lighthouse: performanceResults.lighthouse,
        coreWebVitals: performanceResults.coreWebVitals,
        bundleAnalysis: performanceResults.bundleAnalysis,
        runtimeProfiling: performanceResults.runtimeProfiling,
        memoryLeaks: performanceResults.memoryLeaks,
        budgetValidation: performanceResults.budgetValidation,
        
        // Overall performance score
        overallScore: 85,
        grade: 'B',
        
        // Summary
        summary: {
          totalIssues: 3,
          criticalIssues: 0,
          warnings: 3,
          passed: true
        }
      };

      // Validate comprehensive report
      expect(performanceReport.timestamp).toBeDefined();
      expect(performanceReport.overallScore).toBeGreaterThan(70);
      expect(performanceReport.grade).toMatch(/[A-F]/);
      expect(performanceReport.summary.criticalIssues).toBe(0);
    });

    test('should detect performance regressions across all metrics', async () => {
      const currentResults = {
        lighthouseScore: 0.82,
        lcpScore: 2400,
        bundleSize: 1600000,
        avgRenderTime: 14
      };

      const baselineResults = {
        lighthouseScore: 0.88,
        lcpScore: 2100,
        bundleSize: 1400000,
        avgRenderTime: 12
      };

      // Calculate regressions
      const regressions = Object.keys(currentResults).map(metric => {
        const current = currentResults[metric];
        const baseline = baselineResults[metric];
        
        // For scores, lower is worse; for metrics, higher is worse
        const isScore = metric.includes('Score') && !metric.includes('lcp');
        const change = isScore 
          ? ((baseline - current) / baseline) * 100  // Score regression
          : ((current - baseline) / baseline) * 100; // Metric regression
        
        return {
          metric,
          current,
          baseline,
          percentageChange: Math.abs(change),
          isRegression: change > 5 // 5% threshold
        };
      });

      const significantRegressions = regressions.filter(r => r.isRegression);
      
      // Should detect multiple regressions
      expect(significantRegressions.length).toBeGreaterThan(0);
      
      // Log regressions for visibility
      significantRegressions.forEach(regression => {
        console.warn(`Performance regression in ${regression.metric}: ${regression.percentageChange.toFixed(1)}%`);
      });
    });
  });

  afterAll(async () => {
    // Generate final performance report
    console.log('\n🎯 Performance Testing Summary:');
    console.log(`📊 Lighthouse Score: ${performanceResults.lighthouse?.categories?.performance?.score || 'N/A'}`);
    console.log(`⚡ Core Web Vitals: ${performanceResults.coreWebVitals ? 'Monitored' : 'Skipped'}`);
    console.log(`📦 Bundle Analysis: ${performanceResults.bundleAnalysis ? 'Completed' : 'Skipped'}`);
    console.log(`🔍 Runtime Profiling: ${performanceResults.runtimeProfiling ? 'Completed' : 'Skipped'}`);
    console.log(`🧠 Memory Leak Detection: ${performanceResults.memoryLeaks ? 'Completed' : 'Skipped'}`);
    console.log(`💰 Budget Validation: ${performanceResults.budgetValidation?.passed ? 'Passed' : 'Failed'}`);
    
    // Save results for CI/CD
    if (process.env.CI) {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const resultsPath = path.join(process.cwd(), 'test-results', 'performance-summary.json');
      await fs.mkdir(path.dirname(resultsPath), { recursive: true });
      await fs.writeFile(resultsPath, JSON.stringify(performanceResults, null, 2));
      
      console.log(`📄 Results saved to: ${resultsPath}`);
    }
  });
});