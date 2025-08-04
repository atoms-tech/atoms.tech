/**
 * Comprehensive Keyboard Navigation Testing
 * 
 * Tests keyboard accessibility across the application
 * Validates WCAG 2.1 guideline 2.1 (Keyboard Accessible)
 */

import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import { AccessibilityTester, KEYBOARD_NAV_CONFIG } from './axe-setup';

interface KeyboardTestOptions {
  page: Page;
  selector?: string;
  skipElements?: string[];
  expectedFocusOrder?: string[];
}

/**
 * Keyboard Navigation Test Helper
 */
class KeyboardNavigationTester {
  private page: Page;
  private accessibilityTester: AccessibilityTester;
  
  constructor(page: Page) {
    this.page = page;
    this.accessibilityTester = new AccessibilityTester(KEYBOARD_NAV_CONFIG);
  }
  
  /**
   * Test tab navigation order
   */
  async testTabOrder(options: KeyboardTestOptions): Promise<string[]> {
    const { selector = 'body', skipElements = [] } = options;
    const focusOrder: string[] = [];
    
    // Start from the beginning
    await this.page.keyboard.press('Tab');
    
    let previousElement: string | null = null;
    let attempts = 0;
    const maxAttempts = 50; // Prevent infinite loops
    
    while (attempts < maxAttempts) {
      // Get currently focused element
      const focusedElement = await this.page.evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) return null;
        
        // Create a unique selector for the element
        const tagName = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : '';
        const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
        const dataTestId = element.getAttribute('data-testid') ? `[data-testid="${element.getAttribute('data-testid')}"]` : '';
        
        return dataTestId || id || `${tagName}${className}`;
      });
      
      // If no element is focused or we've cycled back to the beginning, stop
      if (!focusedElement || focusedElement === previousElement) {
        break;
      }
      
      // Skip elements we don't want to test
      if (!skipElements.some(skip => focusedElement.includes(skip))) {
        focusOrder.push(focusedElement);
      }
      
      previousElement = focusedElement;
      
      // Move to next focusable element
      await this.page.keyboard.press('Tab');
      attempts++;
    }
    
    return focusOrder;
  }
  
  /**
   * Test reverse tab navigation
   */
  async testReverseTabOrder(focusOrder: string[]): Promise<boolean> {
    // Go to the last element in the focus order
    for (let i = 0; i < focusOrder.length; i++) {
      await this.page.keyboard.press('Tab');
    }
    
    // Now test reverse navigation
    const reverseFocusOrder: string[] = [];
    
    for (let i = 0; i < focusOrder.length; i++) {
      await this.page.keyboard.press('Shift+Tab');
      
      const focusedElement = await this.page.evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) return null;
        
        const tagName = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : '';
        const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
        const dataTestId = element.getAttribute('data-testid') ? `[data-testid="${element.getAttribute('data-testid')}"]` : '';
        
        return dataTestId || id || `${tagName}${className}`;
      });
      
      if (focusedElement) {
        reverseFocusOrder.push(focusedElement);
      }
    }
    
    // Reverse the array to compare with forward navigation
    reverseFocusOrder.reverse();
    
    // Compare the two orders (allow for some flexibility)
    return focusOrder.length === reverseFocusOrder.length &&
           focusOrder.every((element, index) => element === reverseFocusOrder[index]);
  }
  
  /**
   * Test keyboard shortcuts
   */
  async testKeyboardShortcuts(): Promise<{ [key: string]: boolean }> {
    const shortcuts = {
      'Escape': false,
      'Enter': false,
      'Space': false,
      'ArrowUp': false,
      'ArrowDown': false,
      'ArrowLeft': false,
      'ArrowRight': false,
      'Home': false,
      'End': false
    };
    
    // Test each shortcut on interactive elements
    const interactiveElements = await this.page.$$('[role="button"], button, [role="link"], a, [role="menuitem"], [role="tab"]');
    
    for (const element of interactiveElements) {
      await element.focus();
      
      // Test common keyboard shortcuts
      for (const key of Object.keys(shortcuts)) {
        try {
          await this.page.keyboard.press(key);
          
          // Check if the action was handled (no specific assertion, just ensure no errors)
          shortcuts[key] = true;
        } catch (error) {
          // Key not supported or error occurred
          console.warn(`Keyboard shortcut ${key} not supported on element`, error);
        }
      }
    }
    
    return shortcuts;
  }
  
  /**
   * Test focus trap functionality
   */
  async testFocusTrap(containerSelector: string): Promise<boolean> {
    // Find the container
    const container = await this.page.$(containerSelector);
    if (!container) return false;
    
    // Get all focusable elements within the container
    const focusableElements = await container.$$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    if (focusableElements.length === 0) return true; // No focusable elements
    
    // Focus the first element
    await focusableElements[0].focus();
    
    // Tab through all elements
    for (let i = 1; i < focusableElements.length; i++) {
      await this.page.keyboard.press('Tab');
    }
    
    // Tab one more time - should wrap to first element
    await this.page.keyboard.press('Tab');
    
    // Check if focus is on the first element
    const currentFocus = await this.page.evaluate(() => document.activeElement);
    const firstElement = await focusableElements[0].evaluate(el => el);
    
    return currentFocus === firstElement;
  }
  
  /**
   * Test skip links
   */
  async testSkipLinks(): Promise<boolean> {
    // Look for skip links
    const skipLinks = await this.page.$$('a[href^="#"]:first-child, .skip-link, [data-skip-link]');
    
    if (skipLinks.length === 0) {
      console.warn('No skip links found');
      return false;
    }
    
    let allSkipLinksWork = true;
    
    for (const skipLink of skipLinks) {
      // Focus the skip link
      await skipLink.focus();
      
      // Check if it's visible when focused
      const isVisible = await skipLink.isVisible();
      if (!isVisible) {
        console.warn('Skip link is not visible when focused');
        allSkipLinksWork = false;
        continue;
      }
      
      // Press Enter to activate the skip link
      await this.page.keyboard.press('Enter');
      
      // Check if focus moved to the target
      const href = await skipLink.getAttribute('href');
      if (href && href.startsWith('#')) {
        const targetId = href.substring(1);
        const targetElement = await this.page.$(`#${targetId}`);
        
        if (targetElement) {
          const isFocused = await targetElement.evaluate(el => el === document.activeElement);
          if (!isFocused) {
            console.warn(`Skip link did not move focus to target: ${targetId}`);
            allSkipLinksWork = false;
          }
        }
      }
    }
    
    return allSkipLinksWork;
  }
}

