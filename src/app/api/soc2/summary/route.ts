import { NextRequest, NextResponse } from 'next/server';

import { soc2ComplianceService } from '@/lib/soc2/complianceService';

export async function GET(request: NextRequest) {
    try {
        const summary = await soc2ComplianceService.getComplianceSummary();

        return NextResponse.json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error('SOC2 summary error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch compliance summary',
            },
            { status: 500 },
        );
    }
}
