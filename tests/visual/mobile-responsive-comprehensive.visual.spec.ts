/**
 * Comprehensive Mobile & Responsive Visual Regression Tests
 * Tests visual consistency across devices, orientations, and responsive breakpoints
 */

import { test, expect, Page } from '@playwright/test';
import { VisualTestUtils } from '../../scripts/visual-testing/visual-utils.js';
import visualConfig from '../../scripts/visual-testing/visual-config.js';

// Extended device configurations for comprehensive mobile testing
const mobileDevices = {
  // Small phones
  'iPhone SE': { width: 375, height: 667, deviceScaleFactor: 2, mobile: true },
  'Galaxy S8': { width: 360, height: 740, deviceScaleFactor: 3, mobile: true },
  
  // Standard phones
  'iPhone 12': { width: 390, height: 844, deviceScaleFactor: 3, mobile: true },
  'iPhone 12 Pro': { width: 390, height: 844, deviceScaleFactor: 3, mobile: true },
  'Pixel 5': { width: 393, height: 851, deviceScaleFactor: 2.75, mobile: true },
  'Galaxy S21': { width: 384, height: 854, deviceScaleFactor: 2.75, mobile: true },
  
  // Large phones / Phablets
  'iPhone 12 Pro Max': { width: 428, height: 926, deviceScaleFactor: 3, mobile: true },
  'Pixel 6 Pro': { width: 412, height: 915, deviceScaleFactor: 3.5, mobile: true },
  'Galaxy Note 20': { width: 412, height: 915, deviceScaleFactor: 2.625, mobile: true },
  
  // Foldable devices
  'Galaxy Z Fold3 (folded)': { width: 374, height: 820, deviceScaleFactor: 3, mobile: true },
  'Galaxy Z Fold3 (unfolded)': { width: 768, height: 1024, deviceScaleFactor: 2.5, mobile: true },
  
  // Tablets
  'iPad': { width: 768, height: 1024, deviceScaleFactor: 2, mobile: false },
  'iPad Pro': { width: 1024, height: 1366, deviceScaleFactor: 2, mobile: false },
  'Surface Pro': { width: 912, height: 1368, deviceScaleFactor: 2, mobile: false },
  'Galaxy Tab S7': { width: 800, height: 1280, deviceScaleFactor: 2, mobile: false },
  
  // Small tablets / Large phones
  'iPad Mini': { width: 744, height: 1133, deviceScaleFactor: 2, mobile: false },
  'Galaxy Tab A': { width: 768, height: 1024, deviceScaleFactor: 1.5, mobile: false },
};

// Responsive breakpoints for testing
const responsiveBreakpoints = {
  'xs': { width: 320, height: 568, name: 'extra-small' },
  'sm': { width: 576, height: 768, name: 'small' },
  'md': { width: 768, height: 1024, name: 'medium' },
  'lg': { width: 992, height: 1200, name: 'large' },
  'xl': { width: 1200, height: 800, name: 'extra-large' },
  'xxl': { width: 1400, height: 900, name: 'extra-extra-large' },
};

// Mobile-specific interaction patterns
const mobileInteractions = {
  touch: ['tap', 'long-press', 'double-tap'],
  gestures: ['swipe-left', 'swipe-right', 'swipe-up', 'swipe-down', 'pinch-zoom'],
  keyboard: ['show-keyboard', 'hide-keyboard'],
  orientation: ['portrait', 'landscape'],
};

// Pages optimized for mobile testing
const mobileTestPages = [
  { path: '/', name: 'homepage', mobile: true },
  { path: '/login', name: 'login', mobile: true },
  { path: '/dashboard', name: 'dashboard', mobile: true, requiresAuth: true },
  { path: '/profile', name: 'profile', mobile: true, requiresAuth: true },
  { path: '/settings', name: 'settings', mobile: true, requiresAuth: true },
  { path: '/components-demo', name: 'components', mobile: true },
  { path: '/forms-demo', name: 'forms', mobile: true },
  { path: '/navigation-demo', name: 'navigation', mobile: true },
];

