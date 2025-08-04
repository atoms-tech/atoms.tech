/**
 * Color Contrast Validation Testing
 * 
 * Tests color contrast compliance with WCAG 2.1 AA standards
 * Validates contrast ratios for text, backgrounds, and UI components
 */

import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

interface ColorContrastResult {
  element: string;
  foreground: string;
  background: string;
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  size: 'normal' | 'large';
}

/**
 * Color Contrast Analyzer
 */
class ColorContrastAnalyzer {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  /**
   * Calculate contrast ratio between two colors
   */
  private calculateContrastRatio(color1: string, color2: string): number {
    // Convert colors to RGB
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    // Calculate relative luminance
    const lum1 = this.getRelativeLuminance(rgb1);
    const lum2 = this.getRelativeLuminance(rgb2);
    
    // Calculate contrast ratio
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  /**
   * Parse color string to RGB values
   */
  private parseColor(color: string): { r: number; g: number; b: number } | null {
    // Handle rgb() format
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }
    
    // Handle rgba() format
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
    if (rgbaMatch) {
      return {
        r: parseInt(rgbaMatch[1]),
        g: parseInt(rgbaMatch[2]),
        b: parseInt(rgbaMatch[3])
      };
    }
    
    // Handle hex format
    const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      return {
        r: parseInt(hexMatch[1], 16),
        g: parseInt(hexMatch[2], 16),
        b: parseInt(hexMatch[3], 16)
      };
    }
    
    // Handle short hex format
    const shortHexMatch = color.match(/^#([a-f\d])([a-f\d])([a-f\d])$/i);
    if (shortHexMatch) {
      return {
        r: parseInt(shortHexMatch[1] + shortHexMatch[1], 16),
        g: parseInt(shortHexMatch[2] + shortHexMatch[2], 16),
        b: parseInt(shortHexMatch[3] + shortHexMatch[3], 16)
      };
    }
    
    return null;
  }
  
