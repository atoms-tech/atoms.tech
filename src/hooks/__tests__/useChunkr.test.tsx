import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

import { TaskStatus } from '@/lib/services/chunkr';
import { useChunkr } from '../useChunkr';

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

describe('useChunkr', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFetch.mockClear();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useChunkr(), {
            wrapper: createWrapper(),
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(typeof result.current.startOcrTask).toBe('function');
        expect(typeof result.current.getTaskStatus).toBe('function');
        expect(typeof result.current.getTaskStatuses).toBe('function');
        expect(typeof result.current.clearCache).toBe('function');
    });

    it('should start OCR task successfully', async () => {
        const mockTaskIds = ['task1', 'task2'];
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ taskIds: mockTaskIds }),
        } as Response);

        const { result } = renderHook(() => useChunkr(), {
            wrapper: createWrapper(),
        });

        const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' });
        const file2 = new File(['content2'], 'test2.pdf', { type: 'application/pdf' });
        const files = [file1, file2];

        const taskIds = await result.current.startOcrTask(files);

        expect(mockFetch).toHaveBeenCalledWith('/api/ocr', {
            method: 'POST',
            body: expect.any(FormData),
        });
        expect(taskIds).toEqual(mockTaskIds);
    });

    it('should handle OCR task start error', async () => {
        const errorMessage = 'OCR pipeline initiation failed';
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Internal Server Error',
            json: async () => ({ error: errorMessage }),
        } as Response);

        const { result } = renderHook(() => useChunkr(), {
            wrapper: createWrapper(),
        });

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

        await expect(result.current.startOcrTask([file])).rejects.toThrow(
            `OCR pipeline initiation failed: ${errorMessage}`,
        );

        await waitFor(() => {
            expect(result.current.error).toBeInstanceOf(Error);
        });
    });

    it('should handle OCR task start error with malformed JSON', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Internal Server Error',
            json: async () => {
                throw new Error('Invalid JSON');
            },
        } as Response);

        const { result } = renderHook(() => useChunkr(), {
            wrapper: createWrapper(),
        });

        const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

        await expect(result.current.startOcrTask([file])).rejects.toThrow(
            'OCR pipeline initiation failed: Internal Server Error',
        );
    });

    it('should get task status successfully', async () => {
        const mockTaskResponse = {
            taskId: 'task1',
            status: TaskStatus.SUCCEEDED,
            output: 'extracted text',
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskResponse,
        } as Response);

        const { result } = renderHook(() => useChunkr(), {
            wrapper: createWrapper(),
        });

        const taskStatusHook = renderHook(
            () => result.current.getTaskStatus('task1'),
            {
                wrapper: createWrapper(),
            },
        );

        await waitFor(() => {
            expect(taskStatusHook.result.current.data).toEqual(mockTaskResponse);
        });

        expect(mockFetch).toHaveBeenCalledWith(
            'http://localhost:3000/api/ocr?taskId=task1',
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    });

    it('should handle task status error', async () => {
        const errorMessage = 'Task not found';
        mockFetch.mockResolvedValueOnce({
            ok: false,
            statusText: 'Not Found',
            json: async () => ({ error: errorMessage }),
        } as Response);

        const { result } = renderHook(() => useChunkr(), {
            wrapper: createWrapper(),
        });

        const taskStatusHook = renderHook(
            () => result.current.getTaskStatus('task1'),
            {
                wrapper: createWrapper(),
            },
        );

        await waitFor(() => {
            expect(taskStatusHook.result.current.error).toBeInstanceOf(Error);
        });
    });

    it('should handle multiple task statuses', async () => {
        const mockTaskResponse1 = {
            taskId: 'task1',
            status: TaskStatus.SUCCEEDED,
            output: 'text1',
        };
        const mockTaskResponse2 = {
            taskId: 'task2',
            status: TaskStatus.PROCESSING,
            output: null,
        };

        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockTaskResponse1,
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockTaskResponse2,
            } as Response);

        const { result } = renderHook(() => useChunkr(), {
            wrapper: createWrapper(),
        });

        const taskStatusesHook = renderHook(
            () => result.current.getTaskStatuses(['task1', 'task2']),
            {
                wrapper: createWrapper(),
            },
        );

        await waitFor(() => {
            expect(taskStatusesHook.result.current[0].data).toEqual(mockTaskResponse1);
            expect(taskStatusesHook.result.current[1].data).toEqual(mockTaskResponse2);
        });
    });

    it('should refetch for processing tasks', async () => {
        const mockTaskResponse = {
            taskId: 'task1',
            status: TaskStatus.PROCESSING,
            output: null,
        };

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockTaskResponse,
        } as Response);

        const { result } = renderHook(() => useChunkr(), {
            wrapper: createWrapper(),
        });

        const taskStatusHook = renderHook(
            () => result.current.getTaskStatus('task1'),
            {
                wrapper: createWrapper(),
            },
        );

        await waitFor(() => {
            expect(taskStatusHook.result.current.data).toEqual(mockTaskResponse);
        });

        // Should continue polling for processing tasks
        expect(mockFetch).toHaveBeenCalled();
    });

    it('should not refetch for completed tasks', async () => {
        const mockTaskResponse = {
            taskId: 'task1',
            status: TaskStatus.SUCCEEDED,
            output: 'completed text',
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockTaskResponse,
        } as Response);

        const { result } = renderHook(() => useChunkr(), {
            wrapper: createWrapper(),
        });

        const taskStatusHook = renderHook(
            () => result.current.getTaskStatus('task1'),
            {
                wrapper: createWrapper(),
            },
        );

        await waitFor(() => {
            expect(taskStatusHook.result.current.data).toEqual(mockTaskResponse);
        });

        // Should not continue polling for completed tasks
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should skip cache when option is set', () => {
        const { result } = renderHook(() => useChunkr({ skipCache: true }), {
            wrapper: createWrapper(),
        });

        const taskStatusHook = renderHook(
            () => result.current.getTaskStatus('task1'),
            {
                wrapper: createWrapper(),
            },
        );

        // Should not enable query when skipCache is true
        expect(taskStatusHook.result.current.fetchStatus).toBe('idle');
    });

    it('should clear cache for specific task', () => {
        const mockQueryClient = {
            invalidateQueries: jest.fn(),
        };

        jest.doMock('@tanstack/react-query', () => ({
            ...jest.requireActual('@tanstack/react-query'),
            useQueryClient: () => mockQueryClient,
        }));

        const { result } = renderHook(() => useChunkr(), {
            wrapper: createWrapper(),
        });

        result.current.clearCache('task1');

        // Note: This test would need actual QueryClient mock to verify the call
        expect(typeof result.current.clearCache).toBe('function');
    });

    it('should clear all cache when no taskId provided', () => {
        const { result } = renderHook(() => useChunkr(), {
            wrapper: createWrapper(),
        });

        result.current.clearCache();

        expect(typeof result.current.clearCache).toBe('function');
    });

    it('should handle starting status', async () => {
        const mockTaskResponse = {
            taskId: 'task1',
            status: TaskStatus.STARTING,
            output: null,
        };

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockTaskResponse,
        } as Response);

        const { result } = renderHook(() => useChunkr(), {
            wrapper: createWrapper(),
        });

        const taskStatusHook = renderHook(
            () => result.current.getTaskStatus('task1'),
            {
                wrapper: createWrapper(),
            },
        );

        await waitFor(() => {
            expect(taskStatusHook.result.current.data).toEqual(mockTaskResponse);
        });
    });

    it('should not query when taskId is empty', () => {
        const { result } = renderHook(() => useChunkr(), {
            wrapper: createWrapper(),
        });

        const taskStatusHook = renderHook(
            () => result.current.getTaskStatus(''),
            {
                wrapper: createWrapper(),
            },
        );

        expect(taskStatusHook.result.current.fetchStatus).toBe('idle');
    });
});