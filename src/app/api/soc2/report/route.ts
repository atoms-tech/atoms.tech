import { NextResponse } from 'next/server';

import { soc2ComplianceService } from '@/lib/soc2/complianceService';

export async function GET() {
    try {
        const report = await soc2ComplianceService.generateComplianceReport();

        return NextResponse.json({
            success: true,
            data: report,
        });
    } catch (error) {
        console.error('SOC2 report error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to generate compliance report',
            },
            { status: 500 },
        );
    }
}
