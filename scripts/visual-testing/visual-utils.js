/**
 * Visual Testing Utilities
 * Helper functions for visual regression testing
 */

import { expect } from '@playwright/test';
import visualConfig from './visual-config.js';

export class VisualTestUtils {
  constructor(page, browserName) {
    this.page = page;
    this.browserName = browserName;
    this.config = visualConfig;
  }

  /**
   * Prepare page for visual testing
   */
  async preparePage(options = {}) {
    const {
      disableAnimations = true,
      hideScrollbars = true,
      stabilizeText = true,
      waitForFonts = true,
    } = options;

    // Disable animations
    if (disableAnimations) {
      await this.page.addStyleTag({
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
    }

    // Hide scrollbars
    if (hideScrollbars) {
      await this.page.addStyleTag({
        content: `
          ::-webkit-scrollbar { display: none !important; }
          * { scrollbar-width: none !important; }
        `,
      });
    }

    // Stabilize text rendering
    if (stabilizeText) {
      await this.page.addStyleTag({
        content: `
          * {
            text-rendering: geometricPrecision !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
          }
        `,
      });
    }

    // Wait for fonts to load
    if (waitForFonts) {
      await this.page.evaluate(() => document.fonts.ready);
    }

    // Wait for network idle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take component screenshot with isolation
   */
  async screenshotComponent(selector, options = {}) {
    const {
      padding = 20,
      backgroundColor = '#ffffff',
      fullPage = false,
      mask = [],
      clip,
    } = options;

    await this.preparePage();

    const element = await this.page.locator(selector);
    await expect(element).toBeVisible();

    // Add padding around component
    if (padding > 0) {
      await this.page.addStyleTag({
        content: `
          ${selector} {
            margin: ${padding}px !important;
          }
        `,
      });
    }

    // Set background color
    await this.page.addStyleTag({
      content: `
        body {
          background-color: ${backgroundColor} !important;
        }
      `,
    });

    const screenshotOptions = {
      fullPage,
      mask,
      clip,
      type: 'png',
    };

    return await element.screenshot(screenshotOptions);
  }

  /**
   * Test component in different states
   */
  async testComponentStates(selector, states = []) {
    const screenshots = {};

    for (const state of states) {
      await this.applyComponentState(selector, state);
      await this.page.waitForTimeout(100); // Allow state to settle

      const screenshot = await this.screenshotComponent(selector);
      screenshots[state] = screenshot;

      // Reset state
      await this.resetComponentState(selector, state);
    }

    return screenshots;
  }

  /**
   * Apply component state (hover, focus, etc.)
   */
  async applyComponentState(selector, state) {
    const element = this.page.locator(selector);

    switch (state) {
      case 'hover':
        await element.hover();
        break;
      case 'focus':
        await element.focus();
        break;
      case 'active':
        await element.evaluate(el => el.classList.add('active'));
        break;
      case 'disabled':
        await element.evaluate(el => {
          el.disabled = true;
          el.setAttribute('disabled', 'disabled');
        });
        break;
      case 'loading':
        await element.evaluate(el => el.classList.add('loading'));
        break;
      case 'error':
        await element.evaluate(el => el.classList.add('error'));
        break;
      case 'success':
        await element.evaluate(el => el.classList.add('success'));
        break;
      default:
        // Default state - no action needed
        break;
    }
  }

  /**
   * Reset component state
   */
  async resetComponentState(selector, state) {
    const element = this.page.locator(selector);

    switch (state) {
      case 'hover':
        await this.page.mouse.move(0, 0);
        break;
      case 'focus':
        await this.page.keyboard.press('Tab');
        break;
      case 'active':
        await element.evaluate(el => el.classList.remove('active'));
        break;
      case 'disabled':
        await element.evaluate(el => {
          el.disabled = false;
          el.removeAttribute('disabled');
        });
        break;
      case 'loading':
        await element.evaluate(el => el.classList.remove('loading'));
        break;
      case 'error':
        await element.evaluate(el => el.classList.remove('error'));
        break;
      case 'success':
        await element.evaluate(el => el.classList.remove('success'));
        break;
    }
  }

  /**
   * Test component in different themes
   */
  async testComponentThemes(selector, themes = []) {
    const screenshots = {};

    for (const theme of themes) {
      await this.applyTheme(theme);
      await this.page.waitForTimeout(100);

      const screenshot = await this.screenshotComponent(selector);
      screenshots[theme.name] = screenshot;
    }

    return screenshots;
  }

  /**
   * Apply theme to page
   */
  async applyTheme(theme) {
    await this.page.evaluate((themeClass) => {
      document.body.className = document.body.className
        .replace(/theme-\\w+/g, '');
      document.body.classList.add(themeClass);
    }, theme.className);
  }

  /**
   * Test responsive breakpoints
   */
  async testResponsiveBreakpoints(selector, viewports = []) {
    const screenshots = {};

    for (const viewport of viewports) {
      await this.page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      if (viewport.deviceScaleFactor) {
        await this.page.emulateMedia({
          media: 'screen',
          colorScheme: 'light',
        });
      }

      await this.page.waitForTimeout(100);
      await this.preparePage();

      const screenshot = await this.screenshotComponent(selector);
      screenshots[viewport.name] = screenshot;
    }

    return screenshots;
  }

  /**
   * Compare screenshots with baseline
   */
  async compareWithBaseline(screenshot, testName, options = {}) {
    const {
      threshold = this.config.baseline.threshold,
      updateBaseline = this.config.baseline.updateBaselines,
    } = options;

    const screenshotName = `${testName}-${this.browserName}.png`;

    if (updateBaseline) {
      // Update baseline - useful for initial setup or intentional changes
      return screenshot;
    }

    // Compare with existing baseline
    await expect(screenshot).toMatchSnapshot(screenshotName, {
      threshold,
      mode: 'percent',
    });
  }

  /**
   * Mask dynamic content
   */
  async maskDynamicContent(selectors = []) {
    const defaultMasks = [
      '[data-testid="timestamp"]',
      '[data-testid="random-id"]',
      '.loading-spinner',
      '.skeleton',
      '[data-dynamic="true"]',
    ];

    const allMasks = [...defaultMasks, ...selectors];

    for (const selector of allMasks) {
      await this.page.addStyleTag({
        content: `
          ${selector} {
            opacity: 0 !important;
            visibility: hidden !important;
          }
        `,
      });
    }
  }

  /**
   * Wait for stable layout
   */
  async waitForStableLayout(timeout = 5000) {
    let lastHeight = 0;
    let stableCount = 0;
    const requiredStableCount = 3;
    const checkInterval = 100;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const currentHeight = await this.page.evaluate(() => document.body.scrollHeight);

      if (currentHeight === lastHeight) {
        stableCount++;
        if (stableCount >= requiredStableCount) {
          break;
        }
      } else {
        stableCount = 0;
        lastHeight = currentHeight;
      }

      await this.page.waitForTimeout(checkInterval);
    }
  }

  /**
   * Generate test report data
   */
  generateReportData(testResults) {
    return {
      timestamp: new Date().toISOString(),
      browser: this.browserName,
      totalTests: testResults.length,
      passed: testResults.filter(r => r.status === 'passed').length,
      failed: testResults.filter(r => r.status === 'failed').length,
      results: testResults,
      config: {
        threshold: this.config.baseline.threshold,
        viewports: this.config.viewports,
        themes: this.config.components.themes,
      },
    };
  }
}

/**
 * Accessibility visual testing utilities
 */
export class AccessibilityVisualUtils extends VisualTestUtils {
  /**
   * Test high contrast mode
   */
  async testHighContrast(selector) {
    await this.page.emulateMedia({ 
      colorScheme: 'dark',
      forcedColors: 'active' 
    });

    await this.page.addStyleTag({
      content: `
        @media (forced-colors: active) {
          * {
            forced-color-adjust: none !important;
          }
        }
      `,
    });

    return await this.screenshotComponent(selector);
  }

  /**
   * Test reduced motion preferences
   */
  async testReducedMotion(selector) {
    await this.page.emulateMedia({ reducedMotion: 'reduce' });
    
    await this.page.addStyleTag({
      content: `
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `,
    });

    return await this.screenshotComponent(selector);
  }

  /**
   * Test focus indicators
   */
  async testFocusIndicators(selector) {
    const element = this.page.locator(selector);
    await element.focus();

    // Ensure focus is visible
    await this.page.addStyleTag({
      content: `
        *:focus {
          outline: 2px solid #007acc !important;
          outline-offset: 2px !important;
        }
      `,
    });

    return await this.screenshotComponent(selector);
  }
}

export default VisualTestUtils;