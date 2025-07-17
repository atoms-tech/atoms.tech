import { NextRequest, NextResponse } from 'next/server';

import { gumloopService } from '@/lib/services/gumloop';

export async function POST(request: NextRequest) {
    try {
        // Parse body as form data
        const formData = await request.formData();

        const uploadedFiles = await gumloopService.uploadFiles(
            formData.getAll('files') as File[],
        );
        return NextResponse.json({
            success: true,
            files: uploadedFiles,
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'An error occurred',
            },
            { status: 500 },
        );
    }
}