  /**
   * Calculate relative luminance for a color
   */
  private getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;
    
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  /**
   * Analyze color contrast for all text elements on the page
   */
  async analyzePageContrast(): Promise<ColorContrastResult[]> {
    return await this.page.evaluate(() => {
      const results: ColorContrastResult[] = [];
      
      // Get all text elements
      const textElements = document.querySelectorAll('*');
      
      Array.from(textElements).forEach((element) => {
        const htmlElement = element as HTMLElement;
        
        // Skip elements with no text content
        const textContent = htmlElement.textContent?.trim();
        if (!textContent || textContent.length === 0) return;
        
        // Skip non-visible elements
        const style = window.getComputedStyle(htmlElement);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
        
        const foregroundColor = style.color;
        const backgroundColor = style.backgroundColor;
        
        // If background is transparent, find the effective background
        let effectiveBackground = backgroundColor;
        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
          effectiveBackground = this.getEffectiveBackgroundColor(htmlElement);
        }
        
        // Determine text size
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = style.fontWeight;
        const isLarge = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        
        // Create selector for the element
        let selector = htmlElement.tagName.toLowerCase();
        if (htmlElement.id) {
          selector = `#${htmlElement.id}`;
        } else if (htmlElement.className) {
          selector = `.${htmlElement.className.split(' ').join('.')}`;
        } else if (htmlElement.getAttribute('data-testid')) {
          selector = `[data-testid="${htmlElement.getAttribute('data-testid')}"]`;
        }
        
        // Calculate contrast ratio
        const ratio = this.calculateContrastRatio(foregroundColor, effectiveBackground);
        
        results.push({
          element: selector,
          foreground: foregroundColor,
          background: effectiveBackground,
          ratio: ratio,
          wcagAA: isLarge ? ratio >= 3 : ratio >= 4.5,
          wcagAAA: isLarge ? ratio >= 4.5 : ratio >= 7,
          size: isLarge ? 'large' : 'normal'
        });
      });
      
      return results;
    });
  }
  
  /**
   * Get effective background color by walking up the DOM tree
   */
  private async getEffectiveBackgroundColor(element: Element): Promise<string> {
    return await this.page.evaluate((el) => {
      let currentElement = el as HTMLElement;
      
      while (currentElement && currentElement !== document.body) {
        const style = window.getComputedStyle(currentElement);
        const bgColor = style.backgroundColor;
        
        if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          return bgColor;
        }
        
        currentElement = currentElement.parentElement;
      }
      
      // Default to white background
      return 'rgb(255, 255, 255)';
    }, element);
  }
  
  /**
   * Test specific color combinations
   */
  async testColorCombination(
    foreground: string, 
    background: string, 
    isLarge: boolean = false
  ): Promise<{
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
  }> {
    const ratio = this.calculateContrastRatio(foreground, background);
    
    return {
      ratio,
      wcagAA: isLarge ? ratio >= 3 : ratio >= 4.5,
      wcagAAA: isLarge ? ratio >= 4.5 : ratio >= 7
    };
  }
  
  /**
   * Test focus indicator contrast
   */
  async testFocusIndicatorContrast(): Promise<ColorContrastResult[]> {
    const results: ColorContrastResult[] = [];
    
    // Get all focusable elements
    const focusableElements = await this.page.$$('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    for (const element of focusableElements) {
      // Focus the element
      await element.focus();
      
      // Get focus indicator colors
      const focusColors = await element.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const outlineColor = style.outlineColor;
        const backgroundColor = style.backgroundColor;
        const borderColor = style.borderColor;
        
        return {
          outline: outlineColor,
          background: backgroundColor,
          border: borderColor
        };
      });
      
      // Test outline contrast against background
      if (focusColors.outline && focusColors.outline !== 'rgb(0, 0, 0)') {
        const ratio = this.calculateContrastRatio(focusColors.outline, focusColors.background);
        
        const selector = await element.evaluate(el => {
          if (el.id) return `#${el.id}`;
          if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
          return el.tagName.toLowerCase();
        });
        
        results.push({
          element: `${selector}:focus`,
          foreground: focusColors.outline,
          background: focusColors.background,
          ratio,
          wcagAA: ratio >= 3, // Focus indicators need at least 3:1 contrast
          wcagAAA: ratio >= 4.5,
          size: 'normal'
        });
      }
    }
    
    return results;
  }
  
  /**
   * Test UI component contrast (borders, icons, etc.)
   */
  async testUIComponentContrast(): Promise<ColorContrastResult[]> {
    return await this.page.evaluate(() => {
      const results: ColorContrastResult[] = [];
      
      // Test borders
      const elementsWithBorders = document.querySelectorAll('*');
      
      Array.from(elementsWithBorders).forEach((element) => {
        const htmlElement = element as HTMLElement;
        const style = window.getComputedStyle(htmlElement);
        
        // Skip non-visible elements
        if (style.display === 'none' || style.visibility === 'hidden') return;
        
        const borderColor = style.borderColor;
        const backgroundColor = style.backgroundColor;
        
        if (borderColor && borderColor !== 'rgb(0, 0, 0)' && borderColor !== 'rgba(0, 0, 0, 0)') {
          let effectiveBackground = backgroundColor;
          if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
            effectiveBackground = this.getEffectiveBackgroundColor(htmlElement);
          }
          
          const ratio = this.calculateContrastRatio(borderColor, effectiveBackground);
          
          let selector = htmlElement.tagName.toLowerCase();
          if (htmlElement.id) {
            selector = `#${htmlElement.id}`;
          } else if (htmlElement.className) {
            selector = `.${htmlElement.className.split(' ').join('.')}`;
          }
          
          results.push({
            element: `${selector} (border)`,
            foreground: borderColor,
            background: effectiveBackground,
            ratio,
            wcagAA: ratio >= 3, // UI components need at least 3:1 contrast
            wcagAAA: ratio >= 4.5,
            size: 'normal'
          });
        }
      });
      
      return results;
    });
  }
  
  /**
   * Generate contrast report
   */
  generateContrastReport(results: ColorContrastResult[]): string {
    const failures = results.filter(r => !r.wcagAA);
    const warnings = results.filter(r => r.wcagAA && !r.wcagAAA);
    const passes = results.filter(r => r.wcagAAA);
    
    let report = `\n🎨 Color Contrast Analysis Report\n`;
    report += `=========================================\n\n`;
    
    report += `📊 Summary:\n`;
    report += `• Total Elements Tested: ${results.length}\n`;
    report += `• WCAG AA Failures: ${failures.length}\n`;
    report += `• WCAG AAA Warnings: ${warnings.length}\n`;
    report += `• Perfect (AAA) Passes: ${passes.length}\n\n`;
    
    if (failures.length > 0) {
      report += `❌ WCAG AA Failures (Critical):\n`;
      failures.forEach((failure, index) => {
        report += `${index + 1}. ${failure.element}\n`;
        report += `   Ratio: ${failure.ratio.toFixed(2)}:1 (Required: ${failure.size === 'large' ? '3:1' : '4.5:1'})\n`;
        report += `   Colors: ${failure.foreground} on ${failure.background}\n\n`;
      });
    }
    
    if (warnings.length > 0) {
      report += `⚠️  WCAG AAA Opportunities:\n`;
      warnings.slice(0, 5).forEach((warning, index) => {
        report += `${index + 1}. ${warning.element}\n`;
        report += `   Ratio: ${warning.ratio.toFixed(2)}:1 (AAA requires: ${warning.size === 'large' ? '4.5:1' : '7:1'})\n`;
      });
      
      if (warnings.length > 5) {
        report += `   ... and ${warnings.length - 5} more\n`;
      }
      report += `\n`;
    }
    
    return report;
  }
}

