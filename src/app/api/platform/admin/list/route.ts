import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { platformAdminService } from '@/lib/services/platform-admin.service';

const PLATFORM_ADMIN_ORG_ID = 'org_01K8AMGAVF7ME7XQCP6S5J5B2Q';

/**
 * GET /api/platform/admin/list
 * 
 * Lists all platform admins
 * Requires platform admin access
 */
export async function GET(_request: NextRequest) {
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

        const admins = await platformAdminService.listAdmins();

        return NextResponse.json({
            admins,
            total: admins.length,
        });
    } catch (error) {
        console.error('Error listing platform admins:', error);
        return NextResponse.json(
            {
                error: 'Failed to list platform admins',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}