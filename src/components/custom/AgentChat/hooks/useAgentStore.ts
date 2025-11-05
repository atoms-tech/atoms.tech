import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    type?: 'text' | 'voice';
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
    isArchived: boolean;
    tags: string[];
}

// Organization-specific messages structure
interface OrganizationMessages {
    [orgId: string]: Message[];
}

// Organization-specific chat sessions
interface OrganizationChatSessions {
    [orgId: string]: ChatSession[];
}

interface AgentStore {
    // Panel state
    isOpen: boolean;
    isMinimized: boolean;
    panelWidth: number;

    // Messages - now organized by organization
    organizationMessages: OrganizationMessages;

    // Chat sessions - organized by organization
    organizationChatSessions: OrganizationChatSessions;
    currentChatSessionId: string | null;

    // Hydration state - critical for preventing data loss on refresh
    _hasHydrated: boolean;

    // User Context
    currentProjectId?: string;
    currentDocumentId?: string;
    currentUserId?: string;
    currentOrgId?: string;
    currentPinnedOrganizationId?: string;
    currentUsername: string | null;
    currentOrgName?: string | null;

    // AgentAPI Configuration
    agentapiWebhookUrl: string | null;
    selectedModel: string;

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

    // Chat session management
    createChatSession: (title?: string) => string;
    getChatSessionsForCurrentOrg: () => ChatSession[];
    getCurrentChatSession: () => ChatSession | null;
    setCurrentChatSession: (sessionId: string) => void;
    updateChatSessionTitle: (sessionId: string, title: string) => void;
    archiveChatSession: (sessionId: string) => void;
    unarchiveChatSession: (sessionId: string) => void;
    deleteChatSession: (sessionId: string) => void;
    addTagToChatSession: (sessionId: string, tag: string) => void;
    removeTagFromChatSession: (sessionId: string, tag: string) => void;
    autoArchiveInactiveSessions: () => void;

    // AgentAPI actions
    setAgentAPIConfig: (webhookUrl: string) => void;
    sendToAgentAPI: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
    setSelectedModel: (modelId: string) => void;

    // Hydration actions
    setHasHydrated: (hydrated: boolean) => void;

    setUserContext: (context: {
        projectId?: string;
        documentId?: string;
        userId?: string;
        orgId?: string;
        pinnedOrganizationId?: string;
        username?: string;
        orgName?: string;
    }) => void;

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
            organizationChatSessions: {},
            currentChatSessionId: null,
            _hasHydrated: false,
            currentPinnedOrganizationId: undefined,
            currentUsername: null,
            organizationQueues: {},
            currentOrgName: null,
            agentapiWebhookUrl: null,
            selectedModel: 'claude-sonnet-4-5@20250929', // Default to Claude 4.5 Sonnet

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

            setUserContext: (context) =>
                set({
                    currentProjectId: context.projectId,
                    currentDocumentId: context.documentId,
                    currentUserId: context.userId,
                    currentOrgId: context.orgId,
                    currentPinnedOrganizationId: context.pinnedOrganizationId,
                    currentUsername: context.username || null,
                    currentOrgName: context.orgName ?? null,
                }),

            // AgentAPI configuration and methods
            setAgentAPIConfig: (webhookUrl: string) => {
                set({ agentapiWebhookUrl: webhookUrl });
            },

            sendToAgentAPI: async (data: Record<string, unknown>) => {
                const { agentapiWebhookUrl, selectedModel } = get();

                if (!agentapiWebhookUrl) {
                    throw new Error('AgentAPI webhook URL is not configured');
                }

                // Include the selected model in the request data
                const requestData = {
                    ...data,
                    model: selectedModel,
                };

                const response = await fetch(agentapiWebhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                });

                if (!response.ok) {
                    throw new Error(`AgentAPI request failed: ${response.statusText}`);
                }

