import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files
    dir: './',
});

// Integration-specific Jest configuration
const integrationJestConfig = {
    setupFiles: ['<rootDir>/jest.env.js'],
    setupFilesAfterEnv: [
        '<rootDir>/jest.setup.js',
        '<rootDir>/tests/integration/setup.tsx'
    ],
    testEnvironment: 'jsdom',
    maxWorkers: 1, // Single worker for integration tests to prevent conflicts
    testTimeout: 30000, // Longer timeout for integration tests
    bail: false,
    verbose: true, // More verbose output for integration tests
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    // ESM module configuration
    transformIgnorePatterns: [
        'node_modules/(?!(lucide-react|@radix-ui|@supabase)/)',
    ],
    // Integration test specific coverage
    collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.d.ts',
        '!src/app/**/layout.tsx',
        '!src/app/**/loading.tsx',
        '!src/app/**/error.tsx',
        '!src/app/**/not-found.tsx',
        '!src/app/global-error.tsx',
        '!src/styles/**',
        '!src/types/**',
        '!src/**/__tests__/**',
        '!src/**/*.test.{ts,tsx,js,jsx}',
        '!src/**/*.spec.{ts,tsx,js,jsx}',
    ],
    testPathIgnorePatterns: [
        '<rootDir>/.next/',
        '<rootDir>/node_modules/',
        '<rootDir>/tests/e2e/',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    // Only match integration tests
    testMatch: [
        '<rootDir>/tests/integration/**/*.{test,spec}.{ts,tsx,js,jsx}',
    ],
    coverageDirectory: 'coverage/integration',
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    // Lower thresholds for integration tests as they test broader workflows
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
    // Integration test specific reporters
    reporters: ['default'],
    // Global variables for integration tests
    globals: {
        'process.env.JEST_INTEGRATION': true,
    },
};

// Export the integration-specific configuration
export default createJestConfig(integrationJestConfig);