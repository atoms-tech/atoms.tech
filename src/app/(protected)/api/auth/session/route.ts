import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';

/**
 * GET /api/auth/session
 *
 * Returns the current user session if authenticated
 * Uses WorkOS AuthKit for session management
 */
export async function GET(_request: NextRequest) {
    try {
        console.log('Session API: Checking WorkOS session...');
        const { user, accessToken } = await withAuth();

        console.log('Session API: withAuth result:', {
            hasUser: !!user,
            hasAccessToken: !!accessToken,
            userId: user?.id,
        });

        if (!user) {
            console.log('Session API: No user found, returning 401');
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        let profile = null;

        try {
            profile = await getOrCreateProfileForWorkOSUser(user);
        } catch (profileError) {
            console.error('Session API: Failed to synchronize profile:', profileError);
        }

        if (!profile) {
            console.error('Session API: Supabase profile missing for user:', user.id);
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            );
        }

        const resolvedUserId = profile.id;

        console.log('Session API: User authenticated successfully:', resolvedUserId, {
            workosUserId: user.id,
        });
        return NextResponse.json({
            user: {
                id: resolvedUserId,
                workosId: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            accessToken, // Include the access token for Supabase authentication
            profile,
        });
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json(
            {
                error: 'Failed to check session',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
