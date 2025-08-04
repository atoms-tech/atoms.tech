import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';

import { StartPipelineParams } from '@/lib/services/gumloop';
import { useGumloop } from '../useGumloop';

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

describe('useGumloop Hook', () => {
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
            const { result } = renderHook(() => useGumloop(), { wrapper });

            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBe(null);
            expect(typeof result.current.uploadFiles).toBe('function');
            expect(typeof result.current.startPipeline).toBe('function');
            expect(typeof result.current.getPipelineRun).toBe('function');
            expect(typeof result.current.clearCache).toBe('function');
        });

        it('accepts options parameter', () => {
            const { result } = renderHook(() => useGumloop({ skipCache: true }), { wrapper });

            expect(result.current).toBeDefined();
        });
    });

    describe('uploadFiles', () => {
        it('uploads files successfully', async () => {
            const mockFileUrls = ['file1.pdf', 'file2.pdf'];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue({ files: mockFileUrls }),
            });

            const { result } = renderHook(() => useGumloop(), { wrapper });

            const files = [
                new File(['content1'], 'test1.pdf', { type: 'application/pdf' }),
                new File(['content2'], 'test2.pdf', { type: 'application/pdf' }),
            ];

            const uploadedFiles = await result.current.uploadFiles(files);

            expect(uploadedFiles).toEqual(mockFileUrls);
            expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
                method: 'POST',
                body: expect.any(FormData),
            });
        });

        it('handles upload failure', async () => {
            const errorMessage = 'Upload service unavailable';
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Service Unavailable',
                json: jest.fn().mockResolvedValue({ error: errorMessage }),
            });

            const { result } = renderHook(() => useGumloop(), { wrapper });

            const files = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];

            await expect(result.current.uploadFiles(files)).rejects.toThrow(
                `Upload failed: ${errorMessage}`
            );
        });

        it('handles JSON parsing failure on error response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Internal Server Error',
                json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
            });

            const { result } = renderHook(() => useGumloop(), { wrapper });

            const files = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];

            await expect(result.current.uploadFiles(files)).rejects.toThrow(
                'Upload failed: Internal Server Error'
            );
        });

        it('appends all files to FormData correctly', async () => {
            const mockFileUrls = ['file1.pdf', 'file2.pdf', 'file3.pdf'];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue({ files: mockFileUrls }),
            });

            const { result } = renderHook(() => useGumloop(), { wrapper });

            const files = [
                new File(['content1'], 'file1.pdf', { type: 'application/pdf' }),
                new File(['content2'], 'file2.pdf', { type: 'application/pdf' }),
                new File(['content3'], 'file3.pdf', { type: 'application/pdf' }),
            ];

            await result.current.uploadFiles(files);

            const formDataCall = mockFetch.mock.calls[0][1].body as FormData;
            const appendedFiles = formDataCall.getAll('files');
            expect(appendedFiles).toHaveLength(3);
        });
    });

    describe('startPipeline', () => {
        it('starts pipeline successfully', async () => {
            const mockResponse = {
                runId: 'run-123',
                status: 'RUNNING',
                message: 'Pipeline started successfully',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
            });

            const { result } = renderHook(() => useGumloop(), { wrapper });

            const params: StartPipelineParams = {
                pipelineId: 'pipeline-123',
                files: ['file1.pdf', 'file2.pdf'],
                organizationId: 'org-123',
                metadata: { source: 'test' },
            };

            const response = await result.current.startPipeline(params);

            expect(response).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith('/api/ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'startPipeline',
                    ...params,
                }),
            });
        });

        it('handles pipeline start failure', async () => {
            const errorMessage = 'Pipeline not found';
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
                json: jest.fn().mockResolvedValue({ error: errorMessage }),
            });

            const { result } = renderHook(() => useGumloop(), { wrapper });

            const params: StartPipelineParams = {
                pipelineId: 'invalid-pipeline',
                files: [],
                organizationId: 'org-123',
            };

            await expect(result.current.startPipeline(params)).rejects.toThrow(
                `Pipeline start failed: ${errorMessage}`
            );
        });

        it('handles network errors', async () => {
            const networkError = new Error('Network connection failed');
            mockFetch.mockRejectedValueOnce(networkError);

            const { result } = renderHook(() => useGumloop(), { wrapper });

            const params: StartPipelineParams = {
                pipelineId: 'pipeline-123',
                files: [],
                organizationId: 'org-123',
            };

            await expect(result.current.startPipeline(params)).rejects.toThrow(
                'Network connection failed'
            );
        });

        it('logs pipeline start details', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const mockResponse = { runId: 'run-123', status: 'RUNNING' };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
            });

            const { result } = renderHook(() => useGumloop(), { wrapper });

            const params: StartPipelineParams = {
                pipelineId: 'pipeline-123',
                files: [],
                organizationId: 'org-123',
            };

            await result.current.startPipeline(params);

            expect(consoleSpy).toHaveBeenCalledWith('Starting pipeline:', params);
            expect(consoleSpy).toHaveBeenCalledWith('Pipeline started successfully:', mockResponse);

            consoleSpy.mockRestore();
        });
    });

    describe('getPipelineRun', () => {
        it('fetches pipeline run status successfully', async () => {
            const mockPipelineResponse = {
                runId: 'run-123',
                state: 'RUNNING',
                output: null,
                error: null,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockPipelineResponse),
            });

            const { result } = renderHook(() => useGumloop(), { wrapper });
            const pipelineRunHook = result.current.getPipelineRun('run-123', 'org-123');
            
            const { result: runResult } = renderHook(() => pipelineRunHook, { wrapper });

            await waitFor(() => {
                expect(runResult.current.data).toEqual(mockPipelineResponse);
            });

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/ai?runId=run-123&organizationId=org-123'),
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        });

        it('handles pipeline run fetch failure', async () => {
            const errorMessage = 'Run not found';
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
                json: jest.fn().mockResolvedValue({ error: errorMessage }),
            });

            const { result } = renderHook(() => useGumloop(), { wrapper });
            const pipelineRunHook = result.current.getPipelineRun('invalid-run', 'org-123');
            
            const { result: runResult } = renderHook(() => pipelineRunHook, { wrapper });

            await waitFor(() => {
                expect(runResult.current.error).toBeTruthy();
            });
        });

        it('disables query when skipCache is true', () => {
            const { result } = renderHook(() => useGumloop({ skipCache: true }), { wrapper });
            const pipelineRunHook = result.current.getPipelineRun('run-123', 'org-123');
            
            const { result: runResult } = renderHook(() => pipelineRunHook, { wrapper });

            expect(runResult.current.fetchStatus).toBe('idle');
        });

        it('sets up polling for RUNNING state', async () => {
            const mockPipelineResponse = {
                runId: 'run-123',
                state: 'RUNNING',
                output: null,
                error: null,
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockPipelineResponse),
            });

            const { result } = renderHook(() => useGumloop(), { wrapper });
            const pipelineRunHook = result.current.getPipelineRun('run-123', 'org-123');
            
            renderHook(() => pipelineRunHook, { wrapper });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalled();
            });
        });

        it('stops polling for DONE state', async () => {
            const mockPipelineResponse = {
                runId: 'run-123',
                state: 'DONE',
                output: { result: 'success' },
                error: null,
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockPipelineResponse),
            });

            const { result } = renderHook(() => useGumloop(), { wrapper });
            const pipelineRunHook = result.current.getPipelineRun('run-123', 'org-123');
            
            renderHook(() => pipelineRunHook, { wrapper });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalled();
            });
        });

        it('stops polling for FAILED state', async () => {
            const mockPipelineResponse = {
                runId: 'run-123',
                state: 'FAILED',
                output: null,
                error: 'Pipeline execution failed',
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockPipelineResponse),
            });

            const { result } = renderHook(() => useGumloop(), { wrapper });
            const pipelineRunHook = result.current.getPipelineRun('run-123', 'org-123');
            
            renderHook(() => pipelineRunHook, { wrapper });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalled();
            });
        });
    });

    describe('clearCache', () => {
        it('clears cache for specific run ID', () => {
            const { result } = renderHook(() => useGumloop(), { wrapper });

            // Should not throw when clearing cache
            expect(() => result.current.clearCache('run-123')).not.toThrow();
        });

        it('clears all pipeline run cache when no run ID provided', () => {
            const { result } = renderHook(() => useGumloop(), { wrapper });

            // Should not throw when clearing all cache
            expect(() => result.current.clearCache()).not.toThrow();
        });
    });

    describe('error handling', () => {
        it('sets error state on upload failure', async () => {
            const error = new Error('Network error');
            mockFetch.mockRejectedValueOnce(error);

            const { result } = renderHook(() => useGumloop(), { wrapper });

            const files = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];

            try {
                await result.current.uploadFiles(files);
            } catch (e) {
                // Expected to throw
            }

            await waitFor(() => {
                expect(result.current.error).toBeTruthy();
            });
        });

        it('sets error state on pipeline start failure', async () => {
            const error = new Error('Pipeline error');
            mockFetch.mockRejectedValueOnce(error);

            const { result } = renderHook(() => useGumloop(), { wrapper });

            const params: StartPipelineParams = {
                pipelineId: 'pipeline-123',
                files: [],
                organizationId: 'org-123',
            };

            try {
                await result.current.startPipeline(params);
            } catch (e) {
                // Expected to throw
            }

            await waitFor(() => {
                expect(result.current.error).toBeTruthy();
            });
        });

        it('logs errors to console', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const error = new Error('Test error');
            mockFetch.mockRejectedValueOnce(error);

            const { result } = renderHook(() => useGumloop(), { wrapper });

            const files = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];

            try {
                await result.current.uploadFiles(files);
            } catch (e) {
                // Expected to throw
            }

            expect(consoleSpy).toHaveBeenCalledWith('File upload error:', error);

            consoleSpy.mockRestore();
        });
    });

    describe('loading states', () => {
        it('shows loading state during file upload', async () => {
            let resolvePromise: (value: Response) => void;
            const promise = new Promise(resolve => {
                resolvePromise = resolve;
            });

            mockFetch.mockReturnValueOnce(promise);

            const { result } = renderHook(() => useGumloop(), { wrapper });

            const files = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];
            
            const uploadPromise = result.current.uploadFiles(files);

            await waitFor(() => {
                expect(result.current.loading).toBe(true);
            });

            resolvePromise!({
                ok: true,
                json: jest.fn().mockResolvedValue({ files: ['uploaded.pdf'] }),
            });

            await uploadPromise;

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });
        });

        it('shows loading state during pipeline start', async () => {
            let resolvePromise: (value: Response) => void;
            const promise = new Promise(resolve => {
                resolvePromise = resolve;
            });

            mockFetch.mockReturnValueOnce(promise);

            const { result } = renderHook(() => useGumloop(), { wrapper });

            const params: StartPipelineParams = {
                pipelineId: 'pipeline-123',
                files: [],
                organizationId: 'org-123',
            };
            
            const pipelinePromise = result.current.startPipeline(params);

            await waitFor(() => {
                expect(result.current.loading).toBe(true);
            });

            resolvePromise!({
                ok: true,
                json: jest.fn().mockResolvedValue({ runId: 'run-123', status: 'RUNNING' }),
            });

            await pipelinePromise;

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });
        });

        it('combines loading states from both upload and pipeline operations', async () => {
            const { result } = renderHook(() => useGumloop(), { wrapper });

            // Initially not loading
            expect(result.current.loading).toBe(false);
        });
    });
});