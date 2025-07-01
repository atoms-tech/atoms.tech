import { NextRequest, NextResponse } from 'next/server';
import { soc2ComplianceService } from '@/lib/soc2/complianceService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const auditEvents = await soc2ComplianceService.getAuditEvents(limit);
    
    return NextResponse.json(auditEvents, { status: 200 });
  } catch (error) {
    console.error('SOC2 audit events API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit events' },
      { status: 500 }
    );
  }
}
