import { NextRequest, NextResponse } from 'next/server';
import { emailService, NewsletterData } from '@/lib/email/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { email, name } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Prepare newsletter data
    const newsletterData: NewsletterData = {
      email: email.trim().toLowerCase(),
      name: name?.trim(),
    };

    // Send welcome email
    const result = await emailService.sendNewsletterWelcome(newsletterData);

    if (!result.success) {
      console.error('Failed to send newsletter welcome email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send welcome email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Successfully subscribed to newsletter' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Newsletter API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
