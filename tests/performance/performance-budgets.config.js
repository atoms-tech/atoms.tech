/**
 * Performance Budgets Configuration
 * Comprehensive performance gates and monitoring thresholds
 */

// Core Web Vitals Budgets
const coreWebVitalsBudgets = {
  // Largest Contentful Paint (LCP)
  lcp: {
    good: 2500,      // Under 2.5s
    needsImprovement: 4000,  // 2.5s - 4s
    poor: Infinity,   // Over 4s
    weight: 25
  },
  
  // First Input Delay (FID)
  fid: {
    good: 100,       // Under 100ms
    needsImprovement: 300,   // 100ms - 300ms
    poor: Infinity,   // Over 300ms
    weight: 25
  },
  
  // Cumulative Layout Shift (CLS)
  cls: {
    good: 0.1,       // Under 0.1
    needsImprovement: 0.25,  // 0.1 - 0.25
    poor: Infinity,   // Over 0.25
    weight: 25
  },
  
  // Interaction to Next Paint (INP)
  inp: {
    good: 200,       // Under 200ms
    needsImprovement: 500,   // 200ms - 500ms
    poor: Infinity,   // Over 500ms
    weight: 25
  }
};

// Additional Performance Metrics Budgets
const performanceMetricsBudgets = {
  // First Contentful Paint
  fcp: {
    good: 1800,      // Under 1.8s
    needsImprovement: 3000,  // 1.8s - 3s
    poor: Infinity,
    weight: 10
  },
  
  // Time to First Byte
  ttfb: {
    good: 800,       // Under 800ms
    needsImprovement: 1800,  // 800ms - 1.8s
    poor: Infinity,
    weight: 5
  },
  
  // Speed Index
  speedIndex: {
    good: 3400,      // Under 3.4s
    needsImprovement: 5800,  // 3.4s - 5.8s
    poor: Infinity,
    weight: 10
  },
  
  // Total Blocking Time
  totalBlockingTime: {
    good: 200,       // Under 200ms
    needsImprovement: 600,   // 200ms - 600ms
    poor: Infinity,
    weight: 30
  }
};

// Resource Size Budgets
const resourceBudgets = {
  // JavaScript bundles
  javascript: {
    main: {
      maxSize: 250000,    // 250KB
      maxGzipSize: 70000, // 70KB gzipped
      warning: 200000,    // 200KB warning
      error: 300000       // 300KB error
    },
    chunks: {
      maxSize: 100000,    // 100KB per chunk
      maxGzipSize: 30000, // 30KB gzipped
      warning: 80000,
      error: 150000
    },
    vendor: {
      maxSize: 500000,    // 500KB for vendor bundle
      maxGzipSize: 150000, // 150KB gzipped
      warning: 400000,
      error: 600000
    }
  },
  
  // CSS bundles
  css: {
    main: {
      maxSize: 50000,     // 50KB
      maxGzipSize: 10000, // 10KB gzipped
      warning: 40000,
      error: 70000
    },
    critical: {
      maxSize: 14000,     // 14KB critical CSS
      warning: 12000,
      error: 20000
    }
  },
  
  // Images
  images: {
    hero: {
      maxSize: 100000,    // 100KB for hero images
      warning: 80000,
      error: 150000
    },
    thumbnail: {
      maxSize: 20000,     // 20KB for thumbnails
      warning: 15000,
      error: 30000
    },
    icon: {
      maxSize: 5000,      // 5KB for icons
      warning: 3000,
      error: 10000
    }
  },
  
  // Fonts
  fonts: {
    woff2: {
      maxSize: 30000,     // 30KB per font file
      warning: 25000,
      error: 50000
    },
    totalFonts: {
      maxSize: 100000,    // 100KB total fonts
      warning: 80000,
      error: 150000
    }
  }
};

// Network Resource Budgets
const networkBudgets = {
  // Total requests
  totalRequests: {
    good: 50,
    warning: 75,
    error: 100
  },
  
  // Total transfer size
  totalTransferSize: {
    good: 1000000,      // 1MB
    warning: 1500000,   // 1.5MB
    error: 2000000      // 2MB
  },
  
  // Third-party resources
  thirdParty: {
    maxRequests: 10,
    maxSize: 200000,    // 200KB
    warning: 150000,
    error: 300000
  },
  
  // API calls
  apiCalls: {
    maxConcurrent: 5,
    maxTotal: 20,
    maxResponseTime: 2000  // 2 seconds
  }
};

// Device-specific budgets
const deviceBudgets = {
  mobile: {
    coreWebVitals: {
      ...coreWebVitalsBudgets,
      lcp: { ...coreWebVitalsBudgets.lcp, good: 3000 }, // More lenient for mobile
      fid: { ...coreWebVitalsBudgets.fid, good: 200 }
    },
    resources: {
      totalSize: 800000,  // 800KB total for mobile
      javascript: 150000, // 150KB JS for mobile
      css: 30000         // 30KB CSS for mobile
    }
  },
  
  desktop: {
    coreWebVitals: coreWebVitalsBudgets,
    resources: {
      totalSize: 1500000, // 1.5MB total for desktop
      javascript: 300000, // 300KB JS for desktop
      css: 60000         // 60KB CSS for desktop
    }
  },
  
  tablet: {
    coreWebVitals: {
      ...coreWebVitalsBudgets,
      lcp: { ...coreWebVitalsBudgets.lcp, good: 2800 }
    },
    resources: {
      totalSize: 1200000, // 1.2MB total for tablet
      javascript: 200000, // 200KB JS for tablet
      css: 45000         // 45KB CSS for tablet
    }
  }
};

