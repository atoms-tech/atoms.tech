/**
 * Real User Monitoring (RUM) System
 * Comprehensive user experience tracking and analytics
 */

class RealUserMonitoring {
  constructor(options = {}) {
    this.options = {
      endpoint: '/api/analytics/rum',
      sampleRate: 0.1,            // 10% of users
      bufferSize: 100,            // Buffer metrics before sending
      flushInterval: 30000,       // Send every 30 seconds
      enableConsoleLogging: false,
      enableErrorTracking: true,
      enableResourceTiming: true,
      enableUserInteractions: true,
      enableNavigationTiming: true,
      enableLongTasks: true,
      ...options
    };
    
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.buffer = [];
    this.observers = [];
    this.startTime = performance.now();
    this.isInitialized = false;
  }

  // Initialize RUM monitoring
  async initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    // Check if user should be sampled
    if (Math.random() > this.options.sampleRate) {
      return; // Skip monitoring for this user
    }
    
    this.collectBasicMetrics();
    this.setupPerformanceObservers();
    this.setupEventListeners();
    this.setupErrorTracking();
    this.startPeriodicFlush();
    
    this.isInitialized = true;
    
    if (this.options.enableConsoleLogging) {
      console.log('🔍 RUM monitoring initialized', {
        sessionId: this.sessionId,
        userId: this.userId,
        sampleRate: this.options.sampleRate
      });
    }
  }

  // Collect basic session and environment metrics
  collectBasicMetrics() {
    const basicMetrics = {
      type: 'session',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      connection: this.getConnectionInfo(),
      deviceMemory: navigator.deviceMemory || null,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
    
    this.addToBuffer(basicMetrics);
  }

  // Setup performance observers
  setupPerformanceObservers() {
    // Web Vitals observer
    if (window.PerformanceObserver) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.addToBuffer({
            type: 'lcp',
            timestamp: Date.now(),
            value: entry.startTime,
            element: entry.element ? this.getElementSelector(entry.element) : null,
            url: entry.url,
            sessionId: this.sessionId
          });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.addToBuffer({
            type: 'fid',
            timestamp: Date.now(),
            value: entry.processingStart - entry.startTime,
            eventType: entry.name,
            sessionId: this.sessionId
          });
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            this.addToBuffer({
              type: 'cls',
              timestamp: Date.now(),
              value: entry.value,
              sources: entry.sources.map(source => ({
                element: this.getElementSelector(source.node),
                previousRect: source.previousRect,
                currentRect: source.currentRect
              })),
              sessionId: this.sessionId
            });
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // Long Tasks
      if (this.options.enableLongTasks) {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.addToBuffer({
              type: 'long-task',
              timestamp: Date.now(),
              duration: entry.duration,
              startTime: entry.startTime,
              attribution: entry.attribution || [],
              sessionId: this.sessionId
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      }

      // Resource Timing
      if (this.options.enableResourceTiming) {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.transferSize > 50000) { // Only track large resources (>50KB)
              this.addToBuffer({
                type: 'resource',
                timestamp: Date.now(),
                name: entry.name,
                duration: entry.duration,
                transferSize: entry.transferSize,
                initiatorType: entry.initiatorType,
                renderBlockingStatus: entry.renderBlockingStatus,
                sessionId: this.sessionId
              });
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      }

      // Navigation Timing
      if (this.options.enableNavigationTiming) {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.addToBuffer({
              type: 'navigation',
              timestamp: Date.now(),
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              domInteractive: entry.domInteractive - entry.fetchStart,
              ttfb: entry.responseStart - entry.requestStart,
              sessionId: this.sessionId
            });
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      }
    }
  }

  // Setup user interaction tracking
  setupEventListeners() {
    if (!this.options.enableUserInteractions) return;

    // Click tracking
    document.addEventListener('click', (event) => {
      this.trackUserInteraction('click', event);
    }, { passive: true });

    // Form submissions
    document.addEventListener('submit', (event) => {
      this.trackUserInteraction('submit', event);
    }, { passive: true });

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.addToBuffer({
        type: 'visibility-change',
        timestamp: Date.now(),
        hidden: document.hidden,
        sessionId: this.sessionId
      });
    });

    // Scroll depth tracking
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        
        // Track milestone scroll depths
        if (scrollDepth >= 25 && scrollDepth % 25 === 0) {
          this.addToBuffer({
            type: 'scroll-depth',
            timestamp: Date.now(),
            depth: scrollDepth,
            sessionId: this.sessionId
          });
        }
      }
    }, { passive: true });

    // Page unload tracking
    window.addEventListener('beforeunload', () => {
      this.addToBuffer({
        type: 'page-unload',
        timestamp: Date.now(),
        timeOnPage: Date.now() - this.startTime,
        maxScrollDepth,
        sessionId: this.sessionId
      });
      
      // Force flush buffer before unload
      this.flushBuffer(true);
    });
  }

  // Track user interactions
  trackUserInteraction(type, event) {
    const element = event.target;
    const interaction = {
      type: 'user-interaction',
      timestamp: Date.now(),
      interactionType: type,
      element: this.getElementSelector(element),
      elementText: element.textContent?.trim().substring(0, 100) || '',
      url: window.location.href,
      sessionId: this.sessionId
    };

    // Add specific data based on interaction type
    if (type === 'click') {
      interaction.coordinates = {
        x: event.clientX,
        y: event.clientY
      };
    }

    this.addToBuffer(interaction);
  }

  // Setup error tracking
  setupErrorTracking() {
    if (!this.options.enableErrorTracking) return;

    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.addToBuffer({
        type: 'javascript-error',
        timestamp: Date.now(),
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        sessionId: this.sessionId
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.addToBuffer({
        type: 'unhandled-rejection',
        timestamp: Date.now(),
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
        sessionId: this.sessionId
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.addToBuffer({
          type: 'resource-error',
          timestamp: Date.now(),
          element: event.target.tagName,
          source: event.target.src || event.target.href,
          sessionId: this.sessionId
        });
      }
    }, true);
  }

  // Get element selector for tracking
  getElementSelector(element) {
    if (!element) return null;
    
    // Try to get a unique identifier
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    
    // Fallback to tag name and position
    const tag = element.tagName.toLowerCase();
    const siblings = Array.from(element.parentNode?.children || []);
    const index = siblings.indexOf(element);
    
    return `${tag}:nth-child(${index + 1})`;
  }

  // Get connection information
  getConnectionInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    
    return null;
  }

  // Generate session ID
  generateSessionId() {
    return `rum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get or generate user ID
  getUserId() {
    let userId = localStorage.getItem('rum_user_id');
    
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('rum_user_id', userId);
    }
    
    return userId;
  }

  // Add metric to buffer
  addToBuffer(metric) {
    this.buffer.push(metric);
    
    // Auto-flush if buffer is full
    if (this.buffer.length >= this.options.bufferSize) {
      this.flushBuffer();
    }
  }

  // Start periodic buffer flushing
  startPeriodicFlush() {
    setInterval(() => {
      if (this.buffer.length > 0) {
        this.flushBuffer();
      }
    }, this.options.flushInterval);
  }

  // Flush buffer to server
  async flushBuffer(isBeforeUnload = false) {
    if (this.buffer.length === 0) return;
    
    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      url: window.location.href,
      metrics: [...this.buffer]
    };
    
    // Clear buffer immediately
    this.buffer = [];
    
    try {
      if (isBeforeUnload && navigator.sendBeacon) {
        // Use sendBeacon for reliable sending during page unload
        navigator.sendBeacon(
          this.options.endpoint,
          JSON.stringify(payload)
        );
      } else {
        // Use fetch for normal sends
        await fetch(this.options.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }
      
      if (this.options.enableConsoleLogging) {
        console.log('📊 RUM metrics sent:', payload.metrics.length);
      }
    } catch (error) {
      if (this.options.enableConsoleLogging) {
        console.warn('⚠️ Failed to send RUM metrics:', error);
      }
      
      // Add metrics back to buffer for retry
      this.buffer.unshift(...payload.metrics);
    }
  }

  // Manual metric tracking
  trackCustomMetric(name, value, metadata = {}) {
    this.addToBuffer({
      type: 'custom-metric',
      timestamp: Date.now(),
      name,
      value,
      metadata,
      sessionId: this.sessionId
    });
  }

  // Track business metrics
  trackBusinessMetric(event, data = {}) {
    this.addToBuffer({
      type: 'business-metric',
      timestamp: Date.now(),
      event,
      data,
      url: window.location.href,
      sessionId: this.sessionId
    });
  }

  // Track feature usage
  trackFeatureUsage(feature, action, metadata = {}) {
    this.addToBuffer({
      type: 'feature-usage',
      timestamp: Date.now(),
      feature,
      action,
      metadata,
      sessionId: this.sessionId
    });
  }

  // Track performance mark
  trackPerformanceMark(name, metadata = {}) {
    const mark = performance.mark(name);
    
    this.addToBuffer({
      type: 'performance-mark',
      timestamp: Date.now(),
      name,
      value: mark.startTime,
      metadata,
      sessionId: this.sessionId
    });
  }

  // Track performance measure
  trackPerformanceMeasure(name, startMark, endMark, metadata = {}) {
    const measure = performance.measure(name, startMark, endMark);
    
    this.addToBuffer({
      type: 'performance-measure',
      timestamp: Date.now(),
      name,
      duration: measure.duration,
      metadata,
      sessionId: this.sessionId
    });
  }

  // Get current session data
  getSessionData() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: this.startTime,
      currentTime: performance.now(),
      bufferedMetrics: this.buffer.length,
      isInitialized: this.isInitialized
    };
  }

  // Stop monitoring and cleanup
  stop() {
    // Flush remaining metrics
    this.flushBuffer(true);
    
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    this.isInitialized = false;
    
    if (this.options.enableConsoleLogging) {
      console.log('🛑 RUM monitoring stopped');
    }
  }
}

// Global RUM instance
let globalRUM = null;

// Initialize RUM
function initializeRUM(options = {}) {
  if (typeof window === 'undefined') return null;
  
  if (!globalRUM) {
    globalRUM = new RealUserMonitoring(options);
    globalRUM.initialize();
  }
  
  return globalRUM;
}

// Export for browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RealUserMonitoring, initializeRUM };
} else if (typeof window !== 'undefined') {
  window.RealUserMonitoring = RealUserMonitoring;
  window.initializeRUM = initializeRUM;
}

// Auto-initialize if configuration is found
if (typeof window !== 'undefined' && window.RUM_CONFIG) {
  initializeRUM(window.RUM_CONFIG);
}