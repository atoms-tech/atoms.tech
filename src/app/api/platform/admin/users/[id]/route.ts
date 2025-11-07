import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getServiceRoleClient } from '@/lib/database';
import { platformAdminService } from '@/lib/services/platform-admin.service';
import { logger } from '@/lib/utils/logger';

const PLATFORM_ADMIN_ORG_ID = 'org_01K8AMGAVF7ME7XQCP6S5J5B2Q';

/**
 * DELETE /api/platform/admin/users/[id]
 * 
 * Soft delete a user (mark as deleted)
 * Only accessible by platform admins
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user, organizationId, role } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Check if user is platform admin
        const isInPlatformAdminOrg = organizationId === PLATFORM_ADMIN_ORG_ID && (role === 'admin' || role === 'member');
        const isInDatabase = await platformAdminService.isPlatformAdmin(user.id);
        const isPlatformAdmin = isInPlatformAdminOrg || isInDatabase;

        if (!isPlatformAdmin) {
            return NextResponse.json({ error: 'Forbidden: Platform admin required' }, { status: 403 });
        }

        const { id } = await params;
        const supabase = getServiceRoleClient();

        // Get user info before deletion
        const { data: userToDelete, error: fetchError } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', id)
            .single();

        if (fetchError || !userToDelete) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Soft delete the user
        const { error: deleteError } = await supabase
            .from('profiles')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: user.id,
                status: 'suspended',
            })
            .eq('id', id);

        if (deleteError) {
            logger.error('Failed to delete user', deleteError, {
                route: '/api/platform/admin/users/[id]',
                userId: id,
            });
            return NextResponse.json({ 
                error: 'Failed to delete user',
                details: deleteError.message 
            }, { status: 500 });
        }

        logger.info('User deleted', {
            route: '/api/platform/admin/users/[id]',
            deletedUserId: id,
            deletedUserEmail: userToDelete.email,
            deletedBy: user.email,
        });

        return NextResponse.json({
            message: 'User deleted successfully',
            user: {
                id,
                email: userToDelete.email,
                name: userToDelete.full_name,
            },
        });
    } catch (error) {
        logger.error('Error deleting user', error, {
            route: '/api/platform/admin/users/[id]',
        });
        return NextResponse.json(
            {
                error: 'Failed to delete user',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/platform/admin/users/[id]
 * 
 * Update user status or approval
 * Only accessible by platform admins
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user, organizationId, role } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Check if user is platform admin
        const isInPlatformAdminOrg = organizationId === PLATFORM_ADMIN_ORG_ID && (role === 'admin' || role === 'member');
        const isInDatabase = await platformAdminService.isPlatformAdmin(user.id);
        const isPlatformAdmin = isInPlatformAdminOrg || isInDatabase;

        if (!isPlatformAdmin) {
            return NextResponse.json({ error: 'Forbidden: Platform admin required' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status: newStatus, is_approved } = body;

        const supabase = getServiceRoleClient();
        const updates: any = {};

        if (newStatus) {
            updates.status = newStatus;
        }

        if (typeof is_approved === 'boolean') {
            updates.is_approved = is_approved;
        }

        const { data: updatedUser, error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select('id, email, full_name, status, is_approved')
            .single();

        if (updateError) {
            logger.error('Failed to update user', updateError, {
                route: '/api/platform/admin/users/[id]',
                userId: id,
            });
            return NextResponse.json({ 
                error: 'Failed to update user',
                details: updateError.message 
            }, { status: 500 });
        }

        return NextResponse.json({
            message: 'User updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        logger.error('Error updating user', error, {
            route: '/api/platform/admin/users/[id]',
        });
        return NextResponse.json(
            {
                error: 'Failed to update user',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

