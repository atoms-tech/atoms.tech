import { NextRequest, NextResponse } from 'next/server';
import { soc2ComplianceService } from '@/lib/soc2/complianceService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format = 'json' } = body;
    
    if (!['pdf', 'excel', 'csv', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: pdf, excel, csv, json' },
        { status: 400 }
      );
    }
    
    const result = await soc2ComplianceService.generateComplianceReport(format);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate report' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('SOC2 report API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
}
