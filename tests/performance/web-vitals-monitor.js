/**
 * Core Web Vitals Monitoring System
 * Real-time performance monitoring with automated reporting
 */

const { getCLS, getFID, getFCP, getLCP, getTTFB, getINP } = require('web-vitals');
const fs = require('fs').promises;
const path = require('path');

class WebVitalsMonitor {
  constructor(options = {}) {
    this.options = {
      reportPath: './test-results/web-vitals',
      thresholds: {
        CLS: 0.1,    // Cumulative Layout Shift
        FID: 100,    // First Input Delay (ms)
        FCP: 1800,   // First Contentful Paint (ms)
        LCP: 2500,   // Largest Contentful Paint (ms)
        TTFB: 800,   // Time to First Byte (ms)
        INP: 200     // Interaction to Next Paint (ms)
      },
      sampleSize: 10,
      enableRealUserMonitoring: true,
      ...options
    };
    
    this.metrics = new Map();
    this.sessionId = `session_${Date.now()}`;
    this.violations = [];
  }

  async initialize() {
    // Ensure report directory exists
    await fs.mkdir(this.options.reportPath, { recursive: true });
    
    console.log('🎯 Web Vitals Monitor initialized');
    console.log(`📊 Session ID: ${this.sessionId}`);
    console.log('📈 Monitoring Core Web Vitals...');
  }

  // Core Web Vitals collection
  collectWebVitals() {
    return new Promise((resolve) => {
      const vitals = [];
      let collected = 0;
      const totalMetrics = 6;

      const onMetric = (metric) => {
        vitals.push({
          ...metric,
          timestamp: Date.now(),
          sessionId: this.sessionId,
          url: window?.location?.href || 'unknown'
        });
        
        collected++;
        if (collected >= totalMetrics) {
          resolve(vitals);
        }
      };

      // Collect all Core Web Vitals
      getCLS(onMetric);
      getFID(onMetric);
      getFCP(onMetric);
      getLCP(onMetric);
      getTTFB(onMetric);
      getINP(onMetric);

      // Timeout fallback
      setTimeout(() => {
        if (collected < totalMetrics) {
          console.warn(`⚠️ Only collected ${collected}/${totalMetrics} metrics`);
          resolve(vitals);
        }
      }, 10000);
    });
  }

