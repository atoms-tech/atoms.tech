/**
 * Performance CI/CD Integration Script
 * Handles performance testing integration with CI/CD pipelines
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceCIIntegration {
  constructor(options = {}) {
    this.config = {
      budgetFile: options.budgetFile || 'tests/performance/performance.config.js',
      reportsDir: options.reportsDir || 'tests/performance-reports',
      baselineFile: options.baselineFile || 'performance-baseline.json',
      thresholds: {
        performanceScore: options.performanceScore || 80,
        regressionThreshold: options.regressionThreshold || 5,
        budgetViolationLimit: options.budgetViolationLimit || 2,
      },
      ...options,
    };

    this.results = {
      timestamp: new Date().toISOString(),
      success: true,
      tests: [],
      violations: [],
      regressions: [],
      summary: {},
    };
  }

  async runPerformanceCI() {
    console.log('🚀 Starting Performance CI Integration');
    console.log(`Reports directory: ${this.config.reportsDir}`);

    try {
      // Ensure reports directory exists
      this.ensureReportsDirectory();

      // Run performance tests
      await this.runPerformanceTests();

      // Analyze results
      await this.analyzeResults();

      // Check budgets
      await this.checkBudgets();

      // Check regressions
      await this.checkRegressions();

      // Generate CI report
      await this.generateCIReport();

      // Update baseline if needed
      await this.updateBaseline();

      // Determine CI status
      this.determineCIStatus();

      console.log('\n📊 Performance CI Summary:');
      console.log(`✅ Tests passed: ${this.results.tests.filter(t => t.passed).length}`);
      console.log(`❌ Tests failed: ${this.results.tests.filter(t => !t.passed).length}`);
      console.log(`⚠️ Budget violations: ${this.results.violations.length}`);
      console.log(`📉 Regressions: ${this.results.regressions.length}`);
      console.log(`🎯 Overall status: ${this.results.success ? 'PASS' : 'FAIL'}`);

      return this.results;

    } catch (error) {
      console.error('❌ Performance CI failed:', error.message);
      this.results.success = false;
      this.results.error = error.message;
      return this.results;
    }
  }

  ensureReportsDirectory() {
    if (!fs.existsSync(this.config.reportsDir)) {
      fs.mkdirSync(this.config.reportsDir, { recursive: true });
      console.log(`📁 Created reports directory: ${this.config.reportsDir}`);
    }
  }

  async runPerformanceTests() {
    console.log('\n🔬 Running performance tests...');

    const testSuites = [
      { name: 'lighthouse', command: 'npm run test:performance:lighthouse', critical: true },
      { name: 'web-vitals', command: 'npm run test:performance:web-vitals', critical: true },
      { name: 'budgets', command: 'npm run test:performance:budgets', critical: true },
    ];

    for (const suite of testSuites) {
      console.log(`  Running ${suite.name}...`);
      
      try {
        const startTime = Date.now();
        const output = execSync(suite.command, { 
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 300000, // 5 minutes
        });
        
        const duration = Date.now() - startTime;
        
        this.results.tests.push({
          name: suite.name,
          command: suite.command,
          passed: true,
          critical: suite.critical,
          duration,
          output: output.slice(-1000), // Last 1000 chars
        });

        console.log(`    ✅ ${suite.name} passed (${duration}ms)`);

      } catch (error) {
        this.results.tests.push({
          name: suite.name,
          command: suite.command,
          passed: false,
          critical: suite.critical,
          error: error.message,
          output: error.stdout || error.stderr || '',
        });

        console.log(`    ❌ ${suite.name} failed: ${error.message}`);
        
        if (suite.critical) {
          this.results.success = false;
        }
      }
    }
  }

  async analyzeResults() {
    console.log('\n📈 Analyzing performance results...');

    const reportFiles = fs.readdirSync(this.config.reportsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(this.config.reportsDir, file));

    this.results.analysis = {
      reportFiles: reportFiles.length,
      performance: {},
      webVitals: {},
      resources: {},
    };

    // Analyze Lighthouse reports
    const lighthouseReports = reportFiles.filter(file => 
      file.includes('lighthouse') || file.includes('home-page')
    );

    for (const reportFile of lighthouseReports) {
      try {
        const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
        
        if (report.categories && report.categories.performance) {
          const score = Math.round(report.categories.performance.score * 100);
          this.results.analysis.performance[path.basename(reportFile)] = {
            score,
            passed: score >= this.config.thresholds.performanceScore,
          };

          if (score < this.config.thresholds.performanceScore) {
            this.results.violations.push({
              type: 'performance-score',
              file: reportFile,
              metric: 'Performance Score',
              value: score,
              threshold: this.config.thresholds.performanceScore,
              severity: 'high',
            });
          }
        }

        // Analyze Web Vitals from Lighthouse
        if (report.audits) {
          const webVitals = {
            LCP: report.audits['largest-contentful-paint']?.numericValue,
            FCP: report.audits['first-contentful-paint']?.numericValue,
            CLS: report.audits['cumulative-layout-shift']?.numericValue,
            TBT: report.audits['total-blocking-time']?.numericValue,
          };

          Object.keys(webVitals).forEach(metric => {
            if (webVitals[metric] !== undefined) {
              this.results.analysis.webVitals[metric] = {
                value: webVitals[metric],
                file: reportFile,
              };
            }
          });
        }

      } catch (error) {
        console.warn(`⚠️ Could not analyze report: ${reportFile} - ${error.message}`);
      }
    }

    // Analyze Web Vitals reports
    const webVitalsReports = reportFiles.filter(file => 
      file.includes('web-vitals') || file.includes('vitals')
    );

    for (const reportFile of webVitalsReports) {
      try {
        const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
        
        if (report.vitals) {
          Object.keys(report.vitals).forEach(metric => {
            const vital = report.vitals[metric];
            if (vital && vital.value !== undefined) {
              this.results.analysis.webVitals[metric] = {
                ...this.results.analysis.webVitals[metric],
                value: vital.value,
                rating: vital.rating,
                file: reportFile,
              };
            }
          });
        }

      } catch (error) {
        console.warn(`⚠️ Could not analyze Web Vitals report: ${reportFile} - ${error.message}`);
      }
    }

    console.log(`  📊 Analyzed ${reportFiles.length} report files`);
    console.log(`  🎯 Performance scores: ${Object.keys(this.results.analysis.performance).length}`);
    console.log(`  📱 Web Vitals metrics: ${Object.keys(this.results.analysis.webVitals).length}`);
  }

  async checkBudgets() {
    console.log('\n💰 Checking performance budgets...');

    try {
      const budgetReportPath = path.join(this.config.reportsDir, 'budget-report.json');
      
      if (!fs.existsSync(budgetReportPath)) {
        console.log('  ⚠️ Budget report not found, skipping budget check');
        return;
      }

      const budgetReport = JSON.parse(fs.readFileSync(budgetReportPath, 'utf8'));
      
      if (budgetReport.summary) {
        const summary = budgetReport.summary;
        
        console.log(`  📊 Budget Summary:`);
        console.log(`    Total checks: ${summary.total}`);
        console.log(`    Passed: ${summary.passed}`);
        console.log(`    Failed: ${summary.failed}`);
        console.log(`    Critical failures: ${summary.critical || 0}`);

        // Check for critical budget violations
        if (summary.critical > 0) {
          this.results.violations.push({
            type: 'budget-critical',
            metric: 'Critical Budget Violations',
            value: summary.critical,
            threshold: 0,
            severity: 'critical',
          });
        }

        // Check for total budget violations
        if (summary.failed > this.config.thresholds.budgetViolationLimit) {
          this.results.violations.push({
            type: 'budget-violations',
            metric: 'Total Budget Violations',
            value: summary.failed,
            threshold: this.config.thresholds.budgetViolationLimit,
            severity: 'high',
          });
        }

        // Extract specific budget violations
        if (budgetReport.results) {
          const failedBudgets = budgetReport.results.filter(r => !r.passed);
          
          failedBudgets.forEach(budget => {
            this.results.violations.push({
              type: 'budget-specific',
              metric: budget.description,
              value: budget.value,
              threshold: budget.budget,
              unit: budget.unit,
              priority: budget.priority,
              severity: budget.priority === 'critical' ? 'critical' : 'medium',
            });
          });
        }
      }

    } catch (error) {
      console.warn(`⚠️ Could not check budgets: ${error.message}`);
    }
  }

  async checkRegressions() {
    console.log('\n📉 Checking for performance regressions...');

    try {
      const baselinePath = this.config.baselineFile;
      
      if (!fs.existsSync(baselinePath)) {
        console.log('  📝 No baseline found, current results will become baseline');
        return;
      }

      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      const current = this.results.analysis;

      // Compare performance scores
      Object.keys(current.performance).forEach(file => {
        const currentScore = current.performance[file].score;
        const baselineScore = baseline.performance && baseline.performance[file] ? 
          baseline.performance[file].score : null;

        if (baselineScore !== null) {
          const regression = baselineScore - currentScore;
          const regressionPercent = (regression / baselineScore) * 100;

          if (regression > this.config.thresholds.regressionThreshold) {
            this.results.regressions.push({
              type: 'performance-score',
              file,
              metric: 'Performance Score',
              baseline: baselineScore,
              current: currentScore,
              regression,
              regressionPercent,
              severity: regressionPercent > 10 ? 'critical' : 'high',
            });
          }
        }
      });

      // Compare Web Vitals
      const webVitalsThresholds = {
        LCP: { threshold: 200, unit: 'ms' }, // 200ms regression threshold
        FCP: { threshold: 100, unit: 'ms' },
        CLS: { threshold: 0.02, unit: '' },
        TBT: { threshold: 50, unit: 'ms' },
      };

      Object.keys(webVitalsThresholds).forEach(metric => {
        const currentValue = current.webVitals[metric]?.value;
        const baselineValue = baseline.webVitals && baseline.webVitals[metric] ? 
          baseline.webVitals[metric].value : null;

        if (currentValue !== undefined && baselineValue !== null) {
          const regression = currentValue - baselineValue;
          const threshold = webVitalsThresholds[metric].threshold;

          if (regression > threshold) {
            this.results.regressions.push({
              type: 'web-vitals',
              metric,
              baseline: baselineValue,
              current: currentValue,
              regression,
              threshold,
              unit: webVitalsThresholds[metric].unit,
              severity: regression > threshold * 2 ? 'critical' : 'medium',
            });
          }
        }
      });

      console.log(`  📊 Found ${this.results.regressions.length} performance regressions`);

    } catch (error) {
      console.warn(`⚠️ Could not check regressions: ${error.message}`);
    }
  }

  async generateCIReport() {
    console.log('\n📄 Generating CI report...');

    const ciReport = {
      timestamp: this.results.timestamp,
      status: this.results.success ? 'PASS' : 'FAIL',
      summary: {
        testsRun: this.results.tests.length,
        testsPassed: this.results.tests.filter(t => t.passed).length,
        testsFailed: this.results.tests.filter(t => !t.passed).length,
        violations: this.results.violations.length,
        regressions: this.results.regressions.length,
      },
      details: {
        tests: this.results.tests,
        violations: this.results.violations,
        regressions: this.results.regressions,
        analysis: this.results.analysis,
      },
      recommendations: this.generateRecommendations(),
    };

    // Save CI report
    const ciReportPath = path.join(this.config.reportsDir, 'ci-report.json');
    fs.writeFileSync(ciReportPath, JSON.stringify(ciReport, null, 2));

    // Generate human-readable summary
    const summaryPath = path.join(this.config.reportsDir, 'ci-summary.md');
    const markdownSummary = this.generateMarkdownSummary(ciReport);
    fs.writeFileSync(summaryPath, markdownSummary);

    console.log(`  📄 CI report saved: ${ciReportPath}`);
    console.log(`  📝 Summary saved: ${summaryPath}`);
  }

  generateRecommendations() {
    const recommendations = [];

    // Critical violations
    const criticalViolations = this.results.violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'Budget Violations',
        issue: `${criticalViolations.length} critical performance budget violations`,
        action: 'Immediate optimization required before deployment',
        items: criticalViolations.map(v => `${v.metric}: ${v.value} > ${v.threshold}`),
      });
    }

    // Performance score regressions
    const scoreRegressions = this.results.regressions.filter(r => r.type === 'performance-score');
    if (scoreRegressions.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Performance Regression',
        issue: `Performance scores have regressed`,
        action: 'Investigate and optimize performance-critical changes',
        items: scoreRegressions.map(r => 
          `${r.metric}: ${r.current} (was ${r.baseline}, -${r.regression.toFixed(1)} points)`
        ),
      });
    }

    // Web Vitals regressions
    const vitalsRegressions = this.results.regressions.filter(r => r.type === 'web-vitals');
    if (vitalsRegressions.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Web Vitals Regression',
        issue: `Core Web Vitals have regressed`,
        action: 'Optimize user experience metrics',
        items: vitalsRegressions.map(r => 
          `${r.metric}: ${r.current.toFixed(2)}${r.unit} (was ${r.baseline.toFixed(2)}${r.unit}, +${r.regression.toFixed(2)}${r.unit})`
        ),
      });
    }

    return recommendations;
  }

  generateMarkdownSummary(report) {
    const status = report.status === 'PASS' ? '✅' : '❌';
    
    return `# Performance CI Report

${status} **Status: ${report.status}**

Generated: ${new Date(report.timestamp).toLocaleString()}

## Summary

- **Tests Run:** ${report.summary.testsRun}
- **Tests Passed:** ${report.summary.testsPassed}
- **Tests Failed:** ${report.summary.testsFailed}
- **Budget Violations:** ${report.summary.violations}
- **Performance Regressions:** ${report.summary.regressions}

## Test Results

${report.details.tests.map(test => {
  const status = test.passed ? '✅' : '❌';
  const critical = test.critical ? ' (Critical)' : '';
  return `- ${status} **${test.name}**${critical}`;
}).join('\n')}

${report.summary.violations > 0 ? `
## Budget Violations

${report.details.violations.map(v => {
  const severity = v.severity === 'critical' ? '🚨' : '⚠️';
  return `- ${severity} **${v.metric}**: ${v.value}${v.unit || ''} (Budget: ${v.threshold}${v.unit || ''})`;
}).join('\n')}
` : ''}

${report.summary.regressions > 0 ? `
## Performance Regressions

${report.details.regressions.map(r => {
  const severity = r.severity === 'critical' ? '🚨' : '📉';
  return `- ${severity} **${r.metric}**: ${r.current} (was ${r.baseline}, regression: ${r.regression.toFixed(2)})`;
}).join('\n')}
` : ''}

${report.recommendations.length > 0 ? `
## Recommendations

${report.recommendations.map(rec => `
### ${rec.priority.toUpperCase()}: ${rec.category}

**Issue:** ${rec.issue}
**Action:** ${rec.action}

${rec.items.map(item => `- ${item}`).join('\n')}
`).join('\n')}
` : ''}

---
*Generated by Performance CI Integration*
`;
  }

  async updateBaseline() {
    if (this.results.success && process.env.UPDATE_PERFORMANCE_BASELINE === 'true') {
      console.log('\n📊 Updating performance baseline...');
      
      const baseline = {
        timestamp: this.results.timestamp,
        analysis: this.results.analysis,
        environment: {
          node: process.version,
          ci: process.env.CI || false,
          branch: process.env.GITHUB_REF || 'unknown',
        },
      };

      fs.writeFileSync(this.config.baselineFile, JSON.stringify(baseline, null, 2));
      console.log(`  📄 Baseline updated: ${this.config.baselineFile}`);
    }
  }

  determineCIStatus() {
    // Fail CI if:
    // 1. Any critical test failed
    // 2. Critical budget violations exist
    // 3. Critical performance regressions exist

    const criticalTestFailures = this.results.tests.filter(t => !t.passed && t.critical);
    const criticalViolations = this.results.violations.filter(v => v.severity === 'critical');
    const criticalRegressions = this.results.regressions.filter(r => r.severity === 'critical');

    if (criticalTestFailures.length > 0 || 
        criticalViolations.length > 0 || 
        criticalRegressions.length > 0) {
      this.results.success = false;
    }

    // Update summary
    this.results.summary = {
      status: this.results.success ? 'PASS' : 'FAIL',
      criticalIssues: criticalTestFailures.length + criticalViolations.length + criticalRegressions.length,
      totalIssues: this.results.violations.length + this.results.regressions.length,
    };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const options = {
    reportsDir: args.find(arg => arg.startsWith('--reports='))?.split('=')[1],
    performanceScore: parseInt(args.find(arg => arg.startsWith('--score='))?.split('=')[1]),
    regressionThreshold: parseInt(args.find(arg => arg.startsWith('--regression='))?.split('=')[1]),
    budgetViolationLimit: parseInt(args.find(arg => arg.startsWith('--budget-limit='))?.split('=')[1]),
  };

  const ci = new PerformanceCIIntegration(options);
  
  ci.runPerformanceCI()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Performance CI failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceCIIntegration;