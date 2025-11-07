import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { isPlatformAdmin } from '@/lib/auth/check-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/check-admin
 * Check if the current user is a platform admin
 */
export async function GET() {
    try {
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ isAdmin: false }, { status: 200 });
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile) {
            return NextResponse.json({ isAdmin: false }, { status: 200 });
        }

        const isAdmin = await isPlatformAdmin(profile.id);

        return NextResponse.json({ isAdmin });
    } catch (error) {
        console.error('Error checking admin status:', error);
        return NextResponse.json({ isAdmin: false }, { status: 200 });
    }
}

