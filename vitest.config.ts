import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: ['./vitest.setup.ts'],
        include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: [
            'node_modules',
            'dist',
            '.next',
            'coverage',
            '**/*.config.*',
            '**/mockData/**',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'src/types/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData',
                'src/app/layout.tsx',
                'src/app/**/layout.tsx',
                'src/app/**/loading.tsx',
                'src/app/**/error.tsx',
                'src/app/**/not-found.tsx',
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
        },
        // Increase timeout for integration tests
        testTimeout: 10000,
        hookTimeout: 10000,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});

