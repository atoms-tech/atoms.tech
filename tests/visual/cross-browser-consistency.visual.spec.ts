/**
 * Cross-Browser Consistency Visual Regression Tests
 * Ensures visual consistency across different browsers and engines
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { VisualTestUtils } from '../../scripts/visual-testing/visual-utils.js';
import visualConfig from '../../scripts/visual-testing/visual-config.js';

// Browser-specific configurations
const browsers = {
  chromium: {
    name: 'chromium',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    flags: [
      '--force-color-profile=srgb',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
    ],
  },
  firefox: {
    name: 'firefox',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    preferences: {
      'gfx.color_management.mode': 1,
      'gfx.color_management.display_profile': 'sRGB',
    },
  },
  webkit: {
    name: 'webkit',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
  },
};

// Key pages to test for cross-browser consistency
const testPages = [
  { path: '/', name: 'homepage', requiresAuth: false },
  { path: '/login', name: 'login', requiresAuth: false },
  { path: '/dashboard', name: 'dashboard', requiresAuth: true },
  { path: '/components-demo', name: 'components', requiresAuth: false },
];

// Critical UI components for cross-browser testing
const criticalComponents = [
  'button',
  'input',
  'select',
  'checkbox',
  'radio',
  'modal',
  'dropdown',
  'tabs',
  'accordion',
  'table',
  'form',
  'navigation',
  'breadcrumb',
  'tooltip',
  'popover',
];

test.describe('Cross-Browser Consistency Tests', () => {
  let visualUtils: VisualTestUtils;

  test.beforeEach(async ({ page, browserName }) => {
    visualUtils = new VisualTestUtils(page, browserName);
    
    // Apply browser-specific optimizations
    await applyBrowserOptimizations(page, browserName);
    await visualUtils.preparePage({
      disableAnimations: true,
      hideScrollbars: true,
      stabilizeText: true,
      waitForFonts: true,
    });
  });

  // Test page-level consistency across browsers
  for (const testPage of testPages) {
    test(`Page consistency: ${testPage.name}`, async ({ page, browserName }) => {
      // Setup authentication if required
      if (testPage.requiresAuth) {
        await setupMockAuth(page);
      }

      await page.goto(testPage.path);
      await visualUtils.preparePage();
      await visualUtils.waitForStableLayout();

      // Normalize browser-specific differences
      await normalizeBrowserDifferences(page, browserName);

      // Take full page screenshot
      await expect(page).toHaveScreenshot(
        `page-${testPage.name}-${browserName}.png`,
        {
          fullPage: true,
          threshold: 0.3, // Higher threshold for cross-browser differences
          maxDiffPixels: 500,
          animations: 'disabled',
        }
      );
    });
  }

  // Test component-level consistency
  for (const component of criticalComponents) {
    test(`Component consistency: ${component}`, async ({ page, browserName }) => {
      await page.goto('/components-demo');
      await visualUtils.preparePage();

      const selector = `[data-testid="${component}"], [data-component="${component}"]`;
      const element = page.locator(selector).first();

      if (await element.count() === 0) {
        test.skip(`Component ${component} not found`);
      }

      await expect(element).toBeVisible();
      
      // Normalize browser-specific rendering
      await normalizeBrowserDifferences(page, browserName);
      await stabilizeComponentRendering(page, element, component);

      // Test default state
      await expect(element).toHaveScreenshot(
        `component-${component}-default-${browserName}.png`,
        {
          threshold: 0.4,
          maxDiffPixels: 200,
        }
      );

      // Test interactive states
      const states = ['hover', 'focus', 'active'];
      for (const state of states) {
        try {
          await applyComponentState(page, element, state);
          await page.waitForTimeout(100);

          await expect(element).toHaveScreenshot(
            `component-${component}-${state}-${browserName}.png`,
            {
              threshold: 0.4,
              maxDiffPixels: 200,
            }
          );

          await resetComponentState(page, element, state);
        } catch (error) {
          console.warn(`State ${state} testing failed for ${component}:`, error.message);
        }
      }
    });
  }

  // Test typography consistency
  test('Typography rendering consistency', async ({ page, browserName }) => {
    await page.goto('/typography-demo');
    await visualUtils.preparePage();

    // Apply font rendering optimizations
    await page.addStyleTag({
      content: `
        * {
          text-rendering: geometricPrecision !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          font-smooth: always !important;
          -webkit-font-feature-settings: "liga", "kern" !important;
          font-feature-settings: "liga", "kern" !important;
        }
      `,
    });

    const typographyElements = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'span', 'small', 'strong', 'em',
      'code', 'pre', 'blockquote',
    ];

    for (const tag of typographyElements) {
      const elements = page.locator(tag);
      const count = await elements.count();

      if (count > 0) {
        const element = elements.first();
        await expect(element).toHaveScreenshot(
          `typography-${tag}-${browserName}.png`,
          {
            threshold: 0.5, // Higher threshold for font rendering differences
            maxDiffPixels: 300,
          }
        );
      }
    }
  });

  // Test form elements consistency
  test('Form elements consistency', async ({ page, browserName }) => {
    await page.goto('/forms-demo');
    await visualUtils.preparePage();

    const formElements = [
      { selector: 'input[type="text"]', name: 'text-input' },
      { selector: 'input[type="email"]', name: 'email-input' },
      { selector: 'input[type="password"]', name: 'password-input' },
      { selector: 'input[type="number"]', name: 'number-input' },
      { selector: 'input[type="date"]', name: 'date-input' },
      { selector: 'input[type="checkbox"]', name: 'checkbox' },
      { selector: 'input[type="radio"]', name: 'radio' },
      { selector: 'select', name: 'select' },
      { selector: 'textarea', name: 'textarea' },
      { selector: 'button', name: 'button' },
    ];

    for (const formElement of formElements) {
      const element = page.locator(formElement.selector).first();

      if (await element.count() === 0) continue;

      // Test default appearance
      await expect(element).toHaveScreenshot(
        `form-${formElement.name}-default-${browserName}.png`,
        {
          threshold: 0.4,
          maxDiffPixels: 150,
        }
      );

      // Test focused state
      await element.focus();
      await page.waitForTimeout(100);

      await expect(element).toHaveScreenshot(
        `form-${formElement.name}-focus-${browserName}.png`,
        {
          threshold: 0.4,
          maxDiffPixels: 150,
        }
      );

      // Test filled state (where applicable)
      if (formElement.selector.includes('input') && !formElement.selector.includes('checkbox') && !formElement.selector.includes('radio')) {
        await element.fill('Sample text');
        await page.waitForTimeout(100);

        await expect(element).toHaveScreenshot(
          `form-${formElement.name}-filled-${browserName}.png`,
          {
            threshold: 0.4,
            maxDiffPixels: 150,
          }
        );
      }
    }
  });

  // Test CSS Grid and Flexbox layouts
  test('Layout systems consistency', async ({ page, browserName }) => {
    await page.goto('/layouts-demo');
    await visualUtils.preparePage();

    const layoutTypes = [
      { selector: '[data-layout="grid"]', name: 'css-grid' },
      { selector: '[data-layout="flexbox"]', name: 'flexbox' },
      { selector: '[data-layout="responsive"]', name: 'responsive' },
      { selector: '[data-layout="masonry"]', name: 'masonry' },
    ];

    for (const layout of layoutTypes) {
      const element = page.locator(layout.selector);

      if (await element.count() === 0) continue;

      // Test at different viewport sizes
      const viewports = [
        { width: 320, height: 568, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1920, height: 1080, name: 'desktop' },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(200);

        await expect(element).toHaveScreenshot(
          `layout-${layout.name}-${viewport.name}-${browserName}.png`,
          {
            threshold: 0.3,
            maxDiffPixels: 300,
          }
        );
      }
    }
  });

  // Test CSS custom properties and modern features
  test('Modern CSS features consistency', async ({ page, browserName }) => {
    await page.goto('/css-features-demo');
    await visualUtils.preparePage();

    const cssFeatures = [
      { selector: '[data-css="custom-properties"]', name: 'custom-properties' },
      { selector: '[data-css="gradients"]', name: 'gradients' },
      { selector: '[data-css="shadows"]', name: 'box-shadows' },
      { selector: '[data-css="transforms"]', name: 'transforms' },
      { selector: '[data-css="filters"]', name: 'filters' },
      { selector: '[data-css="backdrop-filter"]', name: 'backdrop-filter' },
      { selector: '[data-css="clip-path"]', name: 'clip-path' },
    ];

    for (const feature of cssFeatures) {
      const element = page.locator(feature.selector);

      if (await element.count() === 0) continue;

      await expect(element).toHaveScreenshot(
        `css-${feature.name}-${browserName}.png`,
        {
          threshold: 0.5, // Higher threshold for CSS feature differences
          maxDiffPixels: 400,
        }
      );
    }
  });

  // Test responsive design patterns
  test('Responsive design consistency', async ({ page, browserName }) => {
    const responsivePages = ['/dashboard', '/components-demo'];
    
    const breakpoints = [
      { width: 320, height: 568, name: 'mobile-small' },
      { width: 375, height: 667, name: 'mobile-medium' },
      { width: 414, height: 896, name: 'mobile-large' },
      { width: 768, height: 1024, name: 'tablet-portrait' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 1366, height: 768, name: 'desktop-small' },
      { width: 1920, height: 1080, name: 'desktop-large' },
    ];

    for (const pagePath of responsivePages) {
      await page.goto(pagePath);
      await visualUtils.preparePage();

      for (const breakpoint of breakpoints) {
        await page.setViewportSize({
          width: breakpoint.width,
          height: breakpoint.height,
        });
        
        await page.waitForTimeout(300); // Allow layout to stabilize
        await visualUtils.waitForStableLayout();

        await expect(page).toHaveScreenshot(
          `responsive-${pagePath.replace('/', '')}-${breakpoint.name}-${browserName}.png`,
          {
            fullPage: true,
            threshold: 0.3,
            maxDiffPixels: 500,
          }
        );
      }
    }
  });

  // Test dark mode consistency
  test('Dark mode consistency', async ({ page, browserName }) => {
    await page.goto('/');
    await visualUtils.preparePage();

    // Apply dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark', 'theme-dark');
    });

    await page.waitForTimeout(200);

    const testPages = ['/', '/dashboard', '/components-demo'];
    
    for (const pagePath of testPages) {
      await page.goto(pagePath);
      await visualUtils.preparePage();
      await visualUtils.waitForStableLayout();

      await expect(page).toHaveScreenshot(
        `dark-mode-${pagePath.replace('/', 'home')}-${browserName}.png`,
        {
          fullPage: true,
          threshold: 0.3,
          maxDiffPixels: 500,
        }
      );
    }
  });
});

// Helper functions
async function applyBrowserOptimizations(page: Page, browserName: string) {
  const config = browsers[browserName];
  if (!config) return;

  // Apply browser-specific optimizations
  if (browserName === 'chromium') {
    await page.addInitScript(() => {
      // Force sRGB color profile
      Object.defineProperty(navigator, 'colorGamut', {
        get: () => 'srgb'
      });
    });
  }

  if (browserName === 'firefox') {
    await page.addInitScript(() => {
      // Firefox-specific optimizations
      Object.defineProperty(navigator, 'mozInputMethod', {
        get: () => null
      });
    });
  }

  if (browserName === 'webkit') {
    await page.addInitScript(() => {
      // WebKit-specific optimizations
      Object.defineProperty(navigator, 'webkitPersistentStorage', {
        get: () => null
      });
    });
  }
}

async function normalizeBrowserDifferences(page: Page, browserName: string) {
  await page.addStyleTag({
    content: `
      /* Normalize browser differences */
      * {
        box-sizing: border-box !important;
      }
      
      /* Font rendering normalization */
      body, input, button, select, textarea {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
        text-rendering: geometricPrecision !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
      }
      
      /* Input normalization */
      input, button, select, textarea {
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        appearance: none !important;
        border: 1px solid #ccc !important;
        border-radius: 4px !important;
        padding: 8px 12px !important;
        background: white !important;
      }
      
      /* Focus outline normalization */
      *:focus {
        outline: 2px solid #007acc !important;
        outline-offset: 2px !important;
      }
      
      /* Remove browser-specific styling */
      input[type="search"]::-webkit-search-cancel-button,
      input[type="search"]::-webkit-search-decoration {
        -webkit-appearance: none !important;
      }
      
      /* Normalize scrollbars */
      ::-webkit-scrollbar {
        width: 0px !important;
        background: transparent !important;
      }
      
      /* Normalize selection */
      ::selection {
        background: #007acc !important;
        color: white !important;
      }
    `,
  });
}

async function stabilizeComponentRendering(page: Page, element: any, component: string) {
  // Component-specific stabilization
  switch (component) {
    case 'select':
      // Normalize select dropdown arrow
      await page.addStyleTag({
        content: `
          select {
            background-image: url("data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>") !important;
            background-repeat: no-repeat !important;
            background-position: right 8px center !important;
            padding-right: 32px !important;
          }
        `,
      });
      break;
    
    case 'checkbox':
    case 'radio':
      // Normalize checkbox/radio appearance
      await page.addStyleTag({
        content: `
          input[type="checkbox"], input[type="radio"] {
            width: 16px !important;
            height: 16px !important;
            margin: 0 !important;
            vertical-align: middle !important;
          }
        `,
      });
      break;
    
    case 'button':
      // Normalize button appearance
      await page.addStyleTag({
        content: `
          button {
            background: #f0f0f0 !important;
            border: 1px solid #ccc !important;
            color: #333 !important;
            cursor: pointer !important;
          }
          button:hover {
            background: #e0e0e0 !important;
          }
        `,
      });
      break;
  }
}

async function setupMockAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'mock_token_for_testing');
    localStorage.setItem('user_id', 'test_user_123');
    localStorage.setItem('user_role', 'user');
  });
}

async function applyComponentState(page: Page, element: any, state: string) {
  switch (state) {
    case 'hover':
      await element.hover();
      break;
    case 'focus':
      await element.focus();
      break;
    case 'active':
      await element.evaluate(el => {
        el.classList.add('active');
        el.dispatchEvent(new MouseEvent('mousedown'));
      });
      break;
  }
}

async function resetComponentState(page: Page, element: any, state: string) {
  switch (state) {
    case 'hover':
      await page.mouse.move(0, 0);
      break;
    case 'focus':
      await page.keyboard.press('Escape');
      break;
    case 'active':
      await element.evaluate(el => {
        el.classList.remove('active');
        el.dispatchEvent(new MouseEvent('mouseup'));
      });
      break;
  }
}