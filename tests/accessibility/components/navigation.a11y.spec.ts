/**
 * Navigation Accessibility E2E Tests
 * 
 * End-to-end accessibility testing for navigation components using Playwright
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Navigation Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Inject axe-core for accessibility testing
    await injectAxe(page);
  });

  test('navigation landmarks should be accessible', async ({ page }) => {
    // Check for main navigation landmark
    const navigation = page.locator('nav[role="navigation"], [role="navigation"]').first();
    await expect(navigation).toBeVisible();
    
    // Verify navigation has accessible name
    const navName = await navigation.getAttribute('aria-label') || 
                   await navigation.getAttribute('aria-labelledby');
    expect(navName).toBeTruthy();
    
    // Run axe accessibility check on navigation
    await checkA11y(page, 'nav', {
      axeOptions: {
        tags: ['wcag2aa', 'wcag21aa'],
        rules: {
          'landmark-unique': { enabled: true },
          'landmark-no-duplicate-banner': { enabled: true }
        }
      }
    });
  });

  test('keyboard navigation should work correctly', async ({ page }) => {
    // Focus on the first focusable element
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test Tab navigation through navigation items
    const navigationItems = page.locator('nav a, nav button');
    const itemCount = await navigationItems.count();
    
    for (let i = 0; i < itemCount; i++) {
      await page.keyboard.press('Tab');
      const currentFocus = page.locator(':focus');
      
      // Verify focus is on a navigation item
      const isNavItem = await currentFocus.evaluate(el => {
        const nav = el.closest('nav');
        return nav !== null;
      });
      
      if (isNavItem) {
        // Verify focus indicator is visible
        const focusStyles = await currentFocus.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            boxShadow: styles.boxShadow,
            border: styles.border
          };
        });
        
        expect(
          focusStyles.outline !== 'none' || 
          focusStyles.boxShadow !== 'none' ||
          focusStyles.border !== 'none'
        ).toBeTruthy();
      }
    }
  });

  test('navigation links should have appropriate roles and states', async ({ page }) => {
    const navLinks = page.locator('nav a');
    const linkCount = await navLinks.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = navLinks.nth(i);
      
      // Check that links have accessible names
      const accessibleName = await link.getAttribute('aria-label') ||
                            await link.textContent();
      expect(accessibleName?.trim()).toBeTruthy();
      
      // Check for current page indicators
      const ariaCurrent = await link.getAttribute('aria-current');
      if (ariaCurrent) {
        expect(['page', 'step', 'location', 'date', 'time', 'true']).toContain(ariaCurrent);
      }
    }
    
    // Run comprehensive accessibility check
    await checkA11y(page, 'nav a', {
      axeOptions: {
        tags: ['wcag2aa'],
        rules: {
          'link-name': { enabled: true },
          'link-in-text-block': { enabled: true }
        }
      }
    });
  });

  test('mobile navigation should be accessible', async ({ page, isMobile }) => {
    if (isMobile) {
      // Look for mobile menu toggle
      const menuToggle = page.locator('[aria-expanded], [aria-controls*="menu"], button:has-text("Menu")').first();
      
      if (await menuToggle.isVisible()) {
        // Verify menu toggle has accessible name
        const toggleName = await menuToggle.getAttribute('aria-label') ||
                          await menuToggle.textContent();
        expect(toggleName?.trim()).toBeTruthy();
        
        // Verify initial state
        const initialExpanded = await menuToggle.getAttribute('aria-expanded');
        expect(initialExpanded).toBe('false');
        
        // Test opening menu
        await menuToggle.click();
        
        // Verify expanded state
        const expandedState = await menuToggle.getAttribute('aria-expanded');
        expect(expandedState).toBe('true');
        
        // Verify menu is accessible
        const menuId = await menuToggle.getAttribute('aria-controls');
        if (menuId) {
          const menu = page.locator(`#${menuId}`);
          await expect(menu).toBeVisible();
          
          // Check menu accessibility
          await checkA11y(page, `#${menuId}`, {
            axeOptions: {
              tags: ['wcag2aa']
            }
          });
        }
        
        // Test closing menu with Escape
        await page.keyboard.press('Escape');
        const escapedState = await menuToggle.getAttribute('aria-expanded');
        expect(escapedState).toBe('false');
      }
    }
  });

  test('breadcrumb navigation should be accessible', async ({ page }) => {
    const breadcrumbs = page.locator('[aria-label*="breadcrumb"], nav ol, nav ul').first();
    
    if (await breadcrumbs.isVisible()) {
      // Verify breadcrumb container has proper labeling
      const breadcrumbLabel = await breadcrumbs.getAttribute('aria-label');
      expect(breadcrumbLabel).toContain('breadcrumb');
      
      // Check breadcrumb items
      const breadcrumbItems = breadcrumbs.locator('li, a');
      const itemCount = await breadcrumbItems.count();
      
      if (itemCount > 0) {
        // Last item should indicate current page
        const lastItem = breadcrumbItems.last();
        const ariaCurrent = await lastItem.getAttribute('aria-current');
        
        if (ariaCurrent) {
          expect(ariaCurrent).toBe('page');
        }
        
        // Run accessibility check
        await checkA11y(page, '[aria-label*="breadcrumb"]', {
          axeOptions: {
            tags: ['wcag2aa']
          }
        });
      }
    }
  });

  test('skip links should be functional', async ({ page }) => {
    // Test skip to main content link
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('a:has-text("Skip to"), a[href="#main"], a[href="#content"]').first();
    
    if (await skipLink.isVisible()) {
      // Verify skip link has accessible name
      const skipText = await skipLink.textContent();
      expect(skipText?.toLowerCase()).toContain('skip');
      
      // Test skip link functionality
      await skipLink.click();
      
      // Verify focus moved to main content
      const mainContent = page.locator('#main, #content, main, [role="main"]').first();
      const focusedElement = page.locator(':focus');
      
      // Focus should be on or within main content
      const isMainFocused = await focusedElement.evaluate((el, mainSelector) => {
        const main = document.querySelector(mainSelector);
        return main === el || main?.contains(el);
      }, await mainContent.getAttribute('id') ? `#${await mainContent.getAttribute('id')}` : 'main');
      
      expect(isMainFocused).toBeTruthy();
    }
  });

  test('navigation should work with screen readers', async ({ page }) => {
    // Test ARIA live regions for navigation changes
    const liveRegion = page.locator('[aria-live], [role="status"], [role="alert"]');
    
    // Navigate to a different page
    const firstNavLink = page.locator('nav a').first();
    if (await firstNavLink.isVisible()) {
      await firstNavLink.click();
      
      // Wait for navigation to complete
      await page.waitForLoadState('networkidle');
      
      // Check if navigation change was announced
      if (await liveRegion.count() > 0) {
        const announcement = await liveRegion.first().textContent();
        expect(announcement?.trim()).toBeTruthy();
      }
    }
    
    // Run comprehensive screen reader accessibility check
    await checkA11y(page, null, {
      axeOptions: {
        tags: ['wcag2aa'],
        rules: {
          'aria-hidden-focus': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true }
        }
      }
    });
  });

  test('navigation should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (forced-colors: active) {
          nav * {
            forced-color-adjust: none;
          }
        }
      `
    });
    
    // Enable high contrast simulation
    await page.evaluate(() => {
      if (window.accessibilityHelpers) {
        window.accessibilityHelpers.enableHighContrast();
      }
    });
    
    // Check navigation visibility in high contrast
    const navElements = page.locator('nav a, nav button');
    const elementCount = await navElements.count();
    
    for (let i = 0; i < elementCount; i++) {
      const element = navElements.nth(i);
      await expect(element).toBeVisible();
      
      // Verify element has visible borders/outline in high contrast
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          border: computed.border,
          outline: computed.outline,
          backgroundColor: computed.backgroundColor,
          color: computed.color
        };
      });
      
      // At least one visual indicator should be present
      expect(
        styles.border !== 'none' ||
        styles.outline !== 'none' ||
        styles.backgroundColor !== 'transparent'
      ).toBeTruthy();
    }
  });

  test('navigation should handle reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Enable reduced motion simulation
    await page.evaluate(() => {
      if (window.accessibilityHelpers) {
        window.accessibilityHelpers.enableReducedMotion();
      }
    });
    
    // Test that animations are disabled or reduced
    const animatedElements = page.locator('nav [class*="animate"], nav [class*="transition"]');
    const elementCount = await animatedElements.count();
    
    for (let i = 0; i < elementCount; i++) {
      const element = animatedElements.nth(i);
      const animationDuration = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          animationDuration: styles.animationDuration,
          transitionDuration: styles.transitionDuration
        };
      });
      
      // Animations should be disabled or very short
      expect(
        animationDuration.animationDuration === '0s' ||
        animationDuration.transitionDuration === '0s' ||
        parseFloat(animationDuration.animationDuration) < 0.1 ||
        parseFloat(animationDuration.transitionDuration) < 0.1
      ).toBeTruthy();
    }
  });

  test('complete navigation accessibility audit', async ({ page }) => {
    // Run comprehensive accessibility audit on entire navigation
    await checkA11y(page, 'nav, [role="navigation"]', {
      axeOptions: {
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
        timeout: 30000
      },
      detailedReport: true,
      detailedReportOptions: { 
        html: true 
      }
    });
  });
});