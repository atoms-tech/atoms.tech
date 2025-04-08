import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { TaskResponse, TaskStatus } from '@/lib/services/chunkr';
import {
    PipelineRunState,
    PipelineRunStatusResponse,
    StartPipelineResponse,
} from '@/lib/services/gumloop';

interface DemoAnalysisOptions {
    skipCache?: boolean;
}

interface StartAnalysisParams {
    requirement: string;
    systemName?: string;
    objective?: string;
    files?: File[];
    useRegulation?: boolean;
}

export function useDemoAnalysis(options: DemoAnalysisOptions = {}) {
    const [error, setError] = useState<Error | null>(null);

    const startAnalysisMutation = useMutation<
        StartPipelineResponse,
        Error,
        StartAnalysisParams
    >({
        mutationFn: async ({
            requirement,
            systemName,
            objective,
            files,
            useRegulation,
        }) => {
            const formData = new FormData();
            files?.forEach((file) => {
                formData.append('files', file);
            });

            formData.append('action', 'startAnalysis');
            formData.append('requirement', requirement);
            if (systemName) formData.append('systemName', systemName);
            if (objective) formData.append('objective', objective);
            if (useRegulation !== undefined)
                formData.append('useRegulation', useRegulation.toString());

            const response = await fetch('/demo/api', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Analysis failed: ${errorData.error || response.statusText}`,
                );
            }

            return response.json();
        },
        onError: (error: Error) => {
            console.error('Analysis error:', error);
            setError(error);
        },
    });

    const _getPipelineStatus = async (
        runId: string,
    ): Promise<PipelineRunStatusResponse> => {
        const url = new URL('/demo/api', window.location.origin);
        url.searchParams.set('runId', runId);
        const response = await fetch(url.href);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `Failed to get pipeline status: ${errorData.error || response.statusText}`,
            );
        }

        return response.json();
    };

    const usePipelineStatus = (
        runId: string | null,
        useRegulation?: boolean,
    ) => {
        return useQuery<PipelineRunStatusResponse, Error>({
            queryKey: ['demoPipeline', runId, useRegulation],
            queryFn: async () => {
                const url = new URL('/demo/api', window.location.origin);
                url.searchParams.set('runId', runId!);
                if (useRegulation) {
                    url.searchParams.set('useRegulation', 'true');
                }
                const response = await fetch(url.href);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(
                        `Failed to get pipeline status: ${errorData.error || response.statusText}`,
                    );
                }

                return response.json();
            },
            enabled: !!runId && !options.skipCache,
            refetchInterval: (query) => {
                const state = query.state.data?.state;
                if (state === PipelineRunState.RUNNING) {
                    return 2000;
                }
                return false;
            },
        });
    };

    const getTaskStatus = async (taskId: string): Promise<TaskResponse> => {
        const url = new URL('/demo/api', window.location.origin);
        url.searchParams.set('taskId', taskId);
        const response = await fetch(url.href);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                `Failed to get task status: ${errorData.error || response.statusText}`,
            );
        }

        return response.json();
    };

    const useTaskStatus = (taskId: string | null) => {
        return useQuery<TaskResponse, Error>({
            queryKey: ['demoTask', taskId],
            queryFn: () => getTaskStatus(taskId!),
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

    return {
        startAnalysis: startAnalysisMutation.mutateAsync,
        isPending: startAnalysisMutation.isPending,
        error,
        usePipelineStatus,
        useTaskStatus,
    };
}
