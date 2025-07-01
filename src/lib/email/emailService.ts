import { Resend } from 'resend';
import { render } from '@react-email/render';
import { ContactFormTemplate } from './templates/ContactFormTemplate';
import { NewsletterWelcomeTemplate } from './templates/NewsletterWelcomeTemplate';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface NewsletterData {
  email: string;
  name?: string;
}

class EmailService {
  private resend: Resend;
  private static instance: EmailService;

  private constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    this.resend = new Resend(apiKey);
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendContactFormEmail(data: ContactFormData): Promise<{ success: boolean; error?: string }> {
    try {
      const emailHtml = render(ContactFormTemplate(data));
      
      const result = await this.resend.emails.send({
        from: 'ATOMS.tech Contact <noreply@atoms.tech>',
        to: ['contact@atoms.tech'],
        subject: `Contact Form: ${data.subject}`,
        html: emailHtml,
        replyTo: data.email,
      });

      if (result.error) {
        console.error('Resend error:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log('Contact form email sent successfully:', result.data?.id);
      return { success: true };
    } catch (error) {
      console.error('Error sending contact form email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  async sendNewsletterWelcome(data: NewsletterData): Promise<{ success: boolean; error?: string }> {
    try {
      const emailHtml = render(NewsletterWelcomeTemplate(data));
      
      const result = await this.resend.emails.send({
        from: 'ATOMS.tech Newsletter <newsletter@atoms.tech>',
        to: [data.email],
        subject: 'Welcome to ATOMS.tech Newsletter!',
        html: emailHtml,
      });

      if (result.error) {
        console.error('Resend error:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log('Newsletter welcome email sent successfully:', result.data?.id);
      return { success: true };
    } catch (error) {
      console.error('Error sending newsletter welcome email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  async testEmailService(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.resend.emails.send({
        from: 'ATOMS.tech Test <test@atoms.tech>',
        to: ['test@atoms.tech'],
        subject: 'Email Service Test',
        html: '<h1>Email service is working!</h1><p>This is a test email from ATOMS.tech.</p>',
      });

      if (result.error) {
        console.error('Resend test error:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log('Test email sent successfully:', result.data?.id);
      return { success: true };
    } catch (error) {
      console.error('Error testing email service:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}

export const emailService = EmailService.getInstance();
