import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        {
                            name: '@/lib/supabase/supabaseBrowser',
                            message: "Use atomsApiClient from '@/lib/atoms-api' instead.",
                        },
                        {
                            name: '@/lib/supabase/supabaseServer',
                            message: "Use atomsApiServer from '@/lib/atoms-api' instead.",
                        },
                    ],
                    patterns: [
                        {
                            group: ['../'],
                            message: 'Relative imports are not allowed.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['src/lib/**'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
        },
    },
    {
        files: ['src/lib/atoms-api/adapters/**', 'src/lib/db/**', 'src/lib/utils/**'],
        rules: {
            // Allow Supabase direct imports inside adapters and legacy db utils
            'no-restricted-imports': [
                'error',
                {
                    paths: [],
                    patterns: [
                        {
                            group: ['../'],
                            message: 'Relative imports are not allowed.',
                        },
                    ],
                },
            ],
        },
    },
];

export default eslintConfig;

