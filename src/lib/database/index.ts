/**
 * Database Module
 *
 * Centralized exports for all database-related functionality
 */

// Client factory functions
export {
    createBrowserClientWithToken,
    createServerClient,
    createServerClientWithToken,
    getBrowserClient,
    getServiceRoleClient,
} from './client-factory';

// Utility functions
export {
    generateTokenKey,
    getSupabaseConfig,
    getSupabaseServiceRoleConfig,
    isBuildTime,
    isProduction,
    isServer,
} from './utils';

// Type exports
export type { Database } from '@/types/base/database.types';

