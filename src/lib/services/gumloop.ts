const GUMLOOP_API_KEY = process.env.NEXT_PUBLIC_GUMLOOP_API_KEY;
const GUMLOOP_API_URL =
    process.env.NEXT_PUBLIC_GUMLOOP_API_URL || 'https://api.gumloop.com/api/v1';
const USER_ID = process.env.NEXT_PUBLIC_GUMLOOP_USER_ID;
const GUMLOOP_FILE_CONVERT_FLOW_ID = process.env.NEXT_PUBLIC_GUMLOOP_FILE_CONVERT_FLOW_ID;
const GUMLOOP_REQ_ANALYSIS_FLOW_ID = process.env.NEXT_PUBLIC_GUMLOOP_REQ_ANALYSIS_FLOW_ID;
const GUMLOOP_REQ_ANALYSIS_REASONING_FLOW_ID =
    process.env.NEXT_PUBLIC_GUMLOOP_REQ_ANALYSIS_REASONING_FLOW_ID;
const GUMLOOP_TEXT_TO_MERMAID_FLOW_ID =
    process.env.NEXT_PUBLIC_GUMLOOP_TEXT_TO_MERMAID_FLOW_ID;

for (const [key, value] of Object.entries({
    GUMLOOP_API_KEY,
    USER_ID,
    GUMLOOP_FILE_CONVERT_FLOW_ID,
    GUMLOOP_REQ_ANALYSIS_FLOW_ID,
    GUMLOOP_REQ_ANALYSIS_REASONING_FLOW_ID,
    GUMLOOP_TEXT_TO_MERMAID_FLOW_ID,
})) {
    if (!value) {
        throw new Error(`Missing required environment variable: NEXT_PUBLIC_${key}`);
    }
}

type PipelineType =
    | 'file-processing'
    | 'requirement-analysis'
    | 'requirement-analysis-reasoning'
    | 'text-to-mermaid';

interface PipelineInput {
    input_name: string;
    value: string;
}

export type StartPipelineParams = {
    pipelineType?: PipelineType;
    requirement?: string;
    fileNames?: string[];
    systemName?: string;
    objective?: string;
    model_preference?: string;
    temperature?: number;
    customPipelineInputs?: PipelineInput[];
    savedItemId?: string; // Direct saved_item_id for Gumloop API
};

export type GetPipelineRunParams = {
    runId: string;
};

export interface StartPipelineResponse {
    run_id: string;
    useRegulation?: boolean;
}

export enum PipelineRunState {
    RUNNING = 'RUNNING',
    DONE = 'DONE',
    TERMINATING = 'TERMINATING',
    FAILED = 'FAILED',
    TERMINATED = 'TERMINATED',
}

export interface PipelineRunStatusResponse {
    run_id: string;
    state: PipelineRunState;
    outputs?: Record<string, string[] | string>;
    credit_cost: number;
}

export class GumloopService {
    private static instance: GumloopService;

    private constructor() {}

    public static getInstance(): GumloopService {
        if (!GumloopService.instance) {
            GumloopService.instance = new GumloopService();
        }
        return GumloopService.instance;
    }

    async uploadFiles(files: File[]): Promise<string[]> {
        console.log(
            'Starting file upload process:',
            files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
        );

        if (files.length === 0) {
            throw new Error('Please upload at least one file');
        }

        // Validate all files are PDFs or Markdown
        for (const _file of files) {
            // Removed file type restriction to allow all file types for MCP analysis
        }

        try {
            // Convert files to base64 and create payload
            console.log('Beginning base64 encoding for', files.length, 'files');
            const encodedFiles = await Promise.all(
                files.map(async (file) => {
                    const fileContents = await file.bytes();

                    return Buffer.from(fileContents).toString('base64');
                }),
            );

            const payload = {
                user_id: USER_ID,
                files: files.map((file, index) => ({
                    file_name: file.name,
                    file_content: encodedFiles[index],
                })),
            };

            console.log('Making API request to upload files');
            const response = await fetch(`${GUMLOOP_API_URL}/upload_files`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${GUMLOOP_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    responseBody: errorText,
                });
                throw new Error(
                    `Server error: ${response.status} ${response.statusText}`,
                );
            }

            const uploadResult = await response.json();
            console.log('Upload result:', uploadResult.success);
            return uploadResult.uploaded_files;
        } catch (error) {
            console.error('Upload process failed:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to upload files: ${errorMessage}`);
        }
    }

