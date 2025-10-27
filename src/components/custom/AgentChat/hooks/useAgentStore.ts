import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { supabase } from '@/lib/supabase/supabaseBrowser';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    type?: 'text' | 'voice';
    // Optional category to separate chat vs analysis/system
    category?: 'chat' | 'analysis' | 'system'; // [New-Added]
    // Thread identifier for chat conversations (not used for analysis)
    threadId?: string; // [New-Added]

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

    // Threads per organization (metadata only) [New Added]
    organizationThreads: {
        [orgId: string]: {
            [threadId: string]: {
                id: string;
                title: string;
                createdAt: string; // ISO
                updatedAt: string; // ISO
            };
        };
    };
        // Active thread per organization [New Added]
        currentThreadIdByOrg: { [orgId: string]: string | undefined };

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

    // Thread methods [ATOMS-ADDED]
    newThread: (initialTitle?: string) => string | undefined; // returns threadId
    setActiveThread: (threadId: string) => void;
    getActiveThreadId: () => string | undefined;
    listThreadsForCurrentOrg: () => Array<{
        id: string;
        title: string;
        createdAt: string;
        updatedAt: string;
    }>;
    renameThread: (threadId: string, title: string) => void;
    deleteThread: (threadId: string) => void;

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
            organizationThreads: {}, // [ATOMS-ADDED]
            currentThreadIdByOrg: {}, // [ATOMS-ADDED]
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
                // For chat messages, ensure they are associated with an active thread [New Added]
                set((state) => {
                    const orgId = currentPinnedOrganizationId;
                    const isAnalysis = message.category === 'analysis';
                    let threadId = message.threadId;
                    if (!isAnalysis) {
                        const currentThreadId =
                            state.currentThreadIdByOrg[orgId] ||
                            createDefaultThreadForOrg(state, orgId);
                        threadId = threadId || currentThreadId;
                        // Set title from first user message if missing [New Added]
                        const meta = state.organizationThreads[orgId]?.[threadId!];
                        if (meta) {
                            if (!meta.title && message.role === 'user' && message.content) {
                                meta.title = deriveTitle(message.content);
                            }
                            meta.updatedAt = new Date().toISOString();
                        }
                    }
                    const newMsg: Message = { ...message, threadId };
                    return {
                        organizationMessages: {
                            ...state.organizationMessages,
                            [orgId]: [
                                ...(state.organizationMessages[orgId] || []),
                                newMsg,
                            ],
                        },
                        organizationThreads: { ...state.organizationThreads },
                        currentThreadIdByOrg: { ...state.currentThreadIdByOrg },
                    };
                });
            },

            clearMessages: () => {
                const { currentPinnedOrganizationId } = get();
                if (!currentPinnedOrganizationId) {
                    console.warn(
                        'No pinned organization ID available for clearing messages',
                    );
                    return;
                }
                set((state) => {
                    const orgId = currentPinnedOrganizationId;
                    const currentThreadId = state.currentThreadIdByOrg[orgId];
                    const msgs = state.organizationMessages[orgId] || [];
                    const filtered = msgs.filter(
                        (m) => m.category === 'analysis' || m.threadId !== currentThreadId, // [New Added]
                    );
                    return {
                        organizationMessages: {
                            ...state.organizationMessages,
                            [orgId]: filtered,
                        },
                    };
                });
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

                try {
                    // Fetch organization name
                    let orgName: string | undefined;
                    try {
                        const { data: orgData } = await supabase
                            .from('organizations')
                            .select('name')
                            .eq('id', currentOrgId)
                            .eq('is_deleted', false)
                            .single();
                        orgName = orgData?.name;
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
                } catch (error) {
                    throw error;
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

            // Thread management [New Added]
            newThread: (initialTitle?: string) => {
                const { currentPinnedOrganizationId } = get();
                if (!currentPinnedOrganizationId) return undefined;
                const orgId = currentPinnedOrganizationId;
                const id = cryptoId();
                const now = new Date().toISOString();
                set((state) => ({
                    organizationThreads: {
                        ...state.organizationThreads,
                        [orgId]: {
                            ...(state.organizationThreads[orgId] || {}),
                            [id]: {
                                id,
                                title: initialTitle || 'New chat',
                                createdAt: now,
                                updatedAt: now,
                            },
                        },
                    },
                    currentThreadIdByOrg: {
                        ...state.currentThreadIdByOrg,
                        [orgId]: id,
                    },
                }));
                return id;
            },
            setActiveThread: (threadId: string) => {
                const { currentPinnedOrganizationId } = get();
                if (!currentPinnedOrganizationId) return;
                const orgId = currentPinnedOrganizationId;
                set((state) => ({
                    currentThreadIdByOrg: { ...state.currentThreadIdByOrg, [orgId]: threadId },
                }));
            },
            getActiveThreadId: () => {
                const { currentPinnedOrganizationId, currentThreadIdByOrg } = get();
                if (!currentPinnedOrganizationId) return undefined;
                return currentThreadIdByOrg[currentPinnedOrganizationId];
            },
            listThreadsForCurrentOrg: () => {
                const { currentPinnedOrganizationId, organizationThreads } = get();
                if (!currentPinnedOrganizationId) return [];
                const orgThreads = organizationThreads[currentPinnedOrganizationId] || {};
                return Object.values(orgThreads).sort(
                    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                );
            },
            renameThread: (threadId: string, title: string) => {
                const { currentPinnedOrganizationId } = get();
                if (!currentPinnedOrganizationId) return;
                const orgId = currentPinnedOrganizationId;
                set((state) => {
                    const meta = state.organizationThreads[orgId]?.[threadId];
                    if (meta) {
                        meta.title = title;
                        meta.updatedAt = new Date().toISOString();
                    }
                    return {
                        organizationThreads: { ...state.organizationThreads },
                    };
                });
            },
            deleteThread: (threadId: string) => {
                const { currentPinnedOrganizationId } = get();
                if (!currentPinnedOrganizationId) return;
                const orgId = currentPinnedOrganizationId;
                set((state) => {
                    const threads = { ...(state.organizationThreads[orgId] || {}) };
                    delete threads[threadId];
                    const msgs = state.organizationMessages[orgId] || [];
                    const filtered = msgs.filter((m) => m.threadId !== threadId);
                    // pick a new active thread
                    const newActive = Object.keys(threads)[0] || createDefaultThreadForOrg({
                        ...state,
                        organizationThreads: { ...state.organizationThreads, [orgId]: threads },
                    } as any, orgId);
                    return {
                        organizationThreads: {
                            ...state.organizationThreads,
                            [orgId]: threads,
                        },
                        organizationMessages: {
                            ...state.organizationMessages,
                            [orgId]: filtered,
                        },
                        currentThreadIdByOrg: {
                            ...state.currentThreadIdByOrg,
                            [orgId]: newActive,
                        },
                    };
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
                organizationThreads: state.organizationThreads, // [ATOMS-ADDED]
                currentThreadIdByOrg: state.currentThreadIdByOrg, // [ATOMS-ADDED]
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

                // Migration: Initialize threads per org if missing [ATOMS-ADDED]
                if (state) {
                    if (!state.organizationThreads) state.organizationThreads = {} as any;
                    if (!state.currentThreadIdByOrg) state.currentThreadIdByOrg = {} as any;
                    const orgIds = Object.keys(state.organizationMessages || {});
                    for (const orgId of orgIds) {
                        const hasThreads = state.organizationThreads[orgId] &&
                            Object.keys(state.organizationThreads[orgId]).length > 0;
                        let currentId = state.currentThreadIdByOrg[orgId];
                        if (!hasThreads || !currentId) {
                            currentId = createDefaultThreadForOrg(state, orgId);
                            state.currentThreadIdByOrg[orgId] = currentId;
                        }
                        // Assign threadId to existing chat messages (non-analysis) if missing
                        const msgs = state.organizationMessages[orgId] || [];
                        msgs.forEach((m) => {
                            if (m.category !== 'analysis' && !m.threadId) {
                                m.threadId = currentId;
                            }
                        });
                    }
                }
                // Set hydration flag after localStorage data is restored
                state?.setHasHydrated(true);
                console.log('AgentStore - Hydration completed');
            },
        },
    ),
);

// Helpers [New Added]
function cryptoId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (crypto as any).randomUUID();
    }
    return Math.random().toString(36).slice(2);
}

function deriveTitle(content: string) {
    const clean = content.replace(/\s+/g, ' ').trim();
    return clean.length > 40 ? clean.slice(0, 40) + '…' : clean || 'New chat';
}

// Creates a default thread for an organization if none exists
// Mutates state in-place and returns the new thread id
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createDefaultThreadForOrg(state: any, orgId: string): string {
    const id = cryptoId();
    const now = new Date().toISOString();
    if (!state.organizationThreads[orgId]) state.organizationThreads[orgId] = {};
    state.organizationThreads[orgId][id] = {
        id,
        title: 'General',
        createdAt: now,
        updatedAt: now,
    };
    if (!state.currentThreadIdByOrg) state.currentThreadIdByOrg = {};
    state.currentThreadIdByOrg[orgId] = id;
    return id;
}