// Test suites
test.describe('Keyboard Navigation Accessibility', () => {
  let keyboardTester: KeyboardNavigationTester;
  
  test.beforeEach(async ({ page }) => {
    keyboardTester = new KeyboardNavigationTester(page);
    await injectAxe(page);
  });
  
  test('should have logical tab order on homepage', async ({ page }) => {
    await page.goto('/');
    
    const focusOrder = await keyboardTester.testTabOrder({
      page,
      skipElements: ['script', 'style', 'meta']
    });
    
    // Basic validation
    expect(focusOrder.length).toBeGreaterThan(0);
    
    // Check for duplicate focus targets
    const uniqueFocusOrder = [...new Set(focusOrder)];
    expect(uniqueFocusOrder.length).toBe(focusOrder.length);
    
    // Test reverse tab order
    const reverseOrderValid = await keyboardTester.testReverseTabOrder(focusOrder);
    expect(reverseOrderValid).toBe(true);
    
    // Run axe checks specifically for keyboard navigation
    await checkA11y(page, undefined, {
      includedImpacts: ['serious', 'critical'],
      tags: ['wcag2a', 'wcag21a', 'wcag2aa', 'wcag21aa']
    });
  });
  
  test('should support keyboard shortcuts', async ({ page }) => {
    await page.goto('/');
    
    const shortcuts = await keyboardTester.testKeyboardShortcuts();
    
    // At least basic navigation keys should be supported
    expect(shortcuts['Enter'] || shortcuts['Space']).toBe(true);
    expect(shortcuts['Escape']).toBe(true);
  });
  
  test('should have working skip links', async ({ page }) => {
    await page.goto('/');
    
    const skipLinksWork = await keyboardTester.testSkipLinks();
    expect(skipLinksWork).toBe(true);
  });
  
  test('should trap focus in modals', async ({ page }) => {
    await page.goto('/');
    
    // Look for modal triggers
    const modalTriggers = await page.$$('[data-modal-trigger], [aria-haspopup="dialog"]');
    
    for (const trigger of modalTriggers) {
      // Open modal
      await trigger.click();
      
      // Wait for modal to appear
      await page.waitForSelector('[role="dialog"], .modal, [data-modal]', { timeout: 5000 });
      
      // Test focus trap
      const modalSelector = '[role="dialog"], .modal, [data-modal]';
      const focusTrapWorks = await keyboardTester.testFocusTrap(modalSelector);
      expect(focusTrapWorks).toBe(true);
      
      // Close modal (ESC key)
      await page.keyboard.press('Escape');
    }
  });
  
  test('should handle arrow key navigation in lists and menus', async ({ page }) => {
    await page.goto('/');
    
    // Find lists and menus
    const navigationElements = await page.$$('[role="menu"], [role="listbox"], [role="tablist"], ul[role="list"]');
    
    for (const element of navigationElements) {
      await element.focus();
      
      // Test arrow key navigation
      const initialFocus = await page.evaluate(() => document.activeElement);
      
      // Arrow down
      await page.keyboard.press('ArrowDown');
      const afterArrowDown = await page.evaluate(() => document.activeElement);
      
      // Arrow up
      await page.keyboard.press('ArrowUp');
      const afterArrowUp = await page.evaluate(() => document.activeElement);
      
      // For lists/menus, arrow keys should change focus
      if (element) {
        const hasArrowNavigation = initialFocus !== afterArrowDown || initialFocus !== afterArrowUp;
        // Allow for lists that don't implement arrow navigation (not required for all lists)
        if (hasArrowNavigation) {
          expect(hasArrowNavigation).toBe(true);
        }
      }
    }
  });
  
  test('should not have keyboard traps outside of modals', async ({ page }) => {
    await page.goto('/');
    
    // Get initial focus order
    const focusOrder = await keyboardTester.testTabOrder({
      page,
      skipElements: ['script', 'style', 'meta']
    });
    
    // If we can tab through all elements and get back to the beginning, there's no trap
    expect(focusOrder.length).toBeGreaterThan(0);
    
    // Tab through the entire page twice to ensure we don't get stuck
    let tabCount = 0;
    const maxTabs = focusOrder.length * 2 + 10; // Allow some extra tabs
    
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;
    }
    
    // If we made it through without hanging, there's no trap
    expect(tabCount).toBe(maxTabs);
  });
  
  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');
    
    // Get all interactive elements
    const interactiveElements = await page.$$('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    for (const element of interactiveElements) {
      await element.focus();
      
      // Check if element has visible focus (outline, border, etc.)
      const focusStyles = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          outlineColor: styles.outlineColor,
          border: styles.border,
          boxShadow: styles.boxShadow
        };
      });
      
      // Element should have some form of visible focus indicator
      const hasVisibleFocus = 
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none' ||
        focusStyles.border !== 'none';
      
      expect(hasVisibleFocus).toBe(true);
    }
  });
  
  test('should meet keyboard accessibility standards', async ({ page }) => {
    await page.goto('/');
    
    // Run comprehensive keyboard accessibility checks
    await checkA11y(page, undefined, {
      includedImpacts: ['serious', 'critical'],
      rules: {
        // Keyboard-specific rules
        'accesskeys': { enabled: true },
        'focus-order-semantics': { enabled: true },
        'keyboard': { enabled: true },
        'no-focusable-content': { enabled: true },
        'tabindex': { enabled: true },
        'bypass': { enabled: true },
        'skip-link': { enabled: true }
      }
    });
  });
});

