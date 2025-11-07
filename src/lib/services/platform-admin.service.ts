import type { SupabaseClient } from '@supabase/supabase-js';

import { getServiceRoleClient } from '@/lib/database';
import type { Database, Json } from '@/types/base/database.types';

type PlatformAdmin = Database['public']['Tables']['platform_admins']['Row'];
type PlatformAdminInsert = Database['public']['Tables']['platform_admins']['Insert'];
type PlatformAdminUpdate = Database['public']['Tables']['platform_admins']['Update'];
type AdminAuditLogInsert = Database['public']['Tables']['admin_audit_log']['Insert'];

export interface PlatformAdminService {
    isPlatformAdmin(workosUserId: string): Promise<boolean>;
    addAdmin(workosUserId: string, email: string, name?: string, addedBy?: string): Promise<PlatformAdmin>;
    removeAdmin(email: string, removedBy: string): Promise<void>;
    listAdmins(): Promise<PlatformAdmin[]>;
    logAuditEvent(adminId: string, action: string, targetOrgId?: string, targetUserId?: string, details?: Record<string, unknown>): Promise<void>;
}

export class PlatformAdminServiceImpl implements PlatformAdminService {
    private supabase = getServiceRoleClient();

    private getClient(): SupabaseClient<Database> | null {
        return this.supabase;
    }

    async isPlatformAdmin(workosUserId: string): Promise<boolean> {
        const client = this.getClient();
        if (!client) {
            console.warn('Supabase service role client unavailable');
            return false;
        }

        const { data, error } = await client
            .from('platform_admins')
            .select('id')
            .eq('workos_user_id', workosUserId)
            .eq('is_active', true)
            .maybeSingle();

        if (error) {
            console.error('Failed to check platform admin status:', error);
            return false;
        }

        return !!data;
    }

    async addAdmin(workosUserId: string, email: string, name?: string, addedByWorkosId?: string): Promise<PlatformAdmin> {
        const client = this.getClient();
        if (!client) {
            throw new Error('Supabase service role client unavailable');
        }

        // If addedBy is provided, look up their platform_admin UUID
        let addedByUuid: string | null = null;
        if (addedByWorkosId) {
            const { data: addedByAdmin } = await client
                .from('platform_admins')
                .select('id')
                .eq('workos_user_id', addedByWorkosId)
                .eq('is_active', true)
                .maybeSingle();

            addedByUuid = addedByAdmin?.id || null;
        }

        const insertData: PlatformAdminInsert = {
            workos_user_id: workosUserId,
            email,
            name: name || null,
            added_by: addedByUuid,
            is_active: true,
        };

        const { data, error } = await client
            .from('platform_admins')
            .insert(insertData)
            .select('*')
            .single();

        if (error) {
            console.error('Failed to add platform admin:', error);
            throw new Error(`Failed to add platform admin: ${error.message}`);
        }

        // Log audit event using the UUID we just created
        if (addedByUuid) {
            await this.logAuditEvent(addedByUuid, 'added_admin', undefined, workosUserId, {
                email,
                name: name || null,
            });
        }

        return data as PlatformAdmin;
    }

    async removeAdmin(email: string, removedByWorkosId: string): Promise<void> {
        const client = this.getClient();
        if (!client) {
            throw new Error('Supabase service role client unavailable');
        }

        // First get the admin to be removed for audit logging
        const { data: adminToRemove, error: fetchError } = await client
            .from('platform_admins')
            .select('id, workos_user_id')
            .eq('email', email)
            .eq('is_active', true)
            .maybeSingle();

        if (fetchError) {
            console.error('Failed to fetch admin for removal:', fetchError);
            throw new Error(`Failed to fetch admin: ${fetchError.message}`);
        }

        if (!adminToRemove) {
            throw new Error('Admin not found');
        }

        // Look up the UUID of the admin who is removing
        const { data: removedByAdmin } = await client
            .from('platform_admins')
            .select('id')
            .eq('workos_user_id', removedByWorkosId)
            .eq('is_active', true)
            .maybeSingle();

        // Deactivate the admin
        const { error } = await client
            .from('platform_admins')
            .update({ is_active: false, updated_at: new Date().toISOString() } satisfies PlatformAdminUpdate)
            .eq('email', email);

        if (error) {
            console.error('Failed to remove platform admin:', error);
            throw new Error(`Failed to remove platform admin: ${error.message}`);
        }

        // Log audit event using the UUID (only if we found the admin)
        if (removedByAdmin?.id) {
            await this.logAuditEvent(removedByAdmin.id, 'removed_admin', undefined, adminToRemove.workos_user_id || undefined, {
                email,
            });
        }
    }

    async listAdmins(): Promise<PlatformAdmin[]> {
        const client = this.getClient();
        if (!client) {
            throw new Error('Supabase service role client unavailable');
        }

        const { data, error } = await client
            .from('platform_admins')
            .select('*')
            .eq('is_active', true)
            .order('added_at', { ascending: false });

        if (error) {
            console.error('Failed to list platform admins:', error);
            throw new Error(`Failed to list platform admins: ${error.message}`);
        }

        return data || [];
    }

    async logAuditEvent(
        adminId: string,
        action: string,
        targetOrgId?: string,
        targetUserId?: string,
        details?: Record<string, unknown>
    ): Promise<void> {
        try {
            const client = this.getClient();
            if (!client) {
                console.warn('Supabase service role client unavailable - cannot log audit event');
                return;
            }

            const payload: AdminAuditLogInsert = {
                admin_id: adminId,
                action,
                target_org_id: targetOrgId || null,
                target_user_id: targetUserId || null,
                details: (details ?? null) as Json | null,
            };

            const { error } = await client.from('admin_audit_log').insert(payload);

            if (error) {
                console.error('Failed to log audit event:', error);
                // Don't throw here as audit logging is not critical
            }
        } catch (err) {
            // Catch any unexpected errors to prevent audit logging from breaking the main flow
            console.error('Unexpected error logging audit event:', err);
        }
    }
}

// Singleton instance
export const platformAdminService = new PlatformAdminServiceImpl();
