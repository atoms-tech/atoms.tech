import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ orgId: string }> },
) {
    const { orgId } = await context.params;

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

    const supabase = getSupabaseServiceRoleClient();

    try {
        // Verify user is a member of this organization
        const { data: membership, error: membershipError } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgId)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .eq('is_deleted', false)
            .maybeSingle();

        if (membershipError) {
            console.error('Error checking membership:', membershipError);
            throw membershipError;
        }

        if (!membership) {
            return NextResponse.json(
                { error: 'Not a member of this organization' },
                { status: 403 },
            );
        }

        // Count active members in the organization
        const { count, error: countError } = await supabase
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('status', 'active')
            .eq('is_deleted', false);

        if (countError) {
            console.error('Error counting members:', countError);
            throw countError;
        }

        // Update the member_count in organizations table
        const { error: updateError } = await supabase
            .from('organizations')
            .update({ member_count: count })
            .eq('id', orgId);

        if (updateError) {
            console.error('Error updating member count:', updateError);
            throw updateError;
        }

        return NextResponse.json({ member_count: count });
    } catch (error) {
        console.error('Error updating member count:', error);
        return NextResponse.json(
            { error: 'Failed to update member count' },
            { status: 500 },
        );
    }
}
