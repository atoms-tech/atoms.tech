/**
 * Accessibility Test Reporter
 * 
 * Custom Playwright reporter for accessibility testing with enhanced violation reporting
 */

const fs = require('fs');
const path = require('path');

class AccessibilityReporter {
  constructor(options = {}) {
    this.options = {
      outputFile: options.outputFile || 'test-results/accessibility/accessibility-violations.json',
      detailedHtml: options.detailedHtml || 'test-results/accessibility/detailed-violations.html',
      console: options.console !== false,
      ...options
    };
    
    this.violations = [];
    this.testResults = [];
    this.suiteStart = null;
    this.suiteEnd = null;
  }

  onBegin(config, suite) {
    this.suiteStart = new Date();
    
    if (this.options.console) {
      console.log('\n🔍 Starting Accessibility Testing Suite...');
      console.log(`📊 Running ${suite.allTests().length} accessibility tests\n`);
    }
    
    // Ensure output directories exist
    const outputDir = path.dirname(this.options.outputFile);
    const htmlDir = path.dirname(this.options.detailedHtml);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    if (!fs.existsSync(htmlDir)) {
      fs.mkdirSync(htmlDir, { recursive: true });
    }
  }

  onTestBegin(test, result) {
    if (this.options.console) {
      process.stdout.write(`🧪 ${test.title}... `);
    }
  }

  onTestEnd(test, result) {
    const testResult = {
      id: test.id,
      title: test.title,
      file: test.location.file,
      line: test.location.line,
      status: result.status,
      duration: result.duration,
      error: result.error,
      violations: [],
      wcagCriteria: [],
      timestamp: new Date().toISOString()
    };

    // Extract accessibility violations from test attachments
    if (result.attachments) {
      result.attachments.forEach(attachment => {
        if (attachment.name === 'accessibility-violations' && attachment.body) {
          try {
            const violations = JSON.parse(attachment.body.toString());
            testResult.violations = violations;
            this.violations.push(...violations.map(v => ({
              ...v,
              testId: test.id,
              testTitle: test.title,
              testFile: test.location.file
            })));
          } catch (error) {
            console.warn('Failed to parse accessibility violations:', error);
          }
        }
        
        if (attachment.name === 'wcag-criteria' && attachment.body) {
          try {
            const criteria = JSON.parse(attachment.body.toString());
            testResult.wcagCriteria = criteria;
          } catch (error) {
            console.warn('Failed to parse WCAG criteria:', error);
          }
        }
      });
    }

    this.testResults.push(testResult);

    // Console output
    if (this.options.console) {
      const statusIcon = this.getStatusIcon(result.status);
      const violationCount = testResult.violations.length;
      const violationText = violationCount > 0 ? ` (${violationCount} violations)` : '';
      
      console.log(`${statusIcon} ${this.formatDuration(result.duration)}${violationText}`);
      
      // Show critical violations immediately
      const criticalViolations = testResult.violations.filter(v => v.impact === 'critical');
      if (criticalViolations.length > 0) {
        console.log(`  ❌ ${criticalViolations.length} critical accessibility violations found!`);
        criticalViolations.forEach(violation => {
          console.log(`     • ${violation.description} (${violation.help})`);
        });
      }
    }
  }

  onEnd(result) {
    this.suiteEnd = new Date();
    
    // Generate comprehensive accessibility report
    const report = this.generateReport(result);
    
    // Save JSON report
    fs.writeFileSync(this.options.outputFile, JSON.stringify(report, null, 2));
    
    // Save HTML report
    const htmlReport = this.generateHtmlReport(report);
    fs.writeFileSync(this.options.detailedHtml, htmlReport);
    
    // Console summary
    if (this.options.console) {
      this.printSummary(report);
    }
  }

