#!/usr/bin/env node

/**
 * Comprehensive E2E Test Runner
 * 
 * Runs all E2E tests with proper setup, teardown, and reporting
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test suites to run
const testSuites = [
    'auth.spec.ts',
    'home-page.spec.ts',
    'navigation.spec.ts',
    'document-management-workflow.spec.ts',
    'settings-workflow.spec.ts',
    'mobile-workflow.spec.ts',
    'api-integration-workflow.spec.ts',
    'cross-browser.spec.ts',
    'integration.spec.ts'
];

// Browser configurations
const browsers = [
    'chromium',
    'firefox',
    'webkit',
    'Mobile Chrome',
    'Mobile Safari'
];

// Test configuration
const config = {
    headless: process.env.CI === 'true',
    workers: process.env.CI ? 1 : 2,
    retries: process.env.CI ? 2 : 0,
    timeout: 30000,
    outputDir: 'test-results/e2e',
    reportDir: 'test-results/playwright-report'
};

async function runTests() {
    console.log('🚀 Starting Comprehensive E2E Test Suite...\n');
    
    // Create results directory
    const resultsDir = path.join(__dirname, '../../test-results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // Run tests for each browser
    for (const browser of browsers) {
        console.log(`\n🌐 Running tests on ${browser}...`);
        
        const args = [
            'test',
            '--project', browser,
            '--output-dir', config.outputDir,
            '--timeout', config.timeout.toString(),
            '--workers', config.workers.toString(),
            '--retries', config.retries.toString()
        ];
        
        if (config.headless) {
            args.push('--headed');
        }
        
        // Add test files
        testSuites.forEach(suite => {
            args.push(path.join(__dirname, suite));
        });
        
        try {
            await runPlaywrightTest(args);
            console.log(`✅ ${browser} tests completed successfully`);
        } catch (error) {
            console.error(`❌ ${browser} tests failed:`, error.message);
            process.exit(1);
        }
    }
    
    console.log('\n🎉 All E2E tests completed successfully!');
    console.log(`📊 Test results available at: ${config.reportDir}`);
    console.log(`📁 Test artifacts saved to: ${config.outputDir}`);
}

function runPlaywrightTest(args) {
    return new Promise((resolve, reject) => {
        const playwright = spawn('npx', ['playwright', ...args], {
            stdio: 'inherit',
            shell: true
        });
        
        playwright.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Playwright exited with code ${code}`));
            }
        });
        
        playwright.on('error', (error) => {
            reject(error);
        });
    });
}

// Check if required dependencies are installed
function checkDependencies() {
    const requiredDeps = [
        '@playwright/test',
        'playwright'
    ];
    
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
    const installedDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };
    
    const missing = requiredDeps.filter(dep => !installedDeps[dep]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required dependencies:');
        missing.forEach(dep => console.error(`  - ${dep}`));
        console.error('\nPlease install missing dependencies:');
        console.error(`npm install ${missing.join(' ')}`);
        process.exit(1);
    }
}

// Main execution
async function main() {
    try {
        checkDependencies();
        await runTests();
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { runTests };