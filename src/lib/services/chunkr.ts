import { BaseHTTPClient } from '@/lib/http';

const CHUNKR_API_KEY =
    process.env.NEXT_PUBLIC_CHUNKR_API_KEY ||
    (process.env.NODE_ENV === 'production' ? undefined : 'mock_api_key_for_build');
const CHUNKR_API_URL =
    process.env.NEXT_PUBLIC_CHUNKR_API_URL || 'https://api.chunkr.ai/api/v1';

if (!CHUNKR_API_KEY) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_CHUNKR_API_KEY');
}

export enum TaskStatus {
    STARTING = 'Starting',
    PROCESSING = 'Processing',
    SUCCEEDED = 'Succeeded',
    FAILED = 'Failed',
    CANCELLED = 'Cancelled',
}

export interface TaskResponse {
    output: {
        file_name: string;
        chunks: {
            segments: {
                markdown: string;
            }[];
        }[];
    };
    status: TaskStatus;
    task_id: string;
    task_url: string | null;
}

interface StartOcrParams {
    file: string;
    expires_in?: number;
    high_resolution?: boolean;
    ocr_strategy?: 'All' | 'Auto';
}

export type GetOCRRunParams = {
    taskId: string;
};

export class ChunkrService extends BaseHTTPClient {
    private static instance: ChunkrService;

    private constructor() {
        super({
            baseURL: CHUNKR_API_URL,
            apiKey: CHUNKR_API_KEY,
            timeout: 120000, // 2 minutes for OCR operations
            retries: 3,
            retryDelay: 2000,
            onRequest: async (url, options) => {
                console.log('[Chunkr] Request:', options.method, url);
            },
            onError: async (error) => {
                console.error('[Chunkr] Error:', error.message);
            },
        });
    }

    public static getInstance(): ChunkrService {
        if (!ChunkrService.instance) {
            ChunkrService.instance = new ChunkrService();
        }
        return ChunkrService.instance;
    }

    async startOcrTask({
        file,
        expires_in = 86400, // Default 24 hours
        high_resolution = false,
        ocr_strategy = 'All',
    }: StartOcrParams): Promise<TaskResponse> {
        try {
            const payload = {
                file,
                expires_in,
                high_resolution,
                ocr_strategy,
                llm_processing: {
                    model_id: 'gemini-flash-2.5',
                    fallback_strategy: {
                        Model: 'gpt-4.1',
                    },
                },
            };

            const result = await this.post<TaskResponse>('/task/parse', payload);

            console.log('OCR task started successfully with task ID:', result.task_id);
            return result;
        } catch (error) {
            console.error('Start OCR task process failed:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to start OCR task: ${errorMessage}`);
        }
    }

    async getTaskStatus({ taskId }: GetOCRRunParams): Promise<TaskResponse> {
        console.log('Getting OCR task status for task ID:', taskId);

        try {
            const result = await this.get<TaskResponse>(`/task/${taskId}`);

            console.log('OCR task status retrieved:', result.status);
            return result;
        } catch (error) {
            console.error('Get OCR task status process failed:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to get OCR task status: ${errorMessage}`);
        }
    }

    async fileToBase64(file: File): Promise<string> {
        const fileContents = await file.bytes();
        return Buffer.from(fileContents).toString('base64');
    }

    async processFiles(files: File[]): Promise<string[]> {
        console.log(
            'Processing multiple files for OCR:',
            files.map((f) => f.name),
        );

        // Validate all files are PDFs
        for (const file of files) {
            if (!file.type.includes('pdf')) {
                throw new Error(
                    `Only PDF files are supported for OCR processing. Invalid file: ${file.name}`,
                );
            }
        }

        try {
            // Process all files in parallel
            const taskPromises = files.map(async (file) => {
                try {
                    const base64File = await this.fileToBase64(file);
                    const response = await this.startOcrTask({
                        file: base64File,
                    });
                    return response.task_id;
                } catch (error) {
                    console.error(`Processing failed for file ${file.name}:`, error);
                    throw error;
                }
            });

            // Wait for all tasks to complete and return only the task IDs
            return await Promise.all(taskPromises);
        } catch (error) {
            console.error('Files processing failed:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to process files: ${errorMessage}`);
        }
    }
}

// Export a singleton instance
export const chunkrService = ChunkrService.getInstance();
