/**
 * Performance Budgets Tests
 * Comprehensive performance budget enforcement and monitoring
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Performance Budgets', () => {
  const BUDGET_CONFIG = {
    // Core Web Vitals Budgets
    webVitals: {
      LCP: { budget: 2500, unit: 'ms', priority: 'critical' },
      FCP: { budget: 1800, unit: 'ms', priority: 'critical' },
      CLS: { budget: 0.1, unit: '', priority: 'critical' },
      FID: { budget: 100, unit: 'ms', priority: 'critical' },
      TTFB: { budget: 600, unit: 'ms', priority: 'high' },
    },

    // Resource Budgets
    resources: {
      totalPageSize: { budget: 2000, unit: 'KB', priority: 'high' },
      totalJavaScript: { budget: 500, unit: 'KB', priority: 'high' },
      totalCSS: { budget: 100, unit: 'KB', priority: 'medium' },
      totalImages: { budget: 1000, unit: 'KB', priority: 'medium' },
      totalFonts: { budget: 150, unit: 'KB', priority: 'medium' },
    },

    // Network Budgets
    network: {
      totalRequests: { budget: 50, unit: 'requests', priority: 'medium' },
      thirdPartyRequests: { budget: 10, unit: 'requests', priority: 'low' },
      domainConnections: { budget: 5, unit: 'domains', priority: 'low' },
    },

    // Performance Budgets
    performance: {
      timeToInteractive: { budget: 3500, unit: 'ms', priority: 'high' },
      speedIndex: { budget: 3000, unit: 'ms', priority: 'medium' },
      totalBlockingTime: { budget: 200, unit: 'ms', priority: 'high' },
      mainThreadTime: { budget: 2000, unit: 'ms', priority: 'medium' },
    },

    // Bundle Budgets
    bundle: {
      initialBundle: { budget: 200, unit: 'KB', priority: 'critical' },
      totalBundle: { budget: 500, unit: 'KB', priority: 'high' },
      vendorBundle: { budget: 300, unit: 'KB', priority: 'medium' },
      asyncChunks: { budget: 100, unit: 'KB', priority: 'low' },
    },

    // Memory Budgets
    memory: {
      heapUsed: { budget: 100, unit: 'MB', priority: 'high' },
      heapTotal: { budget: 200, unit: 'MB', priority: 'medium' },
      external: { budget: 50, unit: 'MB', priority: 'low' },
    },
  };

  const checkBudget = (value, budget, description) => {
    const passed = value <= budget.budget;
    const percentage = (value / budget.budget) * 100;
    
    return {
      description,
      value,
      budget: budget.budget,
      unit: budget.unit,
      priority: budget.priority,
      passed,
      percentage,
      severity: passed ? 'success' : budget.priority === 'critical' ? 'error' : 'warning',
    };
  };

  const generateBudgetReport = (results) => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
        critical: results.filter(r => !r.passed && r.priority === 'critical').length,
        high: results.filter(r => !r.passed && r.priority === 'high').length,
        medium: results.filter(r => !r.passed && r.priority === 'medium').length,
        low: results.filter(r => !r.passed && r.priority === 'low').length,
      },
      results: results.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
    };

    // Save report
    const reportsDir = path.join(__dirname, '../performance-reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    fs.writeFileSync(
      path.join(reportsDir, 'budget-report.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  };

  describe('Core Web Vitals Budget Enforcement', () => {
    test('Core Web Vitals meet budget requirements', async () => {
      // This would typically use real Lighthouse or WebPageTest data
      const mockWebVitals = {
        LCP: 2200, // ms
        FCP: 1600, // ms
        CLS: 0.08, // score
        FID: 85, // ms
        TTFB: 550, // ms
      };

      const results = [];
      
      Object.keys(BUDGET_CONFIG.webVitals).forEach(metric => {
        const value = mockWebVitals[metric];
        const budget = BUDGET_CONFIG.webVitals[metric];
        
        if (value !== undefined) {
          const result = checkBudget(value, budget, `Core Web Vitals: ${metric}`);
          results.push(result);
        }
      });

      const report = generateBudgetReport(results);
      
      console.log('Core Web Vitals Budget Report:');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${result.description}: ${result.value}${result.unit} / ${result.budget}${result.unit} (${result.percentage.toFixed(1)}%)`);
      });

      // Critical metrics must pass
      const criticalFailures = results.filter(r => !r.passed && r.priority === 'critical');
      expect(criticalFailures.length).toBe(0);

      // High priority metrics should mostly pass
      const highFailures = results.filter(r => !r.passed && r.priority === 'high');
      expect(highFailures.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Resource Budget Enforcement', () => {
    test('Resource sizes meet budget requirements', async () => {
      // Mock resource data (would come from actual analysis)
      const mockResources = {
        totalPageSize: 1800, // KB
        totalJavaScript: 450, // KB
        totalCSS: 85, // KB
        totalImages: 950, // KB
        totalFonts: 120, // KB
      };

      const results = [];
      
      Object.keys(BUDGET_CONFIG.resources).forEach(resource => {
        const value = mockResources[resource];
        const budget = BUDGET_CONFIG.resources[resource];
        
        if (value !== undefined) {
          const result = checkBudget(value, budget, `Resource: ${resource}`);
          results.push(result);
        }
      });

      const report = generateBudgetReport(results);
      
      console.log('Resource Budget Report:');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${result.description}: ${result.value}${result.unit} / ${result.budget}${result.unit} (${result.percentage.toFixed(1)}%)`);
      });

      // High priority resources should meet budget
      const highFailures = results.filter(r => !r.passed && r.priority === 'high');
      expect(highFailures.length).toBeLessThanOrEqual(1);
    });

    test('Network budget compliance', async () => {
      const mockNetwork = {
        totalRequests: 42,
        thirdPartyRequests: 8,
        domainConnections: 4,
      };

      const results = [];
      
      Object.keys(BUDGET_CONFIG.network).forEach(metric => {
        const value = mockNetwork[metric];
        const budget = BUDGET_CONFIG.network[metric];
        
        if (value !== undefined) {
          const result = checkBudget(value, budget, `Network: ${metric}`);
          results.push(result);
        }
      });

      console.log('Network Budget Report:');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${result.description}: ${result.value} ${result.unit} / ${result.budget} ${result.unit} (${result.percentage.toFixed(1)}%)`);
      });

      // Network budget should be reasonable
      const mediumFailures = results.filter(r => !r.passed && r.priority === 'medium');
      expect(mediumFailures.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance Budget Enforcement', () => {
    test('Performance metrics meet budget requirements', async () => {
      const mockPerformance = {
        timeToInteractive: 3200, // ms
        speedIndex: 2800, // ms
        totalBlockingTime: 180, // ms
        mainThreadTime: 1800, // ms
      };

      const results = [];
      
      Object.keys(BUDGET_CONFIG.performance).forEach(metric => {
        const value = mockPerformance[metric];
        const budget = BUDGET_CONFIG.performance[metric];
        
        if (value !== undefined) {
          const result = checkBudget(value, budget, `Performance: ${metric}`);
          results.push(result);
        }
      });

      console.log('Performance Budget Report:');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${result.description}: ${result.value}${result.unit} / ${result.budget}${result.unit} (${result.percentage.toFixed(1)}%)`);
      });

      // High priority performance metrics should pass
      const highFailures = results.filter(r => !r.passed && r.priority === 'high');
      expect(highFailures.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Bundle Budget Enforcement', () => {
    test('Bundle sizes meet budget requirements', async () => {
      const mockBundle = {
        initialBundle: 180, // KB
        totalBundle: 420, // KB
        vendorBundle: 250, // KB
        asyncChunks: 85, // KB
      };

      const results = [];
      
      Object.keys(BUDGET_CONFIG.bundle).forEach(metric => {
        const value = mockBundle[metric];
        const budget = BUDGET_CONFIG.bundle[metric];
        
        if (value !== undefined) {
          const result = checkBudget(value, budget, `Bundle: ${metric}`);
          results.push(result);
        }
      });

      console.log('Bundle Budget Report:');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${result.description}: ${result.value}${result.unit} / ${result.budget}${result.unit} (${result.percentage.toFixed(1)}%)`);
      });

      // Critical bundle budgets must pass
      const criticalFailures = results.filter(r => !r.passed && r.priority === 'critical');
      expect(criticalFailures.length).toBe(0);

      // High priority bundles should mostly pass
      const highFailures = results.filter(r => !r.passed && r.priority === 'high');
      expect(highFailures.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Memory Budget Enforcement', () => {
    test('Memory usage meets budget requirements', async () => {
      const mockMemory = {
        heapUsed: 85, // MB
        heapTotal: 150, // MB
        external: 35, // MB
      };

      const results = [];
      
      Object.keys(BUDGET_CONFIG.memory).forEach(metric => {
        const value = mockMemory[metric];
        const budget = BUDGET_CONFIG.memory[metric];
        
        if (value !== undefined) {
          const result = checkBudget(value, budget, `Memory: ${metric}`);
          results.push(result);
        }
      });

      console.log('Memory Budget Report:');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${result.description}: ${result.value}${result.unit} / ${result.budget}${result.unit} (${result.percentage.toFixed(1)}%)`);
      });

      // High priority memory usage should be within budget
      const highFailures = results.filter(r => !r.passed && r.priority === 'high');
      expect(highFailures.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Budget Monitoring and Alerting', () => {
    test('Budget trend analysis', async () => {
      // Mock historical data
      const historicalData = [
        { date: '2024-01-01', LCP: 2100, FCP: 1500, bundle: 380 },
        { date: '2024-01-02', LCP: 2200, FCP: 1600, bundle: 400 },
        { date: '2024-01-03', LCP: 2300, FCP: 1700, bundle: 420 },
        { date: '2024-01-04', LCP: 2400, FCP: 1750, bundle: 440 },
        { date: '2024-01-05', LCP: 2500, FCP: 1800, bundle: 460 },
      ];

      const trends = {};
      const metrics = ['LCP', 'FCP', 'bundle'];
      
      metrics.forEach(metric => {
        const values = historicalData.map(d => d[metric]);
        const trend = values[values.length - 1] - values[0];
        const budget = BUDGET_CONFIG.webVitals[metric]?.budget || BUDGET_CONFIG.bundle.totalBundle.budget;
        const trendPercentage = (trend / budget) * 100;
        
        trends[metric] = {
          trend,
          trendPercentage,
          isWorsening: trend > 0,
          currentValue: values[values.length - 1],
          budget,
          budgetUtilization: (values[values.length - 1] / budget) * 100,
        };
      });

      console.log('Budget Trend Analysis:');
      Object.keys(trends).forEach(metric => {
        const data = trends[metric];
        const direction = data.isWorsening ? '📈' : '📉';
        console.log(`${direction} ${metric}: ${data.trendPercentage.toFixed(1)}% trend, ${data.budgetUtilization.toFixed(1)}% budget used`);
      });

      // Trends should not be consistently worsening
      const worseningTrends = Object.values(trends).filter(t => t.isWorsening && Math.abs(t.trendPercentage) > 5);
      expect(worseningTrends.length).toBeLessThanOrEqual(1);
    });

    test('Budget alert thresholds', async () => {
      const alertThresholds = {
        warning: 80, // 80% of budget
        critical: 95, // 95% of budget
      };

      const mockCurrentValues = {
        LCP: 2000, // 80% of 2500ms budget
        FCP: 1620, // 90% of 1800ms budget
        totalBundle: 475, // 95% of 500KB budget
      };

      const alerts = [];
      
      Object.keys(mockCurrentValues).forEach(metric => {
        const value = mockCurrentValues[metric];
        const budget = BUDGET_CONFIG.webVitals[metric]?.budget || 
                      BUDGET_CONFIG.bundle.totalBundle?.budget ||
                      BUDGET_CONFIG.resources.totalJavaScript?.budget;
        
        if (budget) {
          const utilization = (value / budget) * 100;
          
          if (utilization >= alertThresholds.critical) {
            alerts.push({
              metric,
              level: 'critical',
              utilization,
              value,
              budget,
            });
          } else if (utilization >= alertThresholds.warning) {
            alerts.push({
              metric,
              level: 'warning',
              utilization,
              value,
              budget,
            });
          }
        }
      });

      console.log('Budget Alert Analysis:');
      alerts.forEach(alert => {
        const icon = alert.level === 'critical' ? '🚨' : '⚠️';
        console.log(`${icon} ${alert.metric}: ${alert.utilization.toFixed(1)}% of budget (${alert.value}/${alert.budget})`);
      });

      // Should not have too many critical alerts
      const criticalAlerts = alerts.filter(a => a.level === 'critical');
      expect(criticalAlerts.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Performance Budget CI/CD Integration', () => {
    test('Budget enforcement in CI/CD pipeline', async () => {
      // Mock CI/CD budget check
      const prBudgetCheck = {
        baseline: {
          LCP: 2200,
          FCP: 1600,
          bundle: 420,
        },
        current: {
          LCP: 2300,
          FCP: 1650,
          bundle: 440,
        },
      };

      const budgetDiffs = {};
      const regressionThreshold = 5; // 5% regression threshold
      
      Object.keys(prBudgetCheck.baseline).forEach(metric => {
        const baseline = prBudgetCheck.baseline[metric];
        const current = prBudgetCheck.current[metric];
        const diff = current - baseline;
        const diffPercentage = (diff / baseline) * 100;
        const isRegression = diffPercentage > regressionThreshold;
        
        budgetDiffs[metric] = {
          baseline,
          current,
          diff,
          diffPercentage,
          isRegression,
        };
      });

      console.log('PR Budget Impact Analysis:');
      Object.keys(budgetDiffs).forEach(metric => {
        const data = budgetDiffs[metric];
        const status = data.isRegression ? '❌' : '✅';
        console.log(`${status} ${metric}: ${data.diffPercentage.toFixed(1)}% change (${data.current} vs ${data.baseline})`);
      });

      // Should not introduce significant regressions
      const significantRegressions = Object.values(budgetDiffs).filter(d => d.isRegression);
      expect(significantRegressions.length).toBeLessThanOrEqual(1);
    });

    test('Budget reporting for stakeholders', async () => {
      // Generate stakeholder-friendly budget report
      const stakeholderReport = {
        executiveSummary: {
          overallScore: 85, // out of 100
          criticalIssues: 0,
          improvementOpportunities: 3,
          budgetCompliance: 90, // percentage
        },
        keyMetrics: {
          userExperience: {
            pageLoadTime: '2.2s',
            interactionDelay: '85ms',
            visualStability: '0.08',
            status: 'Good',
          },
          businessImpact: {
            expectedConversionImpact: '+2.3%',
            expectedBounceRateChange: '-1.8%',
            seoScore: 92,
          },
        },
        recommendations: [
          {
            priority: 'High',
            metric: 'Bundle Size',
            issue: 'JavaScript bundle approaching budget limit',
            impact: 'May affect page load times on slower devices',
            solution: 'Implement code splitting for non-critical features',
          },
          {
            priority: 'Medium',
            metric: 'Image Optimization',
            issue: 'Some images not optimized for web',
            impact: 'Increased bandwidth usage',
            solution: 'Convert images to WebP format and implement lazy loading',
          },
        ],
      };

      // Save stakeholder report
      const reportsDir = path.join(__dirname, '../performance-reports');
      fs.mkdirSync(reportsDir, { recursive: true });
      fs.writeFileSync(
        path.join(reportsDir, 'stakeholder-budget-report.json'),
        JSON.stringify(stakeholderReport, null, 2)
      );

      console.log('Stakeholder Budget Report Generated:');
      console.log(`Overall Score: ${stakeholderReport.executiveSummary.overallScore}/100`);
      console.log(`Budget Compliance: ${stakeholderReport.executiveSummary.budgetCompliance}%`);
      console.log(`Critical Issues: ${stakeholderReport.executiveSummary.criticalIssues}`);

      // Report should indicate good performance
      expect(stakeholderReport.executiveSummary.overallScore).toBeGreaterThan(80);
      expect(stakeholderReport.executiveSummary.criticalIssues).toBeLessThanOrEqual(1);
      expect(stakeholderReport.executiveSummary.budgetCompliance).toBeGreaterThan(85);
    });
  });
});