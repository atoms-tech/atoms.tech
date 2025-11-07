import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';
import { InvitationStatus } from '@/types/base/enums.types';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ invitationId: string }> },
) {
    const { invitationId } = await context.params;

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
    if (!supabase) {
        return NextResponse.json(
            { error: 'Supabase service client unavailable' },
            { status: 500 },
        );
    }

    try {
        // Fetch invitation to verify ownership
        const { data: invitation, error: fetchError } = await supabase
            .from('organization_invitations')
            .select('*')
            .eq('id', invitationId)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching invitation:', fetchError);
            throw fetchError;
        }

        if (!invitation) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        // Verify invitation is for this user's email
        if (invitation.email !== user.email) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Update invitation status to rejected
        const { error: updateError } = await supabase
            .from('organization_invitations')
            .update({
                status: InvitationStatus.rejected,
                updated_by: profile.id,
            })
            .eq('id', invitationId);

        if (updateError) {
            console.error('Error rejecting invitation:', updateError);
            throw updateError;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in reject endpoint:', error);
        return NextResponse.json(
            { error: 'Failed to reject invitation' },
            { status: 500 },
        );
    }
}
