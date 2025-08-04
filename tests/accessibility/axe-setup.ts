/**
 * Axe-core Setup for Comprehensive Accessibility Testing
 * 
 * Centralized configuration for axe-core accessibility testing
 * Supports WCAG 2.1 AA compliance with custom rules and configurations
 */

import { AxePuppeteer } from '@axe-core/puppeteer';
import { AxeResults, Result, RunOptions } from 'axe-core';

/**
 * WCAG 2.1 AA Configuration for axe-core
 */
export const WCAG_AA_CONFIG: RunOptions = {
  // WCAG 2.1 AA compliance rules
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
  
  // Include all rule types
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21aa']
  },
  
  // Comprehensive rule configuration
  rules: {
    // Color contrast (WCAG 2.1 AA requirement)
    'color-contrast': { enabled: true },
    'color-contrast-enhanced': { enabled: true },
    
    // Keyboard accessibility
    'focus-order-semantics': { enabled: true },
    'keyboard': { enabled: true },
    'no-focusable-content': { enabled: true },
    'tabindex': { enabled: true },
    
    // ARIA requirements
    'aria-allowed-attr': { enabled: true },
    'aria-command-name': { enabled: true },
    'aria-hidden-body': { enabled: true },
    'aria-hidden-focus': { enabled: true },
    'aria-input-field-name': { enabled: true },
    'aria-label': { enabled: true },
    'aria-labelledby': { enabled: true },
    'aria-meter-name': { enabled: true },
    'aria-progressbar-name': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-required-children': { enabled: true },
    'aria-required-parent': { enabled: true },
    'aria-roles': { enabled: true },
    'aria-toggle-field-name': { enabled: true },
    'aria-tooltip-name': { enabled: true },
    'aria-treeitem-name': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    
    // Form accessibility
    'form-field-multiple-labels': { enabled: true },
    'label': { enabled: true },
    'label-title-only': { enabled: true },
    
    // Image accessibility
    'image-alt': { enabled: true },
    'image-redundant-alt': { enabled: true },
    'input-image-alt': { enabled: true },
    'object-alt': { enabled: true },
    'role-img-alt': { enabled: true },
    'svg-img-alt': { enabled: true },
    
    // Navigation and structure
    'bypass': { enabled: true },
    'heading-order': { enabled: true },
    'landmark-banner-is-top-level': { enabled: true },
    'landmark-contentinfo-is-top-level': { enabled: true },
    'landmark-main-is-top-level': { enabled: true },
    'landmark-no-duplicate-banner': { enabled: true },
    'landmark-no-duplicate-contentinfo': { enabled: true },
    'landmark-no-duplicate-main': { enabled: true },
    'landmark-one-main': { enabled: true },
    'landmark-unique': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true },
    'skip-link': { enabled: true },
    
    // Links and buttons
    'button-name': { enabled: true },
    'link-in-text-block': { enabled: true },
    'link-name': { enabled: true },
    
    // Lists and tables
    'definition-list': { enabled: true },
    'dlitem': { enabled: true },
    'list': { enabled: true },
    'listitem': { enabled: true },
    'table-duplicate-name': { enabled: true },
    'table-fake-caption': { enabled: true },
    'td-has-header': { enabled: true },
    'td-headers-attr': { enabled: true },
    'th-has-data-cells': { enabled: true },
    
    // HTML structure and semantics
    'document-title': { enabled: true },
    'duplicate-id': { enabled: true },
    'duplicate-id-active': { enabled: true },
    'duplicate-id-aria': { enabled: true },
    'frame-title': { enabled: true },
    'html-has-lang': { enabled: true },
    'html-lang-valid': { enabled: true },
    'html-xml-lang-mismatch': { enabled: true },
    'valid-lang': { enabled: true },
    
    // Video and media
    'video-caption': { enabled: true },
    'audio-caption': { enabled: true },
    
    // Mobile and responsive
    'meta-viewport': { enabled: true },
    'meta-viewport-large': { enabled: true },
    
    // Custom application-specific rules
    'autocomplete-valid': { enabled: true },
    'avoid-inline-spacing': { enabled: true }
  },
  
  // Element selection for testing
  include: [['html']],
  exclude: [
    // Exclude third-party widgets that we can't control
    ['[data-testid="external-widget"]'],
    ['iframe[src*="youtube.com"]'],
    ['iframe[src*="vimeo.com"]'],
    // Exclude development-only elements
    ['[data-reactroot]'],
    ['#__next-dev-client-indicator__']
  ],
  
  // Reporting configuration
  reporter: 'v2',
  resultTypes: ['violations', 'incomplete', 'passes'],
  
  // Performance optimization
  performanceTimer: true,
  
  // Context-specific settings
  allowedOrigins: ['<same_origin>'],
  
  // Experimental features
  experimentalFeatures: {
    // Enable color contrast improvements
    colorContrastEnhanced: true
  }
};

