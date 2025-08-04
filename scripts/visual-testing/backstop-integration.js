/**
 * BackstopJS Integration for Visual Regression Testing
 * Comprehensive UI regression testing with BackstopJS
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class BackstopIntegration {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.configPath = options.configPath || 'backstop.config.js';
    this.referencePath = options.referencePath || 'backstop_data/bitmaps_reference';
    this.testPath = options.testPath || 'backstop_data/bitmaps_test';
    this.reportPath = options.reportPath || 'backstop_data/html_report';
    this.engineOptions = options.engineOptions || {};
  }

  /**
   * Setup BackstopJS for the project
   */
  async setup() {
    console.log('🎨 Setting up BackstopJS integration...');

    // Check if BackstopJS is installed
    try {
      execSync('npx backstop --version', { stdio: 'pipe' });
      console.log('✅ BackstopJS is already installed');
    } catch {
      console.log('📦 Installing BackstopJS...');
      execSync('npm install --save-dev backstopjs', { stdio: 'inherit' });
    }

    // Create BackstopJS configuration
    await this.createBackstopConfig();

    // Update package.json scripts
    await this.updatePackageScripts();

    // Create test scenarios
    await this.createTestScenarios();

    // Setup CI integration
    await this.setupCIIntegration();

    console.log('✅ BackstopJS setup completed!');
  }

  /**
   * Create comprehensive BackstopJS configuration
   */
  async createBackstopConfig() {
    const config = {
      id: 'atoms_tech_visual_regression',
      viewports: [
        {
          label: 'phone',
          width: 375,
          height: 667,
        },
        {
          label: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'desktop',
          width: 1200,
          height: 800,
        },
        {
          label: 'large-desktop',
          width: 1920,
          height: 1080,
        },
      ],
      onBeforeScript: 'puppet/onBefore.js',
      onReadyScript: 'puppet/onReady.js',
      scenarios: [
        // Home page scenarios
        {
          label: 'Home Page',
          url: `${this.baseUrl}/`,
          referenceUrl: '',
          readyEvent: '',
          readySelector: '',
          delay: 1000,
          hideSelectors: [
            '[data-testid="timestamp"]',
            '[data-testid="random-id"]',
            '.loading-spinner',
            '.skeleton',
          ],
          removeSelectors: [
            '[data-testid="dynamic-content"]',
          ],
          hoverSelector: '',
          clickSelector: '',
          postInteractionWait: 0,
          selectors: ['document'],
          misMatchThreshold: 0.1,
          requireSameDimensions: true,
        },
        
        // Authentication pages
        {
          label: 'Login Page',
          url: `${this.baseUrl}/login`,
          delay: 1000,
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },
        {
          label: 'Register Page',
          url: `${this.baseUrl}/register`,
          delay: 1000,
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },

        // Component testing scenarios
        {
          label: 'Button States - Default',
          url: `${this.baseUrl}/storybook?path=/story/ui-button--default`,
          delay: 500,
          selectors: ['.storybook-button'],
          misMatchThreshold: 0.05,
        },
        {
          label: 'Button States - Hover',
          url: `${this.baseUrl}/storybook?path=/story/ui-button--default`,
          delay: 500,
          hoverSelector: '.storybook-button',
          postInteractionWait: 200,
          selectors: ['.storybook-button'],
          misMatchThreshold: 0.05,
        },
        {
          label: 'Button States - Focus',
          url: `${this.baseUrl}/storybook?path=/story/ui-button--default`,
          delay: 500,
          clickSelector: '.storybook-button',
          postInteractionWait: 200,
          selectors: ['.storybook-button'],
          misMatchThreshold: 0.05,
        },

        // Form component scenarios
        {
          label: 'Form Components - Empty State',
          url: `${this.baseUrl}/storybook?path=/story/ui-form--empty`,
          delay: 500,
          selectors: ['.form-container'],
          misMatchThreshold: 0.05,
        },
        {
          label: 'Form Components - Filled State',
          url: `${this.baseUrl}/storybook?path=/story/ui-form--filled`,
          delay: 500,
          selectors: ['.form-container'],
          misMatchThreshold: 0.05,
        },
        {
          label: 'Form Components - Error State',
          url: `${this.baseUrl}/storybook?path=/story/ui-form--error`,
          delay: 500,
          selectors: ['.form-container'],
          misMatchThreshold: 0.05,
        },

        // Modal and dialog scenarios
        {
          label: 'Modal - Closed',
          url: `${this.baseUrl}/storybook?path=/story/ui-modal--closed`,
          delay: 500,
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },
        {
          label: 'Modal - Open',
          url: `${this.baseUrl}/storybook?path=/story/ui-modal--open`,
          delay: 1000,
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },

        // Theme variations
        {
          label: 'Dark Theme - Home',
          url: `${this.baseUrl}/?theme=dark`,
          delay: 1000,
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },
        {
          label: 'High Contrast Theme - Home',
          url: `${this.baseUrl}/?theme=high-contrast`,
          delay: 1000,
          selectors: ['document'],
          misMatchThreshold: 0.15,
        },

        // Responsive layout scenarios
        {
          label: 'Navigation - Mobile',
          url: `${this.baseUrl}/`,
          delay: 1000,
          selectors: ['.navigation'],
          viewports: [{ label: 'phone', width: 375, height: 667 }],
          misMatchThreshold: 0.1,
        },
        {
          label: 'Navigation - Desktop',
          url: `${this.baseUrl}/`,
          delay: 1000,
          selectors: ['.navigation'],
          viewports: [{ label: 'desktop', width: 1200, height: 800 }],
          misMatchThreshold: 0.1,
        },

        // Data-heavy page scenarios
        {
          label: 'Dashboard - Empty State',
          url: `${this.baseUrl}/dashboard?state=empty`,
          delay: 2000,
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },
        {
          label: 'Dashboard - With Data',
          url: `${this.baseUrl}/dashboard?state=filled`,
          delay: 2000,
          hideSelectors: [
            '[data-testid="timestamp"]',
            '[data-testid="chart-animation"]',
          ],
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },
        {
          label: 'Dashboard - Loading State',
          url: `${this.baseUrl}/dashboard?state=loading`,
          delay: 500,
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },

        // Error page scenarios
        {
          label: '404 Page',
          url: `${this.baseUrl}/non-existent-page`,
          delay: 1000,
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },
        {
          label: '500 Error Page',
          url: `${this.baseUrl}/error?type=server`,
          delay: 1000,
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },

        // Accessibility scenarios
        {
          label: 'Focus States - Tab Navigation',
          url: `${this.baseUrl}/`,
          delay: 1000,
          onReadyScript: 'puppet/focusStates.js',
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },
        {
          label: 'Reduced Motion',
          url: `${this.baseUrl}/?prefers-reduced-motion=reduce`,
          delay: 1000,
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },
      ],
      paths: {
        bitmaps_reference: this.referencePath,
        bitmaps_test: this.testPath,
        engine_scripts: 'backstop_data/engine_scripts',
        html_report: this.reportPath,
        ci_report: 'backstop_data/ci_report',
      },
      report: ['browser'],
      engine: 'puppeteer',
      engineOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--force-color-profile=srgb',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
        ...this.engineOptions,
      },
      asyncCaptureLimit: 5,
      asyncCompareLimit: 50,
      debug: false,
      debugWindow: false,
    };

    fs.writeFileSync(this.configPath, `module.exports = ${JSON.stringify(config, null, 2)};`);
    console.log('✅ Created BackstopJS configuration');
  }

  /**
   * Create Puppeteer scripts for advanced interactions
   */
  async createTestScenarios() {
    const scriptsDir = 'backstop_data/engine_scripts/puppet';
    
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    // onBefore script
    const onBeforeScript = `
module.exports = async (page, scenario, vp) => {
  console.log('SCENARIO > ' + scenario.label);
  
  // Disable animations
  await page.evaluateOnNewDocument(() => {
    const css = \`
      *, *::before, *::after {
        animation-delay: -1ms !important;
        animation-duration: 1ms !important;
        animation-iteration-count: 1 !important;
        background-attachment: initial !important;
        scroll-behavior: auto !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    \`;
    
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    
    const head = document.head || document.getElementsByTagName('head')[0];
    head.appendChild(style);
  });

  // Set user agent for consistent rendering
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  
  // Set viewport
  await page.setViewport({
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: 1,
  });
};
`;

    // onReady script
    const onReadyScript = `
module.exports = async (page, scenario, vp) => {
  console.log('SCENARIO > ' + scenario.label + ' > READY');
  
  // Wait for fonts to load
  await page.evaluateHandle('document.fonts.ready');
  
  // Wait for any lazy-loaded images
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll('img'));
    await Promise.all(images.map(img => {
      if (img.complete) return Promise.resolve();
      
      return new Promise((resolve, reject) => {
        img.addEventListener('load', resolve);
        img.addEventListener('error', reject);
      });
    }));
  });
  
  // Wait for any CSS animations to complete
  await page.waitForTimeout(100);
  
  // Scroll to trigger any scroll-based animations
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    window.scrollTo(0, 0);
  });
  
  // Additional wait for stability
  await page.waitForTimeout(200);
};
`;

    // Focus states script
    const focusStatesScript = `
module.exports = async (page, scenario, vp) => {
  console.log('SCENARIO > ' + scenario.label + ' > FOCUS STATES');
  
  // Find all focusable elements
  const focusableElements = await page.$$eval(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    elements => elements.map(el => el.tagName.toLowerCase())
  );
  
  // Focus on the first few elements to show focus indicators
  const buttons = await page.$$('button');
  if (buttons.length > 0) {
    await buttons[0].focus();
    await page.waitForTimeout(100);
  }
  
  const inputs = await page.$$('input');
  if (inputs.length > 0) {
    await inputs[0].focus();
    await page.waitForTimeout(100);
  }
};
`;

    fs.writeFileSync(path.join(scriptsDir, 'onBefore.js'), onBeforeScript);
    fs.writeFileSync(path.join(scriptsDir, 'onReady.js'), onReadyScript);
    fs.writeFileSync(path.join(scriptsDir, 'focusStates.js'), focusStatesScript);

    console.log('✅ Created BackstopJS Puppeteer scripts');
  }

  /**
   * Update package.json scripts for BackstopJS
   */
  async updatePackageScripts() {
    const packageJsonPath = 'package.json';
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.scripts = packageJson.scripts || {};
    
    // Add BackstopJS scripts
    packageJson.scripts['backstop:reference'] = 'backstop reference';
    packageJson.scripts['backstop:test'] = 'backstop test';
    packageJson.scripts['backstop:approve'] = 'backstop approve';
    packageJson.scripts['backstop:init'] = 'backstop init';
    packageJson.scripts['backstop:remote'] = 'backstop remote';
    packageJson.scripts['backstop:report'] = 'backstop openReport';
    
    // Workflow scripts
    packageJson.scripts['visual:backstop:full'] = 'npm run backstop:reference && npm run backstop:test';
    packageJson.scripts['visual:backstop:ci'] = 'backstop test --config=backstop.ci.config.js';
    packageJson.scripts['visual:backstop:update'] = 'backstop approve && npm run backstop:reference';

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json scripts for BackstopJS');
  }

  /**
   * Run BackstopJS visual tests
   */
  async runVisualTests(command = 'test', options = {}) {
    console.log(`🎨 Running BackstopJS ${command}...`);

    const {
      config = this.configPath,
      filter = null,
      async_capture_limit = 5,
      async_compare_limit = 50,
    } = options;

    let backstopCommand = `npx backstop ${command}`;
    
    if (config !== this.configPath) {
      backstopCommand += ` --config=${config}`;
    }

    if (filter) {
      backstopCommand += ` --filter="${filter}"`;
    }

    if (command === 'test') {
      backstopCommand += ` --asyncCaptureLimit=${async_capture_limit}`;
      backstopCommand += ` --asyncCompareLimit=${async_compare_limit}`;
    }

    console.log(`📋 Running: ${backstopCommand}`);

    try {
      const result = execSync(backstopCommand, { 
        stdio: 'inherit',
        encoding: 'utf8'
      });

      console.log(`✅ BackstopJS ${command} completed successfully!`);
      return result;
    } catch (error) {
      console.error(`❌ BackstopJS ${command} failed:`, error.message);
      
      if (command === 'test' && error.status === 1) {
        console.log('📊 Visual differences detected. Opening report...');
        try {
          execSync('npx backstop openReport', { stdio: 'inherit' });
        } catch (reportError) {
          console.error('Failed to open report:', reportError.message);
        }
      }
      
      throw error;
    }
  }

  /**
   * Setup CI configuration for BackstopJS
   */
  async setupCIIntegration() {
    const ciConfig = {
      id: 'atoms_tech_visual_regression_ci',
      viewports: [
        {
          label: 'desktop',
          width: 1200,
          height: 800,
        },
        {
          label: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'mobile',
          width: 375,
          height: 667,
        },
      ],
      onBeforeScript: 'puppet/onBefore.js',
      onReadyScript: 'puppet/onReady.js',
      scenarios: [
        // Reduced set of scenarios for CI
        {
          label: 'CI - Home Page',
          url: `${this.baseUrl}/`,
          delay: 1000,
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },
        {
          label: 'CI - Login Page',
          url: `${this.baseUrl}/login`,
          delay: 500,
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },
        {
          label: 'CI - Dashboard',
          url: `${this.baseUrl}/dashboard`,
          delay: 1000,
          hideSelectors: [
            '[data-testid="timestamp"]',
            '[data-testid="random-id"]',
          ],
          selectors: ['document'],
          misMatchThreshold: 0.1,
        },
      ],
      paths: {
        bitmaps_reference: 'backstop_data/bitmaps_reference',
        bitmaps_test: 'backstop_data/bitmaps_test',
        engine_scripts: 'backstop_data/engine_scripts',
        html_report: 'backstop_data/html_report',
        ci_report: 'backstop_data/ci_report',
      },
      report: ['CI'],
      engine: 'puppeteer',
      engineOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--headless',
        ],
      },
      asyncCaptureLimit: 3,
      asyncCompareLimit: 20,
      debug: false,
      debugWindow: false,
    };

    fs.writeFileSync('backstop.ci.config.js', `module.exports = ${JSON.stringify(ciConfig, null, 2)};`);
    console.log('✅ Created CI configuration for BackstopJS');
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport() {
    console.log('📊 Generating BackstopJS visual test report...');

    const reportData = {
      timestamp: new Date().toISOString(),
      engine: 'backstopjs',
      configPath: this.configPath,
      referencePath: this.referencePath,
      testPath: this.testPath,
      reportPath: this.reportPath,
    };

    // Check if HTML report exists
    const htmlReportPath = path.join(this.reportPath, 'index.html');
    if (fs.existsSync(htmlReportPath)) {
      reportData.htmlReport = htmlReportPath;
    }

    // Check for JSON report
    const jsonReportPath = 'backstop_data/json_report/jsonReport.json';
    if (fs.existsSync(jsonReportPath)) {
      try {
        const jsonReport = JSON.parse(fs.readFileSync(jsonReportPath, 'utf8'));
        reportData.results = jsonReport;
        reportData.summary = {
          totalScenarios: jsonReport.tests?.length || 0,
          passedScenarios: jsonReport.tests?.filter(t => t.status === 'pass').length || 0,
          failedScenarios: jsonReport.tests?.filter(t => t.status === 'fail').length || 0,
        };
      } catch (error) {
        console.warn('Could not parse BackstopJS JSON report:', error.message);
      }
    }

    const outputReportPath = 'test-results/visual-reports/backstop-report.json';
    const reportDir = path.dirname(outputReportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(outputReportPath, JSON.stringify(reportData, null, 2));
    console.log(`✅ BackstopJS report saved to: ${outputReportPath}`);

    return reportData;
  }

  /**
   * Clean up BackstopJS test data
   */
  async cleanup() {
    console.log('🧹 Cleaning up BackstopJS test data...');

    const cleanupPaths = [
      this.testPath,
      'backstop_data/html_report',
      'backstop_data/ci_report',
      'backstop_data/json_report',
    ];

    cleanupPaths.forEach(cleanupPath => {
      if (fs.existsSync(cleanupPath)) {
        fs.rmSync(cleanupPath, { recursive: true, force: true });
        console.log(`🗑️  Removed: ${cleanupPath}`);
      }
    });

    console.log('✅ BackstopJS cleanup completed');
  }
}

module.exports = BackstopIntegration;