import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { platformAdminService } from '@/lib/services/platform-admin.service';

const PLATFORM_ADMIN_ORG_ID = 'org_01K8AMGAVF7ME7XQCP6S5J5B2Q';

/**
 * DELETE /api/platform/admin/remove
 * 
 * Removes a user from platform admin
 * Requires platform admin access
 */
export async function DELETE(request: NextRequest) {
    try {
        const { user, organizationId, role } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Check if user is platform admin
        const isInPlatformAdminOrg = organizationId === PLATFORM_ADMIN_ORG_ID && role === 'admin';
        const isInDatabase = await platformAdminService.isPlatformAdmin(user.id);
        const isPlatformAdmin = isInPlatformAdminOrg || isInDatabase;

        if (!isPlatformAdmin) {
            return NextResponse.json({ error: 'Forbidden: Platform admin required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json(
                { error: 'Missing required parameter: email' },
                { status: 400 }
            );
        }

        await platformAdminService.removeAdmin(email, user.id);

        return NextResponse.json({
            success: true,
            message: 'Platform admin removed successfully',
        });
    } catch (error) {
        console.error('Error removing platform admin:', error);
        return NextResponse.json(
            {
                error: 'Failed to remove platform admin',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}