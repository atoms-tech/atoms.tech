#!/usr/bin/env node

/**
 * Comprehensive E2E Test Runner
 * Orchestrates all E2E test scenarios with reporting and metrics
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class E2ETestRunner {
    constructor() {
        this.results = {
            startTime: new Date().toISOString(),
            endTime: null,
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            suites: [],
            performance: {},
            coverage: {},
            errors: [],
        };
        
        this.testSuites = [
            {
                name: 'Authentication Flow',
                path: 'tests/e2e/user-journey/complete-authentication-flow.spec.ts',
                priority: 'high',
                timeout: 120000,
            },
            {
                name: 'Project Management',
                path: 'tests/e2e/user-journey/project-management-workflow.spec.ts',
                priority: 'high',
                timeout: 180000,
            },
            {
                name: 'Cross-Browser Compatibility',
                path: 'tests/e2e/cross-browser/browser-compatibility.spec.ts',
                priority: 'medium',
                timeout: 300000,
            },
            {
                name: 'Error Handling',
                path: 'tests/e2e/error-scenarios/error-handling.spec.ts',
                priority: 'high',
                timeout: 150000,
            },
            {
                name: 'Performance Testing',
                path: 'tests/e2e/performance/performance-testing.spec.ts',
                priority: 'medium',
                timeout: 240000,
            },
            {
                name: 'Legacy E2E Tests',
                path: 'tests/e2e/auth.spec.ts',
                priority: 'low',
                timeout: 60000,
            },
            {
                name: 'Home Page Tests',
                path: 'tests/e2e/home-page.spec.ts',
                priority: 'medium',
                timeout: 90000,
            },
            {
                name: 'Navigation Tests',
                path: 'tests/e2e/navigation.spec.ts',
                priority: 'medium',
                timeout: 60000,
            },
        ];
    }

    async run(options = {}) {
        console.log('🚀 Starting Comprehensive E2E Test Suite...\n');
        
        const {
            browsers = ['chromium', 'firefox', 'webkit'],
            suites = 'all',
            parallel = true,
            headless = true,
            reportFormat = 'detailed',
            failFast = false,
        } = options;

        try {
            // Pre-test setup
            await this.preTestSetup();
            
            // Determine which suites to run
            const suitesToRun = this.getSuitesToRun(suites);
            
            // Run tests
            if (parallel) {
                await this.runTestsInParallel(suitesToRun, browsers, { headless, failFast });
            } else {
                await this.runTestsSequentially(suitesToRun, browsers, { headless, failFast });
            }
            
            // Post-test analysis
            await this.postTestAnalysis();
            
            // Generate reports
            await this.generateReports(reportFormat);
            
            // Summary
            this.printSummary();
            
        } catch (error) {
            console.error('❌ E2E Test Runner failed:', error);
            this.results.errors.push({
                type: 'runner_error',
                message: error.message,
                timestamp: new Date().toISOString(),
            });
        } finally {
            this.results.endTime = new Date().toISOString();
            await this.saveResults();
        }
    }

    async preTestSetup() {
        console.log('🔧 Setting up test environment...');
        
        // Ensure test directories exist
        const testDirs = [
            'test-results/e2e-reports',
            'test-results/screenshots',
            'test-results/videos',
            'test-results/traces',
            'test-results/agent-context',
        ];
        
        testDirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Install Playwright browsers if needed
        try {
            execSync('npx playwright install --with-deps', { stdio: 'ignore' });
        } catch (error) {
            console.warn('⚠️ Could not install Playwright browsers:', error.message);
        }
        
        // Validate test infrastructure
        await this.validateTestInfrastructure();
    }

    async validateTestInfrastructure() {
        const validationResults = [];
        
        // Check if all test files exist
        for (const suite of this.testSuites) {
            const exists = fs.existsSync(suite.path);
            validationResults.push({
                suite: suite.name,
                file: suite.path,
                exists,
                status: exists ? 'valid' : 'missing',
            });
        }
        
        // Check page objects
        const pageObjectDir = 'tests/e2e/page-objects';
        const pageObjects = ['auth.page.ts', 'home.page.ts', 'navigation.page.ts', 'document.page.ts', 'project.page.ts'];
        
        for (const pageObject of pageObjects) {
            const path = `${pageObjectDir}/${pageObject}`;
            const exists = fs.existsSync(path);
            validationResults.push({
                suite: 'Page Objects',
                file: path,
                exists,
                status: exists ? 'valid' : 'missing',
            });
        }
        
        // Save validation results
        fs.writeFileSync(
            'test-results/e2e-reports/infrastructure-validation.json',
            JSON.stringify(validationResults, null, 2)
        );
        
        const missingFiles = validationResults.filter(r => !r.exists);
        if (missingFiles.length > 0) {
            console.warn('⚠️ Missing test files:');
            missingFiles.forEach(f => console.warn(`   - ${f.file}`));
        }
    }

    getSuitesToRun(suitesFilter) {
        if (suitesFilter === 'all') {
            return this.testSuites;
        }
        
        if (Array.isArray(suitesFilter)) {
            return this.testSuites.filter(suite => 
                suitesFilter.some(filter => suite.name.toLowerCase().includes(filter.toLowerCase()))
            );
        }
        
        if (typeof suitesFilter === 'string') {
            return this.testSuites.filter(suite => 
                suite.name.toLowerCase().includes(suitesFilter.toLowerCase())
            );
        }
        
        return this.testSuites;
    }

    async runTestsInParallel(suites, browsers, options) {
        console.log(`🔄 Running ${suites.length} test suites in parallel on ${browsers.length} browsers...\n`);
        
        const promises = [];
        
        for (const suite of suites) {
            for (const browser of browsers) {
                const promise = this.runSingleTest(suite, browser, options)
                    .then(result => {
                        this.updateResults(result);
                        return result;
                    })
                    .catch(error => {
                        const errorResult = {
                            suite: suite.name,
                            browser,
                            status: 'failed',
                            error: error.message,
                            duration: 0,
                        };
                        this.updateResults(errorResult);
                        if (options.failFast) {
                            throw error;
                        }
                        return errorResult;
                    });
                
                promises.push(promise);
            }
        }
        
        try {
            await Promise.all(promises);
        } catch (error) {
            if (options.failFast) {
                console.error('❌ Failing fast due to error:', error.message);
                throw error;
            }
        }
    }

    async runTestsSequentially(suites, browsers, options) {
        console.log(`🔄 Running ${suites.length} test suites sequentially on ${browsers.length} browsers...\n`);
        
        for (const suite of suites) {
            for (const browser of browsers) {
                try {
                    const result = await this.runSingleTest(suite, browser, options);
                    this.updateResults(result);
                    
                    if (result.status === 'failed' && options.failFast) {
                        throw new Error(`Test failed: ${suite.name} on ${browser}`);
                    }
                } catch (error) {
                    const errorResult = {
                        suite: suite.name,
                        browser,
                        status: 'failed',
                        error: error.message,
                        duration: 0,
                    };
                    this.updateResults(errorResult);
                    
                    if (options.failFast) {
                        throw error;
                    }
                }
            }
        }
    }

    async runSingleTest(suite, browser, options) {
        const startTime = Date.now();
        console.log(`🧪 Running: ${suite.name} (${browser})`);
        
        try {
            const command = [
                'npx playwright test',
                `--project=${browser}`,
                `"${suite.path}"`,
                options.headless ? '--headless' : '--headed',
                `--timeout=${suite.timeout}`,
                '--reporter=json',
                `--output-dir=test-results/playwright-output/${browser}`,
            ].join(' ');
            
            const result = execSync(command, { 
                encoding: 'utf8',
                timeout: suite.timeout + 30000, // Add buffer
            });
            
            const duration = Date.now() - startTime;
            
            console.log(`✅ Passed: ${suite.name} (${browser}) - ${duration}ms`);
            
            return {
                suite: suite.name,
                browser,
                status: 'passed',
                duration,
                output: result,
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            
            console.log(`❌ Failed: ${suite.name} (${browser}) - ${duration}ms`);
            console.log(`   Error: ${error.message}`);
            
            return {
                suite: suite.name,
                browser,
                status: 'failed',
                duration,
                error: error.message,
                output: error.stdout || '',
            };
        }
    }

    updateResults(result) {
        this.results.totalTests++;
        
        switch (result.status) {
            case 'passed':
                this.results.passedTests++;
                break;
            case 'failed':
                this.results.failedTests++;
                break;
            case 'skipped':
                this.results.skippedTests++;
                break;
        }
        
        this.results.suites.push(result);
    }

    async postTestAnalysis() {
        console.log('\n📊 Analyzing test results...');
        
        // Performance analysis
        this.results.performance = {
            avgDuration: this.calculateAverageDuration(),
            slowestTest: this.findSlowestTest(),
            fastestTest: this.findFastestTest(),
            browserPerformance: this.analyzeBrowserPerformance(),
        };
        
        // Error analysis
        const failedTests = this.results.suites.filter(s => s.status === 'failed');
        if (failedTests.length > 0) {
            this.results.errors.push({
                type: 'test_failures',
                count: failedTests.length,
                details: failedTests.map(t => ({
                    suite: t.suite,
                    browser: t.browser,
                    error: t.error,
                })),
            });
        }
    }

    calculateAverageDuration() {
        const passedTests = this.results.suites.filter(s => s.status === 'passed');
        if (passedTests.length === 0) return 0;
        
        const totalDuration = passedTests.reduce((sum, test) => sum + test.duration, 0);
        return Math.round(totalDuration / passedTests.length);
    }

    findSlowestTest() {
        return this.results.suites.reduce((slowest, current) => 
            current.duration > (slowest?.duration || 0) ? current : slowest
        , null);
    }

    findFastestTest() {
        return this.results.suites.reduce((fastest, current) => 
            current.duration < (fastest?.duration || Infinity) ? current : fastest
        , null);
    }

    analyzeBrowserPerformance() {
        const browsers = ['chromium', 'firefox', 'webkit'];
        const analysis = {};
        
        browsers.forEach(browser => {
            const browserTests = this.results.suites.filter(s => s.browser === browser);
            const passedTests = browserTests.filter(s => s.status === 'passed');
            
            analysis[browser] = {
                total: browserTests.length,
                passed: passedTests.length,
                failed: browserTests.filter(s => s.status === 'failed').length,
                avgDuration: passedTests.length > 0 
                    ? Math.round(passedTests.reduce((sum, t) => sum + t.duration, 0) / passedTests.length)
                    : 0,
            };
        });
        
        return analysis;
    }

    async generateReports(format) {
        console.log('📝 Generating test reports...');
        
        // JSON report
        await this.generateJSONReport();
        
        // HTML report
        if (format === 'detailed' || format === 'html') {
            await this.generateHTMLReport();
        }
        
        // Agent context report
        await this.generateAgentContextReport();
        
        // JUnit XML for CI/CD
        await this.generateJUnitReport();
    }

    async generateJSONReport() {
        const reportPath = 'test-results/e2e-reports/e2e-test-results.json';
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`📄 JSON report saved: ${reportPath}`);
    }

    async generateHTMLReport() {
        const htmlContent = this.generateHTMLContent();
        const reportPath = 'test-results/e2e-reports/e2e-test-report.html';
        fs.writeFileSync(reportPath, htmlContent);
        console.log(`📄 HTML report saved: ${reportPath}`);
    }

    generateHTMLContent() {
        const passRate = ((this.results.passedTests / this.results.totalTests) * 100).toFixed(1);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E2E Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .suite { margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .suite-header { font-weight: bold; margin-bottom: 10px; }
        .test-result { margin: 5px 0; padding: 8px; border-radius: 4px; }
        .test-passed { background: #d4edda; color: #155724; }
        .test-failed { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="header">
        <h1>E2E Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Duration: ${this.calculateTotalDuration()}ms</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div class="value">${this.results.totalTests}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div class="value passed">${this.results.passedTests}</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div class="value failed">${this.results.failedTests}</div>
        </div>
        <div class="metric">
            <h3>Pass Rate</h3>
            <div class="value">${passRate}%</div>
        </div>
    </div>
    
    <h2>Test Results by Suite</h2>
    ${this.generateSuiteResults()}
    
    ${this.results.performance ? this.generatePerformanceSection() : ''}
</body>
</html>`;
    }

    generateSuiteResults() {
        const suiteGroups = {};
        
        this.results.suites.forEach(result => {
            if (!suiteGroups[result.suite]) {
                suiteGroups[result.suite] = [];
            }
            suiteGroups[result.suite].push(result);
        });
        
        return Object.entries(suiteGroups).map(([suiteName, results]) => {
            const passed = results.filter(r => r.status === 'passed').length;
            const failed = results.filter(r => r.status === 'failed').length;
            
            return `
                <div class="suite">
                    <div class="suite-header">
                        ${suiteName} (${passed}/${results.length} passed)
                    </div>
                    ${results.map(r => `
                        <div class="test-result test-${r.status}">
                            ${r.browser}: ${r.status} (${r.duration}ms)
                            ${r.error ? `<br><small>Error: ${r.error}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }).join('');
    }

    generatePerformanceSection() {
        return `
            <h2>Performance Analysis</h2>
            <div class="suite">
                <p><strong>Average Duration:</strong> ${this.results.performance.avgDuration}ms</p>
                <p><strong>Slowest Test:</strong> ${this.results.performance.slowestTest?.suite} (${this.results.performance.slowestTest?.browser}) - ${this.results.performance.slowestTest?.duration}ms</p>
                <p><strong>Fastest Test:</strong> ${this.results.performance.fastestTest?.suite} (${this.results.performance.fastestTest?.browser}) - ${this.results.performance.fastestTest?.duration}ms</p>
                
                <h3>Browser Performance</h3>
                ${Object.entries(this.results.performance.browserPerformance).map(([browser, stats]) => `
                    <p><strong>${browser}:</strong> ${stats.passed}/${stats.total} passed (avg: ${stats.avgDuration}ms)</p>
                `).join('')}
            </div>
        `;
    }

    async generateAgentContextReport() {
        const agentReport = {
            testSuite: 'E2E Comprehensive Tests',
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.totalTests,
                passed: this.results.passedTests,
                failed: this.results.failedTests,
                passRate: ((this.results.passedTests / this.results.totalTests) * 100).toFixed(1),
            },
            coverage: {
                userJourneys: ['authentication', 'project-management', 'document-management'],
                browsers: ['chromium', 'firefox', 'webkit'],
                scenarios: ['happy-path', 'error-handling', 'performance', 'cross-browser'],
            },
            performance: this.results.performance,
            recommendations: this.generateRecommendations(),
        };
        
        const reportPath = 'test-results/agent-context/e2e-context.json';
        fs.writeFileSync(reportPath, JSON.stringify(agentReport, null, 2));
        console.log(`🤖 Agent context report saved: ${reportPath}`);
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.results.failedTests > 0) {
            recommendations.push({
                type: 'quality',
                priority: 'high',
                message: `${this.results.failedTests} tests failed. Review and fix failing test scenarios.`,
            });
        }
        
        if (this.results.performance?.avgDuration > 30000) {
            recommendations.push({
                type: 'performance',
                priority: 'medium',
                message: 'Average test duration is high. Consider optimizing test scenarios or application performance.',
            });
        }
        
        const chromePerf = this.results.performance?.browserPerformance?.chromium;
        const firefoxPerf = this.results.performance?.browserPerformance?.firefox;
        
        if (chromePerf && firefoxPerf && Math.abs(chromePerf.avgDuration - firefoxPerf.avgDuration) > 5000) {
            recommendations.push({
                type: 'cross-browser',
                priority: 'medium',
                message: 'Significant performance differences between browsers detected. Review cross-browser optimizations.',
            });
        }
        
        return recommendations;
    }

    async generateJUnitReport() {
        const junit = this.generateJUnitXML();
        const reportPath = 'test-results/e2e-reports/junit-results.xml';
        fs.writeFileSync(reportPath, junit);
        console.log(`📄 JUnit report saved: ${reportPath}`);
    }

    generateJUnitXML() {
        const totalDuration = this.calculateTotalDuration() / 1000; // Convert to seconds
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="E2E Tests" tests="${this.results.totalTests}" failures="${this.results.failedTests}" time="${totalDuration}">
${this.results.suites.map(suite => `
    <testsuite name="${suite.suite} (${suite.browser})" tests="1" failures="${suite.status === 'failed' ? 1 : 0}" time="${suite.duration / 1000}">
        <testcase name="${suite.suite}" classname="${suite.browser}" time="${suite.duration / 1000}">
            ${suite.status === 'failed' ? `<failure message="${suite.error || 'Test failed'}">${suite.output || ''}</failure>` : ''}
        </testcase>
    </testsuite>
`).join('')}
</testsuites>`;
    }

    calculateTotalDuration() {
        return this.results.suites.reduce((total, suite) => total + suite.duration, 0);
    }

    printSummary() {
        console.log('\n📋 E2E Test Summary:');
        console.log('=====================================');
        console.log(`📊 Total Tests: ${this.results.totalTests}`);
        console.log(`✅ Passed: ${this.results.passedTests}`);
        console.log(`❌ Failed: ${this.results.failedTests}`);
        console.log(`⏭️ Skipped: ${this.results.skippedTests}`);
        console.log(`📈 Pass Rate: ${((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)}%`);
        console.log(`⏱️ Total Duration: ${this.calculateTotalDuration()}ms`);
        
        if (this.results.performance) {
            console.log(`\n🎯 Performance:`);
            console.log(`   Average Duration: ${this.results.performance.avgDuration}ms`);
            console.log(`   Slowest Test: ${this.results.performance.slowestTest?.suite} (${this.results.performance.slowestTest?.duration}ms)`);
        }
        
        if (this.results.failedTests > 0) {
            console.log(`\n❌ Failed Tests:`);
            this.results.suites
                .filter(s => s.status === 'failed')
                .forEach(s => console.log(`   - ${s.suite} (${s.browser}): ${s.error}`));
        }
        
        console.log('\n📁 Reports saved in test-results/e2e-reports/');
    }

    async saveResults() {
        const resultsPath = 'test-results/e2e-reports/final-results.json';
        fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse CLI arguments
    args.forEach((arg, index) => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            
            switch (key) {
                case 'browsers':
                    options.browsers = value ? value.split(',') : ['chromium', 'firefox', 'webkit'];
                    break;
                case 'suites':
                    options.suites = value ? value.split(',') : 'all';
                    break;
                case 'parallel':
                    options.parallel = value !== 'false';
                    break;
                case 'headless':
                    options.headless = value !== 'false';
                    break;
                case 'report':
                    options.reportFormat = value || 'detailed';
                    break;
                case 'fail-fast':
                    options.failFast = value !== 'false';
                    break;
                case 'help':
                    console.log(`
E2E Test Runner Usage:

Options:
  --browsers=chrome,firefox,safari  Browsers to test (default: all)
  --suites=auth,project             Test suites to run (default: all)
  --parallel=true/false             Run tests in parallel (default: true)
  --headless=true/false             Run in headless mode (default: true)
  --report=detailed/simple          Report format (default: detailed)
  --fail-fast=true/false            Stop on first failure (default: false)
  --help                            Show this help message

Examples:
  node e2e-test-runner.js --browsers=chromium --suites=auth
  node e2e-test-runner.js --parallel=false --headless=false
  node e2e-test-runner.js --fail-fast=true --report=simple
`);
                    process.exit(0);
            }
        }
    });
    
    const runner = new E2ETestRunner();
    runner.run(options)
        .then(() => {
            console.log('\n🎉 E2E Test Runner completed successfully!');
            process.exit(runner.results.failedTests > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('💥 E2E Test Runner failed:', error);
            process.exit(1);
        });
}

module.exports = E2ETestRunner;