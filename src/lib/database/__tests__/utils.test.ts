import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    generateTokenKey,
    getSupabaseConfig,
    getSupabaseServiceRoleConfig,
    isBuildTime,
    isProduction,
    isServer,
} from '@/lib/database/utils';

describe('Database Utils', () => {
    describe('generateTokenKey', () => {
        it('should generate token key from valid token', () => {
            const token = 'abc-123-def-456';
            const result = generateTokenKey(token);
            expect(result).toBe('abc123def456');
        });

        it('should remove all special characters', () => {
            const token = 'a!b@c#1$2%3^d&e*f(4)5-6_+';
            const result = generateTokenKey(token);
            expect(result).toBe('abc123def456');
        });

        it('should limit to 16 characters', () => {
            const token = 'a'.repeat(50);
            const result = generateTokenKey(token);
            expect(result).toHaveLength(16);
        });

        it('should return "token" for empty string', () => {
            const result = generateTokenKey('');
            expect(result).toBe('token');
        });

        it('should return "token" for string with only special characters', () => {
            const result = generateTokenKey('!@#$%^&*()');
            expect(result).toBe('token');
        });

        it('should preserve alphanumeric characters', () => {
            const token = 'Test123Token456';
            const result = generateTokenKey(token);
            expect(result).toBe('Test123Token456');
        });
    });

    describe('getSupabaseConfig', () => {
        beforeEach(() => {
            vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
            vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
        });

        it('should return config when env vars are set', () => {
            const config = getSupabaseConfig();
            expect(config).toEqual({
                url: 'https://test.supabase.co',
                key: 'test-anon-key',
            });
        });

        it('should throw when URL is missing', () => {
            vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', undefined);
            expect(() => getSupabaseConfig()).toThrow('Missing Supabase configuration');
        });

        it('should throw when key is missing', () => {
            vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', undefined);
            expect(() => getSupabaseConfig()).toThrow('Missing Supabase configuration');
        });

        it('should throw when both are missing', () => {
            vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', undefined);
            vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', undefined);
            expect(() => getSupabaseConfig()).toThrow('Missing Supabase configuration');
        });
    });

    describe('getSupabaseServiceRoleConfig', () => {
        beforeEach(() => {
            vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
            vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
        });

        it('should return config when env vars are set', () => {
            const config = getSupabaseServiceRoleConfig();
            expect(config).toEqual({
                url: 'https://test.supabase.co',
                key: 'test-service-key',
            });
        });

        it('should return null when URL is missing', () => {
            vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', undefined);
            const config = getSupabaseServiceRoleConfig();
            expect(config).toBeNull();
        });

        it('should return null when service key is missing', () => {
            vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', undefined);
            const config = getSupabaseServiceRoleConfig();
            expect(config).toBeNull();
        });

        it('should return null when both are missing', () => {
            vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', undefined);
            vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', undefined);
            const config = getSupabaseServiceRoleConfig();
            expect(config).toBeNull();
        });
    });

    describe('isServer', () => {
        it('should return false in test environment (happy-dom)', () => {
            // happy-dom simulates a browser environment, so window is defined
            expect(isServer()).toBe(false);
        });
    });

    describe('isProduction', () => {
        it('should return false in test environment', () => {
            expect(isProduction()).toBe(false);
        });

        it('should return true when NODE_ENV is production', () => {
            vi.stubEnv('NODE_ENV', 'production');
            expect(isProduction()).toBe(true);
        });
    });

    describe('isBuildTime', () => {
        it('should return true when NEXT_PHASE is phase-production-build', () => {
            vi.stubEnv('NEXT_PHASE', 'phase-production-build');
            const result = isBuildTime();
            expect(result).toBe(true);
        });

        it('should return true when NODE_ENV is not production', () => {
            vi.stubEnv('NODE_ENV', 'development');
            const result = isBuildTime();
            expect(result).toBe(true);
        });

        it('should return true when WORKOS_CLIENT_ID is not set', () => {
            vi.stubEnv('WORKOS_CLIENT_ID', undefined);
            const result = isBuildTime();
            expect(result).toBe(true);
        });
    });
});

