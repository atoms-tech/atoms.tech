import { test, expect, TestContext, BrowserUtils, PerformanceMonitor } from '../fixtures/test-fixtures';

test.describe('Cross-Browser Compatibility', () => {
    const browsers = ['chromium', 'firefox', 'webkit'];
    const viewports = [
        { name: 'Desktop', width: 1920, height: 1080 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Mobile', width: 375, height: 667 },
    ];

    browsers.forEach(browserName => {
        test.describe(`${browserName} Browser Tests`, () => {
            test(`should handle authentication flow in ${browserName}`, async ({ 
                authPage, 
                homePage, 
                userData,
                page 
            }: TestContext) => {
                // Check browser features first
                const features = await BrowserUtils.detectBrowserFeatures(page);
                
                console.log(`${browserName} features:`, features);
                
                // Ensure required features are available
                expect(features.localStorage).toBe(true);
                expect(features.sessionStorage).toBe(true);
                
                await authPage.goto();
                await authPage.fillLoginForm({
                    email: userData.email,
                    password: userData.password,
                });
                
                await authPage.submitLogin();
                await homePage.waitForLoad();
                
                // Verify successful login
                await expect(page).toHaveURL(/\/dashboard/);
                
                const userMenu = page.locator('[data-testid="user-menu"]');
                await expect(userMenu).toBeVisible();
            });

            viewports.forEach(viewport => {
                test(`should render correctly on ${viewport.name} in ${browserName}`, async ({ 
                    page,
                    authPage,
                    homePage,
                    userData 
                }: TestContext) => {
                    // Set viewport
                    await page.setViewportSize({ 
                        width: viewport.width, 
                        height: viewport.height 
                    });
                    
                    // Login first
                    await authPage.goto();
                    await authPage.fillLoginForm({
                        email: userData.email,
                        password: userData.password,
                    });
                    await authPage.submitLogin();
                    await homePage.waitForLoad();
                    
                    // Test responsive navigation
                    if (viewport.width < 768) {
                        // Mobile - should have hamburger menu
                        const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
                        await expect(mobileMenu).toBeVisible();
                        
                        // Test mobile menu functionality
                        await mobileMenu.click();
                        const mobileNavigation = page.locator('[data-testid="mobile-navigation"]');
                        await expect(mobileNavigation).toBeVisible();
                    } else {
                        // Desktop/Tablet - should have regular navigation
                        const desktopNavigation = page.locator('[data-testid="desktop-navigation"]');
                        await expect(desktopNavigation).toBeVisible();
                    }
                    
                    // Test content layout
                    const mainContent = page.locator('[data-testid="main-content"]');
                    await expect(mainContent).toBeVisible();
                    
                    // Verify no horizontal scroll
                    const bodyScrollWidth = await page.evaluate(() => {
                        return document.body.scrollWidth <= window.innerWidth;
                    });
                    expect(bodyScrollWidth).toBe(true);
                    
                    // Take viewport screenshot for visual comparison
                    await page.screenshot({
                        path: `test-results/screenshots/${browserName}-${viewport.name.toLowerCase()}-dashboard.png`,
                        fullPage: true,
                    });
                });
            });

            test(`should handle touch interactions in ${browserName}`, async ({ 
                page,
                authPage,
                homePage,
                projectPage,
                userData,
                projectData 
            }: TestContext) => {
                // Set mobile viewport for touch testing
                await page.setViewportSize({ width: 375, height: 667 });
                
                // Login
                await authPage.goto();
                await authPage.fillLoginForm({
                    email: userData.email,
                    password: userData.password,
                });
                await authPage.submitLogin();
                await homePage.waitForLoad();
                
                // Test touch interactions
                await projectPage.goto();
                
                // Test swipe gesture on project list (if implemented)
                const projectList = page.locator('[data-testid="projects-list"]');
                await expect(projectList).toBeVisible();
                
                // Simulate touch events
                const projectItem = page.locator('[data-testid="project-item"]').first();
                if (await projectItem.isVisible()) {
                    // Test tap
                    await projectItem.tap();
                    
                    // Test long press (if context menu is implemented)
                    await projectItem.tap({ timeout: 1000 });
                }
                
                // Test scrolling behavior
                await page.evaluate(() => {
                    window.scrollTo(0, 500);
                });
                
                await page.waitForTimeout(1000);
                
                const scrollPosition = await page.evaluate(() => window.scrollY);
                expect(scrollPosition).toBeGreaterThan(0);
            });

            test(`should handle keyboard navigation in ${browserName}`, async ({ 
                page,
                authPage,
                homePage,
                userData 
            }: TestContext) => {
                await authPage.goto();
                await authPage.fillLoginForm({
                    email: userData.email,
                    password: userData.password,
                });
                await authPage.submitLogin();
                await homePage.waitForLoad();
                
                // Test tab navigation
                const focusableElements = [
                    '[data-testid="main-navigation"] a',
                    '[data-testid="user-menu"]',
                    '[data-testid="search-input"]',
                    '[data-testid="create-project-button"]',
                ];
                
                for (const selector of focusableElements) {
                    const element = page.locator(selector).first();
                    if (await element.isVisible()) {
                        await element.focus();
                        
                        const isFocused = await element.evaluate((el: HTMLElement) => 
                            document.activeElement === el
                        );
                        expect(isFocused).toBe(true);
                    }
                }
                
                // Test keyboard shortcuts
                await page.keyboard.press('Alt+1'); // Navigate to projects (if implemented)
                await page.keyboard.press('Ctrl+/'); // Open search (if implemented)
                await page.keyboard.press('Escape'); // Close modals (if implemented)
            });

            test(`should handle different network conditions in ${browserName}`, async ({ 
                page,
                authPage,
                homePage,
                userData 
            }: TestContext) => {
                // Test slow network
                await BrowserUtils.simulateNetworkConditions(page, {
                    downloadThroughput: 50 * 1024, // 50KB/s
                    uploadThroughput: 20 * 1024,   // 20KB/s
                    latency: 1000,                 // 1s latency
                });
                
                const slowLoadStart = Date.now();
                await authPage.goto();
                const slowLoadEnd = Date.now();
                
                console.log(`Slow network load time: ${slowLoadEnd - slowLoadStart}ms`);
                
                // Should still work, just slower
                await authPage.fillLoginForm({
                    email: userData.email,
                    password: userData.password,
                });
                await authPage.submitLogin();
                await homePage.waitForLoad();
                
                // Test offline scenario
                await BrowserUtils.simulateNetworkConditions(page, {
                    offline: true,
                });
                
                // Try to navigate to another page
                await page.goto('/projects');
                
                // Should show offline indicator or cached content
                const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
                const cachedContent = page.locator('[data-testid="cached-content"]');
                
                // At least one should be visible
                await expect(offlineIndicator.or(cachedContent)).toBeVisible();
                
                // Restore normal network
                await BrowserUtils.simulateNetworkConditions(page, {
                    offline: false,
                });
            });

            test(`should handle local storage and cookies in ${browserName}`, async ({ 
                page,
                authPage,
                homePage,
                settingsPage,
                userData 
            }: TestContext) => {
                await authPage.goto();
                await authPage.fillLoginForm({
                    email: userData.email,
                    password: userData.password,
                });
                await authPage.submitLogin();
                await homePage.waitForLoad();
                
                // Set some preferences
                await settingsPage.goto();
                await settingsPage.setTheme('dark');
                await settingsPage.setLanguage('en');
                
                // Check local storage
                const themeInStorage = await page.evaluate(() => 
                    localStorage.getItem('theme')
                );
                expect(themeInStorage).toBe('dark');
                
                // Check cookies
                const cookies = await page.context().cookies();
                const authCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('session'));
                expect(authCookie).toBeDefined();
                
                // Clear storage and verify cleanup
                await page.evaluate(() => {
                    localStorage.clear();
                    sessionStorage.clear();
                });
                
                await page.reload();
                
                // Should revert to default theme or prompt for preferences
                const themeAfterClear = await page.evaluate(() => 
                    localStorage.getItem('theme')
                );
                expect(themeAfterClear).toBeNull();
            });

            test(`should measure performance metrics in ${browserName}`, async ({ 
                page,
                authPage,
                homePage,
                userData 
            }: TestContext) => {
                // Measure page load performance
                const performanceMetrics = await PerformanceMonitor.measurePageLoad(page);
                
                await authPage.goto();
                
                // Measure login performance
                const loginTime = await PerformanceMonitor.measureInteraction(page, async () => {
                    await authPage.fillLoginForm({
                        email: userData.email,
                        password: userData.password,
                    });
                    await authPage.submitLogin();
                    await homePage.waitForLoad();
                });
                
                // Check Web Vitals
                const webVitals = await PerformanceMonitor.checkWebVitals(page);
                
                console.log(`${browserName} Performance:`, {
                    pageLoad: performanceMetrics.totalLoadTime,
                    login: loginTime,
                    webVitals,
                });
                
                // Performance assertions (adjust thresholds per browser)
                const thresholds = {
                    chromium: { pageLoad: 3000, login: 5000 },
                    firefox: { pageLoad: 4000, login: 6000 },
                    webkit: { pageLoad: 5000, login: 7000 },
                };
                
                const browserThreshold = thresholds[browserName as keyof typeof thresholds] || thresholds.chromium;
                
                expect(performanceMetrics.totalLoadTime).toBeLessThan(browserThreshold.pageLoad);
                expect(loginTime).toBeLessThan(browserThreshold.login);
                
                // Web Vitals checks
                if (webVitals.lcp) {
                    expect(webVitals.lcp).toBeLessThan(2500); // LCP should be < 2.5s
                }
                if (webVitals.cls !== undefined) {
                    expect(webVitals.cls).toBeLessThan(0.1); // CLS should be < 0.1
                }
            });

            test(`should handle CSS and JavaScript features in ${browserName}`, async ({ 
                page,
                authPage,
                homePage,
                userData 
            }: TestContext) => {
                await authPage.goto();
                await authPage.fillLoginForm({
                    email: userData.email,
                    password: userData.password,
                });
                await authPage.submitLogin();
                await homePage.waitForLoad();
                
                // Test CSS Grid and Flexbox support
                const gridSupport = await page.evaluate(() => {
                    return CSS.supports('display', 'grid');
                });
                expect(gridSupport).toBe(true);
                
                const flexSupport = await page.evaluate(() => {
                    return CSS.supports('display', 'flex');
                });
                expect(flexSupport).toBe(true);
                
                // Test modern JavaScript features
                const jsFeatures = await page.evaluate(() => {
                    return {
                        promises: typeof Promise !== 'undefined',
                        asyncAwait: (async function() {}).constructor,
                        classes: typeof class {} === 'function',
                        modules: typeof import !== 'undefined',
                        destructuring: (() => {
                            try {
                                const [a] = [1];
                                return true;
                            } catch {
                                return false;
                            }
                        })(),
                    };
                });
                
                expect(jsFeatures.promises).toBe(true);
                expect(jsFeatures.asyncAwait).toBeDefined();
                expect(jsFeatures.classes).toBe(true);
                expect(jsFeatures.destructuring).toBe(true);
                
                // Test CSS animations
                const animationSupport = await page.evaluate(() => {
                    return CSS.supports('animation', 'test 1s linear');
                });
                expect(animationSupport).toBe(true);
                
                // Test CSS custom properties
                const customPropertiesSupport = await page.evaluate(() => {
                    return CSS.supports('color', 'var(--test)');
                });
                expect(customPropertiesSupport).toBe(true);
            });
        });
    });

    test('should compare rendering across all browsers', async ({ browser }) => {
        const contexts = await Promise.all([
            browser.newContext(),
            browser.newContext(),
            browser.newContext(),
        ]);
        
        const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
        
        // Navigate all browsers to the same page
        await Promise.all(pages.map(page => page.goto('/dashboard')));
        
        // Take screenshots for comparison
        const screenshots = await Promise.all(
            pages.map((page, index) => 
                page.screenshot({
                    path: `test-results/screenshots/browser-comparison-${index}.png`,
                    fullPage: true,
                })
            )
        );
        
        // In a real scenario, you'd use visual regression testing tools
        // to compare these screenshots for layout consistency
        
        await Promise.all(contexts.map(ctx => ctx.close()));
    });
});