/**
 * Screen Reader Simulation Configuration
 */
export const SCREEN_READER_CONFIG: RunOptions = {
  ...WCAG_AA_CONFIG,
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'ACT'],
  rules: {
    ...WCAG_AA_CONFIG.rules,
    // Enhanced rules for screen reader testing
    'aria-roledescription': { enabled: true },
    'empty-heading': { enabled: true },
    'heading-order': { enabled: true },
    'landmark-banner-is-top-level': { enabled: true },
    'landmark-contentinfo-is-top-level': { enabled: true },
    'landmark-main-is-top-level': { enabled: true },
    'landmark-no-duplicate-banner': { enabled: true },
    'landmark-no-duplicate-contentinfo': { enabled: true },
    'landmark-no-duplicate-main': { enabled: true },
    'landmark-one-main': { enabled: true },
    'landmark-unique': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true }
  }
};

/**
 * Keyboard Navigation Testing Configuration
 */
export const KEYBOARD_NAV_CONFIG: RunOptions = {
  ...WCAG_AA_CONFIG,
  rules: {
    ...WCAG_AA_CONFIG.rules,
    // Focus on keyboard-specific rules
    'accesskeys': { enabled: true },
    'focus-order-semantics': { enabled: true },
    'keyboard': { enabled: true },
    'no-focusable-content': { enabled: true },
    'tabindex': { enabled: true },
    'bypass': { enabled: true },
    'skip-link': { enabled: true }
  }
};

/**
 * Mobile Accessibility Configuration
 */
export const MOBILE_A11Y_CONFIG: RunOptions = {
  ...WCAG_AA_CONFIG,
  rules: {
    ...WCAG_AA_CONFIG.rules,
    // Mobile-specific accessibility rules
    'meta-viewport': { enabled: true },
    'meta-viewport-large': { enabled: true },
    'target-size': { enabled: true },
    'focus-order-semantics': { enabled: true }
  }
};

/**
 * High Contrast Mode Configuration
 */
export const HIGH_CONTRAST_CONFIG: RunOptions = {
  ...WCAG_AA_CONFIG,
  rules: {
    ...WCAG_AA_CONFIG.rules,
    // Enhanced color contrast rules
    'color-contrast': { enabled: true },
    'color-contrast-enhanced': { enabled: true },
    'link-in-text-block': { enabled: true }
  }
};

/**
 * Accessibility Test Helper Class
 */
export class AccessibilityTester {
  private config: RunOptions;
  
  constructor(config: RunOptions = WCAG_AA_CONFIG) {
    this.config = config;
  }
  
  /**
   * Run accessibility test on a page with Puppeteer
   */
  async testPage(page: any): Promise<AxeResults> {
    const axe = new AxePuppeteer(page);
    
    // Configure axe with our settings
    await axe.configure(this.config);
    
    // Run the accessibility analysis
    const results = await axe.analyze();
    
    return results;
  }
  
  /**
   * Filter results by severity
   */
  filterBySeverity(results: AxeResults, severity: 'minor' | 'moderate' | 'serious' | 'critical'): Result[] {
    return results.violations.filter(violation => 
      violation.impact === severity
    );
  }
  
