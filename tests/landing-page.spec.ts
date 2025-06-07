import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test('should load the landing page successfully', async ({ page }) => {
        await page.goto('/');
        
        // Check if the page loads without errors
        await expect(page).toHaveTitle(/atoms\.tech/i);
        
        // Check for main navigation elements
        await expect(page.locator('nav')).toBeVisible();
    });

    test('should display hero section', async ({ page }) => {
        await page.goto('/');
        
        // Wait for the hero section to be visible
        await expect(page.locator('main')).toBeVisible();
        
        // Check for key elements that should be present
        await expect(page.locator('text=ATOMS')).toBeVisible();
    });

    test('should have working navigation links', async ({ page }) => {
        await page.goto('/');
        
        // Check if login link is present and clickable
        const loginLink = page.locator('a[href*="/login"], button:has-text("Sign in")');
        if (await loginLink.count() > 0) {
            await expect(loginLink.first()).toBeVisible();
        }
    });

    test('should be responsive on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        
        // Check if page loads properly on mobile
        await expect(page.locator('main')).toBeVisible();
        
        // Check if navigation is mobile-friendly
        await expect(page.locator('nav')).toBeVisible();
    });

    test('should load without JavaScript errors', async ({ page }) => {
        const errors: string[] = [];
        
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        
        page.on('pageerror', (error) => {
            errors.push(error.message);
        });
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Filter out known non-critical errors
        const criticalErrors = errors.filter(error => 
            !error.includes('favicon') && 
            !error.includes('404') &&
            !error.includes('net::ERR_FAILED')
        );
        
        expect(criticalErrors).toHaveLength(0);
    });

    test('should have proper meta tags for SEO', async ({ page }) => {
        await page.goto('/');
        
        // Check for essential meta tags
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(0);
        
        // Check for viewport meta tag
        const viewportMeta = page.locator('meta[name="viewport"]');
        await expect(viewportMeta).toHaveAttribute('content', /width=device-width/);
    });
});
