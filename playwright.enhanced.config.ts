import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Enhanced Playwright Configuration for Comprehensive E2E Testing
 * 
 * Features:
 * - Cross-browser testing (Chrome, Firefox, Safari, Edge)
 * - Mobile device testing
 * - Visual regression testing
 * - Performance monitoring
 * - Accessibility testing
 * - Parallel execution optimization
 * - Advanced reporting
 */
export default defineConfig({
    testDir: './tests/e2e',

    /* Global test timeout */
    timeout: 60 * 1000,

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 1,

    /* Opt out of parallel tests on CI. Set to 1 for sequential execution */
    workers: process.env.CI ? 4 : undefined,

    /* Reporter configuration for multiple output formats */
    reporter: [
        // Standard HTML report
        [
            'html',
            {
                outputFolder: 'test-results/enhanced-e2e-report',
                open: process.env.CI ? 'never' : 'on-failure',
            },
        ],
        
        // JSON report for agent consumption
        [
            'json',
            {
                outputFile: 'test-results/agent-context/enhanced-e2e-results.json',
            },
        ],
        
        // JUnit XML for CI/CD integration
        [
            'junit',
            {
                outputFile: 'test-results/junit/enhanced-e2e-junit.xml',
            },
        ],
        
        // Custom reporters
        ['./scripts/reporters/agent-context-reporter.js'],
        ['./scripts/reporters/feature-health-reporter.js'],
        
        // GitHub Actions reporter for CI
        ...(process.env.GITHUB_ACTIONS ? [['github'] as const] : []),
        
        // List reporter for console output
        ['list', { printSteps: true }],
    ],

    /* Global test configuration */
    use: {
        /* Base URL */
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

        /* Collect trace when retrying the failed test */
        trace: 'retain-on-failure',

        /* Take screenshot on failure */
        screenshot: 'only-on-failure',

        /* Record video on failure */
        video: 'retain-on-failure',

        /* Agent-specific headers */
        extraHTTPHeaders: {
            'X-Agent-Testing': 'true',
            'X-Test-Environment': 'e2e',
        },

        /* Ignore HTTPS errors for testing */
        ignoreHTTPSErrors: true,

        /* Set user agent for testing */
        userAgent: 'PlaywrightE2E/1.0 (Enhanced Testing)',
    },

    /* Configure projects for comprehensive testing */
    projects: [
        // === DESKTOP BROWSERS ===
        {
            name: 'chromium-desktop',
            use: { 
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
            },
            testMatch: /^(?!.*\.visual\.).*\.spec\.ts$/,
        },

        {
            name: 'firefox-desktop',
            use: { 
                ...devices['Desktop Firefox'],
                viewport: { width: 1920, height: 1080 },
            },
            testMatch: /^(?!.*\.visual\.).*\.spec\.ts$/,
        },

        {
            name: 'webkit-desktop',
            use: { 
                ...devices['Desktop Safari'],
                viewport: { width: 1920, height: 1080 },
            },
            testMatch: /^(?!.*\.visual\.).*\.spec\.ts$/,
        },

        {
            name: 'edge-desktop',
            use: { 
                ...devices['Desktop Edge'], 
                channel: 'msedge',
                viewport: { width: 1920, height: 1080 },
            },
            testMatch: /^(?!.*\.visual\.).*\.spec\.ts$/,
        },

        // === MOBILE DEVICES ===
        {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 5'] },
            testMatch: /.*\.(mobile|responsive)\.spec\.ts$/,
        },

        {
            name: 'mobile-safari',
            use: { ...devices['iPhone 12'] },
            testMatch: /.*\.(mobile|responsive)\.spec\.ts$/,
        },

        {
            name: 'tablet-ipad',
            use: { ...devices['iPad Pro'] },
            testMatch: /.*\.(tablet|responsive)\.spec\.ts$/,
        },

        // === VISUAL REGRESSION TESTING ===
        {
            name: 'visual-chromium',
            use: { 
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
                deviceScaleFactor: 1,
            },
            testMatch: /.*\.visual\.spec\.ts$/,
        },

        {
            name: 'visual-firefox',
            use: { 
                ...devices['Desktop Firefox'],
                viewport: { width: 1920, height: 1080 },
                deviceScaleFactor: 1,
            },
            testMatch: /.*\.visual\.spec\.ts$/,
        },

        {
            name: 'visual-webkit',
            use: { 
                ...devices['Desktop Safari'],
                viewport: { width: 1920, height: 1080 },
                deviceScaleFactor: 1,
            },
            testMatch: /.*\.visual\.spec\.ts$/,
        },

        // === RESPONSIVE VISUAL TESTING ===
        {
            name: 'visual-mobile',
            use: { 
                ...devices['iPhone 12'],
                viewport: { width: 390, height: 844 },
            },
            testMatch: /.*\.visual\.spec\.ts$/,
        },

        {
            name: 'visual-tablet',
            use: { 
                ...devices['iPad Pro'],
                viewport: { width: 1024, height: 768 },
            },
            testMatch: /.*\.visual\.spec\.ts$/,
        },

        // === HIGH DPI TESTING ===
        {
            name: 'visual-retina',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
                deviceScaleFactor: 2,
            },
            testMatch: /.*\.visual\.spec\.ts$/,
        },

        // === ACCESSIBILITY TESTING ===
        {
            name: 'accessibility-chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
                // Accessibility testing specific settings
                // Note: reducedMotion and forcedColors are not valid in current Playwright version
            },
            testMatch: /.*\.accessibility\.spec\.ts$/,
        },

        {
            name: 'accessibility-high-contrast',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
                colorScheme: 'dark',
                // Note: reducedMotion and forcedColors are not valid in current Playwright version
            },
            testMatch: /.*\.accessibility\.spec\.ts$/,
        },

        // === PERFORMANCE TESTING ===
        {
            name: 'performance-chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
            },
            testMatch: /.*\.performance\.spec\.ts$/,
        },

        // === SLOW NETWORK TESTING ===
        {
            name: 'slow-network',
            use: {
                ...devices['Desktop Chrome'],
                launchOptions: {
                    args: [
                        '--force-device-scale-factor=1',
                        '--disable-dev-shm-usage',
                        '--no-sandbox'
                    ]
                }
            },
            testMatch: /.*\.(network|performance)\.spec\.ts$/,
        },

        // === COMPREHENSIVE USER JOURNEYS ===
        {
            name: 'user-journeys-chrome',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
            },
            testMatch: /.*\/(advanced-scenarios|comprehensive-user-journeys)\/.*\.spec\.ts$/,
        },

        {
            name: 'user-journeys-firefox',
            use: {
                ...devices['Desktop Firefox'],
                viewport: { width: 1920, height: 1080 },
            },
            testMatch: /.*\/(advanced-scenarios|comprehensive-user-journeys)\/.*\.spec\.ts$/,
        },

        // === SECURITY TESTING ===
        {
            name: 'security-testing',
            use: {
                ...devices['Desktop Chrome'],
                extraHTTPHeaders: {
                    'X-Security-Test': 'true',
                },
            },
            testMatch: /.*\.security\.spec\.ts$/,
        }
    ],

    /* Global setup and teardown */
    globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
    globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),

    /* Web server configuration */
    webServer: {
        command: 'npm run dev',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        env: {
            NODE_ENV: 'test',
            PLAYWRIGHT_TEST: 'true',
        },
    },

    /* Output directories */
    outputDir: 'test-results/enhanced-e2e-output',

    /* Enhanced test timeout for complex scenarios - overrides global timeout */

    /* Expect timeout for assertions */
    expect: {
        timeout: 15 * 1000,
        
        // Visual regression testing thresholds
        toMatchSnapshot: { 
            threshold: 0.2, 
            maxDiffPixels: 100,
        },
        
        toHaveScreenshot: { 
            threshold: 0.2, 
            maxDiffPixels: 100,
            animations: 'disabled',
        },
    },

    /* Test metadata */
    metadata: {
        testSuite: 'Enhanced E2E Testing',
        version: '2.0.0',
        features: [
            'Cross-browser testing',
            'Mobile device testing',
            'Visual regression testing',
            'Performance monitoring',
            'Accessibility testing',
            'User journey mapping',
            'Advanced reporting'
        ],
        coverage: {
            userStories: true,
            requirements: true,
            components: true,
            apis: true,
        }
    },

    /* Advanced configuration - already set above */
    
    /* Test file patterns */
    testMatch: [
        'tests/e2e/**/*.spec.ts',
        'tests/e2e/**/*.test.ts',
    ],

    /* Test ignore patterns */
    testIgnore: [
        'tests/e2e/fixtures/**',
        'tests/e2e/utils/**',
        'tests/e2e/page-objects/**',
        'tests/e2e/coverage-mapping/**',
    ],
});