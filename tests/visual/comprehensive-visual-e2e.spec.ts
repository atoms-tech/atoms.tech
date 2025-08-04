/**
 * Comprehensive Visual E2E Testing
 * Integration of visual testing with E2E workflows for complete coverage
 */

import { test, expect } from '@playwright/test';
import { percySnapshot } from '@percy/playwright';

// Test configuration for visual E2E
const visualConfig = {
  threshold: 0.2,
  delay: 1000,
  waitForAnimations: true,
  hideElements: [
    '[data-testid="timestamp"]',
    '[data-testid="random-id"]',
    '.loading-spinner',
    '.skeleton',
    '[data-dynamic="true"]',
  ],
};

// Helper function to prepare page for visual testing
async function preparePageForVisual(page) {
  // Disable animations
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: -1ms !important;
        animation-duration: 1ms !important;
        animation-iteration-count: 1 !important;
        background-attachment: initial !important;
        scroll-behavior: auto !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });

  // Hide dynamic elements
  await page.addStyleTag({
    content: `
      ${visualConfig.hideElements.join(', ')} {
        visibility: hidden !important;
      }
    `,
  });

  // Wait for fonts and assets
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  
  // Additional stability wait
  await page.waitForTimeout(visualConfig.delay);
}

// Helper function to take cross-browser visual snapshot
async function takeVisualSnapshot(page, name, options = {}) {
  await preparePageForVisual(page);
  
  // Take Playwright screenshot for baseline
  await expect(page).toHaveScreenshot(`${name}.png`, {
    threshold: visualConfig.threshold,
    ...options,
  });
  
  // Take Percy snapshot if available
  if (typeof percySnapshot === 'function') {
    await percySnapshot(page, name, options);
  }
}

