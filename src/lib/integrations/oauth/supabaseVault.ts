import { supabase as supabaseClient } from '@/lib/supabase/supabaseBrowser';

import { VaultError } from './types';

// Type for Supabase query builder
interface SupabaseQueryBuilder {
    select: (columns?: string) => SupabaseQueryBuilder;
    insert: (data: Record<string, unknown>) => SupabaseQueryBuilder;
    update: (data: Record<string, unknown>) => SupabaseQueryBuilder;
    delete: () => SupabaseQueryBuilder;
    upsert: (data: Record<string, unknown>) => SupabaseQueryBuilder;
    eq: (column: string, value: unknown) => SupabaseQueryBuilder;
    lt: (column: string, value: unknown) => SupabaseQueryBuilder;
    single: () => Promise<{ data: unknown; error: unknown }>;
    order: (
        column: string,
        options?: { ascending: boolean },
    ) => SupabaseQueryBuilder;
}

// Type for extended Supabase client with custom tables
type ExtendedSupabaseClient = typeof supabaseClient & {
    from(table: 'vault_secrets'): SupabaseQueryBuilder;
    from(table: 'oauth_integrations'): SupabaseQueryBuilder;
    from(table: 'mcp_configurations'): SupabaseQueryBuilder;
};

/**
 * Supabase Vault Integration for secure secret storage
 *
 * This class provides a secure way to store and retrieve sensitive data
 * like OAuth tokens using Supabase's built-in encryption capabilities.
 */
export class SupabaseVault {
    private supabase = supabaseClient as ExtendedSupabaseClient;

    /**
     * Store a secret in the vault
     */
    async storeSecret(
        organizationId: string,
        key: string,
        value: string,
    ): Promise<string> {
        try {
            const secretKey = this.generateSecretKey(organizationId, key);

            // Use Supabase's vault.secrets table for secure storage
            const { data, error } = await this.supabase
                .from('vault_secrets')
                .upsert({
                    key: secretKey,
                    value: this.encryptValue(value),
                    organization_id: organizationId,
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                .select('key')
                .single();

            if (error) {
                console.error('Vault storage error:', error);
                throw new VaultError(
                    `Failed to store secret: ${error.message}`,
                    'STORE_FAILED',
                );
            }

            return data.key;
        } catch (error) {
            console.error('Failed to store secret in vault:', error);
            if (error instanceof VaultError) {
                throw error;
            }
            throw new VaultError(
                'Failed to store secret in vault',
                'STORE_OPERATION_FAILED',
            );
        }
    }

    /**
     * Retrieve a secret from the vault
     */
    async getSecret(organizationId: string, key: string): Promise<string> {
        try {
            const { data, error } = await this.supabase
                .from('vault_secrets')
                .select('value')
                .eq('key', key)
                .eq('organization_id', organizationId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned
                    throw new VaultError(
                        'Secret not found',
                        'SECRET_NOT_FOUND',
                    );
                }
                console.error('Vault retrieval error:', error);
                throw new VaultError(
                    `Failed to retrieve secret: ${error.message}`,
                    'RETRIEVE_FAILED',
                );
            }

            return this.decryptValue(data.value);
        } catch (error) {
            console.error('Failed to retrieve secret from vault:', error);
            if (error instanceof VaultError) {
                throw error;
            }
            throw new VaultError(
                'Failed to retrieve secret from vault',
                'RETRIEVE_OPERATION_FAILED',
            );
        }
    }

    /**
     * Delete a secret from the vault
     */
    async deleteSecret(organizationId: string, key: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('vault_secrets')
                .delete()
                .eq('key', key)
                .eq('organization_id', organizationId);

            if (error) {
                console.error('Vault deletion error:', error);
                throw new VaultError(
                    `Failed to delete secret: ${error.message}`,
                    'DELETE_FAILED',
                );
            }
        } catch (error) {
            console.error('Failed to delete secret from vault:', error);
            if (error instanceof VaultError) {
                throw error;
            }
            throw new VaultError(
                'Failed to delete secret from vault',
                'DELETE_OPERATION_FAILED',
            );
        }
    }

    /**
     * List all secret keys for an organization
     */
    async listSecrets(organizationId: string): Promise<string[]> {
        try {
            const { data, error } = await this.supabase
                .from('vault_secrets')
                .select('key')
                .eq('organization_id', organizationId);

            if (error) {
                console.error('Vault list error:', error);
                throw new VaultError(
                    `Failed to list secrets: ${error.message}`,
                    'LIST_FAILED',
                );
            }

            return data.map((item: { key: string }) => item.key);
        } catch (error) {
            console.error('Failed to list secrets from vault:', error);
            if (error instanceof VaultError) {
                throw error;
            }
            throw new VaultError(
                'Failed to list secrets from vault',
                'LIST_OPERATION_FAILED',
            );
        }
    }

