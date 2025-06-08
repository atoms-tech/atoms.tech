'use client';

import { useCallback, useEffect, useState } from 'react';

export interface CollapsibleConfig {
    id: string;
    defaultOpen?: boolean;
    persistKey?: string;
    sessionOnly?: boolean;
}

export interface CollapsibleState {
    isOpen: boolean;
    toggle: () => void;
    setOpen: (open: boolean) => void;
    id: string;
}

/**
 * Hook for managing collapsible state with optional persistence
 * Provides SSR-safe state management with localStorage integration
 */
export function useCollapsibleState({
    id,
    defaultOpen = false,
    persistKey,
    sessionOnly = false,
}: CollapsibleConfig): CollapsibleState {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [mounted, setMounted] = useState(false);

    // Generate storage key
    const storageKey = persistKey || `collapsible-${id}`;
    const storage = sessionOnly ? sessionStorage : localStorage;

    // SSR-safe initialization
    useEffect(() => {
        setMounted(true);

        // Load persisted state if available
        if (persistKey || !sessionOnly) {
            try {
                const savedState = storage.getItem(storageKey);
                if (savedState !== null) {
                    setIsOpen(JSON.parse(savedState));
                }
            } catch (error) {
                console.warn(`Failed to load collapsible state for ${id}:`, error);
                // Fallback to default state
                setIsOpen(defaultOpen);
            }
        }
    }, [id, defaultOpen, storageKey, sessionOnly, storage, persistKey]);

    // Persist state changes
    useEffect(() => {
        if (!mounted) return;

        if (persistKey || !sessionOnly) {
            try {
                storage.setItem(storageKey, JSON.stringify(isOpen));
            } catch (error) {
                console.warn(`Failed to persist collapsible state for ${id}:`, error);
            }
        }
    }, [isOpen, mounted, storageKey, sessionOnly, storage, id, persistKey]);

    const toggle = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const setOpen = useCallback((open: boolean) => {
        setIsOpen(open);
    }, []);

    return {
        isOpen: mounted ? isOpen : defaultOpen,
        toggle,
        setOpen,
        id,
    };
}

/**
 * Utility function to clean up orphaned collapsible states
 * Useful for removing storage entries for sections that no longer exist
 */
export function cleanupCollapsibleStorage(activeIds: string[], prefix = 'collapsible-') {
    try {
        const keysToRemove: string[] = [];
        
        // Check localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) {
                const id = key.replace(prefix, '');
                if (!activeIds.includes(id)) {
                    keysToRemove.push(key);
                }
            }
        }

        // Remove orphaned keys
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });

        return keysToRemove.length;
    } catch (error) {
        console.warn('Failed to cleanup collapsible storage:', error);
        return 0;
    }
}

/**
 * Hook for managing multiple collapsible sections with bulk operations
 */
export function useCollapsibleGroup(configs: CollapsibleConfig[]) {
    const [groupStates, setGroupStates] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        configs.forEach(config => {
            initial[config.id] = config.defaultOpen || false;
        });
        return initial;
    });

    const expandAll = useCallback(() => {
        const newStates: Record<string, boolean> = {};
        configs.forEach(config => {
            newStates[config.id] = true;
        });
        setGroupStates(newStates);
    }, [configs]);

    const collapseAll = useCallback(() => {
        const newStates: Record<string, boolean> = {};
        configs.forEach(config => {
            newStates[config.id] = false;
        });
        setGroupStates(newStates);
    }, [configs]);

    const toggleAll = useCallback(() => {
        const allOpen = configs.every(config => groupStates[config.id]);
        const newStates: Record<string, boolean> = {};
        configs.forEach(config => {
            newStates[config.id] = !allOpen;
        });
        setGroupStates(newStates);
    }, [configs, groupStates]);

    const states = configs.map(config => ({
        id: config.id,
        isOpen: groupStates[config.id] || false,
        toggle: () => {
            setGroupStates(prev => ({
                ...prev,
                [config.id]: !prev[config.id],
            }));
        },
        setOpen: (open: boolean) => {
            setGroupStates(prev => ({
                ...prev,
                [config.id]: open,
            }));
        },
    }));

    return {
        states,
        expandAll,
        collapseAll,
        toggleAll,
        allOpen: configs.every(config => groupStates[config.id]),
        allClosed: configs.every(config => !groupStates[config.id]),
        openCount: configs.filter(config => groupStates[config.id]).length,
    };
}
