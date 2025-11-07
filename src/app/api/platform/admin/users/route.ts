import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getServiceRoleClient } from '@/lib/database';
import { platformAdminService } from '@/lib/services/platform-admin.service';
import { logger } from '@/lib/utils/logger';

const PLATFORM_ADMIN_ORG_ID = 'org_01K8AMGAVF7ME7XQCP6S5J5B2Q';

/**
 * GET /api/platform/admin/users
 * 
 * List all users in the system
 * Only accessible by platform admins
 */
export async function GET(request: NextRequest) {
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

        const supabase = getServiceRoleClient();
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status'); // active, suspended, deleted
        const search = searchParams.get('search');

        let query = supabase
            .from('profiles')
            .select('id, email, full_name, workos_id, status, is_approved, is_deleted, created_at, last_login_at, login_count')
            .order('created_at', { ascending: false });

        // Filter by status
        if (status && status !== 'all') {
            if (status === 'deleted') {
                query = query.eq('is_deleted', true);
            } else {
                query = query.eq('status', status).eq('is_deleted', false);
            }
        } else {
            query = query.eq('is_deleted', false);
        }

        // Search by email or name
        if (search) {
            query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }

        const { data: users, error } = await query.limit(100);

        if (error) {
            logger.error('Failed to fetch users', error, {
                route: '/api/platform/admin/users',
            });
            return NextResponse.json({ 
                error: 'Failed to fetch users',
                details: error.message 
            }, { status: 500 });
        }

        return NextResponse.json({
            users: users || [],
            total: users?.length || 0,
        });
    } catch (error) {
        logger.error('Error fetching users', error, {
            route: '/api/platform/admin/users',
        });
        return NextResponse.json(
            {
                error: 'Failed to fetch users',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

