import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';

test.describe('Landing Page', () => {
    let helpers: TestHelpers;

    test.beforeEach(async ({ page }) => {
        helpers = new TestHelpers(page);
        await helpers.mockApiResponses();
    });

    test('should load the landing page successfully', async ({ page }) => {
        await page.goto('/');
        await helpers.waitForPageReady();

        // Check if the page loads with correct title
        await expect(page).toHaveTitle('ATOMS');

        // Check for main navigation elements
        await expect(page.locator('nav')).toBeVisible();

        // Check for main content area
        await expect(page.locator('main')).toBeVisible();
    });

    test('should display hero section correctly', async ({ page }) => {
        await page.goto('/');
        await helpers.waitForPageReady();

        // Check for main content structure based on actual implementation
        await expect(page.locator('main')).toBeVisible();

        // Check for hero component (based on page.tsx structure)
        const heroSection = page.locator('main').first();
        await expect(heroSection).toBeVisible();

        // Check for ATOMS branding
        await expect(page.locator('text=ATOMS')).toBeVisible();
    });

    test('should have working navigation links', async ({ page }) => {
        await page.goto('/');
        await helpers.waitForPageReady();

        // Check for navbar based on actual implementation
        const navbar = page.locator('nav');
        await expect(navbar).toBeVisible();

        // Check for sign in functionality (based on navbar.tsx)
        const signInButton = page.locator('button:has-text("Sign in"), a:has-text("Sign in")');
        if (await signInButton.count() > 0) {
            await expect(signInButton.first()).toBeVisible();
            await expect(signInButton.first()).toBeEnabled();
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
        await helpers.waitForPageReady();

        // Check for essential meta tags based on layout.tsx
        const title = await page.title();
        expect(title).toBe('ATOMS');

        // Check for description meta tag
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description).toBe('ATOMS.TECH - AI-powered requirements engineering');

        // Check for viewport meta tag
        const viewportMeta = page.locator('meta[name="viewport"]');
        await expect(viewportMeta).toHaveAttribute('content', /width=device-width/);

        // Check for language attribute
        const htmlElement = page.locator('html');
        await expect(htmlElement).toHaveAttribute('lang', 'en');
    });

    test('should display main sections correctly', async ({ page }) => {
        await page.goto('/');
        await helpers.waitForPageReady();

        // Check for main sections based on page.tsx structure
        const mainElement = page.locator('main');
        await expect(mainElement).toBeVisible();

        // Check for section dividers (based on the actual implementation)
        const sectionDividers = page.locator('.section-divider');
        if (await sectionDividers.count() > 0) {
            await expect(sectionDividers.first()).toBeVisible();
        }

        // Check for features section
        const featuresSection = page.locator('text=Features, text=feature').first();
        if (await featuresSection.count() > 0) {
            await expect(featuresSection).toBeVisible();
        }
    });
});