  // Performance observer for detailed metrics
  setupPerformanceObserver() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    // Navigation timing
    const navigationObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordNavigationMetrics(entry);
      }
    });
    navigationObserver.observe({ entryTypes: ['navigation'] });

    // Resource timing
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordResourceMetrics(entry);
      }
    });
    resourceObserver.observe({ entryTypes: ['resource'] });

    // Paint timing
    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordPaintMetrics(entry);
      }
    });
    paintObserver.observe({ entryTypes: ['paint'] });

    // Layout shift tracking
    const layoutShiftObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          this.recordLayoutShift(entry);
        }
      }
    });
    layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
  }

  recordNavigationMetrics(entry) {
    const metrics = {
      type: 'navigation',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      domInteractive: entry.domInteractive - entry.fetchStart,
      dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcpConnection: entry.connectEnd - entry.connectStart,
      requestResponse: entry.responseEnd - entry.requestStart,
      domProcessing: entry.domComplete - entry.domLoading,
      redirectTime: entry.redirectEnd - entry.redirectStart
    };

    this.metrics.set('navigation', metrics);
    this.checkThresholds(metrics);
  }

  recordResourceMetrics(entry) {
    if (entry.transferSize > 100000) { // Track large resources (>100KB)
      const resourceMetric = {
        type: 'resource',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        name: entry.name,
        duration: entry.duration,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
        initiatorType: entry.initiatorType,
        renderBlockingStatus: entry.renderBlockingStatus
      };

      this.metrics.set(`resource_${entry.name}`, resourceMetric);
    }
  }

  recordPaintMetrics(entry) {
    const paintMetric = {
      type: 'paint',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      name: entry.name,
      startTime: entry.startTime
    };

    this.metrics.set(entry.name, paintMetric);
  }

  recordLayoutShift(entry) {
    const layoutShiftMetric = {
      type: 'layout-shift',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      value: entry.value,
      sources: entry.sources?.map(source => ({
        node: source.node?.tagName || 'unknown',
        previousRect: source.previousRect,
        currentRect: source.currentRect
      })) || []
    };

    this.metrics.set(`layout_shift_${Date.now()}`, layoutShiftMetric);
  }

  checkThresholds(metric) {
    const { thresholds } = this.options;
    
    // Check navigation thresholds
    if (metric.type === 'navigation') {
      if (metric.domContentLoaded > 3000) {
        this.violations.push({
          type: 'DOM_CONTENT_LOADED_SLOW',
          value: metric.domContentLoaded,
          threshold: 3000,
          timestamp: Date.now()
        });
      }
    }
  }

  // Memory performance monitoring
  measureMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        timestamp: Date.now(),
        sessionId: this.sessionId,
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        memoryUsagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  // Generate performance score
  calculatePerformanceScore(vitals) {
    let score = 100;
    const weights = {
      LCP: 25,
      FID: 25,
      CLS: 25,
      FCP: 15,
      TTFB: 10
    };

    vitals.forEach(metric => {
      const threshold = this.options.thresholds[metric.name];
      const weight = weights[metric.name] || 0;
      
      if (threshold && metric.value > threshold) {
        const penalty = Math.min(weight, (metric.value / threshold - 1) * weight);
        score -= penalty;
      }
    });

    return Math.max(0, Math.round(score));
  }

  // Real User Monitoring (RUM)
  setupRealUserMonitoring() {
    if (!this.options.enableRealUserMonitoring) return;

    // Send metrics to analytics endpoint
    const sendMetrics = async (metrics) => {
      try {
        if (typeof fetch !== 'undefined') {
          await fetch('/api/analytics/web-vitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: this.sessionId,
              metrics,
              userAgent: navigator?.userAgent,
              timestamp: Date.now()
            })
          });
        }
      } catch (error) {
        console.warn('Failed to send RUM data:', error);
      }
    };

    // Batch and send metrics periodically
    setInterval(() => {
      const metricsArray = Array.from(this.metrics.values());
      if (metricsArray.length > 0) {
        sendMetrics(metricsArray);
        this.metrics.clear(); // Clear sent metrics
      }
    }, 30000); // Send every 30 seconds
  }

  // Generate comprehensive report
  async generateReport() {
    const vitals = await this.collectWebVitals();
    const memoryUsage = this.measureMemoryUsage();
    const performanceScore = this.calculatePerformanceScore(vitals);
    
    const report = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      performanceScore,
      coreWebVitals: vitals,
      memoryUsage,
      violations: this.violations,
      allMetrics: Array.from(this.metrics.values()),
      summary: {
        totalMetrics: this.metrics.size,
        violationsCount: this.violations.length,
        score: performanceScore,
        grade: this.getPerformanceGrade(performanceScore)
      }
    };

    // Save report to file
    const reportPath = path.join(
      this.options.reportPath,
      `web-vitals-${this.sessionId}-${Date.now()}.json`
    );
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Performance Report Generated: ${reportPath}`);
    console.log(`🎯 Performance Score: ${performanceScore}/100 (${report.summary.grade})`);
    
    return report;
  }

  getPerformanceGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // Start continuous monitoring
  async startMonitoring() {
    await this.initialize();
    this.setupPerformanceObserver();
    this.setupRealUserMonitoring();
    
    // Generate reports periodically
    setInterval(async () => {
      await this.generateReport();
    }, 60000); // Every minute

    console.log('🚀 Continuous Web Vitals monitoring started');
  }

  // Stop monitoring and generate final report
  async stopMonitoring() {
    const finalReport = await this.generateReport();
    console.log('🏁 Web Vitals monitoring stopped');
    return finalReport;
  }
}

module.exports = WebVitalsMonitor;

// Browser integration
if (typeof window !== 'undefined') {
  window.WebVitalsMonitor = WebVitalsMonitor;
}