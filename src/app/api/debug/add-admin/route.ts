import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { platformAdminService } from '@/lib/services/platform-admin.service';

const PLATFORM_ADMIN_ORG_ID = 'org_01K8AMGAVF7ME7XQCP6S5J5B2Q';

/**
 * POST /api/debug/add-admin
 * 
 * Debug endpoint to add current user as platform admin
 * Only works if user is in the platform admin WorkOS org
 */
export async function POST(_request: NextRequest) {
    try {
        const { user, organizationId, role } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Check if user is in the platform admin WorkOS org
        const isInPlatformAdminOrg = organizationId === PLATFORM_ADMIN_ORG_ID && (role === 'admin' || role === 'member');

        if (!isInPlatformAdminOrg) {
            return NextResponse.json({
                error: 'Not authorized',
                message: 'You must be in the platform admin WorkOS organization',
                yourOrg: organizationId,
                requiredOrg: PLATFORM_ADMIN_ORG_ID,
            }, { status: 403 });
        }

        // Get profile
        const profile = await getOrCreateProfileForWorkOSUser(user);

        if (!profile) {
            return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
        }

        // Check if already admin
        const isAlreadyAdmin = await platformAdminService.isPlatformAdmin(user.id);

        if (isAlreadyAdmin) {
            return NextResponse.json({
                message: 'Already a platform admin',
                workosUserId: user.id,
                email: user.email,
            });
        }

        // Add as admin
        const admin = await platformAdminService.addAdmin(
            user.id,
            user.email,
            `${user.firstName} ${user.lastName}`.trim() || undefined,
            user.id // Added by self
        );

        return NextResponse.json({
            message: 'Successfully added as platform admin',
            admin: {
                id: admin.id,
                workosUserId: admin.workos_user_id,
                email: admin.email,
                name: admin.name,
                isActive: admin.is_active,
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to add admin',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

