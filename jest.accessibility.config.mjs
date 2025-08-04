import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
    dir: './',
});

// Accessibility-specific Jest configuration
const accessibilityJestConfig = {
    displayName: 'Accessibility Tests',
    setupFiles: ['<rootDir>/jest.env.js'],
    setupFilesAfterEnv: [
        '<rootDir>/jest.setup.js',
        '<rootDir>/src/test-utils/accessibility-setup.js'
    ],
    testEnvironment: 'jsdom',
    maxWorkers: 1,
    testTimeout: 30000, // Increased timeout for accessibility tests
    verbose: true,
    
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    
    // Focus on accessibility test files
    testMatch: [
        '<rootDir>/src/**/*.a11y.test.{ts,tsx,js,jsx}',
        '<rootDir>/src/**/__tests__/**/*.a11y.{ts,tsx,js,jsx}',
        '<rootDir>/tests/accessibility/**/*.{test,spec}.{ts,tsx,js,jsx}',
    ],
    
    // Transform configuration for accessibility tools
    transformIgnorePatterns: [
        'node_modules/(?!(axe-core|jest-axe|@axe-core|@testing-library)/)',
    ],
    
    // Coverage specific to accessibility
    collectCoverageFrom: [
        'src/components/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/*.spec.{ts,tsx}',
    ],
    
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    
    // Accessibility-specific reporters
    reporters: [
        'default',
        [
            'jest-junit',
            {
                outputDirectory: 'test-results/accessibility',
                outputName: 'accessibility-results.xml',
                suiteName: 'Accessibility Tests',
                classNameTemplate: '{classname}',
                titleTemplate: '{title}',
                includeConsoleOutput: true
            }
        ],
        [
            'jest-html-reporters',
            {
                publicPath: 'test-results/accessibility',
                filename: 'accessibility-report.html',
                expand: true,
                pageTitle: 'Accessibility Test Results'
            }
        ]
    ],
    
    // Global accessibility test configuration
    globals: {
        'accessibility-config': {
            wcagLevel: 'AA',
            wcagVersion: '2.1',
            includeBestPractices: true,
            disableColorContrast: false,
            timeoutMs: 5000
        }
    }
};

export default createJestConfig(accessibilityJestConfig);