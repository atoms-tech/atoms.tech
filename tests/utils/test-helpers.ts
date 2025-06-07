import { Page, expect } from '@playwright/test';

/**
 * Test utilities for cross-browser testing
 */

export class TestHelpers {
    constructor(private page: Page) {}

    /**
     * Wait for the page to be fully loaded and interactive
     */
    async waitForPageReady() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * Check if an element exists without throwing an error
     */
    async elementExists(selector: string): Promise<boolean> {
        return (await this.page.locator(selector).count()) > 0;
    }

    /**
     * Fill form field if it exists
     */
    async fillIfExists(selector: string, value: string): Promise<boolean> {
        if (await this.elementExists(selector)) {
            await this.page.locator(selector).fill(value);
            return true;
        }
        return false;
    }

    /**
     * Click element if it exists
     */
    async clickIfExists(selector: string): Promise<boolean> {
        if (await this.elementExists(selector)) {
            await this.page.locator(selector).click();
            return true;
        }
        return false;
    }

    /**
     * Check for JavaScript errors on the page
     */
    async checkForJSErrors(): Promise<string[]> {
        const errors: string[] = [];
        
        this.page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        
        this.page.on('pageerror', (error) => {
            errors.push(error.message);
        });
        
        return errors;
    }

    /**
     * Take a screenshot with a descriptive name
     */
    async takeScreenshot(name: string) {
        await this.page.screenshot({ 
            path: `test-results/screenshots/${name}-${Date.now()}.png`,
            fullPage: true 
        });
    }

    /**
     * Check if the page is responsive at different viewport sizes
     */
    async checkResponsiveness() {
        const viewports = [
            { width: 1920, height: 1080, name: 'desktop' },
            { width: 1024, height: 768, name: 'tablet' },
            { width: 375, height: 667, name: 'mobile' }
        ];

        const results = [];

        for (const viewport of viewports) {
            await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
            await this.waitForPageReady();
            
            const isMainVisible = await this.page.locator('main').isVisible();
            results.push({
                viewport: viewport.name,
                mainVisible: isMainVisible,
                width: viewport.width,
                height: viewport.height
            });
        }

        return results;
    }

    /**
     * Test form validation
     */
    async testFormValidation(formSelector: string) {
        const form = this.page.locator(formSelector);
        if (!(await form.count())) return false;

        // Try to submit empty form
        const submitButton = form.locator('button[type="submit"], input[type="submit"]');
        if (await submitButton.count()) {
            await submitButton.click();
            
            // Check for validation messages
            const validationMessages = await this.page.locator(
                '[aria-invalid="true"], .error, .invalid, [data-testid*="error"]'
            ).count();
            
            return validationMessages > 0;
        }
        
        return false;
    }

    /**
     * Check accessibility basics
     */
    async checkBasicAccessibility() {
        const issues = [];

        // Check for alt text on images
        const imagesWithoutAlt = await this.page.locator('img:not([alt])').count();
        if (imagesWithoutAlt > 0) {
            issues.push(`${imagesWithoutAlt} images without alt text`);
        }

        // Check for form labels
        const inputsWithoutLabels = await this.page.locator('input:not([aria-label]):not([aria-labelledby])').count();
        const labelsCount = await this.page.locator('label').count();
        
        if (inputsWithoutLabels > labelsCount) {
            issues.push('Some form inputs may be missing labels');
        }

        // Check for heading structure
        const h1Count = await this.page.locator('h1').count();
        if (h1Count === 0) {
            issues.push('No h1 heading found');
        } else if (h1Count > 1) {
            issues.push('Multiple h1 headings found');
        }

        return issues;
    }

    /**
     * Test keyboard navigation
     */
    async testKeyboardNavigation() {
        const focusableElements = [];
        
        // Tab through focusable elements
        for (let i = 0; i < 10; i++) {
            await this.page.keyboard.press('Tab');
            const focused = this.page.locator(':focus');
            
            if (await focused.count()) {
                const tagName = await focused.evaluate(el => el.tagName);
                focusableElements.push(tagName);
            }
        }
        
        return focusableElements;
    }

    /**
     * Check for performance issues
     */
    async checkPerformance() {
        const startTime = Date.now();
        await this.waitForPageReady();
        const loadTime = Date.now() - startTime;

        // Check for large images
        const largeImages = await this.page.locator('img').evaluateAll(images => {
            return images.filter(img => {
                const rect = img.getBoundingClientRect();
                return rect.width > 1000 || rect.height > 1000;
            }).length;
        });

        return {
            loadTime,
            largeImages,
            isSlowLoad: loadTime > 5000
        };
    }

    /**
     * Mock API responses for testing
     */
    async mockApiResponses() {
        // Mock common API endpoints
        await this.page.route('**/api/**', async (route) => {
            const url = route.request().url();
            
            if (url.includes('/auth/')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true, message: 'Mocked auth response' })
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ data: [], message: 'Mocked API response' })
                });
            }
        });
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        // Simulate network errors
        await this.page.route('**/api/**', route => route.abort());
        
        await this.page.reload();
        await this.waitForPageReady();
        
        // Check if the page handles errors gracefully
        const errorElements = await this.page.locator(
            'text=/error|failed|something went wrong/i, [data-testid*="error"]'
        ).count();
        
        const pageStillFunctional = await this.page.locator('main').isVisible();
        
        return {
            hasErrorHandling: errorElements > 0,
            pageStillFunctional
        };
    }
}

/**
 * Browser-specific test utilities
 */
export class BrowserSpecificHelpers {
    static async checkBrowserFeatures(page: Page) {
        return await page.evaluate(() => {
            return {
                localStorage: typeof Storage !== 'undefined',
                sessionStorage: typeof sessionStorage !== 'undefined',
                webGL: !!window.WebGLRenderingContext,
                webWorkers: typeof Worker !== 'undefined',
                fetch: typeof fetch !== 'undefined',
                promises: typeof Promise !== 'undefined',
                es6Modules: typeof Symbol !== 'undefined'
            };
        });
    }

    static async getBrowserInfo(page: Page) {
        return await page.evaluate(() => {
            return {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            };
        });
    }
}

/**
 * Common test patterns
 */
export const CommonPatterns = {
    async testAuthenticationFlow(page: Page) {
        const helpers = new TestHelpers(page);
        
        // Navigate to login
        await page.goto('/login');
        await helpers.waitForPageReady();
        
        // Check form elements
        const hasEmailInput = await helpers.elementExists('input[type="email"], input[name="email"]');
        const hasPasswordInput = await helpers.elementExists('input[type="password"], input[name="password"]');
        const hasSubmitButton = await helpers.elementExists('button[type="submit"]');
        
        return {
            hasEmailInput,
            hasPasswordInput,
            hasSubmitButton,
            formValidation: await helpers.testFormValidation('form')
        };
    },

    async testNavigationFlow(page: Page) {
        const helpers = new TestHelpers(page);
        const routes = ['/', '/login', '/signup'];
        const results = [];
        
        for (const route of routes) {
            await page.goto(route);
            await helpers.waitForPageReady();
            
            const isLoaded = await page.locator('main, body').isVisible();
            const hasErrors = (await helpers.checkForJSErrors()).length > 0;
            
            results.push({
                route,
                isLoaded,
                hasErrors
            });
        }
        
        return results;
    }
};
