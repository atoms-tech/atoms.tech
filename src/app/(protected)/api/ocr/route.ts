import { NextRequest, NextResponse } from 'next/server';

import { atomsApiServer } from '@/lib/atoms-api/server';

export async function POST(request: NextRequest) {
    try {
        // Parse body as form data
        const formData = await request.formData();

        const api = await atomsApiServer();
        const taskIds = await api.ocr.processFiles(formData.getAll('files') as File[]);
        return NextResponse.json({
            success: true,
            taskIds,
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

export async function GET(request: NextRequest) {
    try {
        const taskId = request.nextUrl.searchParams.get('taskId');
        if (!taskId) {
            return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
        }

        const api = await atomsApiServer();
        const task = await api.ocr.status(taskId);

        return NextResponse.json(task);
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
