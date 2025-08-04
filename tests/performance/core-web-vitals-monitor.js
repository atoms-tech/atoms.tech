/**
 * Core Web Vitals Monitor
 * 
 * Real-time monitoring and measurement of Core Web Vitals:
 * - Largest Contentful Paint (LCP)
 * - First Input Delay (FID) / Interaction to Next Paint (INP)
 * - Cumulative Layout Shift (CLS)
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB, getINP } from 'web-vitals';
import { jest } from '@jest/globals';

class CoreWebVitalsMonitor {
  constructor(options = {}) {
    this.metrics = {};
    this.thresholds = {
      LCP: { good: 2500, needsImprovement: 4000 },
      FID: { good: 100, needsImprovement: 300 },
      INP: { good: 200, needsImprovement: 500 },
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FCP: { good: 1800, needsImprovement: 3000 },
      TTFB: { good: 800, needsImprovement: 1800 },
      ...options.thresholds
    };
    this.reportingEndpoint = options.reportingEndpoint;
    this.debug = options.debug || false;
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  init() {
    if (typeof window === 'undefined') {
      console.warn('Core Web Vitals can only be measured in browser environment');
      return;
    }

    this.setupMetricCollectors();
    this.setupPerformanceObserver();
    this.setupUnloadHandler();
  }

  /**
   * Setup metric collectors for all Core Web Vitals
   */
  setupMetricCollectors() {
    // Largest Contentful Paint
    getLCP((metric) => {
      this.recordMetric('LCP', metric);
    });

    // First Input Delay
    getFID((metric) => {
      this.recordMetric('FID', metric);
    });

    // Interaction to Next Paint
    getINP((metric) => {
      this.recordMetric('INP', metric);
    });

    // Cumulative Layout Shift
    getCLS((metric) => {
      this.recordMetric('CLS', metric);
    });

    // First Contentful Paint
    getFCP((metric) => {
      this.recordMetric('FCP', metric);
    });

    // Time to First Byte
    getTTFB((metric) => {
      this.recordMetric('TTFB', metric);
    });
  }

  /**
   * Setup Performance Observer for additional metrics
   */
  setupPerformanceObserver() {
    if (!window.PerformanceObserver) return;

    // Navigation timing
    const navObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'navigation') {
          this.recordNavigationMetrics(entry);
        }
      });
    });

    navObserver.observe({ entryTypes: ['navigation'] });

    // Resource timing
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      this.recordResourceMetrics(entries);
    });

    resourceObserver.observe({ entryTypes: ['resource'] });

    // Long tasks
    if ('PerformanceObserver' in window && 'observe' in PerformanceObserver.prototype) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.recordLongTasks(entries);
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task API not supported
      }
    }
  }

  /**
   * Record a Core Web Vital metric
   */
  recordMetric(name, metric) {
    const value = metric.value;
    const rating = this.getRating(name, value);
    
    this.metrics[name] = {
      value,
      rating,
      delta: metric.delta,
      id: metric.id,
      timestamp: Date.now(),
      entries: metric.entries || []
    };

    if (this.debug) {
      console.log(`${name}: ${value} (${rating})`, metric);
    }

    // Report metric if endpoint is configured
    if (this.reportingEndpoint) {
      this.reportMetric(name, this.metrics[name]);
    }

    // Trigger custom event
    window.dispatchEvent(new CustomEvent('webvital', {
      detail: { name, metric: this.metrics[name] }
    }));
  }

  /**
   * Record navigation timing metrics
   */
  recordNavigationMetrics(entry) {
    const metrics = {
      dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcpConnect: entry.connectEnd - entry.connectStart,
      tlsNegotiation: entry.secureConnectionStart > 0 ? 
        entry.connectEnd - entry.secureConnectionStart : 0,
      serverResponse: entry.responseStart - entry.requestStart,
      domProcessing: entry.domContentLoadedEventStart - entry.responseEnd,
      resourceLoading: entry.loadEventStart - entry.domContentLoadedEventEnd,
      pageLoad: entry.loadEventEnd - entry.navigationStart
    };

    this.metrics.navigation = {
      ...metrics,
      timestamp: Date.now(),
      type: entry.type
    };
  }

  /**
   * Record resource timing metrics
   */
  recordResourceMetrics(entries) {
    const resources = entries.map(entry => ({
      name: entry.name,
      type: this.getResourceType(entry.name),
      duration: entry.duration,
      size: entry.transferSize || entry.decodedBodySize,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0
    }));

    this.metrics.resources = {
      entries: resources,
      summary: this.summarizeResources(resources),
      timestamp: Date.now()
    };
  }

  /**
   * Record long tasks that block the main thread
   */
  recordLongTasks(entries) {
    const longTasks = entries.map(entry => ({
      duration: entry.duration,
      startTime: entry.startTime,
      attribution: entry.attribution || []
    }));

    if (!this.metrics.longTasks) {
      this.metrics.longTasks = [];
    }

    this.metrics.longTasks.push(...longTasks);

    // Calculate total blocking time
    const totalBlockingTime = longTasks.reduce((total, task) => {
      return total + Math.max(0, task.duration - 50);
    }, 0);

    this.metrics.TBT = {
      value: totalBlockingTime,
      tasks: longTasks.length,
      timestamp: Date.now()
    };
  }

  /**
   * Get performance rating based on thresholds
   */
  getRating(metricName, value) {
    const threshold = this.thresholds[metricName];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get resource type from URL
   */
  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * Summarize resource metrics
   */
  summarizeResources(resources) {
    const summary = {};
    
    resources.forEach(resource => {
      if (!summary[resource.type]) {
        summary[resource.type] = { count: 0, totalSize: 0, totalDuration: 0 };
      }
      
      summary[resource.type].count++;
      summary[resource.type].totalSize += resource.size || 0;
      summary[resource.type].totalDuration += resource.duration || 0;
    });

    return summary;
  }

  /**
   * Report metric to analytics endpoint
   */
  async reportMetric(name, metric) {
    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: name,
          value: metric.value,
          rating: metric.rating,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: metric.timestamp,
          sessionId: this.getSessionId()
        })
      });
    } catch (error) {
      console.error('Failed to report metric:', error);
    }
  }

  /**
   * Setup unload handler to capture final metrics
   */
  setupUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      this.reportAllMetrics();
    });

    // Also report on visibility change (for SPA navigation)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.reportAllMetrics();
      }
    });
  }

  /**
   * Report all collected metrics
   */
  reportAllMetrics() {
    if (this.reportingEndpoint && navigator.sendBeacon) {
      const data = JSON.stringify({
        metrics: this.metrics,
        url: window.location.href,
        timestamp: Date.now(),
        sessionId: this.getSessionId()
      });

      navigator.sendBeacon(this.reportingEndpoint, data);
    }
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    return this.sessionId;
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return this.metrics;
  }

  /**
   * Get metric by name
   */
  getMetric(name) {
    return this.metrics[name];
  }

  /**
   * Check if all Core Web Vitals pass thresholds
   */
  areVitalsGood() {
    const coreVitals = ['LCP', 'FID', 'CLS'];
    return coreVitals.every(vital => {
      const metric = this.metrics[vital];
      return metric && metric.rating === 'good';
    });
  }

  /**
   * Get performance score based on Core Web Vitals
   */
  getPerformanceScore() {
    const coreVitals = ['LCP', 'FID', 'CLS'];
    const scores = coreVitals.map(vital => {
      const metric = this.metrics[vital];
      if (!metric) return 0;
      
      switch (metric.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 50;
        case 'poor': return 0;
        default: return 0;
      }
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CoreWebVitalsMonitor;
} else if (typeof window !== 'undefined') {
  window.CoreWebVitalsMonitor = CoreWebVitalsMonitor;
}

export default CoreWebVitalsMonitor;