                return await response.json();
            },

            setSelectedModel: (modelId: string) => {
                set({ selectedModel: modelId });
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

            // Chat session management
            createChatSession: (title?: string) => {
                const { currentPinnedOrganizationId, organizationChatSessions } = get();
                if (!currentPinnedOrganizationId) return '';

                const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newSession: ChatSession = {
                    id: sessionId,
                    title: title || 'New Chat',
                    messages: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isArchived: false,
                    tags: [],
                };

                set({
                    organizationChatSessions: {
                        ...organizationChatSessions,
                        [currentPinnedOrganizationId]: [
                            ...(organizationChatSessions[currentPinnedOrganizationId] || []),
                            newSession,
                        ],
                    },
                    currentChatSessionId: sessionId,
                });

                return sessionId;
            },

            getChatSessionsForCurrentOrg: () => {
                const { currentPinnedOrganizationId, organizationChatSessions } = get();
                if (!currentPinnedOrganizationId) return [];
                return organizationChatSessions[currentPinnedOrganizationId] || [];
            },

            getCurrentChatSession: () => {
                const { currentChatSessionId, getChatSessionsForCurrentOrg } = get();
                if (!currentChatSessionId) return null;
                const sessions = getChatSessionsForCurrentOrg();
                return sessions.find((s) => s.id === currentChatSessionId) || null;
            },

            setCurrentChatSession: (sessionId: string) => {
                set({ currentChatSessionId: sessionId });
            },

            updateChatSessionTitle: (sessionId: string, title: string) => {
                const { currentPinnedOrganizationId, organizationChatSessions } = get();
                if (!currentPinnedOrganizationId) return;

                const sessions = organizationChatSessions[currentPinnedOrganizationId] || [];
                const updatedSessions = sessions.map((session) =>
                    session.id === sessionId
                        ? { ...session, title, updatedAt: new Date() }
                        : session,
                );

                set({
                    organizationChatSessions: {
                        ...organizationChatSessions,
                        [currentPinnedOrganizationId]: updatedSessions,
                    },
                });
            },

            archiveChatSession: (sessionId: string) => {
                const { currentPinnedOrganizationId, organizationChatSessions } = get();
                if (!currentPinnedOrganizationId) return;

                const sessions = organizationChatSessions[currentPinnedOrganizationId] || [];
                const updatedSessions = sessions.map((session) =>
                    session.id === sessionId
                        ? { ...session, isArchived: true, updatedAt: new Date() }
                        : session,
                );

                set({
                    organizationChatSessions: {
                        ...organizationChatSessions,
                        [currentPinnedOrganizationId]: updatedSessions,
                    },
                });
            },

            unarchiveChatSession: (sessionId: string) => {
                const { currentPinnedOrganizationId, organizationChatSessions } = get();
                if (!currentPinnedOrganizationId) return;

                const sessions = organizationChatSessions[currentPinnedOrganizationId] || [];
                const updatedSessions = sessions.map((session) =>
                    session.id === sessionId
                        ? { ...session, isArchived: false, updatedAt: new Date() }
                        : session,
                );

                set({
                    organizationChatSessions: {
                        ...organizationChatSessions,
                        [currentPinnedOrganizationId]: updatedSessions,
                    },
                });
            },

            deleteChatSession: (sessionId: string) => {
                const {
                    currentPinnedOrganizationId,
                    organizationChatSessions,
                    currentChatSessionId,
                } = get();
                if (!currentPinnedOrganizationId) return;

                const sessions = organizationChatSessions[currentPinnedOrganizationId] || [];
                const updatedSessions = sessions.filter((session) => session.id !== sessionId);

                set({
                    organizationChatSessions: {
                        ...organizationChatSessions,
                        [currentPinnedOrganizationId]: updatedSessions,
                    },
                    currentChatSessionId:
                        currentChatSessionId === sessionId ? null : currentChatSessionId,
                });
            },

            addTagToChatSession: (sessionId: string, tag: string) => {
                const { currentPinnedOrganizationId, organizationChatSessions } = get();
                if (!currentPinnedOrganizationId) return;

                const sessions = organizationChatSessions[currentPinnedOrganizationId] || [];
                const updatedSessions = sessions.map((session) =>
                    session.id === sessionId && !session.tags.includes(tag)
                        ? { ...session, tags: [...session.tags, tag], updatedAt: new Date() }
                        : session,
                );

                set({
                    organizationChatSessions: {
                        ...organizationChatSessions,
                        [currentPinnedOrganizationId]: updatedSessions,
                    },
                });
            },

            removeTagFromChatSession: (sessionId: string, tag: string) => {
                const { currentPinnedOrganizationId, organizationChatSessions } = get();
                if (!currentPinnedOrganizationId) return;

                const sessions = organizationChatSessions[currentPinnedOrganizationId] || [];
                const updatedSessions = sessions.map((session) =>
                    session.id === sessionId
                        ? {
                              ...session,
                              tags: session.tags.filter((t) => t !== tag),
                              updatedAt: new Date(),
                          }
                        : session,
                );

                set({
                    organizationChatSessions: {
                        ...organizationChatSessions,
                        [currentPinnedOrganizationId]: updatedSessions,
                    },
                });
            },

            autoArchiveInactiveSessions: () => {
                const { currentPinnedOrganizationId, organizationChatSessions } = get();
                if (!currentPinnedOrganizationId) return;

                const sessions = organizationChatSessions[currentPinnedOrganizationId] || [];
                const now = new Date();
                const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

                const updatedSessions = sessions.map((session) => {
                    if (!session.isArchived && session.updatedAt < twentyFourHoursAgo) {
                        return { ...session, isArchived: true };
                    }
                    return session;
                });

                set({
                    organizationChatSessions: {
                        ...organizationChatSessions,
                        [currentPinnedOrganizationId]: updatedSessions,
                    },
                });
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
                organizationChatSessions: Object.fromEntries(
                    Object.entries(state.organizationChatSessions).map(
                        ([orgId, sessions]) => [
                            orgId,
                            sessions.map((session) => ({
                                ...session,
                                createdAt: session.createdAt.toISOString(),
                                updatedAt: session.updatedAt.toISOString(),
                                messages: session.messages.map((msg) => ({
                                    ...msg,
                                    timestamp: msg.timestamp.toISOString(),
                                })),
                            })),
                        ],
                    ),
                ),
                currentChatSessionId: state.currentChatSessionId,
                isMinimized: state.isMinimized,
                panelWidth: state.panelWidth,
                agentapiWebhookUrl: state.agentapiWebhookUrl,
                selectedModel: state.selectedModel,
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
                                        timestamp: new Date(
                                            msg.timestamp || msg.timestamp,
                                        ),
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

                if (state?.organizationChatSessions) {
                    console.log(
                        'AgentStore - Restoring chat sessions from localStorage:',
                        Object.keys(state.organizationChatSessions).length,
                    );
                    // Convert timestamp strings back to Date objects
                    state.organizationChatSessions = Object.fromEntries(
                        Object.entries(state.organizationChatSessions).map(
                            ([orgId, sessions]) => [
                                orgId,
                                sessions.map((session) => ({
                                    ...session,
                                    createdAt: new Date(session.createdAt),
                                    updatedAt: new Date(session.updatedAt),
                                    messages: session.messages.map((msg) => ({
                                        ...msg,
                                        timestamp: new Date(msg.timestamp),
                                    })),
                                })),
                            ],
                        ),
                    );
                } else {
                    console.log('AgentStore - No chat sessions found in localStorage');
                }
                // Set hydration flag after localStorage data is restored
                state?.setHasHydrated(true);
                console.log('AgentStore - Hydration completed');
            },
        },
    ),
);
