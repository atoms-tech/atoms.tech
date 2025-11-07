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
 * POST /api/platform/admin/invite-user
 * 
 * Invite a user by email (sends WorkOS invitation)
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
        const { email, organizationId: targetOrgId } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        const supabase = getServiceRoleClient();

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            return NextResponse.json({ 
                error: 'User already exists',
                message: `A user with email ${email} already exists in the system.`
            }, { status: 400 });
        }

        // Send WorkOS invitation
        try {
            const workos = getWorkOSClient();

            const invitationParams: any = {
                email,
                expiresInDays: 7,
            };

            // If organization ID is provided, invite to that organization
            if (targetOrgId) {
                invitationParams.organizationId = targetOrgId;
            }

            const invitation = await workos.userManagement.sendInvitation(invitationParams);

            logger.info('User invitation sent', {
                route: '/api/platform/admin/invite-user',
                email,
                invitationId: invitation.id,
                invitedBy: user.email,
                organizationId: targetOrgId || 'none',
            });

            return NextResponse.json({
                message: 'Invitation sent successfully',
                invitation: {
                    id: invitation.id,
                    email: invitation.email,
                    expiresAt: invitation.expiresAt,
                    organizationId: targetOrgId || null,
                },
            });
        } catch (workosError: any) {
            logger.error('Failed to send WorkOS invitation', workosError, {
                route: '/api/platform/admin/invite-user',
                email,
            });

            // Check if it's a duplicate invitation error
            if (workosError.message?.includes('already exists') || workosError.message?.includes('duplicate')) {
                return NextResponse.json({ 
                    error: 'Invitation already sent',
                    message: `An invitation has already been sent to ${email}. Please wait for them to accept or resend the invitation.`
                }, { status: 400 });
            }

            return NextResponse.json({ 
                error: 'Failed to send invitation',
                details: workosError.message || 'Unknown error'
            }, { status: 500 });
        }
    } catch (error) {
        logger.error('Error inviting user', error, {
            route: '/api/platform/admin/invite-user',
        });
        return NextResponse.json(
            {
                error: 'Failed to invite user',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

