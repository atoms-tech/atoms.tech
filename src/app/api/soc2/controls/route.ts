import { NextRequest, NextResponse } from 'next/server';
import { soc2ComplianceService, ControlFamily } from '@/lib/soc2/complianceService';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const family = searchParams.get('family') as ControlFamily;
        
        let controls;
        if (family && Object.values(ControlFamily).includes(family)) {
            controls = await soc2ComplianceService.getControlsByFamily(family);
        } else {
            controls = await soc2ComplianceService.getAllControls();
        }
        
        return NextResponse.json({
            success: true,
            data: controls,
        });
    } catch (error) {
        console.error('SOC2 controls error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to fetch controls' 
            },
            { status: 500 }
        );
    }
}
