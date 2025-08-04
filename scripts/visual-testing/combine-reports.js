#!/usr/bin/env node

/**
 * Visual Test Report Combiner
 * 
 * Combines visual test results from multiple browsers into a single report
 */

const fs = require('fs');
const path = require('path');

const TEST_RESULTS_DIR = path.join(__dirname, '../../test-results');
const COMBINED_REPORT_DIR = path.join(TEST_RESULTS_DIR, 'combined-report');

console.log('📊 Combining Visual Test Reports');
console.log('===============================');

// Ensure output directory exists
if (!fs.existsSync(COMBINED_REPORT_DIR)) {
    fs.mkdirSync(COMBINED_REPORT_DIR, { recursive: true });
}

// Find all visual test result files
const resultFiles = fs.readdirSync(TEST_RESULTS_DIR)
    .filter(file => file.startsWith('visual-test-results-'))
    .map(dir => path.join(TEST_RESULTS_DIR, dir, 'visual-results.json'))
    .filter(file => fs.existsSync(file));

console.log(`Found ${resultFiles.length} result files`);

if (resultFiles.length === 0) {
    console.log('No visual test results found');
    process.exit(0);
}

// Combine results
const combinedResults = {
    metadata: {
        combinedAt: new Date().toISOString(),
        totalBrowsers: resultFiles.length,
        browsers: [],
    },
    summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: 0,
    },
    browsers: [],
    categories: {
        'UI Components': { total: 0, passed: 0, failed: 0, skipped: 0 },
        'Custom Components': { total: 0, passed: 0, failed: 0, skipped: 0 },
        'Theme Variants': { total: 0, passed: 0, failed: 0, skipped: 0 },
        'Responsive Layouts': { total: 0, passed: 0, failed: 0, skipped: 0 },
        'Interactive States': { total: 0, passed: 0, failed: 0, skipped: 0 },
    },
    failures: [],
};

// Process each result file
resultFiles.forEach(file => {
    try {
        const result = JSON.parse(fs.readFileSync(file, 'utf8'));
        const browser = path.basename(path.dirname(file)).replace('visual-test-results-', '');
        
        combinedResults.metadata.browsers.push(browser);
        
        // Extract browser-specific data
        const browserData = {
            name: browser,
            tests: result.suites?.reduce((sum, suite) => sum + suite.tests.length, 0) || 0,
            passed: result.suites?.reduce((sum, suite) => 
                sum + suite.tests.filter(test => test.outcome === 'expected').length, 0) || 0,
            failed: result.suites?.reduce((sum, suite) => 
                sum + suite.tests.filter(test => test.outcome !== 'expected').length, 0) || 0,
            duration: result.stats?.duration || 0,
        };
        
        combinedResults.browsers.push(browserData);
        
        // Update summary
        combinedResults.summary.totalTests += browserData.tests;
        combinedResults.summary.passedTests += browserData.passed;
        combinedResults.summary.failedTests += browserData.failed;
        combinedResults.summary.duration += browserData.duration;
        
        // Process test suites for category breakdown
        if (result.suites) {
            result.suites.forEach(suite => {
                const category = getCategoryFromSuite(suite.title);
                if (category && combinedResults.categories[category]) {
                    combinedResults.categories[category].total += suite.tests.length;
                    combinedResults.categories[category].passed += suite.tests.filter(test => test.outcome === 'expected').length;
                    combinedResults.categories[category].failed += suite.tests.filter(test => test.outcome !== 'expected').length;
                }
                
                // Collect failures
                suite.tests.forEach(test => {
                    if (test.outcome !== 'expected') {
                        combinedResults.failures.push({
                            browser,
                            suite: suite.title,
                            test: test.title,
                            outcome: test.outcome,
                            error: test.results?.[0]?.error || 'Unknown error',
                        });
                    }
                });
            });
        }
        
        console.log(`✅ Processed ${browser}: ${browserData.tests} tests`);
        
    } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
    }
});

// Generate HTML report
const htmlReport = generateHTMLReport(combinedResults);
fs.writeFileSync(path.join(COMBINED_REPORT_DIR, 'index.html'), htmlReport);

// Generate JSON report
fs.writeFileSync(
    path.join(COMBINED_REPORT_DIR, 'combined-results.json'),
    JSON.stringify(combinedResults, null, 2)
);

// Generate markdown summary
const markdownSummary = generateMarkdownSummary(combinedResults);
fs.writeFileSync(path.join(COMBINED_REPORT_DIR, 'summary.md'), markdownSummary);

console.log('\n📊 Combined Report Summary');
console.log('=========================');
console.log(`Total Browsers: ${combinedResults.metadata.totalBrowsers}`);
console.log(`Total Tests: ${combinedResults.summary.totalTests}`);
console.log(`Passed: ${combinedResults.summary.passedTests}`);
console.log(`Failed: ${combinedResults.summary.failedTests}`);
console.log(`Duration: ${(combinedResults.summary.duration / 1000).toFixed(2)}s`);

if (combinedResults.failures.length > 0) {
    console.log('\n❌ Failures:');
    combinedResults.failures.forEach(failure => {
        console.log(`  ${failure.browser}: ${failure.suite} > ${failure.test}`);
    });
}

