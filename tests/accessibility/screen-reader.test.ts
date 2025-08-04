/**
 * Screen Reader Compatibility Testing
 * 
 * Tests screen reader accessibility and ARIA implementation
 * Validates WCAG 2.1 guidelines for assistive technologies
 */

import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import { AccessibilityTester, SCREEN_READER_CONFIG } from './axe-setup';

interface ScreenReaderTestOptions {
  page: Page;
  selector?: string;
  expectedRole?: string;
  expectedLabel?: string;
}

/**
 * Screen Reader Test Helper
 */
class ScreenReaderTester {
  private page: Page;
  private accessibilityTester: AccessibilityTester;
  
  constructor(page: Page) {
    this.page = page;
    this.accessibilityTester = new AccessibilityTester(SCREEN_READER_CONFIG);
  }
  
  /**
   * Get accessible name for an element
   */
  async getAccessibleName(selector: string): Promise<string | null> {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return null;
      
      // Use the Accessible Name and Description Computation
      // Priority order: aria-labelledby, aria-label, label, placeholder, title, content
      
      // 1. aria-labelledby
      const labelledBy = element.getAttribute('aria-labelledby');
      if (labelledBy) {
        const labelElements = labelledBy.split(' ')
          .map(id => document.getElementById(id))
          .filter(el => el !== null);
        if (labelElements.length > 0) {
          return labelElements.map(el => el!.textContent).join(' ').trim();
        }
      }
      
      // 2. aria-label
      const ariaLabel = element.getAttribute('aria-label');
      if (ariaLabel) {
        return ariaLabel.trim();
      }
      
      // 3. label element (for form controls)
      if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) {
          return label.textContent?.trim() || null;
        }
      }
      
      // 4. placeholder (for inputs)
      const placeholder = element.getAttribute('placeholder');
      if (placeholder) {
        return placeholder.trim();
      }
      
      // 5. title attribute
      const title = element.getAttribute('title');
      if (title) {
        return title.trim();
      }
      
      // 6. text content (for buttons, links, etc.)
      const textContent = element.textContent;
      if (textContent) {
        return textContent.trim();
      }
      
      return null;
    }, selector);
  }
  
  /**
   * Get accessible description for an element
   */
  async getAccessibleDescription(selector: string): Promise<string | null> {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return null;
      
      // aria-describedby
      const describedBy = element.getAttribute('aria-describedby');
      if (describedBy) {
        const descElements = describedBy.split(' ')
          .map(id => document.getElementById(id))
          .filter(el => el !== null);
        if (descElements.length > 0) {
          return descElements.map(el => el!.textContent).join(' ').trim();
        }
      }
      
      return null;
    }, selector);
  }
  
  /**
   * Check if element has proper ARIA roles
   */
  async checkAriaRoles(selector: string): Promise<{
    hasRole: boolean;
    role: string | null;
    isValidRole: boolean;
    implicitRole: string | null;
  }> {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return { hasRole: false, role: null, isValidRole: false, implicitRole: null };
      
      const explicitRole = element.getAttribute('role');
      
      // Get implicit role based on element type
      const tagName = element.tagName.toLowerCase();
      const type = element.getAttribute('type');
      
      let implicitRole = null;
      switch (tagName) {
        case 'button':
          implicitRole = 'button';
          break;
        case 'a':
          implicitRole = element.getAttribute('href') ? 'link' : null;
          break;
        case 'input':
          switch (type) {
            case 'button':
            case 'submit':
            case 'reset':
              implicitRole = 'button';
              break;
            case 'checkbox':
              implicitRole = 'checkbox';
              break;
            case 'radio':
              implicitRole = 'radio';
              break;
            default:
              implicitRole = 'textbox';
          }
          break;
        case 'select':
          implicitRole = 'combobox';
          break;
        case 'textarea':
          implicitRole = 'textbox';
          break;
        case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
          implicitRole = 'heading';
          break;
        case 'nav':
          implicitRole = 'navigation';
          break;
        case 'main':
          implicitRole = 'main';
          break;
        case 'aside':
          implicitRole = 'complementary';
          break;
        case 'header':
          implicitRole = 'banner';
          break;
        case 'footer':
          implicitRole = 'contentinfo';
          break;
        case 'section':
          implicitRole = 'region';
          break;
      }
      
      // List of valid ARIA roles
      const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
        'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
        'contentinfo', 'definition', 'dialog', 'directory', 'document',
        'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
        'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
        'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
        'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
        'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
        'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
        'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar',
        'tooltip', 'tree', 'treegrid', 'treeitem'
      ];
      
      return {
        hasRole: !!explicitRole,
        role: explicitRole,
        isValidRole: explicitRole ? validRoles.includes(explicitRole) : true,
        implicitRole
      };
    }, selector);
  }
  
  /**
   * Check ARIA states and properties
   */
  async checkAriaStates(selector: string): Promise<{
    [key: string]: string | null;
  }> {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return {};
      
      const ariaAttributes: { [key: string]: string | null } = {};
      
      // Common ARIA attributes to check
      const ariaProps = [
        'aria-expanded', 'aria-selected', 'aria-checked', 'aria-pressed',
        'aria-disabled', 'aria-hidden', 'aria-current', 'aria-invalid',
        'aria-required', 'aria-readonly', 'aria-live', 'aria-atomic',
        'aria-busy', 'aria-controls', 'aria-owns', 'aria-flowto',
        'aria-activedescendant', 'aria-level', 'aria-setsize', 'aria-posinset'
      ];
      
      ariaProps.forEach(prop => {
        ariaAttributes[prop] = element.getAttribute(prop);
      });
      
      return ariaAttributes;
    }, selector);
  }
  
  /**
   * Check heading structure and hierarchy
   */
  async checkHeadingStructure(): Promise<{
    headings: Array<{ level: number; text: string; hasProperHierarchy: boolean }>;
    hasH1: boolean;
    hasProperHierarchy: boolean;
  }> {
    return await this.page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(heading => {
          const level = parseInt(heading.tagName.substring(1));
          const text = heading.textContent?.trim() || '';
          return { level, text, element: heading };
        });
      
      const hasH1 = headings.some(h => h.level === 1);
      let hasProperHierarchy = true;
      let expectedLevel = 1;
      
      const headingResults = headings.map((heading, index) => {
        let hasProperHierarchy = true;
        
        if (index === 0) {
          // First heading should be h1
          hasProperHierarchy = heading.level === 1;
          expectedLevel = 1;
        } else {
          // Subsequent headings should not skip levels
          if (heading.level > expectedLevel + 1) {
            hasProperHierarchy = false;
          }
          expectedLevel = Math.max(expectedLevel, heading.level);
        }
        
        return {
          level: heading.level,
          text: heading.text,
          hasProperHierarchy
        };
      });
      
      hasProperHierarchy = headingResults.every(h => h.hasProperHierarchy);
      
      return {
        headings: headingResults,
        hasH1,
        hasProperHierarchy
      };
    });
  }
  
  /**
   * Check landmark structure
   */
  async checkLandmarks(): Promise<{
    landmarks: Array<{ role: string; label: string | null }>;
    hasMain: boolean;
    hasBanner: boolean;
    hasContentInfo: boolean;
    hasNavigation: boolean;
  }> {
    return await this.page.evaluate(() => {
      // Find elements with landmark roles
      const landmarkSelectors = [
        '[role="main"], main',
        '[role="banner"], header:not(main header):not(section header):not(article header)',
        '[role="contentinfo"], footer:not(main footer):not(section footer):not(article footer)',
        '[role="navigation"], nav',
        '[role="search"]',
        '[role="complementary"], aside',
        '[role="region"]',
        '[role="form"], form[aria-label], form[aria-labelledby]'
      ];
      
      const landmarks: Array<{ role: string; label: string | null }> = [];
      
      landmarkSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          let role = element.getAttribute('role');
          
          // Determine implicit role if no explicit role
          if (!role) {
            const tagName = element.tagName.toLowerCase();
            switch (tagName) {
              case 'main': role = 'main'; break;
              case 'nav': role = 'navigation'; break;
              case 'aside': role = 'complementary'; break;
              case 'header': role = 'banner'; break;
              case 'footer': role = 'contentinfo'; break;
              case 'form': role = 'form'; break;
            }
          }
          
          if (role) {
            // Get accessible name for the landmark
            let label = element.getAttribute('aria-label');
            if (!label) {
              const labelledBy = element.getAttribute('aria-labelledby');
              if (labelledBy) {
                const labelElement = document.getElementById(labelledBy);
                label = labelElement?.textContent?.trim() || null;
              }
            }
            
            landmarks.push({ role, label });
          }
        });
      });
      
      return {
        landmarks,
        hasMain: landmarks.some(l => l.role === 'main'),
        hasBanner: landmarks.some(l => l.role === 'banner'),
        hasContentInfo: landmarks.some(l => l.role === 'contentinfo'),
        hasNavigation: landmarks.some(l => l.role === 'navigation')
      };
    });
  }
  
  /**
   * Check form accessibility
   */
  async checkFormAccessibility(): Promise<{
    fields: Array<{
      type: string;
      hasLabel: boolean;
      labelText: string | null;
      hasDescription: boolean;
      isRequired: boolean;
      hasValidation: boolean;
    }>;
    hasFieldset: boolean;
    hasLegend: boolean;
  }> {
    return await this.page.evaluate(() => {
      const formControls = document.querySelectorAll('input, select, textarea');
      
      const fields = Array.from(formControls).map(control => {
        const type = control.getAttribute('type') || control.tagName.toLowerCase();
        const id = control.id;
        
        // Check for label
        let hasLabel = false;
        let labelText: string | null = null;
        
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) {
            hasLabel = true;
            labelText = label.textContent?.trim() || null;
          }
        }
        
        // Check for aria-label
        if (!hasLabel) {
          const ariaLabel = control.getAttribute('aria-label');
          if (ariaLabel) {
            hasLabel = true;
            labelText = ariaLabel;
          }
        }
        
        // Check for aria-labelledby
        if (!hasLabel) {
          const labelledBy = control.getAttribute('aria-labelledby');
          if (labelledBy) {
            const labelElement = document.getElementById(labelledBy);
            if (labelElement) {
              hasLabel = true;
              labelText = labelElement.textContent?.trim() || null;
            }
          }
        }
        
        // Check for description
        const hasDescription = !!(control.getAttribute('aria-describedby'));
        
        // Check if required
        const isRequired = control.hasAttribute('required') || 
                          control.getAttribute('aria-required') === 'true';
        
        // Check for validation attributes
        const hasValidation = !!(
          control.getAttribute('aria-invalid') ||
          control.getAttribute('pattern') ||
          control.getAttribute('min') ||
          control.getAttribute('max') ||
          control.getAttribute('minlength') ||
          control.getAttribute('maxlength')
        );
        
        return {
          type,
          hasLabel,
          labelText,
          hasDescription,
          isRequired,
          hasValidation
        };
      });
      
      // Check for fieldset and legend
      const fieldsets = document.querySelectorAll('fieldset');
      const hasFieldset = fieldsets.length > 0;
      const hasLegend = Array.from(fieldsets).some(fieldset => 
        fieldset.querySelector('legend')
      );
      
      return {
        fields,
        hasFieldset,
        hasLegend
      };
    });
  }
}

