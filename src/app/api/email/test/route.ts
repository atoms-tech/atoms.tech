import { NextRequest, NextResponse } from 'next/server';

import { emailService } from '@/lib/email/emailService';
import { ContactFormTemplate } from '@/lib/email/templates/ContactFormTemplate';
import { NewsletterWelcomeTemplate } from '@/lib/email/templates/NewsletterWelcomeTemplate';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email address is required' },
                { status: 400 },
            );
        }

        let result;

        switch (type) {
            case 'contact':
                result = await emailService.sendEmail({
                    to: email,
                    subject: 'Test Contact Form Email',
                    template: ContactFormTemplate({
                        name: 'Test User',
                        email: 'test@example.com',
                        subject: 'Test Contact Form Submission',
                        message:
                            'This is a test message from the contact form.',
                        submittedAt: new Date().toLocaleString(),
                    }),
                });
                break;

            case 'newsletter':
                result = await emailService.sendEmail({
                    to: email,
                    subject: 'Test Newsletter Welcome Email',
                    template: NewsletterWelcomeTemplate({
                        email,
                        unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}`,
                    }),
                });
                break;

            case 'basic':
                result = await emailService.sendEmail({
                    to: email,
                    subject: 'ATOMS.TECH Email Service Test',
                    html: `
                        <h2>Email Service Test</h2>
                        <p>If you receive this email, the email service is working correctly!</p>
                        <p>Test sent at: ${new Date().toLocaleString()}</p>
                        <hr>
                        <p><small>ATOMS.TECH - Requirements Management Platform</small></p>
                    `,
                });
                break;

            default:
                return NextResponse.json(
                    {
                        error: 'Invalid email type. Use: contact, newsletter, or basic',
                    },
                    { status: 400 },
                );
        }

        return NextResponse.json({
            success: result.success,
            message: result.success
                ? `Test ${type} email sent successfully`
                : `Failed to send test ${type} email`,
            messageId: result.messageId,
            error: result.error,
        });
    } catch (error) {
        console.error('Email test error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function GET() {
    try {
        // Test basic configuration
        const result = await emailService.testConfiguration();

        return NextResponse.json({
            success: result.success,
            message: result.success
                ? 'Email service configuration is valid'
                : 'Email service configuration failed',
            error: result.error,
        });
    } catch (error) {
        console.error('Email configuration test error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
