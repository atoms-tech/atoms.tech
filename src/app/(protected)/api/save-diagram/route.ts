import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createSupabaseClientWithToken } from '@/lib/supabase/supabase-authkit';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

export async function POST(request: NextRequest) {
    try {
        const { diagramData, diagramId, projectId, name, thumbnailUrl, organizationId } =
            await request.json();

        // Validate required fields
        if (!diagramId || !projectId) {
            return NextResponse.json(
                { error: 'Missing required fields: diagramId and projectId' },
                { status: 400 },
            );
        }

        // Authenticate via WorkOS
        const { user, accessToken } = await withAuth();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get or create Supabase profile for WorkOS user
        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            );
        }

        // Get service role client for membership check
        const supabase = getSupabaseServiceRoleClient();
        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase service client unavailable' },
                { status: 500 },
            );
        }

        // Verify project membership
        const { data: membership, error: membershipError } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', profile.id)
            .eq('status', 'active')
            .maybeSingle();

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Use user-scoped client for upsert operation
        if (!accessToken) {
            return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
        }

        const userClient = createSupabaseClientWithToken(accessToken);
        const { data, error } = await userClient.from('excalidraw_diagrams').upsert({
            id: diagramId,
            project_id: projectId,
            organization_id: organizationId,
            diagram_data: diagramData,
            name: name || 'Untitled Diagram',
            thumbnail_url: thumbnailUrl || null,
            updated_at: new Date().toISOString(),
            updated_by: profile.id,
            created_by: profile.id,
        });

        if (error) {
            console.error('Error saving diagram:', error);
            return NextResponse.json(
                { error: 'Failed to save diagram', details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error('Save diagram error:', error);
        return NextResponse.json({ error: 'Failed to save diagram' }, { status: 500 });
    }
}
