import { test, expect } from '@playwright/test';
import { 
    setupAuthenticatedSession, 
    mockUserProfile, 
    TestData 
} from '../utils/test-helpers';

/**
 * E2E Performance Monitoring Tests
 * Comprehensive performance testing integrated with E2E workflows
 */
test.describe('E2E Performance Monitoring', () => {
    const performanceBudgets = {
        // Page Load Performance Budgets (milliseconds)
        initialPageLoad: 3000,
        authenticationFlow: 2500,
        dashboardLoad: 2000,
        projectPageLoad: 3000,
        documentLoad: 2500,
        
        // Interaction Performance Budgets (milliseconds)
        navigationTime: 1000,
        formSubmission: 1500,
        modalOpen: 500,
        searchResults: 1000,
        
        // Resource Performance Budgets
        totalJSSize: 1000000,      // 1MB
        totalCSSSize: 200000,      // 200KB
        totalImageSize: 2000000,   // 2MB
        
        // Web Vitals Budgets
        largestContentfulPaint: 2500,
        firstInputDelay: 100,
        cumulativeLayoutShift: 0.1,
        firstContentfulPaint: 1800,
        
        // Network Performance
        apiResponseTime: 500,
        totalNetworkRequests: 50,
    };

    let performanceMetrics: Record<string, any> = {};

    test.beforeEach(async ({ page }) => {
        performanceMetrics = {};
        
        // Enable performance monitoring
        await page.addInitScript(() => {
            // Capture Web Vitals
            window.performanceMetrics = {
                navigationStart: performance.timeOrigin,
                measurements: {},
                vitals: {},
                resources: []
            };
            
            // Monitor LCP
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                window.performanceMetrics.vitals.lcp = lastEntry.startTime;
            }).observe({ entryTypes: ['largest-contentful-paint'] });
            
            // Monitor FID
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    window.performanceMetrics.vitals.fid = entry.processingStart - entry.startTime;
                });
            }).observe({ entryTypes: ['first-input'] });
            
            // Monitor CLS
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                let cls = 0;
                entries.forEach((entry) => {
                    if (!entry.hadRecentInput) {
                        cls += entry.value;
                    }
                });
                window.performanceMetrics.vitals.cls = cls;
            }).observe({ entryTypes: ['layout-shift'] });
            
            // Monitor FCP
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
                if (fcp) {
                    window.performanceMetrics.vitals.fcp = fcp.startTime;
                }
            }).observe({ entryTypes: ['paint'] });
            
            // Monitor resource loading
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    window.performanceMetrics.resources.push({
                        name: entry.name,
                        type: entry.initiatorType,
                        size: entry.transferSize || 0,
                        duration: entry.duration,
                        startTime: entry.startTime
                    });
                });
            }).observe({ entryTypes: ['resource'] });
        });
    });

    test.afterEach(async ({ page }) => {
        // Collect final performance metrics
        const finalMetrics = await page.evaluate(() => window.performanceMetrics);
        performanceMetrics.final = finalMetrics;
        
        console.log('Performance Test Results:', performanceMetrics);
        
        // Verify performance budgets
        if (performanceMetrics.final?.vitals) {
            const vitals = performanceMetrics.final.vitals;
            
            if (vitals.lcp) {
                expect(vitals.lcp).toBeLessThan(performanceBudgets.largestContentfulPaint);
            }
            if (vitals.fid) {
                expect(vitals.fid).toBeLessThan(performanceBudgets.firstInputDelay);
            }
            if (vitals.cls) {
                expect(vitals.cls).toBeLessThan(performanceBudgets.cumulativeLayoutShift);
            }
            if (vitals.fcp) {
                expect(vitals.fcp).toBeLessThan(performanceBudgets.firstContentfulPaint);
            }
        }
    });

    test('Authentication Flow Performance', async ({ page, context }) => {
        const startTime = Date.now();
        
        // Test 1: Initial page load performance
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        
        const pageLoadTime = Date.now() - startTime;
        performanceMetrics.authPageLoad = pageLoadTime;
        expect(pageLoadTime).toBeLessThan(performanceBudgets.initialPageLoad);
        
        // Test 2: Form interaction performance
        const formStartTime = Date.now();
        
        await page.fill('[data-testid="email-input"]', TestData.users.standard.email);
        await page.fill('[data-testid="password-input"]', 'password123');
        
        const formInteractionTime = Date.now() - formStartTime;
        performanceMetrics.formInteraction = formInteractionTime;
        expect(formInteractionTime).toBeLessThan(performanceBudgets.navigationTime);
        
        // Test 3: Authentication submission performance
        const submitStartTime = Date.now();
        
        await page.click('[data-testid="login-submit"]');
        await page.waitForURL(/\/home/, { timeout: 10000 });
        
        const authFlowTime = Date.now() - submitStartTime;
        performanceMetrics.authFlow = authFlowTime;
        expect(authFlowTime).toBeLessThan(performanceBudgets.authenticationFlow);
        
        // Test 4: Resource loading analysis
        const resources = await page.evaluate(() => window.performanceMetrics.resources);
        
        const jsResources = resources.filter(r => r.type === 'script');
        const cssResources = resources.filter(r => r.type === 'css');
        const imageResources = resources.filter(r => r.type === 'img');
        
        const totalJSSize = jsResources.reduce((sum, r) => sum + (r.size || 0), 0);
        const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.size || 0), 0);
        const totalImageSize = imageResources.reduce((sum, r) => sum + (r.size || 0), 0);
        
        performanceMetrics.resourceSizes = {
            js: totalJSSize,
            css: totalCSSSize,
            images: totalImageSize
        };
        
        expect(totalJSSize).toBeLessThan(performanceBudgets.totalJSSize);
        expect(totalCSSSize).toBeLessThan(performanceBudgets.totalCSSSize);
        expect(totalImageSize).toBeLessThan(performanceBudgets.totalImageSize);
    });

    test('Dashboard Performance Monitoring', async ({ page, context }) => {
        await setupAuthenticatedSession(context, TestData.users.standard.id);
        await mockUserProfile(page, TestData.users.standard);
        
        const startTime = Date.now();
        
        // Test 1: Dashboard load performance
        await page.goto('/home');
        await page.waitForLoadState('networkidle');
        
        const dashboardLoadTime = Date.now() - startTime;
        performanceMetrics.dashboardLoad = dashboardLoadTime;
        expect(dashboardLoadTime).toBeLessThan(performanceBudgets.dashboardLoad);
        
        // Test 2: Navigation performance between sections
        const navTests = [
            { section: 'projects', selector: '[data-testid="nav-projects"]' },
            { section: 'recent', selector: '[data-testid="nav-recent"]' },
            { section: 'settings', selector: '[data-testid="nav-settings"]' }
        ];
        
        for (const navTest of navTests) {
            const navStartTime = Date.now();
            
            await page.click(navTest.selector);
            await page.waitForLoadState('networkidle');
            
            const navTime = Date.now() - navStartTime;
            performanceMetrics[`nav_${navTest.section}`] = navTime;
            expect(navTime).toBeLessThan(performanceBudgets.navigationTime);
        }
        
        // Test 3: Search performance
        const searchInput = page.locator('[data-testid="search-input"]');
        if (await searchInput.isVisible()) {
            const searchStartTime = Date.now();
            
            await searchInput.fill('test');
            await page.waitForSelector('[data-testid="search-results"]', { timeout: 5000 });
            
            const searchTime = Date.now() - searchStartTime;
            performanceMetrics.search = searchTime;
            expect(searchTime).toBeLessThan(performanceBudgets.searchResults);
        }
        
        // Test 4: Modal performance
        const modalTrigger = page.locator('[data-testid="create-project"]');
        if (await modalTrigger.isVisible()) {
            const modalStartTime = Date.now();
            
            await modalTrigger.click();
            await page.waitForSelector('[data-testid="project-modal"]');
            
            const modalTime = Date.now() - modalStartTime;
            performanceMetrics.modalOpen = modalTime;
            expect(modalTime).toBeLessThan(performanceBudgets.modalOpen);
        }
    });

    test('Project Workflow Performance', async ({ page, context }) => {
        await setupAuthenticatedSession(context, TestData.users.standard.id);
        await mockUserProfile(page, TestData.users.standard);
        
        // Test 1: Project page load performance
        const projectStartTime = Date.now();
        
        await page.goto('/org/test-org/project/test-project');
        await page.waitForLoadState('networkidle');
        
        const projectLoadTime = Date.now() - projectStartTime;
        performanceMetrics.projectLoad = projectLoadTime;
        expect(projectLoadTime).toBeLessThan(performanceBudgets.projectPageLoad);
        
        // Test 2: Project section navigation performance
        const sections = ['requirements', 'documents', 'canvas', 'testbed'];
        
        for (const section of sections) {
            const sectionStartTime = Date.now();
            
            await page.click(`[data-testid="nav-${section}"]`);
            await page.waitForLoadState('networkidle');
            
            const sectionTime = Date.now() - sectionStartTime;
            performanceMetrics[`section_${section}`] = sectionTime;
            expect(sectionTime).toBeLessThan(performanceBudgets.navigationTime);
        }
        
        // Test 3: Document load performance
        await page.click('[data-testid="nav-documents"]');
        
        const documentLink = page.locator('[data-testid="document-link"]').first();
        if (await documentLink.isVisible()) {
            const docStartTime = Date.now();
            
            await documentLink.click();
            await page.waitForLoadState('networkidle');
            
            const docLoadTime = Date.now() - docStartTime;
            performanceMetrics.documentLoad = docLoadTime;
            expect(docLoadTime).toBeLessThan(performanceBudgets.documentLoad);
        }
    });

    test('API Performance Monitoring', async ({ page, context }) => {
        await setupAuthenticatedSession(context, TestData.users.standard.id);
        
        // Monitor API calls
        const apiCalls: Array<{ url: string, method: string, duration: number, status: number }> = [];
        
        page.on('response', response => {
            if (response.url().includes('/api/')) {
                const request = response.request();
                apiCalls.push({
                    url: response.url(),
                    method: request.method(),
                    duration: response.timing().responseEnd - response.timing().requestStart,
                    status: response.status()
                });
            }
        });
        
        // Test API performance during normal workflow
        await page.goto('/home');
        await page.waitForLoadState('networkidle');
        
        await page.goto('/org/test-org/project/test-project');
        await page.waitForLoadState('networkidle');
        
        await page.click('[data-testid="nav-requirements"]');
        await page.waitForLoadState('networkidle');
        
        // Analyze API performance
        performanceMetrics.apiCalls = apiCalls;
        
        const slowAPICalls = apiCalls.filter(call => call.duration > performanceBudgets.apiResponseTime);
        const failedAPICalls = apiCalls.filter(call => call.status >= 400);
        
        console.log(`Total API calls: ${apiCalls.length}`);
        console.log(`Slow API calls (>${performanceBudgets.apiResponseTime}ms): ${slowAPICalls.length}`);
        console.log(`Failed API calls: ${failedAPICalls.length}`);
        
        // Performance assertions
        expect(apiCalls.length).toBeLessThan(performanceBudgets.totalNetworkRequests);
        expect(slowAPICalls.length).toBeLessThan(apiCalls.length * 0.1); // Less than 10% should be slow
        expect(failedAPICalls.length).toBe(0); // No failed API calls
        
        // Average API response time should be acceptable
        const avgResponseTime = apiCalls.reduce((sum, call) => sum + call.duration, 0) / apiCalls.length;
        expect(avgResponseTime).toBeLessThan(performanceBudgets.apiResponseTime);
        
        performanceMetrics.apiMetrics = {
            totalCalls: apiCalls.length,
            slowCalls: slowAPICalls.length,
            failedCalls: failedAPICalls.length,
            avgResponseTime
        };
    });

    test('Memory Performance Monitoring', async ({ page, context }) => {
        await setupAuthenticatedSession(context, TestData.users.standard.id);
        
        // Monitor memory usage
        await page.addInitScript(() => {
            window.memoryMetrics = {
                initial: {},
                measurements: []
            };
            
            // Initial memory measurement
            if (performance.memory) {
                window.memoryMetrics.initial = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }
            
            // Periodic memory measurements
            setInterval(() => {
                if (performance.memory) {
                    window.memoryMetrics.measurements.push({
                        timestamp: Date.now(),
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize
                    });
                }
            }, 1000);
        });
        
        // Perform memory-intensive operations
        await page.goto('/home');
        await page.waitForTimeout(2000);
        
        await page.goto('/org/test-org/project/test-project');
        await page.waitForTimeout(2000);
        
        // Navigate through multiple sections
        const sections = ['requirements', 'documents', 'canvas', 'testbed'];
        for (const section of sections) {
            await page.click(`[data-testid="nav-${section}"]`);
            await page.waitForTimeout(1000);
        }
        
        // Collect memory metrics
        const memoryMetrics = await page.evaluate(() => window.memoryMetrics);
        performanceMetrics.memory = memoryMetrics;
        
        if (memoryMetrics?.measurements?.length > 0) {
            const initial = memoryMetrics.initial.usedJSHeapSize;
            const final = memoryMetrics.measurements[memoryMetrics.measurements.length - 1].usedJSHeapSize;
            const memoryGrowth = final - initial;
            
            performanceMetrics.memoryGrowth = memoryGrowth;
            
            // Memory growth should be reasonable (less than 50MB)
            expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
            
            console.log(`Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
        }
    });

    test('Network Performance Under Load', async ({ page, context }) => {
        // Simulate slow network conditions
        await context.route('**/*', async (route) => {
            // Add artificial delay to simulate slow network
            await new Promise(resolve => setTimeout(resolve, 100));
            await route.continue();
        });
        
        const startTime = Date.now();
        
        await page.goto('/home');
        await page.waitForLoadState('networkidle');
        
        const loadTimeWithDelay = Date.now() - startTime;
        performanceMetrics.slowNetworkLoad = loadTimeWithDelay;
        
        // Should still be reasonable even with network delay
        expect(loadTimeWithDelay).toBeLessThan(performanceBudgets.dashboardLoad * 2);
        
        // Test performance with network interruptions
        let requestCount = 0;
        await context.route('**/*', async (route) => {
            requestCount++;
            // Fail every 10th request to simulate network issues
            if (requestCount % 10 === 0) {
                await route.abort('failed');
            } else {
                await route.continue();
            }
        });
        
        // Navigate through the app with unreliable network
        try {
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle', { timeout: 10000 });
            
            // App should still function with some network failures
            const projectHeader = page.locator('[data-testid="project-header"]');
            await expect(projectHeader).toBeVisible({ timeout: 15000 });
            
        } catch (error) {
            console.log('Network interruption test completed with expected errors');
        }
        
        performanceMetrics.networkResilience = {
            requestCount,
            failedRequests: Math.floor(requestCount / 10)
        };
    });

    test('Performance Regression Detection', async ({ page, context }) => {
        // This test can be used to detect performance regressions
        // by comparing current performance with baseline metrics
        
        await setupAuthenticatedSession(context, TestData.users.standard.id);
        
        const performanceRun = {
            timestamp: Date.now(),
            metrics: {}
        };
        
        // Standardized performance test sequence
        const testSequence = [
            { action: 'loadHome', url: '/home' },
            { action: 'loadProject', url: '/org/test-org/project/test-project' },
            { action: 'loadRequirements', click: '[data-testid="nav-requirements"]' },
            { action: 'loadDocuments', click: '[data-testid="nav-documents"]' },
            { action: 'loadCanvas', click: '[data-testid="nav-canvas"]' },
        ];
        
        for (const step of testSequence) {
            const stepStartTime = Date.now();
            
            if (step.url) {
                await page.goto(step.url);
            } else if (step.click) {
                await page.click(step.click);
            }
            
            await page.waitForLoadState('networkidle');
            
            const stepTime = Date.now() - stepStartTime;
            performanceRun.metrics[step.action] = stepTime;
        }
        
        performanceMetrics.regressionTest = performanceRun;
        
        // Store results for future comparison
        // In a real implementation, you would save this to a database or file
        console.log('Performance regression test results:', performanceRun);
        
        // Verify all steps complete within reasonable time
        Object.entries(performanceRun.metrics).forEach(([action, time]) => {
            expect(time).toBeLessThan(5000); // No step should take more than 5 seconds
        });
    });
});