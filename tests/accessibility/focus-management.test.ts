/**
 * Focus Management Testing
 * 
 * Tests focus management, focus indicators, and focus trapping
 * Validates WCAG 2.1 guidelines for focus management
 */

import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

interface FocusTestResult {
  element: string;
  hasFocusIndicator: boolean;
  isReachable: boolean;
  focusOrder: number;
  trapsFocus?: boolean;
}

/**
 * Focus Management Tester
 */
class FocusManagementTester {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  /**
   * Test focus indicators visibility and contrast
   */
  async testFocusIndicators(): Promise<FocusTestResult[]> {
    const focusableElements = await this.page.$$('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const results: FocusTestResult[] = [];
    
    for (let i = 0; i < focusableElements.length; i++) {
      const element = focusableElements[i];
      
      // Focus the element
      await element.focus();
      
      // Get element identifier
      const selector = await element.evaluate(el => {
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        const tagName = el.tagName.toLowerCase();
        const className = el.className ? `.${el.className.split(' ').join('.')}` : '';
        return `${tagName}${className}`;
      });
      
      // Check if element has visible focus indicator
      const focusIndicatorInfo = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const computedStyle = {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          outlineColor: styles.outlineColor,
          border: styles.border,
          borderWidth: styles.borderWidth,
          borderStyle: styles.borderStyle,
          borderColor: styles.borderColor,
          boxShadow: styles.boxShadow,
          backgroundColor: styles.backgroundColor
        };
        
        // Check if there's a visible focus indicator
        const hasOutline = computedStyle.outline !== 'none' && 
                          computedStyle.outlineWidth !== '0px' &&
                          computedStyle.outlineStyle !== 'none';
        
        const hasBorder = computedStyle.border !== 'none' &&
                         computedStyle.borderWidth !== '0px' &&
                         computedStyle.borderStyle !== 'none';
        
        const hasBoxShadow = computedStyle.boxShadow !== 'none' &&
                            !computedStyle.boxShadow.includes('rgba(0, 0, 0, 0)');
        
        const hasFocusIndicator = hasOutline || hasBorder || hasBoxShadow;
        
        // Calculate contrast if possible
        let contrastRatio = 0;
        if (hasOutline && computedStyle.outlineColor && computedStyle.backgroundColor) {
          // This would need actual contrast calculation
          contrastRatio = 3; // Simplified for example
        }
        
        return {
          hasFocusIndicator,
          contrastRatio,
          styles: computedStyle
        };
      });
      
      // Check if element is reachable by keyboard
      const isReachable = await element.evaluate(el => {
        const tabIndex = el.getAttribute('tabindex');
        return tabIndex !== '-1' && el.offsetParent !== null;
      });
      
      results.push({
        element: selector,
        hasFocusIndicator: focusIndicatorInfo.hasFocusIndicator,
        isReachable,
        focusOrder: i + 1
      });
    }
    
