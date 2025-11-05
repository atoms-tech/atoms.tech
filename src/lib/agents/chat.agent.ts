/**
 * Chat Agent for atomsAgent
 * 
 * Uses AI SDK 6 ToolLoopAgent with MCP tool integration
 */

import { ToolLoopAgent, tool } from 'ai';
import { atomsChatModel, AtomsChatModelId, DEFAULT_MODEL } from '@/lib/providers/atomsagent.provider';
import { z } from 'zod';

/**
 * MCP Tools - These will be executed by atomsAgent's MCP integration
 * The actual execution happens on the backend via MCP servers
 */
export const mcpTools = {
    searchDatabase: tool({
        description: 'Search the database for requirements, documents, or other content',
        inputSchema: z.object({
            query: z.string().describe('The search query'),
            filters: z
                .object({
                    projectId: z.string().optional().describe('Filter by project ID'),
                    documentId: z.string().optional().describe('Filter by document ID'),
                    status: z.string().optional().describe('Filter by status'),
                    type: z.string().optional().describe('Filter by type'),
                })
                .optional(),
        }),
        needsApproval: false,
        execute: async ({ query, filters }) => {
            // This is a placeholder - actual execution happens via atomsAgent MCP
            return {
                results: [],
                count: 0,
                query,
                filters,
            };
        },
    }),

    updateRequirement: tool({
        description: 'Update a requirement in the system',
        inputSchema: z.object({
            requirementId: z.string().describe('The requirement ID to update'),
            updates: z.object({
                title: z.string().optional().describe('New title'),
                description: z.string().optional().describe('New description'),
                status: z.string().optional().describe('New status'),
                priority: z.string().optional().describe('New priority'),
            }),
        }),
        needsApproval: true, // Require user approval for updates
        execute: async ({ requirementId, updates }) => {
            // Placeholder - actual execution via atomsAgent MCP
            return {
                success: true,
                requirementId,
                updates,
            };
        },
    }),

    createRequirement: tool({
        description: 'Create a new requirement',
        inputSchema: z.object({
            projectId: z.string().describe('Project ID'),
            title: z.string().describe('Requirement title'),
            description: z.string().describe('Requirement description'),
            priority: z.string().optional().describe('Priority level'),
            status: z.string().optional().describe('Initial status'),
        }),
        needsApproval: true,
        execute: async (params) => {
            // Placeholder - actual execution via atomsAgent MCP
            return {
                success: true,
                requirementId: 'new-req-id',
                ...params,
            };
        },
    }),

    analyzeDocument: tool({
        description: 'Analyze a document and extract insights',
        inputSchema: z.object({
            documentId: z.string().describe('Document ID to analyze'),
            analysisType: z
                .enum(['summary', 'requirements', 'risks', 'dependencies'])
                .describe('Type of analysis to perform'),
        }),
        needsApproval: false,
        execute: async ({ documentId, analysisType }) => {
            // Placeholder - actual execution via atomsAgent MCP
            return {
                documentId,
                analysisType,
                results: {},
            };
        },
    }),
};

/**
 * Create a chat agent with specified model
 */
export const createChatAgent = (
    modelId: AtomsChatModelId = DEFAULT_MODEL,
    systemPrompt?: string,
) => {
    return new ToolLoopAgent({
        model: atomsChatModel(modelId),
        instructions:
            systemPrompt ||
            `You are a helpful AI assistant for the Atoms platform. 
You help users manage requirements, documents, and projects.
You have access to tools for searching, creating, and updating content.
Always be clear and concise in your responses.
When using tools that require approval, explain what you're about to do.`,
        tools: mcpTools,
        // Optional: Add structured output if needed
        // output: Output.object({ schema: z.object({ ... }) }),
    });
};

/**
 * Default agent instance
 */
export const defaultChatAgent = createChatAgent();

