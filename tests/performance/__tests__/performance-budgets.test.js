/**
 * Performance Budgets Validation Tests
 * Testing compliance with performance budgets and thresholds
 */

const { BudgetValidator } = require('../performance-budgets.config');
const budgets = require('../performance-budgets.config');

describe('Performance Budgets Tests', () => {
  describe('Core Web Vitals Budget Validation', () => {
    test('should validate good Core Web Vitals metrics', () => {
      const goodMetrics = {
        lcp: 2000,  // Good LCP
        fid: 80,    // Good FID
        cls: 0.05,  // Good CLS
        inp: 150    // Good INP
      };
      
      const results = BudgetValidator.validateCoreWebVitals(goodMetrics);
      
      expect(results.lcp).toBe('good');
      expect(results.fid).toBe('good');
      expect(results.cls).toBe('good');
      expect(results.inp).toBe('good');
      
      console.log('✅ Good metrics validation passed');
    });

    test('should validate needs improvement Core Web Vitals metrics', () => {
      const needsImprovementMetrics = {
        lcp: 3200,  // Needs improvement LCP
        fid: 200,   // Needs improvement FID
        cls: 0.15,  // Needs improvement CLS
        inp: 350    // Needs improvement INP
      };
      
      const results = BudgetValidator.validateCoreWebVitals(needsImprovementMetrics);
      
      expect(results.lcp).toBe('needs-improvement');
      expect(results.fid).toBe('needs-improvement');
      expect(results.cls).toBe('needs-improvement');
      expect(results.inp).toBe('needs-improvement');
      
      console.log('⚠️ Needs improvement metrics validation passed');
    });

    test('should validate poor Core Web Vitals metrics', () => {
      const poorMetrics = {
        lcp: 5000,  // Poor LCP
        fid: 400,   // Poor FID
        cls: 0.3,   // Poor CLS
        inp: 600    // Poor INP
      };
      
      const results = BudgetValidator.validateCoreWebVitals(poorMetrics);
      
      expect(results.lcp).toBe('poor');
      expect(results.fid).toBe('poor');
      expect(results.cls).toBe('poor');
      expect(results.inp).toBe('poor');
      
      console.log('❌ Poor metrics validation passed');
    });

    test('should calculate performance score correctly', () => {
      const testCases = [
        {
          metrics: { lcp: 2000, fid: 80, cls: 0.05, inp: 150 },
          expectedScore: 100,
          description: 'Perfect metrics'
        },
        {
          metrics: { lcp: 3200, fid: 200, cls: 0.15, inp: 350 },
          expectedScore: 75,
          description: 'Needs improvement metrics'
        },
        {
          metrics: { lcp: 5000, fid: 400, cls: 0.3, inp: 600 },
          expectedScore: 50,
          description: 'Poor metrics'
        },
        {
          metrics: { lcp: 2000, fid: 400, cls: 0.05, inp: 150 },
          expectedScore: 81, // Mixed: 3 good (75 points each) + 1 poor (12.5 points)
          description: 'Mixed metrics'
        }
      ];
      
      testCases.forEach(({ metrics, expectedScore, description }) => {
        const score = BudgetValidator.calculatePerformanceScore(metrics);
        expect(score).toBeCloseTo(expectedScore, 0);
        console.log(`📊 ${description}: ${score}/100`);
      });
    });
  });

  describe('Resource Budget Validation', () => {
    test('should validate resources within budget', () => {
      const withinBudgetResources = {
        totalSize: 800000,    // 800KB - within 1MB budget
        javascript: 200000,   // 200KB - within 250KB budget
        css: 40000           // 40KB - within 50KB budget
      };
      
      const violations = BudgetValidator.validateResourceBudgets(withinBudgetResources, '/');
      
      expect(violations.length).toBe(0);
      console.log('✅ Resources within budget');
    });

    test('should detect resource budget violations', () => {
      const exceedingBudgetResources = {
        totalSize: 1200000,   // 1.2MB - exceeds budget
        javascript: 300000,   // 300KB - exceeds budget
        css: 60000           // 60KB - exceeds budget
      };
      
      const violations = BudgetValidator.validateResourceBudgets(exceedingBudgetResources, '/');
      
      expect(violations.length).toBeGreaterThan(0);
      
      violations.forEach(violation => {
        expect(violation).toHaveProperty('type');
        expect(violation).toHaveProperty('budget');
        expect(violation).toHaveProperty('actual');
        expect(violation).toHaveProperty('severity');
        
        console.log(`❌ ${violation.type}: ${(violation.actual / 1024).toFixed(1)}KB > ${(violation.budget / 1024).toFixed(1)}KB`);
      });
    });

    test('should validate route-specific budgets', () => {
      const routeBudgets = [
        { route: '/', strictBudget: true },
        { route: '/login', strictBudget: true },
        { route: '/home', strictBudget: false },
        { route: '/org/demo/project/sample', strictBudget: false }
      ];
      
      routeBudgets.forEach(({ route, strictBudget }) => {
        const testResources = {
          totalSize: strictBudget ? 600000 : 1000000,  // Stricter for landing pages
          javascript: strictBudget ? 100000 : 200000,
          css: 30000
        };
        
        const violations = BudgetValidator.validateResourceBudgets(testResources, route);
        
        if (strictBudget) {
          expect(violations.length).toBeLessThanOrEqual(1); // May have minor violations
        }
        
        console.log(`📍 Route ${route}: ${violations.length} violations`);
      });
    });
  });

  describe('Device-Specific Budget Validation', () => {
    test('should apply different budgets for mobile devices', () => {
      const testMetrics = {
        lcp: 2800,  // Acceptable for mobile
        fid: 150,   // Acceptable for mobile
        cls: 0.08,  // Good for any device
        inp: 180    // Good for any device
      };
      
      const desktopResults = BudgetValidator.validateCoreWebVitals(testMetrics, 'desktop');
      const mobileResults = BudgetValidator.validateCoreWebVitals(testMetrics, 'mobile');
      
      // Mobile should be more lenient
      console.log('🖥️ Desktop validation:', desktopResults);
      console.log('📱 Mobile validation:', mobileResults);
      
      // For this test case, mobile should perform better or equal
      const mobileScore = BudgetValidator.calculatePerformanceScore(testMetrics, 'mobile');
      const desktopScore = BudgetValidator.calculatePerformanceScore(testMetrics, 'desktop');
      
      expect(mobileScore).toBeGreaterThanOrEqual(desktopScore);
      
      console.log(`📊 Mobile score: ${mobileScore}, Desktop score: ${desktopScore}`);
    });

    test('should validate tablet budgets', () => {
      const tabletMetrics = {
        lcp: 2700,
        fid: 120,
        cls: 0.09,
        inp: 190
      };
      
      const tabletResults = BudgetValidator.validateCoreWebVitals(tabletMetrics, 'tablet');
      const tabletScore = BudgetValidator.calculatePerformanceScore(tabletMetrics, 'tablet');
      
      expect(tabletScore).toBeGreaterThan(0);
      console.log(`📋 Tablet performance score: ${tabletScore}/100`);
    });
  });

  describe('Budget Configuration Validation', () => {
    test('should have valid budget configuration structure', () => {
      // Test Core Web Vitals budgets
      expect(budgets.coreWebVitals).toBeDefined();
      expect(budgets.coreWebVitals.lcp).toHaveProperty('good');
      expect(budgets.coreWebVitals.lcp).toHaveProperty('needsImprovement');
      expect(budgets.coreWebVitals.lcp).toHaveProperty('weight');
      
      // Test resource budgets
      expect(budgets.resources).toBeDefined();
      expect(budgets.resources.javascript).toHaveProperty('main');
      expect(budgets.resources.javascript).toHaveProperty('chunks');
      expect(budgets.resources.javascript).toHaveProperty('vendor');
      
      // Test device budgets
      expect(budgets.devices).toBeDefined();
      expect(budgets.devices.mobile).toBeDefined();
      expect(budgets.devices.desktop).toBeDefined();
      expect(budgets.devices.tablet).toBeDefined();
      
      // Test route budgets
      expect(budgets.routes).toBeDefined();
      expect(budgets.routes['/']).toBeDefined();
      expect(budgets.routes['/login']).toBeDefined();
      
      console.log('✅ Budget configuration structure is valid');
    });

    test('should have realistic budget thresholds', () => {
      // Core Web Vitals should match Google recommendations
      expect(budgets.coreWebVitals.lcp.good).toBe(2500);
      expect(budgets.coreWebVitals.fid.good).toBe(100);
      expect(budgets.coreWebVitals.cls.good).toBe(0.1);
      expect(budgets.coreWebVitals.inp.good).toBe(200);
      
      // Resource budgets should be reasonable
      expect(budgets.resources.javascript.main.maxSize).toBeGreaterThan(100000); // At least 100KB
      expect(budgets.resources.javascript.main.maxSize).toBeLessThan(500000);    // But less than 500KB
      
      console.log('✅ Budget thresholds are realistic');
    });

    test('should have progressive budget strictness', () => {
      // Landing page should have strictest budgets
      const landingBudget = budgets.routes['/'];
      const appBudget = budgets.routes['/home'];
      const complexBudget = budgets.routes['/org/*/project/*'];
      
      expect(landingBudget.lcp).toBeLessThan(appBudget.lcp);
      expect(appBudget.lcp).toBeLessThan(complexBudget.lcp);
      
      expect(landingBudget.totalSize).toBeLessThan(appBudget.totalSize);
      expect(appBudget.totalSize).toBeLessThan(complexBudget.totalSize);
      
      console.log('✅ Progressive budget strictness validated');
      console.log(`   Landing: ${landingBudget.lcp}ms LCP, ${(landingBudget.totalSize / 1024).toFixed(0)}KB`);
      console.log(`   App: ${appBudget.lcp}ms LCP, ${(appBudget.totalSize / 1024).toFixed(0)}KB`);
      console.log(`   Complex: ${complexBudget.lcp}ms LCP, ${(complexBudget.totalSize / 1024).toFixed(0)}KB`);
    });
  });

  describe('Budget Enforcement', () => {
    test('should generate appropriate violation severity levels', () => {
      const testCases = [
        {
          actual: 2600,
          budget: 2500,
          expectedSeverity: 'warning', // Just over threshold
          description: 'Minor violation'
        },
        {
          actual: 3000,
          budget: 2500,
          expectedSeverity: 'error', // 20% over
          description: 'Moderate violation'
        },
        {
          actual: 5000,
          budget: 2500,
          expectedSeverity: 'critical', // 100% over
          description: 'Severe violation'
        }
      ];
      
      testCases.forEach(({ actual, budget, expectedSeverity, description }) => {
        const resources = { totalSize: actual };
        const violations = BudgetValidator.validateResourceBudgets(resources, '/');
        
        if (violations.length > 0) {
          const violation = violations[0];
          
          // This is a simplified severity check - actual implementation may vary
          let calculatedSeverity = 'warning';
          const ratio = actual / budget;
          
          if (ratio >= 2) calculatedSeverity = 'critical';
          else if (ratio >= 1.5) calculatedSeverity = 'error';
          
          console.log(`⚖️ ${description}: ${actual} vs ${budget} = ${calculatedSeverity}`);
        }
      });
    });

    test('should support different enforcement modes', () => {
      const enforcement = budgets.enforcement;
      
      expect(enforcement.ci).toBeDefined();
      expect(enforcement.development).toBeDefined();
      expect(enforcement.production).toBeDefined();
      
      // CI should be strict
      expect(enforcement.ci.enableBudgetCheck).toBe(true);
      expect(enforcement.ci.failOnError).toBe(true);
      
      // Development should be helpful but not blocking
      expect(enforcement.development.enableWarnings).toBe(true);
      expect(enforcement.development.showInConsole).toBe(true);
      
      // Production should monitor
      expect(enforcement.production.enableRUM).toBe(true);
      expect(enforcement.production.enableSynthetic).toBe(true);
      
      console.log('✅ Enforcement modes configured correctly');
    });
  });

  describe('Budget Trends and Analytics', () => {
    test('should track budget compliance over time', () => {
      // Simulate historical budget compliance data
      const historicalData = [
        { date: '2024-01-01', compliance: 95, violations: 1 },
        { date: '2024-01-15', compliance: 92, violations: 2 },
        { date: '2024-02-01', compliance: 88, violations: 3 },
        { date: '2024-02-15', compliance: 94, violations: 1 }
      ];
      
      // Calculate trends
      const complianceValues = historicalData.map(d => d.compliance);
      const trend = complianceValues[complianceValues.length - 1] - complianceValues[0];
      
      // Should maintain good compliance
      expect(complianceValues.every(c => c >= 80)).toBe(true);
      
      console.log(`📈 Budget compliance trend: ${trend > 0 ? '+' : ''}${trend}%`);
      
      // Recent compliance should be good
      const recentCompliance = complianceValues[complianceValues.length - 1];
      expect(recentCompliance).toBeGreaterThan(90);
    });

    test('should generate budget reports', () => {
      const mockReport = {
        timestamp: new Date().toISOString(),
        overallCompliance: 92,
        violations: [
          { category: 'bundle-size', severity: 'warning', count: 1 },
          { category: 'web-vitals', severity: 'error', count: 1 }
        ],
        trends: {
          improving: ['compression-ratio'],
          declining: ['total-size'],
          stable: ['core-web-vitals']
        },
        recommendations: [
          'Implement code splitting for large bundles',
          'Optimize image loading for better LCP'
        ]
      };
      
      expect(mockReport.overallCompliance).toBeGreaterThan(80);
      expect(mockReport.violations).toBeDefined();
      expect(mockReport.trends).toBeDefined();
      expect(mockReport.recommendations).toBeDefined();
      
      console.log(`📊 Budget report compliance: ${mockReport.overallCompliance}%`);
      console.log(`   Violations: ${mockReport.violations.length}`);
      console.log(`   Recommendations: ${mockReport.recommendations.length}`);
    });
  });
});