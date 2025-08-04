/**
 * Visual Regression Testing Configuration
 * Comprehensive configuration for visual testing across different environments
 */

export const visualConfig = {
  // Baseline image configuration
  baseline: {
    directory: 'test-results/visual-baselines',
    updateBaselines: process.env.UPDATE_BASELINES === 'true',
    threshold: 0.2, // 20% difference threshold
    pixelThreshold: 100, // Minimum pixel difference
  },

  // Viewport configurations for responsive testing
  viewports: {
    mobile: [
      { name: 'iPhone SE', width: 375, height: 667, deviceScaleFactor: 2 },
      { name: 'iPhone 12', width: 390, height: 844, deviceScaleFactor: 3 },
      { name: 'iPhone 12 Pro Max', width: 428, height: 926, deviceScaleFactor: 3 },
      { name: 'Samsung Galaxy S21', width: 360, height: 800, deviceScaleFactor: 3 },
    ],
    tablet: [
      { name: 'iPad', width: 768, height: 1024, deviceScaleFactor: 2 },
      { name: 'iPad Pro', width: 1024, height: 1366, deviceScaleFactor: 2 },
      { name: 'Surface Pro', width: 912, height: 1368, deviceScaleFactor: 2 },
    ],
    desktop: [
      { name: 'HD', width: 1366, height: 768, deviceScaleFactor: 1 },
      { name: 'Full HD', width: 1920, height: 1080, deviceScaleFactor: 1 },
      { name: 'QHD', width: 2560, height: 1440, deviceScaleFactor: 1 },
      { name: 'Retina', width: 1920, height: 1080, deviceScaleFactor: 2 },
    ],
  },

  // Component testing configurations
  components: {
    // UI component isolation testing
    isolation: {
      backgroundColor: '#ffffff',
      padding: 20,
      addDecorators: true,
      wrapInContainer: true,
    },
    
    // State variations to test
    states: [
      'default',
      'hover',
      'focus',
      'active',
      'disabled',
      'loading',
      'error',
      'success',
      'empty',
    ],

    // Theme variations
    themes: [
      { name: 'light', className: 'theme-light' },
      { name: 'dark', className: 'theme-dark' },
      { name: 'high-contrast', className: 'theme-high-contrast' },
    ],

    // Component categories for organized testing
    categories: {
      'ui-primitives': [
        'button',
        'input',
        'select',
        'checkbox',
        'radio',
        'switch',
        'slider',
        'progress',
      ],
      'layout': [
        'card',
        'modal',
        'dialog',
        'drawer',
        'tabs',
        'accordion',
        'collapsible',
      ],
      'navigation': [
        'breadcrumb',
        'pagination',
        'menu',
        'sidebar',
        'topbar',
      ],
      'data-display': [
        'table',
        'list',
        'grid',
        'calendar',
        'chart',
        'avatar',
        'badge',
        'tooltip',
      ],
      'feedback': [
        'alert',
        'toast',
        'notification',
        'loading-spinner',
        'skeleton',
      ],
    },
  },

  // Page testing configurations
  pages: {
    // Routes to test visually
    routes: [
      { path: '/', name: 'home', requiresAuth: false },
      { path: '/login', name: 'login', requiresAuth: false },
      { path: '/register', name: 'register', requiresAuth: false },
      { path: '/dashboard', name: 'dashboard', requiresAuth: true },
      { path: '/projects', name: 'projects', requiresAuth: true },
      { path: '/settings', name: 'settings', requiresAuth: true },
      { path: '/profile', name: 'profile', requiresAuth: true },
      { path: '/404', name: 'not-found', requiresAuth: false },
    ],

    // User states to test
    userStates: [
      { name: 'anonymous', authenticated: false },
      { name: 'authenticated', authenticated: true, role: 'user' },
      { name: 'admin', authenticated: true, role: 'admin' },
    ],

    // Data states to test
    dataStates: [
      'empty',
      'loading',
      'with-data',
      'error',
      'partial-data',
    ],
  },

  // Interaction testing
  interactions: {
    // Interactive states to capture
    states: [
      { name: 'hover', action: 'hover' },
      { name: 'focus', action: 'focus' },
      { name: 'active', action: 'mousedown' },
      { name: 'clicked', action: 'click' },
    ],

    // Elements to test interactions on
    elements: [
      'button',
      'a[href]',
      'input',
      'select',
      'textarea',
      '[role="button"]',
      '[tabindex]',
    ],
  },

  // Accessibility visual testing
  accessibility: {
    // High contrast mode
    highContrast: {
      enabled: true,
      forcedColors: 'active',
      theme: 'dark',
    },

    // Reduced motion
    reducedMotion: {
      enabled: true,
      prefersReducedMotion: 'reduce',
    },

    // Focus indicators
    focusIndicators: {
      enabled: true,
      highlightFocusedElements: true,
    },

    // Screen reader simulation
    screenReader: {
      enabled: true,
      hideVisualContent: false,
      showAriaLabels: true,
    },
  },

  // Browser-specific configurations
  browsers: {
    chromium: {
      enabled: true,
      flags: [
        '--force-color-profile=srgb',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    },
    firefox: {
      enabled: true,
      preferences: {
        'gfx.color_management.mode': 1,
        'gfx.color_management.display_profile': 'sRGB',
      },
    },
    webkit: {
      enabled: true,
      // Safari-specific configurations
    },
  },

  // CI/CD integration
  ci: {
    // Upload configuration for visual diff services
    upload: {
      enabled: process.env.CI === 'true',
      service: process.env.VISUAL_SERVICE || 'chromatic', // chromatic, percy, etc.
      projectToken: process.env.CHROMATIC_PROJECT_TOKEN,
    },

    // Baseline management
    baselines: {
      updateOnMain: true,
      autoApprove: false,
      requireReview: true,
    },

    // Performance limits
    performance: {
      maxScreenshots: 1000,
      timeout: 30000,
      parallelWorkers: 4,
    },
  },

  // Animation handling
  animations: {
    disable: true,
    waitForAnimations: 'css',
    animationTimeout: 5000,
  },

  // Network conditions
  network: {
    waitForIdle: true,
    waitForLoadState: 'networkidle',
    timeout: 30000,
  },
};

export default visualConfig;