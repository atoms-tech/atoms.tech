/**
 * Lighthouse CI Configuration for Automated Performance Testing
 * Provides continuous performance monitoring and regression detection
 */

module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/document/123',
        'http://localhost:3000/projects',
        'http://localhost:3000/settings',
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-gpu --disable-dev-shm-usage',
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        skipAudits: ['uses-http2'],
        budgets: [
          {
            resourceSizes: [
              {
                resourceType: 'script',
                budget: 500,
              },
              {
                resourceType: 'total',
                budget: 2000,
              },
              {
                resourceType: 'image',
                budget: 1000,
              },
            ],
            resourceCounts: [
              {
                resourceType: 'third-party',
                budget: 10,
              },
            ],
            timings: [
              {
                metric: 'first-contentful-paint',
                budget: 1800,
              },
              {
                metric: 'largest-contentful-paint',
                budget: 2500,
              },
              {
                metric: 'cumulative-layout-shift',
                budget: 0.1,
              },
              {
                metric: 'first-input-delay',
                budget: 100,
              },
              {
                metric: 'interactive',
                budget: 3500,
              },
            ],
          },
        ],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.90 }],
        'audits:first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'audits:largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'audits:cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'audits:first-input-delay': ['error', { maxNumericValue: 100 }],
        'audits:interactive': ['error', { maxNumericValue: 3500 }],
        'audits:speed-index': ['warn', { maxNumericValue: 3000 }],
        'audits:total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'audits:uses-optimized-images': 'error',
        'audits:uses-webp-images': 'warn',
        'audits:efficient-animated-content': 'warn',
        'audits:unused-javascript': ['warn', { maxLength: 3 }],
        'audits:unused-css-rules': ['warn', { maxLength: 3 }],
        'audits:render-blocking-resources': ['warn', { maxLength: 3 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
      serverBaseUrl: process.env.LHCI_SERVER_BASE_URL,
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './tests/performance-reports/lhci.db',
      },
    },
  },
};