/**
 * Component Accessibility Tests
 * 
 * Comprehensive accessibility testing for all UI components
 * Tests WCAG 2.1 AA compliance, keyboard navigation, and screen reader compatibility
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Component Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the component testing page
    await page.goto('/');
    await injectAxe(page);
  });

  test.describe('Button Components', () => {
    test('should pass accessibility audit for all button variants', async ({ page }) => {
      // Test primary button
      await page.goto('/demo'); // Assuming there's a demo page with buttons
      
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true }
      });
    });

    test('should be keyboard accessible', async ({ page }) => {
      await page.goto('/demo');
      
      // Find first button and test keyboard navigation
      const button = page.locator('button').first();
      await button.focus();
      
      // Check if button is focused
      await expect(button).toBeFocused();
      
      // Test Enter key activation
      await page.keyboard.press('Enter');
      
      // Test Space key activation
      await button.focus();
      await page.keyboard.press(' ');
    });

    test('should have proper ARIA attributes', async ({ page }) => {
      await page.goto('/demo');
      
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        
        // Check for accessible name
        const accessibleName = await button.getAttribute('aria-label') ||
                              await button.textContent() ||
                              await button.getAttribute('aria-labelledby');
        
        expect(accessibleName).toBeTruthy();
        
        // Check role (should be button or implicit)
        const role = await button.getAttribute('role');
        if (role) {
          expect(role).toBe('button');
        }
      }
    });
  });

  test.describe('Form Components', () => {
    test('should pass accessibility audit for form elements', async ({ page }) => {
      await page.goto('/demo');
      
      await checkA11y(page, 'form', {
        rules: {
          'label': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
          'aria-required-attr': { enabled: true }
        }
      });
    });

    test('should have proper form labeling', async ({ page }) => {
      await page.goto('/demo');
      
      const inputs = page.locator('input');
      const count = await inputs.count();
      
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const inputId = await input.getAttribute('id');
        
        if (inputId) {
          // Check for associated label
          const label = page.locator(`label[for="${inputId}"]`);
          await expect(label).toBeVisible();
        } else {
          // Check for aria-label or aria-labelledby
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledby = await input.getAttribute('aria-labelledby');
          
          expect(ariaLabel || ariaLabelledby).toBeTruthy();
        }
      }
    });

    test('should handle required field validation accessibly', async ({ page }) => {
      await page.goto('/demo');
      
      const requiredInputs = page.locator('input[required]');
      const count = await requiredInputs.count();
      
      for (let i = 0; i < count; i++) {
        const input = requiredInputs.nth(i);
        
        // Check for aria-required
        const ariaRequired = await input.getAttribute('aria-required');
        expect(ariaRequired).toBe('true');
        
        // Check for error message association
        const ariaDescribedby = await input.getAttribute('aria-describedby');
        if (ariaDescribedby) {
          const errorElement = page.locator(`#${ariaDescribedby}`);
          await expect(errorElement).toBeInViewport();
        }
      }
    });
  });

  test.describe('Navigation Components', () => {
    test('should have accessible navigation structure', async ({ page }) => {
      await page.goto('/');
      
      // Check for main navigation landmarks
      await expect(page.locator('nav')).toBeVisible();
      
      // Test skip links
      const skipLink = page.locator('a[href="#main"]').first();
      if (await skipLink.count() > 0) {
        await expect(skipLink).toBeVisible();
      }
      
      await checkA11y(page, 'nav');
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');
      
      // Test tab navigation through navigation items
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test arrow key navigation if applicable
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowUp');
    });
  });

  test.describe('Modal and Dialog Components', () => {
    test('should trap focus within modals', async ({ page }) => {
      await page.goto('/demo');
      
      // Look for modal trigger
      const modalTrigger = page.locator('[data-testid="modal-trigger"]').first();
      if (await modalTrigger.count() > 0) {
        await modalTrigger.click();
        
        // Check if modal is open
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();
        
        // Test focus trap
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        
        // Focused element should be within modal
        const isWithinModal = await focusedElement.evaluate(
          (el, modalEl) => modalEl.contains(el),
          await modal.elementHandle()
        );
        expect(isWithinModal).toBe(true);
        
        // Test escape key closes modal
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    });

    test('should have proper ARIA attributes for dialogs', async ({ page }) => {
      await page.goto('/demo');
      
      const dialogs = page.locator('[role="dialog"]');
      const count = await dialogs.count();
      
      for (let i = 0; i < count; i++) {
        const dialog = dialogs.nth(i);
        
        // Check for aria-labelledby or aria-label
        const ariaLabelledby = await dialog.getAttribute('aria-labelledby');
        const ariaLabel = await dialog.getAttribute('aria-label');
        
        expect(ariaLabelledby || ariaLabel).toBeTruthy();
        
        // Check for aria-modal
        const ariaModal = await dialog.getAttribute('aria-modal');
        expect(ariaModal).toBe('true');
      }
    });
  });

  test.describe('Color Contrast', () => {
    test('should meet WCAG AA color contrast requirements', async ({ page }) => {
      await page.goto('/');
      
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });

    test('should be visible in high contrast mode', async ({ page, context }) => {
      // Enable high contrast mode
      await context.addInitScript(() => {
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: () => ({
            matches: true,
            addListener: () => {},
            removeListener: () => {},
          }),
        });
      });
      
      await page.goto('/');
      
      // Check if elements are still visible
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
      
      const buttons = page.locator('button');
      const count = await buttons.count();
      
      for (let i = 0; i < count; i++) {
        await expect(buttons.nth(i)).toBeVisible();
      }
    });
  });

  test.describe('Responsive Accessibility', () => {
    test('should maintain accessibility on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true },
          'touch-target-size': { enabled: true }
        }
      });
    });

    test('should be accessible with zoom enabled', async ({ page }) => {
      // Simulate 200% zoom
      await page.setViewportSize({ width: 960, height: 540 });
      await page.goto('/');
      
      await checkA11y(page);
      
      // Check if main content is still accessible
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Screen Reader Compatibility', () => {
    test('should provide meaningful heading structure', async ({ page }) => {
      await page.goto('/');
      
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const count = await headings.count();
      
      expect(count).toBeGreaterThan(0);
      
      // Check for h1
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      
      // Verify heading hierarchy
      let previousLevel = 0;
      for (let i = 0; i < count; i++) {
        const heading = headings.nth(i);
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        const level = parseInt(tagName.charAt(1));
        
        // Heading levels shouldn't skip more than one level
        if (previousLevel > 0) {
          expect(level - previousLevel).toBeLessThanOrEqual(1);
        }
        
        previousLevel = level;
      }
    });

    test('should have proper landmark regions', async ({ page }) => {
      await page.goto('/');
      
      // Check for main landmark
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();
      
      // Check for navigation landmark
      const nav = page.locator('nav, [role="navigation"]');
      if (await nav.count() > 0) {
        await expect(nav.first()).toBeVisible();
      }
      
      // Check for content info (footer)
      const footer = page.locator('footer, [role="contentinfo"]');
      if (await footer.count() > 0) {
        await expect(footer.first()).toBeVisible();
      }
    });
  });

  test.describe('Comprehensive Accessibility Audit', () => {
    test('should pass complete WCAG 2.1 AA compliance test', async ({ page }) => {
      await page.goto('/');
      
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
        rules: {
          // All WCAG 2.1 AA rules
          'color-contrast': { enabled: true },
          'keyboard': { enabled: true },
          'focus-order-semantics': { enabled: true },
          'aria-allowed-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'button-name': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
          'heading-order': { enabled: true },
          'html-has-lang': { enabled: true },
          'html-lang-valid': { enabled: true },
          'image-alt': { enabled: true },
          'label': { enabled: true },
          'link-name': { enabled: true },
          'list': { enabled: true },
          'listitem': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'region': { enabled: true },
          'landmark-one-main': { enabled: true }
        }
      });
    });
  });
});