    async startPipeline({
        pipelineType,
        requirement,
        fileNames,
        systemName,
        objective,
        model_preference,
        temperature,
        customPipelineInputs,
        savedItemId,
    }: StartPipelineParams): Promise<StartPipelineResponse> {
        let pipeline_id = savedItemId;

        // If no savedItemId is provided, use the pipeline type to determine the ID
        if (!pipeline_id && pipelineType) {
            switch (pipelineType) {
                case 'file-processing':
                    pipeline_id = GUMLOOP_FILE_CONVERT_FLOW_ID;
                    break;
                case 'requirement-analysis':
                    pipeline_id = GUMLOOP_REQ_ANALYSIS_FLOW_ID;
                    break;
                case 'requirement-analysis-reasoning':
                    pipeline_id = GUMLOOP_REQ_ANALYSIS_REASONING_FLOW_ID;
                    break;
                case 'text-to-mermaid':
                    pipeline_id = GUMLOOP_TEXT_TO_MERMAID_FLOW_ID;
                    break;
                default:
                    throw new Error(`Unknown pipeline type: ${pipelineType}`);
            }
        }

        if (!pipeline_id) {
            throw new Error('Either savedItemId or pipelineType must be provided');
        }

        console.log('Starting pipeline with params:', {
            fileNames,
            systemName,
            objective,
            requirement,
        });

        const pipelineInputs: PipelineInput[] = customPipelineInputs || [];

        // Only add standard inputs if customPipelineInputs is not provided and we're using a standard pipeline type
        if (
            !customPipelineInputs &&
            pipelineType &&
            [
                'file-processing',
                'requirement-analysis',
                'requirement-analysis-reasoning',
            ].includes(pipelineType)
        ) {
            if (fileNames?.length) {
                fileNames.forEach((fileName) => {
                    pipelineInputs.push({
                        input_name: 'Regulation_Document_Name',
                        value: fileName,
                    });
                });
            }

            if (systemName) {
                pipelineInputs.push({
                    input_name: 'System Name',
                    value: systemName,
                });
            }

            if (objective) {
                pipelineInputs.push({
                    input_name: 'Objective',
                    value: objective,
                });
            }

            if (requirement) {
                pipelineInputs.push({
                    input_name: 'Requirement',
                    value: requirement,
                });
            }

            if (model_preference) {
                pipelineInputs.push({
                    input_name: 'model_preference',
                    value: model_preference,
                });
            }

            if (temperature) {
                pipelineInputs.push({
                    input_name: 'Temperature',
                    value: temperature.toString(),
                });
            }
        }

        console.log('Prepared pipeline inputs:', pipelineInputs);

        try {
            console.log('Making API request to start pipeline');
            console.log({
                user_id: USER_ID,
                saved_item_id: pipeline_id,
                pipeline_inputs: pipelineInputs,
            });
            const response = await fetch(`${GUMLOOP_API_URL}/start_pipeline`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${GUMLOOP_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: USER_ID,
                    saved_item_id: pipeline_id,
                    pipeline_inputs: pipelineInputs,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Start pipeline API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    responseBody: errorText,
                });
                throw new Error(
                    `Failed to start pipeline: ${response.status} ${response.statusText}`,
                );
            }

            const result = await response.json();
            console.log('Pipeline started successfully:', result);
            return result;
        } catch (error) {
            console.error('Start pipeline process failed:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to start pipeline: ${errorMessage}`);
        }
    }

    async getPipelineRun({
        runId,
    }: GetPipelineRunParams): Promise<PipelineRunStatusResponse> {
        console.log('Getting pipeline run status:', {
            runId,
            userId: USER_ID,
        });

        try {
            // console.log('Making API request to get pipeline run');
            const response = await fetch(
                `${GUMLOOP_API_URL}/get_pl_run?run_id=${runId}&user_id=${USER_ID}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${GUMLOOP_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Get pipeline run API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    responseBody: errorText,
                });
                throw new Error(
                    `Failed to get pipeline run status: ${response.status} ${response.statusText}`,
                );
            }

            const result = (await response.json()) as PipelineRunStatusResponse;
            // console.log('Pipeline run status retrieved:', result);
            return result;
        } catch (error) {
            console.error('Get pipeline run process failed:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to get pipeline run status: ${errorMessage}`);
        }
    }
}

// Export a singleton instance
export const gumloopService = GumloopService.getInstance();