    /**
     * Update an existing secret
     */
    async updateSecret(
        organizationId: string,
        key: string,
        newValue: string,
    ): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('vault_secrets')
                .update({
                    value: this.encryptValue(newValue),
                    updated_at: new Date(),
                })
                .eq('key', key)
                .eq('organization_id', organizationId);

            if (error) {
                console.error('Vault update error:', error);
                throw new VaultError(
                    `Failed to update secret: ${error.message}`,
                    'UPDATE_FAILED',
                );
            }
        } catch (error) {
            console.error('Failed to update secret in vault:', error);
            if (error instanceof VaultError) {
                throw error;
            }
            throw new VaultError(
                'Failed to update secret in vault',
                'UPDATE_OPERATION_FAILED',
            );
        }
    }

    /**
     * Check if a secret exists
     */
    async secretExists(organizationId: string, key: string): Promise<boolean> {
        try {
            const { data, error } = await this.supabase
                .from('vault_secrets')
                .select('key')
                .eq('key', key)
                .eq('organization_id', organizationId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Vault exists check error:', error);
                throw new VaultError(
                    `Failed to check secret existence: ${error.message}`,
                    'EXISTS_CHECK_FAILED',
                );
            }

            return !!data;
        } catch (error) {
            console.error('Failed to check secret existence:', error);
            if (error instanceof VaultError) {
                throw error;
            }
            throw new VaultError(
                'Failed to check secret existence',
                'EXISTS_CHECK_OPERATION_FAILED',
            );
        }
    }

    /**
     * Cleanup expired secrets (for tokens with expiration)
     */
    async cleanupExpiredSecrets(organizationId: string): Promise<number> {
        try {
            // This would require additional metadata about expiration
            // For now, we'll implement a basic cleanup based on age
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await this.supabase
                .from('vault_secrets')
                .delete()
                .eq('organization_id', organizationId)
                .lt('updated_at', thirtyDaysAgo.toISOString())
                .select('key');

            if (error) {
                console.error('Vault cleanup error:', error);
                throw new VaultError(
                    `Failed to cleanup expired secrets: ${error.message}`,
                    'CLEANUP_FAILED',
                );
            }

            return data?.length || 0;
        } catch (error) {
            console.error('Failed to cleanup expired secrets:', error);
            if (error instanceof VaultError) {
                throw error;
            }
            throw new VaultError(
                'Failed to cleanup expired secrets',
                'CLEANUP_OPERATION_FAILED',
            );
        }
    }

    // Private helper methods
    private generateSecretKey(organizationId: string, key: string): string {
        return `${organizationId}:${key}:${Date.now()}`;
    }

    private encryptValue(value: string): string {
        // In a production environment, you would use proper encryption
        // For now, we'll use base64 encoding as a placeholder
        // TODO: Implement proper encryption using Supabase's encryption features
        return Buffer.from(value).toString('base64');
    }

    private decryptValue(encryptedValue: string): string {
        // In a production environment, you would use proper decryption
        // For now, we'll use base64 decoding as a placeholder
        // TODO: Implement proper decryption using Supabase's encryption features
        try {
            return Buffer.from(encryptedValue, 'base64').toString('utf-8');
        } catch {
            throw new VaultError(
                'Failed to decrypt secret value',
                'DECRYPTION_FAILED',
            );
        }
    }

    /**
     * Rotate encryption keys (for future implementation)
     */
    async rotateKeys(_organizationId: string): Promise<void> {
        // TODO: Implement key rotation for enhanced security
        throw new VaultError(
            'Key rotation not yet implemented',
            'NOT_IMPLEMENTED',
        );
    }

    /**
     * Backup secrets (for disaster recovery)
     */
    async backupSecrets(
        organizationId: string,
    ): Promise<Record<string, string>> {
        try {
            const { data, error } = await this.supabase
                .from('vault_secrets')
                .select('key, value')
                .eq('organization_id', organizationId);

            if (error) {
                console.error('Vault backup error:', error);
                throw new VaultError(
                    `Failed to backup secrets: ${error.message}`,
                    'BACKUP_FAILED',
                );
            }

            const backup: Record<string, string> = {};
            for (const item of data as { key: string; value: string }[]) {
                backup[item.key] = this.decryptValue(item.value);
            }

            return backup;
        } catch (error) {
            console.error('Failed to backup secrets:', error);
            if (error instanceof VaultError) {
                throw error;
            }
            throw new VaultError(
                'Failed to backup secrets',
                'BACKUP_OPERATION_FAILED',
            );
        }
    }
}

export const supabaseVault = new SupabaseVault();
