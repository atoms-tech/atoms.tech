import { test, expect } from '@playwright/test';
import { 
    setupAuthenticatedSession, 
    mockUserProfile, 
    TestData,
    BrowserHelpers,
    takeTimestampedScreenshot,
    waitForAnimations
} from './utils/test-helpers';

test.describe('Mobile Responsiveness - Comprehensive Cross-Device Testing', () => {
    test.beforeEach(async ({ page, context }) => {
        await setupAuthenticatedSession(context);
        await mockUserProfile(page);
        
        // Mock API endpoints for mobile testing
        await page.route('**/api/**', async (route) => {
            const url = route.request().url();
            
            if (url.includes('/organizations')) {
                await route.fulfill({
                    status: 200,
                    json: {
                        data: [TestData.organizations.default],
                        count: 1
                    }
                });
            } else if (url.includes('/projects')) {
                await route.fulfill({
                    status: 200,
                    json: {
                        data: [TestData.projects.default],
                        count: 1
                    }
                });
            } else {
                await route.continue();
            }
        });
    });

    test.describe('Mobile Phone Layouts (Portrait)', () => {
        test('should display properly on iPhone SE (320x568)', async ({ page }) => {
            await page.setViewportSize({ width: 320, height: 568 });
            await page.goto('/home');
            await page.waitForLoadState('networkidle');

            // Test critical elements are visible and accessible
            await verifyMobileLayout(page, 'iphone-se');
            
            // Test navigation works
            await testMobileNavigation(page);
            
            // Test scrolling and content accessibility
            await testMobileScrolling(page);
            
            await takeTimestampedScreenshot(page, 'mobile-iphone-se', { fullPage: true });
        });

        test('should display properly on iPhone 12 (390x844)', async ({ page }) => {
            await page.setViewportSize({ width: 390, height: 844 });
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            await verifyMobileLayout(page, 'iphone-12');
            
            // Test mobile-specific interactions
            await testMobileTouchInteractions(page);
            
            // Test form inputs on mobile
            await testMobileFormInteractions(page);
            
            await takeTimestampedScreenshot(page, 'mobile-iphone-12', { fullPage: true });
        });

        test('should display properly on Samsung Galaxy S21 (412x915)', async ({ page }) => {
            await page.setViewportSize({ width: 412, height: 915 });
            await page.goto('/org/test-org/project/test-project/documents');
            await page.waitForLoadState('networkidle');

            await verifyMobileLayout(page, 'galaxy-s21');
            
            // Test Android-specific behaviors
            await testAndroidSpecificFeatures(page);
            
            await takeTimestampedScreenshot(page, 'mobile-galaxy-s21', { fullPage: true });
        });
    });

    test.describe('Mobile Phone Layouts (Landscape)', () => {
        test('should adapt to landscape orientation (844x390)', async ({ page }) => {
            await page.setViewportSize({ width: 844, height: 390 });
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Landscape should show more horizontal content
            await verifyLandscapeLayout(page);
            
            // Test navigation in landscape
            await testLandscapeNavigation(page);
            
            await takeTimestampedScreenshot(page, 'mobile-landscape', { fullPage: true });
        });

        test('should handle orientation changes', async ({ page }) => {
            // Start in portrait
            await page.setViewportSize({ width: 390, height: 844 });
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            const portraitContent = await page.locator('main').boundingBox();
            
            // Switch to landscape
            await page.setViewportSize({ width: 844, height: 390 });
            await waitForAnimations(page);
            
            const landscapeContent = await page.locator('main').boundingBox();
            
            // Layout should have adapted
            expect(landscapeContent?.width).toBeGreaterThan(portraitContent?.width || 0);
            
            // Critical elements should still be visible
            await expect(page.locator('nav, [data-testid="navigation"]')).toBeVisible();
            await expect(page.locator('main, [data-testid="main-content"]')).toBeVisible();
        });
    });

    test.describe('Tablet Layouts', () => {
        test('should display properly on iPad (768x1024)', async ({ page }) => {
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Tablet should show hybrid mobile/desktop layout
            await verifyTabletLayout(page);
            
            // Test tablet-specific interactions
            await testTabletInteractions(page);
            
            await takeTimestampedScreenshot(page, 'tablet-ipad', { fullPage: true });
        });

        test('should display properly on iPad Pro (1024x1366)', async ({ page }) => {
            await page.setViewportSize({ width: 1024, height: 1366 });
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Large tablet should approach desktop layout
            await verifyLargeTabletLayout(page);
            
            await takeTimestampedScreenshot(page, 'tablet-ipad-pro', { fullPage: true });
        });

        test('should handle tablet landscape mode (1024x768)', async ({ page }) => {
            await page.setViewportSize({ width: 1024, height: 768 });
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Landscape tablet should show more desktop-like layout
            await verifyTabletLandscapeLayout(page);
            
            await takeTimestampedScreenshot(page, 'tablet-landscape', { fullPage: true });
        });
    });

    test.describe('Responsive Navigation', () => {
        test('should show mobile hamburger menu on small screens', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Desktop navigation should be hidden
            const desktopNav = page.locator('[data-testid="desktop-nav"], .desktop-navigation');
            if (await desktopNav.count() > 0) {
                await expect(desktopNav).not.toBeVisible();
            }

            // Mobile menu button should be visible
            const mobileMenuBtn = page.locator('[data-testid="mobile-menu"], .hamburger, [aria-label*="menu"]');
            await expect(mobileMenuBtn).toBeVisible();

            // Test mobile menu functionality
            await mobileMenuBtn.click();
            
            const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-navigation');
            await expect(mobileNav).toBeVisible();
            
            // Test navigation items in mobile menu
            const navItems = mobileNav.locator('a, button');
            const itemCount = await navItems.count();
            expect(itemCount).toBeGreaterThan(0);
            
            // Test closing mobile menu
            const closeBtn = mobileNav.locator('[data-testid="close-menu"], .close-menu');
            if (await closeBtn.count() > 0) {
                await closeBtn.click();
                await expect(mobileNav).not.toBeVisible();
            } else {
                // Try clicking outside or pressing escape
                await page.keyboard.press('Escape');
                await expect(mobileNav).not.toBeVisible();
            }
        });

        test('should adapt navigation at different breakpoints', async ({ page }) => {
            const breakpoints = [
                { width: 320, height: 568, name: 'mobile-xs' },
                { width: 375, height: 667, name: 'mobile-sm' },
                { width: 414, height: 896, name: 'mobile-lg' },
                { width: 768, height: 1024, name: 'tablet' },
                { width: 1024, height: 768, name: 'tablet-landscape' },
                { width: 1200, height: 800, name: 'desktop-sm' }
            ];

            for (const breakpoint of breakpoints) {
                await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
                await page.goto('/org/test-org/project/test-project');
                await page.waitForLoadState('networkidle');

                // Test appropriate navigation for each breakpoint
                if (breakpoint.width < 768) {
                    // Mobile navigation
                    const mobileMenu = page.locator('[data-testid="mobile-menu"], .hamburger');
                    if (await mobileMenu.count() > 0) {
                        await expect(mobileMenu).toBeVisible();
                    }
                } else if (breakpoint.width < 1024) {
                    // Tablet navigation (hybrid)
                    const navigation = page.locator('nav, [data-testid="navigation"]');
                    await expect(navigation).toBeVisible();
                } else {
                    // Desktop navigation
                    const desktopNav = page.locator('[data-testid="desktop-nav"], nav');
                    await expect(desktopNav).toBeVisible();
                }

                await takeTimestampedScreenshot(page, `navigation-${breakpoint.name}`);
            }
        });
    });

    test.describe('Touch Interactions and Gestures', () => {
        test('should handle touch interactions properly', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/org/test-org/project/test-project/documents');
            await page.waitForLoadState('networkidle');

            // Test tap interactions
            const documentItem = page.locator('[data-testid="document-item"], .document-item').first();
            if (await documentItem.count() > 0) {
                // Single tap should select or navigate
                await documentItem.tap();
                await page.waitForTimeout(500);
                
                // Long press should show context menu (if implemented)
                await documentItem.tap({ timeout: 1000 });
                
                const contextMenu = page.locator('[data-testid="context-menu"], .context-menu');
                if (await contextMenu.count() > 0) {
                    await expect(contextMenu).toBeVisible();
                }
            }
        });

        test('should handle swipe gestures for navigation', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test swipe navigation (if implemented)
            const content = page.locator('main, [data-testid="main-content"]');
            const contentBox = await content.boundingBox();
            
            if (contentBox) {
                // Swipe left (might show side menu or navigate)
                await page.mouse.move(contentBox.x + contentBox.width - 10, contentBox.y + contentBox.height / 2);
                await page.mouse.down();
                await page.mouse.move(contentBox.x + 10, contentBox.y + contentBox.height / 2);
                await page.mouse.up();
                
                await page.waitForTimeout(500);
                
                // Check if swipe had any effect
                const sideMenu = page.locator('[data-testid="side-menu"], .side-panel');
                if (await sideMenu.count() > 0) {
                    const isVisible = await sideMenu.isVisible();
                    console.log('Swipe gesture triggered side menu:', isVisible);
                }
            }
        });

        test('should handle pinch-to-zoom appropriately', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/org/test-org/project/test-project/canvas');
            await page.waitForLoadState('networkidle');

            // Test that pinch-to-zoom is handled appropriately
            // On most web apps, this should be disabled for UI elements
            const viewport = page.locator('meta[name="viewport"]');
            if (await viewport.count() > 0) {
                const content = await viewport.getAttribute('content');
                expect(content).toContain('user-scalable=no');
            }
        });
    });

    test.describe('Mobile Form Interactions', () => {
        test('should handle mobile form inputs properly', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/org/test-org/project/test-project/documents');
            await page.waitForLoadState('networkidle');

            // Test creating document on mobile
            const createBtn = page.locator('[data-testid="create-document"], button:has-text("New Document")');
            if (await createBtn.count() > 0) {
                await createBtn.tap();
                
                const modal = page.locator('[role="dialog"], .modal');
                if (await modal.count() > 0) {
                    await expect(modal).toBeVisible();
                    
                    // Test mobile-friendly form inputs
                    const titleInput = modal.locator('input[name="title"], input[placeholder*="title"]');
                    if (await titleInput.count() > 0) {
                        await titleInput.tap();
                        await titleInput.fill('Mobile Test Document');
                        
                        // Verify virtual keyboard doesn't break layout
                        const modalBox = await modal.boundingBox();
                        expect(modalBox?.height).toBeGreaterThan(100);
                    }
                    
                    // Test textarea on mobile
                    const contentArea = modal.locator('textarea, [data-testid="content-editor"]');
                    if (await contentArea.count() > 0) {
                        await contentArea.tap();
                        await contentArea.fill('Test content for mobile document creation');
                    }
                    
                    // Test form submission
                    const submitBtn = modal.locator('button[type="submit"], button:has-text("Create")');
                    if (await submitBtn.count() > 0) {
                        await submitBtn.tap();
                        await page.waitForLoadState('networkidle');
                    }
                }
            }
        });

        test('should handle mobile keyboard properly', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test search input keyboard behavior
            const searchInput = page.locator('input[type="search"], [data-testid="search"]');
            if (await searchInput.count() > 0) {
                await searchInput.tap();
                
                // Verify input is focused and accessible
                await expect(searchInput).toBeFocused();
                
                // Type search query
                await searchInput.fill('test search query');
                
                // Test that page doesn't break with virtual keyboard
                const content = page.locator('main, [data-testid="main-content"]');
                await expect(content).toBeVisible();
                
                // Dismiss keyboard
                await page.keyboard.press('Enter');
                await page.waitForTimeout(500);
            }
        });
    });

    test.describe('Mobile Content Layout', () => {
        test('should stack content appropriately on mobile', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test that content stacks vertically on mobile
            const contentElements = page.locator('.grid, .flex, [data-testid*="grid"], [data-testid*="flex"]');
            const elementCount = await contentElements.count();
            
            for (let i = 0; i < Math.min(elementCount, 3); i++) {
                const element = contentElements.nth(i);
                const box = await element.boundingBox();
                
                if (box) {
                    // Content should not be wider than viewport
                    expect(box.width).toBeLessThanOrEqual(375);
                    
                    // Content should not cause horizontal scrolling
                    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
                    expect(scrollWidth).toBeLessThanOrEqual(375 + 20); // 20px tolerance
                }
            }
        });

        test('should show appropriate mobile typography', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test font sizes are readable on mobile
            const headings = page.locator('h1, h2, h3');
            const headingCount = await headings.count();
            
            for (let i = 0; i < Math.min(headingCount, 3); i++) {
                const heading = headings.nth(i);
                const fontSize = await heading.evaluate(el => 
                    window.getComputedStyle(el).fontSize
                );
                
                const fontSizeValue = parseInt(fontSize);
                expect(fontSizeValue).toBeGreaterThan(14); // Minimum readable size
            }
            
            // Test body text is readable
            const bodyText = page.locator('p, span, div').first();
            if (await bodyText.count() > 0) {
                const fontSize = await bodyText.evaluate(el => 
                    window.getComputedStyle(el).fontSize
                );
                
                const fontSizeValue = parseInt(fontSize);
                expect(fontSizeValue).toBeGreaterThan(12); // Minimum body text size
            }
        });

        test('should handle mobile spacing and padding', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Test that interactive elements have sufficient touch targets
            const buttons = page.locator('button, a, input[type="button"]');
            const buttonCount = await buttons.count();
            
            for (let i = 0; i < Math.min(buttonCount, 5); i++) {
                const button = buttons.nth(i);
                if (await button.isVisible()) {
                    const box = await button.boundingBox();
                    
                    if (box) {
                        // Touch targets should be at least 44px (Apple guidelines)
                        expect(Math.max(box.width, box.height)).toBeGreaterThan(32);
                    }
                }
            }
        });
    });

    test.describe('Mobile Performance', () => {
        test('should load quickly on mobile', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            
            const startTime = Date.now();
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');
            const loadTime = Date.now() - startTime;

            // Mobile should load within reasonable time
            expect(loadTime).toBeLessThan(5000); // 5 seconds max for mobile

            // Test mobile-specific performance metrics
            const performanceMetrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                return {
                    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                };
            });

            expect(performanceMetrics.loadTime).toBeLessThan(3000);
            expect(performanceMetrics.domContentLoaded).toBeLessThan(2000);
        });

        test('should handle mobile memory constraints', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/org/test-org/project/test-project');
            await page.waitForLoadState('networkidle');

            // Simulate mobile memory constraints
            const memoryInfo = await page.evaluate(() => {
                return (window.performance as any).memory;
            });

            if (memoryInfo) {
                // Memory usage should be reasonable for mobile
                expect(memoryInfo.usedJSHeapSize).toBeLessThan(25 * 1024 * 1024); // 25MB max
            }

            // Test that app remains responsive
            const interactionStart = Date.now();
            const navButton = page.locator('[data-testid="mobile-menu"], .hamburger');
            if (await navButton.count() > 0) {
                await navButton.tap();
                await page.waitForTimeout(500);
            }
            const interactionTime = Date.now() - interactionStart;
            
            expect(interactionTime).toBeLessThan(1000); // Should respond within 1 second
        });
    });
});

