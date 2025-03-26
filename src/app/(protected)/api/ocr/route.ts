import { NextRequest, NextResponse } from 'next/server';

import { chunkrService } from '@/lib/services/chunkr';

export async function POST(request: NextRequest) {
    try {
        // Parse body as form data
        const formData = await request.formData();

        const taskIds = await chunkrService.processFiles(
            formData.getAll('files') as File[],
        );
        return NextResponse.json({
            success: true,
            taskIds,
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'An error occurred',
            },
            { status: 500 },
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const taskId = request.nextUrl.searchParams.get('taskId');
        if (!taskId) {
            return NextResponse.json(
                { error: 'Run ID is required' },
                { status: 400 },
            );
        }

        const task = await chunkrService.getTaskStatus({ taskId });

        return NextResponse.json(task);
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'An error occurred',
            },
            { status: 500 },
        );
    }
}
