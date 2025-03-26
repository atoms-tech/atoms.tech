import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import {
    PipelineRunStatusResponse,
    StartPipelineParams,
    StartPipelineResponse,
} from '@/lib/services/gumloop';

interface GumloopOptions {
    skipCache?: boolean;
}

export function useGumloop(options: GumloopOptions = {}) {
    const [error, setError] = useState<Error | null>(null);
    const queryClient = useQueryClient();

    const uploadFilesMutation = useMutation({
        mutationFn: async (files: File[]): Promise<string[]> => {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('files', file);
            });

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Upload failed: ${errorData.error || response.statusText}`,
                );
            }

            const result = await response.json();
            return result.files;
        },
        onError: (error: Error) => {
            console.error('File upload error:', error);
            setError(error);
        },
    });

    const startPipelineMutation = useMutation({
        mutationFn: async (
            startPipelineParams: StartPipelineParams,
        ): Promise<StartPipelineResponse> => {
            console.log('Starting pipeline:', startPipelineParams);
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'startPipeline',
                    ...startPipelineParams,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Pipeline start failed: ${errorData.error || response.statusText}`,
                );
            }

            const result = await response.json();
            console.log('Pipeline started successfully:', result);
            return result;
        },
        onError: (error: Error) => {
            console.error('Pipeline start error:', error);
            setError(error);
        },
    });

    const getPipelineRun = useCallback(
        async (
            runId: string,
            organizationId: string,
        ): Promise<PipelineRunStatusResponse> => {
            console.log('Fetching pipeline run status for runId:', runId);
            const url = new URL('/api/ai', window.location.href);
            url.searchParams.set('runId', runId);
            url.searchParams.set('organizationId', organizationId);
            const response = await fetch(url.href, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Failed to get pipeline status: ${errorData.error || response.statusText}`,
                );
            }

            return response.json();
        },
        [],
    );

    const usePipelineRun = (runId: string, organizationId: string) => {
        return useQuery<PipelineRunStatusResponse, Error>({
            queryKey: ['pipelineRun', runId],
            queryFn: () => getPipelineRun(runId, organizationId),
            enabled: !!runId && !options.skipCache,
            refetchInterval: (query) => {
                const state = query.state.data?.state;
                if (state === 'DONE' || state === 'FAILED') {
                    return false;
                }
                return state === 'RUNNING' ? 2000 : false;
            },
        });
    };

    const { mutateAsync: uploadFiles, error: uploadError } =
        uploadFilesMutation;
    const { mutateAsync: startPipeline, error: pipelineError } =
        startPipelineMutation;

    return {
        uploadFiles,
        startPipeline,
        getPipelineRun: usePipelineRun,
        loading:
            uploadFilesMutation.isPending || startPipelineMutation.isPending,
        error: error || uploadError || pipelineError,
        clearCache: useCallback(
            (runId?: string) => {
                console.log('Clearing cache for runId:', runId);
                if (runId) {
                    queryClient.invalidateQueries({
                        queryKey: ['pipelineRun', runId],
                    });
                } else {
                    queryClient.invalidateQueries({
                        queryKey: ['pipelineRun'],
                    });
                }
            },
            [queryClient],
        ),
    };
}
