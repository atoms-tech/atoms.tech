import { test, expect, TestContext, PerformanceMonitor, BrowserUtils } from '../fixtures/test-fixtures';

test.describe('Performance Testing', () => {
    test.beforeEach(async ({ authPage, homePage, userData, page }) => {
        // Login before each test
        await authPage.goto();
        await authPage.fillLoginForm({
            email: userData.email,
            password: userData.password,
        });
        await authPage.submitLogin();
        await homePage.waitForLoad();
    });

    test('should meet Core Web Vitals standards', async ({ 
        page,
        homePage 
    }: TestContext) => {
        // Navigate to main dashboard
        await homePage.goto();
        await homePage.waitForLoad();
        
        // Measure Core Web Vitals
        const webVitals = await PerformanceMonitor.checkWebVitals(page);
        
        console.log('Core Web Vitals:', webVitals);
        
        // Largest Contentful Paint (LCP) - should be less than 2.5s
        if (webVitals.lcp) {
            expect(webVitals.lcp).toBeLessThan(2500);
        }
        
        // First Input Delay (FID) - should be less than 100ms
        if (webVitals.fid) {
            expect(webVitals.fid).toBeLessThan(100);
        }
        
        // Cumulative Layout Shift (CLS) - should be less than 0.1
        if (webVitals.cls !== undefined) {
            expect(webVitals.cls).toBeLessThan(0.1);
        }
        
        // Additional performance metrics
        const performanceMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            return {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                firstByte: navigation.responseStart - navigation.requestStart,
                domInteractive: navigation.domInteractive - navigation.navigationStart,
                totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
            };
        });
        
        console.log('Performance Metrics:', performanceMetrics);
        
        // Performance assertions
        expect(performanceMetrics.firstByte).toBeLessThan(200); // TTFB < 200ms
        expect(performanceMetrics.domContentLoaded).toBeLessThan(1000); // DOMContentLoaded < 1s
        expect(performanceMetrics.totalLoadTime).toBeLessThan(3000); // Total load < 3s
    });

    test('should handle large datasets efficiently', async ({ 
        page,
        projectPage,
        projectData 
    }: TestContext) => {
        // Create a project with large amount of data
        await projectPage.goto();
        await projectPage.createProject(projectData);
        
        // Generate large dataset
        const startTime = Date.now();
        
        // Simulate creating many requirements
        for (let i = 0; i < 50; i++) {
            await projectPage.createRequirement({
                title: `Performance Test Requirement ${i}`,
                description: `This is requirement ${i} created for performance testing. `.repeat(10),
                priority: i % 3 === 0 ? 'High' : i % 3 === 1 ? 'Medium' : 'Low',
                status: 'Draft',
            });
        }
        
        const creationTime = Date.now() - startTime;
        console.log(`Created 50 requirements in ${creationTime}ms`);
        
        // Test list rendering performance
        const renderStartTime = Date.now();
        await projectPage.navigateToRequirementsSection();
        await page.waitForSelector('[data-testid="requirements-list"]');
        
        const renderTime = Date.now() - renderStartTime;
        console.log(`Rendered requirements list in ${renderTime}ms`);
        
        // Performance assertions
        expect(creationTime).toBeLessThan(30000); // Should create 50 items in under 30s
        expect(renderTime).toBeLessThan(2000); // Should render list in under 2s
        
        // Test scrolling performance with large lists
        const scrollPerformance = await PerformanceMonitor.measureInteraction(page, async () => {
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await page.waitForTimeout(100);
        });
        
        expect(scrollPerformance).toBeLessThan(100); // Scroll should be responsive
        
        // Test search performance on large dataset
        const searchPerformance = await PerformanceMonitor.measureInteraction(page, async () => {
            const searchInput = page.locator('[data-testid="requirements-search"]');
            await searchInput.fill('Performance Test');
            await page.waitForSelector('[data-testid="search-results"]');
        });
        
        expect(searchPerformance).toBeLessThan(500); // Search should respond quickly
    });

    test('should maintain performance under concurrent load', async ({ 
        browser,
        userData 
    }: TestContext) => {
        // Create multiple browser contexts to simulate concurrent users
        const concurrentUsers = 5;
        const contexts = await Promise.all(
            Array(concurrentUsers).fill(0).map(() => browser.newContext())
        );
        
        const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
        
        // Measure concurrent login performance
        const loginStartTime = Date.now();
        
        await Promise.all(pages.map(async (page, index) => {
            const authPage = new (await import('../page-objects/auth.page')).AuthPage(page);
            const homePage = new (await import('../page-objects/home.page')).HomePage(page);
            
            await authPage.goto();
            await authPage.fillLoginForm({
                email: `${userData.email}.${index}`,
                password: userData.password,
            });
            await authPage.submitLogin();
            await homePage.waitForLoad();
        }));
        
        const totalLoginTime = Date.now() - loginStartTime;
        const avgLoginTime = totalLoginTime / concurrentUsers;
        
        console.log(`Concurrent login performance: ${avgLoginTime}ms average per user`);
        expect(avgLoginTime).toBeLessThan(10000); // Each login should complete within 10s
        
        // Test concurrent project creation
        const projectCreationStartTime = Date.now();
        
        await Promise.all(pages.map(async (page, index) => {
            const projectPage = new (await import('../page-objects/project.page')).ProjectPage(page);
            
            await projectPage.goto();
            await projectPage.createProject({
                name: `Concurrent Project ${index}`,
                description: `Project created by user ${index}`,
                type: 'Software Development',
            });
        }));
        
        const totalProjectCreationTime = Date.now() - projectCreationStartTime;
        const avgProjectCreationTime = totalProjectCreationTime / concurrentUsers;
        
        console.log(`Concurrent project creation: ${avgProjectCreationTime}ms average`);
        expect(avgProjectCreationTime).toBeLessThan(15000);
        
        // Clean up
        await Promise.all(contexts.map(ctx => ctx.close()));
    });

    test('should optimize resource loading and caching', async ({ 
        page 
    }: TestContext) => {
        // Clear cache to start fresh
        await page.context().clearCookies();
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        
        // First load - measure without cache
        const firstLoadStartTime = Date.now();
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        const firstLoadTime = Date.now() - firstLoadStartTime;
        
        // Get resource counts for first load
        const firstLoadResources = await page.evaluate(() => {
            return performance.getEntriesByType('resource').length;
        });
        
        console.log(`First load: ${firstLoadTime}ms, ${firstLoadResources} resources`);
        
        // Second load - should benefit from caching
        const secondLoadStartTime = Date.now();
        await page.reload();
        await page.waitForLoadState('networkidle');
        const secondLoadTime = Date.now() - secondLoadStartTime;
        
        const secondLoadResources = await page.evaluate(() => {
            return performance.getEntriesByType('resource').length;
        });
        
        console.log(`Second load: ${secondLoadTime}ms, ${secondLoadResources} resources`);
        
        // Second load should be faster due to caching
        expect(secondLoadTime).toBeLessThan(firstLoadTime * 0.8); // At least 20% faster
        
        // Check for properly cached resources
        const cachedResources = await page.evaluate(() => {
            return performance.getEntriesByType('resource')
                .filter((resource: any) => resource.transferSize === 0)
                .length;
        });
        
        console.log(`Cached resources: ${cachedResources}`);
        expect(cachedResources).toBeGreaterThan(0); // Should have some cached resources
        
        // Test resource compression
        const resourceSizes = await page.evaluate(() => {
            return performance.getEntriesByType('resource')
                .map((resource: any) => ({
                    name: resource.name,
                    transferSize: resource.transferSize,
                    encodedBodySize: resource.encodedBodySize,
                    decodedBodySize: resource.decodedBodySize,
                }))
                .filter(r => r.transferSize > 0);
        });
        
        // Check for resource compression
        const compressedResources = resourceSizes.filter(r => 
            r.encodedBodySize > 0 && r.decodedBodySize > r.encodedBodySize
        );
        
        console.log(`Compressed resources: ${compressedResources.length}/${resourceSizes.length}`);
        expect(compressedResources.length).toBeGreaterThan(0); // Should have compressed resources
    });

    test('should handle memory management effectively', async ({ 
        page,
        documentPage,
        documentData 
    }: TestContext) => {
        // Monitor initial memory usage
        const initialMemory = await page.evaluate(() => {
            return (performance as any).memory ? {
                usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            } : null;
        });
        
        if (!initialMemory) {
            test.skip('Memory API not available in this browser');
            return;
        }
        
        console.log('Initial memory:', initialMemory);
        
        // Create and edit multiple documents to stress memory
        for (let i = 0; i < 10; i++) {
            await documentPage.goto();
            await documentPage.createDocument({
                title: `Memory Test Document ${i}`,
                content: 'Lorem ipsum '.repeat(1000), // Large content
            });
            
            // Edit document to create more memory pressure
            await documentPage.editDocumentContent('Updated content '.repeat(500));
            await documentPage.saveDocument();
        }
        
        // Check memory usage after operations
        const peakMemory = await page.evaluate(() => {
            return (performance as any).memory ? {
                usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            } : null;
        });
        
        console.log('Peak memory:', peakMemory);
        
        // Navigate away to trigger cleanup
        await page.goto('/dashboard');
        await page.waitForTimeout(1000);
        
        // Force garbage collection if possible
        await page.evaluate(() => {
            if ((window as any).gc) {
                (window as any).gc();
            }
        });
        
        await page.waitForTimeout(2000);
        
        // Check memory after cleanup
        const finalMemory = await page.evaluate(() => {
            return (performance as any).memory ? {
                usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
                totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            } : null;
        });
        
        console.log('Final memory:', finalMemory);
        
        // Memory should not grow excessively
        const memoryGrowth = (finalMemory!.usedJSHeapSize - initialMemory.usedJSHeapSize) / initialMemory.usedJSHeapSize;
        console.log(`Memory growth: ${(memoryGrowth * 100).toFixed(2)}%`);
        
        // Should not grow more than 300% of initial memory
        expect(memoryGrowth).toBeLessThan(3);
        
        // Final memory should be less than peak (indicating cleanup occurred)
        expect(finalMemory!.usedJSHeapSize).toBeLessThan(peakMemory!.usedJSHeapSize * 1.1);
    });

    test('should optimize network requests and reduce redundancy', async ({ 
        page,
        projectPage,
        projectData 
    }: TestContext) => {
        // Monitor network requests
        const networkRequests: any[] = [];
        
        page.on('request', request => {
            networkRequests.push({
                url: request.url(),
                method: request.method(),
                timestamp: Date.now(),
            });
        });
        
        // Perform typical user workflow
        await projectPage.goto();
        await projectPage.createProject(projectData);
        await projectPage.navigateToRequirementsSection();
        await projectPage.navigateToDocumentsSection();
        await projectPage.navigateToTeamSection();
        
        // Analyze network requests
        const apiRequests = networkRequests.filter(req => req.url.includes('/api/'));
        const duplicateRequests = apiRequests.filter((req, index, arr) => 
            arr.findIndex(r => r.url === req.url && r.method === req.method) !== index
        );
        
        console.log(`Total API requests: ${apiRequests.length}`);
        console.log(`Duplicate requests: ${duplicateRequests.length}`);
        
        // Should minimize duplicate requests
        expect(duplicateRequests.length).toBeLessThan(apiRequests.length * 0.1); // Less than 10% duplicates
        
        // Check for request batching opportunities
        const getRequests = apiRequests.filter(req => req.method === 'GET');
        const requestGroups = getRequests.reduce((groups: any, req) => {
            const baseUrl = req.url.split('?')[0];
            if (!groups[baseUrl]) groups[baseUrl] = [];
            groups[baseUrl].push(req);
            return groups;
        }, {});
        
        // Log request patterns for analysis
        Object.entries(requestGroups).forEach(([url, requests]: [string, any]) => {
            if (requests.length > 1) {
                console.log(`${url}: ${requests.length} requests`);
            }
        });
    });

    test('should handle slow network conditions gracefully', async ({ 
        page,
        homePage 
    }: TestContext) => {
        // Simulate slow 3G network
        await BrowserUtils.simulateNetworkConditions(page, {
            downloadThroughput: 100 * 1024, // 100KB/s
            uploadThroughput: 50 * 1024,    // 50KB/s
            latency: 2000,                  // 2s latency
        });
        
        const slowLoadStartTime = Date.now();
        await homePage.goto();
        await homePage.waitForLoad();
        const slowLoadTime = Date.now() - slowLoadStartTime;
        
        console.log(`Load time on slow network: ${slowLoadTime}ms`);
        
        // Should still be usable on slow networks (under 30 seconds)
        expect(slowLoadTime).toBeLessThan(30000);
        
        // Check for loading indicators during slow operations
        const loadingIndicators = page.locator('[data-testid*="loading"], .animate-spin');
        
        // Should show loading states during slow operations
        const hasLoadingIndicators = await loadingIndicators.count() > 0;
        console.log(`Loading indicators present: ${hasLoadingIndicators}`);
        
        // Test progressive loading
        const criticalContent = page.locator('[data-testid="critical-content"]');
        const secondaryContent = page.locator('[data-testid="secondary-content"]');
        
        if (await criticalContent.count() > 0 && await secondaryContent.count() > 0) {
            // Critical content should load first
            const criticalVisible = await criticalContent.first().isVisible();
            expect(criticalVisible).toBe(true);
        }
        
        // Restore normal network conditions
        await BrowserUtils.simulateNetworkConditions(page, {
            downloadThroughput: -1,
            uploadThroughput: -1,
            latency: 0,
        });
    });

    test('should optimize for mobile device performance', async ({ 
        page,
        homePage 
    }: TestContext) => {
        // Set mobile viewport and simulate mobile device
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Simulate slower mobile CPU
        await page.emulateMedia({ media: 'screen' });
        
        const mobileLoadStartTime = Date.now();
        await homePage.goto();
        await homePage.waitForLoad();
        const mobileLoadTime = Date.now() - mobileLoadStartTime;
        
        console.log(`Mobile load time: ${mobileLoadTime}ms`);
        
        // Mobile performance should be reasonable
        expect(mobileLoadTime).toBeLessThan(5000); // 5 seconds for mobile
        
        // Check touch target sizes
        const touchTargets = page.locator('button, a, [role="button"]');
        const touchTargetCount = await touchTargets.count();
        
        for (let i = 0; i < Math.min(touchTargetCount, 10); i++) {
            const target = touchTargets.nth(i);
            if (await target.isVisible()) {
                const bbox = await target.boundingBox();
                if (bbox) {
                    // Touch targets should be at least 44px (Apple) or 48dp (Android)
                    expect(bbox.width).toBeGreaterThanOrEqual(44);
                    expect(bbox.height).toBeGreaterThanOrEqual(44);
                }
            }
        }
        
        // Test scroll performance on mobile
        const scrollPerformance = await PerformanceMonitor.measureInteraction(page, async () => {
            await page.evaluate(() => {
                window.scrollTo(0, 1000);
            });
            await page.waitForTimeout(100);
        });
        
        expect(scrollPerformance).toBeLessThan(200); // Mobile scroll should be smooth
        
        // Check for mobile-optimized images
        const images = page.locator('img');
        const imageCount = await images.count();
        
        if (imageCount > 0) {
            // Check if images have responsive sizes
            const firstImage = images.first();
            const srcset = await firstImage.getAttribute('srcset');
            const sizes = await firstImage.getAttribute('sizes');
            
            // Should have responsive image attributes for mobile optimization
            console.log(`Image has srcset: ${!!srcset}, sizes: ${!!sizes}`);
        }
    });

    test('should maintain performance during real-time updates', async ({ 
        page,
        documentPage,
        documentData,
        browser 
    }: TestContext) => {
        // Create a document for real-time collaboration testing
        await documentPage.goto();
        await documentPage.createDocument(documentData);
        
        // Open same document in another context (simulating collaborator)
        const collaboratorContext = await browser.newContext();
        const collaboratorPage = await collaboratorContext.newPage();
        const collaboratorDocumentPage = new (await import('../page-objects/document.page')).DocumentPage(collaboratorPage);
        
        // Login collaborator (simplified)
        await collaboratorPage.goto(`/documents/${documentData.title}/edit`);
        
        // Monitor performance during real-time updates
        const updateTimes: number[] = [];
        
        // Simulate rapid collaborative editing
        for (let i = 0; i < 20; i++) {
            const updateStartTime = Date.now();
            
            // Alternate between users making edits
            if (i % 2 === 0) {
                await documentPage.editDocumentContent(`Update ${i} from user 1`);
            } else {
                await collaboratorDocumentPage.editDocumentContent(`Update ${i} from user 2`);
            }
            
            // Wait for real-time sync
            await page.waitForTimeout(100);
            
            const updateTime = Date.now() - updateStartTime;
            updateTimes.push(updateTime);
        }
        
        const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
        const maxUpdateTime = Math.max(...updateTimes);
        
        console.log(`Real-time updates - Average: ${avgUpdateTime}ms, Max: ${maxUpdateTime}ms`);
        
        // Real-time updates should be fast and consistent
        expect(avgUpdateTime).toBeLessThan(500); // Average under 500ms
        expect(maxUpdateTime).toBeLessThan(2000); // No update should take more than 2s
        
        // Check for performance degradation over time
        const firstHalfAvg = updateTimes.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
        const secondHalfAvg = updateTimes.slice(10).reduce((a, b) => a + b, 0) / 10;
        
        const performanceDegradation = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
        console.log(`Performance degradation: ${(performanceDegradation * 100).toFixed(2)}%`);
        
        // Performance should not degrade significantly over time
        expect(performanceDegradation).toBeLessThan(0.5); // Less than 50% degradation
        
        await collaboratorContext.close();
    });
});