// Components that need special mobile testing
const mobileComponents = {
  navigation: ['mobile-menu', 'hamburger-menu', 'bottom-tabs', 'side-drawer'],
  inputs: ['touch-input', 'mobile-select', 'date-picker', 'file-upload'],
  gestures: ['swipeable-cards', 'pull-to-refresh', 'infinite-scroll'],
  modals: ['mobile-modal', 'bottom-sheet', 'action-sheet', 'fullscreen-modal'],
  lists: ['virtual-list', 'touch-list', 'expandable-list'],
};

test.describe('Mobile & Responsive Visual Regression Tests', () => {
  let visualUtils: VisualTestUtils;

  test.beforeEach(async ({ page, browserName }) => {
    visualUtils = new VisualTestUtils(page, browserName);
    await visualUtils.preparePage({
      disableAnimations: false, // Keep animations for mobile testing
      hideScrollbars: false, // Show scrollbars on mobile
      stabilizeText: true,
      waitForFonts: true,
    });
  });

  // Test pages across all mobile devices
  for (const [deviceName, deviceConfig] of Object.entries(mobileDevices)) {
    test.describe(`Device: ${deviceName}`, () => {
      
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({
          width: deviceConfig.width,
          height: deviceConfig.height,
        });
        
        // Emulate device characteristics
        await page.emulateMedia({
          media: 'screen',
          colorScheme: 'light',
        });

        // Set device pixel ratio
        await page.addInitScript((dpr) => {
          Object.defineProperty(window, 'devicePixelRatio', {
            get: () => dpr
          });
        }, deviceConfig.deviceScaleFactor);

        // Add mobile-specific meta tags
        await page.addInitScript(() => {
          const meta = document.createElement('meta');
          meta.name = 'viewport';
          meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
          document.head.appendChild(meta);
        });
      });

      for (const testPage of mobileTestPages) {
        test(`${testPage.name} page layout`, async ({ page, browserName }) => {
          if (testPage.requiresAuth) {
            await setupMockAuth(page);
          }

          await page.goto(testPage.path);
          await visualUtils.preparePage();
          await visualUtils.waitForStableLayout();

          // Portrait orientation
          await expect(page).toHaveScreenshot(
            `mobile-${deviceName.replace(/\s+/g, '-')}-${testPage.name}-portrait-${browserName}.png`,
            {
              fullPage: true,
              threshold: 0.3,
              maxDiffPixels: 400,
            }
          );

          // Landscape orientation (if device supports it)
          if (deviceConfig.mobile && deviceConfig.width < deviceConfig.height) {
            await page.setViewportSize({
              width: deviceConfig.height,
              height: deviceConfig.width,
            });
            await page.waitForTimeout(300);
            await visualUtils.waitForStableLayout();

            await expect(page).toHaveScreenshot(
              `mobile-${deviceName.replace(/\s+/g, '-')}-${testPage.name}-landscape-${browserName}.png`,
              {
                fullPage: true,
                threshold: 0.3,
                maxDiffPixels: 400,
              }
            );
          }
        });

        test(`${testPage.name} touch interactions`, async ({ page, browserName }) => {
          if (testPage.requiresAuth) {
            await setupMockAuth(page);
          }

          await page.goto(testPage.path);
          await visualUtils.preparePage();

          // Test mobile-specific interactions
          const touchableElements = await page.locator(
            'button, a[href], [role="button"], input, select, [tabindex]'
          ).all();

          // Test first few touchable elements
          for (let i = 0; i < Math.min(touchableElements.length, 3); i++) {
            const element = touchableElements[i];
            
            // Touch interactions
            await element.tap();
            await page.waitForTimeout(100);

            await expect(page).toHaveScreenshot(
              `mobile-${deviceName.replace(/\s+/g, '-')}-${testPage.name}-touch-${i}-${browserName}.png`,
              {
                fullPage: true,
                threshold: 0.4,
                maxDiffPixels: 300,
              }
            );

            // Long press simulation
            await element.hover();
            await page.mouse.down();
            await page.waitForTimeout(500);
            await page.mouse.up();
            await page.waitForTimeout(100);

            await expect(page).toHaveScreenshot(
              `mobile-${deviceName.replace(/\s+/g, '-')}-${testPage.name}-longpress-${i}-${browserName}.png`,
              {
                fullPage: true,
                threshold: 0.4,
                maxDiffPixels: 300,
              }
            );
          }
        });
      }
    });
  }

  // Test responsive breakpoints
  test.describe('Responsive Breakpoint Testing', () => {
    
    for (const [breakpointName, breakpointConfig] of Object.entries(responsiveBreakpoints)) {
      test(`Breakpoint: ${breakpointName} (${breakpointConfig.width}px)`, async ({ page, browserName }) => {
        await page.setViewportSize({
          width: breakpointConfig.width,
          height: breakpointConfig.height,
        });

        const testPages = ['/dashboard', '/components-demo', '/'];
        
        for (const pagePath of testPages) {
          await page.goto(pagePath);
          await visualUtils.preparePage();
          await visualUtils.waitForStableLayout();

          await expect(page).toHaveScreenshot(
            `responsive-${breakpointName}-${pagePath.replace('/', 'home')}-${browserName}.png`,
            {
              fullPage: true,
              threshold: 0.3,
              maxDiffPixels: 400,
            }
          );

          // Test common responsive patterns
          await testResponsivePatterns(page, breakpointName, browserName);
        }
      });
    }
  });

  // Test mobile-specific components
  test.describe('Mobile-Specific Components', () => {
    
    for (const [category, components] of Object.entries(mobileComponents)) {
      test.describe(`Category: ${category}`, () => {
        
        for (const component of components) {
          test(`${component} mobile behavior`, async ({ page, browserName }) => {
            // Use a mobile device for component testing
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/mobile-components-demo');
            await visualUtils.preparePage();

            const selector = `[data-testid="${component}"], [data-component="${component}"]`;
            const element = page.locator(selector).first();

            if (await element.count() === 0) {
              test.skip(`Component ${component} not found`);
            }

            // Test component in different states
            await expect(element).toHaveScreenshot(
              `mobile-component-${component}-default-${browserName}.png`,
              {
                threshold: 0.3,
                maxDiffPixels: 200,
              }
            );

            // Test mobile-specific interactions
            await testMobileComponentInteractions(page, element, component, browserName);
          });
        }
      });
    }
  });

  // Test mobile keyboard interactions
  test.describe('Mobile Keyboard Testing', () => {
    
    test('Virtual keyboard behavior', async ({ page, browserName }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/forms-demo');
      await visualUtils.preparePage();

      const inputElements = [
        { selector: 'input[type="text"]', name: 'text' },
        { selector: 'input[type="email"]', name: 'email' },
        { selector: 'input[type="password"]', name: 'password' },
        { selector: 'input[type="number"]', name: 'number' },
        { selector: 'input[type="tel"]', name: 'tel' },
        { selector: 'textarea', name: 'textarea' },
      ];

      for (const inputConfig of inputElements) {
        const input = page.locator(inputConfig.selector).first();
        
        if (await input.count() === 0) continue;

        // Focus input to show virtual keyboard
        await input.focus();
        await page.waitForTimeout(300); // Wait for keyboard animation

        // Simulate keyboard space reduction
        await page.setViewportSize({ width: 375, height: 400 });
        await page.waitForTimeout(200);

        await expect(page).toHaveScreenshot(
          `mobile-keyboard-${inputConfig.name}-visible-${browserName}.png`,
          {
            fullPage: true,
            threshold: 0.4,
            maxDiffPixels: 400,
          }
        );

        // Hide keyboard
        await page.keyboard.press('Escape');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(200);

        await expect(page).toHaveScreenshot(
          `mobile-keyboard-${inputConfig.name}-hidden-${browserName}.png`,
          {
            fullPage: true,
            threshold: 0.3,
            maxDiffPixels: 300,
          }
        );
      }
    });

    test('Input field behavior with keyboard', async ({ page, browserName }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/forms-demo');
      await visualUtils.preparePage();

      // Test input field focus and scrolling behavior
      const formInputs = page.locator('input, textarea, select');
      const inputCount = await formInputs.count();

      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = formInputs.nth(i);
        
        await input.scrollIntoViewIfNeeded();
        await input.focus();
        await page.waitForTimeout(200);

        await expect(input).toHaveScreenshot(
          `mobile-input-focus-${i}-${browserName}.png`,
          {
            threshold: 0.3,
            maxDiffPixels: 150,
          }
        );
      }
    });
  });

  // Test mobile gestures and touch patterns
  test.describe('Mobile Gestures & Touch Patterns', () => {
    
    test('Swipe gestures', async ({ page, browserName }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/gesture-demo');
      await visualUtils.preparePage();

      const swipeableElements = page.locator('[data-swipeable="true"], .swipeable, .carousel');
      const elementCount = await swipeableElements.count();

      for (let i = 0; i < Math.min(elementCount, 3); i++) {
        const element = swipeableElements.nth(i);
        
        // Initial state
        await expect(element).toHaveScreenshot(
          `mobile-swipe-element-${i}-initial-${browserName}.png`,
          {
            threshold: 0.3,
            maxDiffPixels: 200,
          }
        );

        // Simulate swipe gestures
        const box = await element.boundingBox();
        if (box) {
          // Swipe left
          await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(300);

          await expect(element).toHaveScreenshot(
            `mobile-swipe-element-${i}-left-${browserName}.png`,
            {
              threshold: 0.4,
              maxDiffPixels: 250,
            }
          );

          // Swipe right
          await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(300);

          await expect(element).toHaveScreenshot(
            `mobile-swipe-element-${i}-right-${browserName}.png`,
            {
              threshold: 0.4,
              maxDiffPixels: 250,
            }
          );
        }
      }
    });

    test('Pull-to-refresh pattern', async ({ page, browserName }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/refresh-demo');
      await visualUtils.preparePage();

      const refreshContainer = page.locator('[data-pull-to-refresh="true"], .pull-to-refresh');
      
      if (await refreshContainer.count() > 0) {
        const container = refreshContainer.first();
        
        // Initial state
        await expect(container).toHaveScreenshot(
          `mobile-pull-refresh-initial-${browserName}.png`,
          {
            threshold: 0.3,
            maxDiffPixels: 200,
          }
        );

        // Simulate pull-to-refresh
        const box = await container.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + 50);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width / 2, box.y + 150, { steps: 20 });
          await page.waitForTimeout(200);

          await expect(container).toHaveScreenshot(
            `mobile-pull-refresh-pulling-${browserName}.png`,
            {
              threshold: 0.4,
              maxDiffPixels: 300,
            }
          );

          await page.mouse.up();
          await page.waitForTimeout(500);

          await expect(container).toHaveScreenshot(
            `mobile-pull-refresh-refreshing-${browserName}.png`,
            {
              threshold: 0.4,
              maxDiffPixels: 300,
            }
          );
        }
      }
    });

    test('Touch feedback and states', async ({ page, browserName }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/touch-demo');
      await visualUtils.preparePage();

      const touchElements = page.locator('button, [role="button"], .touchable');
      const elementCount = await touchElements.count();

      for (let i = 0; i < Math.min(elementCount, 5); i++) {
        const element = touchElements.nth(i);
        
        // Touch down state
        await element.hover();
        await page.mouse.down();
        await page.waitForTimeout(100);

        await expect(element).toHaveScreenshot(
          `mobile-touch-down-${i}-${browserName}.png`,
          {
            threshold: 0.3,
            maxDiffPixels: 150,
          }
        );

        // Touch up state
        await page.mouse.up();
        await page.waitForTimeout(100);

        await expect(element).toHaveScreenshot(
          `mobile-touch-up-${i}-${browserName}.png`,
          {
            threshold: 0.3,
            maxDiffPixels: 150,
          }
        );
      }
    });
  });

  // Test mobile accessibility features
  test.describe('Mobile Accessibility', () => {
    
    test('Touch target sizes', async ({ page, browserName }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/accessibility-demo');
      await visualUtils.preparePage();

      // Highlight touch targets that are too small
      await page.addStyleTag({
        content: `
          button, a, input, select, [role="button"], [tabindex] {
            position: relative;
          }
          button:after, a:after, input:after, select:after, [role="button"]:after, [tabindex]:after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 2px solid red;
            pointer-events: none;
            opacity: 0;
          }
          button:after, a:after, input:after, select:after, [role="button"]:after, [tabindex]:after {
            opacity: 1;
          }
          @media (max-width: 768px) {
            button, a, input, select, [role="button"], [tabindex] {
              min-width: 44px;
              min-height: 44px;
            }
          }
        `,
      });

      await expect(page).toHaveScreenshot(
        `mobile-touch-targets-${browserName}.png`,
        {
          fullPage: true,
          threshold: 0.4,
          maxDiffPixels: 400,
        }
      );
    });

    test('Mobile screen reader layout', async ({ page, browserName }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/components-demo');
      await visualUtils.preparePage();

      // Simulate screen reader focus indicators
      await page.addStyleTag({
        content: `
          [aria-label]:focus, [aria-describedby]:focus, [role]:focus {
            outline: 3px solid #00ff00 !important;
            outline-offset: 2px !important;
            background: rgba(0, 255, 0, 0.1) !important;
          }
        `,
      });

      // Tab through focusable elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }

      await expect(page).toHaveScreenshot(
        `mobile-screen-reader-focus-${browserName}.png`,
        {
          fullPage: true,
          threshold: 0.4,
          maxDiffPixels: 300,
        }
      );
    });
  });
});

