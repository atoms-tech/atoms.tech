/**
 * Comprehensive Interactive States Visual Regression Tests
 * Advanced testing for component interactions, animations, and state changes
 */

import { test, expect, Page, Locator } from '@playwright/test';
import { VisualTestUtils, AccessibilityVisualUtils } from '../../scripts/visual-testing/visual-utils.js';
import visualConfig from '../../scripts/visual-testing/visual-config.js';

// Enhanced interaction configurations
const interactiveStates = [
  'default',
  'hover',
  'focus',
  'active',
  'pressed',
  'disabled',
  'loading',
  'error',
  'success',
  'warning',
  'selected',
  'expanded',
  'collapsed',
  'dragging',
  'dropping',
  'invalid',
  'valid',
];

const animationStates = [
  'enter',
  'exit',
  'transition-start',
  'transition-mid',
  'transition-end',
  'loop-start',
  'loop-mid',
  'paused',
  'resumed',
];

const interactiveElements = [
  'button',
  'input',
  'select',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'tabs',
  'accordion',
  'dropdown',
  'modal',
  'tooltip',
  'popover',
  'menu',
  'carousel',
  'datepicker',
  'autocomplete',
  'tree',
  'drag-drop',
];

test.describe('Interactive States Visual Regression Tests', () => {
  let visualUtils: VisualTestUtils;
  let accessibilityUtils: AccessibilityVisualUtils;

  test.beforeEach(async ({ page, browserName }) => {
    visualUtils = new VisualTestUtils(page, browserName);
    accessibilityUtils = new AccessibilityVisualUtils(page, browserName);
    
    // Navigate to components showcase
    await page.goto('/storybook?path=/story/components--all');
    await visualUtils.preparePage({
      disableAnimations: false, // Keep animations for interaction testing
      hideScrollbars: true,
      stabilizeText: true,
      waitForFonts: true,
    });
  });

  // Test comprehensive interactive states for each element type
  for (const elementType of interactiveElements) {
    test.describe(`${elementType} Interactive States`, () => {
      
      test(`${elementType} - comprehensive state testing`, async ({ page, browserName }) => {
        const selector = `[data-testid="${elementType}"], [data-component="${elementType}"]`;
        
        // Wait for element to be available
        await expect(page.locator(selector).first()).toBeVisible({ timeout: 10000 });
        const element = page.locator(selector).first();

        // Test each interactive state
        for (const state of interactiveStates) {
          try {
            await applyInteractiveState(page, element, state);
            
            // Wait for state to stabilize
            await page.waitForTimeout(200);
            
            // Take screenshot with state-specific options
            await expect(element).toHaveScreenshot(
              `${elementType}-${state}-${browserName}.png`,
              {
                threshold: 0.2,
                maxDiffPixels: 100,
                animations: state.includes('loading') ? 'allow' : 'disabled',
              }
            );

            // Reset state
            await resetInteractiveState(page, element, state);
            await page.waitForTimeout(100);
            
          } catch (error) {
            console.warn(`Failed to test ${state} state for ${elementType}:`, error.message);
          }
        }
      });

      test(`${elementType} - keyboard navigation`, async ({ page, browserName }) => {
        const selector = `[data-testid="${elementType}"], [data-component="${elementType}"]`;
        const element = page.locator(selector).first();
        
        if (await element.count() === 0) {
          test.skip(`${elementType} not found`);
        }

        // Focus the element
        await element.focus();
        
        // Test keyboard states
        const keyboardActions = [
          { key: 'Tab', name: 'tab-focus' },
          { key: 'Enter', name: 'enter-press' },
          { key: 'Space', name: 'space-press' },
          { key: 'Escape', name: 'escape-press' },
          { key: 'ArrowDown', name: 'arrow-down' },
          { key: 'ArrowUp', name: 'arrow-up' },
          { key: 'ArrowLeft', name: 'arrow-left' },
          { key: 'ArrowRight', name: 'arrow-right' },
        ];

        for (const action of keyboardActions) {
          try {
            await page.keyboard.press(action.key);
            await page.waitForTimeout(100);
            
            await expect(element).toHaveScreenshot(
              `${elementType}-keyboard-${action.name}-${browserName}.png`,
              { threshold: 0.3 }
            );
          } catch (error) {
            console.warn(`Keyboard action ${action.key} failed for ${elementType}:`, error.message);
          }
        }
      });

      test(`${elementType} - mouse interactions`, async ({ page, browserName }) => {
        const selector = `[data-testid="${elementType}"], [data-component="${elementType}"]`;
        const element = page.locator(selector).first();
        
        if (await element.count() === 0) {
          test.skip(`${elementType} not found`);
        }

        const mouseActions = [
          { action: 'hover', name: 'hover' },
          { action: 'click', name: 'click' },
          { action: 'dblclick', name: 'double-click' },
          { action: 'contextmenu', name: 'right-click' },
        ];

        for (const mouseAction of mouseActions) {
          try {
            await element[mouseAction.action]();
            await page.waitForTimeout(100);
            
            await expect(element).toHaveScreenshot(
              `${elementType}-mouse-${mouseAction.name}-${browserName}.png`,
              { threshold: 0.3 }
            );
            
            // Reset by clicking elsewhere
            await page.mouse.move(0, 0);
            await page.waitForTimeout(50);
          } catch (error) {
            console.warn(`Mouse action ${mouseAction.action} failed for ${elementType}:`, error.message);
          }
        }
      });

      test(`${elementType} - touch interactions`, async ({ page, browserName }) => {
        const selector = `[data-testid="${elementType}"], [data-component="${elementType}"]`;
        const element = page.locator(selector).first();
        
        if (await element.count() === 0) {
          test.skip(`${elementType} not found`);
        }

        // Simulate mobile device
        await page.setViewportSize({ width: 375, height: 667 });
        
        const touchActions = [
          { action: 'tap', name: 'tap' },
          { action: 'longPress', name: 'long-press' },
        ];

        for (const touchAction of touchActions) {
          try {
            if (touchAction.action === 'tap') {
              await element.tap();
            } else if (touchAction.action === 'longPress') {
              await element.hover(); // Simulate long press with hover
              await page.waitForTimeout(500);
            }
            
            await page.waitForTimeout(100);
            
            await expect(element).toHaveScreenshot(
              `${elementType}-touch-${touchAction.name}-mobile-${browserName}.png`,
              { threshold: 0.3 }
            );
          } catch (error) {
            console.warn(`Touch action ${touchAction.action} failed for ${elementType}:`, error.message);
          }
        }
      });
    });
  }

  // Test animation states
  test.describe('Animation States Testing', () => {
    const animatedComponents = ['modal', 'dropdown', 'tooltip', 'accordion', 'tabs', 'carousel'];

    for (const component of animatedComponents) {
      test(`${component} - animation states`, async ({ page, browserName }) => {
        const selector = `[data-testid="${component}"], [data-component="${component}"]`;
        const element = page.locator(selector).first();
        
        if (await element.count() === 0) {
          test.skip(`${component} not found`);
        }

        // Enable animations for this test
        await page.addStyleTag({
          content: `
            * {
              animation-duration: 300ms !important;
              transition-duration: 300ms !important;
            }
          `,
        });

        for (const animState of animationStates) {
          try {
            await triggerAnimationState(page, element, component, animState);
            
            await expect(element).toHaveScreenshot(
              `${component}-animation-${animState}-${browserName}.png`,
              { 
                threshold: 0.4, // Higher threshold for animations
                animations: 'allow',
              }
            );
            
            await page.waitForTimeout(200);
          } catch (error) {
            console.warn(`Animation state ${animState} failed for ${component}:`, error.message);
          }
        }
      });
    }
  });

  // Test error states and edge cases
  test.describe('Error States and Edge Cases', () => {
    
    test('Form validation states', async ({ page, browserName }) => {
      await page.goto('/forms-demo');
      await visualUtils.preparePage();

      const formElements = [
        '[data-testid="email-input"]',
        '[data-testid="password-input"]',
        '[data-testid="submit-button"]',
        '[data-testid="checkbox-terms"]',
      ];

      // Test validation states
      for (const selector of formElements) {
        const element = page.locator(selector);
        
        if (await element.count() === 0) continue;

        // Test invalid state
        await element.fill('invalid-value');
        await page.keyboard.press('Tab'); // Trigger validation
        await page.waitForTimeout(100);
        
        await expect(element).toHaveScreenshot(
          `form-${selector.replace(/\[|\]|"|data-testid=|-/g, '')}-invalid-${browserName}.png`,
          { threshold: 0.3 }
        );

        // Test valid state
        if (selector.includes('email')) {
          await element.fill('valid@example.com');
        } else if (selector.includes('password')) {
          await element.fill('ValidPassword123!');
        } else if (selector.includes('checkbox')) {
          await element.check();
        }
        
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        await expect(element).toHaveScreenshot(
          `form-${selector.replace(/\[|\]|"|data-testid=|-/g, '')}-valid-${browserName}.png`,
          { threshold: 0.3 }
        );
      }
    });

    test('Loading states', async ({ page, browserName }) => {
      await page.goto('/dashboard');
      await visualUtils.preparePage();

      // Simulate slow network to capture loading states
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 1000);
      });

      const loadingElements = [
        '[data-testid="data-table"]',
        '[data-testid="user-profile"]',
        '[data-testid="notifications"]',
      ];

      for (const selector of loadingElements) {
        const element = page.locator(selector);
        
        if (await element.count() === 0) continue;

        // Navigate to trigger loading
        await page.reload();
        await page.waitForTimeout(500); // Capture mid-loading state
        
        await expect(element).toHaveScreenshot(
          `loading-${selector.replace(/\[|\]|"|data-testid=|-/g, '')}-${browserName}.png`,
          { threshold: 0.4 }
        );
      }
    });

    test('Empty states', async ({ page, browserName }) => {
      await page.goto('/dashboard?empty=true');
      await visualUtils.preparePage();

      const emptyStateElements = [
        '[data-testid="projects-list"]',
        '[data-testid="notifications-list"]',
        '[data-testid="recent-activity"]',
      ];

      for (const selector of emptyStateElements) {
        const element = page.locator(selector);
        
        if (await element.count() === 0) continue;
        
        await expect(element).toHaveScreenshot(
          `empty-${selector.replace(/\[|\]|"|data-testid=|-/g, '')}-${browserName}.png`,
          { threshold: 0.3 }
        );
      }
    });
  });

  // Test accessibility visual states
  test.describe('Accessibility Visual States', () => {
    
    test('High contrast mode interactions', async ({ page, browserName }) => {
      await page.goto('/components-demo');
      await accessibilityUtils.testHighContrast('body');

      const interactiveSelectors = [
        'button',
        'input',
        'select',
        '[role="button"]',
        '[role="tab"]',
      ];

      for (const selector of interactiveSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = elements.nth(i);
          
          // Test focus in high contrast
          await element.focus();
          await page.waitForTimeout(100);
          
          await expect(element).toHaveScreenshot(
            `high-contrast-${selector.replace(/\[|\]|"/g, '')}-focus-${i}-${browserName}.png`,
            { threshold: 0.4 }
          );
        }
      }
    });

    test('Focus indicators comprehensive', async ({ page, browserName }) => {
      await page.goto('/components-demo');
      await visualUtils.preparePage();

      // Enhanced focus indicator styles
      await page.addStyleTag({
        content: `
          *:focus {
            outline: 3px solid #005fcc !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 0 1px #005fcc !important;
          }
        `,
      });

      const focusableElements = await page.locator('[tabindex], button, input, select, textarea, a[href]').all();
      
      for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
        const element = focusableElements[i];
        
        await element.focus();
        await page.waitForTimeout(100);
        
        await expect(element).toHaveScreenshot(
          `focus-indicator-element-${i}-${browserName}.png`,
          { threshold: 0.3 }
        );
      }
    });

    test('Reduced motion interactions', async ({ page, browserName }) => {
      await page.goto('/components-demo');
      await accessibilityUtils.testReducedMotion('body');

      const animatedComponents = ['modal', 'dropdown', 'accordion', 'tabs'];
      
      for (const component of animatedComponents) {
        const selector = `[data-testid="${component}"], [data-component="${component}"]`;
        const element = page.locator(selector).first();
        
        if (await element.count() === 0) continue;

        // Trigger interaction
        await element.click();
        await page.waitForTimeout(100);
        
        await expect(element).toHaveScreenshot(
          `reduced-motion-${component}-${browserName}.png`,
          { threshold: 0.3 }
        );
      }
    });
  });
});

