import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { platformAdminService } from '@/lib/services/platform-admin.service';

const PLATFORM_ADMIN_ORG_ID = 'org_01K8AMGAVF7ME7XQCP6S5J5B2Q';

/**
 * POST /api/platform/admin/add
 * 
 * Adds a user as platform admin
 * Requires platform admin access
 */
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { workosUserId, email, name } = body;

        if (!workosUserId || !email) {
            return NextResponse.json(
                { error: 'Missing required fields: workosUserId, email' },
                { status: 400 }
            );
        }

        const admin = await platformAdminService.addAdmin(
            workosUserId,
            email,
            name,
            user.id
        );

        return NextResponse.json({
            success: true,
            admin,
            message: 'Platform admin added successfully',
        });
    } catch (error) {
        console.error('Error adding platform admin:', error);
        return NextResponse.json(
            {
                error: 'Failed to add platform admin',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}