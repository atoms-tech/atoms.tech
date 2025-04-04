import { NextRequest, NextResponse } from 'next/server';

import { TaskStatus, chunkrService } from '@/lib/services/chunkr';
import { gumloopService } from '@/lib/services/gumloop';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const action = formData.get('action') as string;

        switch (action) {
            case 'startAnalysis': {
                const requirement = formData.get('requirement') as string;
                const systemName = formData.get('systemName') as string;
                const objective = formData.get('objective') as string;
                const files = formData.getAll('files') as File[];

                // Start OCR tasks for any uploaded files
                const ocrTaskIds = files?.length
                    ? await Promise.all(
                          files.map(async (file) => {
                              // Convert File to base64
                              const buffer = await file.arrayBuffer();
                              const base64 =
                                  Buffer.from(buffer).toString('base64');
                              const result = await chunkrService.startOcrTask({
                                  file: base64,
                                  ocr_strategy: 'Auto',
                              });
                              return result.task_id;
                          }),
                      )
                    : [];

                // Wait for OCR tasks to complete if there are any
                const taskStatuses = await Promise.all(
                    ocrTaskIds.map(async (taskId) => {
                        let status = await chunkrService.getTaskStatus({
                            taskId,
                        });
                        while (
                            status.status === TaskStatus.STARTING ||
                            status.status === TaskStatus.PROCESSING
                        ) {
                            await new Promise((resolve) =>
                                setTimeout(resolve, 1000),
                            );
                            status = await chunkrService.getTaskStatus({
                                taskId,
                            });
                        }
                        return status;
                    }),
                );

                // Get OCR results and combine all segments
                const ocrResults = taskStatuses.map((status) => ({
                    input_name: 'context_document',
                    value: status.output.chunks
                        .flatMap((chunk) => chunk.segments)
                        .map((segment) => segment.markdown)
                        .join('\n'),
                }));

                // Start the analysis pipeline
                const pipelineResponse = await gumloopService.startPipeline({
                    pipelineType: 'requirement-analysis',
                    requirement,
                    systemName,
                    objective,
                    customPipelineInputs: ocrResults,
                });

                return NextResponse.json(pipelineResponse);
            }

            case 'startPipeline': {
                const requirement = formData.get('requirement') as string;
                const systemName = formData.get('systemName') as string;
                const objective = formData.get('objective') as string;
                const pipelineType = formData.get('pipelineType') as
                    | 'file-processing'
                    | 'requirement-analysis'
                    | 'reasoning-requirement-analysis';
                const customPipelineInputs = JSON.parse(
                    (formData.get('customPipelineInputs') as string) || '[]',
                );

                const response = await gumloopService.startPipeline({
                    pipelineType,
                    requirement,
                    systemName,
                    objective,
                    customPipelineInputs,
                });
                return NextResponse.json(response);
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 },
                );
        }
    } catch (error) {
        console.error('Demo API error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Internal server error',
            },
            { status: 500 },
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const runId = request.nextUrl.searchParams.get('runId');
        const taskId = request.nextUrl.searchParams.get('taskId');

        if (!runId && !taskId) {
            return NextResponse.json(
                { error: 'Either runId or taskId is required' },
                { status: 400 },
            );
        }

        if (runId) {
            const pipelineRun = await gumloopService.getPipelineRun({
                runId,
            });
            return NextResponse.json(pipelineRun);
        }

        if (taskId) {
            const taskStatus = await chunkrService.getTaskStatus({ taskId });
            return NextResponse.json(taskStatus);
        }
    } catch (error) {
        console.error('Demo API error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Internal server error',
            },
            { status: 500 },
        );
    }
}
