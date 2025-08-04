#!/usr/bin/env node

/**
 * Comprehensive E2E Test Runner
 * Orchestrates all E2E testing scenarios with intelligent test selection and reporting
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ComprehensiveE2ERunner {
    constructor() {
        this.testSuites = {
            authentication: {
                file: 'auth.spec.ts',
                description: 'Authentication flows and session management',
                priority: 'critical',
                estimatedTime: 300000 // 5 minutes
            },
            navigation: {
                file: 'navigation.spec.ts', 
                description: 'Navigation and routing functionality',
                priority: 'high',
                estimatedTime: 240000 // 4 minutes
            },
            crudOperations: {
                file: 'crud-operations.spec.ts',
                description: 'Complete CRUD workflows for all entities',
                priority: 'critical',
                estimatedTime: 600000 // 10 minutes
            },
            apiIntegration: {
                file: 'api-integration.spec.ts',
                description: 'API integration and real-time features',
                priority: 'high',
                estimatedTime: 480000 // 8 minutes
            },
            advancedUserJourneys: {
                file: 'advanced-user-journeys.spec.ts',
                description: 'Complex user workflows and scenarios',
                priority: 'high',
                estimatedTime: 720000 // 12 minutes
            },
            errorScenarios: {
                file: 'comprehensive-error-scenarios.spec.ts',
                description: 'Error handling and edge cases',
                priority: 'medium',
                estimatedTime: 540000 // 9 minutes
            },
            mobileResponsiveness: {
                file: 'mobile-responsiveness.spec.ts',
                description: 'Mobile and responsive design testing',
                priority: 'high',
                estimatedTime: 360000 // 6 minutes
            },
            crossBrowser: {
                file: 'cross-browser.spec.ts',
                description: 'Cross-browser compatibility',
                priority: 'medium',
                estimatedTime: 300000 // 5 minutes
            },
            performance: {
                file: 'performance-monitoring/performance-e2e.spec.ts',
                description: 'Performance monitoring and optimization',
                priority: 'medium',
                estimatedTime: 420000 // 7 minutes
            },
            accessibility: {
                file: 'accessibility-coverage/accessibility-e2e.spec.ts',
                description: 'Accessibility compliance testing',
                priority: 'high',
                estimatedTime: 300000 // 5 minutes
            }
        };

        this.browsers = ['chromium', 'firefox', 'webkit'];
        this.viewports = ['desktop', 'tablet', 'mobile'];
        this.config = this.loadConfig();
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0,
            duration: 0,
            suiteResults: {},
            errors: []
        };
    }

    loadConfig() {
        const defaultConfig = {
            parallel: true,
            maxWorkers: 4,
            timeout: 30000,
            retries: 2,
            reporters: ['html', 'json', 'junit'],
            outputDir: 'test-results/e2e',
            screenshots: 'only-on-failure',
            video: 'retain-on-failure',
            trace: 'retain-on-failure'
        };

        try {
            const userConfig = require('../../playwright.config.ts');
            return { ...defaultConfig, ...userConfig };
        } catch (error) {
            console.log('Using default configuration');
            return defaultConfig;
        }
    }

    async run(options = {}) {
        const {
            suites = 'all',
            browsers = ['chromium'],
            priority = 'all',
            headed = false,
            debug = false,
            update = false,
            parallel = true,
            maxFailures = 10
        } = options;

        console.log('🚀 Starting Comprehensive E2E Test Suite');
        console.log('===============================================');

        const startTime = Date.now();

        try {
            // Pre-flight checks
            await this.performPreflightChecks();

            // Select test suites based on criteria
            const selectedSuites = this.selectTestSuites(suites, priority);
            
            console.log(`📋 Selected Test Suites: ${selectedSuites.length}`);
            console.log(`🌐 Target Browsers: ${browsers.join(', ')}`);
            console.log(`⏱️  Estimated Duration: ${this.calculateEstimatedTime(selectedSuites)} minutes`);
            console.log('');

            // Run test suites
            for (const browser of browsers) {
                console.log(`🌐 Running tests in ${browser}...`);
                
                const browserResults = await this.runBrowserTests(
                    selectedSuites, 
                    browser, 
                    { headed, debug, update, parallel, maxFailures }
                );
                
                this.aggregateResults(browserResults, browser);
            }

            // Generate comprehensive report
            await this.generateComprehensiveReport();

            // Performance analysis
            await this.analyzePerformance();

            // Coverage analysis
            await this.analyzeCoverage();

        } catch (error) {
            console.error('❌ Test run failed:', error.message);
            this.results.errors.push(error.message);
        } finally {
            const duration = Date.now() - startTime;
            this.results.duration = duration;
            
            this.printSummary();
            await this.saveResults();
        }

        return this.results;
    }

    async performPreflightChecks() {
        console.log('🔍 Performing pre-flight checks...');

        // Check if application server is running
        try {
            const response = await fetch('http://localhost:3000/health').catch(() => null);
            if (!response || !response.ok) {
                console.log('⚠️  Application server not detected, starting...');
                await this.startApplicationServer();
            } else {
                console.log('✅ Application server is running');
            }
        } catch (error) {
            console.log('⚠️  Could not verify application server, proceeding...');
        }

        // Verify test files exist
        const missingFiles = [];
        for (const [name, suite] of Object.entries(this.testSuites)) {
            const filePath = path.join(__dirname, suite.file);
            if (!fs.existsSync(filePath)) {
                missingFiles.push(suite.file);
            }
        }

        if (missingFiles.length > 0) {
            console.warn(`⚠️  Missing test files: ${missingFiles.join(', ')}`);
        }

        // Check Playwright installation
        try {
            execSync('npx playwright --version', { stdio: 'pipe' });
            console.log('✅ Playwright is installed');
        } catch (error) {
            throw new Error('Playwright is not installed. Run: npm install @playwright/test');
        }

        console.log('✅ Pre-flight checks completed');
        console.log('');
    }

    selectTestSuites(suites, priority) {
        if (suites === 'all') {
            if (priority === 'all') {
                return Object.keys(this.testSuites);
            } else {
                return Object.entries(this.testSuites)
                    .filter(([name, suite]) => suite.priority === priority)
                    .map(([name]) => name);
            }
        } else if (Array.isArray(suites)) {
            return suites.filter(suite => this.testSuites[suite]);
        } else {
            return [suites].filter(suite => this.testSuites[suite]);
        }
    }

    calculateEstimatedTime(selectedSuites) {
        const totalMs = selectedSuites.reduce((total, suiteName) => {
            return total + (this.testSuites[suiteName]?.estimatedTime || 300000);
        }, 0);
        return Math.ceil(totalMs / 60000); // Convert to minutes
    }

    async runBrowserTests(selectedSuites, browser, options) {
        const results = {
            browser,
            suites: {},
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0
        };

        for (const suiteName of selectedSuites) {
            console.log(`  📝 Running ${suiteName} tests...`);
            
            const suiteStartTime = Date.now();
            const suiteResult = await this.runSingleSuite(
                this.testSuites[suiteName].file,
                browser,
                options
            );
            
            const suiteDuration = Date.now() - suiteStartTime;
            
            results.suites[suiteName] = {
                ...suiteResult,
                duration: suiteDuration,
                estimatedTime: this.testSuites[suiteName].estimatedTime
            };
            
            results.passed += suiteResult.passed;
            results.failed += suiteResult.failed;
            results.skipped += suiteResult.skipped;
            results.duration += suiteDuration;

            // Stop on max failures
            if (options.maxFailures && results.failed >= options.maxFailures) {
                console.log(`🛑 Stopping tests after ${results.failed} failures`);
                break;
            }

            // Progress indicator
            const progress = (selectedSuites.indexOf(suiteName) + 1) / selectedSuites.length * 100;
            console.log(`  ⏱️  Progress: ${progress.toFixed(1)}% (${this.formatDuration(suiteDuration)})`);
        }

        return results;
    }

    async runSingleSuite(testFile, browser, options) {
        const args = [
            'playwright', 'test',
            testFile,
            `--project=${browser}`,
            `--reporter=json`,
            `--output-dir=test-results/e2e/${browser}`
        ];

        if (options.headed) args.push('--headed');
        if (options.debug) args.push('--debug');
        if (options.update) args.push('--update-snapshots');
        if (!options.parallel) args.push('--workers=1');

        try {
            const output = execSync(`npx ${args.join(' ')}`, {
                cwd: path.join(__dirname, '../..'),
                encoding: 'utf8',
                timeout: 600000, // 10 minute timeout per suite
                stdio: 'pipe'
            });

            return this.parsePlaywrightOutput(output);
        } catch (error) {
            console.error(`❌ Suite ${testFile} failed:`, error.message);
            return {
                passed: 0,
                failed: 1,
                skipped: 0,
                error: error.message,
                output: error.stdout || error.message
            };
        }
    }

    parsePlaywrightOutput(output) {
        try {
            const jsonMatch = output.match(/\{.*"stats".*\}/s);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return {
                    passed: result.stats?.passed || 0,
                    failed: result.stats?.failed || 0,
                    skipped: result.stats?.skipped || 0,
                    duration: result.stats?.duration || 0
                };
            }
        } catch (error) {
            console.warn('Could not parse Playwright output');
        }

        // Fallback parsing
        const passedMatch = output.match(/(\d+) passed/);
        const failedMatch = output.match(/(\d+) failed/);
        const skippedMatch = output.match(/(\d+) skipped/);

        return {
            passed: passedMatch ? parseInt(passedMatch[1]) : 0,
            failed: failedMatch ? parseInt(failedMatch[1]) : 0,
            skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0,
            duration: 0
        };
    }

    aggregateResults(browserResults, browser) {
        this.results.passed += browserResults.passed;
        this.results.failed += browserResults.failed;
        this.results.skipped += browserResults.skipped;
        this.results.total += browserResults.passed + browserResults.failed + browserResults.skipped;
        this.results.suiteResults[browser] = browserResults;
    }

    async generateComprehensiveReport() {
        console.log('📊 Generating comprehensive test report...');

        const reportData = {
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                skipped: this.results.skipped,
                passRate: this.results.total > 0 ? (this.results.passed / this.results.total * 100).toFixed(2) : 0,
                duration: this.results.duration,
                timestamp: new Date().toISOString()
            },
            suites: this.testSuites,
            results: this.results.suiteResults,
            coverage: await this.getCoverageData(),
            performance: await this.getPerformanceData(),
            environment: {
                node: process.version,
                platform: process.platform,
                arch: process.arch,
                ci: !!process.env.CI
            }
        };

        // Save JSON report
        const reportPath = path.join(__dirname, '../../test-results/e2e/comprehensive-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

        // Generate HTML report
        await this.generateHTMLReport(reportData);

        console.log(`📄 Report saved to: ${reportPath}`);
    }

    async generateHTMLReport(reportData) {
        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Comprehensive E2E Test Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
                .passed { color: green; }
                .failed { color: red; }
                .skipped { color: orange; }
                .suite { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 3px; }
                .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
                .metric { background: white; padding: 15px; border: 1px solid #ddd; border-radius: 5px; text-align: center; }
                .chart { height: 200px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <h1>Comprehensive E2E Test Report</h1>
            
            <div class="summary">
                <h2>Test Summary</h2>
                <div class="metrics">
                    <div class="metric">
                        <h3>Total Tests</h3>
                        <div style="font-size: 2em;">${reportData.summary.total}</div>
                    </div>
                    <div class="metric">
                        <h3 class="passed">Passed</h3>
                        <div style="font-size: 2em;">${reportData.summary.passed}</div>
                    </div>
                    <div class="metric">
                        <h3 class="failed">Failed</h3>
                        <div style="font-size: 2em;">${reportData.summary.failed}</div>
                    </div>
                    <div class="metric">
                        <h3>Pass Rate</h3>
                        <div style="font-size: 2em;">${reportData.summary.passRate}%</div>
                    </div>
                    <div class="metric">
                        <h3>Duration</h3>
                        <div style="font-size: 1.5em;">${this.formatDuration(reportData.summary.duration)}</div>
                    </div>
                </div>
            </div>

            <h2>Test Suites</h2>
            ${Object.entries(reportData.suites).map(([name, suite]) => `
                <div class="suite">
                    <h3>${name}</h3>
                    <p>${suite.description}</p>
                    <p><strong>Priority:</strong> ${suite.priority}</p>
                    <p><strong>Status:</strong> 
                        ${reportData.results.chromium?.suites?.[name] ? 
                            (reportData.results.chromium.suites[name].failed > 0 ? 
                                '<span class="failed">Failed</span>' : 
                                '<span class="passed">Passed</span>') : 
                            '<span class="skipped">Not Run</span>'
                        }
                    </p>
                </div>
            `).join('')}

            <h2>Environment</h2>
            <div class="suite">
                <p><strong>Node Version:</strong> ${reportData.environment.node}</p>
                <p><strong>Platform:</strong> ${reportData.environment.platform}</p>
                <p><strong>Architecture:</strong> ${reportData.environment.arch}</p>
                <p><strong>CI Environment:</strong> ${reportData.environment.ci ? 'Yes' : 'No'}</p>
                <p><strong>Generated:</strong> ${new Date(reportData.summary.timestamp).toLocaleString()}</p>
            </div>
        </body>
        </html>`;

        const htmlPath = path.join(__dirname, '../../test-results/e2e/comprehensive-report.html');
        fs.writeFileSync(htmlPath, htmlTemplate);
        console.log(`📄 HTML report saved to: ${htmlPath}`);
    }

    async analyzePerformance() {
        console.log('⚡ Analyzing performance metrics...');
        
        // Look for performance data in test results
        const performanceDataPath = path.join(__dirname, '../../test-results/e2e/performance-metrics.json');
        
        if (fs.existsSync(performanceDataPath)) {
            const performanceData = JSON.parse(fs.readFileSync(performanceDataPath, 'utf8'));
            
            console.log('📊 Performance Summary:');
            console.log(`  Average Load Time: ${performanceData.averageLoadTime || 'N/A'}ms`);
            console.log(`  Slowest Page: ${performanceData.slowestPage || 'N/A'}`);
            console.log(`  Memory Usage: ${performanceData.memoryUsage || 'N/A'}MB`);
        } else {
            console.log('  No performance data available');
        }
    }

    async analyzeCoverage() {
        console.log('📋 Analyzing test coverage...');
        
        // Placeholder for coverage analysis
        // This would integrate with your coverage tooling
        const coverageData = {
            statements: 0,
            branches: 0,
            functions: 0,
            lines: 0
        };

        console.log('📊 Coverage Summary:');
        console.log(`  Statements: ${coverageData.statements}%`);
        console.log(`  Branches: ${coverageData.branches}%`);
        console.log(`  Functions: ${coverageData.functions}%`);
        console.log(`  Lines: ${coverageData.lines}%`);
    }

    async getCoverageData() {
        // Placeholder for coverage data retrieval
        return {
            statements: { covered: 0, total: 0, percentage: 0 },
            branches: { covered: 0, total: 0, percentage: 0 },
            functions: { covered: 0, total: 0, percentage: 0 },
            lines: { covered: 0, total: 0, percentage: 0 }
        };
    }

    async getPerformanceData() {
        // Placeholder for performance data retrieval
        return {
            averageLoadTime: 0,
            slowestPage: '',
            memoryUsage: 0,
            networkRequests: 0
        };
    }

    async startApplicationServer() {
        return new Promise((resolve, reject) => {
            console.log('🚀 Starting application server...');
            
            const server = spawn('npm', ['run', 'dev'], {
                cwd: path.join(__dirname, '../..'),
                stdio: 'pipe'
            });

            let started = false;
            const timeout = setTimeout(() => {
                if (!started) {
                    server.kill();
                    reject(new Error('Server startup timeout'));
                }
            }, 30000); // 30 second timeout

            server.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('localhost:3000') || output.includes('ready')) {
                    started = true;
                    clearTimeout(timeout);
                    console.log('✅ Application server started');
                    // Give server a moment to fully initialize
                    setTimeout(resolve, 2000);
                }
            });

            server.stderr.on('data', (data) => {
                console.error('Server error:', data.toString());
            });

            server.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    printSummary() {
        console.log('');
        console.log('📋 Test Execution Summary');
        console.log('=========================');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⏭️  Skipped: ${this.results.skipped}`);
        console.log(`⏱️  Duration: ${this.formatDuration(this.results.duration)}`);
        console.log(`📊 Pass Rate: ${this.results.total > 0 ? (this.results.passed / this.results.total * 100).toFixed(2) : 0}%`);

        if (this.results.errors.length > 0) {
            console.log('');
            console.log('❌ Errors:');
            this.results.errors.forEach(error => console.log(`  - ${error}`));
        }

        const status = this.results.failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED';
        console.log('');
        console.log(status);
        console.log('=========================');
    }

    async saveResults() {
        const resultsPath = path.join(__dirname, '../../test-results/e2e/test-execution-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
        console.log(`💾 Results saved to: ${resultsPath}`);
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const options = {};

    // Parse CLI arguments
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--suites':
                options.suites = args[++i]?.split(',') || 'all';
                break;
            case '--browsers':
                options.browsers = args[++i]?.split(',') || ['chromium'];
                break;
            case '--priority':
                options.priority = args[++i] || 'all';
                break;
            case '--headed':
                options.headed = true;
                break;
            case '--debug':
                options.debug = true;
                break;
            case '--update':
                options.update = true;
                break;
            case '--sequential':
                options.parallel = false;
                break;
            case '--max-failures':
                options.maxFailures = parseInt(args[++i]) || 10;
                break;
            case '--help':
                printHelp();
                process.exit(0);
                break;
        }
    }

    const runner = new ComprehensiveE2ERunner();
    const results = await runner.run(options);
    
    // Exit with non-zero code if tests failed
    process.exit(results.failed > 0 ? 1 : 0);
}

function printHelp() {
    console.log(`
Comprehensive E2E Test Runner

Usage: node comprehensive-test-runner.js [options]

Options:
  --suites <names>        Comma-separated list of test suites to run (default: all)
  --browsers <names>      Comma-separated list of browsers (default: chromium)
  --priority <level>      Run tests by priority: critical, high, medium, all (default: all)
  --headed               Run tests in headed mode
  --debug                Run tests in debug mode
  --update               Update snapshots
  --sequential           Run tests sequentially instead of parallel
  --max-failures <n>     Stop after n failures (default: 10)
  --help                 Show this help message

Examples:
  node comprehensive-test-runner.js --suites authentication,navigation --browsers chromium,firefox
  node comprehensive-test-runner.js --priority critical --headed
  node comprehensive-test-runner.js --debug --sequential
    `);
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = ComprehensiveE2ERunner;