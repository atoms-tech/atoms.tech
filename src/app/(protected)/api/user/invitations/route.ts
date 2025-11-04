import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

export async function GET() {
    // Authenticate with WorkOS
    const { user } = await withAuth();
    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get or create Supabase profile
    const profile = await getOrCreateProfileForWorkOSUser(user);
    if (!profile) {
        return NextResponse.json({ error: 'Profile not provisioned' }, { status: 409 });
    }

    // Verify email matches user
    if (user.email !== profile.email) {
        return NextResponse.json({ error: 'Email mismatch' }, { status: 403 });
    }

    const supabase = getSupabaseServiceRoleClient();

    try {
        // Fetch invitations with organization data via join
        const { data, error } = await supabase
            .from('organization_invitations')
            .select(
                `
                *,
                organizations!inner(id, name, slug)
            `,
            )
            .eq('email', user.email)
            .neq('status', 'rejected');

        if (error) {
            console.error('Error fetching invitations:', error);
            throw error;
        }

        return NextResponse.json({ invitations: data || [] });
    } catch (error) {
        console.error('Error in invitations endpoint:', error);
        return NextResponse.json(
            { error: 'Failed to fetch invitations' },
            { status: 500 },
        );
    }
}
