/**
 * Simplified Agent Store
 * 
 * Reduced from 663 LOC to ~150 LOC
 * - Removed message management (handled by useChat)
 * - Removed session management (handled by API)
 * - Removed message queue (handled by useChat)
 * - Kept only UI state and preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * User context for metadata
 */
interface UserContext {
    userId?: string;
    orgId?: string;
    projectId?: string;
    documentId?: string;
    username?: string;
    orgName?: string;
    pinnedOrganizationId?: string;
}

/**
 * Simplified Agent Store Interface
 */
interface AgentStore {
    // UI State
    isOpen: boolean;
    isMinimized: boolean;
    panelWidth: number;
    
    // Session State
    currentSessionId: string | null;
    selectedModel: string;
    
    // User Context (for metadata)
    currentUserId?: string;
    currentOrgId?: string;
    currentProjectId?: string;
    currentDocumentId?: string;
    currentUsername?: string;
    currentOrgName?: string;
    currentPinnedOrgId?: string;
    
    // UI Actions
    setIsOpen: (isOpen: boolean) => void;
    setIsMinimized: (isMinimized: boolean) => void;
    setPanelWidth: (width: number) => void;
    togglePanel: () => void;
    
    // Session Actions
    setCurrentSession: (sessionId: string | null) => void;
    setSelectedModel: (model: string) => void;
    
    // Context Actions
    setUserContext: (context: UserContext) => void;
}

/**
 * Default model
 */
const DEFAULT_MODEL = 'claude-sonnet-4-5@20250929';

/**
 * Create the simplified agent store
 */
export const useAgentStore = create<AgentStore>()(
    persist(
        (set) => ({
            // Initial UI State
            isOpen: false,
            isMinimized: false,
            panelWidth: 420,
            
            // Initial Session State
            currentSessionId: null,
            selectedModel: DEFAULT_MODEL,
            
            // Initial User Context
            currentUserId: undefined,
            currentOrgId: undefined,
            currentProjectId: undefined,
            currentDocumentId: undefined,
            currentUsername: undefined,
            currentOrgName: undefined,
            currentPinnedOrgId: undefined,
            
            // UI Actions
            setIsOpen: (isOpen) => set({ isOpen }),
            
            setIsMinimized: (isMinimized) => set({ isMinimized }),
            
            setPanelWidth: (panelWidth) => set({ panelWidth }),
            
            togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
            
            // Session Actions
            setCurrentSession: (currentSessionId) => set({ currentSessionId }),
            
            setSelectedModel: (selectedModel) => set({ selectedModel }),
            
            // Context Actions
            setUserContext: (context) => set({
                currentUserId: context.userId,
                currentOrgId: context.orgId,
                currentProjectId: context.projectId,
                currentDocumentId: context.documentId,
                currentUsername: context.username,
                currentOrgName: context.orgName,
                currentPinnedOrgId: context.pinnedOrganizationId,
            }),
        }),
        {
            name: 'agent-store',
            // Only persist UI preferences and session ID
            partialize: (state) => ({
                isOpen: state.isOpen,
                isMinimized: state.isMinimized,
                panelWidth: state.panelWidth,
                selectedModel: state.selectedModel,
                currentSessionId: state.currentSessionId,
            }),
        }
    )
);

/**
 * Selector hooks for common use cases
 */
export const useAgentPanelState = () => {
    const isOpen = useAgentStore((state) => state.isOpen);
    const isMinimized = useAgentStore((state) => state.isMinimized);
    const togglePanel = useAgentStore((state) => state.togglePanel);
    const setIsOpen = useAgentStore((state) => state.setIsOpen);
    
    return { isOpen, isMinimized, togglePanel, setIsOpen };
};

export const useAgentSession = () => {
    const currentSessionId = useAgentStore((state) => state.currentSessionId);
    const selectedModel = useAgentStore((state) => state.selectedModel);
    const setCurrentSession = useAgentStore((state) => state.setCurrentSession);
    const setSelectedModel = useAgentStore((state) => state.setSelectedModel);
    
    return { currentSessionId, selectedModel, setCurrentSession, setSelectedModel };
};

export const useAgentContext = () => {
    const currentUserId = useAgentStore((state) => state.currentUserId);
    const currentOrgId = useAgentStore((state) => state.currentOrgId);
    const currentProjectId = useAgentStore((state) => state.currentProjectId);
    const currentDocumentId = useAgentStore((state) => state.currentDocumentId);
    const currentPinnedOrgId = useAgentStore((state) => state.currentPinnedOrgId);
    const setUserContext = useAgentStore((state) => state.setUserContext);

    return {
        currentUserId,
        currentOrgId,
        currentProjectId,
        currentDocumentId,
        currentPinnedOrgId,
        setUserContext,
    };
};