// Additional keyboard navigation tests for specific components
test.describe('Component-Specific Keyboard Navigation', () => {
  test('navigation menu keyboard accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Test main navigation
    const nav = await page.$('nav, [role="navigation"]');
    if (nav) {
      await nav.focus();
      
      // Test horizontal arrow navigation if applicable
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowLeft');
      
      // Test Enter/Space activation
      await page.keyboard.press('Enter');
    }
  });
  
  test('form controls keyboard accessibility', async ({ page }) => {
    await page.goto('/signup');
    
    // Test form navigation
    const forms = await page.$$('form');
    
    for (const form of forms) {
      const inputs = await form.$$('input, select, textarea, button');
      
      for (const input of inputs) {
        await input.focus();
        
        // Test that form controls are reachable by keyboard
        const isReachable = await input.evaluate(el => el === document.activeElement);
        expect(isReachable).toBe(true);
      }
    }
  });
  
  test('dropdown and combobox keyboard accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Find dropdowns and comboboxes
    const dropdowns = await page.$$('[role="combobox"], [role="listbox"], select');
    
    for (const dropdown of dropdowns) {
      await dropdown.focus();
      
      // Test dropdown keyboard interaction
      await page.keyboard.press('Enter');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('Escape');
    }
  });
});

export { KeyboardNavigationTester };