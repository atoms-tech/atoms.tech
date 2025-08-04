/**
 * Lighthouse Accessibility Configuration
 * 
 * Specialized Lighthouse configuration for accessibility auditing
 * Focuses on performance, accessibility, and best practices
 */

module.exports = {
  // Lighthouse CI configuration
  ci: {
    collect: {
      // URLs to audit
      url: [
        'http://localhost:3000',
        'http://localhost:3000/signup',
        'http://localhost:3000/home'
      ],
      
      // Chrome settings
      settings: {
        // Focus on accessibility audits
        onlyCategories: ['accessibility', 'best-practices', 'seo'],
        
        // Chrome flags for consistent testing
        chromeFlags: [
          '--headless',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security'
        ],
        
        // Accessibility-specific settings
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1,
          disabled: false
        },
        
        // Throttling settings
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        
        // Accessibility audit configuration
        auditMode: false,
        gatherMode: false,
        
        // Skip certain audits that aren't relevant for accessibility
        skipAudits: [
          'uses-http2',
          'uses-long-cache-ttl',
          'efficient-animated-content',
          'unused-css-rules',
          'unused-javascript',
          'modern-image-formats',
          'uses-optimized-images',
          'uses-text-compression',
          'uses-responsive-images'
        ]
      }
    },
    
    assert: {
      // Accessibility assertions
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        
        // Specific accessibility audit assertions
        'audits:accesskeys': 'error',
        'audits:aria-allowed-attr': 'error',
        'audits:aria-command-name': 'error',
        'audits:aria-hidden-body': 'error',
        'audits:aria-hidden-focus': 'error',
        'audits:aria-input-field-name': 'error',
        'audits:aria-meter-name': 'error',
        'audits:aria-progressbar-name': 'error',
        'audits:aria-required-attr': 'error',
        'audits:aria-required-children': 'error',
        'audits:aria-required-parent': 'error',
        'audits:aria-roles': 'error',
        'audits:aria-toggle-field-name': 'error',
        'audits:aria-tooltip-name': 'error',
        'audits:aria-treeitem-name': 'error',
        'audits:aria-valid-attr-value': 'error',
        'audits:aria-valid-attr': 'error',
        'audits:button-name': 'error',
        'audits:bypass': 'error',
        'audits:color-contrast': 'error',
        'audits:definition-list': 'error',
        'audits:dlitem': 'error',
        'audits:document-title': 'error',
        'audits:duplicate-id-active': 'error',
        'audits:duplicate-id-aria': 'error',
        'audits:form-field-multiple-labels': 'error',
        'audits:frame-title': 'error',
        'audits:heading-order': 'error',
        'audits:html-has-lang': 'error',
        'audits:html-lang-valid': 'error',
        'audits:image-alt': 'error',
        'audits:input-image-alt': 'error',
        'audits:label': 'error',
        'audits:landmark-one-main': 'error',
        'audits:link-name': 'error',
        'audits:list': 'error',
        'audits:listitem': 'error',
        'audits:meta-refresh': 'error',
        'audits:meta-viewport': 'error',
        'audits:object-alt': 'error',
        'audits:tabindex': 'error',
        'audits:td-headers-attr': 'error',
        'audits:th-has-data-cells': 'error',
        'audits:valid-lang': 'error',
        'audits:video-caption': 'error'
      }
    },
    
    upload: {
      // Upload results to Lighthouse CI server (if configured)
      target: 'temporary-public-storage'
    },
    
    server: {
      // Local server configuration for testing
      port: 9001,
      storage: {
        storageMethod: 'filesystem',
        storagePath: './test-results/lighthouse-accessibility'
      }
    }
  },
  
  // Custom Lighthouse configuration
  extends: 'lighthouse:default',
  
  settings: {
    // Focus on accessibility
    onlyCategories: ['accessibility'],
    
    // Disable performance metrics that don't affect accessibility
    skipAudits: [
      'screenshot-thumbnails',
      'final-screenshot',
      'metrics',
      'largest-contentful-paint',
      'first-contentful-paint',
      'speed-index',
      'interactive',
      'first-meaningful-paint',
      'first-cpu-idle',
      'estimated-input-latency'
    ],
    
    // Accessibility-focused gathering
    gatherers: [
      'accessibility',
      'dobetterweb/response-compression',
      'seo/font-size',
      'seo/link-elements',
      'seo/meta-elements',
      'seo/tap-targets'
    ]
  },
  
  // Custom audits for accessibility
  audits: [
    // Standard accessibility audits
    'accessibility/accesskeys',
    'accessibility/aria-allowed-attr',
    'accessibility/aria-command-name',
    'accessibility/aria-hidden-body',
    'accessibility/aria-hidden-focus',
    'accessibility/aria-input-field-name',
    'accessibility/aria-meter-name',
    'accessibility/aria-progressbar-name',
    'accessibility/aria-required-attr',
    'accessibility/aria-required-children',
    'accessibility/aria-required-parent',
    'accessibility/aria-roles',
    'accessibility/aria-toggle-field-name',
    'accessibility/aria-tooltip-name',
    'accessibility/aria-treeitem-name',
    'accessibility/aria-valid-attr-value',
    'accessibility/aria-valid-attr',
    'accessibility/button-name',
    'accessibility/bypass',
    'accessibility/color-contrast',
    'accessibility/definition-list',
    'accessibility/dlitem',
    'accessibility/document-title',
    'accessibility/duplicate-id-active',
    'accessibility/duplicate-id-aria',
    'accessibility/form-field-multiple-labels',
    'accessibility/frame-title',
    'accessibility/heading-order',
    'accessibility/html-has-lang',
    'accessibility/html-lang-valid',
    'accessibility/image-alt',
    'accessibility/input-image-alt',
    'accessibility/label',
    'accessibility/landmark-one-main',
    'accessibility/link-name',
    'accessibility/list',
    'accessibility/listitem',
    'accessibility/meta-refresh',
    'accessibility/meta-viewport',
    'accessibility/object-alt',
    'accessibility/tabindex',
    'accessibility/td-headers-attr',
    'accessibility/th-has-data-cells',
    'accessibility/valid-lang',
    'accessibility/video-caption',
    
    // SEO audits that affect accessibility
    'seo/document-title',
    'seo/meta-description',
    'seo/font-size',
    'seo/tap-targets'
  ],
  
  categories: {
    accessibility: {
      title: 'Accessibility',
      description: 'These checks highlight opportunities to improve the accessibility of your web app.',
      auditRefs: [
        { id: 'accesskeys', weight: 0 },
        { id: 'aria-allowed-attr', weight: 10 },
        { id: 'aria-command-name', weight: 3 },
        { id: 'aria-hidden-body', weight: 10 },
        { id: 'aria-hidden-focus', weight: 3 },
        { id: 'aria-input-field-name', weight: 3 },
        { id: 'aria-meter-name', weight: 3 },
        { id: 'aria-progressbar-name', weight: 3 },
        { id: 'aria-required-attr', weight: 10 },
        { id: 'aria-required-children', weight: 10 },
        { id: 'aria-required-parent', weight: 10 },
        { id: 'aria-roles', weight: 10 },
        { id: 'aria-toggle-field-name', weight: 3 },
        { id: 'aria-tooltip-name', weight: 3 },
        { id: 'aria-treeitem-name', weight: 3 },
        { id: 'aria-valid-attr-value', weight: 10 },
        { id: 'aria-valid-attr', weight: 10 },
        { id: 'button-name', weight: 10 },
        { id: 'bypass', weight: 3 },
        { id: 'color-contrast', weight: 3 },
        { id: 'definition-list', weight: 3 },
        { id: 'dlitem', weight: 3 },
        { id: 'document-title', weight: 3 },
        { id: 'duplicate-id-active', weight: 3 },
        { id: 'duplicate-id-aria', weight: 10 },
        { id: 'form-field-multiple-labels', weight: 2 },
        { id: 'frame-title', weight: 3 },
        { id: 'heading-order', weight: 2 },
        { id: 'html-has-lang', weight: 3 },
        { id: 'html-lang-valid', weight: 3 },
        { id: 'image-alt', weight: 10 },
        { id: 'input-image-alt', weight: 3 },
        { id: 'label', weight: 10 },
        { id: 'landmark-one-main', weight: 3 },
        { id: 'link-name', weight: 3 },
        { id: 'list', weight: 3 },
        { id: 'listitem', weight: 3 },
        { id: 'meta-refresh', weight: 10 },
        { id: 'meta-viewport', weight: 10 },
        { id: 'object-alt', weight: 3 },
        { id: 'tabindex', weight: 3 },
        { id: 'td-headers-attr', weight: 3 },
        { id: 'th-has-data-cells', weight: 3 },
        { id: 'valid-lang', weight: 3 },
        { id: 'video-caption', weight: 10 }
      ]
    }
  }
};