test.describe('Comprehensive Visual E2E Testing', () => {
  
  test.describe('Authentication Flow Visual Testing', () => {
    test('Login page visual states', async ({ page }) => {
      await page.goto('/login');
      
      // Empty state
      await takeVisualSnapshot(page, 'login-empty-state');
      
      // Fill form
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await takeVisualSnapshot(page, 'login-filled-state');
      
      // Focus states
      await page.focus('input[type="email"]');
      await takeVisualSnapshot(page, 'login-email-focus');
      
      await page.focus('input[type="password"]');
      await takeVisualSnapshot(page, 'login-password-focus');
      
      // Hover state on button
      await page.hover('button[type="submit"]');
      await takeVisualSnapshot(page, 'login-button-hover');
    });

    test('Registration page visual states', async ({ page }) => {
      await page.goto('/register');
      
      // Empty state
      await takeVisualSnapshot(page, 'register-empty-state');
      
      // Progressive filling
      await page.fill('input[name="name"]', 'Test User');
      await takeVisualSnapshot(page, 'register-name-filled');
      
      await page.fill('input[type="email"]', 'test@example.com');
      await takeVisualSnapshot(page, 'register-email-filled');
      
      await page.fill('input[type="password"]', 'password123');
      await takeVisualSnapshot(page, 'register-password-filled');
      
      await page.fill('input[name="confirmPassword"]', 'password123');
      await takeVisualSnapshot(page, 'register-complete-filled');
      
      // Error state simulation
      await page.fill('input[name="confirmPassword"]', 'different');
      await page.blur('input[name="confirmPassword"]');
      await page.waitForTimeout(500);
      await takeVisualSnapshot(page, 'register-password-mismatch-error');
    });

    test('Authentication error states', async ({ page }) => {
      // Mock authentication error
      await page.route('**/api/auth/**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid credentials' }),
        });
      });

      await page.goto('/login');
      await page.fill('input[type="email"]', 'wrong@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Wait for error message
      await page.waitForSelector('[role="alert"], .error-message', { timeout: 5000 });
      await takeVisualSnapshot(page, 'login-authentication-error');
    });
  });

  test.describe('Dashboard Visual Testing', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication
      await page.context().addCookies([
        {
          name: 'auth-token',
          value: 'mock-token',
          domain: 'localhost',
          path: '/',
        },
      ]);
    });

    test('Dashboard empty state', async ({ page }) => {
      // Mock empty data
      await page.route('**/api/dashboard/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ projects: [], stats: { total: 0 } }),
        });
      });

      await page.goto('/dashboard');
      await takeVisualSnapshot(page, 'dashboard-empty-state');
    });

    test('Dashboard with data', async ({ page }) => {
      // Mock data
      await page.route('**/api/dashboard/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            projects: [
              { id: 1, name: 'Project Alpha', status: 'active' },
              { id: 2, name: 'Project Beta', status: 'completed' },
              { id: 3, name: 'Project Gamma', status: 'draft' },
            ],
            stats: { total: 3, active: 1, completed: 1, draft: 1 },
          }),
        });
      });

      await page.goto('/dashboard');
      await takeVisualSnapshot(page, 'dashboard-with-data');
    });

    test('Dashboard loading state', async ({ page }) => {
      // Mock slow response
      await page.route('**/api/dashboard/**', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ projects: [], stats: { total: 0 } }),
          });
        }, 2000);
      });

      await page.goto('/dashboard');
      // Capture loading state quickly
      await page.waitForTimeout(100);
      await takeVisualSnapshot(page, 'dashboard-loading-state');
    });

    test('Dashboard error state', async ({ page }) => {
      // Mock error response
      await page.route('**/api/dashboard/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      await page.goto('/dashboard');
      await page.waitForSelector('[role="alert"], .error-state', { timeout: 5000 });
      await takeVisualSnapshot(page, 'dashboard-error-state');
    });
  });

  test.describe('Navigation Visual Testing', () => {
    test('Navigation states across viewports', async ({ page }) => {
      await page.goto('/');
      
      // Desktop navigation
      await page.setViewportSize({ width: 1200, height: 800 });
      await takeVisualSnapshot(page, 'navigation-desktop', {
        clip: { x: 0, y: 0, width: 1200, height: 100 },
      });
      
      // Tablet navigation
      await page.setViewportSize({ width: 768, height: 1024 });
      await takeVisualSnapshot(page, 'navigation-tablet', {
        clip: { x: 0, y: 0, width: 768, height: 100 },
      });
      
      // Mobile navigation
      await page.setViewportSize({ width: 375, height: 667 });
      await takeVisualSnapshot(page, 'navigation-mobile', {
        clip: { x: 0, y: 0, width: 375, height: 100 },
      });
      
      // Mobile menu open
      await page.click('button[aria-label="Menu"], .mobile-menu-button');
      await page.waitForTimeout(300);
      await takeVisualSnapshot(page, 'navigation-mobile-menu-open');
    });

    test('Navigation active states', async ({ page }) => {
      await page.goto('/');
      
      // Hover states
      const navLinks = page.locator('nav a, nav button');
      const linkCount = await navLinks.count();
      
      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        await navLinks.nth(i).hover();
        await takeVisualSnapshot(page, `navigation-link-${i}-hover`);
      }
      
      // Focus states
      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        await navLinks.nth(i).focus();
        await takeVisualSnapshot(page, `navigation-link-${i}-focus`);
      }
    });
  });

  test.describe('Form Visual Testing', () => {
    test('Form validation states', async ({ page }) => {
      await page.goto('/contact'); // Assuming a contact form page
      
      // Empty form
      await takeVisualSnapshot(page, 'form-empty');
      
      // Progressive validation
      await page.fill('input[name="email"]', 'invalid-email');
      await page.blur('input[name="email"]');
      await page.waitForTimeout(300);
      await takeVisualSnapshot(page, 'form-email-invalid');
      
      await page.fill('input[name="email"]', 'valid@example.com');
      await page.blur('input[name="email"]');
      await page.waitForTimeout(300);
      await takeVisualSnapshot(page, 'form-email-valid');
      
      // Required field validation
      await page.fill('input[name="name"]', '');
      await page.blur('input[name="name"]');
      await page.waitForTimeout(300);
      await takeVisualSnapshot(page, 'form-required-field-error');
      
      // Complete valid form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('textarea[name="message"]', 'This is a test message.');
      await takeVisualSnapshot(page, 'form-complete-valid');
    });

    test('Form submission states', async ({ page }) => {
      await page.goto('/contact');
      
      // Fill form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="message"]', 'Test message');
      
      // Mock slow submission
      await page.route('**/api/contact', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
        }, 1000);
      });
      
      // Start submission
      await page.click('button[type="submit"]');
      await page.waitForTimeout(200);
      await takeVisualSnapshot(page, 'form-submitting');
      
      // Wait for success
      await page.waitForSelector('.success-message, [role="status"]', { timeout: 5000 });
      await takeVisualSnapshot(page, 'form-submit-success');
    });
  });

  test.describe('Modal and Dialog Visual Testing', () => {
    test('Modal lifecycle visual states', async ({ page }) => {
      await page.goto('/');
      
      // Page with modal closed
      await takeVisualSnapshot(page, 'modal-closed-state');
      
      // Open modal
      await page.click('button[data-modal-trigger], .open-modal');
      await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });
      await page.waitForTimeout(300); // Animation
      await takeVisualSnapshot(page, 'modal-open-state');
      
      // Modal with focus trap
      await page.keyboard.press('Tab');
      await takeVisualSnapshot(page, 'modal-focus-state');
      
      // Modal overlay click area
      await page.hover('.modal-overlay');
      await takeVisualSnapshot(page, 'modal-overlay-hover');
    });

    test('Confirmation dialog states', async ({ page }) => {
      await page.goto('/settings'); // Assuming settings with delete actions
      
      // Trigger confirmation dialog
      await page.click('button[data-confirm], .delete-button');
      await page.waitForSelector('[role="alertdialog"], .confirmation-dialog', { timeout: 5000 });
      await takeVisualSnapshot(page, 'confirmation-dialog');
      
      // Focus on cancel button
      await page.focus('button:has-text("Cancel")');
      await takeVisualSnapshot(page, 'confirmation-dialog-cancel-focus');
      
      // Focus on confirm button
      await page.focus('button:has-text("Delete"), button:has-text("Confirm")');
      await takeVisualSnapshot(page, 'confirmation-dialog-confirm-focus');
    });
  });

  test.describe('Responsive Layout Visual Testing', () => {
    const viewports = [
      { name: 'mobile-portrait', width: 375, height: 667 },
      { name: 'mobile-landscape', width: 667, height: 375 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
      { name: 'desktop-small', width: 1280, height: 720 },
      { name: 'desktop-large', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      test(`Layout consistency - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        const routes = ['/', '/about', '/dashboard', '/settings'];
        
        for (const route of routes) {
          await page.goto(route);
          await takeVisualSnapshot(page, `${route.replace('/', 'home')}-${viewport.name}`);
        }
      });
    }
  });

  test.describe('Theme Visual Testing', () => {
    const themes = ['light', 'dark', 'high-contrast'];
    
    for (const theme of themes) {
      test(`Theme consistency - ${theme}`, async ({ page }) => {
        await page.goto('/');
        
        // Apply theme
        await page.evaluate((themeName) => {
          document.documentElement.setAttribute('data-theme', themeName);
          document.body.className = `theme-${themeName}`;
        }, theme);
        
        await page.waitForTimeout(200); // Allow theme to apply
        
        const routes = ['/', '/dashboard', '/settings'];
        
        for (const route of routes) {
          await page.goto(route);
          await page.evaluate((themeName) => {
            document.documentElement.setAttribute('data-theme', themeName);
            document.body.className = `theme-${themeName}`;
          }, theme);
          await page.waitForTimeout(100);
          
          await takeVisualSnapshot(page, `${route.replace('/', 'home')}-${theme}-theme`);
        }
      });
    }
  });

  test.describe('Error Page Visual Testing', () => {
    test('404 error page', async ({ page }) => {
      await page.goto('/non-existent-page');
      await takeVisualSnapshot(page, '404-error-page');
    });

    test('500 error page', async ({ page }) => {
      // Mock server error
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      await page.goto('/error-prone-page');
      await page.waitForSelector('.error-page, [role="alert"]', { timeout: 5000 });
      await takeVisualSnapshot(page, '500-error-page');
    });

    test('Network offline simulation', async ({ page }) => {
      await page.context().setOffline(true);
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      await takeVisualSnapshot(page, 'offline-error-state');
      await page.context().setOffline(false);
    });
  });

  test.describe('Accessibility Visual Testing', () => {
    test('High contrast mode', async ({ page }) => {
      await page.goto('/');
      
      // Enable high contrast
      await page.evaluate(() => {
        document.documentElement.style.setProperty('forced-colors', 'active');
        document.body.classList.add('high-contrast');
      });
      
      await takeVisualSnapshot(page, 'accessibility-high-contrast');
    });

    test('Reduced motion preferences', async ({ page }) => {
      await page.goto('/');
      
      // Simulate reduced motion preference
      await page.evaluate(() => {
        const style = document.createElement('style');
        style.textContent = `
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `;
        document.head.appendChild(style);
      });
      
      await takeVisualSnapshot(page, 'accessibility-reduced-motion');
    });

    test('Focus indicators', async ({ page }) => {
      await page.goto('/');
      
      // Tab through focusable elements
      const focusableElements = await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
      
      for (let i = 0; i < Math.min(focusableElements.length, 5); i++) {
        await focusableElements[i].focus();
        await takeVisualSnapshot(page, `accessibility-focus-indicator-${i}`);
      }
    });
  });

  test.describe('Animation and Transition Visual Testing', () => {
    test('Loading animations', async ({ page }) => {
      // Re-enable animations for this test
      await page.addStyleTag({
        content: `
          .loading-spinner, .skeleton {
            visibility: visible !important;
          }
        `,
      });

      await page.goto('/dashboard');
      
      // Capture loading state with animations
      await page.waitForTimeout(100);
      await takeVisualSnapshot(page, 'loading-animations');
    });

    test('Hover transitions', async ({ page }) => {
      await page.goto('/');
      
      // Re-enable transitions for this test
      await page.addStyleTag({
        content: `
          * {
            transition-duration: 0.2s !important;
          }
        `,
      });

      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        await buttons.nth(i).hover();
        await page.waitForTimeout(300);
        await takeVisualSnapshot(page, `hover-transition-${i}`);
      }
    });
  });
});

// Cross-browser visual testing
test.describe('Cross-Browser Visual Consistency', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`Cross-browser consistency - ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      // Only run on the specific browser
      test.skip(currentBrowser !== browserName, `Skipping ${browserName} test on ${currentBrowser}`);
      
      await page.goto('/');
      await takeVisualSnapshot(page, `cross-browser-${browserName}-home`);
      
      await page.goto('/dashboard');
      await takeVisualSnapshot(page, `cross-browser-${browserName}-dashboard`);
    });
  });
});

// Performance-aware visual testing
test.describe('Performance-Aware Visual Testing', () => {
  test('Visual regression under slow network', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });

    await page.goto('/');
    await takeVisualSnapshot(page, 'slow-network-home');
  });

  test('Visual regression with disabled JavaScript', async ({ page, javaScriptEnabled }) => {
    test.skip(javaScriptEnabled, 'Test requires JavaScript to be disabled');
    
    await page.goto('/');
    await takeVisualSnapshot(page, 'no-javascript-home');
  });
});