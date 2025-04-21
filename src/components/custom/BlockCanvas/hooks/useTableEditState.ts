import { useCallback, useEffect } from 'react';

import { OptimisticUpdate, useTableEditStore } from '@/store/tableEdit.store';

interface UseTableEditStateProps<
    T extends Record<string, unknown> & { id: string },
> {
    initialData?: T[];
    onSave?: (itemId: string, changes: Partial<T>) => Promise<void>;
    onDelete?: (itemId: string) => Promise<void>;
}

/**
 * Custom hook that provides a clean API for using the tableEdit store
 * in table components
 */
export function useTableEditState<
    T extends Record<string, unknown> & { id: string },
>({ initialData = [], onSave, onDelete }: UseTableEditStateProps<T> = {}) {
    const tableState = useTableEditStore();

    // Initialize data if provided
    useEffect(() => {
        if (initialData.length > 0) {
            tableState.setData(initialData);
        }
    }, [initialData, tableState]);

    // Detect and handle optimistic updates
    useEffect(() => {
        const processOptimisticUpdates = async () => {
            // Get the oldest optimistic update
            const update = tableState.optimisticUpdates[0];
            if (!update || !onSave) return;

            try {
                // Call the save handler
                await onSave(update.itemId, update.changes as Partial<T>);

                // Remove the update once saved
                tableState.removeOptimisticUpdate(update.id);
            } catch (error) {
                console.error('Failed to save changes:', error);
                // Here you could implement retry logic or show an error notification
            }
        };

        // Process updates if there are any
        if (tableState.optimisticUpdates.length > 0) {
            processOptimisticUpdates();
        }
    }, [tableState.optimisticUpdates, onSave, tableState]);

    // Helper for updating a cell value
    const updateCellValue = useCallback(
        <K extends keyof T>(itemId: string, field: K, value: T[K]) => {
            tableState.updateCell(
                itemId,
                field as string,
                value as unknown as string,
            );
        },
        [tableState],
    );

    // Helper for saving changes for an item
    const saveChanges = useCallback(
        (itemId: string) => {
            tableState.saveChanges(itemId);
        },
        [tableState],
    );

    // Helper for canceling edits for an item
    const cancelEdit = useCallback(
        (itemId: string) => {
            tableState.cancelEdit(itemId);
        },
        [tableState],
    );

    // Helper for deleting an item with optimistic UI
    const deleteItem = useCallback(
        async (itemId: string) => {
            if (!onDelete) return;

            // Create optimistic delete by filtering out the item
            const newData = tableState.data.filter(
                (item) => item.id !== itemId,
            );
            tableState.setData(newData);

            try {
                // Call the delete handler
                await onDelete(itemId);
            } catch (error) {
                console.error('Failed to delete item:', error);
                // Restore the data if delete fails
                const foundItem = initialData.find(
                    (item) => item.id === itemId,
                );
                const restoredData = foundItem
                    ? [...tableState.data, foundItem]
                    : tableState.data;
                tableState.setData(restoredData);
            }
        },
        [tableState, onDelete, initialData],
    );

    // Type-safe getter for editing values
    const getEditingValue = useCallback(
        <K extends keyof T>(itemId: string, field: K): T[K] | undefined => {
            const editingItem = tableState.editingData[itemId];
            if (!editingItem) return undefined;

            return editingItem[field as string] as T[K];
        },
        [tableState.editingData],
    );

    return {
        // State
        data: tableState.data as T[],
        pendingSaves: tableState.pendingSaves,
        optimisticUpdates: tableState.optimisticUpdates as OptimisticUpdate[],
        selectedCell: tableState.selectedCell,
        editingData: tableState.editingData as Record<string, Partial<T>>,
        hoveredCell: tableState.hoveredCell,
        isAddingNew: tableState.isAddingNew,
        sortConfig: tableState.sortConfig,

        // Data helpers
        getEditingValue,

        hasPendingEdits: (itemId: string): boolean => {
            return tableState.pendingSaves.has(itemId);
        },

        // Actions
        updateCellValue,
        saveChanges,
        cancelEdit,
        deleteItem,
        selectCell: tableState.selectCell,
        setHoveredCell: tableState.setHoveredCell,
        setSortConfig: tableState.setSortConfig,
        setIsAddingNew: tableState.setIsAddingNew,
    };
}