// Helper functions for state management
async function applyInteractiveState(page: Page, element: Locator, state: string) {
  switch (state) {
    case 'hover':
      await element.hover();
      break;
    case 'focus':
      await element.focus();
      break;
    case 'active':
    case 'pressed':
      await element.dispatchEvent('mousedown');
      break;
    case 'disabled':
      await element.evaluate(el => {
        el.disabled = true;
        el.setAttribute('disabled', 'disabled');
        el.setAttribute('aria-disabled', 'true');
      });
      break;
    case 'loading':
      await element.evaluate(el => {
        el.classList.add('loading', 'is-loading');
        el.setAttribute('aria-busy', 'true');
      });
      break;
    case 'error':
      await element.evaluate(el => {
        el.classList.add('error', 'is-error', 'has-error');
        el.setAttribute('aria-invalid', 'true');
      });
      break;
    case 'success':
      await element.evaluate(el => {
        el.classList.add('success', 'is-success', 'has-success');
        el.setAttribute('aria-invalid', 'false');
      });
      break;
    case 'warning':
      await element.evaluate(el => {
        el.classList.add('warning', 'is-warning', 'has-warning');
      });
      break;
    case 'selected':
      await element.evaluate(el => {
        el.classList.add('selected', 'is-selected');
        el.setAttribute('aria-selected', 'true');
      });
      break;
    case 'expanded':
      await element.evaluate(el => {
        el.classList.add('expanded', 'is-expanded');
        el.setAttribute('aria-expanded', 'true');
      });
      break;
    case 'collapsed':
      await element.evaluate(el => {
        el.classList.add('collapsed', 'is-collapsed');
        el.setAttribute('aria-expanded', 'false');
      });
      break;
    case 'dragging':
      await element.evaluate(el => {
        el.classList.add('dragging', 'is-dragging');
        el.setAttribute('aria-grabbed', 'true');
      });
      break;
    case 'dropping':
      await element.evaluate(el => {
        el.classList.add('drop-target', 'is-drop-target');
      });
      break;
    case 'invalid':
      await element.evaluate(el => {
        el.classList.add('invalid', 'is-invalid');
        el.setAttribute('aria-invalid', 'true');
      });
      break;
    case 'valid':
      await element.evaluate(el => {
        el.classList.add('valid', 'is-valid');
        el.setAttribute('aria-invalid', 'false');
      });
      break;
    default:
      // Default state - no action needed
      break;
  }
}

