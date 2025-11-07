import { z } from 'zod';

/**
 * User-initiated MCP server install schema
 * Simplified form for regular users with limited transport and auth options
 */
export const userInstallSchema = z
    .object({
        name: z.string().min(1, 'Server name is required').max(100, 'Name too long'),
        url: z.string().url('Must be a valid URL'),
        transport: z.enum(['sse', 'http'], {
            required_error: 'Please select a transport type',
        }),
        auth: z.enum(['bearer', 'oauth', 'none'], {
            required_error: 'Please select an auth method',
        }),
        token: z.string().optional(),
        scope: z.enum(['user', 'organization']),
        organization_id: z.string().uuid().optional(),
    })
    .refine(
        (data) => {
            // If auth is bearer, token is required
            if (data.auth === 'bearer' && !data.token) {
                return false;
            }
            return true;
        },
        {
            message: 'Token is required for Bearer authentication',
            path: ['token'],
        }
    )
    .refine(
        (data) => {
            // If scope is organization, organization_id is required
            if (data.scope === 'organization' && !data.organization_id) {
                return false;
            }
            return true;
        },
        {
            message: 'Organization is required for organization scope',
            path: ['organization_id'],
        }
    );

export type UserInstallForm = z.infer<typeof userInstallSchema>;

/**
 * Admin-initiated MCP server install schema
 * Full form with all transport types, auth methods, and advanced options
 */
export const adminInstallSchema = z
    .object({
        name: z.string().min(1, 'Server name is required').max(100, 'Name too long'),
        url: z.string().url('Must be a valid URL'),
        transport: z.enum(['stdio', 'sse', 'http'], {
            required_error: 'Please select a transport type',
        }),
        auth: z.enum(['bearer', 'oauth', 'none', 'api_key'], {
            required_error: 'Please select an auth method',
        }),
        token: z.string().optional(),
        scope: z.enum(['user', 'organization', 'system']),
        organization_id: z.string().uuid().optional(),
        env_vars: z.record(z.string()).optional(),
        custom_config: z.record(z.any()).optional(),
        command: z.string().optional(), // For stdio transport
        args: z.array(z.string()).optional(), // For stdio transport
    })
    .refine(
        (data) => {
            // If auth is bearer or api_key, token is required
            if ((data.auth === 'bearer' || data.auth === 'api_key') && !data.token) {
                return false;
            }
            return true;
        },
        {
            message: 'Token is required for Bearer/API Key authentication',
            path: ['token'],
        }
    )
    .refine(
        (data) => {
            // If scope is organization, organization_id is required
            if (data.scope === 'organization' && !data.organization_id) {
                return false;
            }
            return true;
        },
        {
            message: 'Organization is required for organization scope',
            path: ['organization_id'],
        }
    )
    .refine(
        (data) => {
            // If transport is stdio, command is required
            if (data.transport === 'stdio' && !data.command) {
                return false;
            }
            return true;
        },
        {
            message: 'Command is required for stdio transport',
            path: ['command'],
        }
    );

export type AdminInstallForm = z.infer<typeof adminInstallSchema>;

/**
 * Tool permissions schema
 */
export const permissionLevelSchema = z.enum([
    'always_allow',
    'always_deny',
    'prompt',
    'agent_decided',
]);

export type PermissionLevel = z.infer<typeof permissionLevelSchema>;

export const toolPermissionsSchema = z.record(permissionLevelSchema);

export type ToolPermissions = z.infer<typeof toolPermissionsSchema>;

/**
 * Server health schema
 */
export const serverHealthSchema = z.object({
    status: z.enum(['running', 'starting', 'stopped', 'error', 'unknown']),
    last_check: z.string().datetime(),
    error: z.string().optional(),
});

export type ServerHealth = z.infer<typeof serverHealthSchema>;

/**
 * Server log schema
 */
export const serverLogSchema = z.object({
    id: z.string().uuid(),
    level: z.enum(['debug', 'info', 'warn', 'error']),
    message: z.string(),
    metadata: z.record(z.any()),
    created_at: z.string().datetime(),
});

export type ServerLog = z.infer<typeof serverLogSchema>;

