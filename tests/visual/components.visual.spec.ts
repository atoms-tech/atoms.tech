/**
 * Component Visual Regression Tests
 * Comprehensive visual testing for all UI components
 */

import { test, expect, Page } from '@playwright/test';
import { VisualTestUtils, AccessibilityVisualUtils } from '../../scripts/visual-testing/visual-utils.js';
import visualConfig from '../../scripts/visual-testing/visual-config.js';

// Component test data
const components = visualConfig.components.categories;

test.describe('UI Components Visual Tests', () => {
  let visualUtils: VisualTestUtils;
  let accessibilityUtils: AccessibilityVisualUtils;

  test.beforeEach(async ({ page, browserName }) => {
    visualUtils = new VisualTestUtils(page, browserName);
    accessibilityUtils = new AccessibilityVisualUtils(page, browserName);
    
    // Navigate to component showcase/storybook page
    await page.goto('/storybook'); // Assuming you have a component showcase
    await visualUtils.preparePage();
  });

  // Test UI Primitives
  test.describe('UI Primitives', () => {
    for (const component of components['ui-primitives']) {
      test(`${component} - all states`, async ({ page, browserName }) => {
        const selector = `[data-component="${component}"]`;
        
        // Wait for component to be visible
        await expect(page.locator(selector)).toBeVisible();

        // Test default state
        await expect(page.locator(selector)).toHaveScreenshot(
          `${component}-default-${browserName}.png`
        );

        // Test interactive states
        const states = visualConfig.components.states;
        for (const state of states) {
          await visualUtils.applyComponentState(selector, state);
          await page.waitForTimeout(100);

          await expect(page.locator(selector)).toHaveScreenshot(
            `${component}-${state}-${browserName}.png`
          );

          await visualUtils.resetComponentState(selector, state);
        }
      });

      test(`${component} - themes`, async ({ page, browserName }) => {
        const selector = `[data-component="${component}"]`;
        await expect(page.locator(selector)).toBeVisible();

        // Test different themes
        for (const theme of visualConfig.components.themes) {
          await visualUtils.applyTheme(theme);
          await page.waitForTimeout(100);

          await expect(page.locator(selector)).toHaveScreenshot(
            `${component}-${theme.name}-${browserName}.png`
          );
        }
      });

      test(`${component} - responsive`, async ({ page, browserName }) => {
        const selector = `[data-component="${component}"]`;
        
        // Test different viewport sizes
        const viewports = [
          ...visualConfig.viewports.mobile,
          ...visualConfig.viewports.tablet,
          ...visualConfig.viewports.desktop,
        ];

        for (const viewport of viewports) {
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          });
          
          await page.waitForTimeout(100);
          await expect(page.locator(selector)).toBeVisible();

          await expect(page.locator(selector)).toHaveScreenshot(
            `${component}-${viewport.name.toLowerCase().replace(' ', '-')}-${browserName}.png`
          );
        }
      });
    }
  });

  // Test Layout Components
  test.describe('Layout Components', () => {
    for (const component of components['layout']) {
      test(`${component} - layout variations`, async ({ page, browserName }) => {
        const selector = `[data-component="${component}"]`;
        
        await expect(page.locator(selector)).toBeVisible();

        // Test with different content sizes
        const contentSizes = ['empty', 'small', 'medium', 'large', 'overflow'];
        
        for (const size of contentSizes) {
          await page.evaluate((args) => {
            const element = document.querySelector(args.selector);
            if (element) {
              element.setAttribute('data-content-size', args.size);
            }
          }, { selector, size });

          await page.waitForTimeout(100);

          await expect(page.locator(selector)).toHaveScreenshot(
            `${component}-content-${size}-${browserName}.png`
          );
        }
      });

      test(`${component} - interactive states`, async ({ page, browserName }) => {
        const selector = `[data-component="${component}"]`;
        
        await expect(page.locator(selector)).toBeVisible();

        // Test interactive states specific to layout components
        if (component === 'modal' || component === 'dialog') {
          // Test open/closed states
          await page.locator(selector).click();
          await page.waitForTimeout(200);
          
          await expect(page).toHaveScreenshot(
            `${component}-open-${browserName}.png`
          );
        }

        if (component === 'tabs' || component === 'accordion') {
          // Test different tab/panel states
          const tabs = page.locator(`${selector} [role="tab"]`);
          const tabCount = await tabs.count();
          
          for (let i = 0; i < Math.min(tabCount, 3); i++) {
            await tabs.nth(i).click();
            await page.waitForTimeout(100);
            
            await expect(page.locator(selector)).toHaveScreenshot(
              `${component}-tab-${i}-${browserName}.png`
            );
          }
        }
      });
    }
  });

  // Test Navigation Components
  test.describe('Navigation Components', () => {
    for (const component of components['navigation']) {
      test(`${component} - navigation states`, async ({ page, browserName }) => {
        const selector = `[data-component="${component}"]`;
        
        await expect(page.locator(selector)).toBeVisible();

        // Test active/inactive states
        const navigationItems = page.locator(`${selector} a, ${selector} button`);
        const itemCount = await navigationItems.count();

        for (let i = 0; i < Math.min(itemCount, 5); i++) {
          await navigationItems.nth(i).click();
          await page.waitForTimeout(100);
          
          await expect(page.locator(selector)).toHaveScreenshot(
            `${component}-item-${i}-active-${browserName}.png`
          );
        }
      });

      test(`${component} - responsive navigation`, async ({ page, browserName }) => {
        const selector = `[data-component="${component}"]`;
        
        // Test mobile navigation behavior
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(100);
        
        await expect(page.locator(selector)).toBeVisible();
        await expect(page.locator(selector)).toHaveScreenshot(
          `${component}-mobile-${browserName}.png`
        );

        // Test if there's a mobile menu toggle
        const menuToggle = page.locator(`${selector} [aria-label*="menu"], ${selector} .menu-toggle`);
        if (await menuToggle.count() > 0) {
          await menuToggle.click();
          await page.waitForTimeout(200);
          
          await expect(page).toHaveScreenshot(
            `${component}-mobile-open-${browserName}.png`
          );
        }
      });
    }
  });

  // Test Data Display Components
  test.describe('Data Display Components', () => {
    for (const component of components['data-display']) {
      test(`${component} - data states`, async ({ page, browserName }) => {
        const selector = `[data-component="${component}"]`;
        
        await expect(page.locator(selector)).toBeVisible();

        // Test different data states
        const dataStates = ['empty', 'loading', 'with-data', 'error'];
        
        for (const state of dataStates) {
          await page.evaluate((args) => {
            const element = document.querySelector(args.selector);
            if (element) {
              element.setAttribute('data-state', args.state);
            }
          }, { selector, state });

          await page.waitForTimeout(100);

          await expect(page.locator(selector)).toHaveScreenshot(
            `${component}-data-${state}-${browserName}.png`
          );
        }
      });

      test(`${component} - sorting and filtering`, async ({ page, browserName }) => {
        const selector = `[data-component="${component}"]`;
        
        if (component === 'table' || component === 'list') {
          await expect(page.locator(selector)).toBeVisible();

          // Test sorting
          const sortButtons = page.locator(`${selector} [role="columnheader"] button, ${selector} .sort-button`);
          const sortCount = await sortButtons.count();

          for (let i = 0; i < Math.min(sortCount, 3); i++) {
            await sortButtons.nth(i).click();
            await page.waitForTimeout(100);
            
            await expect(page.locator(selector)).toHaveScreenshot(
              `${component}-sorted-${i}-${browserName}.png`
            );
          }
        }
      });
    }
  });

  // Test Feedback Components
  test.describe('Feedback Components', () => {
    for (const component of components['feedback']) {
      test(`${component} - feedback variations`, async ({ page, browserName }) => {
        const selector = `[data-component="${component}"]`;
        
        await expect(page.locator(selector)).toBeVisible();

        // Test different feedback types
        const feedbackTypes = ['info', 'success', 'warning', 'error'];
        
        for (const type of feedbackTypes) {
          await page.evaluate((args) => {
            const element = document.querySelector(args.selector);
            if (element) {
              element.setAttribute('data-variant', args.type);
            }
          }, { selector, type });

          await page.waitForTimeout(100);

          await expect(page.locator(selector)).toHaveScreenshot(
            `${component}-${type}-${browserName}.png`
          );
        }
      });

      test(`${component} - animation states`, async ({ page, browserName }) => {
        const selector = `[data-component="${component}"]`;
        
        if (component === 'loading-spinner' || component === 'skeleton') {
          await expect(page.locator(selector)).toBeVisible();

          // Capture animation frame
          await expect(page.locator(selector)).toHaveScreenshot(
            `${component}-animating-${browserName}.png`
          );

          // Test with animations disabled
          await page.addStyleTag({
            content: `
              ${selector} * {
                animation-play-state: paused !important;
              }
            `,
          });

          await expect(page.locator(selector)).toHaveScreenshot(
            `${component}-paused-${browserName}.png`
          );
        }
      });
    }
  });
});

