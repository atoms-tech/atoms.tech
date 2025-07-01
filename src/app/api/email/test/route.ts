import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/emailService';

export async function POST(request: NextRequest) {
  try {
    // Test the email service
    const result = await emailService.testEmailService();

    if (!result.success) {
      console.error('Email service test failed:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Email service test failed' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email service is working correctly' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email test API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
