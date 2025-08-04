/**
 * Page Visual Regression Tests
 * Comprehensive visual testing for all application pages
 */

import { test, expect, Page } from '@playwright/test';
import { VisualTestUtils, AccessibilityVisualUtils } from '../../scripts/visual-testing/visual-utils.js';
import visualConfig from '../../scripts/visual-testing/visual-config.js';

const routes = visualConfig.pages.routes;
const userStates = visualConfig.pages.userStates;
const dataStates = visualConfig.pages.dataStates;

test.describe('Page Visual Tests', () => {
  let visualUtils: VisualTestUtils;

  test.beforeEach(async ({ page, browserName }) => {
    visualUtils = new VisualTestUtils(page, browserName);
  });

  // Test each route in different user states
  for (const route of routes) {
    test.describe(`${route.name} page`, () => {
      
      test(`${route.name} - anonymous user`, async ({ page, browserName }) => {
        if (route.requiresAuth) {
          // Should redirect to login or show access denied
          await page.goto(route.path);
          await visualUtils.preparePage();
          
          await expect(page).toHaveScreenshot(
            `${route.name}-unauthorized-${browserName}.png`,
            { fullPage: true }
          );
        } else {
          await page.goto(route.path);
          await visualUtils.preparePage();
          await visualUtils.waitForStableLayout();
          
          await expect(page).toHaveScreenshot(
            `${route.name}-anonymous-${browserName}.png`,
            { fullPage: true }
          );
        }
      });

      if (route.requiresAuth) {
        test(`${route.name} - authenticated user`, async ({ page, browserName }) => {
          // Mock authentication
          await page.addInitScript(() => {
            localStorage.setItem('auth_token', 'mock_token');
            localStorage.setItem('user_role', 'user');
          });

          await page.goto(route.path);
          await visualUtils.preparePage();
          await visualUtils.waitForStableLayout();
          
          await expect(page).toHaveScreenshot(
            `${route.name}-authenticated-${browserName}.png`,
            { fullPage: true }
          );
        });

        test(`${route.name} - admin user`, async ({ page, browserName }) => {
          // Mock admin authentication
          await page.addInitScript(() => {
            localStorage.setItem('auth_token', 'mock_admin_token');
            localStorage.setItem('user_role', 'admin');
          });

          await page.goto(route.path);
          await visualUtils.preparePage();
          await visualUtils.waitForStableLayout();
          
          await expect(page).toHaveScreenshot(
            `${route.name}-admin-${browserName}.png`,
            { fullPage: true }
          );
        });
      }

      // Test different data states
      for (const dataState of dataStates) {
        test(`${route.name} - ${dataState} state`, async ({ page, browserName }) => {
          // Setup authentication if required
          if (route.requiresAuth) {
            await page.addInitScript(() => {
              localStorage.setItem('auth_token', 'mock_token');
              localStorage.setItem('user_role', 'user');
            });
          }

          // Mock different data states
          await page.addInitScript((state) => {
            window.mockDataState = state;
          }, dataState);

          await page.goto(route.path);
          await visualUtils.preparePage();
          
          // Handle different data states
          switch (dataState) {
            case 'loading':
              // Don't wait for network idle for loading state
              await page.waitForTimeout(1000);
              break;
            case 'error':
              // Simulate error state
              await page.evaluate(() => {
                window.dispatchEvent(new CustomEvent('mock-error'));
              });
              await page.waitForTimeout(500);
              break;
            case 'empty':
              // Clear any existing data
              await page.evaluate(() => {
                window.dispatchEvent(new CustomEvent('mock-empty'));
              });
              await page.waitForTimeout(500);
              break;
            default:
              await visualUtils.waitForStableLayout();
              break;
          }

          await expect(page).toHaveScreenshot(
            `${route.name}-${dataState}-${browserName}.png`,
            { fullPage: true }
          );
        });
      }

      // Test responsive design
      test(`${route.name} - responsive design`, async ({ page, browserName }) => {
        // Setup authentication if required
        if (route.requiresAuth) {
          await page.addInitScript(() => {
            localStorage.setItem('auth_token', 'mock_token');
            localStorage.setItem('user_role', 'user');
          });
        }

        const viewports = [
          { name: 'mobile', width: 375, height: 667 },
          { name: 'tablet', width: 768, height: 1024 },
          { name: 'desktop', width: 1920, height: 1080 },
        ];

        for (const viewport of viewports) {
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          });

          await page.goto(route.path);
          await visualUtils.preparePage();
          await visualUtils.waitForStableLayout();

          await expect(page).toHaveScreenshot(
            `${route.name}-${viewport.name}-${browserName}.png`,
            { fullPage: true }
          );
        }
      });

      // Test dark/light themes
      test(`${route.name} - theme variations`, async ({ page, browserName }) => {
        // Setup authentication if required
        if (route.requiresAuth) {
          await page.addInitScript(() => {
            localStorage.setItem('auth_token', 'mock_token');
            localStorage.setItem('user_role', 'user');
          });
        }

        const themes = ['light', 'dark'];

        for (const theme of themes) {
          await page.goto(route.path);
          
          // Apply theme
          await page.evaluate((themeName) => {
            document.documentElement.setAttribute('data-theme', themeName);
            document.body.className = document.body.className
              .replace(/theme-\w+/g, '') + ` theme-${themeName}`;
          }, theme);

          await visualUtils.preparePage();
          await visualUtils.waitForStableLayout();

          await expect(page).toHaveScreenshot(
            `${route.name}-${theme}-theme-${browserName}.png`,
            { fullPage: true }
          );
        }
      });
    });
  }

  // Test specific page interactions
  test.describe('Page Interactions', () => {
    
    test('Navigation menu interactions', async ({ page, browserName }) => {
      await page.goto('/');
      await visualUtils.preparePage();

      // Test main navigation
      const navItems = page.locator('nav a, nav button');
      const navCount = await navItems.count();

      for (let i = 0; i < Math.min(navCount, 5); i++) {
        await navItems.nth(i).hover();
        await page.waitForTimeout(100);

        await expect(page).toHaveScreenshot(
          `navigation-hover-${i}-${browserName}.png`,
          { fullPage: true }
        );
      }
    });

    test('Modal and dialog interactions', async ({ page, browserName }) => {
      await page.goto('/dashboard');
      await visualUtils.preparePage();

      // Look for modal triggers
      const modalTriggers = page.locator('[data-modal], [data-dialog], button:has-text("open"), button:has-text("show")');
      const triggerCount = await modalTriggers.count();

      for (let i = 0; i < Math.min(triggerCount, 3); i++) {
        await modalTriggers.nth(i).click();
        await page.waitForTimeout(300); // Wait for modal animation

        await expect(page).toHaveScreenshot(
          `modal-${i}-open-${browserName}.png`,
          { fullPage: true }
        );

        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    });

    test('Form interactions', async ({ page, browserName }) => {
      await page.goto('/login');
      await visualUtils.preparePage();

      // Test form states
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      const submitButton = page.locator('button[type="submit"], input[type="submit"]');

      if (await emailInput.count() > 0) {
        // Empty form
        await expect(page).toHaveScreenshot(
          `login-form-empty-${browserName}.png`,
          { fullPage: true }
        );

        // Focus states
        await emailInput.focus();
        await expect(page).toHaveScreenshot(
          `login-form-email-focus-${browserName}.png`,
          { fullPage: true }
        );

        // Filled form
        await emailInput.fill('test@example.com');
        await passwordInput.fill('password123');
        await expect(page).toHaveScreenshot(
          `login-form-filled-${browserName}.png`,
          { fullPage: true }
        );

        // Validation errors (if any)
        await emailInput.fill('invalid-email');
        await submitButton.click();
        await page.waitForTimeout(500);
        await expect(page).toHaveScreenshot(
          `login-form-validation-error-${browserName}.png`,
          { fullPage: true }
        );
      }
    });

    test('Search functionality', async ({ page, browserName }) => {
      await page.goto('/dashboard');
      await visualUtils.preparePage();

      const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[aria-label*="search"]');

      if (await searchInput.count() > 0) {
        // Empty search
        await expect(page).toHaveScreenshot(
          `search-empty-${browserName}.png`,
          { fullPage: true }
        );

        // Focus search
        await searchInput.focus();
        await expect(page).toHaveScreenshot(
          `search-focus-${browserName}.png`,
          { fullPage: true }
        );

        // Search with results
        await searchInput.fill('test');
        await page.waitForTimeout(500); // Wait for search results
        await expect(page).toHaveScreenshot(
          `search-with-results-${browserName}.png`,
          { fullPage: true }
        );

        // No results
        await searchInput.fill('xyzxyzxyz');
        await page.waitForTimeout(500);
        await expect(page).toHaveScreenshot(
          `search-no-results-${browserName}.png`,
          { fullPage: true }
        );
      }
    });
  });

  // Test error states and edge cases
  test.describe('Error States and Edge Cases', () => {
    
    test('404 page', async ({ page, browserName }) => {
      await page.goto('/non-existent-page');
      await visualUtils.preparePage();
      await visualUtils.waitForStableLayout();

      await expect(page).toHaveScreenshot(
        `404-page-${browserName}.png`,
        { fullPage: true }
      );
    });

    test('Network error simulation', async ({ page, browserName }) => {
      // Simulate offline
      await page.context().setOffline(true);
      
      await page.goto('/dashboard');
      await page.waitForTimeout(2000); // Wait for error state
      
      await expect(page).toHaveScreenshot(
        `network-error-${browserName}.png`,
        { fullPage: true }
      );

      await page.context().setOffline(false);
    });

    test('Slow network simulation', async ({ page, browserName }) => {
      // Simulate slow network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 1000);
      });

      await page.goto('/dashboard');
      await page.waitForTimeout(500); // Capture loading state
      
      await expect(page).toHaveScreenshot(
        `slow-loading-${browserName}.png`,
        { fullPage: true }
      );
    });

    test('JavaScript disabled', async ({ page, browserName }) => {
      await page.context().addInitScript(() => {
        Object.defineProperty(window, 'JavaScript', {
          get: () => false
        });
      });

      await page.goto('/');
      await visualUtils.preparePage();
      await visualUtils.waitForStableLayout();

      await expect(page).toHaveScreenshot(
        `no-javascript-${browserName}.png`,
        { fullPage: true }
      );
    });
  });
});

