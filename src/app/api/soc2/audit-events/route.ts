import { NextRequest, NextResponse } from 'next/server';
import { soc2ComplianceService } from '@/lib/soc2/complianceService';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        
        const auditEvents = await soc2ComplianceService.getRecentAuditEvents(limit);
        
        return NextResponse.json({
            success: true,
            data: auditEvents,
        });
    } catch (error) {
        console.error('SOC2 audit events error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to fetch audit events' 
            },
            { status: 500 }
        );
    }
}
