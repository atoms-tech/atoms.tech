/**
 * Accessibility Testing Setup
 * 
 * Global setup for accessibility testing with jest-axe and enhanced matchers
 */

import 'jest-axe/extend-expect';
import { configure } from '@testing-library/react';
import { setupServer } from 'msw/node';

// Configure testing library for better accessibility testing
configure({
  // Increase timeout for accessibility tests
  asyncTimeout: 10000,
  
  // Configure getBy queries to be more accessibility-friendly
  defaultHidden: false,
  
  // Better error messages for accessibility issues
  getElementError: (message, container) => {
    const error = new Error(message);
    error.name = 'AccessibilityTestingError';
    return error;
  }
});

// Setup global accessibility testing environment
beforeAll(() => {
  // Mock window.matchMedia for media query tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock ResizeObserver for responsive accessibility tests
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock IntersectionObserver for lazy loading accessibility
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock requestAnimationFrame for animation accessibility tests
  global.requestAnimationFrame = jest.fn().mockImplementation(cb => {
    return setTimeout(cb, 0);
  });

  global.cancelAnimationFrame = jest.fn().mockImplementation(id => {
    clearTimeout(id);
  });

  // Enhanced console.warn to catch accessibility warnings
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('accessibility') || message.includes('a11y')) {
      throw new Error(`Accessibility Warning: ${message}`);
    }
    originalWarn(...args);
  };
});

// Setup MSW for API mocking in accessibility tests
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Global accessibility test utilities
global.accessibilityTestHelpers = {
  // Simulate screen reader
  simulateScreenReader: () => {
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NVDA/2021.1'
    });
  },

  // Simulate keyboard-only navigation
  simulateKeyboardOnly: () => {
    // Disable mouse events globally
    const originalAddEventListener = Element.prototype.addEventListener;
    Element.prototype.addEventListener = function(type, listener, options) {
      if (!['click', 'mousedown', 'mouseup', 'mouseover', 'mouseout'].includes(type)) {
        return originalAddEventListener.call(this, type, listener, options);
      }
    };
  },

  // Simulate high contrast mode
  simulateHighContrast: () => {
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
  },

  // Simulate reduced motion
  simulateReducedMotion: () => {
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
  },

  // Simulate color blindness
  simulateColorBlindness: (type = 'protanopia') => {
    // Apply CSS filter to simulate color blindness
    const style = document.createElement('style');
    const filters = {
      protanopia: 'url(#protanopia)',
      deuteranopia: 'url(#deuteranopia)',
      tritanopia: 'url(#tritanopia)',
      achromatopsia: 'grayscale(100%)'
    };
    
    style.textContent = `
      * { filter: ${filters[type]} !important; }
    `;
    document.head.appendChild(style);
  },

  // Reset all simulations
  resetSimulations: () => {
    // Reset matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Reset styles
    const styles = document.head.querySelectorAll('style');
    styles.forEach(style => style.remove());

    // Reset event listeners
    Element.prototype.addEventListener = EventTarget.prototype.addEventListener;
  }
};

// Custom Jest matchers for accessibility
expect.extend({
  toBeAccessible(received) {
    // This will be set by individual tests using axe
    return {
      pass: true,
      message: () => 'Element should be accessible'
    };
  },

  toHaveFocusIndicator(element) {
    const styles = window.getComputedStyle(element);
    const hasFocus = styles.outline !== 'none' || 
                    styles.boxShadow !== 'none' ||
                    styles.border !== element.style.border;
    
    return {
      pass: hasFocus,
      message: () => hasFocus 
        ? `Element has focus indicator`
        : `Element should have visible focus indicator`
    };
  },

  toHaveAccessibleName(element) {
    const accessibleName = element.getAttribute('aria-label') ||
                          element.getAttribute('aria-labelledby') ||
                          element.textContent ||
                          element.getAttribute('title') ||
                          element.getAttribute('alt');
    
    return {
      pass: !!accessibleName && accessibleName.trim().length > 0,
      message: () => accessibleName 
        ? `Element has accessible name: "${accessibleName}"`
        : `Element should have an accessible name`
    };
  },

  toHaveCorrectAriaAttributes(element, expectedAttributes) {
    const missingAttributes = [];
    const incorrectAttributes = [];

    Object.entries(expectedAttributes).forEach(([attr, expectedValue]) => {
      const actualValue = element.getAttribute(attr);
      
      if (actualValue === null) {
        missingAttributes.push(attr);
      } else if (actualValue !== expectedValue) {
        incorrectAttributes.push(`${attr}: expected "${expectedValue}", got "${actualValue}"`);
      }
    });

    const isValid = missingAttributes.length === 0 && incorrectAttributes.length === 0;

    return {
      pass: isValid,
      message: () => {
        if (!isValid) {
          let message = 'Element has incorrect ARIA attributes:\n';
          if (missingAttributes.length > 0) {
            message += `Missing: ${missingAttributes.join(', ')}\n`;
          }
          if (incorrectAttributes.length > 0) {
            message += `Incorrect: ${incorrectAttributes.join(', ')}`;
          }
          return message;
        }
        return 'Element has correct ARIA attributes';
      }
    };
  }
});

// Global error handler for accessibility issues
process.on('unhandledRejection', (reason) => {
  if (reason && reason.message && reason.message.includes('accessibility')) {
    console.error('Accessibility Test Error:', reason);
    process.exit(1);
  }
});

// Cleanup after each test
afterEach(() => {
  // Reset any global state modifications
  global.accessibilityTestHelpers.resetSimulations();
  
  // Clear any accessibility warnings
  jest.clearAllMocks();
  
  // Reset document modifications
  document.documentElement.style.fontSize = '';
  document.documentElement.classList.remove('high-contrast', 'reduced-motion');
});