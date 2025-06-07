#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate Browser Compatibility Matrix from Playwright test results
 */

const RESULTS_FILE = 'test-results/results.json';
const OUTPUT_FILE = 'BROWSER_COMPATIBILITY_MATRIX.md';

// Browser configurations from playwright.config.ts
const BROWSERS = {
    'chromium': { name: 'Chrome', icon: '🟢' },
    'firefox': { name: 'Firefox', icon: '🟠' },
    'webkit': { name: 'Safari', icon: '🔵' },
    'Mobile Chrome': { name: 'Mobile Chrome', icon: '📱' },
    'Mobile Safari': { name: 'Mobile Safari', icon: '📱' },
    'Microsoft Edge': { name: 'Edge', icon: '🟦' },
    'Google Chrome': { name: 'Chrome (Branded)', icon: '🟢' }
};

function generateMatrix() {
    console.log('🔍 Generating Browser Compatibility Matrix...');
    
    let results = {};
    
    // Try to read test results
    if (fs.existsSync(RESULTS_FILE)) {
        try {
            const rawData = fs.readFileSync(RESULTS_FILE, 'utf8');
            const testResults = JSON.parse(rawData);
            results = processTestResults(testResults);
        } catch (error) {
            console.warn('⚠️  Could not parse test results:', error.message);
            results = generateFallbackMatrix();
        }
    } else {
        console.warn('⚠️  Test results file not found. Generating template matrix.');
        results = generateFallbackMatrix();
    }
    
    const markdown = generateMarkdown(results);
    
    fs.writeFileSync(OUTPUT_FILE, markdown);
    console.log(`✅ Browser compatibility matrix generated: ${OUTPUT_FILE}`);
}

function processTestResults(testResults) {
    const matrix = {};
    
    if (testResults.suites) {
        testResults.suites.forEach(suite => {
            processSuite(suite, matrix);
        });
    }
    
    return matrix;
}

function processSuite(suite, matrix) {
    if (suite.specs) {
        suite.specs.forEach(spec => {
            const testName = spec.title;
            
            if (!matrix[testName]) {
                matrix[testName] = {};
            }
            
            spec.tests.forEach(test => {
                const projectName = test.projectName || 'unknown';
                const status = test.results && test.results.length > 0 
                    ? test.results[0].status 
                    : 'unknown';
                
                matrix[testName][projectName] = {
                    status: status,
                    duration: test.results && test.results.length > 0 
                        ? test.results[0].duration 
                        : 0
                };
            });
        });
    }
    
    if (suite.suites) {
        suite.suites.forEach(subSuite => {
            processSuite(subSuite, matrix);
        });
    }
}

function generateFallbackMatrix() {
    const testFiles = [
        'Landing Page Tests',
        'Authentication Flow Tests', 
        'Navigation and Routing Tests',
        'Testing Features Tests'
    ];
    
    const matrix = {};
    
    testFiles.forEach(testFile => {
        matrix[testFile] = {};
        Object.keys(BROWSERS).forEach(browser => {
            matrix[testFile][browser] = {
                status: 'unknown',
                duration: 0
            };
        });
    });
    
    return matrix;
}

function generateMarkdown(results) {
    const timestamp = new Date().toISOString();
    
    let markdown = `# Browser Compatibility Matrix

*Generated on: ${timestamp}*

## Overview

This matrix shows the compatibility status of our Next.js application across different browsers and devices.

## Legend

- ✅ **Passed**: All tests passed successfully
- ❌ **Failed**: One or more tests failed
- ⚠️ **Flaky**: Tests passed but with warnings or intermittent issues
- ❓ **Unknown**: Tests not run or results unavailable
- ⏭️ **Skipped**: Tests were skipped for this browser

## Compatibility Matrix

| Test Suite | ${Object.values(BROWSERS).map(b => `${b.icon} ${b.name}`).join(' | ')} |
|------------|${Object.keys(BROWSERS).map(() => '--------').join('|')}|
`;

    Object.keys(results).forEach(testName => {
        const row = [testName];
        
        Object.keys(BROWSERS).forEach(browserKey => {
            const result = results[testName][browserKey];
            let status = '❓';
            
            if (result) {
                switch (result.status) {
                    case 'passed':
                        status = '✅';
                        break;
                    case 'failed':
                        status = '❌';
                        break;
                    case 'skipped':
                        status = '⏭️';
                        break;
                    case 'timedOut':
                        status = '⏰';
                        break;
                    default:
                        status = '❓';
                }
            }
            
            row.push(status);
        });
        
        markdown += `| ${row.join(' | ')} |\n`;
    });

    markdown += `
## Test Details

### Browser Versions Tested
- **Chrome**: Latest stable version
- **Firefox**: Latest stable version  
- **Safari**: Latest stable version (WebKit)
- **Mobile Chrome**: Android Chrome on Pixel 5 simulation
- **Mobile Safari**: iOS Safari on iPhone 12 simulation
- **Edge**: Latest stable version

### Test Categories

1. **Landing Page Tests**: Core functionality of the main landing page
2. **Authentication Flow Tests**: Login, signup, and OAuth functionality
3. **Navigation and Routing Tests**: Page navigation, routing, and URL handling
4. **Testing Features Tests**: UI components and interactive elements

### Known Issues

${generateKnownIssues(results)}

### Performance Notes

${generatePerformanceNotes(results)}

## Running Tests Locally

\`\`\`bash
# Install dependencies
bun install

# Install Playwright browsers
bun run playwright:install

# Run all browser tests
bun run test:browsers

# Run specific browser tests
bun run test:e2e --project=chromium
bun run test:e2e --project=firefox
bun run test:e2e --project=webkit

# Run mobile tests
bun run test:mobile

# Generate this matrix
bun run test:compatibility
\`\`\`

## CI/CD Integration

This matrix is automatically updated on every push to the main branch through our GitHub Actions workflow.

---
*Last updated: ${timestamp}*
`;

    return markdown;
}

function generateKnownIssues(results) {
    const issues = [];
    
    Object.keys(results).forEach(testName => {
        Object.keys(BROWSERS).forEach(browserKey => {
            const result = results[testName][browserKey];
            if (result && result.status === 'failed') {
                issues.push(`- **${BROWSERS[browserKey].name}**: ${testName} - Test failed`);
            }
        });
    });
    
    return issues.length > 0 
        ? issues.join('\n') 
        : '- No known issues at this time';
}

function generatePerformanceNotes(results) {
    const notes = [];
    
    Object.keys(results).forEach(testName => {
        Object.keys(BROWSERS).forEach(browserKey => {
            const result = results[testName][browserKey];
            if (result && result.duration > 5000) { // Tests taking longer than 5 seconds
                notes.push(`- **${BROWSERS[browserKey].name}**: ${testName} - Slow performance (${result.duration}ms)`);
            }
        });
    });
    
    return notes.length > 0 
        ? notes.join('\n') 
        : '- All tests completed within acceptable time limits';
}

// Run the generator
if (import.meta.url === `file://${process.argv[1]}`) {
    generateMatrix();
}

export { generateMatrix };
