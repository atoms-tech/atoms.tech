import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
    dir: './',
});

// Enhanced coverage configuration for 100% coverage goals
const coverageJestConfig = {
    setupFiles: ['<rootDir>/jest.env.js'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    maxWorkers: 1,
    testTimeout: 30000, // Increased for coverage collection
    bail: false,
    verbose: true, // Enabled for coverage analysis
    
    // Module mapping
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    
    // ESM module configuration
    transformIgnorePatterns: [
        'node_modules/(?!(lucide-react|@radix-ui|@supabase|@testing-library)/)',
    ],
    
    // Enhanced coverage collection with comprehensive file inclusion
    collectCoverage: true,
    collectCoverageFrom: [
        // Core application files
        'src/**/*.{ts,tsx,js,jsx}',
        
        // Include all components and utilities
        'src/components/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
        'src/store/**/*.{ts,tsx}',
        'src/pages/**/*.{ts,tsx}',
        
        // Exclude specific patterns
        '!src/**/*.d.ts',
        '!src/**/*.stories.{ts,tsx}',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/*.spec.{ts,tsx}',
        '!src/**/__tests__/**',
        '!src/**/__mocks__/**',
        '!src/**/__stories__/**',
        
        // Exclude Next.js specific files
        '!src/app/**/layout.tsx',
        '!src/app/**/loading.tsx',
        '!src/app/**/error.tsx',
        '!src/app/**/not-found.tsx',
        '!src/app/**/page.tsx',
        '!src/app/global-error.tsx',
        
        // Exclude build and config files
        '!src/styles/**',
        '!src/types/**/*.types.ts',
        '!src/middleware.ts',
        
        // Include test utilities for coverage
        'src/test-utils/**/*.{ts,tsx}',
        '!src/test-utils/**/*.test.{ts,tsx}',
    ],
    
    // Test path configuration
    testPathIgnorePatterns: [
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
        '<rootDir>/tests/e2e/',
        '<rootDir>/coverage/',
        '<rootDir>/dist/',
        '<rootDir>/build/',
    ],
    
    // Test file patterns
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{ts,tsx,js,jsx}',
        '<rootDir>/src/**/*.{test,spec}.{ts,tsx,js,jsx}',
        '<rootDir>/tests/integration/**/*.{test,spec}.{ts,tsx,js,jsx}',
        '<rootDir>/tests/unit/**/*.{test,spec}.{ts,tsx,js,jsx}',
    ],
    
    // Enhanced coverage configuration
    coverageDirectory: 'coverage',
    coverageReporters: [
        'text',
        'text-summary',
        'lcov',
        'html',
        'json',
        'json-summary',
        'clover',
        'cobertura',
    ],
    
    // 100% coverage thresholds with granular control
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
        // Per-directory thresholds for gradual improvement
        './src/components/ui/': {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
        './src/lib/utils/': {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
        './src/hooks/': {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
        './src/store/': {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
        // Allow slightly lower thresholds for complex components initially
        './src/components/custom/': {
            branches: 95,
            functions: 95,
            lines: 95,
            statements: 95,
        },
        './src/lib/db/': {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
        },
    },
    
    // Enhanced coverage provider configuration
    coverageProvider: 'v8', // Use V8 for better performance and accuracy
    
    // File extensions to consider
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    
    // Coverage path mapping
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/coverage/',
        '/dist/',
        '/build/',
        '/.next/',
        '/tests/e2e/',
        '\\.stories\\.',
        '\\.test\\.',
        '\\.spec\\.',
    ],
    
    // Enhanced error handling for coverage
    errorOnDeprecated: true,
    
    // Coverage analysis configuration
    collectCoverageOnlyFrom: {
        'src/**/*.{ts,tsx}': true,
    },
    
    // Force coverage collection even for untested files
    forceCoverageMatch: [
        '**/src/**/*.{ts,tsx}',
    ],
    
    // Additional Jest configuration for better coverage
    clearMocks: true,
    restoreMocks: true,
    resetMocks: true,
    
    // Performance optimization for coverage runs
    cache: true,
    cacheDirectory: '<rootDir>/node_modules/.cache/jest-coverage',
    
    // Reporter configuration for coverage analysis
    reporters: [
        'default',
        ['jest-html-reporters', {
            publicPath: './coverage/html-report',
            filename: 'coverage-report.html',
            expand: true,
            includeFailureMsg: true,
        }],
    ],
};

export default createJestConfig(coverageJestConfig);