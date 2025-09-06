import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { atomsApiClient } from '@/lib/atoms-api';
import type {
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
            const api = atomsApiClient();
            return api.pipelines.uploadFiles(files);
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
            const api = atomsApiClient();
            return api.pipelines.start(startPipelineParams);
        },
        onError: (error: Error) => {
            console.error('Pipeline start error:', error);
            setError(error);
        },
    });

    const getPipelineRun = useCallback(
        async (
            runId: string,
            _organizationId: string,
        ): Promise<PipelineRunStatusResponse> => {
            console.log('Fetching pipeline run status for runId:', runId);
            const api = atomsApiClient();
            return api.pipelines.status(runId);
        },
        [],
    );

    const usePipelineRun = (runId: string, _organizationId: string) => {
        return useQuery<PipelineRunStatusResponse, Error>({
            queryKey: ['pipelineRun', runId],
            queryFn: () => getPipelineRun(runId, _organizationId),
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

    const { mutateAsync: uploadFiles, error: uploadError } = uploadFilesMutation;
    const { mutateAsync: startPipeline, error: pipelineError } = startPipelineMutation;

    return {
        uploadFiles,
        startPipeline,
        getPipelineRun: usePipelineRun,
        loading: uploadFilesMutation.isPending || startPipelineMutation.isPending,
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
