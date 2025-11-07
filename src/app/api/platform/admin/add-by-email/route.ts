import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getServiceRoleClient } from '@/lib/database';
import { platformAdminService } from '@/lib/services/platform-admin.service';
import { logger } from '@/lib/utils/logger';

const PLATFORM_ADMIN_ORG_ID = 'org_01K8AMGAVF7ME7XQCP6S5J5B2Q';

/**
 * POST /api/platform/admin/add-by-email
 * 
 * Add a user as platform admin by their email
 * Automatically looks up their WorkOS user ID from the profiles table
 */
export async function POST(request: NextRequest) {
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

        // Get email from request body
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        const supabase = getServiceRoleClient();

        // Look up user in profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name, workos_id')
            .eq('email', email)
            .maybeSingle();

        if (profileError) {
            logger.error('Failed to look up user profile', profileError, {
                route: '/api/platform/admin/add-by-email',
                email,
            });
            return NextResponse.json({ 
                error: 'Failed to look up user',
                details: profileError.message 
            }, { status: 500 });
        }

        if (!profile) {
            return NextResponse.json({ 
                error: 'User not found',
                message: `No user found with email: ${email}. The user must have logged in at least once.`
            }, { status: 404 });
        }

        if (!profile.workos_id) {
            return NextResponse.json({
                error: 'User has no WorkOS ID',
                message: 'This user profile exists but has no WorkOS user ID. They may need to log in again.'
            }, { status: 400 });
        }

        // Check if already admin
        const isAlreadyAdmin = await platformAdminService.isPlatformAdmin(profile.workos_id);

        if (isAlreadyAdmin) {
            return NextResponse.json({
                message: 'User is already a platform admin',
                user: {
                    email: profile.email,
                    name: profile.full_name,
                    workosUserId: profile.workos_id,
                },
            });
        }

        // Add as admin
        const admin = await platformAdminService.addAdmin(
            profile.workos_id,
            profile.email,
            profile.full_name || undefined,
            user.id // Added by current admin
        );

        logger.info('Platform admin added', {
            route: '/api/platform/admin/add-by-email',
            addedEmail: profile.email,
            addedBy: user.email,
        });

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
        logger.error('Error adding platform admin', error, {
            route: '/api/platform/admin/add-by-email',
        });
        return NextResponse.json(
            {
                error: 'Failed to add platform admin',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

