/**
 * Environment Configuration Validation
 * Validates required environment variables and provides type-safe access
 */

import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
    // App Configuration
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

    // Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

    // Optional API Keys (can be undefined in development)
    NEXT_PUBLIC_GUMLOOP_API_KEY: z.string().optional(),
    NEXT_PUBLIC_GUMLOOP_API_URL: z.string().url().optional(),
    NEXT_PUBLIC_GUMLOOP_USER_ID: z.string().optional(),
    NEXT_PUBLIC_GUMLOOP_FILE_CONVERT_FLOW_ID: z.string().optional(),
    NEXT_PUBLIC_GUMLOOP_REQ_ANALYSIS_FLOW_ID: z.string().optional(),
    NEXT_PUBLIC_GUMLOOP_REQ_ANALYSIS_REASONING_FLOW_ID: z.string().optional(),
    NEXT_PUBLIC_GUMLOOP_TEXT_TO_MERMAID_FLOW_ID: z.string().optional(),

    NEXT_PUBLIC_CHUNKR_API_KEY: z.string().optional(),
    NEXT_PUBLIC_CHUNKR_API_URL: z.string().url().optional(),

    // Email Configuration (server-side only)
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),
    ADMIN_EMAIL: z.string().email().optional(),

    // Feature Flags
    NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: z
        .string()
        .transform((val) => val === 'true')
        .default('false'),
    NEXT_PUBLIC_ENABLE_ERROR_TRACKING: z
        .string()
        .transform((val) => val === 'true')
        .default('false'),
    NEXT_PUBLIC_ENABLE_ANALYTICS: z
        .string()
        .transform((val) => val === 'true')
        .default('false'),
    NEXT_PUBLIC_CSP_ENABLED: z
        .string()
        .transform((val) => val === 'true')
        .default('true'),
    NEXT_PUBLIC_SECURITY_HEADERS_ENABLED: z
        .string()
        .transform((val) => val === 'true')
        .default('true'),

    // Logging
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    ENABLE_REQUEST_LOGGING: z
        .string()
        .transform((val) => val === 'true')
        .default('false'),
    ENABLE_DEBUG_LOGGING: z
        .string()
        .transform((val) => val === 'true')
        .default('false'),
});

// Production-specific schema
const productionEnvSchema = envSchema.extend({
    // In production, these should be required
    NEXT_PUBLIC_GUMLOOP_API_KEY: z.string().min(1),
    NEXT_PUBLIC_GUMLOOP_USER_ID: z.string().min(1),
    NEXT_PUBLIC_CHUNKR_API_KEY: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates environment configuration
 */
export function validateEnv(): EnvConfig {
    const env = process.env;
    const isProduction = env.NODE_ENV === 'production';

    try {
        // Use production schema in production, regular schema otherwise
        const schema = isProduction ? productionEnvSchema : envSchema;
        return schema.parse(env);
    } catch (error) {
        console.error('❌ Environment validation failed:');

        if (error instanceof z.ZodError) {
            error.errors.forEach((err) => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
        }

        if (isProduction) {
            // In production, fail hard
            process.exit(1);
        } else {
            // In development, warn but continue
            console.warn(
                '⚠️  Continuing with invalid environment in development mode',
            );
            // Return partial config for development
            return envSchema.parse(env);
        }
    }
}

/**
 * Type-safe environment configuration
 */
export const env = validateEnv();

/**
 * Helper functions for environment checks
 */
export const isProduction = () => env.NODE_ENV === 'production';
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isTest = () => env.NODE_ENV === 'test';

/**
 * Feature flag helpers
 */
export const isFeatureEnabled = {
    performanceMonitoring: () => env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING,
    errorTracking: () => env.NEXT_PUBLIC_ENABLE_ERROR_TRACKING,
    analytics: () => env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    csp: () => env.NEXT_PUBLIC_CSP_ENABLED,
    securityHeaders: () => env.NEXT_PUBLIC_SECURITY_HEADERS_ENABLED,
    requestLogging: () => env.ENABLE_REQUEST_LOGGING,
    debugLogging: () => env.ENABLE_DEBUG_LOGGING,
};

/**
 * API configuration helpers
 */
export const apiConfig = {
    supabase: {
        url: env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    gumloop: {
        apiKey: env.NEXT_PUBLIC_GUMLOOP_API_KEY,
        apiUrl:
            env.NEXT_PUBLIC_GUMLOOP_API_URL || 'https://api.gumloop.com/api/v1',
        userId: env.NEXT_PUBLIC_GUMLOOP_USER_ID,
        flows: {
            fileConvert: env.NEXT_PUBLIC_GUMLOOP_FILE_CONVERT_FLOW_ID,
            reqAnalysis: env.NEXT_PUBLIC_GUMLOOP_REQ_ANALYSIS_FLOW_ID,
            reqAnalysisReasoning:
                env.NEXT_PUBLIC_GUMLOOP_REQ_ANALYSIS_REASONING_FLOW_ID,
            textToMermaid: env.NEXT_PUBLIC_GUMLOOP_TEXT_TO_MERMAID_FLOW_ID,
        },
    },
    chunkr: {
        apiKey: env.NEXT_PUBLIC_CHUNKR_API_KEY,
        apiUrl:
            env.NEXT_PUBLIC_CHUNKR_API_URL || 'https://api.chunkr.ai/api/v1',
    },
    email: {
        apiKey: env.RESEND_API_KEY,
        fromEmail: env.RESEND_FROM_EMAIL || 'noreply@atoms.tech',
        adminEmail: env.ADMIN_EMAIL || 'admin@atoms.tech',
    },
};

/**
 * Build configuration
 */
export const buildConfig = {
    appUrl: env.NEXT_PUBLIC_APP_URL,
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    logLevel: env.LOG_LEVEL,
};

/**
 * Runtime environment check (for client-side)
 */
export function checkRequiredEnvVars() {
    const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.error('Missing required environment variables:', missing);
        return false;
    }

    return true;
}
// Force reformat