console.log(`\n📄 Reports generated in: ${COMBINED_REPORT_DIR}`);

// Helper functions
function getCategoryFromSuite(suiteTitle) {
    if (suiteTitle.includes('UI Components')) return 'UI Components';
    if (suiteTitle.includes('Custom Components')) return 'Custom Components';
    if (suiteTitle.includes('Theme Variants')) return 'Theme Variants';
    if (suiteTitle.includes('Responsive Layouts')) return 'Responsive Layouts';
    if (suiteTitle.includes('Interactive States')) return 'Interactive States';
    return null;
}

function generateHTMLReport(results) {
    const passRate = results.summary.totalTests > 0 
        ? (results.summary.passedTests / results.summary.totalTests * 100).toFixed(1)
        : 0;
    
    const statusColor = results.summary.failedTests === 0 ? '#22c55e' : '#ef4444';
    const statusText = results.summary.failedTests === 0 ? 'PASSED' : 'FAILED';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Regression Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8fafc;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 30px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        .status {
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: 600;
            color: white;
            background: ${statusColor};
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
        }
        .stat-label {
            font-size: 14px;
            color: #6b7280;
            margin-top: 5px;
        }
        .browsers {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .browser-card {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
        }
        .browser-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 10px;
            text-transform: capitalize;
        }
        .browser-stats {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .progress-bar {
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: #22c55e;
            transition: width 0.3s ease;
        }
        .categories {
            margin-bottom: 30px;
        }
        .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        .category-card {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .category-name {
            font-weight: 600;
            margin-bottom: 8px;
        }
        .category-stats {
            font-size: 14px;
            color: #6b7280;
        }
        .failures {
            margin-top: 30px;
        }
        .failure-item {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
        }
        .failure-title {
            font-weight: 600;
            color: #dc2626;
            margin-bottom: 5px;
        }
        .failure-details {
            font-size: 14px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Visual Regression Test Report</h1>
            <div class="status">${statusText}</div>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-value">${results.summary.totalTests}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${results.summary.passedTests}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${results.summary.failedTests}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${passRate}%</div>
                <div class="stat-label">Pass Rate</div>
            </div>
        </div>
        
        <h2>Browser Results</h2>
        <div class="browsers">
            ${results.browsers.map(browser => {
                const browserPassRate = browser.tests > 0 
                    ? (browser.passed / browser.tests * 100).toFixed(1)
                    : 0;
                return `
                <div class="browser-card">
                    <div class="browser-name">${browser.name}</div>
                    <div class="browser-stats">
                        <span>${browser.passed}/${browser.tests} passed</span>
                        <span>${browserPassRate}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${browserPassRate}%"></div>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
        
        <h2>Test Categories</h2>
        <div class="categories">
            <div class="category-grid">
                ${Object.entries(results.categories).map(([name, stats]) => `
                <div class="category-card">
                    <div class="category-name">${name}</div>
                    <div class="category-stats">
                        ${stats.passed}/${stats.total} passed
                        ${stats.failed > 0 ? `<span style="color: #dc2626;">(${stats.failed} failed)</span>` : ''}
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        
        ${results.failures.length > 0 ? `
        <h2>Failures</h2>
        <div class="failures">
            ${results.failures.map(failure => `
            <div class="failure-item">
                <div class="failure-title">${failure.browser}: ${failure.suite} > ${failure.test}</div>
                <div class="failure-details">${failure.error}</div>
            </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            Generated on ${new Date(results.metadata.combinedAt).toLocaleString()}
        </div>
    </div>
</body>
</html>
    `.trim();
}

function generateMarkdownSummary(results) {
    const passRate = results.summary.totalTests > 0 
        ? (results.summary.passedTests / results.summary.totalTests * 100).toFixed(1)
        : 0;
    
    const statusEmoji = results.summary.failedTests === 0 ? '✅' : '❌';
    
    return `
# Visual Regression Test Report ${statusEmoji}

**Generated:** ${new Date(results.metadata.combinedAt).toLocaleString()}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${results.summary.totalTests} |
| Passed | ${results.summary.passedTests} |
| Failed | ${results.summary.failedTests} |
| Pass Rate | ${passRate}% |
| Duration | ${(results.summary.duration / 1000).toFixed(2)}s |

## Browser Results

${results.browsers.map(browser => {
    const browserPassRate = browser.tests > 0 
        ? (browser.passed / browser.tests * 100).toFixed(1)
        : 0;
    return `- **${browser.name}**: ${browser.passed}/${browser.tests} passed (${browserPassRate}%)`;
}).join('\n')}

## Test Categories

${Object.entries(results.categories).map(([name, stats]) => {
    const categoryPassRate = stats.total > 0 
        ? (stats.passed / stats.total * 100).toFixed(1)
        : 0;
    return `- **${name}**: ${stats.passed}/${stats.total} passed (${categoryPassRate}%)`;
}).join('\n')}

${results.failures.length > 0 ? `
## Failures

${results.failures.map(failure => `
- **${failure.browser}**: ${failure.suite} > ${failure.test}
  - Error: ${failure.error}
`).join('\n')}
` : ''}

---

*This report was automatically generated by the Visual Regression Testing system.*
    `.trim();
}