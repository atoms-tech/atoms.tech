/**
 * Database Utilities
 *
 * Shared utilities for database operations and client configuration
 */

/**
 * Generate a safe token key for storage
 * Removes special characters and limits to 16 characters
 *
 * @param token - The token to generate a key from
 * @returns A safe storage key
 *
 * @example
 * generateTokenKey('abc-123-def-456') // 'abc123def456'
 * generateTokenKey('') // 'token'
 */
export function generateTokenKey(token: string): string {
    const sanitized = token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    return sanitized || 'token';
}

/**
 * Get Supabase configuration from environment variables
 *
 * @throws {Error} If required environment variables are missing
 * @returns Supabase URL and anon key
 */
export function getSupabaseConfig(): { url: string; key: string } {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error(
            'Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.',
        );
    }

    return { url, key };
}

/**
 * Get Supabase service role configuration
 *
 * @returns Service role URL and key, or null if not configured
 */
export function getSupabaseServiceRoleConfig(): { url: string; key: string } | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        return null;
    }

    return { url, key: serviceKey };
}

/**
 * Check if code is running on the server
 */
export function isServer(): boolean {
    return typeof window === 'undefined';
}

/**
 * Check if code is running in production
 */
export function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
}

/**
 * Check if code is running during build time
 */
export function isBuildTime(): boolean {
    return (
        process.env.NEXT_PHASE === 'phase-production-build' ||
        process.env.NODE_ENV !== 'production' ||
        !process.env.WORKOS_CLIENT_ID
    );
}

