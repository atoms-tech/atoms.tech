const CHUNKR_API_KEY =
    process.env.NEXT_PUBLIC_CHUNKR_API_KEY ||
    (process.env.NODE_ENV === 'production'
        ? undefined
        : 'mock_api_key_for_build');
const CHUNKR_API_URL =
    process.env.NEXT_PUBLIC_CHUNKR_API_URL || 'https://api.chunkr.ai/api/v1';

if (!CHUNKR_API_KEY && process.env.NODE_ENV === 'production') {
    throw new Error(
        'Missing required environment variable: NEXT_PUBLIC_CHUNKR_API_KEY',
    );
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

export class ChunkrService {
    private static instance: ChunkrService;

    private constructor() {}

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

            console.log('Making API request to start OCR task');
            const response = await fetch(`${CHUNKR_API_URL}/task/parse`, {
                method: 'POST',
                headers: {
                    Authorization: `${CHUNKR_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Start OCR task API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    responseBody: errorText,
                });
                throw new Error(
                    `Failed to start OCR task: ${response.status} ${response.statusText}`,
                );
            }

            const result = (await response.json()) as TaskResponse;
            console.log(
                'OCR task started successfully with task ID:',
                result.task_id,
            );
            return result;
        } catch (error) {
            console.error('Start OCR task process failed:', error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Unknown error occurred';
            throw new Error(`Failed to start OCR task: ${errorMessage}`);
        }
    }

    async getTaskStatus({ taskId }: GetOCRRunParams): Promise<TaskResponse> {
        console.log('Getting OCR task status for task ID:', taskId);

        try {
            const response = await fetch(`${CHUNKR_API_URL}/task/${taskId}`, {
                method: 'GET',
                headers: {
                    Authorization: `${CHUNKR_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Get OCR task status API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    responseBody: errorText,
                });
                throw new Error(
                    `Failed to get OCR task status: ${response.status} ${response.statusText}`,
                );
            }

            const result = (await response.json()) as TaskResponse;
            console.log('OCR task status retrieved:', result.status);
            return result;
        } catch (error) {
            console.error('Get OCR task status process failed:', error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Unknown error occurred';
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
                    console.error(
                        `Processing failed for file ${file.name}:`,
                        error,
                    );
                    throw error;
                }
            });

            // Wait for all tasks to complete and return only the task IDs
            return await Promise.all(taskPromises);
        } catch (error) {
            console.error('Files processing failed:', error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Unknown error occurred';
            throw new Error(`Failed to process files: ${errorMessage}`);
        }
    }
}

// Export a singleton instance
export const chunkrService = ChunkrService.getInstance();
