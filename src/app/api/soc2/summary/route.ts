import { NextRequest, NextResponse } from 'next/server';
import { soc2ComplianceService } from '@/lib/soc2/complianceService';

export async function GET(request: NextRequest) {
  try {
    const summary = await soc2ComplianceService.getComplianceSummary();
    
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error('SOC2 summary API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance summary' },
      { status: 500 }
    );
  }
}