  /**
   * Get summary of accessibility issues
   */
  getSummary(results: AxeResults): {
    totalViolations: number;
    criticalCount: number;
    seriousCount: number;
    moderateCount: number;
    minorCount: number;
    passedRules: number;
    incompleteRules: number;
  } {
    const violations = results.violations;
    
    return {
      totalViolations: violations.length,
      criticalCount: violations.filter(v => v.impact === 'critical').length,
      seriousCount: violations.filter(v => v.impact === 'serious').length,
      moderateCount: violations.filter(v => v.impact === 'moderate').length,
      minorCount: violations.filter(v => v.impact === 'minor').length,
      passedRules: results.passes.length,
      incompleteRules: results.incomplete.length
    };
  }
  
  /**
   * Generate detailed report
   */
  generateReport(results: AxeResults): string {
    const summary = this.getSummary(results);
    
    let report = `\n🔍 Accessibility Test Report\n`;
    report += `================================\n\n`;
    
    // Summary
    report += `📊 Summary:\n`;
    report += `• Total Violations: ${summary.totalViolations}\n`;
    report += `• Critical: ${summary.criticalCount}\n`;
    report += `• Serious: ${summary.seriousCount}\n`;
    report += `• Moderate: ${summary.moderateCount}\n`;
    report += `• Minor: ${summary.minorCount}\n`;
    report += `• Passed Rules: ${summary.passedRules}\n`;
    report += `• Incomplete: ${summary.incompleteRules}\n\n`;
    
    // Violations details
    if (results.violations.length > 0) {
      report += `❌ Violations:\n`;
      results.violations.forEach((violation, index) => {
        report += `${index + 1}. ${violation.id} (${violation.impact})\n`;
        report += `   Description: ${violation.description}\n`;
        report += `   Help: ${violation.help}\n`;
        report += `   Help URL: ${violation.helpUrl}\n`;
        report += `   Nodes affected: ${violation.nodes.length}\n\n`;
      });
    }
    
    return report;
  }
  
  /**
   * Check if results meet WCAG AA compliance
   */
  isWCAGAACompliant(results: AxeResults): boolean {
    const criticalViolations = this.filterBySeverity(results, 'critical');
    const seriousViolations = this.filterBySeverity(results, 'serious');
    
    // For WCAG AA compliance, we require:
    // - No critical violations
    // - No serious violations
    return criticalViolations.length === 0 && seriousViolations.length === 0;
  }
}

/**
 * Custom axe rules for application-specific accessibility requirements
 */
export const CUSTOM_RULES = [
  {
    id: 'atoms-tech-custom-focus',
    impact: 'serious',
    selector: '[data-focus-managed]',
    any: [{
      id: 'atoms-tech-focus-check',
      evaluate: function(node: any) {
        // Custom focus management validation
        const hasFocusManagement = node.hasAttribute('data-focus-managed');
        const hasTabIndex = node.hasAttribute('tabindex');
        return hasFocusManagement && (hasTabIndex || node.tabIndex >= 0);
      }
    }],
    tags: ['custom', 'atoms-tech']
  },
  {
    id: 'atoms-tech-keyboard-shortcuts',
    impact: 'moderate',
    selector: '[data-keyboard-shortcut]',
    any: [{
      id: 'atoms-tech-shortcut-check',
      evaluate: function(node: any) {
        // Ensure keyboard shortcuts are properly documented
        const hasShortcut = node.hasAttribute('data-keyboard-shortcut');
        const hasAriaLabel = node.hasAttribute('aria-label') || 
                           node.hasAttribute('aria-labelledby') ||
                           node.hasAttribute('title');
        return hasShortcut && hasAriaLabel;
      }
    }],
    tags: ['custom', 'atoms-tech', 'keyboard']
  }
];

/**
 * Initialize custom axe rules
 */
export function initializeCustomRules(): void {
  if (typeof window !== 'undefined' && (window as any).axe) {
    CUSTOM_RULES.forEach(rule => {
      (window as any).axe.configure({
        rules: [{
          id: rule.id,
          enabled: true
        }]
      });
    });
  }
}

export default AccessibilityTester;