import { test, expect } from '@playwright/test';

test.describe('Accessibility Features', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:3000');
        
        // Wait for the page to load
        await page.waitForLoadState('networkidle');
    });

    test('should have skip links that work', async ({ page }) => {
        // Focus the first skip link
        await page.keyboard.press('Tab');
        
        // Check if skip link is visible when focused
        const skipLink = page.locator('a[href="#main-content"]').first();
        await expect(skipLink).toBeVisible();
        
        // Press Enter to activate skip link
        await page.keyboard.press('Enter');
        
        // Check if main content is focused
        const mainContent = page.locator('#main-content');
        await expect(mainContent).toBeFocused();
    });

    test('should support keyboard navigation', async ({ page }) => {
        // Test Tab navigation
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        
        // Check if focus is visible
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
        
        // Test Shift+Tab (reverse navigation)
        await page.keyboard.press('Shift+Tab');
        
        // Should move focus backwards
        const newFocusedElement = page.locator(':focus');
        await expect(newFocusedElement).toBeVisible();
    });

    test('should show keyboard shortcuts help', async ({ page }) => {
        // Press Shift+? to show help
        await page.keyboard.press('Shift+?');
        
        // Check if help dialog appears
        const helpDialog = page.locator('[role="dialog"]');
        await expect(helpDialog).toBeVisible();
        
        // Check if help dialog has proper ARIA attributes
        await expect(helpDialog).toHaveAttribute('aria-modal', 'true');
        await expect(helpDialog).toHaveAttribute('aria-labelledby');
        
        // Close with Escape
        await page.keyboard.press('Escape');
        await expect(helpDialog).not.toBeVisible();
    });

    test('should support global keyboard shortcuts', async ({ page }) => {
        // Test search shortcut (/)
        await page.keyboard.press('/');
        
        // Check if search input is focused
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
        if (await searchInput.count() > 0) {
            await expect(searchInput).toBeFocused();
        }
        
        // Test sidebar toggle (Cmd/Ctrl+B)
        const isMac = process.platform === 'darwin';
        const modifier = isMac ? 'Meta' : 'Control';
        await page.keyboard.press(`${modifier}+KeyB`);
        
        // Wait for sidebar animation
        await page.waitForTimeout(300);
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
        // Check for main landmarks
        const main = page.locator('main');
        await expect(main).toBeVisible();
        
        // Check for navigation landmarks
        const nav = page.locator('nav').first();
        if (await nav.count() > 0) {
            await expect(nav).toBeVisible();
        }
        
        // Check for buttons with proper labels
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
            const button = buttons.nth(i);
            const hasLabel = await button.evaluate(el => {
                return !!(
                    el.textContent?.trim() ||
                    el.getAttribute('aria-label') ||
                    el.getAttribute('aria-labelledby') ||
                    el.querySelector('span:not(.sr-only)')?.textContent?.trim()
                );
            });
            expect(hasLabel).toBeTruthy();
        }
    });

    test('should support copy/paste functionality', async ({ page }) => {
        // Navigate to a page with editable content
        await page.goto('http://localhost:3000/org/test/project/test/requirements/test');
        await page.waitForLoadState('networkidle');
        
        // Find an editable element
        const editableElement = page.locator('input, textarea, [contenteditable="true"]').first();
        
        if (await editableElement.count() > 0) {
            await editableElement.click();
            await editableElement.fill('Test content for copy/paste');
            
            // Select all text
            await page.keyboard.press('Control+a');
            
            // Copy text
            await page.keyboard.press('Control+c');
            
            // Clear and paste
            await editableElement.clear();
            await page.keyboard.press('Control+v');
            
            // Verify content was pasted
            await expect(editableElement).toHaveValue('Test content for copy/paste');
        }
    });

    test('should have focus indicators', async ({ page }) => {
        // Add CSS to detect focus indicators
        await page.addStyleTag({
            content: `
                .focus-test { outline: 2px solid red !important; }
                *:focus-visible { outline: 2px solid blue !important; }
            `
        });
        
        // Tab through elements and check for focus indicators
        await page.keyboard.press('Tab');
        
        const focusedElement = page.locator(':focus');
        if (await focusedElement.count() > 0) {
            const hasOutline = await focusedElement.evaluate(el => {
                const styles = window.getComputedStyle(el);
                return styles.outline !== 'none' && styles.outline !== '';
            });
            expect(hasOutline).toBeTruthy();
        }
    });

    test('should handle table navigation with arrow keys', async ({ page }) => {
        // Navigate to a page with a table
        await page.goto('http://localhost:3000/org/test/project/test');
        await page.waitForLoadState('networkidle');
        
        // Look for editable tables
        const table = page.locator('table').first();
        
        if (await table.count() > 0) {
            // Click on first cell to enter edit mode
            const firstCell = table.locator('td').first();
            if (await firstCell.count() > 0) {
                await firstCell.click();
                
                // Test arrow key navigation
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('ArrowLeft');
                await page.keyboard.press('ArrowUp');
                
                // Should not throw errors
            }
        }
    });

    test('should announce status updates to screen readers', async ({ page }) => {
        // Check for ARIA live regions
        const liveRegions = page.locator('[aria-live]');
        const liveRegionCount = await liveRegions.count();
        
        // Should have at least one live region for announcements
        expect(liveRegionCount).toBeGreaterThan(0);
        
        // Check if live regions have proper politeness settings
        for (let i = 0; i < liveRegionCount; i++) {
            const region = liveRegions.nth(i);
            const politeness = await region.getAttribute('aria-live');
            expect(['polite', 'assertive', 'off']).toContain(politeness);
        }
    });

    test('should support high contrast mode', async ({ page }) => {
        // Simulate high contrast mode
        await page.emulateMedia({ colorScheme: 'dark' });
        
        // Check if elements are still visible and accessible
        const buttons = page.locator('button').first();
        if (await buttons.count() > 0) {
            await expect(buttons).toBeVisible();
        }
        
        const links = page.locator('a').first();
        if (await links.count() > 0) {
            await expect(links).toBeVisible();
        }
    });

    test('should work with reduced motion preferences', async ({ page }) => {
        // Simulate reduced motion preference
        await page.emulateMedia({ reducedMotion: 'reduce' });
        
        // Navigate and interact with elements
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');
        
        // Should not cause issues with reduced motion
        await page.waitForTimeout(100);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
        // Check heading structure
        const headings = page.locator('h1, h2, h3, h4, h5, h6');
        const headingCount = await headings.count();
        
        if (headingCount > 0) {
            // Should have at least one h1
            const h1Count = await page.locator('h1').count();
            expect(h1Count).toBeGreaterThanOrEqual(1);
            
            // Check heading levels are logical
            const headingLevels = [];
            for (let i = 0; i < headingCount; i++) {
                const heading = headings.nth(i);
                const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
                const level = parseInt(tagName.charAt(1));
                headingLevels.push(level);
            }
            
            // First heading should be h1
            expect(headingLevels[0]).toBe(1);
        }
    });

    test('should handle form validation accessibly', async ({ page }) => {
        // Look for forms
        const forms = page.locator('form');
        const formCount = await forms.count();
        
        if (formCount > 0) {
            const form = forms.first();
            
            // Check for proper labels
            const inputs = form.locator('input, textarea, select');
            const inputCount = await inputs.count();
            
            for (let i = 0; i < Math.min(inputCount, 3); i++) {
                const input = inputs.nth(i);
                const hasLabel = await input.evaluate(el => {
                    const id = el.id;
                    const label = document.querySelector(`label[for="${id}"]`);
                    const ariaLabel = el.getAttribute('aria-label');
                    const ariaLabelledBy = el.getAttribute('aria-labelledby');
                    
                    return !!(label || ariaLabel || ariaLabelledBy);
                });
                
                if (await input.isVisible()) {
                    expect(hasLabel).toBeTruthy();
                }
            }
        }
    });
});
