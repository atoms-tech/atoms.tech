import { test, expect } from '@playwright/test';
import { TestHelpers, BrowserSpecificHelpers, CommonPatterns } from './utils/test-helpers';

test.describe('Cross-Browser Compatibility', () => {
    let helpers: TestHelpers;

    test.beforeEach(async ({ page }) => {
        helpers = new TestHelpers(page);
        await helpers.mockApiResponses();
    });

    test('should work consistently across all browsers', async ({ page, browserName }) => {
        console.log(`Testing on browser: ${browserName}`);
        
        await page.goto('/');
        await helpers.waitForPageReady();
        
        // Check basic page functionality
        await expect(page.locator('main')).toBeVisible();
        
        // Check browser-specific features
        const browserFeatures = await BrowserSpecificHelpers.checkBrowserFeatures(page);
        expect(browserFeatures.localStorage).toBe(true);
        expect(browserFeatures.fetch).toBe(true);
        
        // Take browser-specific screenshot
        await helpers.takeScreenshot(`landing-page-${browserName}`);
    });

    test('should handle responsive design across browsers', async ({ page, browserName }) => {
        const responsiveResults = await helpers.checkResponsiveness();
        
        // All viewports should show main content
        responsiveResults.forEach(result => {
            expect(result.mainVisible).toBe(true);
        });
        
        // Take screenshots at different sizes
        for (const result of responsiveResults) {
            await page.setViewportSize({ width: result.width, height: result.height });
            await helpers.takeScreenshot(`responsive-${result.viewport}-${browserName}`);
        }
    });

    test('should maintain authentication flow consistency', async ({ page, browserName }) => {
        const authResults = await CommonPatterns.testAuthenticationFlow(page);
        
        expect(authResults.hasEmailInput).toBe(true);
        expect(authResults.hasPasswordInput).toBe(true);
        expect(authResults.hasSubmitButton).toBe(true);
        
        await helpers.takeScreenshot(`auth-flow-${browserName}`);
    });

    test('should handle navigation consistently', async ({ page, browserName }) => {
        const navResults = await CommonPatterns.testNavigationFlow(page);
        
        navResults.forEach(result => {
            expect(result.isLoaded).toBe(true);
            expect(result.hasErrors).toBe(false);
        });
    });

    test('should handle JavaScript features consistently', async ({ page, browserName }) => {
        await page.goto('/');
        await helpers.waitForPageReady();
        
        // Test modern JavaScript features
        const jsFeatures = await page.evaluate(() => {
            const features = {
                arrow_functions: true,
                async_await: true,
                promises: typeof Promise !== 'undefined',
                fetch: typeof fetch !== 'undefined',
                const_let: true,
                template_literals: true,
                destructuring: true,
                modules: typeof Symbol !== 'undefined'
            };
            
            try {
                // Test arrow functions
                const arrow = () => true;
                features.arrow_functions = arrow();
                
                // Test template literals
                const template = `test ${1 + 1}`;
                features.template_literals = template === 'test 2';
                
                // Test destructuring
                const [a, b] = [1, 2];
                features.destructuring = a === 1 && b === 2;
                
            } catch (e) {
                console.warn('JS feature test failed:', e);
            }
            
            return features;
        });
        
        // All modern browsers should support these features
        Object.entries(jsFeatures).forEach(([feature, supported]) => {
            expect(supported).toBe(true);
        });
    });

    test('should handle CSS features consistently', async ({ page, browserName }) => {
        await page.goto('/');
        await helpers.waitForPageReady();
        
        // Test CSS features
        const cssFeatures = await page.evaluate(() => {
            const testElement = document.createElement('div');
            document.body.appendChild(testElement);
            
            const features = {
                flexbox: false,
                grid: false,
                custom_properties: false,
                transforms: false,
                transitions: false
            };
            
            try {
                // Test Flexbox
                testElement.style.display = 'flex';
                features.flexbox = getComputedStyle(testElement).display === 'flex';
                
                // Test Grid
                testElement.style.display = 'grid';
                features.grid = getComputedStyle(testElement).display === 'grid';
                
                // Test Custom Properties
                testElement.style.setProperty('--test-var', 'red');
                features.custom_properties = testElement.style.getPropertyValue('--test-var') === 'red';
                
                // Test Transforms
                testElement.style.transform = 'translateX(10px)';
                features.transforms = testElement.style.transform.includes('translateX');
                
                // Test Transitions
                testElement.style.transition = 'all 0.3s ease';
                features.transitions = testElement.style.transition.includes('0.3s');
                
            } catch (e) {
                console.warn('CSS feature test failed:', e);
            } finally {
                document.body.removeChild(testElement);
            }
            
            return features;
        });
        
        // Modern browsers should support these CSS features
        expect(cssFeatures.flexbox).toBe(true);
        expect(cssFeatures.custom_properties).toBe(true);
        expect(cssFeatures.transforms).toBe(true);
    });

    test('should handle form interactions consistently', async ({ page, browserName }) => {
        await page.goto('/login');
        await helpers.waitForPageReady();
        
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        const passwordInput = page.locator('input[type="password"], input[name="password"]');
        
        if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
            // Test form filling
            await emailInput.fill('test@example.com');
            await passwordInput.fill('testpassword123');
            
            // Verify values
            await expect(emailInput).toHaveValue('test@example.com');
            await expect(passwordInput).toHaveValue('testpassword123');
            
            // Test form clearing
            await emailInput.clear();
            await passwordInput.clear();
            
            await expect(emailInput).toHaveValue('');
            await expect(passwordInput).toHaveValue('');
            
            // Test keyboard navigation
            await emailInput.focus();
            await page.keyboard.press('Tab');
            
            const focusedElement = page.locator(':focus');
            await expect(focusedElement).toBeVisible();
        }
        
        await helpers.takeScreenshot(`form-interaction-${browserName}`);
    });

    test('should handle error states consistently', async ({ page, browserName }) => {
        const errorResults = await helpers.testErrorHandling();
        
        // Page should remain functional even with API errors
        expect(errorResults.pageStillFunctional).toBe(true);
        
        await helpers.takeScreenshot(`error-handling-${browserName}`);
    });

    test('should maintain performance standards', async ({ page, browserName }) => {
        await page.goto('/');
        
        const performanceResults = await helpers.checkPerformance();
        
        // Page should load within reasonable time (adjust threshold as needed)
        expect(performanceResults.loadTime).toBeLessThan(10000); // 10 seconds max
        
        // Log performance for analysis
        console.log(`${browserName} performance:`, performanceResults);
    });

    test('should handle accessibility consistently', async ({ page, browserName }) => {
        await page.goto('/');
        await helpers.waitForPageReady();
        
        const accessibilityIssues = await helpers.checkBasicAccessibility();
        
        // Log accessibility issues for review
        if (accessibilityIssues.length > 0) {
            console.warn(`${browserName} accessibility issues:`, accessibilityIssues);
        }
        
        // Test keyboard navigation
        const keyboardNav = await helpers.testKeyboardNavigation();
        expect(keyboardNav.length).toBeGreaterThan(0); // Should have focusable elements
    });

    test('should handle browser-specific quirks', async ({ page, browserName }) => {
        await page.goto('/');
        await helpers.waitForPageReady();
        
        const browserInfo = await BrowserSpecificHelpers.getBrowserInfo(page);
        console.log(`${browserName} info:`, browserInfo);
        
        // Browser-specific tests
        if (browserName === 'webkit') {
            // Safari-specific tests
            const safariFeatures = await page.evaluate(() => {
                return {
                    webkitPrefixes: 'webkitRequestAnimationFrame' in window,
                    touchEvents: 'ontouchstart' in window
                };
            });
            
            console.log('Safari-specific features:', safariFeatures);
        }
        
        if (browserName === 'firefox') {
            // Firefox-specific tests
            const firefoxFeatures = await page.evaluate(() => {
                return {
                    mozPrefixes: 'mozRequestAnimationFrame' in window,
                    firefoxVersion: navigator.userAgent.includes('Firefox')
                };
            });
            
            console.log('Firefox-specific features:', firefoxFeatures);
        }
        
        if (browserName === 'chromium') {
            // Chrome-specific tests
            const chromeFeatures = await page.evaluate(() => {
                return {
                    webkitPrefixes: 'webkitRequestAnimationFrame' in window,
                    chromeVersion: navigator.userAgent.includes('Chrome')
                };
            });
            
            console.log('Chrome-specific features:', chromeFeatures);
        }
    });
});
