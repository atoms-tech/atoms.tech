import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { platformAdminService } from '@/lib/services/platform-admin.service';

const PLATFORM_ADMIN_ORG_ID = 'org_01K8AMGAVF7ME7XQCP6S5J5B2Q';

/**
 * GET /api/debug/auth-info
 * 
 * Debug endpoint to show current user's auth information
 */
export async function GET(_request: NextRequest) {
    try {
        const { user, organizationId, role } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get profile
        const profile = await getOrCreateProfileForWorkOSUser(user);

        // Check admin status
        const isInPlatformAdminOrg = organizationId === PLATFORM_ADMIN_ORG_ID && (role === 'admin' || role === 'member');
        const isInDatabase = await platformAdminService.isPlatformAdmin(user.id);

        return NextResponse.json({
            workosUser: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            profile: {
                id: profile?.id,
                email: profile?.email,
                workosId: (profile as any)?.workos_id,
            },
            organization: {
                id: organizationId,
                role: role,
                isPlatformAdminOrg: organizationId === PLATFORM_ADMIN_ORG_ID,
                hasOrganizationContext: !!organizationId,
            },
            adminStatus: {
                isInPlatformAdminOrg,
                isInDatabase,
                isPlatformAdmin: isInPlatformAdminOrg || isInDatabase,
            },
            constants: {
                PLATFORM_ADMIN_ORG_ID,
            },
            diagnosis: {
                issue: !organizationId ? 'NO_ORG_CONTEXT' : organizationId !== PLATFORM_ADMIN_ORG_ID ? 'WRONG_ORG' : !isInDatabase ? 'NOT_IN_DATABASE' : 'OK',
                recommendation: !organizationId
                    ? 'User is not authenticated within an organization context. Need to log in through organization.'
                    : organizationId !== PLATFORM_ADMIN_ORG_ID
                    ? `User is in organization ${organizationId} but needs to be in ${PLATFORM_ADMIN_ORG_ID}`
                    : !isInDatabase
                    ? 'User is in correct org but not in database. Use /api/debug/add-admin to add.'
                    : 'User should have admin access',
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to get auth info',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