// Test suites
test.describe('Screen Reader Accessibility', () => {
  let screenReaderTester: ScreenReaderTester;
  
  test.beforeEach(async ({ page }) => {
    screenReaderTester = new ScreenReaderTester(page);
    await injectAxe(page);
  });
  
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    const headingStructure = await screenReaderTester.checkHeadingStructure();
    
    // Should have at least one h1
    expect(headingStructure.hasH1).toBe(true);
    
    // Should not skip heading levels
    expect(headingStructure.hasProperHierarchy).toBe(true);
    
    // All headings should have text content
    headingStructure.headings.forEach(heading => {
      expect(heading.text.length).toBeGreaterThan(0);
    });
  });
  
  test('should have proper landmark structure', async ({ page }) => {
    await page.goto('/');
    
    const landmarks = await screenReaderTester.checkLandmarks();
    
    // Should have main content landmark
    expect(landmarks.hasMain).toBe(true);
    
    // Should have navigation landmark
    expect(landmarks.hasNavigation).toBe(true);
    
    // Multiple landmarks of the same type should have unique labels
    const landmarksByRole = landmarks.landmarks.reduce((acc, landmark) => {
      if (!acc[landmark.role]) acc[landmark.role] = [];
      acc[landmark.role].push(landmark);
      return acc;
    }, {} as { [role: string]: Array<{ role: string; label: string | null }> });
    
    Object.entries(landmarksByRole).forEach(([role, landmarks]) => {
      if (landmarks.length > 1) {
        // Multiple landmarks of same type should have labels
        landmarks.forEach(landmark => {
          expect(landmark.label).toBeTruthy();
        });
      }
    });
  });
  
  test('should have accessible form controls', async ({ page }) => {
    await page.goto('/signup');
    
    const formAccessibility = await screenReaderTester.checkFormAccessibility();
    
    // All form controls should have labels
    formAccessibility.fields.forEach((field, index) => {
      expect(field.hasLabel).toBe(true);
      expect(field.labelText).toBeTruthy();
    });
    
    // Required fields should be properly marked
    const requiredFields = formAccessibility.fields.filter(f => f.isRequired);
    requiredFields.forEach(field => {
      expect(field.hasLabel).toBe(true);
      // Should indicate requirement in label or have aria-required
    });
  });
  
  test('should have proper ARIA roles and properties', async ({ page }) => {
    await page.goto('/');
    
    // Test interactive elements
    const interactiveElements = await page.$$('button, a, input, select, [role]');
    
    for (const element of interactiveElements) {
      const selector = await element.evaluate(el => {
        // Create a selector for the element
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        return el.tagName.toLowerCase();
      });
      
      const ariaInfo = await screenReaderTester.checkAriaRoles(selector);
      
      // If element has explicit role, it should be valid
      if (ariaInfo.hasRole) {
        expect(ariaInfo.isValidRole).toBe(true);
      }
      
      // Interactive elements should have accessible names
      const accessibleName = await screenReaderTester.getAccessibleName(selector);
      if (ariaInfo.role !== 'presentation' && ariaInfo.role !== 'none') {
        expect(accessibleName).toBeTruthy();
      }
    }
  });
  
  test('should provide accessible names for all interactive elements', async ({ page }) => {
    await page.goto('/');
    
    const buttons = await page.$$('button, [role="button"]');
    const links = await page.$$('a, [role="link"]');
    const inputs = await page.$$('input, select, textarea');
    
    // Test buttons
    for (const button of buttons) {
      const selector = await button.evaluate(el => {
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        return 'button';
      });
      
      const accessibleName = await screenReaderTester.getAccessibleName(selector);
      expect(accessibleName).toBeTruthy();
    }
    
    // Test links
    for (const link of links) {
      const selector = await link.evaluate(el => {
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        return 'a';
      });
      
      const accessibleName = await screenReaderTester.getAccessibleName(selector);
      expect(accessibleName).toBeTruthy();
    }
    
    // Test form controls
    for (const input of inputs) {
      const selector = await input.evaluate(el => {
        if (el.id) return `#${el.id}`;
        if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
        return el.tagName.toLowerCase();
      });
      
      const accessibleName = await screenReaderTester.getAccessibleName(selector);
      expect(accessibleName).toBeTruthy();
    }
  });
  
  test('should have proper live regions for dynamic content', async ({ page }) => {
    await page.goto('/');
    
    // Look for elements that might need live regions
    const dynamicElements = await page.$$('[data-dynamic], .notification, .alert, .status');
    
    for (const element of dynamicElements) {
      const ariaLive = await element.getAttribute('aria-live');
      const role = await element.getAttribute('role');
      
      // Dynamic content should have aria-live or appropriate role
      const hasLiveRegion = ariaLive || 
                           role === 'alert' || 
                           role === 'status' || 
                           role === 'log';
      
      expect(hasLiveRegion).toBe(true);
    }
  });
  
  test('should handle focus management properly', async ({ page }) => {
    await page.goto('/');
    
    // Test that focus is managed when content changes
    const buttons = await page.$$('button');
    
    for (const button of buttons) {
      await button.focus();
      await button.click();
      
      // After clicking, focus should be on a logical element
      const focusedElement = await page.evaluate(() => document.activeElement);
      expect(focusedElement).toBeTruthy();
      expect(focusedElement).not.toBe(document.body);
    }
  });
  
  test('should meet screen reader compatibility standards', async ({ page }) => {
    await page.goto('/');
    
    // Run comprehensive screen reader accessibility checks
    await checkA11y(page, undefined, {
      includedImpacts: ['serious', 'critical'],
      rules: {
        // Screen reader specific rules
        'aria-allowed-attr': { enabled: true },
        'aria-command-name': { enabled: true },
        'aria-hidden-body': { enabled: true },
        'aria-hidden-focus': { enabled: true },
        'aria-input-field-name': { enabled: true },
        'aria-label': { enabled: true },
        'aria-labelledby': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-required-children': { enabled: true },
        'aria-required-parent': { enabled: true },
        'aria-roles': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'button-name': { enabled: true },
        'document-title': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'heading-order': { enabled: true },
        'label': { enabled: true },
        'landmark-one-main': { enabled: true },
        'link-name': { enabled: true },
        'list': { enabled: true },
        'listitem': { enabled: true }
      }
    });
  });
});

export { ScreenReaderTester };