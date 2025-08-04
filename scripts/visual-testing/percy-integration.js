/**
 * Percy Integration for Visual Testing
 * Integrates with Percy service for visual regression testing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PercyIntegration {
  constructor(options = {}) {
    this.token = options.token || process.env.PERCY_TOKEN;
    this.projectName = options.projectName || 'atoms-tech';
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.snapshotDirectory = options.snapshotDirectory || 'percy/snapshots';
  }

  /**
   * Setup Percy for the project
   */
  async setup() {
    console.log('🎨 Setting up Percy integration...');

    // Check if Percy CLI is installed
    try {
      execSync('npx percy --version', { stdio: 'pipe' });
      console.log('✅ Percy CLI is already installed');
    } catch {
      console.log('📦 Installing Percy CLI...');
      execSync('npm install --save-dev @percy/cli @percy/playwright', { stdio: 'inherit' });
    }

    // Create Percy configuration
    await this.createPercyConfig();

    // Update package.json scripts
    await this.updatePackageScripts();

    // Setup GitHub Actions workflow
    await this.setupGitHubActions();

    // Create Percy snapshots directory
    if (!fs.existsSync(this.snapshotDirectory)) {
      fs.mkdirSync(this.snapshotDirectory, { recursive: true });
    }

    console.log('✅ Percy setup completed!');
  }

  /**
   * Run Percy visual tests
   */
  async runVisualTests(options = {}) {
    console.log('🎨 Running Percy visual tests...');

    if (!this.token) {
      throw new Error('PERCY_TOKEN is required');
    }

    const {
      dry_run = false,
      parallel = false,
      partial = false,
      allowed_hostname,
      disallowed_hostname,
      enable_javascript = true,
    } = options;

    let command = `npx percy exec`;

    // Add options
    if (dry_run) {
      command += ` --dry-run`;
    }

    if (parallel) {
      command += ` --parallel`;
    }

    if (partial) {
      command += ` --partial`;
    }

    if (allowed_hostname) {
      command += ` --allowed-hostname="${allowed_hostname}"`;
    }

    if (disallowed_hostname) {
      command += ` --disallowed-hostname="${disallowed_hostname}"`;
    }

    if (!enable_javascript) {
      command += ` --disable-javascript`;
    }

    // Add Playwright test command
    command += ` -- npx playwright test tests/visual --project=visual-chromium`;

    console.log(`📋 Running: ${command}`);

    try {
      const result = execSync(command, {
        stdio: 'inherit',
        env: {
          ...process.env,
          PERCY_TOKEN: this.token,
        },
      });

      console.log('✅ Percy visual tests completed successfully!');
      return result;
    } catch (error) {
      console.error('❌ Percy visual tests failed:', error.message);
      throw error;
    }
  }

  /**
   * Create Percy configuration file
   */
  async createPercyConfig() {
    const configPath = '.percy.yml';

    const config = `
version: 2
snapshot:
  widths: [375, 768, 1024, 1280, 1920]
  min-height: 1024
  percy-css: |
    /* Hide dynamic content */
    [data-testid="timestamp"],
    [data-testid="random-id"],
    .loading-spinner,
    .skeleton {
      visibility: hidden !important;
    }
    
    /* Disable animations */
    *,
    *::before,
    *::after {
      animation-delay: -1ms !important;
      animation-duration: 1ms !important;
      animation-iteration-count: 1 !important;
      background-attachment: initial !important;
      scroll-behavior: auto !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }

discovery:
  request-headers:
    User-Agent: Percy/Playwright
  allowed-hostnames:
    - localhost
    - 127.0.0.1
    - ${this.baseUrl.replace('http://', '').replace('https://', '')}
  disallowed-hostnames: []
  network-idle-timeout: 100

agent:
  asset-discovery:
    enabled: true
    cache-responses: true
    request-headers: {}
    authorization: {}

defer-uploads: false
parallel-nonce: ""
parallel-total: -1

static-snapshots:
  base-url: ${this.baseUrl}
  snapshot-files: '${this.snapshotDirectory}/**/*.html'
  ignore-files: '${this.snapshotDirectory}/**/ignored/**'

upload:
  network-idle-timeout: 100
`;

    fs.writeFileSync(configPath, config.trim());
    console.log('✅ Created .percy.yml configuration');
  }

  /**
   * Update package.json scripts for Percy
   */
  async updatePackageScripts() {
    const packageJsonPath = 'package.json';

    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = packageJson.scripts || {};

    // Add Percy scripts
    packageJson.scripts['percy:test'] = 'percy exec -- npx playwright test tests/visual --project=visual-chromium';
    packageJson.scripts['percy:ci'] = 'percy exec --parallel -- npx playwright test tests/visual --project=visual-chromium';
    packageJson.scripts['percy:snapshot'] = 'percy snapshot public';

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json scripts');
  }

  /**
   * Setup GitHub Actions workflow for Percy
   */
  async setupGitHubActions() {
    const workflowDir = '.github/workflows';
    const workflowPath = path.join(workflowDir, 'percy.yml');

    // Create .github/workflows directory if it doesn't exist
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
    }

    const workflow = `
name: 'Percy Visual Tests'

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  percy-visual-tests:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
        
      - name: Build application
        run: npm run build
        
      - name: Start application
        run: npm run start &
        
      - name: Wait for application
        run: npx wait-on http://localhost:3000
        
      - name: Run Percy visual tests
        run: npm run percy:ci
        env:
          PERCY_TOKEN: \${{ secrets.PERCY_TOKEN }}
          PERCY_PARALLEL_NONCE: \${{ github.event_name }}-\${{ github.sha }}
          PERCY_PARALLEL_TOTAL: 1
          
      - name: Upload Percy results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: percy-results
          path: |
            percy-build-*.log
            .percy/
          retention-days: 30
`;

    fs.writeFileSync(workflowPath, workflow.trim());
    console.log('✅ Created GitHub Actions workflow for Percy');
  }

  /**
   * Create Percy snapshot tests
   */
  async createSnapshotTests() {
    console.log('📸 Creating Percy snapshot tests...');

    const testFilePath = 'tests/visual/percy-snapshots.spec.ts';
    const testDir = path.dirname(testFilePath);

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const testContent = `
import { test } from '@playwright/test';
import { percySnapshot } from '@percy/playwright';

// Page routes to snapshot
const routes = [
  { path: '/', name: 'Home' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Register' },
  { path: '/404', name: 'Not Found' },
];

// Component showcase routes
const componentRoutes = [
  { path: '/storybook', name: 'Component Showcase' },
];

test.describe('Percy Visual Snapshots', () => {
  
  test.describe('Page Snapshots', () => {
    for (const route of routes) {
      test(\`\${route.name} page snapshot\`, async ({ page }) => {
        await page.goto(route.path);
        
        // Wait for page to load completely
        await page.waitForLoadState('networkidle');
        
        // Hide dynamic content
        await page.addStyleTag({
          content: \`
            [data-testid="timestamp"],
            [data-testid="random-id"],
            .loading-spinner,
            .skeleton {
              visibility: hidden !important;
            }
          \`,
        });
        
        // Take Percy snapshot
        await percySnapshot(page, \`\${route.name} Page\`);
      });
    }
  });

  test.describe('Responsive Snapshots', () => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1200, height: 800, name: 'Desktop' },
    ];

    for (const viewport of viewports) {
      test(\`Home page - \${viewport.name}\`, async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        await percySnapshot(page, \`Home Page - \${viewport.name}\`, {
          widths: [viewport.width],
        });
      });
    }
  });

  test.describe('Authentication Flow Snapshots', () => {
    test('Login flow', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Empty login form
      await percySnapshot(page, 'Login Form - Empty');
      
      // Filled login form
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await percySnapshot(page, 'Login Form - Filled');
      
      // Focus states
      await page.focus('input[type="email"]');
      await percySnapshot(page, 'Login Form - Email Focus');
    });

    test('Registration flow', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      
      await percySnapshot(page, 'Registration Form - Empty');
      
      // Fill registration form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.fill('input[name="confirmPassword"]', 'password123');
      
      await percySnapshot(page, 'Registration Form - Filled');
    });
  });

  test.describe('Component State Snapshots', () => {
    test('Button component states', async ({ page }) => {
      await page.goto('/storybook');
      await page.waitForLoadState('networkidle');
      
      // Find button component showcase
      const buttonShowcase = page.locator('[data-component="button"]');
      
      if (await buttonShowcase.count() > 0) {
        await percySnapshot(page, 'Button Component - All States');
        
        // Hover state
        await buttonShowcase.first().hover();
        await percySnapshot(page, 'Button Component - Hover State');
      }
    });

    test('Form component states', async ({ page }) => {
      await page.goto('/storybook');
      await page.waitForLoadState('networkidle');
      
      const formShowcase = page.locator('[data-component="form"]');
      
      if (await formShowcase.count() > 0) {
        await percySnapshot(page, 'Form Components - Default States');
        
        // Focus states
        await page.focus('input[type="text"]');
        await percySnapshot(page, 'Form Components - Focus States');
        
        // Error states
        await page.evaluate(() => {
          const inputs = document.querySelectorAll('input');
          inputs.forEach(input => input.classList.add('error'));
        });
        await percySnapshot(page, 'Form Components - Error States');
      }
    });
  });

  test.describe('Theme Snapshots', () => {
    test('Dark theme', async ({ page }) => {
      await page.goto('/');
      
      // Apply dark theme
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('theme-dark');
      });
      
      await page.waitForTimeout(100); // Allow theme to apply
      await percySnapshot(page, 'Home Page - Dark Theme');
    });

    test('High contrast theme', async ({ page }) => {
      await page.goto('/');
      
      // Apply high contrast theme
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'high-contrast');
        document.body.classList.add('theme-high-contrast');
      });
      
      await page.waitForTimeout(100);
      await percySnapshot(page, 'Home Page - High Contrast Theme');
    });
  });

  test.describe('Error State Snapshots', () => {
    test('404 page', async ({ page }) => {
      await page.goto('/non-existent-page');
      await page.waitForLoadState('networkidle');
      
      await percySnapshot(page, '404 Error Page');
    });

    test('Network error simulation', async ({ page }) => {
      // Simulate offline
      await page.context().setOffline(true);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000); // Wait for error state
      
      await percySnapshot(page, 'Network Error State');
      
      await page.context().setOffline(false);
    });
  });

  test.describe('Loading State Snapshots', () => {
    test('Page loading states', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 1000);
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(500); // Capture loading state
      
      await percySnapshot(page, 'Page Loading State');
    });
  });
});
`;

    fs.writeFileSync(testFilePath, testContent.trim());
    console.log('✅ Created Percy snapshot tests');
  }

  /**
   * Generate Percy build URL and report
   */
  async generateReport(buildId) {
    console.log('📊 Generating Percy visual test report...');

    const reportData = {
      timestamp: new Date().toISOString(),
      buildId,
      projectName: this.projectName,
      buildUrl: buildId ? `https://percy.io/${this.projectName}/builds/${buildId}` : null,
      token: this.token ? 'configured' : 'missing',
    };

    const reportPath = 'test-results/visual-reports/percy-report.json';
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`✅ Percy report saved to: ${reportPath}`);

    return reportData;
  }

  /**
   * Compare two Percy builds
   */
  async compareBuilds(baseBuildId, compareBuildId) {
    console.log(`🔍 Comparing Percy builds: ${baseBuildId} vs ${compareBuildId}`);

    // This would integrate with Percy API to get comparison results
    // For now, generate a placeholder comparison report
    const comparisonData = {
      timestamp: new Date().toISOString(),
      baseBuildId,
      compareBuildId,
      comparisonUrl: `https://percy.io/${this.projectName}/builds/${compareBuildId}`,
      status: 'pending', // Would be actual status from API
      totalSnapshots: 0,
      changedSnapshots: 0,
      newSnapshots: 0,
      removedSnapshots: 0,
    };

    const reportPath = 'test-results/visual-reports/percy-comparison.json';
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(comparisonData, null, 2));
    console.log(`✅ Percy comparison report saved to: ${reportPath}`);

    return comparisonData;
  }
}

module.exports = PercyIntegration;