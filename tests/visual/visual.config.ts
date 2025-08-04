import { defineConfig, devices } from '@playwright/test';

/**
 * Visual Regression Testing Configuration
 * 
 * Optimized for comprehensive visual testing coverage including:
 * - Component states (default, hover, focus, disabled)
 * - Theme variations (light/dark)
 * - Responsive breakpoints
 * - Interactive component behavior
 * - Modal and dialog rendering
 */
export default defineConfig({
    testDir: './tests/visual',
    
    /* Run tests in files in parallel */
    fullyParallel: true,
    
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    
    /* Reporter configuration */
    reporter: [
        ['html', { outputFolder: 'test-results/visual-report' }],
        ['json', { outputFile: 'test-results/visual-results.json' }],
        ['junit', { outputFile: 'test-results/visual-junit.xml' }],
    ],
    
    /* Shared settings for all the projects below. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
        
        /* Collect trace when retrying the failed test. */
        trace: 'retain-on-failure',
        
        /* Always take screenshots for visual tests */
        screenshot: 'only-on-failure',
        
        /* Record video on failure */
        video: 'retain-on-failure',
        
        /* Visual testing specific settings */
        extraHTTPHeaders: {
            'X-Visual-Testing': 'true',
        },
    },
    
    /* Configure projects for visual testing */
    projects: [
        // Desktop browsers
        {
            name: 'chromium-desktop',
            use: { 
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
            },
        },
        {
            name: 'firefox-desktop',
            use: { 
                ...devices['Desktop Firefox'],
                viewport: { width: 1920, height: 1080 },
            },
        },
        {
            name: 'webkit-desktop',
            use: { 
                ...devices['Desktop Safari'],
                viewport: { width: 1920, height: 1080 },
            },
        },
        
        // Tablet viewports
        {
            name: 'tablet-landscape',
            use: { 
                ...devices['iPad Pro'],
                viewport: { width: 1024, height: 768 },
            },
        },
        {
            name: 'tablet-portrait',
            use: { 
                ...devices['iPad Pro'],
                viewport: { width: 768, height: 1024 },
            },
        },
        
        // Mobile viewports
        {
            name: 'mobile-android',
            use: { 
                ...devices['Pixel 5'],
                viewport: { width: 393, height: 851 },
            },
        },
        {
            name: 'mobile-ios',
            use: { 
                ...devices['iPhone 12'],
                viewport: { width: 390, height: 844 },
            },
        },
        
        // Large screen testing
        {
            name: 'large-screen',
            use: { 
                ...devices['Desktop Chrome'],
                viewport: { width: 2560, height: 1440 },
            },
        },
    ],
    
    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm run dev',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
    
    /* Visual testing output directories */
    outputDir: 'test-results/visual-output',
    
    /* Visual testing timeouts */
    timeout: 60 * 1000,
    
    /* Expect timeout for visual assertions */
    expect: {
        timeout: 30 * 1000,
        // Visual comparison settings
        toHaveScreenshot: {
            // Allow for minor differences in rendering
            threshold: 0.3,
            maxDiffPixels: 100,
        },
        toHaveScreenshot: {
            threshold: 0.3,
            maxDiffPixels: 100,
        },
    },
});