/**
 * Enhanced Visual Regression Testing Configuration
 * Comprehensive configuration for advanced visual testing scenarios
 */

export interface VisualTestConfig {
  baseline: BaselineConfig;
  thresholds: ThresholdConfig;
  viewports: ViewportConfig;
  browsers: BrowserConfig;
  animations: AnimationConfig;
  accessibility: AccessibilityConfig;
  mobile: MobileConfig;
  themes: ThemeConfig;
  performance: PerformanceConfig;
  ci: CIConfig;
}

interface BaselineConfig {
  directory: string;
  updateBaselines: boolean;
  autoApprove: boolean;
  versioning: boolean;
  retention: {
    days: number;
    maxVersions: number;
  };
}

interface ThresholdConfig {
  default: number;
  components: number;
  pages: number;
  crossBrowser: number;
  mobile: number;
  themes: number;
  animations: number;
  accessibility: number;
  pixelThreshold: {
    default: number;
    strict: number;
    relaxed: number;
  };
}

interface ViewportConfig {
  mobile: Array<{
    name: string;
    width: number;
    height: number;
    deviceScaleFactor: number;
    userAgent?: string;
    hasTouch?: boolean;
  }>;
  tablet: Array<{
    name: string;
    width: number;
    height: number;
    deviceScaleFactor: number;
  }>;
  desktop: Array<{
    name: string;
    width: number;
    height: number;
    deviceScaleFactor: number;
  }>;
  custom: Array<{
    name: string;
    width: number;
    height: number;
    deviceScaleFactor: number;
    description: string;
  }>;
}

interface BrowserConfig {
  chromium: {
    enabled: boolean;
    flags: string[];
    preferences?: Record<string, any>;
  };
  firefox: {
    enabled: boolean;
    preferences: Record<string, any>;
  };
  webkit: {
    enabled: boolean;
    preferences?: Record<string, any>;
  };
}

interface AnimationConfig {
  disable: boolean;
  waitForAnimations: 'css' | 'js' | 'both';
  animationTimeout: number;
  stateCapture: {
    before: boolean;
    during: boolean;
    after: boolean;
    intervals: number[];
  };
}

interface AccessibilityConfig {
  highContrast: {
    enabled: boolean;
    forcedColors: 'active' | 'none';
    themes: string[];
  };
  reducedMotion: {
    enabled: boolean;
    prefersReducedMotion: 'reduce' | 'no-preference';
  };
  focusIndicators: {
    enabled: boolean;
    highlightStyle: string;
    testKeyboardNavigation: boolean;
  };
  colorBlindness: {
    enabled: boolean;
    simulations: Array<{
      name: string;
      filter: string;
      description: string;
    }>;
  };
  screenReader: {
    enabled: boolean;
    hideVisualContent: boolean;
    showAriaLabels: boolean;
  };
}

interface MobileConfig {
  touchTargets: {
    minSize: number;
    highlight: boolean;
  };
  gestures: {
    enabled: boolean;
    types: string[];
  };
  keyboard: {
    virtual: boolean;
    layouts: string[];
  };
  orientation: {
    test: boolean;
    types: ('portrait' | 'landscape')[];
  };
  performance: {
    throttling: boolean;
    networkConditions: string[];
  };
}

interface ThemeConfig {
  enabled: boolean;
  themes: Array<{
    name: string;
    className: string;
    colorScheme: 'light' | 'dark';
    properties: Record<string, string>;
    accessibility: {
      highContrast: boolean;
      colorBlindnessFriendly: boolean;
    };
  }>;
  transitions: {
    test: boolean;
    duration: number;
    captureStates: ('start' | 'mid' | 'end')[];
  };
}

interface PerformanceConfig {
  budgets: {
    maxScreenshots: number;
    maxDuration: number;
    maxFileSize: string;
  };
  parallel: {
    workers: number;
    maxConcurrent: number;
  };
  optimization: {
    compressImages: boolean;
    lazyLoading: boolean;
    caching: boolean;
  };
}

interface CIConfig {
  enabled: boolean;
  provider: 'github' | 'gitlab' | 'jenkins' | 'other';
  upload: {
    service: 'chromatic' | 'percy' | 'applitools' | 'aws-s3' | 'none';
    config: Record<string, any>;
  };
  approval: {
    required: boolean;
    autoApprove: {
      minor: boolean;
      major: boolean;
    };
  };
  notifications: {
    slack?: {
      webhook: string;
      channel: string;
    };
    email?: {
      recipients: string[];
      template: string;
    };
  };
}

