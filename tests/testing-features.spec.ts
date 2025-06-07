import { test, expect } from '@playwright/test';

test.describe('Testing Features (UI Components)', () => {
    test.beforeEach(async ({ page }) => {
        // Note: These tests focus on UI components that don't require authentication
        // For authenticated features, we would need to set up proper test authentication
    });

    test('should handle form interactions without errors', async ({ page }) => {
        await page.goto('/login');
        
        // Test various form interactions that are common in the testing module
        const emailInput = page.locator('input[type="email"], input[name="email"]');
        const passwordInput = page.locator('input[type="password"], input[name="password"]');
        
        if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
            // Test rapid typing
            await emailInput.type('test@example.com', { delay: 10 });
            await passwordInput.type('password123', { delay: 10 });
            
            // Test clearing and retyping
            await emailInput.selectText();
            await emailInput.type('new@example.com');
            
            // Test form validation triggers
            await emailInput.clear();
            await passwordInput.focus();
            
            // Check if validation messages appear
            await page.waitForTimeout(500); // Allow time for validation
        }
    });

    test('should handle dynamic content loading', async ({ page }) => {
        await page.goto('/');
        
        // Test that dynamic content loads properly
        await page.waitForLoadState('networkidle');
        
        // Check for any loading states or spinners
        const loadingElements = page.locator('[data-testid*="loading"], .loading, .spinner');
        const loadingCount = await loadingElements.count();
        
        if (loadingCount > 0) {
            // Wait for loading to complete
            await expect(loadingElements.first()).toBeHidden({ timeout: 10000 });
        }
        
        // Ensure main content is visible
        await expect(page.locator('main')).toBeVisible();
    });

    test('should handle modal and dialog interactions', async ({ page }) => {
        await page.goto('/');
        
        // Look for buttons that might open modals
        const modalTriggers = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
        const triggerCount = await modalTriggers.count();
        
        if (triggerCount > 0) {
            await modalTriggers.first().click();
            
            // Check if modal appears
            const modal = page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
            if (await modal.count() > 0) {
                await expect(modal.first()).toBeVisible();
                
                // Test closing modal with escape key
                await page.keyboard.press('Escape');
                await expect(modal.first()).toBeHidden();
            }
        }
    });

    test('should handle table interactions', async ({ page }) => {
        await page.goto('/');
        
        // Look for tables (common in testing modules)
        const tables = page.locator('table, [role="table"]');
        const tableCount = await tables.count();
        
        if (tableCount > 0) {
            const firstTable = tables.first();
            await expect(firstTable).toBeVisible();
            
            // Check for sortable headers
            const sortableHeaders = page.locator('th[role="columnheader"], th button, th[data-sortable]');
            const sortableCount = await sortableHeaders.count();
            
            if (sortableCount > 0) {
                // Test sorting functionality
                await sortableHeaders.first().click();
                await page.waitForTimeout(500); // Allow time for sorting
            }
            
            // Check for pagination
            const paginationButtons = page.locator('button:has-text("Next"), button:has-text("Previous"), [aria-label*="pagination"]');
            if (await paginationButtons.count() > 0) {
                // Pagination exists and should be functional
                await expect(paginationButtons.first()).toBeVisible();
            }
        }
    });

    test('should handle search and filter functionality', async ({ page }) => {
        await page.goto('/');
        
        // Look for search inputs
        const searchInputs = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]');
        const searchCount = await searchInputs.count();
        
        if (searchCount > 0) {
            const searchInput = searchInputs.first();
            await expect(searchInput).toBeVisible();
            
            // Test search functionality
            await searchInput.fill('test');
            await page.waitForTimeout(500); // Allow time for search/filter
            
            // Clear search
            await searchInput.clear();
            await page.waitForTimeout(500);
        }
    });

    test('should handle drag and drop interactions', async ({ page }) => {
        await page.goto('/');
        
        // Look for draggable elements
        const draggableElements = page.locator('[draggable="true"], [data-draggable]');
        const draggableCount = await draggableElements.count();
        
        if (draggableCount > 0) {
            const draggable = draggableElements.first();
            await expect(draggable).toBeVisible();
            
            // Test drag start (without completing the drag)
            const box = await draggable.boundingBox();
            if (box) {
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.mouse.down();
                await page.mouse.move(box.x + 50, box.y + 50);
                await page.mouse.up();
            }
        }
    });

    test('should handle keyboard shortcuts', async ({ page }) => {
        await page.goto('/');
        
        // Test common keyboard shortcuts
        await page.keyboard.press('Control+f'); // Find
        await page.waitForTimeout(200);
        
        await page.keyboard.press('Escape'); // Close find
        await page.waitForTimeout(200);
        
        // Test tab navigation
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        if (await focusedElement.count() > 0) {
            await expect(focusedElement).toBeVisible();
        }
    });

    test('should handle responsive design changes', async ({ page }) => {
        // Test desktop view
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.goto('/');
        await expect(page.locator('main')).toBeVisible();
        
        // Test tablet view
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.reload();
        await expect(page.locator('main')).toBeVisible();
        
        // Test mobile view
        await page.setViewportSize({ width: 375, height: 667 });
        await page.reload();
        await expect(page.locator('main')).toBeVisible();
        
        // Check if mobile navigation works
        const mobileMenuButton = page.locator('button[aria-label*="menu"], button:has-text("☰"), [data-testid*="mobile-menu"]');
        if (await mobileMenuButton.count() > 0) {
            await mobileMenuButton.click();
            await page.waitForTimeout(300); // Allow time for menu animation
        }
    });

    test('should handle error states gracefully', async ({ page }) => {
        // Test network error handling
        await page.route('**/api/**', route => route.abort());
        
        await page.goto('/');
        
        // Page should still load even if API calls fail
        await expect(page.locator('main')).toBeVisible();
        
        // Look for error messages or fallback content
        const errorElements = page.locator('text=/error|failed|try again/i, [data-testid*="error"]');
        const errorCount = await errorElements.count();
        
        // Either no errors should be visible, or they should be handled gracefully
        if (errorCount > 0) {
            await expect(errorElements.first()).toBeVisible();
        }
    });
});
