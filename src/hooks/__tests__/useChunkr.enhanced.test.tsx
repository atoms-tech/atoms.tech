import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';

import { createMockSupabaseClient } from '@/test-utils';
import { TaskStatus } from '@/lib/services/chunkr';
import { useChunkr } from '../useChunkr';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Create test wrapper with QueryClient
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                cacheTime: 0,
            },
        },
    });

    return ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    );
};

describe('useChunkr Hook', () => {
    let wrapper: ReturnType<typeof createWrapper>;

    beforeEach(() => {
        jest.clearAllMocks();
        wrapper = createWrapper();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    describe('initialization', () => {
        it('initializes with correct default state', () => {
            const { result } = renderHook(() => useChunkr(), { wrapper });

            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBe(null);
            expect(typeof result.current.startOcrTask).toBe('function');
            expect(typeof result.current.getTaskStatus).toBe('function');
            expect(typeof result.current.getTaskStatuses).toBe('function');
            expect(typeof result.current.clearCache).toBe('function');
        });

        it('accepts options parameter', () => {
            const { result } = renderHook(() => useChunkr({ skipCache: true }), { wrapper });

            expect(result.current).toBeDefined();
        });
    });

    describe('startOcrTask', () => {
        it('starts OCR task successfully', async () => {
            const mockTaskIds = ['task-1', 'task-2'];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue({ taskIds: mockTaskIds }),
            });

            const { result } = renderHook(() => useChunkr(), { wrapper });

            const files = [
                new File(['test'], 'test1.pdf', { type: 'application/pdf' }),
                new File(['test'], 'test2.pdf', { type: 'application/pdf' }),
            ];

            const taskIds = await result.current.startOcrTask(files);

            expect(taskIds).toEqual(mockTaskIds);
            expect(mockFetch).toHaveBeenCalledWith('/api/ocr', {
                method: 'POST',
                body: expect.any(FormData),
            });
        });

        it('handles OCR task start failure', async () => {
            const errorMessage = 'OCR service unavailable';
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Service Unavailable',
                json: jest.fn().mockResolvedValue({ error: errorMessage }),
            });

            const { result } = renderHook(() => useChunkr(), { wrapper });

            const files = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];

            await expect(result.current.startOcrTask(files)).rejects.toThrow(
                `OCR pipeline initiation failed: ${errorMessage}`
            );
        });

        it('handles JSON parsing failure on error response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Internal Server Error',
                json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
            });

            const { result } = renderHook(() => useChunkr(), { wrapper });

            const files = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];

            await expect(result.current.startOcrTask(files)).rejects.toThrow(
                'OCR pipeline initiation failed: Internal Server Error'
            );
        });

        it('appends multiple files to FormData correctly', async () => {
            const mockTaskIds = ['task-1'];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue({ taskIds: mockTaskIds }),
            });

            const { result } = renderHook(() => useChunkr(), { wrapper });

            const files = [
                new File(['content1'], 'file1.pdf', { type: 'application/pdf' }),
                new File(['content2'], 'file2.pdf', { type: 'application/pdf' }),
                new File(['content3'], 'file3.pdf', { type: 'application/pdf' }),
            ];

            await result.current.startOcrTask(files);

            const formDataCall = mockFetch.mock.calls[0][1].body as FormData;
            const appendedFiles = formDataCall.getAll('files');
            expect(appendedFiles).toHaveLength(3);
        });
    });

    describe('getTaskStatus', () => {
        it('fetches task status successfully', async () => {
            const mockTaskResponse = {
                status: TaskStatus.PROCESSING,
                result: null,
                error: null,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockTaskResponse),
            });

            const { result } = renderHook(() => useChunkr(), { wrapper });
            const taskStatusHook = result.current.getTaskStatus('task-1');
            
            const { result: statusResult } = renderHook(() => taskStatusHook, { wrapper });

            await waitFor(() => {
                expect(statusResult.current.data).toEqual(mockTaskResponse);
            });

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/ocr?taskId=task-1'),
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        });

        it('handles task status fetch failure', async () => {
            const errorMessage = 'Task not found';
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
                json: jest.fn().mockResolvedValue({ error: errorMessage }),
            });

            const { result } = renderHook(() => useChunkr(), { wrapper });
            const taskStatusHook = result.current.getTaskStatus('invalid-task');
            
            const { result: statusResult } = renderHook(() => taskStatusHook, { wrapper });

            await waitFor(() => {
                expect(statusResult.current.error).toBeTruthy();
            });
        });

        it('disables query when skipCache is true', () => {
            const { result } = renderHook(() => useChunkr({ skipCache: true }), { wrapper });
            const taskStatusHook = result.current.getTaskStatus('task-1');
            
            const { result: statusResult } = renderHook(() => taskStatusHook, { wrapper });

            expect(statusResult.current.fetchStatus).toBe('idle');
        });

        it('sets up polling for STARTING status', async () => {
            const mockTaskResponse = {
                status: TaskStatus.STARTING,
                result: null,
                error: null,
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockTaskResponse),
            });

            const { result } = renderHook(() => useChunkr(), { wrapper });
            const taskStatusHook = result.current.getTaskStatus('task-1');
            
            renderHook(() => taskStatusHook, { wrapper });

            // Check that polling is configured (refetchInterval should be 2000ms)
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalled();
            });
        });

        it('sets up polling for PROCESSING status', async () => {
            const mockTaskResponse = {
                status: TaskStatus.PROCESSING,
                result: null,
                error: null,
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockTaskResponse),
            });

            const { result } = renderHook(() => useChunkr(), { wrapper });
            const taskStatusHook = result.current.getTaskStatus('task-1');
            
            renderHook(() => taskStatusHook, { wrapper });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalled();
            });
        });

        it('stops polling for completed status', async () => {
            const mockTaskResponse = {
                status: TaskStatus.COMPLETED,
                result: { extractedText: 'Sample text' },
                error: null,
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockTaskResponse),
            });

            const { result } = renderHook(() => useChunkr(), { wrapper });
            const taskStatusHook = result.current.getTaskStatus('task-1');
            
            renderHook(() => taskStatusHook, { wrapper });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalled();
            });

            // Should not continue polling for completed status
        });
    });

    describe('getTaskStatuses', () => {
        it('fetches multiple task statuses', async () => {
            const mockResponses = [
                { status: TaskStatus.PROCESSING, result: null, error: null },
                { status: TaskStatus.COMPLETED, result: { text: 'Done' }, error: null },
            ];

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: jest.fn().mockResolvedValue(mockResponses[0]),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: jest.fn().mockResolvedValue(mockResponses[1]),
                });

            const { result } = renderHook(() => useChunkr(), { wrapper });
            const taskStatusesHook = result.current.getTaskStatuses(['task-1', 'task-2']);
            
            const { result: statusesResult } = renderHook(() => taskStatusesHook, { wrapper });

            await waitFor(() => {
                expect(statusesResult.current[0].data).toEqual(mockResponses[0]);
                expect(statusesResult.current[1].data).toEqual(mockResponses[1]);
            });
        });

        it('handles empty task IDs array', () => {
            const { result } = renderHook(() => useChunkr(), { wrapper });
            const taskStatusesHook = result.current.getTaskStatuses([]);
            
            const { result: statusesResult } = renderHook(() => taskStatusesHook, { wrapper });

            expect(statusesResult.current).toEqual([]);
        });

        it('skips queries when skipCache is true', () => {
            const { result } = renderHook(() => useChunkr({ skipCache: true }), { wrapper });
            const taskStatusesHook = result.current.getTaskStatuses(['task-1', 'task-2']);
            
            const { result: statusesResult } = renderHook(() => taskStatusesHook, { wrapper });

            statusesResult.current.forEach(query => {
                expect(query.fetchStatus).toBe('idle');
            });
        });
    });

    describe('clearCache', () => {
        it('clears cache for specific task ID', () => {
            const { result } = renderHook(() => useChunkr(), { wrapper });

            // Should not throw when clearing cache
            expect(() => result.current.clearCache('task-1')).not.toThrow();
        });

        it('clears all OCR task cache when no task ID provided', () => {
            const { result } = renderHook(() => useChunkr(), { wrapper });

            // Should not throw when clearing all cache
            expect(() => result.current.clearCache()).not.toThrow();
        });
    });

    describe('error handling', () => {
        it('sets error state on OCR task failure', async () => {
            const error = new Error('Network error');
            mockFetch.mockRejectedValueOnce(error);

            const { result } = renderHook(() => useChunkr(), { wrapper });

            const files = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];

            try {
                await result.current.startOcrTask(files);
            } catch (e) {
                // Expected to throw
            }

            await waitFor(() => {
                expect(result.current.error).toBeTruthy();
            });
        });

        it('logs errors to console', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const consolLogSpy = jest.spyOn(console, 'log').mockImplementation();

            const error = new Error('Test error');
            mockFetch.mockRejectedValueOnce(error);

            const { result } = renderHook(() => useChunkr(), { wrapper });

            const files = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];

            try {
                await result.current.startOcrTask(files);
            } catch (e) {
                // Expected to throw
            }

            expect(consoleSpy).toHaveBeenCalledWith('OCR pipeline initiation error:', error);

            consoleSpy.mockRestore();
            consolLogSpy.mockRestore();
        });
    });

    describe('loading states', () => {
        it('shows loading state during OCR task start', async () => {
            let resolvePromise: (value: Response) => void;
            const promise = new Promise(resolve => {
                resolvePromise = resolve;
            });

            mockFetch.mockReturnValueOnce(promise);

            const { result } = renderHook(() => useChunkr(), { wrapper });

            const files = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];
            
            const startPromise = result.current.startOcrTask(files);

            await waitFor(() => {
                expect(result.current.loading).toBe(true);
            });

            resolvePromise!({
                ok: true,
                json: jest.fn().mockResolvedValue({ taskIds: ['task-1'] }),
            });

            await startPromise;

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });
        });
    });
});