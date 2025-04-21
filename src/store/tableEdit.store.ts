import { create } from 'zustand';

import { CellValue } from '@/components/custom/BlockCanvas/components/EditableTable/types';

// Generic type for table data
export interface TableEditState<
    T extends Record<string, unknown> = Record<string, unknown>,
> {
    // Core data
    data: T[];

    // Edit tracking
    pendingSaves: Set<string>;
    optimisticUpdates: OptimisticUpdate[];
    selectedCell: { rowIndex: number; columnId: string } | null;
    editingData: Record<string, Partial<T>>;

    // UI states
    hoveredCell: { rowIndex: number; columnId: string } | null;
    isAddingNew: boolean;

    // Sorting
    sortConfig: {
        key: string | null;
        direction: 'asc' | 'desc';
    };

    // Actions
    setData: (data: T[]) => void;
    updateCell: <K extends keyof T>(
        itemId: string,
        accessor: K,
        value: T[K],
    ) => void;
    saveChanges: (itemId: string) => void;
    cancelEdit: (itemId: string) => void;
    selectCell: (cell: { rowIndex: number; columnId: string } | null) => void;
    setHoveredCell: (
        cell: { rowIndex: number; columnId: string } | null,
    ) => void;
    setIsAddingNew: (isAdding: boolean) => void;
    setSortConfig: (key: string | null, direction: 'asc' | 'desc') => void;
    markAsSaved: (itemId: string) => void;
    addOptimisticUpdate: (update: OptimisticUpdate) => void;
    removeOptimisticUpdate: (id: string) => void;
}

export interface OptimisticUpdate {
    id: string;
    itemId: string;
    timestamp: number;
    changes: Record<string, CellValue>;
}

export const createTableEditStore = <
    T extends Record<string, unknown> & { id: string },
>() =>
    create<TableEditState<T>>()((set, get) => ({
        // Initial state
        data: [],
        pendingSaves: new Set<string>(),
        optimisticUpdates: [],
        selectedCell: null,
        editingData: {},
        hoveredCell: null,
        isAddingNew: false,
        sortConfig: {
            key: null,
            direction: 'asc',
        },

        // Actions
        setData: (data) => set({ data }),

        updateCell: (itemId, accessor, value) => {
            const state = get();

            // Find the item in the data array
            const itemIndex = state.data.findIndex(
                (item) => item.id === itemId,
            );

            // Create updated data
            const newData = [...state.data];
            if (itemIndex !== -1) {
                newData[itemIndex] = {
                    ...newData[itemIndex],
                    [accessor]: value,
                };
            }

            // Create updated editing data
            const newEditingData = { ...state.editingData };
            if (!newEditingData[itemId]) {
                newEditingData[itemId] = {};
            }
            newEditingData[itemId] = {
                ...newEditingData[itemId],
                [accessor]: value,
            };

            // Create new pending saves
            const newPendingSaves = new Set(state.pendingSaves);
            newPendingSaves.add(itemId);

            set({
                data: newData,
                editingData: newEditingData,
                pendingSaves: newPendingSaves,
            });
        },

        saveChanges: (itemId) => {
            const state = get();
            const changes = state.editingData[itemId] || {};

            // Create new optimistic updates
            const updateId = Date.now().toString();
            const newOptimisticUpdates = [
                ...state.optimisticUpdates,
                {
                    id: updateId,
                    itemId,
                    timestamp: Date.now(),
                    changes: changes as Record<string, CellValue>,
                },
            ];

            // Create new editing data without this item
            const newEditingData = { ...state.editingData };
            delete newEditingData[itemId];

            // Create new pending saves without this item
            const newPendingSaves = new Set(state.pendingSaves);
            newPendingSaves.delete(itemId);

            set({
                optimisticUpdates: newOptimisticUpdates,
                editingData: newEditingData,
                pendingSaves: newPendingSaves,
            });
        },

        cancelEdit: (itemId) => {
            const state = get();

            // Create new editing data without this item
            const newEditingData = { ...state.editingData };
            delete newEditingData[itemId];

            // Create new pending saves without this item
            const newPendingSaves = new Set(state.pendingSaves);
            newPendingSaves.delete(itemId);

            set({
                editingData: newEditingData,
                pendingSaves: newPendingSaves,
            });
        },

        selectCell: (cell) => set({ selectedCell: cell }),

        setHoveredCell: (cell) => set({ hoveredCell: cell }),

        setIsAddingNew: (isAdding) => set({ isAddingNew: isAdding }),

        setSortConfig: (key, direction) =>
            set({
                sortConfig: {
                    key,
                    direction,
                },
            }),

        markAsSaved: (itemId) => {
            const state = get();
            const newPendingSaves = new Set(state.pendingSaves);
            newPendingSaves.delete(itemId);
            set({ pendingSaves: newPendingSaves });
        },

        addOptimisticUpdate: (update) => {
            const state = get();
            set({
                optimisticUpdates: [...state.optimisticUpdates, update],
            });
        },

        removeOptimisticUpdate: (id) => {
            const state = get();
            set({
                optimisticUpdates: state.optimisticUpdates.filter(
                    (update) => update.id !== id,
                ),
            });
        },
    }));

// Create a default instance for the most common use case
export const useTableEditStore = createTableEditStore();
