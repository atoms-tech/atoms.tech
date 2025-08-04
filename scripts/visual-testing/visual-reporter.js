/**
 * Visual Testing Reporter
 * Custom Playwright reporter for visual regression testing
 */

import fs from 'fs';
import path from 'path';

class VisualReporter {
  constructor(options = {}) {
    this.outputDir = options.outputDir || 'test-results/visual-reports';
    this.includeImages = options.includeImages !== false;
    this.generateSummary = options.generateSummary !== false;
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    this.startTime = Date.now();
    this.results = {
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0,
      },
      browserResults: {},
      testResults: [],
      visualDiffs: [],
      errors: [],
    };
  }

  onBegin(config, suite) {
    console.log('🎨 Starting Visual Regression Testing...');
    console.log(`📊 Running ${suite.allTests().length} tests across ${config.projects.length} browsers`);
    
    this.config = config;
    this.suite = suite;
    
    // Initialize browser results
    config.projects.forEach(project => {
      this.results.browserResults[project.name] = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0,
        duration: 0,
      };
    });
  }

  onTestBegin(test, result) {
    const browserName = test.parent.project().name;
    this.results.browserResults[browserName].total++;
    this.results.summary.total++;
  }

  onTestEnd(test, result) {
    const browserName = test.parent.project().name;
    const browserResults = this.results.browserResults[browserName];
    
    // Update browser-specific counts
    browserResults[result.status]++;
    browserResults.duration += result.duration;
    
    // Update summary counts
    this.results.summary[result.status]++;

    // Collect test result details
    const testResult = {
      title: test.title,
      file: test.location.file,
      line: test.location.line,
      browser: browserName,
      status: result.status,
      duration: result.duration,
      retry: result.retry,
      errors: result.errors,
      attachments: result.attachments,
    };

    // Process visual test specific data
    if (test.title.includes('visual') || test.location.file.includes('visual')) {
      testResult.isVisual = true;
      
      // Extract screenshot information
      const screenshots = result.attachments.filter(att => 
        att.contentType === 'image/png' || att.name.includes('screenshot')
      );
      
      if (screenshots.length > 0) {
        testResult.screenshots = screenshots.map(screenshot => ({
          name: screenshot.name,
          path: screenshot.path,
          body: this.includeImages ? screenshot.body : null,
        }));
      }

      // Extract diff information for failed visual tests
      if (result.status === 'failed') {
        const diffImages = result.attachments.filter(att => 
          att.name.includes('diff') || att.name.includes('actual') || att.name.includes('expected')
        );
        
        if (diffImages.length > 0) {
          const visualDiff = {
            testTitle: test.title,
            browser: browserName,
            file: test.location.file,
            images: diffImages.map(img => ({
              type: this.extractImageType(img.name),
              name: img.name,
              path: img.path,
              body: this.includeImages ? img.body : null,
            })),
            error: result.errors[0]?.message || 'Visual regression detected',
          };
          
          this.results.visualDiffs.push(visualDiff);
        }
      }
    }

    // Collect errors
    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        this.results.errors.push({
          test: test.title,
          browser: browserName,
          file: test.location.file,
          message: error.message,
          stack: error.stack,
        });
      });
    }

    this.results.testResults.push(testResult);
  }

  onEnd(result) {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    console.log('\n🎨 Visual Regression Testing Complete!');
    console.log(`⏱️  Total Duration: ${this.formatDuration(duration)}`);
    
    // Print summary
    this.printSummary();
    
    // Generate reports
    this.generateJsonReport(duration);
    if (this.generateSummary) {
      this.generateHtmlReport(duration);
      this.generateMarkdownReport(duration);
    }
    
    // Print file locations
    console.log('\n📁 Reports generated:');
    console.log(`   📊 JSON: ${path.join(this.outputDir, 'visual-test-results.json')}`);
    if (this.generateSummary) {
      console.log(`   🌐 HTML: ${path.join(this.outputDir, 'visual-test-report.html')}`);
      console.log(`   📝 MD: ${path.join(this.outputDir, 'visual-test-summary.md')}`);
    }
  }

  printSummary() {
    const { summary, browserResults } = this.results;
    
    console.log('\n📊 Test Summary:');
    console.log(`   ✅ Passed: ${summary.passed}`);
    console.log(`   ❌ Failed: ${summary.failed}`);
    console.log(`   ⏭️  Skipped: ${summary.skipped}`);
    console.log(`   🔄 Flaky: ${summary.flaky}`);
    console.log(`   📊 Total: ${summary.total}`);

    console.log('\n🌐 Browser Results:');
    Object.entries(browserResults).forEach(([browser, results]) => {
      const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
      console.log(`   ${browser}: ${results.passed}/${results.total} (${passRate}%) - ${this.formatDuration(results.duration)}`);
    });

    if (this.results.visualDiffs.length > 0) {
      console.log(`\n🔍 Visual Differences Found: ${this.results.visualDiffs.length}`);
      this.results.visualDiffs.forEach((diff, index) => {
        console.log(`   ${index + 1}. ${diff.testTitle} (${diff.browser})`);
      });
    }
  }

  generateJsonReport(duration) {
    const report = {
      timestamp: new Date().toISOString(),
      duration,
      config: {
        projects: this.config.projects.map(p => p.name),
        reporter: 'visual-reporter',
        threshold: this.config.expect?.toHaveScreenshot?.threshold || 0.2,
      },
      summary: this.results.summary,
      browserResults: this.results.browserResults,
      testResults: this.results.testResults,
      visualDiffs: this.results.visualDiffs,
      errors: this.results.errors,
    };

    const outputPath = path.join(this.outputDir, 'visual-test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  }

  generateHtmlReport(duration) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Regression Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card.passed { border-left: 4px solid #28a745; }
        .summary-card.failed { border-left: 4px solid #dc3545; }
        .summary-card.skipped { border-left: 4px solid #ffc107; }
        .summary-card h3 { margin: 0 0 10px 0; font-size: 24px; }
        .browser-results { margin-bottom: 30px; }
        .browser-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .browser-card { background: #f8f9fa; padding: 15px; border-radius: 8px; }
        .progress-bar { width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; margin: 10px 0; }
        .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
        .progress-fill.passed { background: #28a745; }
        .visual-diffs { margin-bottom: 30px; }
        .diff-card { background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 20px; margin-bottom: 15px; }
        .diff-images { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
        .diff-image { text-align: center; }
        .diff-image img { max-width: 100%; border-radius: 4px; border: 1px solid #ddd; }
        .test-results { margin-bottom: 30px; }
        .test-table { width: 100%; border-collapse: collapse; }
        .test-table th, .test-table td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        .test-table th { background: #f8f9fa; font-weight: 600; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .status.passed { background: #d4edda; color: #155724; }
        .status.failed { background: #f8d7da; color: #721c24; }
        .status.skipped { background: #fff3cd; color: #856404; }
        .footer { text-align: center; margin-top: 30px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 Visual Regression Test Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Duration: ${this.formatDuration(duration)}</p>
        </div>

        <div class="summary">
            <div class="summary-card passed">
                <h3>${this.results.summary.passed}</h3>
                <p>Passed</p>
            </div>
            <div class="summary-card failed">
                <h3>${this.results.summary.failed}</h3>
                <p>Failed</p>
            </div>
            <div class="summary-card skipped">
                <h3>${this.results.summary.skipped}</h3>
                <p>Skipped</p>
            </div>
            <div class="summary-card">
                <h3>${this.results.summary.total}</h3>
                <p>Total Tests</p>
            </div>
        </div>

        <div class="browser-results">
            <h2>🌐 Browser Results</h2>
            <div class="browser-grid">
                ${Object.entries(this.results.browserResults).map(([browser, results]) => {
                  const passRate = results.total > 0 ? ((results.passed / results.total) * 100) : 0;
                  return `
                    <div class="browser-card">
                        <h4>${browser}</h4>
                        <p>${results.passed}/${results.total} tests passed</p>
                        <div class="progress-bar">
                            <div class="progress-fill passed" style="width: ${passRate}%"></div>
                        </div>
                        <small>${passRate.toFixed(1)}% success rate</small>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>

        ${this.results.visualDiffs.length > 0 ? `
        <div class="visual-diffs">
            <h2>🔍 Visual Differences (${this.results.visualDiffs.length})</h2>
            ${this.results.visualDiffs.map((diff, index) => `
                <div class="diff-card">
                    <h4>${diff.testTitle}</h4>
                    <p><strong>Browser:</strong> ${diff.browser}</p>
                    <p><strong>File:</strong> ${diff.file}</p>
                    <p><strong>Error:</strong> ${diff.error}</p>
                    ${diff.images.length > 0 ? `
                    <div class="diff-images">
                        ${diff.images.map(img => `
                            <div class="diff-image">
                                <h5>${img.type}</h5>
                                ${img.body ? `<img src="data:image/png;base64,${img.body.toString('base64')}" alt="${img.name}">` : `<p>Image: ${img.name}</p>`}
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="test-results">
            <h2>📋 Test Results</h2>
            <table class="test-table">
                <thead>
                    <tr>
                        <th>Test</th>
                        <th>Browser</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>File</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.results.testResults.map(test => `
                        <tr>
                            <td>${test.title}</td>
                            <td>${test.browser}</td>
                            <td><span class="status ${test.status}">${test.status}</span></td>
                            <td>${this.formatDuration(test.duration)}</td>
                            <td>${path.basename(test.file)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>Generated by Visual Regression Testing Reporter</p>
        </div>
    </div>
</body>
</html>
    `;

    const outputPath = path.join(this.outputDir, 'visual-test-report.html');
    fs.writeFileSync(outputPath, html);
  }

  generateMarkdownReport(duration) {
    const passRate = this.results.summary.total > 0 ? 
      ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1) : 0;

    const markdown = `
# 🎨 Visual Regression Test Report

**Generated:** ${new Date().toLocaleString()}  
**Duration:** ${this.formatDuration(duration)}  
**Overall Pass Rate:** ${passRate}%

## 📊 Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Passed | ${this.results.summary.passed} | ${(this.results.summary.passed / this.results.summary.total * 100).toFixed(1)}% |
| ❌ Failed | ${this.results.summary.failed} | ${(this.results.summary.failed / this.results.summary.total * 100).toFixed(1)}% |
| ⏭️ Skipped | ${this.results.summary.skipped} | ${(this.results.summary.skipped / this.results.summary.total * 100).toFixed(1)}% |
| 🔄 Flaky | ${this.results.summary.flaky} | ${(this.results.summary.flaky / this.results.summary.total * 100).toFixed(1)}% |
| **Total** | **${this.results.summary.total}** | **100%** |

## 🌐 Browser Results

${Object.entries(this.results.browserResults).map(([browser, results]) => {
  const browserPassRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
  return `### ${browser}
- **Tests:** ${results.passed}/${results.total} passed (${browserPassRate}%)
- **Duration:** ${this.formatDuration(results.duration)}
- **Status:** ${results.failed > 0 ? '❌ Has Failures' : '✅ All Passed'}`;
}).join('\n\n')}

${this.results.visualDiffs.length > 0 ? `
## 🔍 Visual Differences (${this.results.visualDiffs.length})

${this.results.visualDiffs.map((diff, index) => `
### ${index + 1}. ${diff.testTitle}

- **Browser:** ${diff.browser}
- **File:** \`${diff.file}\`
- **Error:** ${diff.error}
${diff.images.length > 0 ? `- **Images:** ${diff.images.map(img => img.type).join(', ')}` : ''}
`).join('\n')}
` : ''}

${this.results.errors.length > 0 ? `
## ❌ Errors (${this.results.errors.length})

${this.results.errors.map((error, index) => `
### ${index + 1}. ${error.test}

- **Browser:** ${error.browser}
- **File:** \`${error.file}\`
- **Message:** ${error.message}
`).join('\n')}
` : ''}

## 📈 Recommendations

${this.generateRecommendations()}

---
*Report generated by Visual Regression Testing Reporter*
    `;

    const outputPath = path.join(this.outputDir, 'visual-test-summary.md');
    fs.writeFileSync(outputPath, markdown.trim());
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.summary.failed > 0) {
      recommendations.push('🔧 **Fix failing tests:** Review visual differences and update baselines if changes are intentional');
    }
    
    if (this.results.visualDiffs.length > 0) {
      recommendations.push('👀 **Review visual changes:** Carefully examine diff images to ensure UI changes are expected');
    }
    
    const totalDuration = Object.values(this.results.browserResults).reduce((sum, browser) => sum + browser.duration, 0);
    if (totalDuration > 300000) { // 5 minutes
      recommendations.push('⚡ **Optimize test performance:** Consider reducing test scope or parallelization for faster feedback');
    }
    
    const browserFailures = Object.entries(this.results.browserResults)
      .filter(([_, results]) => results.failed > 0)
      .map(([browser, _]) => browser);
    
    if (browserFailures.length > 0) {
      recommendations.push(`🌐 **Browser-specific issues:** Focus on ${browserFailures.join(', ')} compatibility`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('🎉 **Great job!** All visual tests are passing across all browsers');
    }
    
    return recommendations.map(rec => `- ${rec}`).join('\n');
  }

  extractImageType(filename) {
    if (filename.includes('actual')) return 'Actual';
    if (filename.includes('expected')) return 'Expected';
    if (filename.includes('diff')) return 'Difference';
    return 'Screenshot';
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }
}

export default VisualReporter;