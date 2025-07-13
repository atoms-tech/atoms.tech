import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    type?: 'text' | 'voice';
}

interface AgentStore {
    // Panel state
    isOpen: boolean;
    isMinimized: boolean;
    panelWidth: number;

    // Messages
    messages: Message[];

    // Hydration state - critical for preventing data loss on refresh
    _hasHydrated: boolean;

    // N8N Integration
    n8nWebhookUrl?: string;

    // User Context
    currentProjectId?: string;
    currentDocumentId?: string;
    currentUserId?: string;
    currentOrgId?: string;
    currentPinnedOrganizationId?: string;
    currentUsername: string | null;

    // Actions
    setIsOpen: (isOpen: boolean) => void;
    setIsMinimized: (isMinimized: boolean) => void;
    setPanelWidth: (width: number) => void;
    togglePanel: () => void;

    addMessage: (message: Message) => void;
    clearMessages: () => void;

    // Hydration actions
    setHasHydrated: (hydrated: boolean) => void;

    setN8nConfig: (webhookUrl: string) => void;
    setUserContext: (context: {
        projectId?: string;
        documentId?: string;
        userId?: string;
        orgId?: string;
        pinnedOrganizationId?: string;
        username?: string;
    }) => void;

    // N8N Integration methods
    sendToN8n: (
        data: Omit<N8nRequestData, 'secureContext'>,
    ) => Promise<Record<string, unknown>>;
}

// Add pinnedOrganizationId to SecureUserContext
type _PinnedOrganizationId = string | undefined;

interface SecureUserContext {
    userId: string;
    orgId: string;
    pinnedOrganizationId?: string;
    projectId?: string;
    documentId?: string;
    timestamp: string;
    sessionToken: string;
    username?: string;
}

interface N8nRequestData {
    type: string;
    message?: string;
    conversationHistory?: Message[];
    timestamp?: string;
    secureContext: SecureUserContext;
}

// Utility function to debug localStorage state
export const debugAgentStore = () => {
    const localStorage =
        typeof window !== 'undefined' ? window.localStorage : null;
    if (!localStorage) {
        console.log('AgentStore Debug - localStorage not available');
        return;
    }

    const stored = localStorage.getItem('agent-store');
    console.log('AgentStore Debug - Raw localStorage data:', stored);

    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            console.log('AgentStore Debug - Parsed localStorage data:', parsed);
            console.log(
                'AgentStore Debug - Messages in localStorage:',
                parsed.state?.messages?.length || 0,
            );
        } catch (error) {
            console.error(
                'AgentStore Debug - Failed to parse localStorage data:',
                error,
            );
        }
    } else {
        console.log('AgentStore Debug - No data found in localStorage');
    }
};

export const useAgentStore = create<AgentStore>()(
    persist(
        (set, get) => ({
            // Initial state
            isOpen: false,
            isMinimized: false,
            panelWidth: 400,
            messages: [],
            _hasHydrated: false,
            currentPinnedOrganizationId: undefined,
            currentUsername: null,

            // Actions
            setIsOpen: (isOpen: boolean) => set({ isOpen }),
            setIsMinimized: (isMinimized: boolean) => set({ isMinimized }),
            setPanelWidth: (width: number) => set({ panelWidth: width }),
            togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

            addMessage: (message: Message) =>
                set((state) => ({
                    messages: [...state.messages, message],
                })),

            clearMessages: () => set({ messages: [] }),

            setHasHydrated: (hydrated: boolean) =>
                set({ _hasHydrated: hydrated }),

            setN8nConfig: (webhookUrl: string) =>
                set({ n8nWebhookUrl: webhookUrl }),

            setUserContext: (context) =>
                set({
                    currentProjectId: context.projectId,
                    currentDocumentId: context.documentId,
                    currentUserId: context.userId,
                    currentOrgId: context.orgId,
                    currentPinnedOrganizationId: context.pinnedOrganizationId,
                    currentUsername: context.username || null,
                }),

            // N8N Integration methods
            sendToN8n: async (data: Omit<N8nRequestData, 'secureContext'>) => {
                const {
                    n8nWebhookUrl,
                    currentProjectId,
                    currentDocumentId,
                    currentUserId,
                    currentOrgId,
                    currentPinnedOrganizationId,
                    currentUsername,
                } = get();

                if (!n8nWebhookUrl) {
                    throw new Error('N8N webhook URL not configured');
                }

                if (!currentUserId || !currentOrgId) {
                    throw new Error('User context is required');
                }

                try {
                    // Create secure context with only necessary information
                    const secureContext: SecureUserContext = {
                        userId: currentUserId,
                        orgId: currentOrgId,
                        pinnedOrganizationId: currentPinnedOrganizationId,
                        timestamp: new Date().toISOString(),
                        sessionToken: '',
                        username: currentUsername || '',
                    };

                    // Include optional context if available
                    if (currentProjectId) {
                        secureContext.projectId = currentProjectId;
                    }
                    if (currentDocumentId) {
                        secureContext.documentId = currentDocumentId;
                    }

                    // Include secure user context in the request
                    const requestData: N8nRequestData = {
                        ...data,
                        secureContext,
                    };

                    // Use our server-side proxy to avoid CORS issues
                    const response = await fetch('/api/n8n-proxy', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Secure-Context': Buffer.from(
                                JSON.stringify(secureContext),
                            ).toString('base64'),
                        },
                        body: JSON.stringify({
                            webhookUrl: n8nWebhookUrl,
                            ...requestData,
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        // Handle specific N8N errors with user-friendly messages
                        if (
                            errorData.code === 404 &&
                            errorData.message?.includes('webhook')
                        ) {
                            throw new Error(
                                'We are currently experiencing connection issues with our server. Please try again in a few moments.',
                            );
                        }
                        throw new Error(
                            'We are having trouble connecting to our server. Please try again later.',
                        );
                    }

                    return await response.json();
                } catch (error) {
                    throw error;
                }
            },
        }),
        {
            // Persist the store to the browser's localStorage
            name: 'agent-store',
            partialize: (state) => ({
                messages: state.messages.map((msg) => ({
                    ...msg,
                    timestamp: msg.timestamp.toISOString(),
                })),
                n8nWebhookUrl: state.n8nWebhookUrl,
                isMinimized: state.isMinimized,
                panelWidth: state.panelWidth,
            }),
            onRehydrateStorage: () => (state) => {
                console.log('AgentStore - onRehydrateStorage called');
                if (state?.messages) {
                    console.log(
                        'AgentStore - Restoring messages from localStorage:',
                        state.messages.length,
                    );
                    state.messages = state.messages.map((msg) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp),
                    }));
                } else {
                    console.log(
                        'AgentStore - No messages found in localStorage',
                    );
                }
                // Set hydration flag after localStorage data is restored
                state?.setHasHydrated(true);
                console.log('AgentStore - Hydration completed');
            },
        },
    ),
);
