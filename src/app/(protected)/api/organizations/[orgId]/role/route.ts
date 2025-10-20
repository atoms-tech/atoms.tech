import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

export async function GET(_request: Request, { params }: { params: { orgId: string } }) {
    try {
        const orgId = params.orgId;

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

        const supabase = getSupabaseServiceRoleClient();

        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        const { data, error } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgId)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .single();

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch role', details: error.message },
                { status: 500 },
            );
        }

        if (!data) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ role: data.role });
    } catch (error) {
        console.error('Organization role API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch organization role',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