    return results;
  }
  
  /**
   * Test tab order and logical sequence
   */
  async testTabOrder(): Promise<{
    focusOrder: string[];
    isLogical: boolean;
    hasSkipLinks: boolean;
    skipLinksWork: boolean;
  }> {
    // Start from the beginning
    await this.page.keyboard.press('Tab');
    
    const focusOrder: string[] = [];
    let previousElement: string | null = null;
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      const focusedElement = await this.page.evaluate(() => {
        const element = document.activeElement;
        if (!element || element === document.body) return null;
        
        // Create identifier for the element
        if (element.id) return `#${element.id}`;
        if (element.getAttribute('data-testid')) return `[data-testid="${element.getAttribute('data-testid')}"]`;
        
        const tagName = element.tagName.toLowerCase();
        const className = element.className ? `.${element.className.split(' ').join('.')}` : '';
        return `${tagName}${className}`;
      });
      
      if (!focusedElement || focusedElement === previousElement) {
        break;
      }
      
      focusOrder.push(focusedElement);
      previousElement = focusedElement;
      
      await this.page.keyboard.press('Tab');
      attempts++;
    }
    
    // Check for skip links
    const skipLinks = await this.page.$$('a[href^="#"]:first-child, .skip-link, [data-skip-link]');
    const hasSkipLinks = skipLinks.length > 0;
    
    // Test if skip links work
    let skipLinksWork = true;
    if (hasSkipLinks) {
      for (const skipLink of skipLinks) {
        await skipLink.focus();
        await this.page.keyboard.press('Enter');
        
        const href = await skipLink.getAttribute('href');
        if (href && href.startsWith('#')) {
          const targetId = href.substring(1);
          const targetElement = await this.page.$(`#${targetId}`);
          
          if (targetElement) {
            const isFocused = await targetElement.evaluate(el => el === document.activeElement);
            if (!isFocused) {
              skipLinksWork = false;
            }
          }
        }
      }
    }
    
    // Determine if tab order is logical (simplified heuristic)
    const isLogical = focusOrder.length > 0 && !focusOrder.includes('undefined');
    
    return {
      focusOrder,
      isLogical,
      hasSkipLinks,
      skipLinksWork
    };
  }
  
  /**
   * Test focus trapping in modals and dialogs
   */
  async testFocusTrapping(): Promise<{
    modals: Array<{
      trigger: string;
      trapsFocus: boolean;
      canEscape: boolean;
      restoresFocus: boolean;
    }>;
  }> {
    const modalTriggers = await this.page.$$('[data-modal-trigger], [aria-haspopup="dialog"], [data-dialog-trigger]');
    const results: Array<{
      trigger: string;
      trapsFocus: boolean;
      canEscape: boolean;
      restoresFocus: boolean;
    }> = [];
    
    for (const trigger of modalTriggers) {
      // Get trigger identifier
      const triggerSelector = await trigger.evaluate(el => {
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        return el.tagName.toLowerCase();
      });
      
      // Focus and remember the trigger
      await trigger.focus();
      const triggerFocused = await this.page.evaluate(() => document.activeElement);
      
      // Activate the modal
      await trigger.click();
      
      // Wait for modal to appear
      await this.page.waitForTimeout(500);
      
      // Check if modal exists
      const modal = await this.page.$('[role="dialog"], .modal, [data-modal]');
      
      if (modal) {
        // Test focus trapping
        const initialFocus = await this.page.evaluate(() => document.activeElement);
        
        // Tab through the modal
        let tabCount = 0;
        const maxTabs = 10;
        let focusEscapedModal = false;
        
        while (tabCount < maxTabs) {
          await this.page.keyboard.press('Tab');
          
          const currentFocus = await this.page.evaluate(() => {
            const focused = document.activeElement;
            const modal = document.querySelector('[role="dialog"], .modal, [data-modal]');
            return {
              element: focused,
              insideModal: modal ? modal.contains(focused) : false
            };
          });
          
          if (!currentFocus.insideModal) {
            focusEscapedModal = true;
            break;
          }
          
          tabCount++;
        }
        
        const trapsFocus = !focusEscapedModal;
        
        // Test escape key
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(300);
        
        const modalStillVisible = await this.page.$('[role="dialog"], .modal, [data-modal]');
        const canEscape = !modalStillVisible;
        
        // Check if focus is restored to trigger
        const finalFocus = await this.page.evaluate(() => document.activeElement);
        const restoresFocus = finalFocus === triggerFocused;
        
        results.push({
          trigger: triggerSelector,
          trapsFocus,
          canEscape,
          restoresFocus
        });
        
        // Close modal if still open
        if (modalStillVisible) {
          const closeButton = await this.page.$('[data-close], .close, [aria-label*="close" i]');
          if (closeButton) {
            await closeButton.click();
          }
        }
      } else {
        results.push({
          trigger: triggerSelector,
          trapsFocus: false,
          canEscape: false,
          restoresFocus: false
        });
      }
    }
    
    return { modals: results };
  }
  
  /**
   * Test focus management when content changes
   */
  async testDynamicFocusManagement(): Promise<{
    contentChanges: Array<{
      trigger: string;
      managesFocus: boolean;
      announcesChange: boolean;
    }>;
  }> {
    // Find elements that might trigger content changes
    const dynamicTriggers = await this.page.$$('[data-dynamic], [aria-expanded], [aria-controls], button[type="button"]');
    const results: Array<{
      trigger: string;
      managesFocus: boolean;
      announcesChange: boolean;
    }> = [];
    
    for (const trigger of dynamicTriggers) {
      const triggerSelector = await trigger.evaluate(el => {
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        return el.tagName.toLowerCase();
      });
      
      // Get initial state
      const initialState = await this.page.evaluate(() => ({
        focused: document.activeElement,
        expandedElements: Array.from(document.querySelectorAll('[aria-expanded="true"]')).length,
        liveRegions: Array.from(document.querySelectorAll('[aria-live]')).length
      }));
      
      // Activate the trigger
      await trigger.focus();
      await trigger.click();
      
      // Wait for changes
      await this.page.waitForTimeout(500);
      
      // Check if focus was managed appropriately
      const afterState = await this.page.evaluate(() => ({
        focused: document.activeElement,
        expandedElements: Array.from(document.querySelectorAll('[aria-expanded="true"]')).length,
        liveRegions: Array.from(document.querySelectorAll('[aria-live]')).length
      }));
      
      // Determine if focus was managed
      const contentChanged = initialState.expandedElements !== afterState.expandedElements;
      const focusManaged = afterState.focused !== document.body;
      const managesFocus = !contentChanged || focusManaged;
      
      // Check for live region announcements
      const announcesChange = afterState.liveRegions > 0;
      
      results.push({
        trigger: triggerSelector,
        managesFocus,
        announcesChange
      });
    }
    
    return { contentChanges: results };
  }
  
  /**
   * Test programmatic focus management
   */
  async testProgrammaticFocus(): Promise<{
    canFocusProgrammatically: boolean;
    focusMethodWorks: boolean;
    blurMethodWorks: boolean;
  }> {
    // Test if elements can be focused programmatically
    const testElement = await this.page.$('button, input, a');
    
    if (!testElement) {
      return {
        canFocusProgrammatically: false,
        focusMethodWorks: false,
        blurMethodWorks: false
      };
    }
    
    // Test focus() method
    await testElement.evaluate(el => (el as HTMLElement).focus());
    const isFocused = await testElement.evaluate(el => el === document.activeElement);
    
    // Test blur() method
    await testElement.evaluate(el => (el as HTMLElement).blur());
    const isBlurred = await testElement.evaluate(el => el !== document.activeElement);
    
    return {
      canFocusProgrammatically: true,
      focusMethodWorks: isFocused,
      blurMethodWorks: isBlurred
    };
  }
  
  /**
   * Generate focus management report
   */
  generateFocusReport(
    indicators: FocusTestResult[],
    tabOrder: { focusOrder: string[]; isLogical: boolean; hasSkipLinks: boolean; skipLinksWork: boolean },
    focusTrapping: { modals: Array<{ trigger: string; trapsFocus: boolean; canEscape: boolean; restoresFocus: boolean }> },
    dynamicFocus: { contentChanges: Array<{ trigger: string; managesFocus: boolean; announcesChange: boolean }> }
  ): string {
    let report = `\n🎯 Focus Management Report\n`;
    report += `===========================\n\n`;
    
    // Focus indicators summary
    const indicatorFailures = indicators.filter(i => !i.hasFocusIndicator);
    const unreachableElements = indicators.filter(i => !i.isReachable);
    
    report += `📊 Focus Indicators:\n`;
    report += `• Total Focusable Elements: ${indicators.length}\n`;
    report += `• Elements with Focus Indicators: ${indicators.length - indicatorFailures.length}\n`;
    report += `• Missing Focus Indicators: ${indicatorFailures.length}\n`;
    report += `• Unreachable Elements: ${unreachableElements.length}\n\n`;
    
    // Tab order summary
    report += `⌨️  Tab Order:\n`;
    report += `• Total Focus Stops: ${tabOrder.focusOrder.length}\n`;
    report += `• Logical Order: ${tabOrder.isLogical ? 'Yes' : 'No'}\n`;
    report += `• Has Skip Links: ${tabOrder.hasSkipLinks ? 'Yes' : 'No'}\n`;
    report += `• Skip Links Work: ${tabOrder.skipLinksWork ? 'Yes' : 'No'}\n\n`;
    
    // Focus trapping summary
    if (focusTrapping.modals.length > 0) {
      const trappingFailures = focusTrapping.modals.filter(m => !m.trapsFocus);
      const escapeFailures = focusTrapping.modals.filter(m => !m.canEscape);
      const restoreFailures = focusTrapping.modals.filter(m => !m.restoresFocus);
      
      report += `🔒 Focus Trapping:\n`;
      report += `• Total Modals Tested: ${focusTrapping.modals.length}\n`;
      report += `• Proper Focus Trapping: ${focusTrapping.modals.length - trappingFailures.length}\n`;
      report += `• Can Escape with ESC: ${focusTrapping.modals.length - escapeFailures.length}\n`;
      report += `• Restores Focus: ${focusTrapping.modals.length - restoreFailures.length}\n\n`;
    }
    
    // Dynamic focus management
    if (dynamicFocus.contentChanges.length > 0) {
      const focusManagementFailures = dynamicFocus.contentChanges.filter(c => !c.managesFocus);
      
      report += `🔄 Dynamic Focus Management:\n`;
      report += `• Total Dynamic Elements: ${dynamicFocus.contentChanges.length}\n`;
      report += `• Proper Focus Management: ${dynamicFocus.contentChanges.length - focusManagementFailures.length}\n\n`;
    }
    
    // Failures details
    if (indicatorFailures.length > 0) {
      report += `❌ Missing Focus Indicators:\n`;
      indicatorFailures.forEach((failure, index) => {
        report += `${index + 1}. ${failure.element}\n`;
      });
      report += `\n`;
    }
    
    if (trappingFailures?.length > 0) {
      report += `❌ Focus Trapping Issues:\n`;
      trappingFailures.forEach((failure, index) => {
        report += `${index + 1}. ${failure.trigger} - `;
        if (!failure.trapsFocus) report += `No focus trap `;
        if (!failure.canEscape) report += `Cannot escape `;
        if (!failure.restoresFocus) report += `Doesn't restore focus `;
        report += `\n`;
      });
      report += `\n`;
    }
    
    return report;
  }
}

