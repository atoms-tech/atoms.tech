import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getServiceRoleClient } from '@/lib/database';

/**
 * GET /api/organizations/[orgId]/requirements/next-id
 *
 * Computes the next external_id for requirements within an organization scope.
 * Format: REQ-{ORG_PREFIX}-{NNN}
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

        const supabase = getServiceRoleClient();
        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        // Check membership in the org
        const { data: member, error: memberErr } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgId)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();
        if (memberErr) {
            return NextResponse.json(
                { error: 'Failed to verify membership', details: memberErr.message },
                { status: 500 },
            );
        }
        if (!member) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get organization name to build prefix
        const { data: org, error: orgErr } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', orgId)
            .maybeSingle();
        if (orgErr) {
            return NextResponse.json(
                { error: 'Failed to fetch organization', details: orgErr.message },
                { status: 500 },
            );
        }
        const orgPrefix = (org?.name || 'ORG').substring(0, 3).toUpperCase();

        // Get existing external_ids for this org via documents->projects join
        const { data: reqs, error: reqErr } = await supabase
            .from('requirements')
            .select(
                `external_id, documents!inner(project_id, projects!inner(organization_id))`,
            )
            .eq('documents.projects.organization_id', orgId)
            .not('external_id', 'is', null)
            .order('created_at', { ascending: false });
        if (reqErr) {
            return NextResponse.json(
                {
                    error: 'Failed to fetch existing requirements',
                    details: reqErr.message,
                },
                { status: 500 },
            );
        }

        let maxNumber = 0;
        const prefix = `REQ-${orgPrefix}-`;
        for (const r of reqs ?? []) {
            const ext = (r as { external_id?: string | null }).external_id;
            if (ext && ext.startsWith(prefix)) {
                const num = parseInt(ext.substring(prefix.length), 10);
                if (!Number.isNaN(num) && num > maxNumber) maxNumber = num;
            }
        }
        const nextNumber = maxNumber + 1;
        const padded = String(nextNumber).padStart(3, '0');
        const nextExternalId = `${prefix}${padded}`;

        return NextResponse.json({ nextExternalId });
    } catch (error) {
        console.error('Org next-id API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to compute next requirement id',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
