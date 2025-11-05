import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import {
    WorkflowRunStatusResponse,
    StartWorkflowParams,
    StartWorkflowResponse,
    WorkflowRunState,
} from '@/lib/services/agentapi';

interface AgentAPIOptions {
    skipCache?: boolean;
}

/**
 * Hook for AgentAPI workflow operations
 * Replaces useGumloop for Gumloop/N8N workflows
 */
export function useAgentAPI(options: AgentAPIOptions = {}) {
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
                await response.json().catch(() => ({}));
                throw new Error(
                    'Upload failed: ' + response.statusText,
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

    const startWorkflowMutation = useMutation({
        mutationFn: async (
            startWorkflowParams: StartWorkflowParams,
        ): Promise<StartWorkflowResponse> => {
            console.log('Starting workflow:', startWorkflowParams);
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: startWorkflowParams.requirement || '',
                    conversationHistory: startWorkflowParams.customInputs,
                    model: startWorkflowParams.model_preference || 'gemini-1.5-pro',
                }),
            });

            if (!response.ok) {
                await response.json().catch(() => ({}));
                throw new Error(
                    'Workflow start failed: ' + response.statusText,
                );
            }

            const result = await response.json();
            console.log('Workflow started successfully:', result);
            return {
                run_id: result.run_id || result.id || 'run_' + Date.now(),
                content: result.reply,
            };
        },
        onError: (error: Error) => {
            console.error('Workflow start error:', error);
            setError(error);
        },
    });

    const getWorkflowRun = useCallback(
        async (
            runId: string,
            _organizationId?: string,
        ): Promise<WorkflowRunStatusResponse> => {
            console.log('Fetching workflow run status for runId:', runId);
            return {
                run_id: runId,
                state: WorkflowRunState.DONE,
                output: '',
            };
        },
        [],
    );

    const useWorkflowRun = (runId: string, organizationId?: string) => {
        return useQuery<WorkflowRunStatusResponse, Error>({
            queryKey: ['workflowRun', runId],
            queryFn: () => getWorkflowRun(runId, organizationId),
            enabled: !!runId && !options.skipCache,
            refetchInterval: false,
        });
    };

    const { mutateAsync: uploadFiles, error: uploadError } = uploadFilesMutation;
    const { mutateAsync: startWorkflow, error: workflowError } = startWorkflowMutation;

    return {
        uploadFiles,
        startWorkflow,
        getWorkflowRun: useWorkflowRun,
        loading: uploadFilesMutation.isPending || startWorkflowMutation.isPending,
        error: error || uploadError || workflowError,
        clearCache: useCallback(
            (runId?: string) => {
                console.log('Clearing cache for runId:', runId);
                if (runId) {
                    queryClient.invalidateQueries({
                        queryKey: ['workflowRun', runId],
                    });
                } else {
                    queryClient.invalidateQueries({
                        queryKey: ['workflowRun'],
                    });
                }
            },
            [queryClient],
        ),
    };
}
