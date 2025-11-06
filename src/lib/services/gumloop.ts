import { BaseHTTPClient } from '@/lib/http';

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

export class GumloopService extends BaseHTTPClient {
    private static instance: GumloopService;

    private constructor() {
        super({
            baseURL: GUMLOOP_API_URL,
            apiKey: `Bearer ${GUMLOOP_API_KEY}`,
            timeout: 60000, // 60 seconds for long-running operations
            retries: 3,
            retryDelay: 1000,
            onRequest: async (url, options) => {
                console.log('[Gumloop] Request:', options.method, url);
            },
            onError: async (error) => {
                console.error('[Gumloop] Error:', error.message);
            },
        });
    }

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
        for (const file of files) {
            if (
                !file.type.includes('pdf') &&
                !file.type.includes('markdown') &&
                !file.name.endsWith('.md')
            ) {
                console.error(
                    'Invalid file type detected:',
                    file.type,
                    'for file:',
                    file.name,
                );
                throw new Error(
                    `Only PDF and Markdown files are accepted. Invalid file: ${file.name}`,
                );
            }
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

            const uploadResult = await this.post<{ uploaded_files: string[] }>(
                '/upload_files',
                payload,
            );

            console.log('Upload result:', uploadResult);
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
            console.log('Starting pipeline:', {
                user_id: USER_ID,
                saved_item_id: pipeline_id,
                pipeline_inputs: pipelineInputs,
            });

            const result = await this.post<StartPipelineResponse>('/start_pipeline', {
                user_id: USER_ID,
                saved_item_id: pipeline_id,
                pipeline_inputs: pipelineInputs,
            });

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
            const result = await this.get<PipelineRunStatusResponse>(
                `/get_pl_run?run_id=${runId}&user_id=${USER_ID}`,
            );

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
