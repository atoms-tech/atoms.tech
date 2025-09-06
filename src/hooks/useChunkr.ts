import {
    Query,
    useMutation,
    useQueries,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { atomsApiClient } from '@/lib/atoms-api';
import { TaskResponse, TaskStatus } from '@/lib/services/chunkr';

interface ChunkrOptions {
    skipCache?: boolean;
}

export function useChunkr(options: ChunkrOptions = {}) {
    const [error, setError] = useState<Error | null>(null);
    const queryClient = useQueryClient();

    const startOcrTaskMutation = useMutation({
        mutationFn: async (files: File[]): Promise<string[]> => {
            const api = atomsApiClient();
            return api.ocr.processFiles(files);
        },
        onError: (error: Error) => {
            console.error('OCR pipeline initiation error:', error);
            setError(error);
        },
    });

    const getTaskStatus = useCallback(async (taskId: string): Promise<TaskResponse> => {
        const api = atomsApiClient();
        return api.ocr.status(taskId);
    }, []);

    const useTaskStatus = (taskId: string) => {
        return useQuery<TaskResponse, Error>({
            queryKey: ['ocrTask', taskId],
            queryFn: () => getTaskStatus(taskId),
            enabled: !!taskId && !options.skipCache,
            refetchInterval: (query) => {
                const status = query.state.data?.status;
                if (status === TaskStatus.STARTING || status === TaskStatus.PROCESSING) {
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
                    query: Query<TaskResponse, Error, TaskResponse, readonly unknown[]>,
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

    const { mutateAsync: startOcrTask, error: ocrTaskError } = startOcrTaskMutation;

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