// Route-specific budgets
const routeBudgets = {
  // Landing page - strictest budgets
  '/': {
    lcp: 2000,          // Very fast LCP for landing
    fcp: 1200,          // Fast FCP
    totalSize: 800000,  // Small total size
    javascript: 150000  // Minimal JS
  },
  
  // Authentication pages
  '/login': {
    lcp: 2200,
    fcp: 1400,
    totalSize: 600000,
    javascript: 100000
  },
  
  '/signup': {
    lcp: 2200,
    fcp: 1400,
    totalSize: 650000,
    javascript: 120000
  },
  
  // Application pages - more lenient
  '/home': {
    lcp: 2800,
    fcp: 1800,
    totalSize: 1200000,
    javascript: 250000
  },
  
  '/org/*': {
    lcp: 3000,
    fcp: 2000,
    totalSize: 1500000,
    javascript: 300000
  },
  
  // Complex pages - most lenient
  '/org/*/project/*': {
    lcp: 3500,
    fcp: 2200,
    totalSize: 2000000,
    javascript: 400000
  }
};

// Performance score thresholds
const performanceScoreThresholds = {
  excellent: 90,
  good: 75,
  needsImprovement: 50,
  poor: 0
};

// Budget violation actions
const budgetActions = {
  warning: {
    action: 'warn',
    notify: true,
    block: false
  },
  
  error: {
    action: 'error',
    notify: true,
    block: true,
    failBuild: false
  },
  
  critical: {
    action: 'critical',
    notify: true,
    block: true,
    failBuild: true
  }
};

// Monitoring configuration
const monitoringConfig = {
  // Real User Monitoring thresholds
  rum: {
    sampleRate: 0.1,        // 10% of users
    reportingInterval: 60000, // 1 minute
    alertThreshold: 0.05,   // Alert if 5% of users experience issues
    retentionDays: 30
  },
  
  // Synthetic monitoring
  synthetic: {
    frequency: 300000,      // Every 5 minutes
    locations: ['us-east', 'us-west', 'eu-central'],
    devices: ['mobile', 'desktop'],
    networks: ['3g', '4g', 'wifi']
  },
  
  // Alert configuration
  alerts: {
    channels: ['email', 'slack', 'webhook'],
    escalation: {
      warning: 'team',
      error: 'lead',
      critical: 'oncall'
    },
    cooldown: 900000        // 15 minutes between alerts
  }
};

// Budget enforcement configuration
const enforcementConfig = {
  // CI/CD integration
  ci: {
    enableBudgetCheck: true,
    failOnError: true,
    warnOnExceed: true,
    generateReport: true,
    reportPath: './test-results/performance-budget-report.json'
  },
  
  // Development warnings
  development: {
    enableWarnings: true,
    showInConsole: true,
    showInOverlay: true,
    logLevel: 'warn'
  },
  
  // Production monitoring
  production: {
    enableRUM: true,
    enableSynthetic: true,
    enableAlerting: true,
    reportInterval: 'daily'
  }
};

// Export configuration
module.exports = {
  coreWebVitals: coreWebVitalsBudgets,
  performanceMetrics: performanceMetricsBudgets,
  resources: resourceBudgets,
  network: networkBudgets,
  devices: deviceBudgets,
  routes: routeBudgets,
  scoreThresholds: performanceScoreThresholds,
  actions: budgetActions,
  monitoring: monitoringConfig,
  enforcement: enforcementConfig
};

// Additional helper functions for budget validation
const BudgetValidator = {
  // Validate Core Web Vitals against budgets
  validateCoreWebVitals(metrics, device = 'desktop') {
    const budgets = deviceBudgets[device]?.coreWebVitals || coreWebVitalsBudgets;
    const results = {};
    
    Object.keys(budgets).forEach(metric => {
      const value = metrics[metric];
      const budget = budgets[metric];
      
      if (value <= budget.good) {
        results[metric] = 'good';
      } else if (value <= budget.needsImprovement) {
        results[metric] = 'needs-improvement';
      } else {
        results[metric] = 'poor';
      }
    });
    
    return results;
  },
  
  // Calculate performance score based on budgets
  calculatePerformanceScore(metrics, device = 'desktop') {
    const validationResults = this.validateCoreWebVitals(metrics, device);
    const budgets = deviceBudgets[device]?.coreWebVitals || coreWebVitalsBudgets;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.keys(validationResults).forEach(metric => {
      const result = validationResults[metric];
      const weight = budgets[metric].weight || 25;
      
      let score = 0;
      if (result === 'good') score = 100;
      else if (result === 'needs-improvement') score = 75;
      else score = 50;
      
      totalScore += score * weight;
      totalWeight += weight;
    });
    
    return Math.round(totalScore / totalWeight);
  },
  
  // Check resource budgets
  validateResourceBudgets(resources, route = '/') {
    const routeBudget = routeBudgets[route] || routeBudgets['/'];
    const violations = [];
    
    // Check total size
    if (resources.totalSize > routeBudget.totalSize) {
      violations.push({
        type: 'total-size',
        budget: routeBudget.totalSize,
        actual: resources.totalSize,
        severity: 'error'
      });
    }
    
    // Check JavaScript size
    if (resources.javascript > routeBudget.javascript) {
      violations.push({
        type: 'javascript-size',
        budget: routeBudget.javascript,
        actual: resources.javascript,
        severity: 'warning'
      });
    }
    
    return violations;
  }
};

module.exports.BudgetValidator = BudgetValidator;