import { chromium, FullConfig } from '@playwright/test';
import { coverageTracker } from './coverage-mapping/coverage-tracker';

/**
 * Global setup for enhanced E2E testing
 * Runs once before all test files
 */
async function globalSetup(config: FullConfig) {
    console.log('🚀 Starting Enhanced E2E Test Suite Global Setup...');
    
    const startTime = Date.now();
    
    try {
        // 1. Initialize coverage tracking
        console.log('📊 Initializing test coverage tracking...');
        
        // 2. Validate test environment
        console.log('🔧 Validating test environment...');
        await validateTestEnvironment();
        
        // 3. Setup test data
        console.log('📝 Setting up test data...');
        await setupTestData();
        
        // 4. Verify application is ready
        console.log('🌐 Verifying application availability...');
        await verifyApplicationReady(config);
        
        // 5. Initialize performance monitoring
        console.log('⚡ Initializing performance monitoring...');
        await initializePerformanceMonitoring();
        
        // 6. Setup visual regression baselines
        console.log('🎨 Preparing visual regression testing...');
        await prepareVisualRegression();
        
        // 7. Initialize accessibility testing
        console.log('♿ Setting up accessibility testing...');
        await initializeAccessibilityTesting();
        
        const setupTime = Date.now() - startTime;
        console.log(`✅ Global setup completed in ${setupTime}ms`);
        
        // Store setup metadata
        await storeSetupMetadata(setupTime);
        
    } catch (error) {
        console.error('❌ Global setup failed:', error);
        throw error;
    }
}

async function validateTestEnvironment(): Promise<void> {
    const requiredEnvVars = [
        'NODE_ENV',
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    // Validate test data directories exist
    const fs = require('fs');
    const testDirs = [
        'test-results',
        'test-results/enhanced-e2e-output',
        'test-results/enhanced-e2e-report',
        'test-results/agent-context',
        'test-results/screenshots',
        'test-results/videos',
        'test-results/traces',
    ];
    
    testDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
    
    console.log('   ✓ Environment variables validated');
    console.log('   ✓ Test directories created');
}

async function setupTestData(): Promise<void> {
    // Initialize test data for consistent testing
    const testData = {
        users: {
            standard: {
                id: 'test_user_123',
                email: 'test@example.com',
                fullName: 'Test User',
                password: 'TestPassword123!',
            },
            admin: {
                id: 'admin_user_456',
                email: 'admin@example.com',
                fullName: 'Admin User',
                password: 'AdminPassword123!',
            },
        },
        organizations: {
            default: {
                id: 'test-org-123',
                name: 'Test Organization',
                slug: 'test-org',
            },
        },
        projects: {
            default: {
                id: 'test-project-123',
                name: 'Test Project',
                description: 'A test project for E2E testing',
            },
        },
    };
    
    // Store test data for use across tests
    const fs = require('fs');
    fs.writeFileSync(
        'test-results/agent-context/test-data.json',
        JSON.stringify(testData, null, 2)
    );
    
    console.log('   ✓ Test data prepared');
}

async function verifyApplicationReady(config: FullConfig): Promise<void> {
    const webServer = config.webServer;
    if (!webServer) {
        console.log('   ⚠️ No web server configured, skipping availability check');
        return;
    }
    
    const maxRetries = 30;
    const retryInterval = 2000;
    let retries = 0;
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    while (retries < maxRetries) {
        try {
            const baseURL = config.use?.baseURL || webServer.url || 'http://localhost:3000';
            const response = await page.goto(baseURL, { 
                waitUntil: 'networkidle',
                timeout: 10000 
            });
            
            if (response && response.ok()) {
                console.log(`   ✓ Application ready at ${baseURL}`);
                break;
            }
        } catch (error) {
            retries++;
            if (retries === maxRetries) {
                await browser.close();
                throw new Error(`Application not ready after ${maxRetries} attempts: ${error}`);
            }
            
            console.log(`   ⏳ Waiting for application... (attempt ${retries}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
    }
    
    await browser.close();
}

async function initializePerformanceMonitoring(): Promise<void> {
    // Setup performance monitoring configuration
    const performanceConfig = {
        budgets: {
            pageLoad: 3000,
            navigationTime: 1000,
            apiResponse: 500,
            largestContentfulPaint: 2500,
            firstInputDelay: 100,
            cumulativeLayoutShift: 0.1,
        },
        monitoring: {
            enabled: true,
            collectWebVitals: true,
            trackApiCalls: true,
            measureInteractions: true,
        },
    };
    
    const fs = require('fs');
    fs.writeFileSync(
        'test-results/agent-context/performance-config.json',
        JSON.stringify(performanceConfig, null, 2)
    );
    
    console.log('   ✓ Performance monitoring configured');
}

async function prepareVisualRegression(): Promise<void> {
    // Setup visual regression testing configuration
    const visualConfig = {
        threshold: 0.2,
        mode: 'percent',
        updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
        platforms: ['chromium', 'firefox', 'webkit'],
        viewports: [
            { width: 1920, height: 1080, name: 'desktop' },
            { width: 768, height: 1024, name: 'tablet' },
            { width: 375, height: 667, name: 'mobile' },
        ],
    };
    
    // Ensure visual test directories exist
    const fs = require('fs');
    const visualDirs = [
        'test-results/screenshots',
        'test-results/visual-diffs',
        'tests/e2e/enhanced-visual-regression/screenshots',
    ];
    
    visualDirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
    
    fs.writeFileSync(
        'test-results/agent-context/visual-config.json',
        JSON.stringify(visualConfig, null, 2)
    );
    
    console.log('   ✓ Visual regression testing prepared');
}

async function initializeAccessibilityTesting(): Promise<void> {
    // Setup accessibility testing configuration
    const a11yConfig = {
        standards: ['WCAG2A', 'WCAG2AA', 'WCAG21AA'],
        rules: {
            'color-contrast': true,
            'keyboard-navigation': true,
            'screen-reader': true,
            'focus-management': true,
        },
        testing: {
            injectAxe: true,
            checkAllPages: true,
            generateReport: true,
        },
    };
    
    const fs = require('fs');
    fs.writeFileSync(
        'test-results/agent-context/accessibility-config.json',
        JSON.stringify(a11yConfig, null, 2)
    );
    
    console.log('   ✓ Accessibility testing initialized');
}

async function storeSetupMetadata(setupTime: number): Promise<void> {
    const metadata = {
        timestamp: new Date().toISOString(),
        setupTime,
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            ci: !!process.env.CI,
            testEnvironment: process.env.NODE_ENV,
        },
        configuration: {
            parallelExecution: true,
            visualRegression: true,
            performanceMonitoring: true,
            accessibilityTesting: true,
            crossBrowserTesting: true,
            mobileDeviceTesting: true,
        },
        testSuites: {
            comprehensive: true,
            userJourneys: true,
            visualRegression: true,
            performance: true,
            accessibility: true,
            security: true,
        },
    };
    
    const fs = require('fs');
    fs.writeFileSync(
        'test-results/agent-context/setup-metadata.json',
        JSON.stringify(metadata, null, 2)
    );
    
    console.log('   ✓ Setup metadata stored');
}

export default globalSetup;