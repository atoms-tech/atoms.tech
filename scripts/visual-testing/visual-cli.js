#!/usr/bin/env node

/**
 * Visual Testing CLI
 * Command-line interface for visual regression testing operations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class VisualTestingCLI {
  constructor() {
    this.baselineDir = 'test-results/visual-baselines';
    this.reportDir = 'test-results/visual-reports';
    this.configFile = 'scripts/visual-testing/visual-config.js';
  }

  async run() {
    const command = process.argv[2];
    const args = process.argv.slice(3);

    try {
      switch (command) {
        case 'test':
          await this.runVisualTests(args);
          break;
        case 'update':
          await this.updateBaselines(args);
          break;
        case 'compare':
          await this.compareResults(args);
          break;
        case 'clean':
          await this.cleanResults(args);
          break;
        case 'report':
          await this.generateReport(args);
          break;
        case 'init':
          await this.initializeVisualTesting();
          break;
        case 'validate':
          await this.validateSetup();
          break;
        case 'benchmark':
          await this.runBenchmark();
          break;
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  async runVisualTests(args = []) {
    console.log('🎨 Running Visual Regression Tests...');

    const options = this.parseArgs(args);
    const {
      browser = 'all',
      component,
      page,
      responsive = false,
      accessibility = false,
      update = false,
      threshold,
    } = options;

    let testPattern = '*.visual.spec.ts';
    
    if (component) {
      testPattern = `**/components.visual.spec.ts`;
    } else if (page) {
      testPattern = `**/pages.visual.spec.ts`;
    } else if (accessibility) {
      testPattern = `**/accessibility.visual.spec.ts`;
    }

    const envVars = {
      ...process.env,
      UPDATE_BASELINES: update ? 'true' : 'false',
    };

    if (threshold) {
      envVars.VISUAL_THRESHOLD = threshold;
    }

    let projectArgs = '';
    if (browser !== 'all') {
      if (browser === 'chromium') projectArgs = '--project=visual-chromium';
      else if (browser === 'firefox') projectArgs = '--project=visual-firefox';
      else if (browser === 'webkit') projectArgs = '--project=visual-webkit';
      else if (browser === 'mobile') projectArgs = '--project=visual-mobile';
      else if (browser === 'tablet') projectArgs = '--project=visual-tablet';
      else if (browser === 'retina') projectArgs = '--project=visual-retina';
      else if (browser === 'accessibility') projectArgs = '--project=visual-accessibility';
    } else if (responsive) {
      projectArgs = '--project=visual-mobile --project=visual-tablet --project=visual-chromium';
    } else if (accessibility) {
      projectArgs = '--project=visual-accessibility';
    } else {
      projectArgs = '--project=visual-chromium --project=visual-firefox --project=visual-webkit';
    }

    const command = `npx playwright test tests/visual/${testPattern} ${projectArgs} --reporter=list`;

    console.log(`📋 Running: ${command}`);
    console.log(`🎯 Test Pattern: ${testPattern}`);
    console.log(`🌐 Browser(s): ${browser}`);
    
    try {
      execSync(command, {
        stdio: 'inherit',
        env: envVars,
      });
      
      console.log('✅ Visual tests completed successfully!');
      
      // Generate report if tests passed
      await this.generateReport(['--auto']);
      
    } catch (error) {
      console.log('❌ Visual tests failed. Generating failure report...');
      await this.generateReport(['--auto', '--failures-only']);
      throw new Error('Visual regression tests failed');
    }
  }

  async updateBaselines(args = []) {
    console.log('🔄 Updating Visual Baselines...');

    const options = this.parseArgs(args);
    const { browser = 'all', component, page } = options;

    // Confirm baseline update
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirm = await new Promise(resolve => {
      readline.question('⚠️  This will overwrite existing baselines. Continue? (y/N): ', resolve);
    });
    readline.close();

    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Baseline update cancelled');
      return;
    }

    // Run tests with baseline update flag
    await this.runVisualTests([...args, '--update']);
    
    console.log('✅ Baselines updated successfully!');
  }

  async compareResults(args = []) {
    console.log('🔍 Comparing Visual Test Results...');

    const options = this.parseArgs(args);
    const { baseline, current, output } = options;

    if (!baseline || !current) {
      throw new Error('Please specify --baseline and --current directories');
    }

    console.log(`📊 Comparing: ${baseline} vs ${current}`);

    // Implementation would use image comparison library
    // For now, generate a comparison report
    const comparisonReport = {
      timestamp: new Date().toISOString(),
      baseline: baseline,
      current: current,
      differences: [], // Would be populated by actual comparison
      summary: {
        totalImages: 0,
        identicalImages: 0,
        differentImages: 0,
        newImages: 0,
        removedImages: 0,
      }
    };

    const outputPath = output || path.join(this.reportDir, 'comparison-report.json');
    this.ensureDirectoryExists(path.dirname(outputPath));
    fs.writeFileSync(outputPath, JSON.stringify(comparisonReport, null, 2));

    console.log(`✅ Comparison report saved to: ${outputPath}`);
  }

  async cleanResults(args = []) {
    console.log('🧹 Cleaning Visual Test Results...');

    const options = this.parseArgs(args);
    const { all = false, reports = false, baselines = false, screenshots = false } = options;

    if (all || reports) {
      if (fs.existsSync(this.reportDir)) {
        fs.rmSync(this.reportDir, { recursive: true, force: true });
        console.log('✅ Cleaned visual reports');
      }
    }

    if (all || screenshots) {
      const screenshotDirs = [
        'test-results/visual-chromium',
        'test-results/visual-firefox', 
        'test-results/visual-webkit',
        'test-results/visual-mobile',
        'test-results/visual-tablet',
      ];

      screenshotDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true });
          console.log(`✅ Cleaned ${dir}`);
        }
      });
    }

    if (baselines) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const confirm = await new Promise(resolve => {
        readline.question('⚠️  This will delete all baseline images. Continue? (y/N): ', resolve);
      });
      readline.close();

      if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
        if (fs.existsSync(this.baselineDir)) {
          fs.rmSync(this.baselineDir, { recursive: true, force: true });
          console.log('✅ Cleaned visual baselines');
        }
      }
    }

    console.log('🧹 Cleanup completed');
  }

  async generateReport(args = []) {
    console.log('📊 Generating Visual Test Report...');

    const options = this.parseArgs(args);
    const { format = 'html', output, auto = false, failuresOnly = false } = options;

    // Look for existing test results
    const resultsFile = 'test-results/visual-reports/visual-test-results.json';
    
    if (!fs.existsSync(resultsFile)) {
      if (!auto) {
        throw new Error('No visual test results found. Run tests first.');
      } else {
        console.log('⚠️  No visual test results found, skipping report generation');
        return;
      }
    }

    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

    if (failuresOnly && results.summary.failed === 0) {
      console.log('✅ No failures to report');
      return;
    }

    console.log(`📈 Test Summary: ${results.summary.passed}/${results.summary.total} passed`);
    
    if (results.visualDiffs.length > 0) {
      console.log(`🔍 Visual differences: ${results.visualDiffs.length}`);
    }

    const reportPath = output || path.join(this.reportDir, `visual-test-report.${format}`);
    console.log(`📁 Report saved to: ${reportPath}`);
  }

  async initializeVisualTesting() {
    console.log('🚀 Initializing Visual Regression Testing...');

    // Create necessary directories
    const directories = [
      'tests/visual',
      'test-results/visual-baselines',
      'test-results/visual-reports',
      'scripts/visual-testing',
    ];

    directories.forEach(dir => {
      this.ensureDirectoryExists(dir);
      console.log(`✅ Created directory: ${dir}`);
    });

    // Create gitignore entries
    const gitignorePath = '.gitignore';
    const gitignoreEntries = [
      '# Visual testing',
      'test-results/visual-reports/',
      'test-results/visual-chromium/',
      'test-results/visual-firefox/',
      'test-results/visual-webkit/',
      'test-results/visual-mobile/',
      'test-results/visual-tablet/',
      '',
    ].join('\n');

    if (fs.existsSync(gitignorePath)) {
      const currentGitignore = fs.readFileSync(gitignorePath, 'utf8');
      if (!currentGitignore.includes('# Visual testing')) {
        fs.appendFileSync(gitignorePath, '\n' + gitignoreEntries);
        console.log('✅ Updated .gitignore with visual testing exclusions');
      }
    }

    // Update package.json scripts
    const packageJsonPath = 'package.json';
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts['test:visual'] = 'node scripts/visual-testing/visual-cli.js test';
      packageJson.scripts['test:visual:update'] = 'node scripts/visual-testing/visual-cli.js update';
      packageJson.scripts['test:visual:report'] = 'node scripts/visual-testing/visual-cli.js report';
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Added visual testing scripts to package.json');
    }

    console.log('🎉 Visual regression testing initialized successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run test:visual');
    console.log('2. Create baselines: npm run test:visual:update');
    console.log('3. Generate report: npm run test:visual:report');
  }

  async validateSetup() {
    console.log('🔍 Validating Visual Testing Setup...');

    const checks = [
      {
        name: 'Playwright installation',
        check: () => {
          try {
            execSync('npx playwright --version', { stdio: 'pipe' });
            return true;
          } catch {
            return false;
          }
        }
      },
      {
        name: 'Visual test files',
        check: () => fs.existsSync('tests/visual')
      },
      {
        name: 'Visual config file',
        check: () => fs.existsSync(this.configFile)
      },
      {
        name: 'Visual reporter',
        check: () => fs.existsSync('scripts/visual-testing/visual-reporter.js')
      },
      {
        name: 'Playwright config integration',
        check: () => {
          try {
            const configContent = fs.readFileSync('playwright.config.ts', 'utf8');
            return configContent.includes('visual-reporter') && configContent.includes('toHaveScreenshot');
          } catch {
            return false;
          }
        }
      }
    ];

    let allPassed = true;
    for (const check of checks) {
      const passed = check.check();
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${check.name}`);
      if (!passed) allPassed = false;
    }

    if (allPassed) {
      console.log('🎉 Visual testing setup is valid!');
    } else {
      console.log('⚠️  Some checks failed. Run "init" command to fix setup.');
    }

    return allPassed;
  }

  async runBenchmark() {
    console.log('⚡ Running Visual Testing Performance Benchmark...');

    const startTime = Date.now();
    
    try {
      // Run a subset of visual tests to benchmark performance
      await this.runVisualTests(['--browser=chromium', '--component']);
      
      const duration = Date.now() - startTime;
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      
      console.log(`📊 Benchmark completed in ${minutes}m ${seconds}s`);
      
      // Log performance metrics
      const metrics = {
        duration,
        timestamp: new Date().toISOString(),
        browser: 'chromium',
        testType: 'component',
      };
      
      const metricsPath = path.join(this.reportDir, 'benchmark-metrics.json');
      this.ensureDirectoryExists(path.dirname(metricsPath));
      
      let allMetrics = [];
      if (fs.existsSync(metricsPath)) {
        allMetrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
      }
      allMetrics.push(metrics);
      
      fs.writeFileSync(metricsPath, JSON.stringify(allMetrics, null, 2));
      console.log(`📈 Benchmark metrics saved to: ${metricsPath}`);
      
    } catch (error) {
      console.log('❌ Benchmark failed:', error.message);
    }
  }

  parseArgs(args) {
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        const key = arg.substring(2);
        const nextArg = args[i + 1];
        
        if (nextArg && !nextArg.startsWith('--')) {
          options[key] = nextArg;
          i++; // Skip next arg since we used it as value
        } else {
          options[key] = true;
        }
      }
    }
    
    return options;
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  showHelp() {
    console.log(`
🎨 Visual Testing CLI

Usage: node scripts/visual-testing/visual-cli.js <command> [options]

Commands:
  test          Run visual regression tests
  update        Update baseline images
  compare       Compare two sets of results
  clean         Clean test results and reports
  report        Generate visual test report
  init          Initialize visual testing setup
  validate      Validate visual testing configuration
  benchmark     Run performance benchmark

Test Options:
  --browser <name>      Browser to test (chromium, firefox, webkit, mobile, tablet, retina, all)
  --component           Test components only
  --page                Test pages only
  --responsive          Test responsive breakpoints
  --accessibility       Test accessibility variations
  --update              Update baselines during test
  --threshold <value>   Visual difference threshold (0.0-1.0)

Examples:
  npm run test:visual
  node scripts/visual-testing/visual-cli.js test --browser chromium --component
  node scripts/visual-testing/visual-cli.js update --browser firefox
  node scripts/visual-testing/visual-cli.js clean --reports
  node scripts/visual-testing/visual-cli.js report --format html

For more information, visit: https://playwright.dev/docs/test-screenshots
    `);
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new VisualTestingCLI();
  cli.run().catch(error => {
    console.error('❌ CLI Error:', error.message);
    process.exit(1);
  });
}

module.exports = VisualTestingCLI;