// Helper functions
async function setupMockAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'mock_token_for_testing');
    localStorage.setItem('user_id', 'test_user_123');
    localStorage.setItem('user_role', 'user');
  });
}

async function testResponsivePatterns(page: Page, breakpoint: string, browserName: string) {
  // Test common responsive patterns
  const responsiveElements = [
    { selector: '.container', name: 'container' },
    { selector: '.grid', name: 'grid' },
    { selector: '.flex', name: 'flex' },
    { selector: 'nav', name: 'navigation' },
    { selector: '.sidebar', name: 'sidebar' },
    { selector: '.modal', name: 'modal' },
  ];

  for (const element of responsiveElements) {
    const elementLocator = page.locator(element.selector);
    
    if (await elementLocator.count() > 0) {
      await expect(elementLocator.first()).toHaveScreenshot(
        `responsive-pattern-${element.name}-${breakpoint}-${browserName}.png`,
        {
          threshold: 0.3,
          maxDiffPixels: 200,
        }
      );
    }
  }
}

async function testMobileComponentInteractions(page: Page, element: any, component: string, browserName: string) {
  const interactions = {
    'mobile-menu': ['tap-open', 'tap-close'],
    'bottom-sheet': ['drag-up', 'drag-down'],
    'swipeable-cards': ['swipe-left', 'swipe-right'],
    'touch-input': ['focus', 'blur'],
  };

  const componentInteractions = interactions[component] || ['tap'];

  for (const interaction of componentInteractions) {
    try {
      await performMobileInteraction(page, element, interaction);
      await page.waitForTimeout(200);

      await expect(element).toHaveScreenshot(
        `mobile-component-${component}-${interaction}-${browserName}.png`,
        {
          threshold: 0.4,
          maxDiffPixels: 250,
        }
      );
    } catch (error) {
      console.warn(`Mobile interaction ${interaction} failed for ${component}:`, error.message);
    }
  }
}

