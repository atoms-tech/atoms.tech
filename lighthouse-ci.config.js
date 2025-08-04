/**
 * Lighthouse CI Configuration for atoms.tech
 * 
 * Comprehensive performance monitoring with custom audits,
 * performance budgets, and CI/CD integration.
 */

module.exports = {
  ci: {
    collect: {
      // URLs to test
      url: [
        // Core pages
        'http://localhost:3000/',
        'http://localhost:3000/login',
        'http://localhost:3000/signup',
        
        // Protected routes (with auth simulation)
        'http://localhost:3000/home',
        'http://localhost:3000/org/demo',
        'http://localhost:3000/org/demo/project/sample',
        'http://localhost:3000/org/demo/project/sample/canvas',
        'http://localhost:3000/org/demo/project/sample/testbed',
      ],
      
      // Number of runs per URL for stable results
      numberOfRuns: 3,
      
      // Lighthouse settings
      settings: {
        // Use headless Chrome
        chromeFlags: [
          '--headless',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--allow-running-insecure-content',
          '--ignore-certificate-errors',
          '--window-size=1920,1080'
        ],
        
        // Network throttling
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024, // 10 Mbps
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        
        // Custom audit categories
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
          'pwa'
        ],
        
        // Skip certain audits that aren't relevant
        skipAudits: [
          'canonical',
          'robots-txt',
          'manifest',
          'installable-manifest'
        ],
        
        // Enable additional audits
        extraHeaders: {
          'User-Agent': 'Lighthouse-CI Performance Testing',
          'X-Performance-Test': 'true'
        }
      },
      
      // Start local server for testing
      startServerCommand: 'npm run build && npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 180000,
      
      // Parallelize collection
      numberOfRuns: process.env.CI ? 1 : 3,
      maxAutodiscoverUrls: 0,
    },
    
    // Performance budgets
    assert: {
      assertions: {
        // Core Web Vitals
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.85 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        
        // Specific metrics
        'metrics:first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'metrics:largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'metrics:cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'metrics:total-blocking-time': ['error', { maxNumericValue: 300 }],
        'metrics:speed-index': ['error', { maxNumericValue: 3000 }],
        'metrics:interactive': ['error', { maxNumericValue: 3500 }],
        
        // Resource budgets
        'resource-summary:document:size': ['error', { maxNumericValue: 50000 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 500000 }],
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 100000 }],
        'resource-summary:image:size': ['error', { maxNumericValue: 1000000 }],
        'resource-summary:total:size': ['error', { maxNumericValue: 2000000 }],
        
        // Network requests
        'resource-summary:total:count': ['error', { maxNumericValue: 50 }],
        'resource-summary:script:count': ['error', { maxNumericValue: 15 }],
        'resource-summary:stylesheet:count': ['error', { maxNumericValue: 10 }],
        
        // Specific audits
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // Critical audits
        'render-blocking-resources': 'error',
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        'modern-image-formats': 'warn',
        'offscreen-images': 'warn',
        'unminified-css': 'error',
        'unminified-javascript': 'error',
        'efficient-animated-content': 'warn',
        'duplicated-javascript': 'error',
        'legacy-javascript': 'warn'
      },
      
      // Preset configurations
      preset: 'lighthouse:no-pwa',
      
      // Include passed audits in output
      includePassedAssertions: false
    },
    
    // Upload results
    upload: {
      // For CI environments
      target: process.env.CI ? 'temporary-public-storage' : 'filesystem',
      
      // File system output
      outputDir: './test-results/lighthouse',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%'
    },
    
    // Server configuration for CI
    server: {
      port: 9001,
      storage: './test-results/lighthouse/server'
    },
    
    // Wizard configuration
    wizard: {
      // Skip wizard in CI
      enabled: !process.env.CI
    }
  }
};