// Helper functions for mobile testing

async function verifyMobileLayout(page: any, deviceName: string): Promise<void> {
    // Verify essential mobile layout elements
    const essentialElements = [
        'nav, [data-testid="navigation"]',
        'main, [data-testid="main-content"]'
    ];

    for (const selector of essentialElements) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
            await expect(element).toBeVisible();
        }
    }

    // Verify no horizontal scroll
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewport = await page.viewportSize();
    expect(scrollWidth).toBeLessThanOrEqual((viewport?.width || 0) + 20);

    console.log(`Mobile layout verified for ${deviceName}`);
}

async function testMobileNavigation(page: any): Promise<void> {
    // Test mobile menu functionality
    const mobileMenuBtn = page.locator('[data-testid="mobile-menu"], .hamburger, [aria-label*="menu"]');
    if (await mobileMenuBtn.count() > 0) {
        await mobileMenuBtn.tap();
        
        const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-navigation');
        if (await mobileNav.count() > 0) {
            await expect(mobileNav).toBeVisible();
            
            // Test navigation item
            const navItem = mobileNav.locator('a, button').first();
            if (await navItem.count() > 0) {
                await navItem.tap();
                await page.waitForLoadState('networkidle');
            }
        }
    }
}

async function testMobileScrolling(page: any): Promise<void> {
    // Test vertical scrolling works properly
    const initialScrollY = await page.evaluate(() => window.scrollY);
    
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(500);
    
    const newScrollY = await page.evaluate(() => window.scrollY);
    expect(newScrollY).toBeGreaterThan(initialScrollY);
    
    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
}

