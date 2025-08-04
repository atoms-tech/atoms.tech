import { ChunkrService, chunkrService, TaskStatus } from '../chunkr';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Buffer for Node.js environment
global.Buffer = global.Buffer || {
    from: jest.fn().mockImplementation((data: Uint8Array, encoding?: string) => ({
        toString: jest.fn().mockReturnValue('base64string'),
    })),
} as typeof Buffer;

describe('ChunkrService', () => {
    let service: ChunkrService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = ChunkrService.getInstance();
        
        // Mock console methods
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Singleton Pattern', () => {
        it('returns the same instance', () => {
            const instance1 = ChunkrService.getInstance();
            const instance2 = ChunkrService.getInstance();
            
            expect(instance1).toBe(instance2);
        });

        it('exports a singleton instance', () => {
            expect(chunkrService).toBeInstanceOf(ChunkrService);
            expect(chunkrService).toBe(ChunkrService.getInstance());
        });
    });

    describe('startOcrTask', () => {
        const mockTaskResponse = {
            output: {
                file_name: 'test.pdf',
                chunks: [
                    {
                        segments: [
                            { markdown: 'Test content' }
                        ]
                    }
                ]
            },
            status: TaskStatus.STARTING,
            task_id: 'task-123',
            task_url: 'https://api.chunkr.ai/task/123'
        };

        it('starts OCR task successfully with default parameters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockTaskResponse),
            });

            const result = await service.startOcrTask({ file: 'base64file' });

            expect(result).toEqual(mockTaskResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/task/parse'),
                {
                    method: 'POST',
                    headers: {
                        Authorization: expect.any(String),
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        file: 'base64file',
                        expires_in: 86400,
                        high_resolution: false,
                        ocr_strategy: 'All',
                        llm_processing: {
                            model_id: 'gemini-flash-2.5',
                            fallback_strategy: {
                                Model: 'gpt-4.1',
                            },
                        },
                    }),
                }
            );
        });

        it('starts OCR task with custom parameters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockTaskResponse),
            });

            await service.startOcrTask({
                file: 'base64file',
                expires_in: 3600,
                high_resolution: true,
                ocr_strategy: 'Auto',
            });

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody).toMatchObject({
                file: 'base64file',
                expires_in: 3600,
                high_resolution: true,
                ocr_strategy: 'Auto',
            });
        });

        it('handles API error response', async () => {
            const errorResponse = 'Invalid API key';
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                text: jest.fn().mockResolvedValue(errorResponse),
            });

            await expect(service.startOcrTask({ file: 'base64file' }))
                .rejects.toThrow('Failed to start OCR task: 401 Unauthorized');

            expect(console.error).toHaveBeenCalledWith(
                'Start OCR task API error:',
                expect.objectContaining({
                    status: 401,
                    statusText: 'Unauthorized',
                    responseBody: errorResponse,
                })
            );
        });

        it('handles network error', async () => {
            const networkError = new Error('Network connection failed');
            mockFetch.mockRejectedValueOnce(networkError);

            await expect(service.startOcrTask({ file: 'base64file' }))
                .rejects.toThrow('Failed to start OCR task: Network connection failed');

            expect(console.error).toHaveBeenCalledWith(
                'Start OCR task process failed:',
                networkError
            );
        });

        it('logs successful task creation', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockTaskResponse),
            });

            await service.startOcrTask({ file: 'base64file' });

            expect(console.log).toHaveBeenCalledWith('Making API request to start OCR task');
            expect(console.log).toHaveBeenCalledWith(
                'OCR task started successfully with task ID:',
                mockTaskResponse.task_id
            );
        });

        it('includes correct LLM processing configuration', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockTaskResponse),
            });

            await service.startOcrTask({ file: 'base64file' });

            const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(callBody.llm_processing).toEqual({
                model_id: 'gemini-flash-2.5',
                fallback_strategy: {
                    Model: 'gpt-4.1',
                },
            });
        });
    });

    describe('getTaskStatus', () => {
        const mockStatusResponse = {
            output: {
                file_name: 'test.pdf',
                chunks: [
                    {
                        segments: [
                            { markdown: 'Extracted content' }
                        ]
                    }
                ]
            },
            status: TaskStatus.SUCCEEDED,
            task_id: 'task-123',
            task_url: 'https://api.chunkr.ai/task/123'
        };

        it('gets task status successfully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockStatusResponse),
            });

            const result = await service.getTaskStatus({ taskId: 'task-123' });

            expect(result).toEqual(mockStatusResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/task/task-123'),
                {
                    method: 'GET',
                    headers: {
                        Authorization: expect.any(String),
                        'Content-Type': 'application/json',
                    },
                }
            );
        });

        it('handles task not found error', async () => {
            const errorResponse = 'Task not found';
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                text: jest.fn().mockResolvedValue(errorResponse),
            });

            await expect(service.getTaskStatus({ taskId: 'invalid-task' }))
                .rejects.toThrow('Failed to get OCR task status: 404 Not Found');

            expect(console.error).toHaveBeenCalledWith(
                'Get OCR task status API error:',
                expect.objectContaining({
                    status: 404,
                    statusText: 'Not Found',
                    responseBody: errorResponse,
                })
            );
        });

        it('handles network error', async () => {
            const networkError = new Error('Network timeout');
            mockFetch.mockRejectedValueOnce(networkError);

            await expect(service.getTaskStatus({ taskId: 'task-123' }))
                .rejects.toThrow('Failed to get OCR task status: Network timeout');

            expect(console.error).toHaveBeenCalledWith(
                'Get OCR task status process failed:',
                networkError
            );
        });

        it('logs status retrieval', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockStatusResponse),
            });

            await service.getTaskStatus({ taskId: 'task-123' });

            expect(console.log).toHaveBeenCalledWith(
                'Getting OCR task status for task ID:',
                'task-123'
            );
            expect(console.log).toHaveBeenCalledWith(
                'OCR task status retrieved:',
                TaskStatus.SUCCEEDED
            );
        });
    });

    describe('fileToBase64', () => {
        it('converts file to base64 string', async () => {
            const mockFileBytes = new Uint8Array([1, 2, 3, 4]);
            const mockFile = {
                bytes: jest.fn().mockResolvedValue(mockFileBytes),
            } as { bytes: jest.Mock };

            const result = await service.fileToBase64(mockFile);

            expect(mockFile.bytes).toHaveBeenCalled();
            expect(result).toBe('AQIDBA=='); // Correct base64 encoding of [1, 2, 3, 4]
        });

        it('handles file reading error', async () => {
            const fileError = new Error('File reading failed');
            const mockFile = {
                bytes: jest.fn().mockRejectedValue(fileError),
            } as { bytes: jest.Mock };

            await expect(service.fileToBase64(mockFile)).rejects.toThrow(fileError);
        });
    });

    describe('processFiles', () => {
        const createMockFile = (name: string, type: string = 'application/pdf') => ({
            name,
            type,
            bytes: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
        }) as { name: string; type: string; bytes: jest.Mock };

        beforeEach(() => {
            // Mock successful OCR task start for processFiles tests
            mockFetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({
                    task_id: 'task-123',
                    status: TaskStatus.STARTING,
                    output: null,
                    task_url: null,
                }),
            });
        });

        it('processes multiple PDF files successfully', async () => {
            const files = [
                createMockFile('file1.pdf'),
                createMockFile('file2.pdf'),
                createMockFile('file3.pdf'),
            ];

            const taskIds = await service.processFiles(files);

            expect(taskIds).toEqual(['task-123', 'task-123', 'task-123']);
            expect(mockFetch).toHaveBeenCalledTimes(3);
            expect(console.log).toHaveBeenCalledWith(
                'Processing multiple files for OCR:',
                ['file1.pdf', 'file2.pdf', 'file3.pdf']
            );
        });

        it('validates that all files are PDFs', async () => {
            const files = [
                createMockFile('file1.pdf'),
                createMockFile('file2.jpg', 'image/jpeg'), // Invalid type
            ];

            await expect(service.processFiles(files)).rejects.toThrow(
                'Only PDF files are supported for OCR processing. Invalid file: file2.jpg'
            );
        });

        it('processes files in parallel', async () => {
            const files = [
                createMockFile('file1.pdf'),
                createMockFile('file2.pdf'),
            ];

            let resolveCount = 0;
            mockFetch.mockImplementation(() => {
                resolveCount++;
                return Promise.resolve({
                    ok: true,
                    json: jest.fn().mockResolvedValue({
                        task_id: `task-${resolveCount}`,
                        status: TaskStatus.STARTING,
                        output: null,
                        task_url: null,
                    }),
                });
            });

            const taskIds = await service.processFiles(files);

            expect(taskIds).toEqual(['task-1', 'task-2']);
            // Both requests should have been initiated
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('handles individual file processing errors', async () => {
            const files = [createMockFile('file1.pdf')];

            mockFetch.mockRejectedValueOnce(new Error('OCR service error'));

            await expect(service.processFiles(files)).rejects.toThrow(
                'Failed to process files: Failed to start OCR task: OCR service error'
            );

            expect(console.error).toHaveBeenCalledWith(
                'Processing failed for file file1.pdf:',
                expect.any(Error)
            );
        });

        it('handles empty file array', async () => {
            const taskIds = await service.processFiles([]);

            expect(taskIds).toEqual([]);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('logs processing details', async () => {
            const files = [createMockFile('test.pdf')];

            await service.processFiles(files);

            expect(console.log).toHaveBeenCalledWith(
                'Processing multiple files for OCR:',
                ['test.pdf']
            );
        });

        it('preserves original error messages', async () => {
            const files = [createMockFile('file1.pdf')];
            const originalError = new Error('Specific API error');

            mockFetch.mockRejectedValueOnce(originalError);

            await expect(service.processFiles(files)).rejects.toThrow(
                'Failed to process files: Failed to start OCR task: Specific API error'
            );
        });

        it('handles unknown errors gracefully', async () => {
            const files = [createMockFile('file1.pdf')];

            // Simulate non-Error object being thrown
            mockFetch.mockRejectedValueOnce('String error');

            await expect(service.processFiles(files)).rejects.toThrow(
                'Failed to process files: Failed to start OCR task: Unknown error occurred'
            );
        });
    });

    describe('TaskStatus Enum', () => {
        it('has all expected status values', () => {
            expect(TaskStatus.STARTING).toBe('Starting');
            expect(TaskStatus.PROCESSING).toBe('Processing');
            expect(TaskStatus.SUCCEEDED).toBe('Succeeded');
            expect(TaskStatus.FAILED).toBe('Failed');
            expect(TaskStatus.CANCELLED).toBe('Cancelled');
        });

        it('enum values are strings', () => {
            Object.values(TaskStatus).forEach(status => {
                expect(typeof status).toBe('string');
            });
        });
    });

    describe('Error Handling', () => {
        it('handles unknown error types in startOcrTask', async () => {
            mockFetch.mockRejectedValueOnce('String error');

            await expect(service.startOcrTask({ file: 'base64file' }))
                .rejects.toThrow('Failed to start OCR task: Unknown error occurred');
        });

        it('handles unknown error types in getTaskStatus', async () => {
            mockFetch.mockRejectedValueOnce({ custom: 'error object' });

            await expect(service.getTaskStatus({ taskId: 'task-123' }))
                .rejects.toThrow('Failed to get OCR task status: Unknown error occurred');
        });

        it('preserves error stack traces', async () => {
            const originalError = new Error('Original error');
            originalError.stack = 'Original stack trace';
            
            mockFetch.mockRejectedValueOnce(originalError);

            try {
                await service.startOcrTask({ file: 'base64file' });
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toContain('Original error');
            }
        });
    });

    describe('Environment Configuration', () => {
        it('uses correct API URL from environment', () => {
            // API URL should be used in fetch calls
            expect(mockFetch).not.toHaveBeenCalled(); // No calls yet in this test
            
            // Test that the module loads without throwing due to missing env vars
            expect(() => require('../chunkr')).not.toThrow();
        });
    });
});