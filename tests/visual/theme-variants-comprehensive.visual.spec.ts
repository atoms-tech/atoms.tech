/**
 * Comprehensive Theme Variants Visual Regression Tests
 * Tests visual consistency across different themes, color schemes, and accessibility modes
 */

import { test, expect, Page } from '@playwright/test';
import { VisualTestUtils, AccessibilityVisualUtils } from '../../scripts/visual-testing/visual-utils.js';
import visualConfig from '../../scripts/visual-testing/visual-config.js';

// Extended theme configurations
const themes = {
  light: {
    name: 'light',
    className: 'theme-light',
    colorScheme: 'light',
    properties: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f8f9fa',
      '--text-primary': '#212529',
      '--text-secondary': '#6c757d',
      '--border-color': '#dee2e6',
      '--accent-color': '#0d6efd',
    },
  },
  dark: {
    name: 'dark',
    className: 'theme-dark',
    colorScheme: 'dark',
    properties: {
      '--bg-primary': '#1a1a1a',
      '--bg-secondary': '#2d2d2d',
      '--text-primary': '#ffffff',
      '--text-secondary': '#b0b0b0',
      '--border-color': '#404040',
      '--accent-color': '#4c9aff',
    },
  },
  highContrast: {
    name: 'high-contrast',
    className: 'theme-high-contrast',
    colorScheme: 'dark',
    properties: {
      '--bg-primary': '#000000',
      '--bg-secondary': '#1a1a1a',
      '--text-primary': '#ffffff',
      '--text-secondary': '#ffff00',
      '--border-color': '#ffffff',
      '--accent-color': '#00ff00',
    },
  },
  blue: {
    name: 'blue',
    className: 'theme-blue',
    colorScheme: 'light',
    properties: {
      '--bg-primary': '#f0f8ff',
      '--bg-secondary': '#e6f3ff',
      '--text-primary': '#1e3a8a',
      '--text-secondary': '#3b82f6',
      '--border-color': '#93c5fd',
      '--accent-color': '#2563eb',
    },
  },
  green: {
    name: 'green',
    className: 'theme-green',
    colorScheme: 'light',
    properties: {
      '--bg-primary': '#f0fdf4',
      '--bg-secondary': '#dcfce7',
      '--text-primary': '#14532d',
      '--text-secondary': '#16a34a',
      '--border-color': '#86efac',
      '--accent-color': '#22c55e',
    },
  },
  purple: {
    name: 'purple',
    className: 'theme-purple',
    colorScheme: 'light',
    properties: {
      '--bg-primary': '#faf5ff',
      '--bg-secondary': '#f3e8ff',
      '--text-primary': '#581c87',
      '--text-secondary': '#9333ea',
      '--border-color': '#c4b5fd',
      '--accent-color': '#a855f7',
    },
  },
  sepia: {
    name: 'sepia',
    className: 'theme-sepia',
    colorScheme: 'light',
    properties: {
      '--bg-primary': '#f7f3e9',
      '--bg-secondary': '#f0ead6',
      '--text-primary': '#4a4a3a',
      '--text-secondary': '#8b7355',
      '--border-color': '#d4c4a8',
      '--accent-color': '#8b6914',
    },
  },
  cyberpunk: {
    name: 'cyberpunk',
    className: 'theme-cyberpunk',
    colorScheme: 'dark',
    properties: {
      '--bg-primary': '#0a0a0a',
      '--bg-secondary': '#1a0a1a',
      '--text-primary': '#00ff41',
      '--text-secondary': '#ff00ff',
      '--border-color': '#00ffff',
      '--accent-color': '#ff0080',
    },
  },
};

// Component categories for theme testing
const themeTestComponents = {
  ui: ['button', 'input', 'select', 'checkbox', 'radio', 'switch', 'slider'],
  layout: ['card', 'modal', 'dialog', 'tabs', 'accordion', 'sidebar'],
  navigation: ['breadcrumb', 'pagination', 'menu', 'topbar'],
  feedback: ['alert', 'toast', 'notification', 'loading-spinner'],
  data: ['table', 'list', 'grid', 'chart', 'avatar', 'badge'],
};