async function performMobileInteraction(page: Page, element: any, interaction: string) {
  const box = await element.boundingBox();
  if (!box) return;

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  switch (interaction) {
    case 'tap':
    case 'tap-open':
      await element.tap();
      break;
    case 'tap-close':
      await page.keyboard.press('Escape');
      break;
    case 'swipe-left':
      await page.mouse.move(centerX + box.width * 0.3, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX - box.width * 0.3, centerY, { steps: 10 });
      await page.mouse.up();
      break;
    case 'swipe-right':
      await page.mouse.move(centerX - box.width * 0.3, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + box.width * 0.3, centerY, { steps: 10 });
      await page.mouse.up();
      break;
    case 'drag-up':
      await page.mouse.move(centerX, centerY + box.height * 0.3);
      await page.mouse.down();
      await page.mouse.move(centerX, centerY - box.height * 0.3, { steps: 10 });
      await page.mouse.up();
      break;
    case 'drag-down':
      await page.mouse.move(centerX, centerY - box.height * 0.3);
      await page.mouse.down();
      await page.mouse.move(centerX, centerY + box.height * 0.3, { steps: 10 });
      await page.mouse.up();
      break;
    case 'focus':
      await element.focus();
      break;
    case 'blur':
      await page.keyboard.press('Tab');
      break;
    default:
      await element.tap();
      break;
  }
}