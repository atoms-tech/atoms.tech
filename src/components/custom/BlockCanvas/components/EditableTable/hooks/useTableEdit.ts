import { useCallback, useEffect, useRef, useState } from 'react';

import {
    CellValue,
    EditableColumn,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';

export function useTableEdit<T extends Record<string, CellValue> & { id: string }>(
    data: T[],
    columns: EditableColumn<T>[],
    onSave?: (item: T, isNew: boolean) => Promise<void>,
    onDelete?: (item: T) => Promise<void>,
    onPostSave?: () => Promise<void>,
    isEditMode: boolean = false,
) {
    const [editingData, setEditingData] = useState<Record<string, T>>({});
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<T | null>(null);
    const [editingTimeouts, setEditingTimeouts] = useState<
        Record<string, NodeJS.Timeout>
    >({});
    const [localIsEditMode, setLocalIsEditMode] = useState(isEditMode);
    const previousDataRef = useRef<T[]>([]);

    // Update local edit mode when prop changes
    useEffect(() => {
        setLocalIsEditMode(isEditMode);
    }, [isEditMode]);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            Object.values(editingTimeouts).forEach((timeout) => clearTimeout(timeout));
        };
    }, [editingTimeouts]);

    // Update editing data when data changes or edit mode is toggled
    useEffect(() => {
        // Check if data has changed by comparing the IDs
        const dataIds = data
            .map((item) => item.id)
            .sort()
            .join(',');
        const prevDataIds = previousDataRef.current
            .map((item) => item.id)
            .sort()
            .join(',');
        const hasDataChanged = dataIds !== prevDataIds;

        // Check if properties have changed by comparing the keys in the first item
        const hasPropertiesChanged =
            data.length > 0 &&
            previousDataRef.current.length > 0 &&
            JSON.stringify(Object.keys(data[0]).sort()) !==
                JSON.stringify(Object.keys(previousDataRef.current[0]).sort());

        // Skip if data hasn't changed, properties haven't changed, and we're not toggling edit mode
        if (
            !hasDataChanged &&
            !hasPropertiesChanged &&
            Object.keys(editingData).length > 0 === localIsEditMode
        ) {
            return;
        }

        previousDataRef.current = data;

        if (localIsEditMode && data.length > 0) {
            const initialEditData = data.reduce(
                (acc, item) => {
                    if (item.id) {
                        acc[item.id as string] = { ...item };
                    }
                    return acc;
                },
                {} as Record<string, T>,
            );
            setEditingData(initialEditData);
        } else if (!localIsEditMode) {
            setEditingData({});
            setIsAddingNew(false);
            Object.values(editingTimeouts).forEach((timeout) => clearTimeout(timeout));
            setEditingTimeouts({});
        }
    }, [localIsEditMode, data, editingData, editingTimeouts]);

    const handleCellChange = useCallback(
        (itemId: string, accessor: keyof T, value: CellValue) => {
            // Update local state immediately
            setEditingData((prev) => ({
                ...prev,
                [itemId]: {
                    ...prev[itemId],
                    [accessor]: value,
                },
            }));

            // Don't auto-save if this is a new row
            if (itemId === 'new' || !onSave) return;

            // Clear existing timeout for this item if it exists
            if (editingTimeouts[itemId]) {
                clearTimeout(editingTimeouts[itemId]);
            }

            // Set new timeout for debounced save
            const timeoutId = setTimeout(async () => {
                try {
                    const editedItem = {
                        ...editingData[itemId],
                        [accessor]: value,
                    };

                    await onSave(editedItem, false);

                    // Clear the timeout from state after successful save
                    setEditingTimeouts((prev) => {
                        const { [itemId]: _removedTimeout, ...rest } = prev;
                        return rest;
                    });
                } catch (error) {
                    console.error('Failed to save:', error);
                }
            }, 500); // 500ms debounce

            // Store the new timeout
            setEditingTimeouts((prev) => ({
                ...prev,
                [itemId]: timeoutId,
            }));
        },
        [editingData, editingTimeouts, onSave],
    );

    const handleAddRow = useCallback(async () => {
        const newItem = columns.reduce((acc, col) => {
            switch (col.type) {
                case 'select':
                    // Initialize select fields with null instead of empty string
                    acc[col.accessor as keyof T] = null as T[keyof T];
                    break;
                case 'multi_select':
                    // Initialize multi-select fields with empty array
                    acc[col.accessor as keyof T] = [] as unknown as T[keyof T];
                    break;
                case 'text':
                    // For external_id field, generate a REQ-ID instead of empty string
                    if (String(col.accessor).toLowerCase() === 'external_id') {
                        acc[col.accessor as keyof T] = 'GENERATING...' as T[keyof T];
                    } else {
                        acc[col.accessor as keyof T] = '' as T[keyof T];
                    }
                    break;
                case 'number':
                    acc[col.accessor as keyof T] = null as T[keyof T];
                    break;
                case 'date':
                    acc[col.accessor as keyof T] = null as T[keyof T];
                    break;
                default:
                    acc[col.accessor as keyof T] = null as T[keyof T];
            }
            return acc;
        }, {} as T);

        newItem.id = 'new';

        // Generate REQ-ID for external_id field if it exists
        const externalIdColumn = columns.find(
            (col) => String(col.accessor).toLowerCase() === 'external_id',
        );

        if (externalIdColumn) {
            try {
                // Import the generator function dynamically to avoid circular dependencies
                const { generateNextRequirementId } = await import(
                    '@/lib/utils/requirementIdGenerator'
                );
                const { supabase } = await import('@/lib/supabase/supabaseBrowser');

                // Get organization ID from the current document
                const urlParts = window.location.pathname.split('/');
                const orgIndex = urlParts.indexOf('org');
                const docIndex = urlParts.indexOf('documents');

                if (
                    orgIndex !== -1 &&
                    docIndex !== -1 &&
                    urlParts[orgIndex + 1] &&
                    urlParts[docIndex + 1]
                ) {
                    const documentId = urlParts[docIndex + 1];

                    // Get organization ID from document
                    const { data: document } = await supabase
                        .from('documents')
                        .select(
                            `
                            project_id,
                            projects!inner(organization_id)
                        `,
                        )
                        .eq('id', documentId)
                        .single();

                    const organizationId = (
                        document as { projects?: { organization_id?: string } }
                    )?.projects?.organization_id;

                    if (organizationId) {
                        const reqId = await generateNextRequirementId(organizationId);
                        newItem[externalIdColumn.accessor as keyof T] =
                            reqId as T[keyof T];
                    }
                }
            } catch (error) {
                console.error('Failed to generate REQ-ID:', error);
                // Fall back to empty string if generation fails
                newItem[externalIdColumn.accessor as keyof T] = '' as T[keyof T];
            }
        }

        setEditingData((prev) => ({
            ...prev,
            new: newItem,
        }));
        setIsAddingNew(true);
    }, [columns]);

    const handleSaveRow = useCallback(async () => {
        console.log('🎯 STEP 2: handleSaveRow called in useTableEdit');
        const newItem = editingData['new'];
        if (!newItem || !onSave) {
            console.log('❌ STEP 2: No newItem or onSave, returning early');
            return;
        }

        try {
            // Remove the temporary id before saving
            const { id: _tempId, ...itemWithoutId } = newItem;
            console.log(
                '🎯 STEP 3a: Removed temporary ID, preparing to save:',
                itemWithoutId,
            );

            console.log('🎯 STEP 3b: Calling parent onSave (handleSaveRequirement)');
            await onSave(itemWithoutId as T, true);
            console.log('✅ STEP 3b: Parent onSave completed successfully');

            // Call onPostSave after successfully saving to refresh data
            if (onPostSave) {
                console.log('🎯 STEP 3c: Calling onPostSave (refreshRequirements)');
                await onPostSave();
                console.log('✅ STEP 3c: onPostSave completed successfully');
            } else {
                console.log('⚠️ STEP 3c: No onPostSave provided, skipping refresh');
            }

            // Clear editing state only after successful save
            console.log('🎯 STEP 3d: Clearing editing state');
            setIsAddingNew(false);
            setEditingData((prev) => {
                const { new: _newItem, ...rest } = prev;
                return rest;
            });

            // Reset local edit mode to match global edit mode
            setLocalIsEditMode(false);
            console.log(
                '✅ STEP 3d: Editing state cleared, new row form should disappear',
            );
        } catch (error) {
            console.error('❌ STEP 3: Failed to save new row:', error);
            // Don't clear the editing state on error - keep the row visible for user to retry
            // TODO: Add user-visible error message/toast
        }
    }, [editingData, onSave, onPostSave]);

    const handleCancelEdit = useCallback(() => {
        setIsAddingNew(false);
        setEditingData((prev) => {
            const { new: _newItem, ...rest } = prev;
            return rest;
        });
    }, []);

    const handleDeleteClick = useCallback((item: T) => {
        setItemToDelete(item);
        setDeleteConfirmOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!itemToDelete || !onDelete) return;

        try {
            await onDelete(itemToDelete);
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    }, [itemToDelete, onDelete]);

    return {
        editingData,
        isAddingNew,
        deleteConfirmOpen,
        itemToDelete,
        localIsEditMode,
        handleCellChange,
        handleAddRow,
        handleSaveRow,
        handleCancelEdit,
        handleDeleteClick,
        handleDeleteConfirm,
        setDeleteConfirmOpen,
        setLocalIsEditMode,
    };
}