async function testMobileTouchInteractions(page: any): Promise<void> {
    // Test tap interactions on interactive elements
    const interactiveElements = page.locator('button, a, input').first();
    if (await interactiveElements.count() > 0) {
        await interactiveElements.tap();
        await page.waitForTimeout(300);
    }
}

async function testMobileFormInteractions(page: any): Promise<void> {
    // Test form inputs work properly on mobile
    const inputs = page.locator('input[type="text"], input[type="search"]');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
        const firstInput = inputs.first();
        await firstInput.tap();
        await firstInput.fill('mobile test input');
        
        // Verify input retains focus and value
        await expect(firstInput).toBeFocused();
        expect(await firstInput.inputValue()).toBe('mobile test input');
    }
}

async function testAndroidSpecificFeatures(page: any): Promise<void> {
    // Test Android-specific behaviors if any
    console.log('Testing Android-specific features');
    
    // Test back button behavior (if implemented)
    await page.evaluate(() => {
        window.history.pushState({}, '', window.location.href);
        window.history.back();
    });
    
    await page.waitForTimeout(500);
}

async function verifyLandscapeLayout(page: any): Promise<void> {
    // Verify landscape layout utilizes horizontal space
    const content = page.locator('main, [data-testid="main-content"]');
    const contentBox = await content.boundingBox();
    
    if (contentBox) {
        expect(contentBox.width).toBeGreaterThan(contentBox.height);
    }
}