  generateReport(result) {
    const duration = this.suiteEnd - this.suiteStart;
    
    // Categorize violations by impact
    const violationsByImpact = this.violations.reduce((acc, violation) => {
      acc[violation.impact] = (acc[violation.impact] || 0) + 1;
      return acc;
    }, {});

    // Group violations by type
    const violationsByType = this.violations.reduce((acc, violation) => {
      const key = violation.id;
      if (!acc[key]) {
        acc[key] = {
          id: violation.id,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          impact: violation.impact,
          tags: violation.tags,
          occurrences: 0,
          tests: new Set()
        };
      }
      acc[key].occurrences++;
      acc[key].tests.add(violation.testTitle);
      return acc;
    }, {});

    // Convert sets to arrays for JSON serialization
    Object.values(violationsByType).forEach(violation => {
      violation.tests = Array.from(violation.tests);
    });

    // Calculate WCAG compliance
    const wcagCompliance = this.calculateWcagCompliance();
    
    // Calculate coverage metrics
    const coverage = this.calculateCoverageMetrics();

    return {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: duration,
        totalTests: this.testResults.length,
        passed: this.testResults.filter(t => t.status === 'passed').length,
        failed: this.testResults.filter(t => t.status === 'failed').length,
        skipped: this.testResults.filter(t => t.status === 'skipped').length,
        flaky: this.testResults.filter(t => t.status === 'flaky').length
      },
      violations: {
        total: this.violations.length,
        byImpact: violationsByImpact,
        byType: violationsByType,
        details: this.violations
      },
      wcagCompliance,
      coverage,
      testResults: this.testResults,
      recommendations: this.generateRecommendations(violationsByImpact, violationsByType)
    };
  }

  calculateWcagCompliance() {
    const wcagRules = {
      'color-contrast': 'WCAG 2.1 AA - 1.4.3 Contrast (Minimum)',
      'keyboard': 'WCAG 2.1 AA - 2.1.1 Keyboard',
      'aria-valid-attr': 'WCAG 2.1 AA - 4.1.2 Name, Role, Value',
      'button-name': 'WCAG 2.1 AA - 4.1.2 Name, Role, Value',
      'form-field-multiple-labels': 'WCAG 2.1 AA - 3.3.2 Labels or Instructions',
      'heading-order': 'WCAG 2.1 AA - 1.3.1 Info and Relationships',
      'image-alt': 'WCAG 2.1 AA - 1.1.1 Non-text Content',
      'label': 'WCAG 2.1 AA - 3.3.2 Labels or Instructions',
      'landmark-one-main': 'WCAG 2.1 AA - 1.3.1 Info and Relationships',
      'link-name': 'WCAG 2.1 AA - 4.1.2 Name, Role, Value',
      'page-has-heading-one': 'WCAG 2.1 AA - 1.3.1 Info and Relationships'
    };

    const compliance = {
      level: 'WCAG 2.1 AA',
      criteria: {},
      overallScore: 0
    };

    Object.entries(wcagRules).forEach(([ruleId, criterion]) => {
      const ruleViolations = this.violations.filter(v => v.id === ruleId);
      compliance.criteria[criterion] = {
        ruleId,
        violations: ruleViolations.length,
        passed: ruleViolations.length === 0
      };
    });

    const totalCriteria = Object.keys(compliance.criteria).length;
    const passedCriteria = Object.values(compliance.criteria).filter(c => c.passed).length;
    compliance.overallScore = Math.round((passedCriteria / totalCriteria) * 100);

    return compliance;
  }

  calculateCoverageMetrics() {
    const testTitles = this.testResults.map(t => t.title.toLowerCase());
    
    const coverage = {
      keyboard: testTitles.some(t => t.includes('keyboard')),
      screenReader: testTitles.some(t => t.includes('screen reader') || t.includes('aria')),
      colorContrast: testTitles.some(t => t.includes('contrast') || t.includes('color')),
      focus: testTitles.some(t => t.includes('focus')),
      forms: testTitles.some(t => t.includes('form')),
      navigation: testTitles.some(t => t.includes('navigation') || t.includes('landmark')),
      images: testTitles.some(t => t.includes('image') || t.includes('alt')),
      headings: testTitles.some(t => t.includes('heading')),
      tables: testTitles.some(t => t.includes('table')),
      dialogs: testTitles.some(t => t.includes('dialog') || t.includes('modal'))
    };

    const totalAreas = Object.keys(coverage).length;
    const coveredAreas = Object.values(coverage).filter(Boolean).length;
    const coveragePercentage = Math.round((coveredAreas / totalAreas) * 100);

    return {
      areas: coverage,
      percentage: coveragePercentage,
      coveredAreas,
      totalAreas
    };
  }

  generateRecommendations(violationsByImpact, violationsByType) {
    const recommendations = [];

    // Critical violations
    if (violationsByImpact.critical > 0) {
      recommendations.push({
        priority: 'critical',
        message: `Address ${violationsByImpact.critical} critical accessibility violations immediately`,
        actions: ['Review critical violations', 'Fix blocking accessibility issues', 'Test with assistive technology']
      });
    }

    // Serious violations
    if (violationsByImpact.serious > 0) {
      recommendations.push({
        priority: 'high',
        message: `Fix ${violationsByImpact.serious} serious accessibility violations`,
        actions: ['Improve ARIA implementation', 'Enhance keyboard navigation', 'Fix color contrast issues']
      });
    }

    // Common violation patterns
    const commonViolations = Object.values(violationsByType)
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 3);

    if (commonViolations.length > 0) {
      recommendations.push({
        priority: 'medium',
        message: 'Address most common accessibility issues',
        actions: commonViolations.map(v => `Fix ${v.description} (${v.occurrences} occurrences)`)
      });
    }

    return recommendations;
  }

  generateHtmlReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .content {
            padding: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
        }
        .summary-card.critical { border-left-color: #dc3545; }
        .summary-card.warning { border-left-color: #ffc107; }
        .summary-card.success { border-left-color: #28a745; }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .summary-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
        }
        .violations-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .violations-table th,
        .violations-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .violations-table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .impact-critical { color: #dc3545; font-weight: bold; }
        .impact-serious { color: #fd7e14; font-weight: bold; }
        .impact-moderate { color: #ffc107; font-weight: bold; }
        .impact-minor { color: #6c757d; }
        .wcag-score {
            text-align: center;
            margin: 20px 0;
        }
        .score-circle {
            display: inline-block;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: conic-gradient(#28a745 ${report.wcagCompliance.overallScore * 3.6}deg, #dee2e6 0deg);
            position: relative;
        }
        .score-circle::after {
            content: '${report.wcagCompliance.overallScore}%';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 18px;
            font-weight: bold;
        }
        .recommendations {
            background: #e7f3ff;
            border: 1px solid #b8daff;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .recommendation {
            margin-bottom: 15px;
        }
        .recommendation h4 {
            margin: 0 0 8px 0;
            color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Accessibility Test Report</h1>
            <p>Generated on ${new Date(report.metadata.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="content">
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Total Tests</h3>
                    <div class="value">${report.metadata.totalTests}</div>
                </div>
                
                <div class="summary-card ${report.metadata.failed > 0 ? 'critical' : 'success'}">
                    <h3>Passed</h3>
                    <div class="value">${report.metadata.passed}</div>
                </div>
                
                <div class="summary-card ${report.violations.total > 0 ? 'critical' : 'success'}">
                    <h3>Violations</h3>
                    <div class="value">${report.violations.total}</div>
                </div>
                
                <div class="summary-card">
                    <h3>Duration</h3>
                    <div class="value">${Math.round(report.metadata.duration / 1000)}s</div>
                </div>
            </div>

            <div class="wcag-score">
                <h2>WCAG 2.1 AA Compliance</h2>
                <div class="score-circle"></div>
                <p>Overall compliance score based on tested criteria</p>
            </div>

            ${report.violations.total > 0 ? `
            <h2>Accessibility Violations</h2>
            <table class="violations-table">
                <thead>
                    <tr>
                        <th>Rule ID</th>
                        <th>Description</th>
                        <th>Impact</th>
                        <th>Occurrences</th>
                        <th>Help</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.values(report.violations.byType).map(violation => `
                    <tr>
                        <td><code>${violation.id}</code></td>
                        <td>${violation.description}</td>
                        <td class="impact-${violation.impact}">${violation.impact}</td>
                        <td>${violation.occurrences}</td>
                        <td><a href="${violation.helpUrl}" target="_blank">Learn more</a></td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<h2>🎉 No accessibility violations found!</h2>'}

            ${report.recommendations.length > 0 ? `
            <div class="recommendations">
                <h2>Recommendations</h2>
                ${report.recommendations.map(rec => `
                <div class="recommendation">
                    <h4>${rec.message}</h4>
                    <ul>
                        ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>
    `;
  }

  getStatusIcon(status) {
    const icons = {
      passed: '✅',
      failed: '❌',
      skipped: '⏭️ ',
      flaky: '🔄',
      timedOut: '⏰',
      interrupted: '⚠️ '
    };
    return icons[status] || '❓';
  }

  formatDuration(duration) {
    if (duration < 1000) {
      return `${duration}ms`;
    }
    return `${(duration / 1000).toFixed(1)}s`;
  }

  printSummary(report) {
    console.log('\n📊 Accessibility Testing Summary');
    console.log('================================');
    console.log(`Tests: ${report.metadata.totalTests} | Passed: ${report.metadata.passed} | Failed: ${report.metadata.failed}`);
    console.log(`Duration: ${this.formatDuration(report.metadata.duration)}`);
    console.log(`WCAG 2.1 AA Compliance: ${report.wcagCompliance.overallScore}%`);
    
    if (report.violations.total > 0) {
      console.log('\n🚨 Accessibility Violations:');
      Object.entries(report.violations.byImpact).forEach(([impact, count]) => {
        console.log(`  ${impact}: ${count}`);
      });
    } else {
      console.log('\n✅ No accessibility violations found!');
    }
    
    console.log(`\n📋 Detailed report: ${this.options.detailedHtml}`);
    console.log(`📄 JSON report: ${this.options.outputFile}\n`);
  }
}

module.exports = AccessibilityReporter;