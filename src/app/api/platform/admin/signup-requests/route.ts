import { withAuth } from '@workos-inc/authkit-nextjs';
import { WorkOS } from '@workos-inc/node';
import { NextRequest, NextResponse } from 'next/server';

import { getServiceRoleClient } from '@/lib/database';
import { platformAdminService } from '@/lib/services/platform-admin.service';
import { logger } from '@/lib/utils/logger';

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
 * GET /api/platform/admin/signup-requests
 * 
 * List all signup requests
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
        const status = searchParams.get('status'); // pending, approved, denied

        let query = supabase
            .from('signup_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: requests, error } = await query;

        if (error) {
            logger.error('Failed to fetch signup requests', error, {
                route: '/api/platform/admin/signup-requests',
            });
            return NextResponse.json({ 
                error: 'Failed to fetch signup requests',
                details: error.message 
            }, { status: 500 });
        }

        return NextResponse.json({
            requests: requests || [],
            total: requests?.length || 0,
        });
    } catch (error) {
        logger.error('Error fetching signup requests', error, {
            route: '/api/platform/admin/signup-requests',
        });
        return NextResponse.json(
            {
                error: 'Failed to fetch signup requests',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/platform/admin/signup-requests
 * 
 * Approve or deny a signup request
 * Only accessible by platform admins
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

        const body = await request.json();
        const { requestId, action, reason } = body; // action: 'approve' | 'deny'

        if (!requestId || !action) {
            return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 });
        }

        const supabase = getServiceRoleClient();

        // Get the signup request
        const { data: signupRequest, error: fetchError } = await supabase
            .from('signup_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchError || !signupRequest) {
            return NextResponse.json({ error: 'Signup request not found' }, { status: 404 });
        }

        if (action === 'approve') {
            // Update status to approved
            const { error: updateError } = await supabase
                .from('signup_requests')
                .update({
                    status: 'approved',
                    approved_at: new Date().toISOString(),
                    approved_by: user.id,
                })
                .eq('id', requestId);

            if (updateError) {
                logger.error('Failed to approve signup request', updateError, {
                    route: '/api/platform/admin/signup-requests',
                    requestId,
                });
                return NextResponse.json({ 
                    error: 'Failed to approve signup request',
                    details: updateError.message 
                }, { status: 500 });
            }

            // Send WorkOS invitation
            try {
                const workos = getWorkOSClient();
                await workos.userManagement.sendInvitation({
                    email: signupRequest.email,
                    expiresInDays: 7,
                });

                logger.info('Signup request approved and invitation sent', {
                    route: '/api/platform/admin/signup-requests',
                    requestId,
                    email: signupRequest.email,
                    approvedBy: user.email,
                });
            } catch (invitationError) {
                logger.error('Failed to send invitation after approval', invitationError, {
                    route: '/api/platform/admin/signup-requests',
                    requestId,
                    email: signupRequest.email,
                });
                // Don't fail the request, just log the error
            }

            return NextResponse.json({
                message: 'Signup request approved and invitation sent',
                request: signupRequest,
            });
        }

        if (action === 'deny') {
            const { error: updateError } = await supabase
                .from('signup_requests')
                .update({
                    status: 'denied',
                    denied_at: new Date().toISOString(),
                    denied_by: user.id,
                    denial_reason: reason || null,
                })
                .eq('id', requestId);

            if (updateError) {
                logger.error('Failed to deny signup request', updateError, {
                    route: '/api/platform/admin/signup-requests',
                    requestId,
                });
                return NextResponse.json({ 
                    error: 'Failed to deny signup request',
                    details: updateError.message 
                }, { status: 500 });
            }

            logger.info('Signup request denied', {
                route: '/api/platform/admin/signup-requests',
                requestId,
                email: signupRequest.email,
                deniedBy: user.email,
                reason,
            });

            return NextResponse.json({
                message: 'Signup request denied',
                request: signupRequest,
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        logger.error('Error processing signup request', error, {
            route: '/api/platform/admin/signup-requests',
        });
        return NextResponse.json(
            {
                error: 'Failed to process signup request',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

