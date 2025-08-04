#!/usr/bin/env node

/**
 * Performance Test Runner
 * Orchestrates all performance tests and generates comprehensive reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('./performance.config.js');

class PerformanceRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        duration: 0,
      },
      tests: [],
      budgets: {
        webVitals: {},
        resources: {},
        performance: {},
        memory: {},
      },
      recommendations: [],
    };
    
    this.startTime = Date.now();
    this.outputDir = config.reporting.outputDir;
    
    // Ensure output directory exists
    fs.mkdirSync(this.outputDir, { recursive: true });
  }

  async run() {
    console.log('🚀 Starting Performance Test Suite');
    console.log('=====================================');
    
    try {
      // Run different test categories
      await this.runLighthouseTests();
      await this.runComponentTests();
      await this.runLoadTests();
      await this.runBundleAnalysis();
      await this.runMemoryTests();
      await this.runWebVitalsTests();
      await this.runBudgetTests();
      
      // Generate final report
      await this.generateReport();
      
      console.log('\n✅ Performance Test Suite Complete');
      console.log(`📊 Report saved to: ${this.outputDir}`);
      
      // Exit with appropriate code
      process.exit(this.results.summary.failed > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('❌ Performance Test Suite Failed:', error);
      process.exit(1);
    }
  }

  async runLighthouseTests() {
    console.log('\n🔍 Running Lighthouse Performance Tests...');
    
    try {
      const testCommand = 'npm test -- --testPathPattern=lighthouse.test.js --testTimeout=60000';
      const output = execSync(testCommand, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '../../'),
        stdio: 'pipe'
      });
      
      this.results.tests.push({
        name: 'Lighthouse Tests',
        category: 'web-vitals',
        status: 'passed',
        output: output.slice(-1000), // Last 1000 chars
      });
      
      this.results.summary.passed++;
      
    } catch (error) {
      this.results.tests.push({
        name: 'Lighthouse Tests',
        category: 'web-vitals',
        status: 'failed',
        error: error.message.slice(-1000),
      });
      
      this.results.summary.failed++;
      console.error('❌ Lighthouse tests failed:', error.message.slice(-200));
    }
    
    this.results.summary.totalTests++;
  }

  async runComponentTests() {
    console.log('\n⚛️ Running Component Performance Tests...');
    
    try {
      const testCommand = 'npm test -- --testPathPattern=component-performance.test.tsx --testTimeout=60000';
      const output = execSync(testCommand, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '../../'),
        stdio: 'pipe'
      });
      
      this.results.tests.push({
        name: 'Component Performance Tests',
        category: 'react',
        status: 'passed',
        output: output.slice(-1000),
      });
      
      this.results.summary.passed++;
      
    } catch (error) {
      this.results.tests.push({
        name: 'Component Performance Tests',
        category: 'react',
        status: 'failed',
        error: error.message.slice(-1000),
      });
      
      this.results.summary.failed++;
      console.error('❌ Component tests failed:', error.message.slice(-200));
    }
    
    this.results.summary.totalTests++;
  }

  async runLoadTests() {
    console.log('\n🔥 Running Load Performance Tests...');
    
    try {
      const testCommand = 'npm test -- --testPathPattern=load-testing.test.js --testTimeout=120000';
      const output = execSync(testCommand, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '../../'),
        stdio: 'pipe'
      });
      
      this.results.tests.push({
        name: 'Load Performance Tests',
        category: 'load',
        status: 'passed',
        output: output.slice(-1000),
      });
      
      this.results.summary.passed++;
      
    } catch (error) {
      this.results.tests.push({
        name: 'Load Performance Tests',
        category: 'load',
        status: 'failed',
        error: error.message.slice(-1000),
      });
      
      this.results.summary.failed++;
      console.error('❌ Load tests failed:', error.message.slice(-200));
    }
    
    this.results.summary.totalTests++;
  }

  async runBundleAnalysis() {
    console.log('\n📦 Running Bundle Analysis Tests...');
    
    try {
      const testCommand = 'npm test -- --testPathPattern=bundle-analysis.test.js --testTimeout=60000';
      const output = execSync(testCommand, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '../../'),
        stdio: 'pipe'
      });
      
      this.results.tests.push({
        name: 'Bundle Analysis Tests',
        category: 'bundle',
        status: 'passed',
        output: output.slice(-1000),
      });
      
      this.results.summary.passed++;
      
    } catch (error) {
      this.results.tests.push({
        name: 'Bundle Analysis Tests',
        category: 'bundle',
        status: 'failed',
        error: error.message.slice(-1000),
      });
      
      this.results.summary.failed++;
      console.error('❌ Bundle analysis failed:', error.message.slice(-200));
    }
    
    this.results.summary.totalTests++;
  }

  async runMemoryTests() {
    console.log('\n🧠 Running Memory Performance Tests...');
    
    try {
      const testCommand = 'npm test -- --testPathPattern=memory-performance.test.js --testTimeout=60000';
      const output = execSync(testCommand, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '../../'),
        stdio: 'pipe'
      });
      
      this.results.tests.push({
        name: 'Memory Performance Tests',
        category: 'memory',
        status: 'passed',
        output: output.slice(-1000),
      });
      
      this.results.summary.passed++;
      
    } catch (error) {
      this.results.tests.push({
        name: 'Memory Performance Tests',
        category: 'memory',
        status: 'failed',
        error: error.message.slice(-1000),
      });
      
      this.results.summary.failed++;
      console.error('❌ Memory tests failed:', error.message.slice(-200));
    }
    
    this.results.summary.totalTests++;
  }

  async runWebVitalsTests() {
    console.log('\n📊 Running Core Web Vitals Tests...');
    
    try {
      const testCommand = 'npm test -- --testPathPattern=core-web-vitals.test.js --testTimeout=60000';
      const output = execSync(testCommand, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '../../'),
        stdio: 'pipe'
      });
      
      this.results.tests.push({
        name: 'Core Web Vitals Tests',
        category: 'web-vitals',
        status: 'passed',
        output: output.slice(-1000),
      });
      
      this.results.summary.passed++;
      
    } catch (error) {
      this.results.tests.push({
        name: 'Core Web Vitals Tests',
        category: 'web-vitals',
        status: 'failed',
        error: error.message.slice(-1000),
      });
      
      this.results.summary.failed++;
      console.error('❌ Web Vitals tests failed:', error.message.slice(-200));
    }
    
    this.results.summary.totalTests++;
  }

  async runBudgetTests() {
    console.log('\n💰 Running Performance Budget Tests...');
    
    try {
      const testCommand = 'npm test -- --testPathPattern=performance-budgets.test.js --testTimeout=60000';
      const output = execSync(testCommand, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '../../'),
        stdio: 'pipe'
      });
      
      this.results.tests.push({
        name: 'Performance Budget Tests',
        category: 'budgets',
        status: 'passed',
        output: output.slice(-1000),
      });
      
      this.results.summary.passed++;
      
    } catch (error) {
      this.results.tests.push({
        name: 'Performance Budget Tests',
        category: 'budgets',
        status: 'failed',
        error: error.message.slice(-1000),
      });
      
      this.results.summary.failed++;
      console.error('❌ Budget tests failed:', error.message.slice(-200));
    }
    
    this.results.summary.totalTests++;
  }

  async generateReport() {
    console.log('\n📋 Generating Performance Report...');
    
    this.results.summary.duration = Date.now() - this.startTime;
    
    // Generate different report formats
    await this.generateJSONReport();
    await this.generateHTMLReport();
    await this.generateCSVReport();
    await this.generateMarkdownReport();
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Send notifications if configured
    await this.sendNotifications();
  }

  async generateJSONReport() {
    const jsonReport = {
      ...this.results,
      config: {
        budgets: config.budgets,
        environment: config.environment,
        testPages: config.testPages,
      },
    };
    
    fs.writeFileSync(
      path.join(this.outputDir, 'performance-report.json'),
      JSON.stringify(jsonReport, null, 2)
    );
  }

  async generateHTMLReport() {
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f5e8; padding: 15px; border-radius: 5px; flex: 1; }
        .metric.failed { background: #fee; }
        .metric.warning { background: #ffeaa7; }
        .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .test-result.passed { border-left-color: #27ae60; }
        .test-result.failed { border-left-color: #e74c3c; }
        .recommendations { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Test Report</h1>
        <p>Generated: ${this.results.timestamp}</p>
        <p>Duration: ${(this.results.summary.duration / 1000).toFixed(2)}s</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div style="font-size: 2em; font-weight: bold;">${this.results.summary.totalTests}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #27ae60;">${this.results.summary.passed}</div>
        </div>
        <div class="metric ${this.results.summary.failed > 0 ? 'failed' : ''}">
            <h3>Failed</h3>
            <div style="font-size: 2em; font-weight: bold; color: #e74c3c;">${this.results.summary.failed}</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div style="font-size: 2em; font-weight: bold;">${((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1)}%</div>
        </div>
    </div>
    
    <h2>Test Results</h2>
    ${this.results.tests.map(test => `
        <div class="test-result ${test.status}">
            <h3>${test.name}</h3>
            <p><strong>Category:</strong> ${test.category}</p>
            <p><strong>Status:</strong> ${test.status}</p>
            ${test.error ? `<p><strong>Error:</strong> ${test.error}</p>` : ''}
        </div>
    `).join('')}
    
    <div class="recommendations">
        <h2>Recommendations</h2>
        ${this.results.recommendations.length > 0 ? 
          this.results.recommendations.map(rec => `
            <div style="margin: 10px 0; padding: 10px; border-left: 4px solid #3498db;">
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
                <p><strong>Priority:</strong> ${rec.priority}</p>
            </div>
          `).join('') : 
          '<p>No specific recommendations at this time. All tests are performing well!</p>'
        }
    </div>
</body>
</html>
    `;
    
    fs.writeFileSync(
      path.join(this.outputDir, 'performance-report.html'),
      htmlTemplate
    );
  }

  async generateCSVReport() {
    const csvData = [
      ['Test Name', 'Category', 'Status', 'Duration'],
      ...this.results.tests.map(test => [
        test.name,
        test.category,
        test.status,
        // Duration would be parsed from output if available
        'N/A'
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    fs.writeFileSync(
      path.join(this.outputDir, 'performance-report.csv'),
      csvContent
    );
  }

  async generateMarkdownReport() {
    const markdownReport = `# Performance Test Report

**Generated:** ${this.results.timestamp}  
**Duration:** ${(this.results.summary.duration / 1000).toFixed(2)}s  

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${this.results.summary.totalTests} |
| Passed | ${this.results.summary.passed} |
| Failed | ${this.results.summary.failed} |
| Success Rate | ${((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1)}% |

## Test Results

${this.results.tests.map(test => `
### ${test.name}
- **Category:** ${test.category}
- **Status:** ${test.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}
${test.error ? `- **Error:** ${test.error}` : ''}
`).join('')}

## Recommendations

${this.results.recommendations.length > 0 ? 
  this.results.recommendations.map(rec => `
### ${rec.title}
**Priority:** ${rec.priority}

${rec.description}
`).join('') : 
  'No specific recommendations at this time. All tests are performing well!'
}

---
*Generated by Performance Test Suite*
`;
    
    fs.writeFileSync(
      path.join(this.outputDir, 'performance-report.md'),
      markdownReport
    );
  }

  generateRecommendations() {
    const failedTests = this.results.tests.filter(test => test.status === 'failed');
    
    if (failedTests.some(test => test.category === 'web-vitals')) {
      this.results.recommendations.push({
        title: 'Optimize Core Web Vitals',
        description: 'Core Web Vitals tests are failing. Focus on improving LCP, FCP, and CLS metrics.',
        priority: 'High',
      });
    }
    
    if (failedTests.some(test => test.category === 'bundle')) {
      this.results.recommendations.push({
        title: 'Optimize Bundle Size',
        description: 'Bundle analysis shows opportunities for optimization. Consider code splitting and tree shaking.',
        priority: 'Medium',
      });
    }
    
    if (failedTests.some(test => test.category === 'memory')) {
      this.results.recommendations.push({
        title: 'Address Memory Issues',
        description: 'Memory tests indicate potential leaks or excessive usage. Review component lifecycle and cleanup.',
        priority: 'High',
      });
    }
    
    if (failedTests.some(test => test.category === 'load')) {
      this.results.recommendations.push({
        title: 'Improve Load Testing Performance',
        description: 'Load tests are failing. Consider optimizing server response times and API endpoints.',
        priority: 'Medium',
      });
    }
  }

  async sendNotifications() {
    if (config.reporting.notifications.slack.enabled && this.results.summary.failed > 0) {
      // Send Slack notification for failures
      console.log('📢 Sending Slack notification...');
      // Implementation would use Slack webhook
    }
  }
}

// CLI interface
if (require.main === module) {
  const runner = new PerformanceRunner();
  runner.run();
}

module.exports = PerformanceRunner;