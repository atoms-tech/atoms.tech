#!/usr/bin/env node

/**
 * Accessibility CI/CD Integration Script
 * 
 * Comprehensive accessibility testing automation for CI/CD pipelines
 * Integrates axe-core, Pa11y, Lighthouse, and custom accessibility tests
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');
const chalk = require('chalk');

class AccessibilityCIRunner {
  constructor(options = {}) {
    this.options = {
      baseUrl: options.baseUrl || 'http://localhost:3000',
      outputDir: options.outputDir || 'test-results/accessibility',
      failOnViolations: options.failOnViolations !== false,
      wcagLevel: options.wcagLevel || 'AA',
      includeWarnings: options.includeWarnings || false,
      parallel: options.parallel !== false,
      browsers: options.browsers || ['chromium'],
      headless: options.headless !== false,
      timeout: options.timeout || 60000,
      retries: options.retries || 2,
      ...options
    };
    
    this.results = {
      axe: null,
      pa11y: null,
      lighthouse: null,
      playwright: null,
      jest: null,
      summary: null
    };
    
    this.startTime = Date.now();
  }
  
  /**
   * Main CI runner method
   */
  async run() {
    console.log(chalk.blue('🔍 Starting Accessibility CI Pipeline'));
    console.log(chalk.gray(`Base URL: ${this.options.baseUrl}`));
    console.log(chalk.gray(`WCAG Level: ${this.options.wcagLevel}`));
    console.log(chalk.gray(`Output Directory: ${this.options.outputDir}`));
    
    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();
      
      // Wait for application to be ready
      await this.waitForApplication();
      
      // Run all accessibility tests
      if (this.options.parallel) {
        await this.runTestsInParallel();
      } else {
        await this.runTestsSequentially();
      }
      
      // Generate consolidated report
      await this.generateConsolidatedReport();
      
      // Check if CI should fail
      const shouldFail = this.shouldFailCI();
      
      if (shouldFail) {
        console.log(chalk.red('❌ Accessibility CI failed due to violations'));
        process.exit(1);
      } else {
        console.log(chalk.green('✅ Accessibility CI passed'));
        process.exit(0);
      }
      
    } catch (error) {
      console.error(chalk.red('💥 Accessibility CI failed:'), error);
      process.exit(1);
    }
  }
  
  /**
   * Ensure output directory exists
   */
  async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.options.outputDir, { recursive: true });
      await fs.mkdir(path.join(this.options.outputDir, 'axe'), { recursive: true });
      await fs.mkdir(path.join(this.options.outputDir, 'pa11y'), { recursive: true });
      await fs.mkdir(path.join(this.options.outputDir, 'lighthouse'), { recursive: true });
      await fs.mkdir(path.join(this.options.outputDir, 'playwright'), { recursive: true });
      await fs.mkdir(path.join(this.options.outputDir, 'jest'), { recursive: true });
    } catch (error) {
      console.warn('Warning: Could not create output directories:', error.message);
    }
  }
  
  /**
   * Wait for application to be ready
   */
  async waitForApplication() {
    console.log(chalk.yellow('⏳ Waiting for application to be ready...'));
    
    const maxAttempts = 30;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(this.options.baseUrl);
        if (response.ok) {
          console.log(chalk.green('✅ Application is ready'));
          return;
        }
      } catch (error) {
        // Application not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error(`Application not ready after ${maxAttempts} attempts`);
  }
  
  /**
   * Run tests in parallel
   */
  async runTestsInParallel() {
    console.log(chalk.blue('🚀 Running accessibility tests in parallel...'));
    
    const testPromises = [
      this.runAxeTests(),
      this.runPa11yTests(),
      this.runLighthouseTests(),
      this.runPlaywrightTests(),
      this.runJestTests()
    ];
    
    await Promise.allSettled(testPromises);
  }
  
  /**
   * Run tests sequentially
   */
  async runTestsSequentially() {
    console.log(chalk.blue('🔄 Running accessibility tests sequentially...'));
    
    await this.runAxeTests();
    await this.runPa11yTests();
    await this.runLighthouseTests();
    await this.runPlaywrightTests();
    await this.runJestTests();
  }
  
  /**
   * Run axe-core tests via CLI
   */
  async runAxeTests() {
    console.log(chalk.cyan('Running axe-core tests...'));
    
    try {
      const axeCommand = `npx axe ${this.options.baseUrl} --timeout ${this.options.timeout} --tags wcag2a,wcag2aa,wcag21aa --format json --output ${path.join(this.options.outputDir, 'axe/results.json')}`;
      
      const result = execSync(axeCommand, { 
        encoding: 'utf8',
        timeout: this.options.timeout 
      });
      
      // Read and parse results
      const resultsPath = path.join(this.options.outputDir, 'axe/results.json');
      const axeResults = JSON.parse(await fs.readFile(resultsPath, 'utf8'));
      
      this.results.axe = {
        violations: axeResults.violations || [],
        passes: axeResults.passes || [],
        incomplete: axeResults.incomplete || [],
        inapplicable: axeResults.inapplicable || [],
        timestamp: new Date().toISOString(),
        url: this.options.baseUrl
      };
      
      console.log(chalk.green(`✅ Axe tests completed: ${this.results.axe.violations.length} violations found`));
      
    } catch (error) {
      console.error(chalk.red('❌ Axe tests failed:'), error.message);
      this.results.axe = { error: error.message };
    }
  }
  
  /**
   * Run Pa11y tests
   */
  async runPa11yTests() {
    console.log(chalk.cyan('Running Pa11y tests...'));
    
    try {
      const pa11yCommand = `npx pa11y --config pa11y.config.js --reporter json ${this.options.baseUrl}`;
      
      const result = execSync(pa11yCommand, { 
        encoding: 'utf8',
        timeout: this.options.timeout 
      });
      
      const pa11yResults = JSON.parse(result);
      
      this.results.pa11y = {
        issues: pa11yResults,
        errors: pa11yResults.filter(issue => issue.type === 'error'),
        warnings: pa11yResults.filter(issue => issue.type === 'warning'),
        notices: pa11yResults.filter(issue => issue.type === 'notice'),
        timestamp: new Date().toISOString(),
        url: this.options.baseUrl
      };
      
      // Save detailed results
      await fs.writeFile(
        path.join(this.options.outputDir, 'pa11y/results.json'),
        JSON.stringify(this.results.pa11y, null, 2)
      );
      
      console.log(chalk.green(`✅ Pa11y tests completed: ${this.results.pa11y.errors.length} errors found`));
      
    } catch (error) {
      console.error(chalk.red('❌ Pa11y tests failed:'), error.message);
      this.results.pa11y = { error: error.message };
    }
  }
  
  /**
   * Run Lighthouse accessibility tests
   */
  async runLighthouseTests() {
    console.log(chalk.cyan('Running Lighthouse accessibility tests...'));
    
    try {
      const lighthouseCommand = `npx lhci autorun --config=lighthouse.accessibility.config.js --upload.target=filesystem --upload.outputDir=${path.join(this.options.outputDir, 'lighthouse')}`;\n      \n      execSync(lighthouseCommand, { \n        encoding: 'utf8',\n        timeout: this.options.timeout \n      });\n      \n      // Read lighthouse results\n      const lighthouseDir = path.join(this.options.outputDir, 'lighthouse');\n      const files = await fs.readdir(lighthouseDir);\n      const manifestFile = files.find(f => f.includes('manifest'));\n      \n      if (manifestFile) {\n        const manifest = JSON.parse(await fs.readFile(path.join(lighthouseDir, manifestFile), 'utf8'));\n        const latestRun = manifest[0];\n        \n        if (latestRun && latestRun.jsonPath) {\n          const reportData = JSON.parse(await fs.readFile(path.join(lighthouseDir, latestRun.jsonPath), 'utf8'));\n          \n          this.results.lighthouse = {\n            accessibilityScore: reportData.categories.accessibility.score * 100,\n            audits: reportData.audits,\n            accessibilityAudits: Object.entries(reportData.audits)\n              .filter(([key, audit]) => audit.details && audit.details.type === 'accessibility')\n              .reduce((acc, [key, audit]) => {\n                acc[key] = audit;\n                return acc;\n              }, {}),\n            timestamp: new Date().toISOString(),\n            url: this.options.baseUrl\n          };\n        }\n      }\n      \n      console.log(chalk.green(`✅ Lighthouse tests completed: ${this.results.lighthouse?.accessibilityScore || 'N/A'}% accessibility score`));\n      \n    } catch (error) {\n      console.error(chalk.red('❌ Lighthouse tests failed:'), error.message);\n      this.results.lighthouse = { error: error.message };\n    }\n  }\n  \n  /**\n   * Run Playwright accessibility tests\n   */\n  async runPlaywrightTests() {\n    console.log(chalk.cyan('Running Playwright accessibility tests...'));\n    \n    try {\n      const playwrightCommand = `npx playwright test --config=playwright.accessibility.config.ts --reporter=json:${path.join(this.options.outputDir, 'playwright/results.json')}`;\n      \n      execSync(playwrightCommand, { \n        encoding: 'utf8',\n        timeout: this.options.timeout * 2 // Playwright tests might take longer\n      });\n      \n      // Read and parse results\n      const resultsPath = path.join(this.options.outputDir, 'playwright/results.json');\n      const playwrightResults = JSON.parse(await fs.readFile(resultsPath, 'utf8'));\n      \n      this.results.playwright = {\n        suites: playwrightResults.suites || [],\n        stats: playwrightResults.stats || {},\n        config: playwrightResults.config || {},\n        timestamp: new Date().toISOString()\n      };\n      \n      const failedTests = this.results.playwright.stats.failed || 0;\n      console.log(chalk.green(`✅ Playwright tests completed: ${failedTests} failed tests`));\n      \n    } catch (error) {\n      console.error(chalk.red('❌ Playwright tests failed:'), error.message);\n      this.results.playwright = { error: error.message };\n    }\n  }\n  \n  /**\n   * Run Jest accessibility tests\n   */\n  async runJestTests() {\n    console.log(chalk.cyan('Running Jest accessibility tests...'));\n    \n    try {\n      const jestCommand = `npm run test:a11y -- --json --outputFile=${path.join(this.options.outputDir, 'jest/results.json')}`;\n      \n      execSync(jestCommand, { \n        encoding: 'utf8',\n        timeout: this.options.timeout \n      });\n      \n      // Read and parse results\n      const resultsPath = path.join(this.options.outputDir, 'jest/results.json');\n      const jestResults = JSON.parse(await fs.readFile(resultsPath, 'utf8'));\n      \n      this.results.jest = {\n        numTotalTests: jestResults.numTotalTests || 0,\n        numPassedTests: jestResults.numPassedTests || 0,\n        numFailedTests: jestResults.numFailedTests || 0,\n        testResults: jestResults.testResults || [],\n        timestamp: new Date().toISOString()\n      };\n      \n      console.log(chalk.green(`✅ Jest tests completed: ${this.results.jest.numFailedTests} failed tests`));\n      \n    } catch (error) {\n      console.error(chalk.red('❌ Jest tests failed:'), error.message);\n      this.results.jest = { error: error.message };\n    }\n  }\n  \n  /**\n   * Generate consolidated accessibility report\n   */\n  async generateConsolidatedReport() {\n    console.log(chalk.blue('📊 Generating consolidated accessibility report...'));\n    \n    const summary = {\n      timestamp: new Date().toISOString(),\n      duration: Date.now() - this.startTime,\n      baseUrl: this.options.baseUrl,\n      wcagLevel: this.options.wcagLevel,\n      \n      // Overall scores\n      overallScore: this.calculateOverallScore(),\n      \n      // Tool-specific summaries\n      axe: this.summarizeAxeResults(),\n      pa11y: this.summarizePa11yResults(),\n      lighthouse: this.summarizeLighthouseResults(),\n      playwright: this.summarizePlaywrightResults(),\n      jest: this.summarizeJestResults(),\n      \n      // Consolidated issues\n      criticalIssues: this.extractCriticalIssues(),\n      recommendations: this.generateRecommendations(),\n      \n      // CI status\n      ciStatus: this.shouldFailCI() ? 'FAILED' : 'PASSED',\n      failureReasons: this.getFailureReasons()\n    };\n    \n    this.results.summary = summary;\n    \n    // Save consolidated report\n    await fs.writeFile(\n      path.join(this.options.outputDir, 'accessibility-report.json'),\n      JSON.stringify(summary, null, 2)\n    );\n    \n    // Generate HTML report\n    await this.generateHTMLReport(summary);\n    \n    // Generate markdown summary\n    await this.generateMarkdownSummary(summary);\n    \n    console.log(chalk.green('✅ Consolidated report generated'));\n    console.log(chalk.gray(`Report saved to: ${this.options.outputDir}`));\n  }\n  \n  /**\n   * Calculate overall accessibility score\n   */\n  calculateOverallScore() {\n    const scores = [];\n    \n    // Lighthouse score\n    if (this.results.lighthouse?.accessibilityScore) {\n      scores.push(this.results.lighthouse.accessibilityScore);\n    }\n    \n    // Axe score (based on violations)\n    if (this.results.axe && !this.results.axe.error) {\n      const violationScore = Math.max(0, 100 - (this.results.axe.violations.length * 10));\n      scores.push(violationScore);\n    }\n    \n    // Pa11y score (based on errors)\n    if (this.results.pa11y && !this.results.pa11y.error) {\n      const errorScore = Math.max(0, 100 - (this.results.pa11y.errors.length * 15));\n      scores.push(errorScore);\n    }\n    \n    // Jest score (based on test results)\n    if (this.results.jest && !this.results.jest.error) {\n      const passRate = this.results.jest.numTotalTests > 0 \n        ? (this.results.jest.numPassedTests / this.results.jest.numTotalTests) * 100\n        : 100;\n      scores.push(passRate);\n    }\n    \n    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;\n  }\n  \n  /**\n   * Summarize Axe results\n   */\n  summarizeAxeResults() {\n    if (this.results.axe?.error) {\n      return { status: 'error', message: this.results.axe.error };\n    }\n    \n    if (!this.results.axe) {\n      return { status: 'not_run' };\n    }\n    \n    const critical = this.results.axe.violations.filter(v => v.impact === 'critical');\n    const serious = this.results.axe.violations.filter(v => v.impact === 'serious');\n    const moderate = this.results.axe.violations.filter(v => v.impact === 'moderate');\n    const minor = this.results.axe.violations.filter(v => v.impact === 'minor');\n    \n    return {\n      status: 'completed',\n      totalViolations: this.results.axe.violations.length,\n      critical: critical.length,\n      serious: serious.length,\n      moderate: moderate.length,\n      minor: minor.length,\n      passes: this.results.axe.passes.length,\n      incomplete: this.results.axe.incomplete.length\n    };\n  }\n  \n  /**\n   * Summarize Pa11y results\n   */\n  summarizePa11yResults() {\n    if (this.results.pa11y?.error) {\n      return { status: 'error', message: this.results.pa11y.error };\n    }\n    \n    if (!this.results.pa11y) {\n      return { status: 'not_run' };\n    }\n    \n    return {\n      status: 'completed',\n      totalIssues: this.results.pa11y.issues.length,\n      errors: this.results.pa11y.errors.length,\n      warnings: this.results.pa11y.warnings.length,\n      notices: this.results.pa11y.notices.length\n    };\n  }\n  \n  /**\n   * Summarize Lighthouse results\n   */\n  summarizeLighthouseResults() {\n    if (this.results.lighthouse?.error) {\n      return { status: 'error', message: this.results.lighthouse.error };\n    }\n    \n    if (!this.results.lighthouse) {\n      return { status: 'not_run' };\n    }\n    \n    return {\n      status: 'completed',\n      accessibilityScore: this.results.lighthouse.accessibilityScore,\n      auditCount: Object.keys(this.results.lighthouse.accessibilityAudits || {}).length\n    };\n  }\n  \n  /**\n   * Summarize Playwright results\n   */\n  summarizePlaywrightResults() {\n    if (this.results.playwright?.error) {\n      return { status: 'error', message: this.results.playwright.error };\n    }\n    \n    if (!this.results.playwright) {\n      return { status: 'not_run' };\n    }\n    \n    return {\n      status: 'completed',\n      totalTests: this.results.playwright.stats.total || 0,\n      passed: this.results.playwright.stats.passed || 0,\n      failed: this.results.playwright.stats.failed || 0,\n      skipped: this.results.playwright.stats.skipped || 0\n    };\n  }\n  \n  /**\n   * Summarize Jest results\n   */\n  summarizeJestResults() {\n    if (this.results.jest?.error) {\n      return { status: 'error', message: this.results.jest.error };\n    }\n    \n    if (!this.results.jest) {\n      return { status: 'not_run' };\n    }\n    \n    return {\n      status: 'completed',\n      totalTests: this.results.jest.numTotalTests,\n      passed: this.results.jest.numPassedTests,\n      failed: this.results.jest.numFailedTests\n    };\n  }\n  \n  /**\n   * Extract critical accessibility issues across all tools\n   */\n  extractCriticalIssues() {\n    const issues = [];\n    \n    // Critical Axe violations\n    if (this.results.axe?.violations) {\n      this.results.axe.violations\n        .filter(v => v.impact === 'critical' || v.impact === 'serious')\n        .forEach(violation => {\n          issues.push({\n            tool: 'axe',\n            severity: violation.impact,\n            rule: violation.id,\n            description: violation.description,\n            help: violation.help,\n            helpUrl: violation.helpUrl,\n            nodes: violation.nodes.length\n          });\n        });\n    }\n    \n    // Pa11y errors\n    if (this.results.pa11y?.errors) {\n      this.results.pa11y.errors.forEach(error => {\n        issues.push({\n          tool: 'pa11y',\n          severity: 'error',\n          rule: error.code,\n          description: error.message,\n          selector: error.selector,\n          context: error.context\n        });\n      });\n    }\n    \n    return issues;\n  }\n  \n  /**\n   * Generate accessibility recommendations\n   */\n  generateRecommendations() {\n    const recommendations = [];\n    \n    // Analyze common issues and generate recommendations\n    const criticalIssues = this.extractCriticalIssues();\n    \n    const issueTypes = criticalIssues.reduce((acc, issue) => {\n      acc[issue.rule] = (acc[issue.rule] || 0) + 1;\n      return acc;\n    }, {});\n    \n    // Generate specific recommendations based on common issues\n    Object.entries(issueTypes).forEach(([rule, count]) => {\n      switch (rule) {\n        case 'color-contrast':\n          recommendations.push({\n            priority: 'high',\n            category: 'Color and Contrast',\n            issue: `${count} color contrast violations found`,\n            recommendation: 'Ensure all text has sufficient contrast ratio (4.5:1 for normal text, 3:1 for large text)',\n            wcagReference: 'WCAG 2.1 AA 1.4.3 Contrast (Minimum)'\n          });\n          break;\n        case 'image-alt':\n          recommendations.push({\n            priority: 'high',\n            category: 'Images',\n            issue: `${count} images missing alt text`,\n            recommendation: 'Provide meaningful alternative text for all informative images',\n            wcagReference: 'WCAG 2.1 A 1.1.1 Non-text Content'\n          });\n          break;\n        case 'heading-order':\n          recommendations.push({\n            priority: 'medium',\n            category: 'Structure',\n            issue: `${count} heading order violations`,\n            recommendation: 'Use headings in logical order (h1, h2, h3, etc.) without skipping levels',\n            wcagReference: 'WCAG 2.1 AA 1.3.1 Info and Relationships'\n          });\n          break;\n        default:\n          recommendations.push({\n            priority: 'medium',\n            category: 'General',\n            issue: `${count} violations of rule: ${rule}`,\n            recommendation: 'Review and fix the identified accessibility issues',\n            wcagReference: 'WCAG 2.1 Guidelines'\n          });\n      }\n    });\n    \n    return recommendations;\n  }\n  \n  /**\n   * Determine if CI should fail\n   */\n  shouldFailCI() {\n    if (!this.options.failOnViolations) {\n      return false;\n    }\n    \n    // Check for critical issues\n    const criticalIssues = this.extractCriticalIssues();\n    const hasCriticalIssues = criticalIssues.some(issue => \n      issue.severity === 'critical' || issue.severity === 'error'\n    );\n    \n    // Check overall score\n    const overallScore = this.calculateOverallScore();\n    const scoreTooLow = overallScore < 80; // Configurable threshold\n    \n    return hasCriticalIssues || scoreTooLow;\n  }\n  \n  /**\n   * Get failure reasons\n   */\n  getFailureReasons() {\n    const reasons = [];\n    \n    const criticalIssues = this.extractCriticalIssues();\n    const criticalCount = criticalIssues.filter(i => i.severity === 'critical' || i.severity === 'error').length;\n    \n    if (criticalCount > 0) {\n      reasons.push(`${criticalCount} critical accessibility issues found`);\n    }\n    \n    const overallScore = this.calculateOverallScore();\n    if (overallScore < 80) {\n      reasons.push(`Overall accessibility score (${overallScore}%) below threshold (80%)`);\n    }\n    \n    return reasons;\n  }\n  \n  /**\n   * Generate HTML report\n   */\n  async generateHTMLReport(summary) {\n    const htmlTemplate = `\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Accessibility Test Report</title>\n    <style>\n        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; }\n        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }\n        .score { font-size: 2em; font-weight: bold; color: ${summary.overallScore >= 80 ? '#28a745' : '#dc3545'}; }\n        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }\n        .card { border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; }\n        .card h3 { margin-top: 0; }\n        .status-passed { color: #28a745; }\n        .status-failed { color: #dc3545; }\n        .status-error { color: #fd7e14; }\n        .issue { margin: 10px 0; padding: 10px; background: #f8d7da; border-left: 4px solid #dc3545; }\n        .recommendation { margin: 10px 0; padding: 10px; background: #d1ecf1; border-left: 4px solid #17a2b8; }\n        table { width: 100%; border-collapse: collapse; }\n        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }\n        th { background-color: #f2f2f2; }\n    </style>\n</head>\n<body>\n    <div class=\"header\">\n        <h1>Accessibility Test Report</h1>\n        <div class=\"score\">${summary.overallScore}%</div>\n        <p>Overall Accessibility Score</p>\n        <p><strong>Status:</strong> <span class=\"status-${summary.ciStatus.toLowerCase()}\">${summary.ciStatus}</span></p>\n        <p><strong>Generated:</strong> ${summary.timestamp}</p>\n        <p><strong>Duration:</strong> ${Math.round(summary.duration / 1000)}s</p>\n    </div>\n    \n    <div class=\"grid\">\n        <div class=\"card\">\n            <h3>Tool Results</h3>\n            <table>\n                <thead>\n                    <tr><th>Tool</th><th>Status</th><th>Issues</th></tr>\n                </thead>\n                <tbody>\n                    <tr><td>Axe-core</td><td>${summary.axe.status}</td><td>${summary.axe.totalViolations || 'N/A'}</td></tr>\n                    <tr><td>Pa11y</td><td>${summary.pa11y.status}</td><td>${summary.pa11y.totalIssues || 'N/A'}</td></tr>\n                    <tr><td>Lighthouse</td><td>${summary.lighthouse.status}</td><td>${summary.lighthouse.accessibilityScore || 'N/A'}%</td></tr>\n                    <tr><td>Playwright</td><td>${summary.playwright.status}</td><td>${summary.playwright.failed || 'N/A'} failed</td></tr>\n                    <tr><td>Jest</td><td>${summary.jest.status}</td><td>${summary.jest.failed || 'N/A'} failed</td></tr>\n                </tbody>\n            </table>\n        </div>\n        \n        <div class=\"card\">\n            <h3>Critical Issues (${summary.criticalIssues.length})</h3>\n            ${summary.criticalIssues.slice(0, 5).map(issue => `\n                <div class=\"issue\">\n                    <strong>${issue.tool}: ${issue.rule}</strong><br>\n                    ${issue.description}\n                </div>\n            `).join('')}\n            ${summary.criticalIssues.length > 5 ? `<p>... and ${summary.criticalIssues.length - 5} more issues</p>` : ''}\n        </div>\n        \n        <div class=\"card\">\n            <h3>Recommendations</h3>\n            ${summary.recommendations.slice(0, 3).map(rec => `\n                <div class=\"recommendation\">\n                    <strong>${rec.category}</strong><br>\n                    ${rec.recommendation}\n                </div>\n            `).join('')}\n        </div>\n    </div>\n</body>\n</html>\n    `;\n    \n    await fs.writeFile(\n      path.join(this.options.outputDir, 'accessibility-report.html'),\n      htmlTemplate\n    );\n  }\n  \n  /**\n   * Generate markdown summary\n   */\n  async generateMarkdownSummary(summary) {\n    const markdown = `\n# Accessibility Test Report\n\n**Overall Score:** ${summary.overallScore}%  \n**Status:** ${summary.ciStatus}  \n**Generated:** ${summary.timestamp}  \n**Duration:** ${Math.round(summary.duration / 1000)}s  \n\n## Summary\n\n| Tool | Status | Issues |\n|------|--------|---------|\n| Axe-core | ${summary.axe.status} | ${summary.axe.totalViolations || 'N/A'} violations |\n| Pa11y | ${summary.pa11y.status} | ${summary.pa11y.totalIssues || 'N/A'} issues |\n| Lighthouse | ${summary.lighthouse.status} | ${summary.lighthouse.accessibilityScore || 'N/A'}% score |\n| Playwright | ${summary.playwright.status} | ${summary.playwright.failed || 'N/A'} failed tests |\n| Jest | ${summary.jest.status} | ${summary.jest.failed || 'N/A'} failed tests |\n\n## Critical Issues (${summary.criticalIssues.length})\n\n${summary.criticalIssues.slice(0, 5).map(issue => `\n### ${issue.tool}: ${issue.rule}\n${issue.description}\n`).join('\\n')}\n\n${summary.criticalIssues.length > 5 ? `*... and ${summary.criticalIssues.length - 5} more issues*\\n` : ''}\n\n## Recommendations\n\n${summary.recommendations.slice(0, 3).map(rec => `\n### ${rec.category}\n**Priority:** ${rec.priority}  \n**Issue:** ${rec.issue}  \n**Recommendation:** ${rec.recommendation}  \n**WCAG Reference:** ${rec.wcagReference}\n`).join('\\n')}\n\n---\n*Generated by Accessibility CI Pipeline*\n    `;\n    \n    await fs.writeFile(\n      path.join(this.options.outputDir, 'accessibility-summary.md'),\n      markdown\n    );\n  }\n}\n\n// CLI interface\nif (require.main === module) {\n  const args = process.argv.slice(2);\n  const options = {};\n  \n  // Parse command line arguments\n  for (let i = 0; i < args.length; i += 2) {\n    const key = args[i].replace(/^--/, '');\n    const value = args[i + 1];\n    \n    if (value === 'true') options[key] = true;\n    else if (value === 'false') options[key] = false;\n    else if (!isNaN(value)) options[key] = parseInt(value);\n    else options[key] = value;\n  }\n  \n  const runner = new AccessibilityCIRunner(options);\n  runner.run().catch(console.error);\n}\n\nmodule.exports = AccessibilityCIRunner;";