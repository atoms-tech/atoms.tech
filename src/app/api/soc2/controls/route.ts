import { NextRequest, NextResponse } from 'next/server';
import { soc2ComplianceService } from '@/lib/soc2/complianceService';

export async function GET(request: NextRequest) {
  try {
    const controls = await soc2ComplianceService.getAllControls();
    
    return NextResponse.json(controls, { status: 200 });
  } catch (error) {
    console.error('SOC2 controls API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance controls' },
      { status: 500 }
    );
  }
}