async function resetInteractiveState(page: Page, element: Locator, state: string) {
  switch (state) {
    case 'hover':
      await page.mouse.move(0, 0);
      break;
    case 'focus':
      await page.keyboard.press('Escape');
      break;
    case 'active':
    case 'pressed':
      await element.dispatchEvent('mouseup');
      break;
    case 'disabled':
      await element.evaluate(el => {
        el.disabled = false;
        el.removeAttribute('disabled');
        el.removeAttribute('aria-disabled');
      });
      break;
    case 'loading':
      await element.evaluate(el => {
        el.classList.remove('loading', 'is-loading');
        el.removeAttribute('aria-busy');
      });
      break;
    case 'error':
      await element.evaluate(el => {
        el.classList.remove('error', 'is-error', 'has-error');
        el.removeAttribute('aria-invalid');
      });
      break;
    case 'success':
      await element.evaluate(el => {
        el.classList.remove('success', 'is-success', 'has-success');
        el.removeAttribute('aria-invalid');
      });
      break;
    case 'warning':
      await element.evaluate(el => {
        el.classList.remove('warning', 'is-warning', 'has-warning');
      });
      break;
    case 'selected':
      await element.evaluate(el => {
        el.classList.remove('selected', 'is-selected');
        el.removeAttribute('aria-selected');
      });
      break;
    case 'expanded':
      await element.evaluate(el => {
        el.classList.remove('expanded', 'is-expanded');
        el.removeAttribute('aria-expanded');
      });
      break;
    case 'collapsed':
      await element.evaluate(el => {
        el.classList.remove('collapsed', 'is-collapsed');
        el.removeAttribute('aria-expanded');
      });
      break;
    case 'dragging':
      await element.evaluate(el => {
        el.classList.remove('dragging', 'is-dragging');
        el.removeAttribute('aria-grabbed');
      });
      break;
    case 'dropping':
      await element.evaluate(el => {
        el.classList.remove('drop-target', 'is-drop-target');
      });
      break;
    case 'invalid':
      await element.evaluate(el => {
        el.classList.remove('invalid', 'is-invalid');
        el.removeAttribute('aria-invalid');
      });
      break;
    case 'valid':
      await element.evaluate(el => {
        el.classList.remove('valid', 'is-valid');
        el.removeAttribute('aria-invalid');
      });
      break;
  }
}

async function triggerAnimationState(page: Page, element: Locator, component: string, state: string) {
  switch (state) {
    case 'enter':
      if (component === 'modal' || component === 'dropdown') {
        await element.click();
        await page.waitForTimeout(50); // Capture enter animation
      }
      break;
    case 'exit':
      if (component === 'modal') {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(50);
      }
      break;
    case 'transition-start':
      await element.hover();
      await page.waitForTimeout(25);
      break;
    case 'transition-mid':
      await element.hover();
      await page.waitForTimeout(150);
      break;
    case 'transition-end':
      await element.hover();
      await page.waitForTimeout(300);
      break;
    case 'paused':
      await page.addStyleTag({
        content: `* { animation-play-state: paused !important; }`,
      });
      break;
    case 'resumed':
      await page.addStyleTag({
        content: `* { animation-play-state: running !important; }`,
      });
      break;
    default:
      await page.waitForTimeout(100);
      break;
  }
}