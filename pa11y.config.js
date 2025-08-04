/**
 * pa11y Configuration for WCAG 2.1 AA Compliance Testing
 * 
 * Comprehensive accessibility testing configuration using pa11y
 * Validates against WCAG 2.1 AA standards with detailed reporting
 */

module.exports = {
  // URLs to test - can be expanded with all application routes
  urls: [
    'http://localhost:3000',
    'http://localhost:3000/signup',
    'http://localhost:3000/home',
    // Add more URLs as needed
  ],

  // Standard configuration
  standard: 'WCAG2AA',
  
  // Include warnings and notices
  includeWarnings: true,
  includeNotices: true,
  
  // Timeout settings
  timeout: 30000,
  wait: 2000,
  
  // Chrome options for headless testing
  chromeLaunchConfig: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--disable-features=TranslateUI',
      '--disable-iframes-sandbox-restrictions',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  },

  // Viewport configuration
  viewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1
  },

  // Reporter configuration
  reporter: 'pa11y-reporter-json',
  
  // Output file for results
  outputFile: 'test-results/accessibility/pa11y-results.json',

  // Actions to perform before testing (useful for authentication, navigation, etc.)
  actions: [
    // Example actions:
    // 'wait for element button[type="submit"] to be visible',
    // 'click element button[type="submit"]',
    // 'wait for path to be /dashboard'
  ],

  // Headers to include in requests
  headers: {
    'User-Agent': 'pa11y-accessibility-testing'
  },

  // Rules configuration - customize based on specific needs
  rules: [
    // WCAG 2.1 Level A rules
    'WCAG2A.Principle1.Guideline1_1.1_1_1.H25.1.NoTitleEl',
    'WCAG2A.Principle1.Guideline1_1.1_1_1.H25.2',
    'WCAG2A.Principle1.Guideline1_1.1_1_1.H30.2',
    'WCAG2A.Principle1.Guideline1_1.1_1_1.H35.3',
    'WCAG2A.Principle1.Guideline1_1.1_1_1.H37',
    'WCAG2A.Principle1.Guideline1_1.1_1_1.H64.1',
    'WCAG2A.Principle1.Guideline1_1.1_1_1.H64.2',
    'WCAG2A.Principle1.Guideline1_3.1_3_1.F68',
    'WCAG2A.Principle1.Guideline1_3.1_3_1.F87',
    'WCAG2A.Principle1.Guideline1_3.1_3_1.G141',
    'WCAG2A.Principle1.Guideline1_3.1_3_1.H42.2',
    'WCAG2A.Principle1.Guideline1_3.1_3_1.H43.HeadersRequired',
    'WCAG2A.Principle1.Guideline1_3.1_3_1.H43.IncorrectHeadersAttr',
    'WCAG2A.Principle1.Guideline1_3.1_3_1.H43.MissingHeaderIds',
    'WCAG2A.Principle1.Guideline1_3.1_3_1.H43.MissingHeadersAttrs',
    'WCAG2A.Principle1.Guideline1_3.1_3_1.H44.NonExistent',
    'WCAG2A.Principle1.Guideline1_3.1_3_1.H44.NonExistentFragment',
    'WCAG2A.Principle1.Guideline1_3.1_3_1.H65',
    'WCAG2A.Principle1.Guideline1_3.1_3_1.H71.NoLegend',
    'WCAG2A.Principle1.Guideline1_3.1_3_1.H85.2',
    'WCAG2A.Principle1.Guideline1_4.1_4_1.G14,G18',
    'WCAG2A.Principle1.Guideline1_4.1_4_2.F23',
    'WCAG2A.Principle2.Guideline2_1.2_1_1.G90',
    'WCAG2A.Principle2.Guideline2_1.2_1_2.F10',
    'WCAG2A.Principle2.Guideline2_4.2_4_1.G1,G123,G124.NoSuchId',
    'WCAG2A.Principle2.Guideline2_4.2_4_1.H64.1',
    'WCAG2A.Principle2.Guideline2_4.2_4_2.H25.1.NoTitleEl',
    'WCAG2A.Principle2.Guideline2_4.2_4_2.H25.2',
    'WCAG2A.Principle2.Guideline2_4.2_4_3.H4.2',
    'WCAG2A.Principle2.Guideline2_4.2_4_4.H77,H78,H79,H80,H81',
    'WCAG2A.Principle3.Guideline3_1.3_1_1.H57.2',
    'WCAG2A.Principle3.Guideline3_2.3_2_2.H32.2',
    'WCAG2A.Principle3.Guideline3_3.3_3_1.G83,G84,G85',
    'WCAG2A.Principle3.Guideline3_3.3_3_2.G131,G89,G184,H90',
    'WCAG2A.Principle4.Guideline4_1.4_1_1.F77',
    'WCAG2A.Principle4.Guideline4_1.4_1_2.H91.A.Empty',
    'WCAG2A.Principle4.Guideline4_1.4_1_2.H91.A.EmptyNoId',
    'WCAG2A.Principle4.Guideline4_1.4_1_2.H91.A.NoContent',
    'WCAG2A.Principle4.Guideline4_1.4_1_2.H91.A.NoHref',
    'WCAG2A.Principle4.Guideline4_1.4_1_2.H91.A.Placeholder',

    // WCAG 2.1 Level AA rules
    'WCAG2AA.Principle1.Guideline1_4.1_4_3.G145.Alpha',
    'WCAG2AA.Principle1.Guideline1_4.1_4_3.G145.BgImage',
    'WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Alpha',
    'WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgImage',
    'WCAG2AA.Principle1.Guideline1_4.1_4_3_F24.F24.FGColour',
    'WCAG2AA.Principle1.Guideline1_4.1_4_3_F24.F24.BGColour',
    'WCAG2AA.Principle1.Guideline1_4.1_4_5.G140,C22,C30.AALevel',
    'WCAG2AA.Principle1.Guideline1_4.1_4_10.C32,C31,C33,C38,SCR34,G206',
    'WCAG2AA.Principle2.Guideline2_4.2_4_5.G125,G64,G63,G161,G126,G185',
    'WCAG2AA.Principle2.Guideline2_4.2_4_6.G130,G131',
    'WCAG2AA.Principle2.Guideline2_4.2_4_7.G149,G165,G195,C15,SCR31',
    'WCAG2AA.Principle3.Guideline3_1.3_1_2.H58',
    'WCAG2AA.Principle3.Guideline3_2.3_2_3.G61',
    'WCAG2AA.Principle3.Guideline3_2.3_2_4.G197',
    'WCAG2AA.Principle3.Guideline3_3.3_3_3.G177',
    'WCAG2AA.Principle3.Guideline3_3.3_3_4.G98,G99,G155,G164,G168.LegalForms'
  ],

  // Ignore specific rules if needed (use sparingly)
  ignore: [
    // Example: ignore color contrast for specific elements
    // 'WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail'
  ],

  // Hide specific elements during testing
  hideElements: [
    // Examples:
    // '.advertisement',
    // '[data-testid="analytics-tracker"]'
  ],

  // Root element to test (defaults to entire page)
  rootElement: 'html',

  // Threshold for different types of issues
  threshold: {
    errors: 0,     // Fail if any errors
    warnings: 10,  // Fail if more than 10 warnings
    notices: 50    // Fail if more than 50 notices
  },

  // Log configuration
  log: {
    debug: false,
    error: true,
    info: true
  },

  // User agent string
  userAgent: 'pa11y/accessibility-testing',

  // Method for HTTP requests
  method: 'GET',

  // Custom function to run before each test
  beforeScript: function(page, options) {
    return new Promise((resolve) => {
      // Set up any global accessibility testing configurations
      // Add custom accessibility test helpers
      page.evaluate(() => {
        // Disable animations for consistent testing
        const style = document.createElement('style');
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        `;
        document.head.appendChild(style);
      });
      
      resolve();
    });
  },

  // Custom function to run after each test
  afterScript: function(page, options) {
    return new Promise((resolve) => {
      // Clean up or collect additional data
      resolve();
    });
  },

  // Concurrency settings
  concurrency: 1, // Run tests sequentially for consistent results

  // Custom runners for different testing scenarios
  runners: [
    // Desktop testing
    {
      name: 'desktop',
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    // Mobile testing
    {
      name: 'mobile',
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15'
    },
    // Tablet testing
    {
      name: 'tablet',
      viewport: { width: 768, height: 1024 },
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15'
    }
  ]
};