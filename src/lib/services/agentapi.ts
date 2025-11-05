/**
 * AgentAPI Service Layer
 *
 * Replaces Gumloop/N8N workflow automation with AgentAPI endpoints.
 * Provides a unified interface for:
 * - Chat completions (analysis, reasoning, transformations)
 * - File processing and context management
 * - Model listing and selection
 *
 * @module agentapi-service
 */

import { AgentAPIClient } from '@/lib/api/agentapi';
import type { Message } from '@/lib/api/agentapi';

// ============================================================================
// Configuration
// ============================================================================

const AGENTAPI_URL = process.env.NEXT_PUBLIC_AGENTAPI_URL || 'http://localhost:3284';

// Validate that AgentAPI URL is configured
if (!AGENTAPI_URL) {
    console.warn(
        'NEXT_PUBLIC_AGENTAPI_URL is not configured. AgentAPI service will not work properly.',
        'Expected environment variable: NEXT_PUBLIC_AGENTAPI_URL',
    );
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Workflow types that map to AgentAPI chat completions with different system prompts
 */
type WorkflowType =
    | 'file-processing'
    | 'requirement-analysis'
    | 'requirement-analysis-reasoning'
    | 'text-to-mermaid';

/**
 * Input parameter for workflow execution
 */
interface WorkflowInput {
    input_name: string;
    value: string;
}

/**
 * Parameters for starting a workflow
 */
export type StartWorkflowParams = {
    workflowType?: WorkflowType;
    requirement?: string;
    fileNames?: string[];
    systemName?: string;
    objective?: string;
    model_preference?: string;
    temperature?: number;
    customInputs?: WorkflowInput[];
    systemPrompt?: string;
    context?: Record<string, unknown>;
};

/**
 * Response from starting a workflow
 */
export interface StartWorkflowResponse {
    run_id: string;
    useRegulation?: boolean;
    content?: string;
}

/**
 * Workflow execution states
 */
export enum WorkflowRunState {
    RUNNING = 'RUNNING',
    DONE = 'DONE',
    FAILED = 'FAILED',
    COMPLETED = 'COMPLETED',
}

/**
 * Workflow execution status response
 */
export interface WorkflowRunStatusResponse {
    run_id: string;
    state: WorkflowRunState;
    output?: string;
    outputs?: Record<string, string[] | string>;
    error?: string;
}

// ============================================================================
// System Prompts for Different Workflows
// ============================================================================

const WORKFLOW_SYSTEM_PROMPTS: Record<WorkflowType, string> = {
    'file-processing': `You are a document processing AI. Your task is to analyze and extract relevant information from documents.
    - Be thorough and accurate
    - Structure information clearly
    - Highlight key findings
    - Preserve document structure where relevant`,

    'requirement-analysis': `You are a requirements analysis expert. Your task is to analyze requirements and break them down into actionable components.
    - Identify stakeholders and their needs
    - Break down complex requirements
    - Suggest acceptance criteria
    - Highlight potential risks and dependencies
    - Provide implementation recommendations`,

    'requirement-analysis-reasoning': `You are a detailed requirement analyst providing deep reasoning and analysis.
    - Provide step-by-step analysis
    - Explain your reasoning
    - Consider edge cases and exceptions
    - Suggest alternatives and tradeoffs
    - Provide implementation strategy`,

    'text-to-mermaid': `You are a diagram generation specialist. Convert textual descriptions into valid Mermaid diagram syntax.
    - Analyze the provided text
    - Identify relationships and hierarchies
    - Generate valid Mermaid syntax (flowchart, sequence, class, ER diagrams)
    - Ensure the diagram is clear and follows best practices
    - Return only valid Mermaid code wrapped in \`\`\`mermaid blocks`,
};

// ============================================================================
// AgentAPI Service Class
// ============================================================================

export class AgentAPIService {
    private static instance: AgentAPIService;
    private client: AgentAPIClient;
    private tokenGetter?: () => Promise<string | null>;
    private useStaticKey: boolean;

    private constructor() {
        // Check if static API key is configured
        this.useStaticKey = !!process.env.NEXT_PUBLIC_STATIC_API_KEY;

        this.client = new AgentAPIClient({
            baseURL: AGENTAPI_URL,
            useStaticApiKey: this.useStaticKey,
            getToken: async () => {
                // Skip getToken if using static API key
                if (this.useStaticKey) {
                    return null;
                }
                if (this.tokenGetter) {
                    return this.tokenGetter();
                }
                return null;
            },
        });
    }

    /**
     * Set a token getter function for JWT authentication
     * Call this from API routes to provide the user's JWT token
     */
    public setTokenGetter(getter: () => Promise<string | null>): void {
        this.tokenGetter = getter;
        // Recreate client with the new token getter
        this.client = new AgentAPIClient({
            baseURL: AGENTAPI_URL,
            getToken: getter,
        });
    }

    /**
     * Get singleton instance of AgentAPIService
     */
    public static getInstance(): AgentAPIService {
        if (!AgentAPIService.instance) {
            AgentAPIService.instance = new AgentAPIService();
        }
        return AgentAPIService.instance;
    }

    /**
     * Upload files for processing
     * In AgentAPI, files are handled as context in chat completions
     * This method validates and prepares files for the workflow
     */
    async uploadFiles(files: File[]): Promise<string[]> {
        console.log(
            'Starting file upload process:',
            files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
        );

        if (files.length === 0) {
            throw new Error('Please upload at least one file');
        }

        // Validate all files are PDFs or Markdown
        for (const file of files) {
            if (
                !file.type.includes('pdf') &&
                !file.type.includes('markdown') &&
                !file.name.endsWith('.md')
            ) {
                console.error(
                    'Invalid file type detected:',
                    file.type,
                    'for file:',
                    file.name,
                );
                throw new Error(
                    `Only PDF and Markdown files are accepted. Invalid file: ${file.name}`,
                );
            }
        }

        try {
            // In AgentAPI, we validate files but don't need separate upload
            // Files are sent as context in chat completions
            console.log('File validation successful for', files.length, 'files');
            const fileNames = files.map((f) => f.name);
            console.log('Files ready for processing:', fileNames);
            return fileNames;
        } catch (error) {
            console.error('File upload process failed:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to upload files: ${errorMessage}`);
        }
    }

    /**
     * Start a workflow execution
     * Maps workflow types to AgentAPI chat completions with appropriate system prompts
     */
    async startWorkflow({
        workflowType,
        requirement,
        fileNames,
        systemName,
        objective,
        model_preference = 'gemini-1.5-pro',
        temperature = 0.7,
        customInputs,
        systemPrompt,
        context,
    }: StartWorkflowParams): Promise<StartWorkflowResponse> {
        console.log('Starting workflow with params:', {
            fileNames,
            systemName,
            objective,
            requirement,
            workflowType,
        });

        try {
            // Build system prompt
            const finalSystemPrompt =
                systemPrompt || (workflowType ? WORKFLOW_SYSTEM_PROMPTS[workflowType] : '');

            // Build user message from inputs
            const messageContent = this.buildMessageContent({
                requirement,
                fileNames,
                systemName,
                objective,
                customInputs,
                context,
            });

            // Create messages array
            const messages: Message[] = [
                {
                    role: 'system',
                    content: finalSystemPrompt,
                },
                {
                    role: 'user',
                    content: messageContent,
                },
            ];

            console.log('Making AgentAPI request with workflow:', {
                model: model_preference,
                temperature,
                messagesCount: messages.length,
            });

            // Call AgentAPI
            const response = await this.client.chat.create({
                model: model_preference,
                messages,
                temperature,
                max_tokens: 4096,
            });

            if (!response || !response.choices || response.choices.length === 0) {
                throw new Error('No response from AgentAPI');
            }

            const content = response.choices[0]?.message?.content || '';
            const runId = response.id || `run_${Date.now()}`;

            console.log('Workflow completed successfully:', { runId });

            return {
                run_id: runId,
                content,
                useRegulation: true,
            };
        } catch (error) {
            console.error('Workflow execution failed:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to start workflow: ${errorMessage}`);
        }
    }

    /**
     * Get workflow execution status
     * In AgentAPI, responses are immediate, so this checks if the run exists
     */
    async getWorkflowRun({
        runId,
    }: {
        runId: string;
    }): Promise<WorkflowRunStatusResponse> {
        console.log('Getting workflow run status:', {
            runId,
        });

        try {
            // Since AgentAPI provides immediate responses, we return a completed status
            // In a future integration with persistence, this could check a database
            return {
                run_id: runId,
                state: WorkflowRunState.DONE,
                output: '',
            };
        } catch (error) {
            console.error('Get workflow run process failed:', error);
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to get workflow run status: ${errorMessage}`);
        }
    }

    /**
     * List available models
     */
    async listModels(): Promise<Array<{ id: string; name: string }>> {
        try {
            const modelsResponse = await this.client.models.list();
            return modelsResponse.data.map(model => ({
                id: model.id,
                name: model.id, // Use id as name if name not available
            }));
        } catch (error) {
            console.error('Failed to list models:', error);
            // Return default models on error
            return [
                { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
                { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
            ];
        }
    }

    /**
     * Get model details
     */
    async getModel(modelId: string): Promise<{ id: string; name: string }> {
        try {
            const modelInfo = await this.client.models.retrieve(modelId);
            return { id: modelInfo.id, name: modelInfo.id };
        } catch (error) {
            console.error(`Failed to get model ${modelId}:`, error);
            return { id: modelId, name: modelId };
        }
    }

    /**
     * Health check
     */
    async health(): Promise<boolean> {
        try {
            const response = await fetch(`${AGENTAPI_URL}/health`);
            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }

    /**
     * Build user message content from workflow inputs
     */
    private buildMessageContent(inputs: {
        requirement?: string;
        fileNames?: string[];
        systemName?: string;
        objective?: string;
        customInputs?: WorkflowInput[];
        context?: Record<string, unknown>;
    }): string {
        const parts: string[] = [];

        if (inputs.systemName) {
            parts.push(`System Name: ${inputs.systemName}`);
        }

        if (inputs.objective) {
            parts.push(`Objective: ${inputs.objective}`);
        }

        if (inputs.fileNames && inputs.fileNames.length > 0) {
            parts.push(`Documents to analyze: ${inputs.fileNames.join(', ')}`);
        }

        if (inputs.requirement) {
            parts.push(`Requirement:\n${inputs.requirement}`);
        }

        if (inputs.customInputs && inputs.customInputs.length > 0) {
            for (const input of inputs.customInputs) {
                parts.push(`${input.input_name}: ${input.value}`);
            }
        }

        if (inputs.context) {
            parts.push(`Context: ${JSON.stringify(inputs.context, null, 2)}`);
        }

        return parts.join('\n\n');
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Export a singleton instance of AgentAPIService
 */
export const agentapiService = AgentAPIService.getInstance();