// Accessibility Visual Tests
test.describe('Accessibility Visual Tests', () => {
  let accessibilityUtils: AccessibilityVisualUtils;

  test.beforeEach(async ({ page, browserName }) => {
    accessibilityUtils = new AccessibilityVisualUtils(page, browserName);
    await page.goto('/storybook');
    await accessibilityUtils.preparePage();
  });

  test('High contrast mode - all components', async ({ page, browserName }) => {
    for (const [category, componentList] of Object.entries(components)) {
      for (const component of componentList) {
        const selector = `[data-component="${component}"]`;
        
        if (await page.locator(selector).count() > 0) {
          await accessibilityUtils.testHighContrast(selector);
          
          await expect(page.locator(selector)).toHaveScreenshot(
            `${component}-high-contrast-${browserName}.png`
          );
        }
      }
    }
  });

  test('Reduced motion - animated components', async ({ page, browserName }) => {
    const animatedComponents = ['loading-spinner', 'skeleton', 'tabs', 'accordion'];
    
    for (const component of animatedComponents) {
      const selector = `[data-component="${component}"]`;
      
      if (await page.locator(selector).count() > 0) {
        await accessibilityUtils.testReducedMotion(selector);
        
        await expect(page.locator(selector)).toHaveScreenshot(
          `${component}-reduced-motion-${browserName}.png`
        );
      }
    }
  });

  test('Focus indicators - interactive components', async ({ page, browserName }) => {
    const interactiveComponents = ['button', 'input', 'select', 'checkbox', 'radio'];
    
    for (const component of interactiveComponents) {
      const selector = `[data-component="${component}"]`;
      
      if (await page.locator(selector).count() > 0) {
        await accessibilityUtils.testFocusIndicators(selector);
        
        await expect(page.locator(selector)).toHaveScreenshot(
          `${component}-focus-${browserName}.png`
        );
      }
    }
  });
});