import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { supabase } from '@/lib/supabase/supabaseBrowser';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    type?: 'text' | 'voice';
}

interface OrganizationMessages {
    [orgId: string]: Message[];
}

interface LeftAgentStore {
    isOpen: boolean;
    isMinimized: boolean;
    panelWidth: number;
    organizationMessages: OrganizationMessages;
    _hasHydrated: boolean;
    n8nWebhookUrl?: string;
    currentProjectId?: string;
    currentDocumentId?: string;
    currentUserId?: string;
    currentOrgId?: string;
    currentPinnedOrganizationId?: string;
    currentUsername: string | null;

    setIsOpen: (isOpen: boolean) => void;
    setIsMinimized: (isMinimized: boolean) => void;
    setPanelWidth: (width: number) => void;
    togglePanel: () => void;

    addMessage: (message: Message) => void;
    clearMessages: () => void;
    clearAllOrganizationMessages: () => void;
    getMessagesForCurrentOrg: () => Message[];
    getMessagesForOrg: (orgId: string) => Message[];

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

    sendToN8n: (
        data: Omit<N8nRequestData, 'secureContext'>,
    ) => Promise<Record<string, unknown>>;

    organizationQueues: { [orgId: string]: string[] };
    addToQueue: (message: string) => void;
    popFromQueue: () => string | undefined;
    removeFromQueue: (index: number) => void;
    clearQueue: () => void;
    getQueueForCurrentOrg: () => string[];
}

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

export const useLeftAgentStore = create<LeftAgentStore>()(
    persist(
        (set, get) => ({
            isOpen: false,
            isMinimized: false,
            panelWidth: 380,
            organizationMessages: {},
            _hasHydrated: false,
            currentPinnedOrganizationId: undefined,
            currentUsername: null,
            organizationQueues: {},

            setIsOpen: (isOpen: boolean) => set({ isOpen }),
            setIsMinimized: (isMinimized: boolean) => set({ isMinimized }),
            setPanelWidth: (width: number) => set({ panelWidth: width }),
            togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

            addMessage: (message: Message) => {
                const { currentPinnedOrganizationId } = get();
                if (!currentPinnedOrganizationId) {
                    console.warn('LeftAgent - No pinned organization ID for message');
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
                if (!currentPinnedOrganizationId) return;
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
                if (!currentPinnedOrganizationId) return [];
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
                if (!n8nWebhookUrl) throw new Error('N8N webhook URL not configured');
                if (!currentUserId || !currentOrgId)
                    throw new Error('User context is required');
                try {
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
                        console.warn('LeftAgent - org name fetch failed:', orgError);
                    }
                    const secureContext: SecureUserContext = {
                        userId: currentUserId,
                        orgId: currentOrgId,
                        orgName,
                        pinnedOrganizationId: currentPinnedOrganizationId,
                        timestamp: new Date().toISOString(),
                        sessionToken: '',
                        username: currentUsername || '',
                    };
                    if (currentProjectId) secureContext.projectId = currentProjectId;
                    if (currentDocumentId) secureContext.documentId = currentDocumentId;
                    const requestData: N8nRequestData = { ...data, secureContext };
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

            addToQueue: (message: string) => {
                const { currentPinnedOrganizationId, organizationQueues } = get();
                if (!currentPinnedOrganizationId) return;
                const queue = organizationQueues[currentPinnedOrganizationId] || [];
                if (queue.length >= 5) return;
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
            name: 'left-agent-store',
            partialize: (state) => ({
                organizationMessages: Object.fromEntries(
                    Object.entries(state.organizationMessages).map(
                        ([orgId, messages]) => [
                            orgId,
                            (messages as Message[]).map((msg) => ({
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
                if (state?.organizationMessages) {
                    state.organizationMessages = Object.fromEntries(
                        Object.entries(state.organizationMessages).map(
                            ([orgId, messages]) => [
                                orgId,
                                (messages as unknown as Message[]).map((msg) => ({
                                    ...msg,
                                    timestamp: new Date(
                                        msg.timestamp as unknown as string,
                                    ),
                                })),
                            ],
                        ),
                    );
                }
                state?.setHasHydrated(true);
            },
        },
    ),
);

export function openLeftAgentWithMarkdown(md: string) {
    const { addMessage, setIsOpen } = useLeftAgentStore.getState();
    addMessage({
        id: String(Date.now()),
        content: md,
        role: 'assistant',
        timestamp: new Date(),
    });
    setIsOpen(true);
}
