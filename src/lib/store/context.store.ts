import { create } from 'zustand';

interface contextState {
    currentUserId: string | null;
    setCurrentUserId: (userId: string | null) => void;
    currentOrgId: string | null;
    setCurrentOrgId: (orgId: string | null) => void;
    currentProjectId: string | null;
    setCurrentProjectId: (projectId: string | null) => void;
}

export const useContextStore = create<contextState>((set) => ({
    currentUserId: null,
    setCurrentUserId: (userId) => set({ currentUserId: userId }),
    currentOrgId: null,
    setCurrentOrgId: (orgId) => set({ currentOrgId: orgId }),
    currentProjectId: null,
    setCurrentProjectId: (projectId) => set({ currentProjectId: projectId }),
}));
