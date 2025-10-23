import { render } from '@react-email/render';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { WorkOS } from '@workos-inc/node';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

import { SignupApprovalEmail } from '@/emails/SignupApprovalEmail';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/supabase-service-role';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to get WorkOS client
function getWorkOSClient() {
    const apiKey = process.env.WORKOS_API_KEY;
    const clientId = process.env.WORKOS_CLIENT_ID;

    if (!apiKey) {
        throw new Error('WORKOS_API_KEY environment variable is required');
    }

    return new WorkOS(apiKey, {
        clientId,
    });
}

/**
 * GET /api/admin/signup-requests
 *
 * Retrieve all signup requests
 * Admin endpoint - requires authentication
 */
export async function GET(_request: NextRequest) {
    try {
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // TODO: Add role-based access control to verify user is an admin
        // For now, all authenticated users can view

        const supabase = getSupabaseServiceRoleClient();

        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase client not configured' },
                { status: 500 },
            );
        }

        const { data, error } = await supabase
            .from('signup_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch signup requests' },
                { status: 500 },
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('GET /api/admin/signup-requests error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}

interface ApproveRequestBody {
    requestId: string;
}

interface DenyRequestBody {
    requestId: string;
    reason?: string;
}

/**
 * POST /api/admin/signup-requests/approve
 *
 * Approve a signup request and send invitation email
 */
export async function POST(request: NextRequest) {
    try {
        const { user } = await withAuth();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseServiceRoleClient();

        if (!supabase) {
            return NextResponse.json(
                { error: 'Supabase client not configured' },
                { status: 500 },
            );
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not provisioned' },
                { status: 409 },
            );
        }

        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        if (action === 'approve') {
            const body = (await request.json()) as ApproveRequestBody;
            const { requestId } = body;

            // Fetch the signup request
            const { data: signupRequest, error: fetchError } = await supabase
                .from('signup_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (fetchError || !signupRequest) {
                console.error('Fetch error:', fetchError);
                return NextResponse.json(
                    { error: 'Signup request not found' },
                    { status: 404 },
                );
            }

            // Update status to approved
            const { error: updateError } = await supabase
                .from('signup_requests')
                .update({
                    status: 'approved',
                    approved_at: new Date().toISOString(),
                    approved_by: profile.id,
                })
                .eq('id', requestId);

            if (updateError) {
                console.error('Update error:', updateError);
                return NextResponse.json(
                    { error: 'Failed to approve signup request' },
                    { status: 500 },
                );
            }

            // Create WorkOS invitation
            try {
                const workos = getWorkOSClient();

                // Send invitation via WorkOS API
                const _invitation = await workos.userManagement.sendInvitation({
                    email: signupRequest.email,
                    // No organizationId means application-wide invitation
                    expiresInDays: 7,
                });
            } catch (invitationError: unknown) {
                console.error('Failed to send WorkOS invitation:', invitationError);

                // Fallback: Send custom approval email
                try {
                    const emailHtml = await render(
                        SignupApprovalEmail({
                            fullName: signupRequest.full_name,
                            email: signupRequest.email,
                            signupLink: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
                        }),
                    );

                    await resend.emails.send({
                        from: process.env.RESEND_FROM_EMAIL!,
                        to: signupRequest.email,
                        subject: 'Your Atoms.Tech signup has been approved! 🎉',
                        html: emailHtml,
                    });
                } catch (emailError) {
                    console.error('Failed to send fallback approval email:', emailError);
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Signup request approved and invitation sent',
            });
        }

        if (action === 'deny') {
            const body = (await request.json()) as DenyRequestBody;
            const { requestId, reason } = body;

            // Fetch the signup request
            const { data: signupRequest, error: fetchError } = await supabase
                .from('signup_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (fetchError || !signupRequest) {
                console.error('Fetch error:', fetchError);
                return NextResponse.json(
                    { error: 'Signup request not found' },
                    { status: 404 },
                );
            }

            // Update status to denied
            const { error: updateError } = await supabase
                .from('signup_requests')
                .update({
                    status: 'denied',
                    denied_at: new Date().toISOString(),
                    denied_by: profile.id,
                    denial_reason: reason || null,
                })
                .eq('id', requestId);

            if (updateError) {
                console.error('Update error:', updateError);
                return NextResponse.json(
                    { error: 'Failed to deny signup request' },
                    { status: 500 },
                );
            }

            // Send denial email
            try {
                await resend.emails.send({
                    from: process.env.RESEND_FROM_EMAIL!,
                    to: signupRequest.email,
                    subject: 'Atoms.Tech Signup Request Status',
                    html: `
                        <h2>Hello ${escapeHtml(signupRequest.full_name)},</h2>
                        <p>Thank you for your interest in Atoms.Tech.</p>
                        <p>Unfortunately, we're unable to approve your signup request at this time.</p>
                        ${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ''}
                        <p>If you have any questions, please feel free to reach out to us.</p>
                    `,
                });
            } catch (emailError) {
                console.error('Failed to send denial email:', emailError);
                // Don't fail the request if email sending fails
            }

            return NextResponse.json({
                success: true,
                message: 'Signup request denied',
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('POST /api/admin/signup-requests error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}

function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
}