// Test suites
test.describe('Color Contrast Accessibility', () => {
  let contrastAnalyzer: ColorContrastAnalyzer;
  
  test.beforeEach(async ({ page }) => {
    contrastAnalyzer = new ColorContrastAnalyzer(page);
    await injectAxe(page);
  });
  
  test('should meet WCAG AA color contrast requirements', async ({ page }) => {
    await page.goto('/');
    
    const contrastResults = await contrastAnalyzer.analyzePageContrast();
    
    // Filter for critical failures (WCAG AA)
    const failures = contrastResults.filter(result => !result.wcagAA);
    
    if (failures.length > 0) {
      const report = contrastAnalyzer.generateContrastReport(contrastResults);
      console.log(report);
    }
    
    // All text should meet WCAG AA contrast requirements
    expect(failures.length).toBe(0);
    
    // Run axe color contrast checks
    await checkA11y(page, undefined, {
      includedImpacts: ['serious', 'critical'],
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true }
      }
    });
  });
  
  test('should have sufficient focus indicator contrast', async ({ page }) => {
    await page.goto('/');
    
    const focusResults = await contrastAnalyzer.testFocusIndicatorContrast();
    
    // Filter for failures
    const failures = focusResults.filter(result => !result.wcagAA);
    
    if (failures.length > 0) {
      console.log('Focus indicator contrast failures:', failures);
    }
    
    // All focus indicators should meet contrast requirements
    expect(failures.length).toBe(0);
  });
  
  test('should have sufficient UI component contrast', async ({ page }) => {
    await page.goto('/');
    
    const uiResults = await contrastAnalyzer.testUIComponentContrast();
    
    // Filter for failures
    const failures = uiResults.filter(result => !result.wcagAA);
    
    if (failures.length > 0) {
      console.log('UI component contrast failures:', failures);
    }
    
    // UI components should meet contrast requirements
    expect(failures.length).toBe(0);
  });
  
  test('should handle dark mode color contrast', async ({ page }) => {
    // Set dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    
    const contrastResults = await contrastAnalyzer.analyzePageContrast();
    const failures = contrastResults.filter(result => !result.wcagAA);
    
    if (failures.length > 0) {
      const report = contrastAnalyzer.generateContrastReport(contrastResults);
      console.log('Dark mode contrast report:', report);
    }
    
    expect(failures.length).toBe(0);
  });
  
  test('should test specific color combinations', async ({ page }) => {
    await page.goto('/');
    
    // Test common color combinations used in the design system
    const colorTests = [
      { fg: '#000000', bg: '#ffffff', name: 'Black on White' },
      { fg: '#ffffff', bg: '#000000', name: 'White on Black' },
      { fg: '#007acc', bg: '#ffffff', name: 'Primary Blue on White' },
      { fg: '#ffffff', bg: '#007acc', name: 'White on Primary Blue' },
      { fg: '#666666', bg: '#ffffff', name: 'Gray Text on White' },
      { fg: '#ff0000', bg: '#ffffff', name: 'Red Error on White' }
    ];
    
    for (const colorTest of colorTests) {
      const result = await contrastAnalyzer.testColorCombination(
        colorTest.fg, 
        colorTest.bg
      );
      
      console.log(`${colorTest.name}: ${result.ratio.toFixed(2)}:1 - ${result.wcagAA ? 'PASS' : 'FAIL'}`);
      
      // All predefined color combinations should meet WCAG AA
      expect(result.wcagAA).toBe(true);
    }
  });
  
  test('should validate form error states contrast', async ({ page }) => {
    await page.goto('/signup');
    
    // Trigger form validation errors
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      
      // Wait for error states to appear
      await page.waitForTimeout(1000);
      
      // Analyze contrast of error states
      const errorElements = await page.$$('.error, [aria-invalid="true"], .invalid');
      
      for (const errorElement of errorElements) {
        const colors = await errorElement.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor,
            borderColor: style.borderColor
          };
        });
        
        // Test text color contrast
        if (colors.color && colors.backgroundColor) {
          const result = await contrastAnalyzer.testColorCombination(
            colors.color,
            colors.backgroundColor
          );
          expect(result.wcagAA).toBe(true);
        }
        
        // Test border color contrast
        if (colors.borderColor && colors.backgroundColor) {
          const result = await contrastAnalyzer.testColorCombination(
            colors.borderColor,
            colors.backgroundColor
          );
          expect(result.wcagAA).toBe(true);
        }
      }
    }
  });
  
  test('should validate high contrast mode compatibility', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            background: white !important;
            color: black !important;
            border-color: black !important;
          }
        }
      `
    });
    
    await page.goto('/');
    
    const contrastResults = await contrastAnalyzer.analyzePageContrast();
    const failures = contrastResults.filter(result => !result.wcagAA);
    
    // In high contrast mode, everything should pass
    expect(failures.length).toBe(0);
  });
});

export { ColorContrastAnalyzer };