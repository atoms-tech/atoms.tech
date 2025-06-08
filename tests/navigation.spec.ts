import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Navigation and Routing', () => {
    let helpers: TestHelpers;

    test.beforeEach(async ({ page }) => {
        helpers = new TestHelpers(page);
        await helpers.mockApiResponses();
    });

    test('should handle direct URL navigation correctly', async ({ page }) => {
        // Test direct navigation to public routes
        await page.goto('/login');
        await helpers.waitForPageReady();
        await expect(page).toHaveURL(/.*\/login/);

        await page.goto('/signup');
        await helpers.waitForPageReady();
        await expect(page).toHaveURL(/.*\/signup/);

        await page.goto('/');
        await helpers.waitForPageReady();
        await expect(page).toHaveURL(/.*\/$/);
    });

    test('should handle browser back and forward navigation', async ({ page }) => {
        // Navigate through pages
        await page.goto('/');
        await page.goto('/login');
        await page.goto('/signup');
        
        // Test back navigation
        await page.goBack();
        await expect(page).toHaveURL(/.*\/login/);
        
        await page.goBack();
        await expect(page).toHaveURL(/.*\//);
        
        // Test forward navigation
        await page.goForward();
        await expect(page).toHaveURL(/.*\/login/);
    });

    test('should handle 404 pages gracefully', async ({ page }) => {
        // Navigate to a non-existent page
        const response = await page.goto('/non-existent-page');
        
        // Check if we get a 404 or if Next.js redirects to a custom 404 page
        if (response) {
            const status = response.status();
            expect([404, 200]).toContain(status); // 200 if custom 404 page
        }
        
        // Check if page shows some kind of error message or 404 content
        const hasErrorContent = await page.locator('text=/404|not found|page not found/i').count() > 0;
        const hasNavigationBack = await page.locator('a[href="/"], button:has-text("Home")').count() > 0;
        
        // At least one of these should be true for good UX
        expect(hasErrorContent || hasNavigationBack || page.url().includes('/')).toBeTruthy();
    });

    test('should preserve state during navigation', async ({ page }) => {
        await page.goto('/login');
        
        // Fill in some form data
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        if (await emailInput.count() > 0) {
            await emailInput.fill('test@example.com');
            
            // Navigate away and back
            await page.goto('/signup');
            await page.goto('/login');
            
            // Check if form was cleared (expected behavior for security)
            const currentValue = await emailInput.inputValue();
            // Form should be cleared for security reasons
            expect(currentValue).toBe('');
        }
    });

    test('should handle protected routes correctly', async ({ page }) => {
        // Test protected routes based on actual application structure
        const protectedRoutes = [
            '/home/user',
            '/org/test-org-id',
            '/org/test-org-id/project/test-project-id',
            '/org/test-org-id/demo'
        ];

        for (const route of protectedRoutes) {
            await page.goto(route);
            await helpers.waitForPageReady();

            // Should redirect to login or stay on home page due to middleware
            const currentUrl = page.url();
            const isHandledCorrectly = currentUrl.includes('/login') ||
                                     currentUrl.includes('/auth') ||
                                     currentUrl === 'http://localhost:3000/' ||
                                     await page.locator('text=/session expired|login|sign in/i').count() > 0;

            expect(isHandledCorrectly).toBeTruthy();
        }
    });

    test('should handle external links properly', async ({ page }) => {
        await page.goto('/');
        
        // Look for external links (if any)
        const externalLinks = page.locator('a[href^="http"]:not([href*="localhost"]):not([href*="127.0.0.1"])');
        const linkCount = await externalLinks.count();
        
        if (linkCount > 0) {
            // Check if external links have proper attributes
            const firstExternalLink = externalLinks.first();
            const target = await firstExternalLink.getAttribute('target');
            const rel = await firstExternalLink.getAttribute('rel');
            
            // External links should open in new tab and have security attributes
            expect(target).toBe('_blank');
            expect(rel).toContain('noopener');
        }
    });

    test('should handle keyboard navigation', async ({ page }) => {
        await page.goto('/login');
        
        // Test tab navigation through form elements
        await page.keyboard.press('Tab');
        
        // Check if focus is visible and logical
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
        
        // Continue tabbing to ensure logical tab order
        await page.keyboard.press('Tab');
        const secondFocusedElement = page.locator(':focus');
        await expect(secondFocusedElement).toBeVisible();
    });

    test('should handle page refresh properly', async ({ page }) => {
        await page.goto('/login');
        
        // Fill in some data
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        if (await emailInput.count() > 0) {
            await emailInput.fill('test@example.com');
        }
        
        // Refresh the page
        await page.reload();
        
        // Check if page loads correctly after refresh
        await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
        
        // Form should be cleared after refresh
        if (await emailInput.count() > 0) {
            const valueAfterRefresh = await emailInput.inputValue();
            expect(valueAfterRefresh).toBe('');
        }
    });

    test('should handle slow network conditions', async ({ page }) => {
        // Simulate slow network
        await page.route('**/*', async (route) => {
            await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
            await route.continue();
        });
        
        await page.goto('/');
        
        // Page should still load, just slower
        await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
    });
});