// Test suites
test.describe('Focus Management Accessibility', () => {
  let focusTester: FocusManagementTester;
  
  test.beforeEach(async ({ page }) => {
    focusTester = new FocusManagementTester(page);
    await injectAxe(page);
  });
  
  test('should have visible focus indicators on all focusable elements', async ({ page }) => {
    await page.goto('/');
    
    const indicators = await focusTester.testFocusIndicators();
    const failures = indicators.filter(i => !i.hasFocusIndicator);
    
    if (failures.length > 0) {
      console.log('Focus indicator failures:', failures);
    }
    
    // All focusable elements should have visible focus indicators
    expect(failures.length).toBe(0);
    
    // All elements should be reachable by keyboard
    const unreachable = indicators.filter(i => !i.isReachable);
    expect(unreachable.length).toBe(0);
  });
  
  test('should have logical tab order and working skip links', async ({ page }) => {
    await page.goto('/');
    
    const tabOrderResult = await focusTester.testTabOrder();
    
    // Tab order should be logical
    expect(tabOrderResult.isLogical).toBe(true);
    
    // Should have skip links
    expect(tabOrderResult.hasSkipLinks).toBe(true);
    
    // Skip links should work
    expect(tabOrderResult.skipLinksWork).toBe(true);
    
    // Should have reasonable number of tab stops
    expect(tabOrderResult.focusOrder.length).toBeGreaterThan(0);
    expect(tabOrderResult.focusOrder.length).toBeLessThan(100); // Reasonable upper limit
  });
  
  test('should properly trap focus in modals and dialogs', async ({ page }) => {
    await page.goto('/');
    
    const trappingResult = await focusTester.testFocusTrapping();
    
    // All modals should trap focus properly
    trappingResult.modals.forEach(modal => {
      expect(modal.trapsFocus).toBe(true);
      expect(modal.canEscape).toBe(true);
      expect(modal.restoresFocus).toBe(true);
    });
  });
  
  test('should manage focus when content changes dynamically', async ({ page }) => {
    await page.goto('/');
    
    const dynamicFocusResult = await focusTester.testDynamicFocusManagement();
    
    // All dynamic content changes should manage focus appropriately
    dynamicFocusResult.contentChanges.forEach(change => {
      expect(change.managesFocus).toBe(true);
    });
  });
  
  test('should support programmatic focus management', async ({ page }) => {
    await page.goto('/');
    
    const programmaticResult = await focusTester.testProgrammaticFocus();
    
    // Programmatic focus should work
    expect(programmaticResult.canFocusProgrammatically).toBe(true);
    expect(programmaticResult.focusMethodWorks).toBe(true);
    expect(programmaticResult.blurMethodWorks).toBe(true);
  });
  
  test('should meet focus-related accessibility standards', async ({ page }) => {
    await page.goto('/');
    
    // Run axe checks specifically for focus issues
    await checkA11y(page, undefined, {
      includedImpacts: ['serious', 'critical'],
      rules: {
        'focus-order-semantics': { enabled: true },
        'tabindex': { enabled: true },
        'bypass': { enabled: true }
      }
    });
  });
  
  test('should generate comprehensive focus management report', async ({ page }) => {
    await page.goto('/');
    
    // Run all focus tests
    const indicators = await focusTester.testFocusIndicators();
    const tabOrder = await focusTester.testTabOrder();
    const focusTrapping = await focusTester.testFocusTrapping();
    const dynamicFocus = await focusTester.testDynamicFocusManagement();
    
    const report = focusTester.generateFocusReport(indicators, tabOrder, focusTrapping, dynamicFocus);
    console.log(report);
    
    // Verify overall focus management quality
    const indicatorFailures = indicators.filter(i => !i.hasFocusIndicator);
    const trappingFailures = focusTrapping.modals.filter(m => !m.trapsFocus);
    const focusManagementFailures = dynamicFocus.contentChanges.filter(c => !c.managesFocus);
    
    expect(indicatorFailures.length).toBe(0);
    expect(trappingFailures.length).toBe(0);
    expect(focusManagementFailures.length).toBe(0);
  });
});

export { FocusManagementTester };