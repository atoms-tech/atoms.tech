import {
    Query,
    useMutation,
    useQueries,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { TaskResponse, TaskStatus } from '@/lib/services/chunkr';

interface ChunkrOptions {
    skipCache?: boolean;
}

export function useChunkr(options: ChunkrOptions = {}) {
    const [error, setError] = useState<Error | null>(null);
    const queryClient = useQueryClient();

    const startOcrTaskMutation = useMutation({
        mutationFn: async (files: File[]): Promise<string[]> => {
            console.log(
                'Starting OCR pipeline for files:',
                files.map((f) => ({ name: f.name, size: f.size })),
            );
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('files', file);
            });

            const response = await fetch('/api/ocr', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `OCR pipeline initiation failed: ${errorData.error || response.statusText}`,
                );
            }

            const result = await response.json();
            console.log('OCR pipeline started successfully:', result.taskIds);
            return result.taskIds;
        },
        onError: (error: Error) => {
            console.error('OCR pipeline initiation error:', error);
            setError(error);
        },
    });

    const getTaskStatus = useCallback(
        async (taskId: string): Promise<TaskResponse> => {
            console.log('Fetching OCR task status for taskId:', taskId);
            const url = new URL('/api/ocr', window.location.href);
            url.searchParams.set('taskId', taskId);
            const response = await fetch(url.href, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Failed to get OCR task status: ${errorData.error || response.statusText}`,
                );
            }

            return response.json();
        },
        [],
    );

    const useTaskStatus = (taskId: string) => {
        return useQuery<TaskResponse, Error>({
            queryKey: ['ocrTask', taskId],
            queryFn: () => getTaskStatus(taskId),
            enabled: !!taskId && !options.skipCache,
            refetchInterval: (query) => {
                const status = query.state.data?.status;
                if (
                    status === TaskStatus.STARTING ||
                    status === TaskStatus.PROCESSING
                ) {
                    return 2000;
                }
                return false;
            },
        });
    };

    const useTaskStatuses = (taskIds: string[]) => {
        return useQueries({
            queries: taskIds.map((taskId) => ({
                queryKey: ['ocrTask', taskId],
                queryFn: () => getTaskStatus(taskId),
                enabled: !!taskId && !options.skipCache,
                refetchInterval: (
                    query: Query<
                        TaskResponse,
                        Error,
                        TaskResponse,
                        readonly unknown[]
                    >,
                ) => {
                    const status = query.state.data?.status;
                    if (
                        status === TaskStatus.STARTING ||
                        status === TaskStatus.PROCESSING
                    ) {
                        return 2000;
                    }
                    return false;
                },
            })),
        });
    };

    const { mutateAsync: startOcrTask, error: ocrTaskError } =
        startOcrTaskMutation;

    return {
        startOcrTask,
        getTaskStatus: useTaskStatus,
        getTaskStatuses: useTaskStatuses,
        loading: startOcrTaskMutation.isPending,
        error: error || ocrTaskError,
        clearCache: useCallback(
            (taskId?: string) => {
                console.log('Clearing cache for taskId:', taskId);
                if (taskId) {
                    queryClient.invalidateQueries({
                        queryKey: ['ocrTask', taskId],
                    });
                } else {
                    queryClient.invalidateQueries({
                        queryKey: ['ocrTask'],
                    });
                }
            },
            [queryClient],
        ),
    };
}
