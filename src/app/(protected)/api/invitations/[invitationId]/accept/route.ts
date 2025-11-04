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

    // Get or create Supabase profile for WorkOS user
    const profile = await getOrCreateProfileForWorkOSUser(user);
    if (!profile) {
        return NextResponse.json(
            { error: 'Profile not provisioned' },
            { status: 409 },
        );
    }

    const supabase = getSupabaseServiceRoleClient();

    try {
        // Fetch the invitation
        const { data: invitation, error: invitationError } = await supabase
            .from('organization_invitations')
            .select('*')
            .eq('id', invitationId)
            .maybeSingle();

        if (invitationError) {
            console.error('Error fetching invitation:', invitationError);
            return NextResponse.json(
                { error: 'Failed to fetch invitation' },
                { status: 500 },
            );
        }

        if (!invitation) {
            return NextResponse.json(
                { error: 'Invitation not found' },
                { status: 404 },
            );
        }

        // Verify invitation is for this user's email
        if (invitation.email !== user.email) {
            return NextResponse.json(
                { error: 'Invitation not for this user' },
                { status: 403 },
            );
        }

        // Verify invitation is pending
        if (invitation.status !== InvitationStatus.pending) {
            return NextResponse.json(
                { error: 'Invitation already processed' },
                { status: 400 },
            );
        }

        // Check if user is already a member
        const { data: existingMember } = await supabase
            .from('organization_members')
            .select('id')
            .eq('organization_id', invitation.organization_id)
            .eq('user_id', profile.id)
            .maybeSingle();

        if (existingMember) {
            return NextResponse.json(
                { error: 'User is already a member of this organization' },
                { status: 400 },
            );
        }

        // Add user to organization_members with correct Supabase UUID
        const { error: memberError } = await supabase
            .from('organization_members')
            .insert({
                organization_id: invitation.organization_id,
                user_id: profile.id, // Use Supabase UUID, not WorkOS ID
                role: invitation.role,
                status: 'active',
                last_active_at: new Date().toISOString(),
            });

        if (memberError) {
            console.error('Error adding organization member:', memberError);
            return NextResponse.json(
                { error: 'Failed to add organization member' },
                { status: 500 },
            );
        }

        // Fetch all projects in the organization
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id')
            .eq('organization_id', invitation.organization_id);

        if (projectsError) {
            console.error('Error fetching organization projects:', projectsError);
            // Don't fail the entire request if project fetch fails
            // The user can still be added manually later
        }

        // Add user to all projects with 'viewer' role
        if (projects && projects.length > 0) {
            const projectMemberInserts = projects.map((project) => ({
                project_id: project.id,
                user_id: profile.id, // Use Supabase UUID
                role: 'viewer' as const,
                status: 'active' as const,
                last_active_at: new Date().toISOString(),
            }));

            const { error: projectMemberError } = await supabase
                .from('project_members')
                .insert(projectMemberInserts);

            if (projectMemberError) {
                console.error('Error adding project members:', projectMemberError);
                // Don't fail the entire request - org membership is still valid
                // Projects can be accessed if added manually later
            }
        }

        // Update invitation status to accepted
        const { error: updateError } = await supabase
            .from('organization_invitations')
            .update({
                status: InvitationStatus.accepted,
                updated_by: profile.id,
            })
            .eq('id', invitationId);

        if (updateError) {
            console.error('Error updating invitation status:', updateError);
            // Don't fail the request - membership was created successfully
        }

        // Update organization member count
        const { count } = await supabase
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', invitation.organization_id);

        if (count !== null) {
            await supabase
                .from('organizations')
                .update({ member_count: count })
                .eq('id', invitation.organization_id);
        }

        return NextResponse.json({
            success: true,
            organization_id: invitation.organization_id,
            projects_added: projects?.length || 0,
        });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
