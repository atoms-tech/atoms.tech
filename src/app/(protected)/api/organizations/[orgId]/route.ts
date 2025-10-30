import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import {
    getOrganizationIdsByMembershipServer,
    getOrganizationServer,
} from '@/lib/db/server';

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ orgId: string }> },
) {
    try {
        const { orgId } = await context.params;

        if (!orgId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 },
            );
        }

        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            );
        }

        const memberships = await getOrganizationIdsByMembershipServer(profile.id);

        if (!memberships.includes(orgId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const organization = await getOrganizationServer(orgId);

        return NextResponse.json({ organization });
    } catch (error) {
        console.error('Organizations API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch organization',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
