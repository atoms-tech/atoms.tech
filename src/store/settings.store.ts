import { create } from 'zustand';

type SettingsStore = {
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    layoutViewMode: 'standard' | 'wide';
    setLayoutViewMode: (mode: 'standard' | 'wide') => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
    theme: 'light',
    setTheme: (theme) => set({ theme }),
    sidebarCollapsed: false,
    toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    layoutViewMode: 'standard',
    setLayoutViewMode: (layoutViewMode) => set({ layoutViewMode }),
}));
