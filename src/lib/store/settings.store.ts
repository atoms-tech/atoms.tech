// stores/settings.store.ts
import { create } from 'zustand';

type SettingsStore = {
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    viewMode: 'normal' | 'compact';
    setViewMode: (viewMode: 'normal' | 'compact') => void;
    layoutViewMode: "standard" | "wide";
    setLayoutViewMode: (mode: "standard" | "wide") => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
    theme: 'light',
    setTheme: (theme) => set({ theme }),
    sidebarCollapsed: false,
    toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    viewMode: 'normal',
    setViewMode: (viewMode) => set({ viewMode }),
    layoutViewMode: "standard",
    setLayoutViewMode: (layoutViewMode) => set({ layoutViewMode }),
}));