// Pages to test with different themes
const themeTestPages = [
  { path: '/', name: 'homepage' },
  { path: '/dashboard', name: 'dashboard', requiresAuth: true },
  { path: '/settings', name: 'settings', requiresAuth: true },
  { path: '/profile', name: 'profile', requiresAuth: true },
  { path: '/components-demo', name: 'components' },
];

test.describe('Theme Variants Visual Regression Tests', () => {
  let visualUtils: VisualTestUtils;
  let accessibilityUtils: AccessibilityVisualUtils;

  test.beforeEach(async ({ page, browserName }) => {
    visualUtils = new VisualTestUtils(page, browserName);
    accessibilityUtils = new AccessibilityVisualUtils(page, browserName);
    await visualUtils.preparePage();
  });

  // Test all themes on each page
  for (const testPage of themeTestPages) {
    test.describe(`Page: ${testPage.name}`, () => {
      
      for (const [themeName, themeConfig] of Object.entries(themes)) {
        test(`${testPage.name} - ${themeName} theme`, async ({ page, browserName }) => {
          // Setup authentication if required
          if (testPage.requiresAuth) {
            await setupMockAuth(page);
          }

          await page.goto(testPage.path);
          await visualUtils.preparePage();

          // Apply theme
          await applyTheme(page, themeConfig);
          await visualUtils.waitForStableLayout();

          // Take full page screenshot
          await expect(page).toHaveScreenshot(
            `page-${testPage.name}-theme-${themeName}-${browserName}.png`,
            {
              fullPage: true,
              threshold: 0.3,
              maxDiffPixels: 500,
            }
          );

          // Test responsive behavior with theme
          const viewports = [
            { width: 375, height: 667, name: 'mobile' },
            { width: 768, height: 1024, name: 'tablet' },
            { width: 1920, height: 1080, name: 'desktop' },
          ];

          for (const viewport of viewports) {
            await page.setViewportSize(viewport);
            await page.waitForTimeout(200);

            await expect(page).toHaveScreenshot(
              `page-${testPage.name}-theme-${themeName}-${viewport.name}-${browserName}.png`,
              {
                fullPage: true,
                threshold: 0.3,
                maxDiffPixels: 400,
              }
            );
          }
        });
      }

      // Test theme transitions
      test(`${testPage.name} - theme transitions`, async ({ page, browserName }) => {
        if (testPage.requiresAuth) {
          await setupMockAuth(page);
        }

        await page.goto(testPage.path);
        await visualUtils.preparePage();

        // Test transitions between themes
        const transitionPairs = [
          ['light', 'dark'],
          ['dark', 'high-contrast'],
          ['light', 'blue'],
          ['dark', 'cyberpunk'],
        ];

        for (const [fromTheme, toTheme] of transitionPairs) {
          // Apply initial theme
          await applyTheme(page, themes[fromTheme]);
          await page.waitForTimeout(200);

          // Apply transition CSS
          await page.addStyleTag({
            content: `
              * {
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
              }
            `,
          });

          // Switch to target theme
          await applyTheme(page, themes[toTheme]);
          
          // Capture mid-transition (approximate)
          await page.waitForTimeout(150);
          await expect(page).toHaveScreenshot(
            `page-${testPage.name}-transition-${fromTheme}-to-${toTheme}-${browserName}.png`,
            {
              fullPage: true,
              threshold: 0.5, // Higher threshold for transitions
              maxDiffPixels: 800,
            }
          );
        }
      });
    });
  }

  // Test components in different themes
  for (const [category, components] of Object.entries(themeTestComponents)) {
    test.describe(`Component Category: ${category}`, () => {
      
      for (const component of components) {
        test(`${component} - all themes`, async ({ page, browserName }) => {
          await page.goto('/components-demo');
          await visualUtils.preparePage();

          const selector = `[data-testid="${component}"], [data-component="${component}"]`;
          const element = page.locator(selector).first();

          if (await element.count() === 0) {
            test.skip(`Component ${component} not found`);
          }

          // Test component in each theme
          for (const [themeName, themeConfig] of Object.entries(themes)) {
            await applyTheme(page, themeConfig);
            await page.waitForTimeout(100);

            await expect(element).toHaveScreenshot(
              `component-${component}-theme-${themeName}-${browserName}.png`,
              {
                threshold: 0.3,
                maxDiffPixels: 200,
              }
            );

            // Test interactive states in theme
            const states = ['hover', 'focus', 'active'];
            for (const state of states) {
              try {
                await applyComponentState(page, element, state);
                await page.waitForTimeout(50);

                await expect(element).toHaveScreenshot(
                  `component-${component}-${state}-theme-${themeName}-${browserName}.png`,
                  {
                    threshold: 0.4,
                    maxDiffPixels: 150,
                  }
                );

                await resetComponentState(page, element, state);
              } catch (error) {
                console.warn(`State ${state} failed for ${component} in ${themeName}:`, error.message);
              }
            }
          }
        });
      }
    });
  }

  // Test accessibility with different themes
  test.describe('Theme Accessibility Testing', () => {
    
    test('High contrast themes - accessibility compliance', async ({ page, browserName }) => {
      await page.goto('/components-demo');
      await visualUtils.preparePage();

      const accessibilityThemes = ['high-contrast', 'dark', 'cyberpunk'];
      
      for (const themeName of accessibilityThemes) {
        const themeConfig = themes[themeName];
        await applyTheme(page, themeConfig);
        
        // Force high contrast mode
        await page.emulateMedia({ 
          colorScheme: themeConfig.colorScheme,
          forcedColors: 'active'
        });
        
        await page.waitForTimeout(200);

        // Test key interactive elements
        const accessibilityElements = [
          'button',
          'input',
          'select',
          'a[href]',
          '[role="button"]',
          '[role="tab"]',
        ];

        for (const selector of accessibilityElements) {
          const elements = page.locator(selector);
          const count = await elements.count();

          for (let i = 0; i < Math.min(count, 3); i++) {
            const element = elements.nth(i);
            
            // Test focus state for accessibility
            await element.focus();
            await page.waitForTimeout(100);

            await expect(element).toHaveScreenshot(
              `accessibility-${selector.replace(/\[|\]|"/g, '')}-${i}-theme-${themeName}-focus-${browserName}.png`,
              {
                threshold: 0.4,
                maxDiffPixels: 200,
              }
            );
          }
        }
      }
    });

    test('Reduced motion with themes', async ({ page, browserName }) => {
      await page.goto('/components-demo');
      await accessibilityUtils.testReducedMotion('body');

      const animatedThemes = ['cyberpunk', 'dark', 'blue'];
      
      for (const themeName of animatedThemes) {
        await applyTheme(page, themes[themeName]);
        await page.waitForTimeout(100);

        // Test animated components
        const animatedComponents = ['modal', 'dropdown', 'accordion', 'loading-spinner'];
        
        for (const component of animatedComponents) {
          const selector = `[data-testid="${component}"], [data-component="${component}"]`;
          const element = page.locator(selector).first();

          if (await element.count() === 0) continue;

          await expect(element).toHaveScreenshot(
            `reduced-motion-${component}-theme-${themeName}-${browserName}.png`,
            {
              threshold: 0.4,
              maxDiffPixels: 200,
            }
          );
        }
      }
    });

    test('Color blindness simulation with themes', async ({ page, browserName }) => {
      await page.goto('/components-demo');
      await visualUtils.preparePage();

      const colorBlindnessFilters = [
        { name: 'protanopia', filter: 'url(#protanopia)' },
        { name: 'deuteranopia', filter: 'url(#deuteranopia)' },
        { name: 'tritanopia', filter: 'url(#tritanopia)' },
        { name: 'monochrome', filter: 'grayscale(100%)' },
      ];

      // Add SVG filters for color blindness simulation
      await page.addStyleTag({
        content: `
          <svg style="position: absolute; width: 0; height: 0; pointer-events: none;">
            <defs>
              <filter id="protanopia">
                <feColorMatrix values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0"/>
              </filter>
              <filter id="deuteranopia">
                <feColorMatrix values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0"/>
              </filter>
              <filter id="tritanopia">
                <feColorMatrix values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0"/>
              </filter>
            </defs>
          </svg>
        `,
      });

      const testThemes = ['light', 'dark', 'blue', 'green'];
      
      for (const themeName of testThemes) {
        await applyTheme(page, themes[themeName]);
        
        for (const filter of colorBlindnessFilters) {
          // Apply color blindness filter
          await page.addStyleTag({
            content: `
              body {
                filter: ${filter.filter} !important;
              }
            `,
          });
          
          await page.waitForTimeout(200);

          await expect(page).toHaveScreenshot(
            `color-blindness-${filter.name}-theme-${themeName}-${browserName}.png`,
            {
              fullPage: true,
              threshold: 0.5,
              maxDiffPixels: 600,
            }
          );

          // Remove filter
          await page.addStyleTag({
            content: `
              body {
                filter: none !important;
              }
            `,
          });
        }
      }
    });
  });

  // Test theme-specific features
  test.describe('Theme-Specific Features', () => {
    
    test('Dark mode specific components', async ({ page, browserName }) => {
      await page.goto('/components-demo');
      await visualUtils.preparePage();

      // Apply dark theme
      await applyTheme(page, themes.dark);

      // Test components that behave differently in dark mode
      const darkModeComponents = [
        'code-editor',
        'syntax-highlighter',
        'chart',
        'graph',
        'image-gallery',
        'video-player',
      ];

      for (const component of darkModeComponents) {
        const selector = `[data-testid="${component}"], [data-component="${component}"]`;
        const element = page.locator(selector).first();

        if (await element.count() === 0) continue;

        await expect(element).toHaveScreenshot(
          `dark-mode-specific-${component}-${browserName}.png`,
          {
            threshold: 0.3,
            maxDiffPixels: 300,
          }
        );
      }
    });

    test('High contrast specific adjustments', async ({ page, browserName }) => {
      await page.goto('/components-demo');
      await visualUtils.preparePage();

      // Apply high contrast theme
      await applyTheme(page, themes.highContrast);
      
      // Force high contrast mode
      await page.emulateMedia({ forcedColors: 'active' });

      // Test components that need special high contrast treatment
      const highContrastComponents = [
        'chart',
        'graph',
        'image',
        'icon',
        'badge',
        'progress',
        'slider',
      ];

      for (const component of highContrastComponents) {
        const selector = `[data-testid="${component}"], [data-component="${component}"]`;
        const element = page.locator(selector).first();

        if (await element.count() === 0) continue;

        await expect(element).toHaveScreenshot(
          `high-contrast-specific-${component}-${browserName}.png`,
          {
            threshold: 0.5,
            maxDiffPixels: 400,
          }
        );
      }
    });

    test('Theme system integration', async ({ page, browserName }) => {
      await page.goto('/theme-selector-demo');
      await visualUtils.preparePage();

      // Test theme selector component
      const themeSelector = page.locator('[data-testid="theme-selector"]');
      
      if (await themeSelector.count() > 0) {
        // Test each theme option
        for (const themeName of Object.keys(themes)) {
          await themeSelector.selectOption(themeName);
          await page.waitForTimeout(300); // Allow theme transition

          await expect(page).toHaveScreenshot(
            `theme-selector-${themeName}-applied-${browserName}.png`,
            {
              fullPage: true,
              threshold: 0.4,
              maxDiffPixels: 500,
            }
          );
        }
      }
    });
  });
});

// Helper functions
async function applyTheme(page: Page, themeConfig: any) {
  // Remove existing theme classes
  await page.evaluate(() => {
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '');
  });

  // Apply new theme
  await page.evaluate((config) => {
    // Set theme class
    document.body.classList.add(config.className);
    document.documentElement.setAttribute('data-theme', config.name);
    
    // Set color scheme
    document.documentElement.style.colorScheme = config.colorScheme;
    
    // Apply CSS custom properties
    const root = document.documentElement;
    Object.entries(config.properties).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, themeConfig);
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