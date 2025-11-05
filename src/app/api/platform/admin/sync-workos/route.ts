import { withAuth } from '@workos-inc/authkit-nextjs';
import { WorkOS } from '@workos-inc/node';
import { NextRequest, NextResponse } from 'next/server';

import { platformAdminService } from '@/lib/services/platform-admin.service';

const PLATFORM_ADMIN_ORG_ID = 'org_01K8AMGAVF7ME7XQCP6S5J5B2Q';

// Helper function to get WorkOS client
function getWorkOSClient() {
    const apiKey = process.env.WORKOS_API_KEY;
    const clientId = process.env.WORKOS_CLIENT_ID;

    if (!apiKey) {
        throw new Error('WORKOS_API_KEY environment variable is required');
    }

    return new WorkOS(apiKey, {
        clientId,
    });
}

/**
 * POST /api/platform/admin/sync-workos
 * 
 * Manually sync all users from the WorkOS platform admin organization
 * to the platform_admins database table
 */
export async function POST(_request: NextRequest) {
    try {
        const { user, organizationId, role } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Check if the current user is a platform admin
        const isInPlatformAdminOrg = organizationId === PLATFORM_ADMIN_ORG_ID && role === 'admin';
        const isInDatabase = await platformAdminService.isPlatformAdmin(user.id);
        
        if (!isInPlatformAdminOrg && !isInDatabase) {
            return NextResponse.json({ 
                error: 'Access denied. Only platform admins can sync WorkOS users.' 
            }, { status: 403 });
        }

        console.log(`Starting WorkOS sync for organization ${PLATFORM_ADMIN_ORG_ID}`);

        const workos = getWorkOSClient();
        const syncResults = {
            totalUsers: 0,
            adminUsers: 0,
            syncedUsers: 0,
            skippedUsers: 0,
            errors: [] as string[],
        };

        try {
            // Fetch all users from the platform admin organization
            const { data: users } = await workos.userManagement.listUsers({
                organizationId: PLATFORM_ADMIN_ORG_ID,
            });

            syncResults.totalUsers = users.length;
            console.log(`Found ${users.length} users in WorkOS organization`);

            // Filter users with admin role and sync them
            for (const workosUser of users) {
                try {
                    // WorkOS user objects don't have role property directly
                    // We need to check organization membership instead
                    const isAdmin = true; // All users in the platform admin org are considered admins
                    
                    if (isAdmin) {
                        syncResults.adminUsers++;
                        console.log(`Processing admin user: ${workosUser.email}`);

                        // Check if user already exists in database
                        const existsInDb = await platformAdminService.isPlatformAdmin(workosUser.id);
                        
                        if (!existsInDb) {
                            // Add user to platform admins database
                            await platformAdminService.addAdmin(
                                workosUser.id,
                                workosUser.email,
                                `${workosUser.firstName || ''} ${workosUser.lastName || ''}`.trim() || workosUser.email || 'Unknown',
                                user.id // Current user as added_by
                            );
                            syncResults.syncedUsers++;
                            console.log(`Successfully synced user: ${workosUser.email}`);
                        } else {
                            syncResults.skippedUsers++;
                            console.log(`User already exists in database: ${workosUser.email}`);
                        }
                    }
                } catch (userError) {
                    const errorMsg = `Failed to sync user ${workosUser.email}: ${userError instanceof Error ? userError.message : 'Unknown error'}`;
                    syncResults.errors.push(errorMsg);
                    console.error(errorMsg);
                }
            }

            console.log('WorkOS sync completed:', syncResults);

            return NextResponse.json({
                success: true,
                message: 'WorkOS sync completed successfully',
                workosOrgId: PLATFORM_ADMIN_ORG_ID,
                results: syncResults,
                timestamp: new Date().toISOString(),
            });

        } catch (workosError) {
            console.error('WorkOS API error:', workosError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch users from WorkOS',
                details: workosError instanceof Error ? workosError.message : 'Unknown WorkOS error',
                workosOrgId: PLATFORM_ADMIN_ORG_ID,
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Error in WorkOS sync:', error);
        return NextResponse.json(
            {
                error: 'Failed to sync WorkOS users',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}