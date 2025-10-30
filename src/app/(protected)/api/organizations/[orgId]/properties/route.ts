import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

/**
 * GET /api/organizations/[orgId]/properties
 *
 * Returns organization-level properties (org-scoped), ordered by name.
 * Uses service role with membership check against organization_members.
 */
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

        const supabase = getSupabaseServiceRoleClient();
        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        // Check that user is a member of the organization
        const { data: membership, error: membershipError } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgId)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();
        if (membershipError) {
            return NextResponse.json(
                {
                    error: 'Failed to verify organization membership',
                    details: membershipError.message,
                },
                { status: 500 },
            );
        }
        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: properties, error: propsError } = await supabase
            .from('properties')
            .select('*')
            .eq('org_id', orgId)
            .order('name', { ascending: true });
        if (propsError) {
            return NextResponse.json(
                { error: 'Failed to fetch properties', details: propsError.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ properties: properties ?? [] });
    } catch (error) {
        console.error('Organization properties API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch properties',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