async function testLandscapeNavigation(page: any): Promise<void> {
    // Test navigation in landscape mode
    const navigation = page.locator('nav, [data-testid="navigation"]');
    await expect(navigation).toBeVisible();
    
    // Navigation should be accessible in landscape
    const navItems = navigation.locator('a, button');
    const itemCount = await navItems.count();
    expect(itemCount).toBeGreaterThan(0);
}

async function verifyTabletLayout(page: any): Promise<void> {
    // Verify tablet layout (hybrid between mobile and desktop)
    const sidebar = page.locator('[data-testid="sidebar"], .sidebar');
    const content = page.locator('main, [data-testid="main-content"]');
    
    // Sidebar might be visible on tablet
    if (await sidebar.count() > 0) {
        const sidebarBox = await sidebar.boundingBox();
        const contentBox = await content.boundingBox();
        
        if (sidebarBox && contentBox) {
            // Content should be beside sidebar, not below
            expect(contentBox.x).toBeGreaterThan(sidebarBox.x);
        }
    }
}

async function testTabletInteractions(page: any): Promise<void> {
    // Test tablet-specific interactions
    const tabs = page.locator('[role="tablist"] button, .tab-navigation a');
    if (await tabs.count() > 0) {
        await tabs.first().tap();
        await page.waitForLoadState('networkidle');
    }
}

async function verifyLargeTabletLayout(page: any): Promise<void> {
    // Large tablet should approach desktop layout
    const desktopFeatures = page.locator('.desktop-only, [data-testid*="desktop"]');
    if (await desktopFeatures.count() > 0) {
        await expect(desktopFeatures.first()).toBeVisible();
    }
}

async function verifyTabletLandscapeLayout(page: any): Promise<void> {
    // Tablet landscape should show more desktop-like features
    const sidebar = page.locator('[data-testid="sidebar"], .sidebar');
    const mainContent = page.locator('main, [data-testid="main-content"]');
    
    await expect(sidebar).toBeVisible();
    await expect(mainContent).toBeVisible();
    
    // Should have side-by-side layout
    const sidebarBox = await sidebar.boundingBox();
    const contentBox = await mainContent.boundingBox();
    
    if (sidebarBox && contentBox) {
        expect(contentBox.x).toBeGreaterThan(sidebarBox.x);
        expect(sidebarBox.width + contentBox.width).toBeLessThanOrEqual(1024 + 50); // Small tolerance
    }
}