import { z as _z } from 'zod';
import {
    apiConfig as _apiConfig,
    buildConfig as _buildConfig,
    checkRequiredEnvVars,
    env as _env,
    isFeatureEnabled as _isFeatureEnabled,
    isDevelopment as _isDevelopment,
    isProduction as _isProduction,
    isTest as _isTest,
    validateEnv,
} from '@/lib/utils/env-validation';

describe('env-validation', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset environment
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('validateEnv', () => {
        it('should validate development environment successfully', () => {
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

            const result = validateEnv();

            expect(result.NODE_ENV).toBe('development');
            expect(result.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
        });

        it('should validate production environment with all required vars', () => {
            process.env.NODE_ENV = 'production';
            process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.example.com';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-123';
            process.env.NEXT_PUBLIC_GUMLOOP_API_KEY = 'gumloop-key-123';
            process.env.NEXT_PUBLIC_GUMLOOP_USER_ID = 'user-123';
            process.env.NEXT_PUBLIC_CHUNKR_API_KEY = 'chunkr-key-123';
            process.env.RESEND_API_KEY = 'resend-key-123';

            const result = validateEnv();

            expect(result.NODE_ENV).toBe('production');
            expect(result.NEXT_PUBLIC_SUPABASE_URL).toBe('https://supabase.example.com');
            expect(result.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('anon-key-123');
        });

        it('should handle missing required vars in development', () => {
            process.env.NODE_ENV = 'development';
            delete process.env.NEXT_PUBLIC_SUPABASE_URL;
            delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            expect(() => validateEnv()).not.toThrow();
        });

        it('should throw in production with missing required vars', () => {
            process.env.NODE_ENV = 'production';
            delete process.env.NEXT_PUBLIC_SUPABASE_URL;
            delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit called');
            });

            expect(() => validateEnv()).toThrow();
            expect(mockExit).toHaveBeenCalledWith(1);

            mockExit.mockRestore();
        });

        it('should use default values for optional env vars', () => {
            process.env.NODE_ENV = 'development';
            delete process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING;
            delete process.env.LOG_LEVEL;

            const result = validateEnv();

            expect(result.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING).toBe(false);
            expect(result.LOG_LEVEL).toBe('info');
        });

        it('should transform string boolean values correctly', () => {
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING = 'true';
            process.env.NEXT_PUBLIC_ENABLE_ERROR_TRACKING = 'false';
            process.env.NEXT_PUBLIC_CSP_ENABLED = 'true';

            const result = validateEnv();

            expect(result.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING).toBe(true);
            expect(result.NEXT_PUBLIC_ENABLE_ERROR_TRACKING).toBe(false);
            expect(result.NEXT_PUBLIC_CSP_ENABLED).toBe(true);
        });

        it('should validate URL formats correctly', () => {
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url';

            expect(() => validateEnv()).toThrow();
        });

        it('should validate email formats correctly', () => {
            process.env.NODE_ENV = 'development';
            process.env.RESEND_FROM_EMAIL = 'invalid-email';

            expect(() => validateEnv()).toThrow();
        });

        it('should validate enum values correctly', () => {
            process.env.NODE_ENV = 'invalid-env';

            expect(() => validateEnv()).toThrow();
        });

        it('should handle ZodError properly', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_APP_URL = 'invalid-url';

            expect(() => validateEnv()).toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('❌ Environment validation failed:');

            consoleSpy.mockRestore();
        });
    });

    describe('environment helpers', () => {
        it('should correctly identify production environment', async () => {
            process.env.NODE_ENV = 'production';
            // Re-evaluate the env module
            jest.resetModules();
            const { isProduction } = await import('@/lib/utils/env-validation');
            expect(isProduction()).toBe(true);
        });

        it('should correctly identify development environment', async () => {
            process.env.NODE_ENV = 'development';
            jest.resetModules();
            const { isDevelopment } = await import('@/lib/utils/env-validation');
            expect(isDevelopment()).toBe(true);
        });

        it('should correctly identify test environment', async () => {
            process.env.NODE_ENV = 'test';
            jest.resetModules();
            const { isTest } = await import('@/lib/utils/env-validation');
            expect(isTest()).toBe(true);
        });
    });

    describe('feature flags', () => {
        it('should return correct feature flag values', () => {
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING = 'true';
            process.env.NEXT_PUBLIC_ENABLE_ERROR_TRACKING = 'false';
            process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'true';

            jest.resetModules();
            const { isFeatureEnabled } = await import('@/lib/utils/env-validation');

            expect(isFeatureEnabled.performanceMonitoring()).toBe(true);
            expect(isFeatureEnabled.errorTracking()).toBe(false);
            expect(isFeatureEnabled.analytics()).toBe(true);
        });

        it('should handle missing feature flags with defaults', () => {
            process.env.NODE_ENV = 'development';
            delete process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING;
            delete process.env.NEXT_PUBLIC_ENABLE_ERROR_TRACKING;

            jest.resetModules();
            const { isFeatureEnabled } = await import('@/lib/utils/env-validation');

            expect(isFeatureEnabled.performanceMonitoring()).toBe(false);
            expect(isFeatureEnabled.errorTracking()).toBe(false);
        });
    });

    describe('apiConfig', () => {
        it('should provide correct API configuration', () => {
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.example.com';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-123';
            process.env.NEXT_PUBLIC_GUMLOOP_API_KEY = 'gumloop-key-123';
            process.env.NEXT_PUBLIC_GUMLOOP_USER_ID = 'user-123';

            jest.resetModules();
            const { apiConfig } = await import('@/lib/utils/env-validation');

            expect(apiConfig.supabase.url).toBe('https://supabase.example.com');
            expect(apiConfig.supabase.anonKey).toBe('anon-key-123');
            expect(apiConfig.gumloop.apiKey).toBe('gumloop-key-123');
            expect(apiConfig.gumloop.userId).toBe('user-123');
        });

        it('should use default values for missing API config', () => {
            process.env.NODE_ENV = 'development';
            delete process.env.NEXT_PUBLIC_GUMLOOP_API_URL;
            delete process.env.NEXT_PUBLIC_CHUNKR_API_URL;

            jest.resetModules();
            const { apiConfig } = await import('@/lib/utils/env-validation');

            expect(apiConfig.gumloop.apiUrl).toBe('https://api.gumloop.com/api/v1');
            expect(apiConfig.chunkr.apiUrl).toBe('https://api.chunkr.ai/api/v1');
        });

        it('should handle missing optional API keys', () => {
            process.env.NODE_ENV = 'development';
            delete process.env.NEXT_PUBLIC_GUMLOOP_API_KEY;
            delete process.env.NEXT_PUBLIC_CHUNKR_API_KEY;

            jest.resetModules();
            const { apiConfig } = await import('@/lib/utils/env-validation');

            expect(apiConfig.gumloop.apiKey).toBeUndefined();
            expect(apiConfig.chunkr.apiKey).toBeUndefined();
        });

        it('should provide email configuration', () => {
            process.env.NODE_ENV = 'development';
            process.env.RESEND_API_KEY = 'resend-key-123';
            process.env.RESEND_FROM_EMAIL = 'test@example.com';
            process.env.ADMIN_EMAIL = 'admin@example.com';

            jest.resetModules();
            const { apiConfig } = await import('@/lib/utils/env-validation');

            expect(apiConfig.email.apiKey).toBe('resend-key-123');
            expect(apiConfig.email.fromEmail).toBe('test@example.com');
            expect(apiConfig.email.adminEmail).toBe('admin@example.com');
        });

        it('should use default email values when missing', () => {
            process.env.NODE_ENV = 'development';
            delete process.env.RESEND_FROM_EMAIL;
            delete process.env.ADMIN_EMAIL;

            jest.resetModules();
            const { apiConfig } = await import('@/lib/utils/env-validation');

            expect(apiConfig.email.fromEmail).toBe('noreply@atoms.tech');
            expect(apiConfig.email.adminEmail).toBe('admin@atoms.tech');
        });
    });

    describe('buildConfig', () => {
        it('should provide correct build configuration', () => {
            process.env.NODE_ENV = 'production';
            process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
            process.env.LOG_LEVEL = 'error';

            jest.resetModules();
            const { buildConfig } = await import('@/lib/utils/env-validation');

            expect(buildConfig.appUrl).toBe('https://example.com');
            expect(buildConfig.isProduction).toBe(true);
            expect(buildConfig.isDevelopment).toBe(false);
            expect(buildConfig.logLevel).toBe('error');
        });

        it('should handle default build config values', () => {
            process.env.NODE_ENV = 'development';
            delete process.env.NEXT_PUBLIC_APP_URL;
            delete process.env.LOG_LEVEL;

            jest.resetModules();
            const { buildConfig } = await import('@/lib/utils/env-validation');

            expect(buildConfig.appUrl).toBe('http://localhost:3000');
            expect(buildConfig.isProduction).toBe(false);
            expect(buildConfig.isDevelopment).toBe(true);
            expect(buildConfig.logLevel).toBe('info');
        });
    });

    describe('checkRequiredEnvVars', () => {
        it('should return true when all required vars are present', () => {
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.example.com';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-123';

            const result = checkRequiredEnvVars();

            expect(result).toBe(true);
        });

        it('should return false when required vars are missing', () => {
            delete process.env.NEXT_PUBLIC_SUPABASE_URL;
            delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = checkRequiredEnvVars();

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Missing required environment variables:',
                ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
            );

            consoleSpy.mockRestore();
        });

        it('should return false when only some required vars are present', () => {
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.example.com';
            delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = checkRequiredEnvVars();

            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Missing required environment variables:',
                ['NEXT_PUBLIC_SUPABASE_ANON_KEY']
            );

            consoleSpy.mockRestore();
        });
    });

    describe('edge cases', () => {
        it('should handle empty string values', () => {
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_SUPABASE_URL = '';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';

            expect(() => validateEnv()).toThrow();
        });

        it('should handle whitespace-only values', () => {
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_SUPABASE_URL = '   ';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '\t\n';

            expect(() => validateEnv()).toThrow();
        });

        it('should handle very long values', () => {
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'a'.repeat(10000);

            expect(() => validateEnv()).not.toThrow();
        });

        it('should handle special characters in values', () => {
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com/path?query=value&other=value';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'key-with-special-chars!@#$%^&*()';

            expect(() => validateEnv()).not.toThrow();
        });

        it('should handle unicode characters in values', () => {
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'key-with-unicode-测试';

            expect(() => validateEnv()).not.toThrow();
        });

        it('should handle production validation with safe parsing fallback', () => {
            process.env.NODE_ENV = 'production';
            process.env.NEXT_PUBLIC_APP_URL = 'invalid-url';

            const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit called');
            });

            expect(() => validateEnv()).toThrow();
            expect(mockExit).toHaveBeenCalledWith(1);

            mockExit.mockRestore();
        });
    });

    describe('production schema validation', () => {
        it('should require all production-specific variables', () => {
            process.env.NODE_ENV = 'production';
            process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
            // Missing required production vars

            const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit called');
            });

            expect(() => validateEnv()).toThrow();
            expect(mockExit).toHaveBeenCalledWith(1);

            mockExit.mockRestore();
        });

        it('should validate minimum length requirements in production', () => {
            process.env.NODE_ENV = 'production';
            process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
            process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.example.com';
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''; // Empty key
            process.env.NEXT_PUBLIC_GUMLOOP_API_KEY = 'gumloop-key-123';
            process.env.NEXT_PUBLIC_GUMLOOP_USER_ID = 'user-123';
            process.env.NEXT_PUBLIC_CHUNKR_API_KEY = 'chunkr-key-123';
            process.env.RESEND_API_KEY = 'resend-key-123';

            const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
                throw new Error('process.exit called');
            });

            expect(() => validateEnv()).toThrow();
            expect(mockExit).toHaveBeenCalledWith(1);

            mockExit.mockRestore();
        });
    });

    describe('logging configuration', () => {
        it('should validate log level enum values', () => {
            process.env.NODE_ENV = 'development';
            process.env.LOG_LEVEL = 'invalid-level';

            expect(() => validateEnv()).toThrow();
        });

        it('should accept valid log levels', () => {
            const validLevels = ['debug', 'info', 'warn', 'error'];

            validLevels.forEach(level => {
                process.env.NODE_ENV = 'development';
                process.env.LOG_LEVEL = level;

                expect(() => validateEnv()).not.toThrow();
            });
        });

        it('should handle logging feature flags', () => {
            process.env.NODE_ENV = 'development';
            process.env.ENABLE_REQUEST_LOGGING = 'true';
            process.env.ENABLE_DEBUG_LOGGING = 'false';

            jest.resetModules();
            const { isFeatureEnabled } = await import('@/lib/utils/env-validation');

            expect(isFeatureEnabled.requestLogging()).toBe(true);
            expect(isFeatureEnabled.debugLogging()).toBe(false);
        });
    });

    describe('flow configuration', () => {
        it('should handle all Gumloop flow IDs', () => {
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_GUMLOOP_FILE_CONVERT_FLOW_ID = 'flow-1';
            process.env.NEXT_PUBLIC_GUMLOOP_REQ_ANALYSIS_FLOW_ID = 'flow-2';
            process.env.NEXT_PUBLIC_GUMLOOP_REQ_ANALYSIS_REASONING_FLOW_ID = 'flow-3';
            process.env.NEXT_PUBLIC_GUMLOOP_TEXT_TO_MERMAID_FLOW_ID = 'flow-4';

            jest.resetModules();
            const { apiConfig } = await import('@/lib/utils/env-validation');

            expect(apiConfig.gumloop.flows.fileConvert).toBe('flow-1');
            expect(apiConfig.gumloop.flows.reqAnalysis).toBe('flow-2');
            expect(apiConfig.gumloop.flows.reqAnalysisReasoning).toBe('flow-3');
            expect(apiConfig.gumloop.flows.textToMermaid).toBe('flow-4');
        });

        it('should handle missing flow IDs gracefully', () => {
            process.env.NODE_ENV = 'development';
            delete process.env.NEXT_PUBLIC_GUMLOOP_FILE_CONVERT_FLOW_ID;
            delete process.env.NEXT_PUBLIC_GUMLOOP_REQ_ANALYSIS_FLOW_ID;

            jest.resetModules();
            const { apiConfig } = await import('@/lib/utils/env-validation');

            expect(apiConfig.gumloop.flows.fileConvert).toBeUndefined();
            expect(apiConfig.gumloop.flows.reqAnalysis).toBeUndefined();
        });
    });

    describe('N8N configuration', () => {
        it('should handle N8N webhook URL', () => {
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL = 'https://n8n.example.com/webhook';

            jest.resetModules();
            const { apiConfig } = await import('@/lib/utils/env-validation');

            expect(apiConfig.n8n.webhookUrl).toBe('https://n8n.example.com/webhook');
        });

        it('should handle missing N8N webhook URL', () => {
            process.env.NODE_ENV = 'development';
            delete process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

            jest.resetModules();
            const { apiConfig } = await import('@/lib/utils/env-validation');

            expect(apiConfig.n8n.webhookUrl).toBeUndefined();
        });

        it('should validate N8N webhook URL format', () => {
            process.env.NODE_ENV = 'development';
            process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL = 'invalid-url';

            expect(() => validateEnv()).toThrow();
        });
    });
});