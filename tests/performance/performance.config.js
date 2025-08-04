/**
 * Performance Testing Configuration
 * Central configuration for all performance tests
 */

const config = {
  // Test environment configuration
  environment: {
    baseUrl: process.env.PERFORMANCE_BASE_URL || 'http://localhost:3000',
    timeout: 30000,
    retries: process.env.CI ? 2 : 1,
    slowMotion: process.env.SLOW_MOTION || 0,
    headless: process.env.HEADLESS !== 'false',
  },

  // Performance budgets and thresholds
  budgets: {
    // Core Web Vitals (mobile-first approach)
    webVitals: {
      LCP: { good: 2500, needs_improvement: 4000, poor: 4000 },
      FCP: { good: 1800, needs_improvement: 3000, poor: 3000 },
      CLS: { good: 0.1, needs_improvement: 0.25, poor: 0.25 },
      FID: { good: 100, needs_improvement: 300, poor: 300 },
      TTFB: { good: 800, needs_improvement: 1800, poor: 1800 },
      INP: { good: 200, needs_improvement: 500, poor: 500 },
      TBT: { good: 200, needs_improvement: 600, poor: 600 },
    },

    // Resource budgets
    resources: {
      totalSize: { budget: 2000, unit: 'KB' }, // 2MB total
      javascript: { budget: 500, unit: 'KB' },
      css: { budget: 100, unit: 'KB' },
      images: { budget: 1000, unit: 'KB' },
      fonts: { budget: 150, unit: 'KB' },
      html: { budget: 50, unit: 'KB' },
    },

    // Network budgets
    network: {
      requests: { budget: 50, unit: 'count' },
      thirdPartyRequests: { budget: 10, unit: 'count' },
      domains: { budget: 5, unit: 'count' },
      redirects: { budget: 2, unit: 'count' },
    },

    // Performance timing budgets
    timing: {
      domContentLoaded: { budget: 1500, unit: 'ms' },
      loadComplete: { budget: 3000, unit: 'ms' },
      timeToInteractive: { budget: 3500, unit: 'ms' },
      speedIndex: { budget: 3000, unit: 'ms' },
    },

    // Bundle analysis budgets
    bundle: {
      initialBundle: { budget: 200, unit: 'KB' },
      totalBundle: { budget: 500, unit: 'KB' },
      vendorBundle: { budget: 300, unit: 'KB' },
      asyncChunks: { budget: 100, unit: 'KB' },
      unusedCode: { budget: 50, unit: 'KB' },
    },

    // Memory budgets
    memory: {
      heapUsed: { budget: 100, unit: 'MB' },
      heapTotal: { budget: 200, unit: 'MB' },
      external: { budget: 50, unit: 'MB' },
      rss: { budget: 500, unit: 'MB' },
    },

    // Load testing budgets
    load: {
      responseTime: { budget: 2000, unit: 'ms' },
      errorRate: { budget: 5, unit: 'percent' },
      throughput: { budget: 100, unit: 'rps' },
      concurrentUsers: { budget: 100, unit: 'users' },
    },
  },

  // Test pages and scenarios
  testPages: {
    homepage: {
      url: '/',
      name: 'Homepage',
      category: 'landing',
      budgetMultiplier: 1.0,
      criticalUserJourney: true,
    },
    dashboard: {
      url: '/dashboard',
      name: 'Dashboard',
      category: 'app',
      budgetMultiplier: 1.2,
      criticalUserJourney: true,
    },
    documentEditor: {
      url: '/document/123',
      name: 'Document Editor',
      category: 'app',
      budgetMultiplier: 1.5,
      criticalUserJourney: true,
    },
    projectList: {
      url: '/projects',
      name: 'Project List',
      category: 'app',
      budgetMultiplier: 1.1,
      criticalUserJourney: false,
    },
    settings: {
      url: '/settings',
      name: 'Settings',
      category: 'app',
      budgetMultiplier: 1.0,
      criticalUserJourney: false,
    },
  },

  // Device and network profiles
  profiles: {
    desktop: {
      name: 'Desktop',
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      network: null,
      cpuThrottling: 1,
    },
    mobile: {
      name: 'Mobile',
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      network: {
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps
        latency: 40,
      },
      cpuThrottling: 4,
    },
    tablet: {
      name: 'Tablet',
      viewport: { width: 768, height: 1024 },
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      network: {
        offline: false,
        downloadThroughput: 2 * 1024 * 1024 / 8, // 2 Mbps
        uploadThroughput: 1 * 1024 * 1024 / 8, // 1 Mbps
        latency: 30,
      },
      cpuThrottling: 2,
    },
    slow3g: {
      name: 'Slow 3G',
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      network: {
        offline: false,
        downloadThroughput: 500 * 1024 / 8, // 500 Kbps
        uploadThroughput: 500 * 1024 / 8, // 500 Kbps
        latency: 300,
      },
      cpuThrottling: 4,
    },
    fast3g: {
      name: 'Fast 3G',
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      network: {
        offline: false,
        downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps
        latency: 150,
      },
      cpuThrottling: 4,
    },
  },

  // Lighthouse configuration
  lighthouse: {
    chrome: {
      flags: ['--headless', '--no-sandbox', '--disable-gpu'],
    },
    settings: {
      onlyCategories: ['performance'],
      formFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
      emulatedFormFactor: 'desktop',
      auditMode: false,
      gatherMode: false,
      locale: 'en-US',
      blockedUrlPatterns: [],
      additionalTraceCategories: null,
      extraHeaders: null,
      precomputedLanternData: null,
      skipAudits: null,
      budgets: null,
    },
  },

  // Load testing configuration
  loadTesting: {
    scenarios: {
      smoke: {
        duration: '30s',
        vus: 5,
        rampUp: '5s',
        rampDown: '5s',
      },
      load: {
        duration: '2m',
        vus: 50,
        rampUp: '10s',
        rampDown: '10s',
      },
      stress: {
        duration: '5m',
        vus: 200,
        rampUp: '30s',
        rampDown: '30s',
      },
      spike: {
        duration: '1m',
        vus: 500,
        rampUp: '5s',
        rampDown: '5s',
      },
    },
    thresholds: {
      http_req_duration: ['p(95)<2000'],
      http_req_failed: ['rate<0.05'],
      http_reqs: ['rate>10'],
    },
  },

  // Reporting configuration
  reporting: {
    outputDir: './tests/performance-reports',
    formats: ['json', 'html', 'csv'],
    generateTrends: true,
    saveScreenshots: true,
    saveTraces: true,
    saveHar: true,
    notifications: {
      slack: {
        enabled: process.env.SLACK_WEBHOOK_URL !== undefined,
        webhook: process.env.SLACK_WEBHOOK_URL,
        channel: '#performance-alerts',
      },
      email: {
        enabled: false,
        recipients: [],
      },
    },
  },

  // CI/CD integration
  cicd: {
    failOnBudgetExceeded: true,
    budgetTolerancePercent: 10,
    regressionThresholdPercent: 5,
    baseline: {
      enabled: true,
      storage: 'file', // 'file' | 'database' | 'cloud'
      path: './tests/performance-reports/baseline.json',
    },
    pullRequestComments: {
      enabled: process.env.GITHUB_TOKEN !== undefined,
      template: 'performance-pr-comment.md',
    },
  },

  // Monitoring and alerting
  monitoring: {
    enabled: true,
    intervals: {
      webVitals: '1h',
      resources: '6h',
      synthetic: '15m',
    },
    alerts: {
      criticalThreshold: 95, // % of budget
      warningThreshold: 80,
      consecutiveFailures: 3,
    },
  },
};

module.exports = config;