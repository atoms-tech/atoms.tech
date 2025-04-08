import { NextRequest, NextResponse } from 'next/server';

import { TaskStatus, chunkrService } from '@/lib/services/chunkr';
import { PipelineRunState, gumloopService } from '@/lib/services/gumloop';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const action = formData.get('action') as string;

        switch (action) {
            case 'startAnalysis': {
                const useRegulation = formData.get('useRegulation') === 'true';
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

                // Start the analysis pipeline based on regulation setting
                const savedItemId = useRegulation
                    ? 'ioyextDshJrS61aMxj3YFF' // with regulation
                    : 'cfF45UM6MXgcGW7ddhwvDc'; // without regulation

                // Prepare pipeline inputs based on regulation setting
                const pipelineInputs = [
                    ...ocrResults,
                    {
                        input_name: 'System Name',
                        value: systemName || '',
                    },
                    {
                        input_name: 'Requirement',
                        value: requirement,
                    },
                    {
                        input_name: 'Objective',
                        value: objective || '',
                    },
                    {
                        input_name: 'REQ-ID',
                        value: '',
                    },
                ];

                // Add additional parameters for non-regulated flow
                if (!useRegulation) {
                    pipelineInputs.push(
                        {
                            input_name: 'Temperature',
                            value: '1',
                        },
                        {
                            input_name: 'model_preference',
                            value: 'GPT-4o Mini',
                        },
                    );
                }

                const pipelineResponse = await gumloopService.startPipeline({
                    savedItemId,
                    customPipelineInputs: pipelineInputs,
                });

                // For regulated flow, we need to store the pipeline run ID to upload results to Gumloop later
                if (useRegulation) {
                    // Store the run ID in the response for later use
                    return NextResponse.json({
                        ...pipelineResponse,
                        useRegulation: true,
                    });
                }

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
        const useRegulation =
            request.nextUrl.searchParams.get('useRegulation') === 'true';

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

            // For regulated flow, if the pipeline is done, upload the results to Gumloop
            if (useRegulation && pipelineRun.state === PipelineRunState.DONE) {
                try {
                    // Extract the analysis JSON from the pipeline run
                    let analysisJSON = pipelineRun.outputs?.analysisJson;

                    if (!analysisJSON) {
                        console.error('No analysis JSON found in response');
                    } else {
                        // If analysisJSON is an array, take the first element
                        if (Array.isArray(analysisJSON)) {
                            analysisJSON = analysisJSON[0];
                        }

                        // If the content is a string and contains ```json```, clean it
                        let parsedJSON;
                        if (typeof analysisJSON === 'string') {
                            analysisJSON = analysisJSON
                                .replace(/```json\n?/g, '')
                                .replace(/```/g, '');
                            parsedJSON = JSON.parse(analysisJSON);
                        } else {
                            parsedJSON = analysisJSON;
                        }

                        // Upload the results to Gumloop for the regulated flow
                        await gumloopService.startPipeline({
                            savedItemId: 'ioyextDshJrS61aMxj3YFF',
                            customPipelineInputs: [
                                {
                                    input_name: 'System Name',
                                    value: '',
                                },
                                {
                                    input_name: 'Requirement',
                                    value: '',
                                },
                                {
                                    input_name: 'Objective',
                                    value: '',
                                },
                                {
                                    input_name: 'REQ-ID',
                                    value: '',
                                },
                                {
                                    input_name: 'analysis_result',
                                    value: JSON.stringify(parsedJSON),
                                },
                            ],
                        });

                        console.log(
                            'Uploaded analysis results to Gumloop for regulated flow',
                        );
                    }
                } catch (error) {
                    console.error(
                        'Failed to upload analysis results to Gumloop:',
                        error,
                    );
                }
            }

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
