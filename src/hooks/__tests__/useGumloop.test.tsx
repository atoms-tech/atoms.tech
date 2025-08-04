import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

import { useGumloop } from '../useGumloop';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Create a wrapper for React Query
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
            mutations: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        href: 'http://localhost:3000',
    },
    writable: true,
});

describe('useGumloop', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFetch.mockClear();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(typeof result.current.uploadFiles).toBe('function');
        expect(typeof result.current.startPipeline).toBe('function');
        expect(typeof result.current.getPipelineRun).toBe('function');
        expect(typeof result.current.clearCache).toBe('function');
    });

    it('should upload files successfully', async () => {
        const mockFiles = ['file1.pdf', 'file2.pdf'];
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ files: mockFiles }),
        } as Response);

        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
        const file2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });
        const files = [file1, file2];

        const uploadedFiles = await result.current.uploadFiles(files);

        expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
            method: 'POST',
            body: expect.any(FormData),
        });
        expect(uploadedFiles).toEqual(mockFiles);
    });

    it('should handle upload error', async () => {
        const errorMessage = 'Upload failed';
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Internal Server Error',
            json: async () => ({ error: errorMessage }),
        } as Response);

        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

        await expect(result.current.uploadFiles([file])).rejects.toThrow(
            `Upload failed: ${errorMessage}`,
        );

        await waitFor(() => {
            expect(result.current.error).toBeInstanceOf(Error);
        });
    });

    it('should handle upload error with malformed JSON', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Internal Server Error',
            json: async () => {
                throw new Error('Invalid JSON');
            },
        } as Response);

        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

        await expect(result.current.uploadFiles([file])).rejects.toThrow(
            'Upload failed: Internal Server Error',
        );
    });

    it('should start pipeline successfully', async () => {
        const mockResponse = { runId: 'run123', state: 'RUNNING' };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        } as Response);

        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        const startPipelineParams = {
            pipelineId: 'pipeline123',
            variables: { input: 'test' },
        };

        const pipelineResponse = await result.current.startPipeline(startPipelineParams);

        expect(mockFetch).toHaveBeenCalledWith('/api/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'startPipeline',
                ...startPipelineParams,
            }),
        });
        expect(pipelineResponse).toEqual(mockResponse);
    });

    it('should handle pipeline start error', async () => {
        const errorMessage = 'Pipeline start failed';
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Bad Request',
            json: async () => ({ error: errorMessage }),
        } as Response);

        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        const startPipelineParams = {
            pipelineId: 'pipeline123',
            variables: { input: 'test' },
        };

        await expect(result.current.startPipeline(startPipelineParams)).rejects.toThrow(
            `Pipeline start failed: ${errorMessage}`,
        );

        await waitFor(() => {
            expect(result.current.error).toBeInstanceOf(Error);
        });
    });

    it('should get pipeline run status successfully', async () => {
        const mockPipelineResponse = {
            runId: 'run123',
            state: 'DONE',
            output: { result: 'success' },
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockPipelineResponse,
        } as Response);

        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        const pipelineRunHook = renderHook(
            () => result.current.getPipelineRun('run123', 'org123'),
            {
                wrapper: createWrapper(),
            },
        );

        await waitFor(() => {
            expect(pipelineRunHook.result.current.data).toEqual(mockPipelineResponse);
        });

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:3000/api/ai?runId=run123&organizationId=org123',
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    });

    it('should handle pipeline run status error', async () => {
        const errorMessage = 'Pipeline not found';
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Not Found',
            json: async () => ({ error: errorMessage }),
        } as Response);

        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        const pipelineRunHook = renderHook(
            () => result.current.getPipelineRun('run123', 'org123'),
            {
                wrapper: createWrapper(),
            },
        );

        await waitFor(() => {
            expect(pipelineRunHook.result.current.error).toBeInstanceOf(Error);
        });
    });

    it('should refetch for running pipelines', async () => {
        const mockPipelineResponse = {
            runId: 'run123',
            state: 'RUNNING',
            output: null,
        };

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockPipelineResponse,
        } as Response);

        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        const pipelineRunHook = renderHook(
            () => result.current.getPipelineRun('run123', 'org123'),
            {
                wrapper: createWrapper(),
            },
        );

        await waitFor(() => {
            expect(pipelineRunHook.result.current.data).toEqual(mockPipelineResponse);
        });

        // Should continue polling for running pipelines
        expect(mockFetch).toHaveBeenCalled();
    });

    it('should not refetch for completed pipelines', async () => {
        const mockPipelineResponse = {
            runId: 'run123',
            state: 'DONE',
            output: { result: 'completed' },
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockPipelineResponse,
        } as Response);

        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        const pipelineRunHook = renderHook(
            () => result.current.getPipelineRun('run123', 'org123'),
            {
                wrapper: createWrapper(),
            },
        );

        await waitFor(() => {
            expect(pipelineRunHook.result.current.data).toEqual(mockPipelineResponse);
        });

        // Should not continue polling for completed pipelines
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not refetch for failed pipelines', async () => {
        const mockPipelineResponse = {
            runId: 'run123',
            state: 'FAILED',
            output: { error: 'Pipeline failed' },
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockPipelineResponse,
        } as Response);

        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        const pipelineRunHook = renderHook(
            () => result.current.getPipelineRun('run123', 'org123'),
            {
                wrapper: createWrapper(),
            },
        );

        await waitFor(() => {
            expect(pipelineRunHook.result.current.data).toEqual(mockPipelineResponse);
        });

        // Should not continue polling for failed pipelines
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should skip cache when option is set', () => {
        const { result } = renderHook(() => useGumloop({ skipCache: true }), {
            wrapper: createWrapper(),
        });

        const pipelineRunHook = renderHook(
            () => result.current.getPipelineRun('run123', 'org123'),
            {
                wrapper: createWrapper(),
            },
        );

        // Should not enable query when skipCache is true
        expect(pipelineRunHook.result.current.fetchStatus).toBe('idle');
    });

    it('should clear cache for specific run', () => {
        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        result.current.clearCache('run123');

        expect(typeof result.current.clearCache).toBe('function');
    });

    it('should clear all cache when no runId provided', () => {
        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        result.current.clearCache();

        expect(typeof result.current.clearCache).toBe('function');
    });

    it('should not query when runId is empty', () => {
        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        const pipelineRunHook = renderHook(
            () => result.current.getPipelineRun('', 'org123'),
            {
                wrapper: createWrapper(),
            },
        );

        expect(pipelineRunHook.result.current.fetchStatus).toBe('idle');
    });

    it('should show loading state during upload and pipeline operations', async () => {
        // Mock a slow response to capture loading state
        mockFetch.mockImplementation(
            () =>
                new Promise((resolve) =>
                    setTimeout(
                        () =>
                            resolve({
                                ok: true,
                                json: async () => ({ files: ['file1.pdf'] }),
                            } as Response),
                        100,
                    ),
                ),
        );

        const { result } = renderHook(() => useGumloop(), {
            wrapper: createWrapper(),
        });

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        const uploadPromise = result.current.uploadFiles([file]);

        // Check loading state is true during upload
        expect(result.current.loading).toBe(true);

        await uploadPromise;

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
    });

    it('should handle different pipeline states for refetch interval', async () => {
        const states = ['STARTING', 'PENDING', 'UNKNOWN'];

        for (const state of states) {
            const mockPipelineResponse = {
                runId: 'run123',
                state,
                output: null,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockPipelineResponse,
            } as Response);

            const { result } = renderHook(() => useGumloop(), {
                wrapper: createWrapper(),
            });

            const pipelineRunHook = renderHook(
                () => result.current.getPipelineRun('run123', 'org123'),
                {
                    wrapper: createWrapper(),
                },
            );

            await waitFor(() => {
                expect(pipelineRunHook.result.current.data).toEqual(mockPipelineResponse);
            });
        }
    });
});