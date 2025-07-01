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
            // Disable or downgrade problematic rules
            // disable unexpeted any
            'no-unused-vars': 'off',
            'no-undef': 'off',
            'no-restricted-globals': 'off',
            'no-undef-init': 'off',
            'no-var': 'off',

            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
            '@typescript-eslint/no-explicit-any': 'warn',
            'react/no-unescaped-entities': 'warn',
            'react-hooks/exhaustive-deps': 'warn',
            'react-hooks/rules-of-hooks': 'error', // Keep this as error since it's critical
            '@next/next/no-img-element': 'warn',
            'prefer-const': 'warn',

            // Disable relative imports restriction for now
            'no-restricted-imports': 'off',

            // Allow console statements in development
            'no-console':
                process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        },
    },
];

export default eslintConfig;
