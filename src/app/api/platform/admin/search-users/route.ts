import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getServiceRoleClient } from '@/lib/database';
import { platformAdminService } from '@/lib/services/platform-admin.service';
import { logger } from '@/lib/utils/logger';

const PLATFORM_ADMIN_ORG_ID = 'org_01K8AMGAVF7ME7XQCP6S5J5B2Q';

/**
 * GET /api/platform/admin/search-users?q=email@example.com
 * 
 * Search for users in the profiles table
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

        // Get search query
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ 
                error: 'Search query must be at least 2 characters',
                users: [] 
            }, { status: 400 });
        }

        const supabase = getServiceRoleClient();

        // Search profiles by email or name
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, workos_id, created_at')
            .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
            .limit(20)
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Failed to search users', error, {
                route: '/api/platform/admin/search-users',
                query,
            });
            return NextResponse.json({ 
                error: 'Failed to search users',
                details: error.message 
            }, { status: 500 });
        }

        // Check which users are already admins
        const userIds = profiles?.map(p => p.workos_id).filter(Boolean) || [];
        const { data: existingAdmins } = await supabase
            .from('platform_admins')
            .select('workos_user_id')
            .in('workos_user_id', userIds)
            .eq('is_active', true);

        const adminUserIds = new Set(existingAdmins?.map(a => a.workos_user_id) || []);

        // Format results
        const users = profiles?.map(profile => ({
            id: profile.id,
            email: profile.email,
            name: profile.full_name,
            workosUserId: profile.workos_id,
            createdAt: profile.created_at,
            isAdmin: profile.workos_id ? adminUserIds.has(profile.workos_id) : false,
        })) || [];

        return NextResponse.json({
            users,
            total: users.length,
            query,
        });
    } catch (error) {
        logger.error('Error searching users', error, {
            route: '/api/platform/admin/search-users',
        });
        return NextResponse.json(
            {
                error: 'Failed to search users',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

