import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { platformAdminService } from '@/lib/services/platform-admin.service';
import { logger } from '@/lib/utils/logger';

const PLATFORM_ADMIN_ORG_ID = 'org_01K8AMGAVF7ME7XQCP6S5J5B2Q';

/**
 * GET /api/platform/admin/check
 * 
 * Checks if the current user is a platform admin
 * This checks both WorkOS org membership and database status
 */
export async function GET(_request: NextRequest) {
    try {
        const { user, organizationId, role } = await withAuth();

        logger.info('Platform admin check - withAuth result', {
            route: '/api/platform/admin/check',
            hasUser: !!user,
            userId: user?.id,
            email: user?.email,
            organizationId,
            role,
            expectedOrgId: PLATFORM_ADMIN_ORG_ID,
        });

        if (!user) {
            return NextResponse.json({ isPlatformAdmin: false }, { status: 200 });
        }

        // Check if user is in the platform admin WorkOS org
        // Accept both 'admin' and 'member' roles in the platform admin org
        const isInPlatformAdminOrg = organizationId === PLATFORM_ADMIN_ORG_ID && (role === 'admin' || role === 'member');

        logger.info('Platform admin check - org comparison', {
            route: '/api/platform/admin/check',
            organizationId,
            PLATFORM_ADMIN_ORG_ID,
            orgMatches: organizationId === PLATFORM_ADMIN_ORG_ID,
            role,
            roleMatches: role === 'admin' || role === 'member',
            isInPlatformAdminOrg,
        });

        // Check database status
        const isInDatabase = await platformAdminService.isPlatformAdmin(user.id);

        logger.info('Platform admin check - database result', {
            route: '/api/platform/admin/check',
            userId: user.id,
            isInDatabase,
        });

        // If user is in WorkOS org but not in database, auto-sync them
        if (isInPlatformAdminOrg && !isInDatabase) {
            try {
                logger.info('Auto-syncing WorkOS user to platform admins database', {
                    route: '/api/platform/admin/check',
                    workosUserId: user.id,
                });
                await platformAdminService.addAdmin(
                    user.id,
                    user.email || '',
                    `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
                    undefined // No added_by for auto-sync
                );
                logger.info('Successfully auto-synced user as platform admin', {
                    route: '/api/platform/admin/check',
                    workosUserId: user.id,
                });
            } catch (error) {
                logger.error('Failed to auto-sync WorkOS user to platform admins', error, {
                    route: '/api/platform/admin/check',
                    workosUserId: user.id,
                });
                // Continue with the check even if auto-sync fails
            }
        }

        // User is platform admin if they're in the WorkOS org OR in the database
        const isPlatformAdmin = isInPlatformAdminOrg || isInDatabase;

        logger.info('Platform admin check - final result', {
            route: '/api/platform/admin/check',
            isPlatformAdmin,
            isInPlatformAdminOrg,
            isInDatabase,
            workosUserId: user.id,
            organizationId,
            role,
        });

        return NextResponse.json({
            isPlatformAdmin,
            isInPlatformAdminOrg,
            isInDatabase,
            workosUserId: user.id,
            organizationId,
            role,
        });
    } catch (error) {
        logger.error('Error checking platform admin status', error, {
            route: '/api/platform/admin/check',
        });
        return NextResponse.json(
            {
                error: 'Failed to check platform admin status',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
