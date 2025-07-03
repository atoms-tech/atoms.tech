import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { emailService } from '@/lib/email/emailService';
import { NewsletterWelcomeTemplate } from '@/lib/email/templates/NewsletterWelcomeTemplate';

const newsletterSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = newsletterSchema.parse(body);

        // Log subscription
        console.log(`Newsletter subscription: ${email} at ${new Date().toISOString()}`);

        // Send welcome email
        const emailResult = await emailService.sendEmail({
            to: email,
            subject: 'Welcome to ATOMS.TECH Newsletter!',
            template: NewsletterWelcomeTemplate({
                email,
                unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}`,
            }),
        });

        // Log email result
        if (!emailResult.success) {
            console.error('Failed to send newsletter welcome email:', emailResult.error);
        }

        // TODO: Save to database in production

        return NextResponse.json(
            {
                success: true,
                message: 'Successfully subscribed to newsletter',
                emailSent: emailResult.success,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Invalid email address' 
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to subscribe to newsletter' 
            },
            { status: 500 }
        );
    }
}
