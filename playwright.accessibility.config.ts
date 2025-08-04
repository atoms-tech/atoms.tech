import { defineConfig, devices } from '@playwright/test';

/**
 * Accessibility-focused Playwright Configuration
 * 
 * Comprehensive accessibility testing with axe-core integration
 */
export default defineConfig({
  testDir: './tests/accessibility',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI for accessibility tests */
  workers: process.env.CI ? 1 : 2,
  
  /* Reporter configuration for accessibility testing */
  reporter: [
    [
      'html',
      {
        outputFolder: 'test-results/accessibility-report',
        open: 'never',
      },
    ],
    [
      'json',
      {
        outputFile: 'test-results/accessibility/test-results.json',
      },
    ],
    [
      'junit',
      {
        outputFile: 'test-results/accessibility/junit-results.xml',
      },
    ],
    ['./scripts/reporters/accessibility-reporter.js'],
  ],
  
  /* Shared settings for all accessibility tests */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. */
    trace: 'retain-on-failure',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Accessibility-specific settings */
    extraHTTPHeaders: {
      'X-Accessibility-Testing': 'true',
    },
    
    /* Longer timeouts for accessibility tests */
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },
  
  /* Configure projects for different accessibility scenarios */
  projects: [
    // Standard accessibility testing
    {
      name: 'accessibility-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        // Ensure sufficient viewport for accessibility tests
        viewport: { width: 1280, height: 720 }
      },
    },
    
    // Mobile accessibility testing
    {
      name: 'accessibility-mobile',
      use: { 
        ...devices['Pixel 5'],
        // Mobile-specific accessibility settings
        hasTouch: true,
      },
    },
    
    // High contrast mode testing
    {
      name: 'accessibility-high-contrast',
      use: {
        ...devices['Desktop Chrome'],
        colorScheme: 'dark',
        extraHTTPHeaders: {
          'X-Accessibility-Testing': 'true',
          'X-High-Contrast': 'true',
        },
        viewport: { width: 1280, height: 720 }
      },
    },
    
    // Reduced motion testing
    {
      name: 'accessibility-reduced-motion',
      use: {
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'X-Accessibility-Testing': 'true',
          'X-Reduced-Motion': 'true',
        },
        viewport: { width: 1280, height: 720 }
      },
    },
    
    // Screen reader simulation
    {
      name: 'accessibility-screen-reader',
      use: {
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'X-Accessibility-Testing': 'true',
          'X-Screen-Reader': 'true',
        },
        // Simulate screen reader user agent
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NVDA/2021.1',
        viewport: { width: 1280, height: 720 }
      },
    },
    
    // Keyboard-only navigation
    {
      name: 'accessibility-keyboard-only',
      use: {
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'X-Accessibility-Testing': 'true',
          'X-Keyboard-Only': 'true',
        },
        viewport: { width: 1280, height: 720 }
      },
    },
    
    // Touch accessibility
    {
      name: 'accessibility-touch',
      use: {
        ...devices['Desktop Chrome'],
        hasTouch: true,
        extraHTTPHeaders: {
          'X-Accessibility-Testing': 'true',
          'X-Touch-Testing': 'true',
        },
        viewport: { width: 1024, height: 768 }
      },
    },
  ],
  
  /* Global setup for accessibility testing */
  globalSetup: './tests/accessibility/global-setup.ts',
  globalTeardown: './tests/accessibility/global-teardown.ts',
  
  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  /* Accessibility-specific output directories */
  outputDir: 'test-results/accessibility-output',
  
  /* Extended timeout for accessibility tests */
  timeout: 60 * 1000,
  
  /* Expect timeout for accessibility assertions */
  expect: {
    timeout: 30 * 1000,
  },
  
  /* Global test configuration */
  globalTimeout: 600 * 1000, // 10 minutes for full accessibility suite
});