export const enhancedVisualConfig: VisualTestConfig = {
  baseline: {
    directory: 'test-results/visual-baselines',
    updateBaselines: process.env.UPDATE_BASELINES === 'true',
    autoApprove: process.env.AUTO_APPROVE === 'true',
    versioning: true,
    retention: {
      days: 30,
      maxVersions: 10,
    },
  },

  thresholds: {
    default: 0.2,
    components: 0.15,
    pages: 0.25,
    crossBrowser: 0.35,
    mobile: 0.3,
    themes: 0.4,
    animations: 0.5,
    accessibility: 0.4,
    pixelThreshold: {
      default: 100,
      strict: 50,
      relaxed: 500,
    },
  },

  viewports: {
    mobile: [
      {
        name: 'iPhone SE',
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        hasTouch: true,
      },
      {
        name: 'iPhone 12',
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        hasTouch: true,
      },
      {
        name: 'iPhone 12 Pro Max',
        width: 428,
        height: 926,
        deviceScaleFactor: 3,
        hasTouch: true,
      },
      {
        name: 'Pixel 5',
        width: 393,
        height: 851,
        deviceScaleFactor: 2.75,
        hasTouch: true,
      },
      {
        name: 'Galaxy S21',
        width: 384,
        height: 854,
        deviceScaleFactor: 2.75,
        hasTouch: true,
      },
      {
        name: 'Galaxy Z Fold3 Folded',
        width: 374,
        height: 820,
        deviceScaleFactor: 3,
        hasTouch: true,
      },
      {
        name: 'Galaxy Z Fold3 Unfolded',
        width: 768,
        height: 1024,
        deviceScaleFactor: 2.5,
        hasTouch: true,
      },
    ],
    tablet: [
      {
        name: 'iPad',
        width: 768,
        height: 1024,
        deviceScaleFactor: 2,
      },
      {
        name: 'iPad Pro',
        width: 1024,
        height: 1366,
        deviceScaleFactor: 2,
      },
      {
        name: 'iPad Mini',
        width: 744,
        height: 1133,
        deviceScaleFactor: 2,
      },
      {
        name: 'Surface Pro',
        width: 912,
        height: 1368,
        deviceScaleFactor: 2,
      },
      {
        name: 'Galaxy Tab S7',
        width: 800,
        height: 1280,
        deviceScaleFactor: 2,
      },
    ],
    desktop: [
      {
        name: 'HD Ready',
        width: 1366,
        height: 768,
        deviceScaleFactor: 1,
      },
      {
        name: 'Full HD',
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      },
      {
        name: 'QHD',
        width: 2560,
        height: 1440,
        deviceScaleFactor: 1,
      },
      {
        name: 'Retina',
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2,
      },
      {
        name: '4K',
        width: 3840,
        height: 2160,
        deviceScaleFactor: 1,
      },
    ],
    custom: [
      {
        name: 'Ultra-wide',
        width: 3440,
        height: 1440,
        deviceScaleFactor: 1,
        description: 'Ultra-wide monitor 21:9 aspect ratio',
      },
      {
        name: 'Portrait Monitor',
        width: 1080,
        height: 1920,
        deviceScaleFactor: 1,
        description: 'Rotated monitor in portrait mode',
      },
    ],
  },

  browsers: {
    chromium: {
      enabled: true,
      flags: [
        '--force-color-profile=srgb',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-default-apps',
        '--no-default-browser-check',
      ],
      preferences: {
        'profile.default_content_setting_values.notifications': 2,
        'profile.default_content_settings.popups': 0,
        'profile.managed_default_content_settings.images': 1,
      },
    },
    firefox: {
      enabled: true,
      preferences: {
        'gfx.color_management.mode': 1,
        'gfx.color_management.display_profile': 'sRGB',
        'media.navigator.permission.disabled': true,
        'media.autoplay.default': 2,
        'dom.webnotifications.enabled': false,
        'dom.push.enabled': false,
      },
    },
    webkit: {
      enabled: true,
      preferences: {
        'WebKitWebGLEnabled': true,
        'WebKitAcceleratedCompositingEnabled': true,
      },
    },
  },

  animations: {
    disable: true,
    waitForAnimations: 'css',
    animationTimeout: 5000,
    stateCapture: {
      before: true,
      during: false,
      after: true,
      intervals: [0, 150, 300], // Capture at 0ms, 150ms, 300ms
    },
  },

  accessibility: {
    highContrast: {
      enabled: true,
      forcedColors: 'active',
      themes: ['high-contrast-light', 'high-contrast-dark'],
    },
    reducedMotion: {
      enabled: true,
      prefersReducedMotion: 'reduce',
    },
    focusIndicators: {
      enabled: true,
      highlightStyle: '3px solid #005fcc',
      testKeyboardNavigation: true,
    },
    colorBlindness: {
      enabled: true,
      simulations: [
        {
          name: 'Protanopia',
          filter: 'url(#protanopia)',
          description: 'Red-blind color vision deficiency',
        },
        {
          name: 'Deuteranopia',
          filter: 'url(#deuteranopia)',
          description: 'Green-blind color vision deficiency',
        },
        {
          name: 'Tritanopia',
          filter: 'url(#tritanopia)',
          description: 'Blue-blind color vision deficiency',
        },
        {
          name: 'Monochrome',
          filter: 'grayscale(100%)',
          description: 'Complete color blindness simulation',
        },
      ],
    },
    screenReader: {
      enabled: true,
      hideVisualContent: false,
      showAriaLabels: true,
    },
  },

  mobile: {
    touchTargets: {
      minSize: 44, // iOS Human Interface Guidelines minimum
      highlight: true,
    },
    gestures: {
      enabled: true,
      types: ['tap', 'swipe', 'pinch', 'long-press', 'double-tap'],
    },
    keyboard: {
      virtual: true,
      layouts: ['qwerty', 'numeric', 'email', 'tel'],
    },
    orientation: {
      test: true,
      types: ['portrait', 'landscape'],
    },
    performance: {
      throttling: true,
      networkConditions: ['slow-3g', 'fast-3g', '4g'],
    },
  },

  themes: {
    enabled: true,
    themes: [
      {
        name: 'light',
        className: 'theme-light',
        colorScheme: 'light',
        properties: {
          '--color-background': '#ffffff',
          '--color-foreground': '#000000',
          '--color-primary': '#0066cc',
          '--color-secondary': '#6c757d',
        },
        accessibility: {
          highContrast: false,
          colorBlindnessFriendly: true,
        },
      },
      {
        name: 'dark',
        className: 'theme-dark',
        colorScheme: 'dark',
        properties: {
          '--color-background': '#1a1a1a',
          '--color-foreground': '#ffffff',
          '--color-primary': '#4c9aff',
          '--color-secondary': '#b0b0b0',
        },
        accessibility: {
          highContrast: false,
          colorBlindnessFriendly: true,
        },
      },
      {
        name: 'high-contrast',
        className: 'theme-high-contrast',
        colorScheme: 'dark',
        properties: {
          '--color-background': '#000000',
          '--color-foreground': '#ffffff',
          '--color-primary': '#ffff00',
          '--color-secondary': '#00ff00',
        },
        accessibility: {
          highContrast: true,
          colorBlindnessFriendly: true,
        },
      },
    ],
    transitions: {
      test: true,
      duration: 300,
      captureStates: ['start', 'mid', 'end'],
    },
  },

  performance: {
    budgets: {
      maxScreenshots: 10000,
      maxDuration: 30 * 60 * 1000, // 30 minutes
      maxFileSize: '10MB',
    },
    parallel: {
      workers: process.env.CI ? 2 : 4,
      maxConcurrent: 8,
    },
    optimization: {
      compressImages: true,
      lazyLoading: true,
      caching: true,
    },
  },

  ci: {
    enabled: !!process.env.CI,
    provider: 'github',
    upload: {
      service: process.env.VISUAL_SERVICE as any || 'none',
      config: {
        chromatic: {
          projectToken: process.env.CHROMATIC_PROJECT_TOKEN,
          exitZeroOnChanges: true,
          buildScriptName: 'build-storybook',
        },
        percy: {
          token: process.env.PERCY_TOKEN,
          parallel: true,
        },
        applitools: {
          apiKey: process.env.APPLITOOLS_API_KEY,
          batch: {
            name: 'Visual Regression Tests',
            id: process.env.CI_BUILD_ID,
          },
        },
      },
    },
    approval: {
      required: true,
      autoApprove: {
        minor: false,
        major: false,
      },
    },
    notifications: {
      slack: {
        webhook: process.env.SLACK_WEBHOOK_URL || '',
        channel: '#visual-testing',
      },
      email: {
        recipients: (process.env.NOTIFICATION_EMAILS || '').split(','),
        template: 'visual-regression-results',
      },
    },
  },
};

export default enhancedVisualConfig;