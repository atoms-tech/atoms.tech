import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { emailService } from '@/lib/email/emailService';
import { ContactFormTemplate } from '@/lib/email/templates/ContactFormTemplate';
import { supabase } from '@/lib/supabase/supabaseBrowser';

const contactSubmissionSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate the request body
        const validatedData = contactSubmissionSchema.parse(body);

        // For now, just log the contact submission
        // TODO: Store in database when contact_submissions table is created
        console.log('Contact form submission:', {
            name: validatedData.name,
            email: validatedData.email,
            subject: validatedData.subject,
            message: validatedData.message,
            timestamp: new Date().toISOString(),
        });

        // Generate submission ID
        const submissionId = `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Send email notification to admin
        const emailResult = await emailService.sendEmail({
            to: process.env.ADMIN_EMAIL || 'admin@atoms.tech',
            subject: `Contact Form: ${validatedData.subject}`,
            template: ContactFormTemplate({
                name: validatedData.name,
                email: validatedData.email,
                subject: validatedData.subject,
                message: validatedData.message,
                submittedAt: new Date().toLocaleString(),
            }),
            replyTo: validatedData.email,
        });

        // Log email result
        if (!emailResult.success) {
            console.error(
                'Failed to send contact form email:',
                emailResult.error,
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Contact form submitted successfully',
                id: submissionId,
                emailSent: emailResult.success,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Contact form submission error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: error.errors,
                },
                { status: 400 },
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
