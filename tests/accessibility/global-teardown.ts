/**
 * Global Teardown for Accessibility Testing
 * 
 * Cleans up accessibility testing environment and generates reports
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting accessibility testing environment teardown...');
  
  try {
    // Generate accessibility test summary
    const testResultsDir = 'test-results/accessibility';
    const summaryFile = path.join(testResultsDir, 'accessibility-summary.json');
    
    // Ensure results directory exists
    await fs.mkdir(testResultsDir, { recursive: true });
    
    // Check for test results
    let testResults = [];
    try {
      const resultsFile = path.join(testResultsDir, 'test-results.json');
      const resultsData = await fs.readFile(resultsFile, 'utf-8');
      testResults = JSON.parse(resultsData);
    } catch (error) {
      console.warn('⚠️  No test results found for summary generation');
    }
    
    // Generate summary statistics
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: testResults.length,
      passed: testResults.filter((test: any) => test.status === 'passed').length,
      failed: testResults.filter((test: any) => test.status === 'failed').length,
      skipped: testResults.filter((test: any) => test.status === 'skipped').length,
      duration: testResults.reduce((sum: number, test: any) => sum + (test.duration || 0), 0),
      violations: {
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0
      },
      wcagCriteria: {
        'WCAG 2.1 AA': {
          total: 0,
          passed: 0,
          failed: 0
        }
      },
      coverageAreas: {
        keyboard: { tested: false, passed: false },
        screenReader: { tested: false, passed: false },
        colorContrast: { tested: false, passed: false },
        focus: { tested: false, passed: false },
        aria: { tested: false, passed: false },
        forms: { tested: false, passed: false },
        landmarks: { tested: false, passed: false },
        headings: { tested: false, passed: false }
      }
    };
    
    // Analyze test results for detailed statistics
    testResults.forEach((test: any) => {
      if (test.annotations && test.annotations.length > 0) {
        test.annotations.forEach((annotation: any) => {
          if (annotation.type === 'accessibility-violation') {
            const violation = JSON.parse(annotation.description);
            switch (violation.impact) {
              case 'critical':
                summary.violations.critical++;
                break;
              case 'serious':
                summary.violations.serious++;
                break;
              case 'moderate':
                summary.violations.moderate++;
                break;
              case 'minor':
                summary.violations.minor++;
                break;
            }
          }
        });
      }
      
      // Analyze test titles to determine coverage areas
      const testTitle = test.title?.toLowerCase() || '';
      
      if (testTitle.includes('keyboard')) {
        summary.coverageAreas.keyboard.tested = true;
        if (test.status === 'passed') {
          summary.coverageAreas.keyboard.passed = true;
        }
      }
      
      if (testTitle.includes('screen reader') || testTitle.includes('sr-only')) {
        summary.coverageAreas.screenReader.tested = true;
        if (test.status === 'passed') {
          summary.coverageAreas.screenReader.passed = true;
        }
      }
      
      if (testTitle.includes('contrast') || testTitle.includes('color')) {
        summary.coverageAreas.colorContrast.tested = true;
        if (test.status === 'passed') {
          summary.coverageAreas.colorContrast.passed = true;
        }
      }
      
      if (testTitle.includes('focus')) {
        summary.coverageAreas.focus.tested = true;
        if (test.status === 'passed') {
          summary.coverageAreas.focus.passed = true;
        }
      }
      
      if (testTitle.includes('aria')) {
        summary.coverageAreas.aria.tested = true;
        if (test.status === 'passed') {
          summary.coverageAreas.aria.passed = true;
        }
      }
      
      if (testTitle.includes('form')) {
        summary.coverageAreas.forms.tested = true;
        if (test.status === 'passed') {
          summary.coverageAreas.forms.passed = true;
        }
      }
      
      if (testTitle.includes('landmark') || testTitle.includes('region')) {
        summary.coverageAreas.landmarks.tested = true;
        if (test.status === 'passed') {
          summary.coverageAreas.landmarks.passed = true;
        }
      }
      
      if (testTitle.includes('heading') || testTitle.includes('h1') || testTitle.includes('h2')) {
        summary.coverageAreas.headings.tested = true;
        if (test.status === 'passed') {
          summary.coverageAreas.headings.passed = true;
        }
      }
    });
    
    // Calculate WCAG compliance
    summary.wcagCriteria['WCAG 2.1 AA'].total = summary.totalTests;
    summary.wcagCriteria['WCAG 2.1 AA'].passed = summary.passed;
    summary.wcagCriteria['WCAG 2.1 AA'].failed = summary.failed;
    
    // Save summary
    await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📊 Accessibility test summary saved to ${summaryFile}`);
    
    // Generate human-readable report
    const reportFile = path.join(testResultsDir, 'accessibility-report.md');
    const report = generateMarkdownReport(summary);
    await fs.writeFile(reportFile, report);
    console.log(`📋 Accessibility report saved to ${reportFile}`);
    
    // Log summary to console
    console.log('\n🎯 Accessibility Testing Summary:');
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   Passed: ${summary.passed} (${Math.round((summary.passed / summary.totalTests) * 100)}%)`);
    console.log(`   Failed: ${summary.failed} (${Math.round((summary.failed / summary.totalTests) * 100)}%)`);
    console.log(`   Duration: ${Math.round(summary.duration / 1000)}s`);
    
    if (summary.violations.critical > 0 || summary.violations.serious > 0) {
      console.log('\n❌ Critical Accessibility Issues Found:');
      console.log(`   Critical: ${summary.violations.critical}`);
      console.log(`   Serious: ${summary.violations.serious}`);
      console.log(`   Moderate: ${summary.violations.moderate}`);
      console.log(`   Minor: ${summary.violations.minor}`);
    } else {
      console.log('\n✅ No critical accessibility issues found');
    }
    
    // Log coverage areas
    console.log('\n📊 Coverage Areas:');
    Object.entries(summary.coverageAreas).forEach(([area, coverage]) => {
      const status = coverage.tested 
        ? (coverage.passed ? '✅' : '❌') 
        : '⏭️ ';
      console.log(`   ${status} ${area}: ${coverage.tested ? 'tested' : 'not tested'}`);
    });
    
    console.log('\n🏁 Accessibility testing environment teardown complete');
    
  } catch (error) {
    console.error('❌ Failed during accessibility testing teardown:', error);
    // Don't throw error to avoid masking test failures
  }
}

function generateMarkdownReport(summary: any): string {
  const date = new Date(summary.timestamp).toLocaleDateString();
  const time = new Date(summary.timestamp).toLocaleTimeString();
  
  return `# Accessibility Test Report

**Generated:** ${date} at ${time}

## Summary

- **Total Tests:** ${summary.totalTests}
- **Passed:** ${summary.passed} (${Math.round((summary.passed / summary.totalTests) * 100)}%)
- **Failed:** ${summary.failed} (${Math.round((summary.failed / summary.totalTests) * 100)}%)
- **Skipped:** ${summary.skipped}
- **Duration:** ${Math.round(summary.duration / 1000)}s

## WCAG 2.1 AA Compliance

- **Total Criteria Tested:** ${summary.wcagCriteria['WCAG 2.1 AA'].total}
- **Passed:** ${summary.wcagCriteria['WCAG 2.1 AA'].passed}
- **Failed:** ${summary.wcagCriteria['WCAG 2.1 AA'].failed}
- **Compliance Rate:** ${Math.round((summary.wcagCriteria['WCAG 2.1 AA'].passed / summary.wcagCriteria['WCAG 2.1 AA'].total) * 100)}%

## Accessibility Violations

| Severity | Count |
|----------|-------|
| Critical | ${summary.violations.critical} |
| Serious  | ${summary.violations.serious} |
| Moderate | ${summary.violations.moderate} |
| Minor    | ${summary.violations.minor} |

## Coverage Areas

| Area | Status | Result |
|------|--------|--------|
| Keyboard Navigation | ${summary.coverageAreas.keyboard.tested ? '✅ Tested' : '⏭️  Not Tested'} | ${summary.coverageAreas.keyboard.passed ? '✅ Passed' : '❌ Failed'} |
| Screen Reader | ${summary.coverageAreas.screenReader.tested ? '✅ Tested' : '⏭️  Not Tested'} | ${summary.coverageAreas.screenReader.passed ? '✅ Passed' : '❌ Failed'} |
| Color Contrast | ${summary.coverageAreas.colorContrast.tested ? '✅ Tested' : '⏭️  Not Tested'} | ${summary.coverageAreas.colorContrast.passed ? '✅ Passed' : '❌ Failed'} |
| Focus Management | ${summary.coverageAreas.focus.tested ? '✅ Tested' : '⏭️  Not Tested'} | ${summary.coverageAreas.focus.passed ? '✅ Passed' : '❌ Failed'} |
| ARIA Attributes | ${summary.coverageAreas.aria.tested ? '✅ Tested' : '⏭️  Not Tested'} | ${summary.coverageAreas.aria.passed ? '✅ Passed' : '❌ Failed'} |
| Form Accessibility | ${summary.coverageAreas.forms.tested ? '✅ Tested' : '⏭️  Not Tested'} | ${summary.coverageAreas.forms.passed ? '✅ Passed' : '❌ Failed'} |
| Landmarks | ${summary.coverageAreas.landmarks.tested ? '✅ Tested' : '⏭️  Not Tested'} | ${summary.coverageAreas.landmarks.passed ? '✅ Passed' : '❌ Failed'} |
| Heading Structure | ${summary.coverageAreas.headings.tested ? '✅ Tested' : '⏭️  Not Tested'} | ${summary.coverageAreas.headings.passed ? '✅ Passed' : '❌ Failed'} |

## Recommendations

${summary.violations.critical > 0 ? '🔴 **Critical Issues:** Address critical accessibility violations immediately as they prevent users from accessing content.' : ''}

${summary.violations.serious > 0 ? '🟡 **Serious Issues:** Address serious accessibility violations to improve user experience for assistive technology users.' : ''}

${summary.failed > 0 ? '📝 **Failed Tests:** Review failed test cases and implement necessary accessibility improvements.' : ''}

${!summary.coverageAreas.keyboard.tested ? '⌨️  **Keyboard Testing:** Implement keyboard navigation testing to ensure full keyboard accessibility.' : ''}

${!summary.coverageAreas.screenReader.tested ? '🔊 **Screen Reader Testing:** Add screen reader compatibility testing for better assistive technology support.' : ''}

${!summary.coverageAreas.colorContrast.tested ? '🎨 **Color Contrast Testing:** Implement color contrast testing to ensure WCAG AA compliance.' : ''}

---

*This report was automatically generated by the accessibility testing suite.*
`;
}

export default globalTeardown;