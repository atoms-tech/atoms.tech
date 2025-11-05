import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { platformAdminService } from '@/lib/services/platform-admin.service';

const PLATFORM_ADMIN_ORG_ID = 'org_01K8AMGAVF7ME7XQCP6S5J5B2Q';

/**
 * GET /api/platform/admin/test
 * 
 * Test endpoint to verify platform admin functionality
 * This endpoint provides detailed information about the current user's admin status
 */
export async function GET(_request: NextRequest) {
    try {
        const { user, organizationId, role } = await withAuth();

        if (!user) {
            return NextResponse.json({
                error: 'Not authenticated',
                isPlatformAdmin: false
            }, { status: 401 });
        }

        // Check WorkOS org membership
        // Accept both 'admin' and 'member' roles in the platform admin org
        const isInPlatformAdminOrg = organizationId === PLATFORM_ADMIN_ORG_ID && (role === 'admin' || role === 'member');

        // Check database status
        const isInDatabase = await platformAdminService.isPlatformAdmin(user.id);

        // User is platform admin if they're in the WorkOS org OR in the database
        const isPlatformAdmin = isInPlatformAdminOrg || isInDatabase;

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                organizationId,
                role,
            },
            platformAdminStatus: {
                isPlatformAdmin,
                isInPlatformAdminOrg,
                isInDatabase,
                platformAdminOrgId: PLATFORM_ADMIN_ORG_ID,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in platform admin test:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to check platform admin status',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}