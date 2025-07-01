import { render } from '@react-email/render';
import { ReactElement } from 'react';
import { Resend } from 'resend';

// Email service configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@atoms.tech';

// Initialize Resend only if API key is available
let resend: Resend | null = null;
if (RESEND_API_KEY) {
    resend = new Resend(RESEND_API_KEY);
}

// Email types
export interface EmailOptions {
    to: string | string[];
    subject: string;
    template?: ReactElement;
    html?: string;
    text?: string;
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
    headers?: Record<string, string>;
}

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

// Email service class
export class EmailService {
    private static instance: EmailService;

    private constructor() {}

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    /**
     * Send an email using Resend
     */
    async sendEmail(options: EmailOptions): Promise<EmailResult> {
        try {
            // Check if Resend is configured
            if (!resend) {
                console.warn(
                    'Resend API key not configured. Email would be sent to:',
                    options.to,
                );
                return {
                    success: false,
                    error: 'Email service not configured. Please set RESEND_API_KEY environment variable.',
                };
            }

            // Validate required fields
            if (!options.to || !options.subject) {
                throw new Error('Missing required fields: to, subject');
            }

            // Prepare email content
            let htmlContent = options.html;
            let textContent = options.text;

            // If template is provided, render it
            if (options.template) {
                htmlContent = await render(options.template);
                // Generate text version if not provided
                if (!textContent) {
                    textContent = this.htmlToText(htmlContent);
                }
            }

            // Ensure we have content
            if (!htmlContent && !textContent) {
                throw new Error('Email must have either HTML or text content');
            }

            // Send email via Resend
            const result = await resend.emails.send({
                from: FROM_EMAIL,
                to: Array.isArray(options.to) ? options.to : [options.to],
                subject: options.subject,
                html: htmlContent,
                text: textContent,
                cc: options.cc,
                bcc: options.bcc,
                replyTo: options.replyTo,
                headers: options.headers,
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

            return {
                success: true,
                messageId: result.data?.id,
            };
        } catch (error) {
            console.error('Email sending failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Send contact form notification
     */
    async sendContactFormNotification(data: {
        name: string;
        email: string;
        subject: string;
        message: string;
    }): Promise<EmailResult> {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@atoms.tech';

        const htmlContent = `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${data.message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p><small>Sent from ATOMS.TECH Contact Form</small></p>
        `;

        return this.sendEmail({
            to: adminEmail,
            subject: `Contact Form: ${data.subject}`,
            html: htmlContent,
            replyTo: data.email,
        });
    }

    /**
     * Send newsletter confirmation
     */
    async sendNewsletterConfirmation(email: string): Promise<EmailResult> {
        const htmlContent = `
            <h2>Welcome to ATOMS.TECH Newsletter!</h2>
            <p>Thank you for subscribing to our newsletter.</p>
            <p>You'll receive updates about new features, improvements, and industry insights.</p>
            <p>If you didn't subscribe to this newsletter, you can safely ignore this email.</p>
            <hr>
            <p><small>ATOMS.TECH - Requirements Management Platform</small></p>
        `;

        return this.sendEmail({
            to: email,
            subject: 'Welcome to ATOMS.TECH Newsletter',
            html: htmlContent,
        });
    }

    /**
     * Send email verification
     */
    async sendEmailVerification(
        email: string,
        verificationUrl: string,
    ): Promise<EmailResult> {
        const htmlContent = `
            <h2>Verify Your Email Address</h2>
            <p>Please click the link below to verify your email address:</p>
            <p><a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <hr>
            <p><small>ATOMS.TECH - Requirements Management Platform</small></p>
        `;

        return this.sendEmail({
            to: email,
            subject: 'Verify Your Email Address - ATOMS.TECH',
            html: htmlContent,
        });
    }

    /**
     * Send password reset email
     */
    async sendPasswordReset(
        email: string,
        resetUrl: string,
    ): Promise<EmailResult> {
        const htmlContent = `
            <h2>Reset Your Password</h2>
            <p>You requested a password reset for your ATOMS.TECH account.</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <hr>
            <p><small>ATOMS.TECH - Requirements Management Platform</small></p>
        `;

        return this.sendEmail({
            to: email,
            subject: 'Reset Your Password - ATOMS.TECH',
            html: htmlContent,
        });
    }

    /**
     * Convert HTML to plain text (basic implementation)
     */
    private htmlToText(html: string): string {
        return html
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
            .replace(/&amp;/g, '&') // Replace &amp; with &
            .replace(/&lt;/g, '<') // Replace &lt; with <
            .replace(/&gt;/g, '>') // Replace &gt; with >
            .replace(/&quot;/g, '"') // Replace &quot; with "
            .replace(/&#39;/g, "'") // Replace &#39; with '
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();
    }

    /**
     * Test email configuration
     */
    async testConfiguration(): Promise<EmailResult> {
        const testEmail = process.env.ADMIN_EMAIL || 'test@atoms.tech';

        return this.sendEmail({
            to: testEmail,
            subject: 'ATOMS.TECH Email Service Test',
            html: '<h2>Email Service Test</h2><p>If you receive this email, the email service is working correctly!</p>',
        });
    }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
