import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getProfileById } from '@/lib/auth/profile-sync';

/**
 * GET /api/auth/profile/[userId]
 *
 * Returns the user profile from the database
 * Uses WorkOS authentication with Supabase
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
) {
    try {
        const { userId } = await params;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(userId)) {
            console.warn('Profile API: Invalid userId format received', userId);
            return NextResponse.json(
                { error: 'Invalid user identifier' },
                { status: 400 },
            );
        }

        // Get WorkOS session and token
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const profile = await getProfileById(userId);

        if (!profile) {
            console.error('Profile fetch error: Profile not found for id', userId);
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        if (profile.email !== user.email) {
            console.warn(
                'Profile API: Email mismatch between WorkOS user and Supabase profile',
                {
                    requestedId: userId,
                    profileEmail: profile.email,
                    workosEmail: user.email,
                },
            );
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Profile API error:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}
