import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { atomsApiClient } from '@/lib/atoms-api';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    type?: 'text' | 'voice';
}

// Organization-specific messages structure
interface OrganizationMessages {
    [orgId: string]: Message[];
}

interface AgentStore {
    // Panel state
    isOpen: boolean;
    isMinimized: boolean;
    panelWidth: number;

    // Messages - now organized by organization
    organizationMessages: OrganizationMessages;

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

    // Organization-specific message methods
    addMessage: (message: Message) => void;
    clearMessages: () => void;
    clearAllOrganizationMessages: () => void;
    getMessagesForCurrentOrg: () => Message[];
    getMessagesForOrg: (orgId: string) => Message[];

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

    // Chat queue per organization
    organizationQueues: { [orgId: string]: string[] };
    // Queue actions
    addToQueue: (message: string) => void;
    popFromQueue: () => string | undefined;
    removeFromQueue: (index: number) => void;
    clearQueue: () => void;
    getQueueForCurrentOrg: () => string[];
}

type _PinnedOrganizationId = string | undefined;

interface SecureUserContext {
    userId: string;
    orgId: string;
    orgName?: string;
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
    const localStorage = typeof window !== 'undefined' ? window.localStorage : null;
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
                'AgentStore Debug - Organization messages in localStorage:',
                Object.keys(parsed.state?.organizationMessages || {}).length,
            );
        } catch (error) {
            console.error('AgentStore Debug - Failed to parse localStorage data:', error);
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
            organizationMessages: {},
            _hasHydrated: false,
            currentPinnedOrganizationId: undefined,
            currentUsername: null,
            organizationQueues: {},

            // Actions
            setIsOpen: (isOpen: boolean) => set({ isOpen }),
            setIsMinimized: (isMinimized: boolean) => set({ isMinimized }),
            setPanelWidth: (width: number) => set({ panelWidth: width }),
            togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

            // Organization-specific message methods
            addMessage: (message: Message) => {
                const { currentPinnedOrganizationId } = get();
                if (!currentPinnedOrganizationId) {
                    console.warn('No pinned organization ID available for message');
                    return;
                }

                set((state) => ({
                    organizationMessages: {
                        ...state.organizationMessages,
                        [currentPinnedOrganizationId]: [
                            ...(state.organizationMessages[currentPinnedOrganizationId] ||
                                []),
                            message,
                        ],
                    },
                }));
            },

            clearMessages: () => {
                const { currentPinnedOrganizationId } = get();
                if (!currentPinnedOrganizationId) {
                    console.warn(
                        'No pinned organization ID available for clearing messages',
                    );
                    return;
                }

                set((state) => ({
                    organizationMessages: {
                        ...state.organizationMessages,
                        [currentPinnedOrganizationId]: [],
                    },
                }));
            },

            clearAllOrganizationMessages: () => set({ organizationMessages: {} }),

            getMessagesForCurrentOrg: () => {
                const { currentPinnedOrganizationId, organizationMessages } = get();
                if (!currentPinnedOrganizationId) {
                    return [];
                }
                return organizationMessages[currentPinnedOrganizationId] || [];
            },

            getMessagesForOrg: (orgId: string) => {
                const { organizationMessages } = get();
                return organizationMessages[orgId] || [];
            },

            setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),

            setN8nConfig: (webhookUrl: string) => set({ n8nWebhookUrl: webhookUrl }),

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

                {
                    // Fetch organization name
                    let orgName: string | undefined;
                    try {
                        const api = atomsApiClient();
                        const org = await api.organizations.getById(currentOrgId);
                        orgName = (org as any)?.name;
                    } catch (orgError) {
                        console.warn('Failed to fetch organization name:', orgError);
                    }

                    // Create secure context with only necessary information
                    const secureContext: SecureUserContext = {
                        userId: currentUserId,
                        orgId: currentOrgId,
                        orgName,
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
                }
            },

            // Chat queue per organization
            addToQueue: (message: string) => {
                const { currentPinnedOrganizationId, organizationQueues } = get();
                if (!currentPinnedOrganizationId) return;
                const queue = organizationQueues[currentPinnedOrganizationId] || [];
                if (queue.length >= 5) return; // Max 5
                set({
                    organizationQueues: {
                        ...organizationQueues,
                        [currentPinnedOrganizationId]: [...queue, message],
                    },
                });
            },
            popFromQueue: () => {
                const { currentPinnedOrganizationId, organizationQueues } = get();
                if (!currentPinnedOrganizationId) return undefined;
                const queue = organizationQueues[currentPinnedOrganizationId] || [];
                if (queue.length === 0) return undefined;
                const [next, ...rest] = queue;
                set({
                    organizationQueues: {
                        ...organizationQueues,
                        [currentPinnedOrganizationId]: rest,
                    },
                });
                return next;
            },
            removeFromQueue: (index: number) => {
                const { currentPinnedOrganizationId, organizationQueues } = get();
                if (!currentPinnedOrganizationId) return;
                const queue = organizationQueues[currentPinnedOrganizationId] || [];
                if (index < 0 || index >= queue.length) return;
                const newQueue = queue.filter((_, i) => i !== index);
                set({
                    organizationQueues: {
                        ...organizationQueues,
                        [currentPinnedOrganizationId]: newQueue,
                    },
                });
            },
            clearQueue: () => {
                const { currentPinnedOrganizationId, organizationQueues } = get();
                if (!currentPinnedOrganizationId) return;
                set({
                    organizationQueues: {
                        ...organizationQueues,
                        [currentPinnedOrganizationId]: [],
                    },
                });
            },
            getQueueForCurrentOrg: () => {
                const { currentPinnedOrganizationId, organizationQueues } = get();
                if (!currentPinnedOrganizationId) return [];
                return organizationQueues[currentPinnedOrganizationId] || [];
            },
        }),
        {
            // Persist the store to the browser's localStorage
            name: 'agent-store',
            partialize: (state) => ({
                organizationMessages: Object.fromEntries(
                    Object.entries(state.organizationMessages).map(
                        ([orgId, messages]) => [
                            orgId,
                            messages.map((msg) => ({
                                ...msg,
                                timestamp: msg.timestamp.toISOString(),
                            })),
                        ],
                    ),
                ),
                n8nWebhookUrl: state.n8nWebhookUrl,
                isMinimized: state.isMinimized,
                panelWidth: state.panelWidth,
            }),
            onRehydrateStorage: () => (state) => {
                console.log('AgentStore - onRehydrateStorage called');

                // Migration: Check if old messages format exists
                const localStorage =
                    typeof window !== 'undefined' ? window.localStorage : null;
                if (localStorage) {
                    const stored = localStorage.getItem('agent-store');
                    if (stored) {
                        try {
                            const parsed = JSON.parse(stored);
                            // Check if old messages format exists (messages array instead of organizationMessages)
                            if (
                                parsed.state?.messages &&
                                Array.isArray(parsed.state.messages) &&
                                !parsed.state?.organizationMessages &&
                                state?.currentPinnedOrganizationId
                            ) {
                                console.log(
                                    'AgentStore - Migrating old messages format to organization-based format',
                                );

                                // Convert old messages to organization format
                                const oldMessages = parsed.state.messages.map(
                                    (msg: {
                                        timestamp: string | Date;
                                        [key: string]: unknown;
                                    }) => ({
                                        ...msg,
                                        timestamp: new Date(msg.timestamp),
                                    }),
                                );

                                // Assign old messages to current pinned organization
                                if (state.organizationMessages) {
                                    state.organizationMessages[
                                        state.currentPinnedOrganizationId
                                    ] = oldMessages;
                                } else {
                                    state.organizationMessages = {
                                        [state.currentPinnedOrganizationId]: oldMessages,
                                    };
                                }

                                console.log(
                                    `AgentStore - Migrated ${oldMessages.length} messages to organization ${state.currentPinnedOrganizationId}`,
                                );
                            }
                        } catch (error) {
                            console.error('AgentStore - Error during migration:', error);
                        }
                    }
                }

                if (state?.organizationMessages) {
                    console.log(
                        'AgentStore - Restoring organization messages from localStorage:',
                        Object.keys(state.organizationMessages).length,
                    );
                    // Convert timestamp strings back to Date objects
                    state.organizationMessages = Object.fromEntries(
                        Object.entries(state.organizationMessages).map(
                            ([orgId, messages]) => [
                                orgId,
                                messages.map((msg) => ({
                                    ...msg,
                                    timestamp: new Date(msg.timestamp),
                                })),
                            ],
                        ),
                    );
                } else {
                    console.log(
                        'AgentStore - No organization messages found in localStorage',
                    );
                }
                // Set hydration flag after localStorage data is restored
                state?.setHasHydrated(true);
                console.log('AgentStore - Hydration completed');
            },
        },
    ),
);
