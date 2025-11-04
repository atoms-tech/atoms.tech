import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getUserOrganizations } from '@/lib/db/client/organizations.client';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

export async function GET() {
    // Authenticate with WorkOS
    const { user } = await withAuth();
    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get or create Supabase profile for WorkOS user
    const profile = await getOrCreateProfileForWorkOSUser(user);
    if (!profile) {
        return NextResponse.json({ error: 'Profile not provisioned' }, { status: 409 });
    }

    const supabase = getSupabaseServiceRoleClient();

    try {
        // Fetch organizations where user is a member
        const organizations = await getUserOrganizations(supabase, profile.id);

        return NextResponse.json({ organizations });
    } catch (error) {
        console.error('Error fetching user organizations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch organizations' },
            { status: 500 },
        );
    }
}
