import { create } from 'zustand';

interface ProjectState {
    selectedProjectId: string | null;
    selectedProjectName: string | null;
    selectProject: (id: string, name: string) => void;
    clearSelectedProject: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
    selectedProjectId: null,
    selectedProjectName: null,
    selectProject: (id: string, name: string) =>
        set({ selectedProjectId: id, selectedProjectName: name }),
    clearSelectedProject: () =>
        set({ selectedProjectId: null, selectedProjectName: null }),
}));
