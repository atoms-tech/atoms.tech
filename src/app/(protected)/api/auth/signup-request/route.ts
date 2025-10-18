import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SignupRequestBody {
    email: string;
    fullName: string;
    message?: string;
}

// Create unauthenticated Supabase client for public API
const supabasePublic = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    },
);

/**
 * POST /api/auth/signup-request
 *
 * Create a new signup request
 * Public endpoint - no authentication required
 */
export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as SignupRequestBody;
        const { email, fullName, message } = body;

        // Validate input
        if (!email || !fullName) {
            return NextResponse.json(
                { error: 'Email and full name are required' },
                { status: 400 },
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // Check if email already has a request or is already a user
        const { data: existingRequest } = await supabasePublic
            .from('signup_requests')
            .select('id, status')
            .eq('email', email)
            .single();

        if (existingRequest) {
            if (existingRequest.status === 'pending') {
                return NextResponse.json(
                    { error: 'A signup request for this email already exists' },
                    { status: 400 },
                );
            }
            if (existingRequest.status === 'approved') {
                return NextResponse.json(
                    {
                        error: 'This email has already been approved. Please check your email for an invitation.',
                    },
                    { status: 400 },
                );
            }
        }

        // Insert signup request into database
        const { data, error } = await supabasePublic
            .from('signup_requests')
            .insert([
                {
                    email,
                    full_name: fullName,
                    message: message || null,
                    status: 'pending',
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Database error creating signup request:', {
                error,
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                email,
                fullName,
            });
            return NextResponse.json(
                { error: 'Failed to create signup request' },
                { status: 500 },
            );
        }

        // Send email to support team
        try {
            const fromEmail = process.env.RESEND_FROM_EMAIL;
            const apiKey = process.env.RESEND_API_KEY;

            if (!fromEmail || !apiKey) {
                console.warn(
                    'Email notification not sent: Missing RESEND configuration',
                    {
                        hasFromEmail: !!fromEmail,
                        hasApiKey: !!apiKey,
                    },
                );
            } else {
                const emailResult = await resend.emails.send({
                    from: fromEmail,
                    to: 'support@atoms.tech',
                    subject: `New Signup Request: ${fullName} (${email})`,
                    html: `
                        <h2>New Signup Request</h2>
                        <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
                        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                        ${message ? `<p><strong>Message:</strong></p><p>${escapeHtml(message)}</p>` : ''}
                        <hr />
                        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/signup-requests">View in Dashboard</a></p>
                    `,
                });
                console.log('Signup notification email sent successfully:', {
                    emailId: emailResult.data?.id,
                    to: 'support@atoms.tech',
                });
            }
        } catch (emailError) {
            console.error('Failed to send email notification:', {
                error: emailError,
                message:
                    emailError instanceof Error ? emailError.message : 'Unknown error',
                email,
                fullName,
            });
            // Don't fail the request if email sending fails
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Signup request submitted successfully',
                requestId: data.id,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('POST /api/auth/signup-request error:', error);
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
