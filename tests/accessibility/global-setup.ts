/**
 * Global Setup for Accessibility Testing
 * 
 * Sets up accessibility testing environment with axe-core integration
 */

import { chromium, FullConfig } from '@playwright/test';
import { injectAxe, getViolations, checkA11y } from 'axe-playwright';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up accessibility testing environment...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Verify application is running
    const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3000';
    console.log(`📡 Checking application availability at ${baseURL}`);
    
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    
    // Inject axe-core for accessibility testing
    console.log('⚡ Injecting axe-core accessibility testing library...');
    await injectAxe(page);
    
    // Verify axe-core is working
    const axeVersion = await page.evaluate(() => {
      return (window as any).axe?.version;
    });
    
    if (axeVersion) {
      console.log(`✅ axe-core v${axeVersion} injected successfully`);
    } else {
      throw new Error('Failed to inject axe-core');
    }
    
    // Create accessibility baseline configuration
    console.log('📋 Creating accessibility test configuration...');
    
    const accessibilityConfig = {
      wcagLevel: 'AA',
      wcagVersion: '2.1',
      includeRules: [
        // WCAG 2.1 AA rules
        'color-contrast',
        'keyboard',
        'aria-allowed-attr',
        'aria-command-name',
        'aria-hidden-body',
        'aria-hidden-focus',
        'aria-input-field-name',
        'aria-label',
        'aria-labelledby',
        'aria-required-attr',
        'aria-required-children',
        'aria-required-parent',
        'aria-roles',
        'aria-toggle-field-name',
        'aria-valid-attr',
        'aria-valid-attr-value',
        'button-name',
        'form-field-multiple-labels',
        'heading-order',
        'image-alt',
        'image-redundant-alt',
        'label',
        'landmark-one-main',
        'landmark-complementary-is-top-level',
        'landmark-no-duplicate-banner',
        'landmark-no-duplicate-contentinfo',
        'landmark-unique',
        'link-name',
        'link-in-text-block',
        'page-has-heading-one',
        'region',
        'table-fake-caption',
        'td-headers-attr',
        'th-has-data-cells',
        'duplicate-id',
        'duplicate-id-active',
        'duplicate-id-aria',
        'html-has-lang',
        'html-lang-valid',
        'lang-valid',
        'meta-refresh',
        'meta-viewport',
        'valid-lang'
      ],
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
      disableRules: [], // No rules disabled for comprehensive testing
      options: {
        // Color contrast options
        colorContrastEnhanced: true,
        contrastRatio: {
          normal: 4.5,
          large: 3.0
        },
        // Performance options
        timeout: 30000,
        maxDepth: 10
      }
    };
    
    // Store configuration for tests
    await page.evaluate((config) => {
      (window as any).accessibilityTestConfig = config;
    }, accessibilityConfig);
    
    // Test basic functionality
    console.log('🧪 Running basic accessibility validation...');
    
    try {
      await checkA11y(page, null, {
        axeOptions: {
          tags: ['wcag2aa'],
          timeout: 10000
        },
        detailedReport: true,
        detailedReportOptions: { html: true },
        verbose: false
      });
      console.log('✅ Basic accessibility validation passed');
    } catch (error) {
      console.warn('⚠️  Basic accessibility validation found issues:', error);
      // Don't fail setup, but log the issues
    }
    
    // Set up accessibility testing utilities
    await page.addInitScript(() => {
      // Global accessibility test helpers
      (window as any).accessibilityHelpers = {
        // Focus management
        focusElement: (selector: string) => {
          const element = document.querySelector(selector);
          if (element && 'focus' in element) {
            (element as HTMLElement).focus();
          }
        },
        
        // ARIA utilities
        updateAriaLabel: (selector: string, label: string) => {
          const element = document.querySelector(selector);
          if (element) {
            element.setAttribute('aria-label', label);
          }
        },
        
        // Keyboard simulation
        simulateKeyboard: (selector: string, key: string) => {
          const element = document.querySelector(selector);
          if (element) {
            element.dispatchEvent(new KeyboardEvent('keydown', { key }));
            element.dispatchEvent(new KeyboardEvent('keyup', { key }));
          }
        },
        
        // High contrast simulation
        enableHighContrast: () => {
          document.documentElement.classList.add('high-contrast');
          document.documentElement.style.filter = 'contrast(150%)';
        },
        
        disableHighContrast: () => {
          document.documentElement.classList.remove('high-contrast');
          document.documentElement.style.filter = '';
        },
        
        // Reduced motion simulation
        enableReducedMotion: () => {
          document.documentElement.classList.add('reduced-motion');
          const style = document.createElement('style');
          style.textContent = `
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          `;
          document.head.appendChild(style);
          (style as any)._id = 'reduced-motion-style';
        },
        
        disableReducedMotion: () => {
          document.documentElement.classList.remove('reduced-motion');
          const style = document.querySelector('#reduced-motion-style');
          if (style) {
            style.remove();
          }
        },
        
        // Text scaling
        setTextScale: (scale: number) => {
          document.documentElement.style.fontSize = `${16 * scale}px`;
        },
        
        resetTextScale: () => {
          document.documentElement.style.fontSize = '';
        }
      };
    });
    
    console.log('🎯 Accessibility testing environment setup complete');
    
  } catch (error) {
    console.error('❌ Failed to set up accessibility testing environment:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;