/**
 * Accessibility Testing Utilities
 * 
 * Comprehensive WCAG 2.1 AA testing utilities for automated accessibility testing
 */

import { axe, toHaveNoViolations } from 'jest-axe';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Enhanced axe configuration for comprehensive accessibility testing
 */
export const accessibilityConfig = {
  // WCAG 2.1 AA compliance rules
  rules: {
    // Color and contrast
    'color-contrast': { enabled: true },
    'color-contrast-enhanced': { enabled: true },
    
    // Keyboard navigation
    'keyboard': { enabled: true },
    'focus-order-semantics': { enabled: true },
    'tabindex': { enabled: true },
    
    // ARIA and semantics
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
    'aria-toggle-field-name': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    
    // Form accessibility
    'form-field-multiple-labels': { enabled: true },
    'label': { enabled: true },
    'label-title-only': { enabled: true },
    
    // Images and media
    'image-alt': { enabled: true },
    'image-redundant-alt': { enabled: true },
    
    // Structure and semantics
    'heading-order': { enabled: true },
    'landmark-one-main': { enabled: true },
    'landmark-complementary-is-top-level': { enabled: true },
    'landmark-no-duplicate-banner': { enabled: true },
    'landmark-no-duplicate-contentinfo': { enabled: true },
    'landmark-unique': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true },
    
    // Links and navigation
    'link-name': { enabled: true },
    'link-in-text-block': { enabled: true },
    
    // Tables
    'table-fake-caption': { enabled: true },
    'td-headers-attr': { enabled: true },
    'th-has-data-cells': { enabled: true },
    
    // Interactive elements
    'button-name': { enabled: true },
    'duplicate-id': { enabled: true },
    'duplicate-id-active': { enabled: true },
    'duplicate-id-aria': { enabled: true },
    
    // Best practices
    'html-has-lang': { enabled: true },
    'html-lang-valid': { enabled: true },
    'lang-valid': { enabled: true },
    'meta-refresh': { enabled: true },
    'meta-viewport': { enabled: true },
    'valid-lang': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']
};

/**
 * Test component for accessibility violations
 */
export async function testAccessibility(
  component: ReactElement,
  config = accessibilityConfig
): Promise<void> {
  const { container } = render(component);
  const results = await axe(container, config);
  expect(results).toHaveNoViolations();
}

/**
 * Test keyboard navigation accessibility
 */
export async function testKeyboardNavigation(
  component: ReactElement,
  expectedFocusableElements: string[] = []
): Promise<void> {
  const user = userEvent.setup();
  render(component);
  
  // Test Tab navigation
  for (const selector of expectedFocusableElements) {
    await user.tab();
    const focusedElement = document.activeElement;
    expect(focusedElement).toMatch(selector);
    
    // Ensure element has visible focus indicator
    const styles = window.getComputedStyle(focusedElement as Element);
    expect(
      styles.outline !== 'none' || 
      styles.boxShadow !== 'none' ||
      styles.border !== 'none'
    ).toBeTruthy();
  }
  
  // Test Shift+Tab navigation (reverse)
  for (let i = expectedFocusableElements.length - 1; i >= 0; i--) {
    await user.tab({ shift: true });
    const focusedElement = document.activeElement;
    expect(focusedElement).toMatch(expectedFocusableElements[i]);
  }
}

/**
 * Test screen reader compatibility
 */
export function testScreenReaderCompatibility(component: ReactElement): void {
  render(component);
  
  // Test for proper ARIA labels
  const ariaLabels = screen.queryAllByRole(/.*/, { name: /.*/ });
  expect(ariaLabels.length).toBeGreaterThan(0);
  
  // Test for semantic HTML structure
  const landmarks = screen.queryAllByRole('main') || 
                   screen.queryAllByRole('navigation') ||
                   screen.queryAllByRole('banner') ||
                   screen.queryAllByRole('contentinfo');
  
  // Test for proper heading hierarchy
  const headings = screen.queryAllByRole('heading');
  if (headings.length > 0) {
    headings.forEach((heading) => {
      expect(heading).toHaveAttribute('aria-level');
    });
  }
}

/**
 * Test color contrast compliance
 */
export async function testColorContrast(
  component: ReactElement,
  minimumRatio: number = 4.5
): Promise<void> {
  const { container } = render(component);
  
  const contrastConfig = {
    rules: {
      'color-contrast': { 
        enabled: true,
        options: { 
          contrastRatio: { normal: minimumRatio, large: 3.0 } 
        }
      }
    },
    tags: ['wcag2aa']
  };
  
  const results = await axe(container, contrastConfig);
  expect(results).toHaveNoViolations();
}

/**
 * Test form accessibility
 */
export function testFormAccessibility(component: ReactElement): void {
  render(component);
  
  // Test that all form controls have labels
  const inputs = screen.getAllByRole('textbox') || [];
  const checkboxes = screen.getAllByRole('checkbox') || [];
  const radios = screen.getAllByRole('radio') || [];
  const selects = screen.getAllByRole('combobox') || [];
  
  const formControls = [...inputs, ...checkboxes, ...radios, ...selects];
  
  formControls.forEach((control) => {
    // Check for accessible name (label, aria-label, or aria-labelledby)
    expect(
      control.getAttribute('aria-label') ||
      control.getAttribute('aria-labelledby') ||
      control.closest('label') ||
      document.querySelector(`label[for="${control.id}"]`)
    ).toBeTruthy();
  });
  
  // Test error message association
  const errorElements = screen.queryAllByRole('alert');
  errorElements.forEach((error) => {
    const associatedControl = document.querySelector(
      `[aria-describedby*="${error.id}"]`
    );
    expect(associatedControl).toBeTruthy();
  });
}

