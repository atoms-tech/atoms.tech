/**
 * AgentAPI Service
 *
 * Service for atomsAgent custom endpoints (chat history, etc.)
 * Chat completions are handled by AI SDK 6
 */

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    name?: string;
    metadata?: Record<string, unknown>;
    tokens?: number;
}

export interface ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stream?: boolean;
    user?: string;
    system_prompt?: string;
    metadata?: {
        session_id?: string;
        workflow?: string;
        organization_id?: string;
        user_id?: string;
        variables?: Record<string, unknown>;
        allowed_tools?: string[];
        setting_sources?: string[];
        mcp_servers?: Record<string, unknown>;
        agent_type?: string;
    };
}

export interface ChatCompletionResponse {
    id: string;
    object: 'chat.completion';
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: ChatMessage;
        finish_reason: string | null;
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    system_fingerprint?: string;
}

export interface ModelInfo {
    id: string;
    object: 'model';
    owned_by: string;
    created: number;
    description?: string;
    context_length?: number;
    provider?: string;
    capabilities: string[];
}

export interface ModelListResponse {
    data: ModelInfo[];
    object: 'list';
}

export interface ChatSession {
    id: string;
    user_id: string;
    organization_id?: string;
    title?: string;
    model?: string;
    agent_type?: string;
    created_at: string;
    updated_at: string;
    last_message_at?: string;
    message_count: number;
    tokens_in: number;
    tokens_out: number;
    tokens_total: number;
    metadata: Record<string, unknown>;
    archived: boolean;
}

export interface ChatSessionDetail {
    session: ChatSession;
    messages: ChatMessage[];
}

export interface ChatSessionListResponse {
    sessions: ChatSession[];
    total: number;
    page: number;
    page_size: number;
    has_more: boolean;
}

export class AgentAPIService {
    private baseUrl =
        process.env.NEXT_PUBLIC_AGENTAPI_URL || 'http://localhost:3284';

    /**
     * Get list of available models
     */
    async getModels(): Promise<ModelListResponse> {
        const response = await fetch(`${this.baseUrl}/v1/models`);
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Get chat sessions for a user
     */
    async getChatSessions(
        userId: string,
        page = 1,
        pageSize = 20,
    ): Promise<ChatSessionListResponse> {
        const params = new URLSearchParams({
            user_id: userId,
            page: page.toString(),
            page_size: pageSize.toString(),
        });

        const response = await fetch(`${this.baseUrl}/atoms/chat/sessions?${params}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch chat sessions: ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Get detailed chat session with messages
     */
    async getChatSession(sessionId: string, userId: string): Promise<ChatSessionDetail> {
        const params = new URLSearchParams({ user_id: userId });
        const response = await fetch(
            `${this.baseUrl}/atoms/chat/sessions/${sessionId}?${params}`,
        );
        if (!response.ok) {
            throw new Error(`Failed to fetch chat session: ${response.statusText}`);
        }
        return response.json();
    }
}

// Singleton instance
export const agentAPIService = new AgentAPIService();