// Accessibility Page Tests
test.describe('Page Accessibility Visual Tests', () => {
  let accessibilityUtils: AccessibilityVisualUtils;

  test.beforeEach(async ({ page, browserName }) => {
    accessibilityUtils = new AccessibilityVisualUtils(page, browserName);
  });

  for (const route of routes.slice(0, 3)) { // Test first 3 routes for accessibility
    test(`${route.name} - high contrast`, async ({ page, browserName }) => {
      if (route.requiresAuth) {
        await page.addInitScript(() => {
          localStorage.setItem('auth_token', 'mock_token');
        });
      }

      await page.goto(route.path);
      await accessibilityUtils.testHighContrast('body');
      
      await expect(page).toHaveScreenshot(
        `${route.name}-high-contrast-${browserName}.png`,
        { fullPage: true }
      );
    });

    test(`${route.name} - reduced motion`, async ({ page, browserName }) => {
      if (route.requiresAuth) {
        await page.addInitScript(() => {
          localStorage.setItem('auth_token', 'mock_token');
        });
      }

      await page.goto(route.path);
      await accessibilityUtils.testReducedMotion('body');
      
      await expect(page).toHaveScreenshot(
        `${route.name}-reduced-motion-${browserName}.png`,
        { fullPage: true }
      );
    });

    test(`${route.name} - keyboard navigation`, async ({ page, browserName }) => {
      if (route.requiresAuth) {
        await page.addInitScript(() => {
          localStorage.setItem('auth_token', 'mock_token');
        });
      }

      await page.goto(route.path);
      await accessibilityUtils.preparePage();

      // Tab through focusable elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }

      await expect(page).toHaveScreenshot(
        `${route.name}-keyboard-focus-${browserName}.png`,
        { fullPage: true }
      );
    });
  }
});