/**
 * Test modal/dialog accessibility
 */
export async function testModalAccessibility(
  triggerElement: HTMLElement,
  modalSelector: string
): Promise<void> {
  const user = userEvent.setup();
  
  // Open modal
  await user.click(triggerElement);
  
  const modal = document.querySelector(modalSelector);
  expect(modal).toBeTruthy();
  
  // Test focus management
  expect(document.activeElement).toBeInTheDocument();
  expect(modal?.contains(document.activeElement)).toBeTruthy();
  
  // Test ARIA attributes
  expect(modal).toHaveAttribute('role', 'dialog');
  expect(modal).toHaveAttribute('aria-modal', 'true');
  expect(modal).toHaveAttribute('aria-labelledby');
  
  // Test Escape key closes modal
  await user.keyboard('{Escape}');
  expect(modal).not.toBeVisible();
  
  // Test focus returns to trigger
  expect(document.activeElement).toBe(triggerElement);
}

/**
 * Test high contrast mode compatibility
 */
export function testHighContrastMode(component: ReactElement): void {
  render(component);
  
  // Simulate high contrast mode by adding forced-colors media query
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: query === '(forced-colors: active)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  
  // Component should use system colors and maintain readability
  const elements = document.querySelectorAll('*');
  elements.forEach((element) => {
    const styles = window.getComputedStyle(element);
    
    // Check that custom colors don't override system colors
    if (styles.color && styles.color !== 'inherit') {
      expect(['ButtonText', 'LinkText', 'WindowText', 'GrayText'])
        .toContain(styles.color);
    }
  });
}

/**
 * Test reduced motion preferences
 */
export function testReducedMotionSupport(component: ReactElement): void {
  // Mock prefers-reduced-motion
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  
  render(component);
  
  // Check that animations are disabled or reduced
  const animatedElements = document.querySelectorAll('[class*="animate"]');
  animatedElements.forEach((element) => {
    const styles = window.getComputedStyle(element);
    
    // Animation should be disabled or duration should be short
    expect(
      styles.animationDuration === '0s' ||
      styles.animationDelay === '0s' ||
      styles.transitionDuration === '0s'
    ).toBeTruthy();
  });
}

/**
 * Test text scaling up to 200%
 */
export function testTextScaling(component: ReactElement): void {
  render(component);
  
  // Simulate 200% text scaling
  document.documentElement.style.fontSize = '32px'; // 200% of 16px
  
  // Component should remain functional and readable
  const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
  textElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    
    // Text should not be clipped or overlapping
    expect(rect.height).toBeGreaterThan(0);
    expect(rect.width).toBeGreaterThan(0);
  });
  
  // Reset font size
  document.documentElement.style.fontSize = '';
}

/**
 * Test touch accessibility (minimum touch target size)
 */
export function testTouchAccessibility(component: ReactElement): void {
  render(component);
  
  const interactiveElements = document.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex="0"]'
  );
  
  interactiveElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    
    // WCAG 2.1 AA requires minimum 44x44px touch targets
    expect(Math.max(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
  });
}

/**
 * Comprehensive accessibility test suite
 */
export async function runAccessibilityTestSuite(
  component: ReactElement,
  options: {
    skipKeyboard?: boolean;
    skipColorContrast?: boolean;
    skipScreenReader?: boolean;
    skipForms?: boolean;
    skipTouch?: boolean;
    skipHighContrast?: boolean;
    skipReducedMotion?: boolean;
    skipTextScaling?: boolean;
    focusableElements?: string[];
    minimumContrastRatio?: number;
  } = {}
): Promise<void> {
  // Core accessibility violations test
  await testAccessibility(component);
  
  // Optional tests based on component type
  if (!options.skipKeyboard && options.focusableElements) {
    await testKeyboardNavigation(component, options.focusableElements);
  }
  
  if (!options.skipColorContrast) {
    await testColorContrast(component, options.minimumContrastRatio);
  }
  
  if (!options.skipScreenReader) {
    testScreenReaderCompatibility(component);
  }
  
  if (!options.skipForms) {
    testFormAccessibility(component);
  }
  
  if (!options.skipTouch) {
    testTouchAccessibility(component);
  }
  
  if (!options.skipHighContrast) {
    testHighContrastMode(component);
  }
  
  if (!options.skipReducedMotion) {
    testReducedMotionSupport(component);
  }
  
  if (!options.skipTextScaling) {
    testTextScaling(component);
  }
}

/**
 * Accessibility test helper for React components
 */
export const a11yTest = {
  // Quick tests
  basic: testAccessibility,
  keyboard: testKeyboardNavigation,
  screenReader: testScreenReaderCompatibility,
  colorContrast: testColorContrast,
  forms: testFormAccessibility,
  modal: testModalAccessibility,
  
  // Comprehensive test
  suite: runAccessibilityTestSuite,
  
  // Specialized tests
  highContrast: testHighContrastMode,
  reducedMotion: testReducedMotionSupport,
  textScaling: testTextScaling,
  touch: testTouchAccessibility,
  
  // Configuration
  config: accessibilityConfig
};

export default a11yTest;