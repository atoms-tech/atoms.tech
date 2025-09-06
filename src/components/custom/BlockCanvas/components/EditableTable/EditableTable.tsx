'use client';

// EditableTable Component
// Features:
// - Editable table for Requirements and other data
// - Auto-save on blur (when clicking outside the table)
// - Auto-save when exiting edit mode
// - Keyboard navigation for cells
// - Role-based permissions
// - Sort, filter, and add/delete rows
import { useParams } from 'next/navigation';
import * as React from 'react';
import { useCallback, useEffect, useReducer, useState } from 'react';

import { Table, TableBody } from '@/components/ui/table';
import { useUser } from '@/lib/providers/user.provider';
// No direct data access here; logic delegated to hooks and props
import { RequirementAiAnalysis } from '@/types/base/requirements.types';
import { atomsApiClient } from '@/lib/atoms-api';

import {
    AddRowPlaceholder,
    DataTableRow,
    DeleteConfirmDialog,
    NewRowForm,
    TableControls,
    TableHeader,
    TableLoadingSkeleton,
} from './components';
import { useTableSort } from './hooks/useTableSort';
import { TableState, tableReducer } from './reducers/tableReducer';
import { CellValue, EditableTableProps } from './types';

export function EditableTable<
    T extends Record<string, CellValue> & {
        id: string;
        ai_analysis: RequirementAiAnalysis;
    },
>({
    data,
    columns,
    onSave,
    onDelete,
    onPostSave,
    isLoading = false,
    _emptyMessage = 'No items found.',
    showFilter = true,
    filterComponent,
    isEditMode = false,
    alwaysShowAddRow = false,
}: EditableTableProps<T>) {
    // Initialize the state with useReducer
    const initialState: TableState<T> = {
        editingData: {},
        isAddingNew: false,
        sortKey: null,
        sortOrder: 'asc',
        hoveredCell: null,
        itemToDelete: null,
        deleteConfirmOpen: false,
        editingTimeouts: {},
        selectedCell: null,
    };

    const [state, dispatch] = useReducer(tableReducer, initialState);
    const {
        editingData,
        isAddingNew,
        sortKey,
        sortOrder,
        hoveredCell: _hoveredCell,
        itemToDelete,
        deleteConfirmOpen,
        selectedCell,
    } = state;

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [isHoveringTable, setIsHoveringTable] = useState(false);
    /* eslint-enable @typescript-eslint/no-unused-vars */

    // Use the extracted custom hooks
    const { sortedData, handleSort } = useTableSort(data, sortKey);
    const { user } = useUser();
    const userId = user?.id || ''; // Ensure userId is extracted correctly
    const params = useParams();
    const projectId = params?.projectId || ''; // Ensure projectId is extracted correctly

    // Create a ref to track the table wrapper
    const tableRef = React.useRef<HTMLDivElement>(null);

    // Function to save pending changes
    const savePendingChanges = useCallback(async () => {
        if (!onSave || !editingData) return;

        try {
            // Get all modified items
            const modifiedItems = Object.entries(editingData).filter(([id, item]) => {
                // Skip new items as they're handled separately
                if (id === 'new') return false;

                // Find original item
                const originalItem = data.find((d) => d.id === id);
                if (!originalItem) return false;

                // Check if any values have changed
                return Object.keys(item).some((key) => item[key] !== originalItem[key]);
            });

            // Only proceed if there are actually modified items
            if (modifiedItems.length === 0) return;

            console.log(`Saving ${modifiedItems.length} modified items...`);

            // Save all modified items
            for (const [_id, item] of modifiedItems) {
                try {
                    await onSave(item, false);
                    console.log('Saved changes for item:', _id);
                } catch (error) {
                    console.error(`Failed to save item ${_id}:`, error);
                    // Continue with other items even if one fails
                }
            }

            // Call onPostSave after successfully saving all items to refresh data
            if (onPostSave) {
                await onPostSave();
            }
        } catch (error) {
            console.error('Error in savePendingChanges:', error);
        }
    }, [editingData, onSave, data, onPostSave]);

    // Handle blur events on the table wrapper
    // This is triggered when focus moves outside the table
    const handleTableBlur = useCallback(
        (e: React.FocusEvent<HTMLDivElement>) => {
            // Check if focus is moving outside the table
            if (
                isEditMode &&
                tableRef.current &&
                !tableRef.current.contains(e.relatedTarget as Node)
            ) {
                console.log('Focus leaving table, auto-saving changes...');
                savePendingChanges();
            }
        },
        [isEditMode, savePendingChanges],
    );

    if (!projectId) {
        console.error('Project ID is missing from the URL.');
    }

    if (!userId) {
        console.error('User ID is missing from the user context.');
    }

    // Define rolePermissions with useMemo
    const rolePermissions = React.useMemo(
        () =>
            ({
                owner: ['editTable', 'deleteRow', 'addRow'],
                editor: ['editTable', 'deleteRow', 'addRow'],
                viewer: [],
            }) as Record<'owner' | 'editor' | 'viewer', string[]>,
        [],
    );

    const canPerformAction = useCallback(
        async (action: string) => {
            const getUserRole = async (): Promise<keyof typeof rolePermissions> => {
                try {
                    const api = atomsApiClient();
                    const members = await api.projects.listMembers(Array.isArray(projectId) ? (projectId as any)[0] : (projectId as any));
                    const me = members.find((m: any) => m.user_id === userId || m.id === userId);
                    return ((me as any)?.role || 'viewer') as keyof typeof rolePermissions;
                } catch (err) {
                    console.error('Unexpected error fetching user role:', err);
                    return 'viewer';
                }
            };

            const userRole = await getUserRole();
            console.log('User role:', userRole);
            return rolePermissions[userRole].includes(action);
        },
        [userId, projectId, rolePermissions], // Updated dependencies
    );

    // Effect to init edit data when entering edit mode
    useEffect(() => {
        if (isEditMode && data.length > 0) {
            const initialEditData = data.reduce(
                (acc, item) => {
                    if (item.id) {
                        acc[item.id as string] = { ...item };
                    }
                    return acc;
                },
                {} as Record<string, T>,
            );
            dispatch({
                type: 'SET_INITIAL_EDIT_DATA',
                payload: initialEditData,
            });
        } else if (!isEditMode) {
            dispatch({ type: 'RESET_EDIT_STATE' });
        }
    }, [isEditMode, data]);

    // Effect to save all changes when exiting edit mode
    // This serves as a fallback to the blur handler
    // Note: Disabled automatic save on edit mode exit to prevent race conditions with new row creation
    // New rows are handled by their own save mechanism, and existing row changes are auto-saved on blur
    // useEffect(() => {
    //     // If we're exiting edit mode and there are changes, save them
    //     if (!isEditMode) {
    //         console.log('Exiting edit mode, saving any pending changes...');
    //         savePendingChanges();
    //     }
    // }, [isEditMode, savePendingChanges]);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            dispatch({ type: 'RESET_EDIT_STATE' });
        };
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!selectedCell || !sortedData.length || !isEditMode) return;

            const maxRow = sortedData.length - 1;
            const maxCol = columns.length - 1;
            let newRow = selectedCell.row;
            let newCol = selectedCell.col;

            switch (e.key) {
                case 'ArrowUp':
                    newRow = Math.max(0, selectedCell.row - 1);
                    break;
                case 'ArrowDown':
                    newRow = Math.min(maxRow, selectedCell.row + 1);
                    break;
                case 'ArrowLeft':
                    newCol = Math.max(0, selectedCell.col - 1);
                    break;
                case 'ArrowRight':
                    newCol = Math.min(maxCol, selectedCell.col + 1);
                    break;
                default:
                    return;
            }

            e.preventDefault();
            dispatch({
                type: 'SET_SELECTED_CELL',
                payload: { row: newRow, col: newCol },
            });
        },
        [selectedCell, sortedData.length, columns.length, isEditMode],
    );

    // Reset selected cell when exiting edit mode
    useEffect(() => {
        if (!isEditMode) {
            dispatch({
                type: 'SET_SELECTED_CELL',
                payload: null,
            });
        }
    }, [isEditMode]);

    // Add keyboard event listener
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // Handle cell change
    const handleCellChange = useCallback(
        async (rowId: string, columnId: string, newValue: CellValue) => {
            if (!isEditMode) return;

            const item = editingData[rowId] || data.find((d) => d.id === rowId);
            if (!item) return;

            // Update the item in the state
            dispatch({
                type: 'UPDATE_EDITING_DATA',
                payload: {
                    rowId,
                    columnId,
                    value: newValue,
                },
            });
        },
        [isEditMode, editingData, data],
    );

    // Add a type adapter for onCellChange
    const typeSafeHandleCellChange = useCallback(
        (itemId: string, accessor: keyof T, value: CellValue) => {
            handleCellChange(itemId, accessor as string, value);
        },
        [handleCellChange],
    );

    // Action handlers
    const handleAddNewRow = useCallback(async () => {
        const canAdd = await canPerformAction('addRow');
        if (!canAdd) {
            return;
        }

        // Create empty row
        const newItem = columns.reduce((acc, col) => {
            switch (col.type) {
                case 'select':
                    acc[col.accessor as keyof T] = null as T[keyof T];
                    break;
                case 'multi_select':
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

        dispatch({
            type: 'SET_INITIAL_EDIT_DATA',
            payload: { ...editingData, new: newItem },
        });
        dispatch({ type: 'START_ADD_ROW' });
    }, [canPerformAction, columns, editingData]);

    const handleSaveNewRow = useCallback(async () => {
        console.log('🎯 STEP 2: handleSaveNewRow called in EditableTable');
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
            dispatch({ type: 'CANCEL_ADD_ROW' });
            console.log(
                '✅ STEP 3d: Editing state cleared, new row form should disappear',
            );
        } catch (error) {
            console.error('❌ STEP 3: Failed to save new row:', error);
            // Don't clear the editing state on error - keep the row visible for user to retry
            // TODO: Add user-visible error message/toast
        }
    }, [editingData, onSave, onPostSave]);

    const handleCancelNewRow = useCallback(() => {
        dispatch({ type: 'CANCEL_ADD_ROW' });
    }, []);

    const handleDeleteClick = useCallback(
        async (item: T) => {
            const canDelete = await canPerformAction('deleteRow');
            if (!canDelete) {
                return;
            }

            dispatch({ type: 'OPEN_DELETE_CONFIRM', payload: item });
        },
        [canPerformAction], // Updated dependency
    );

    const handleDeleteConfirm = useCallback(async () => {
        if (!itemToDelete || !onDelete) return;

        try {
            await onDelete(itemToDelete);
            dispatch({ type: 'CLOSE_DELETE_CONFIRM' });
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    }, [itemToDelete, onDelete]);

    const handleHoverCell = useCallback((row: number, col: number) => {
        dispatch({
            type: 'SET_HOVERED_CELL',
            payload: { row, col },
        });
    }, []);

    // Render table with smaller components
    if (isLoading) {
        return <TableLoadingSkeleton columns={columns.length} />;
    }

    return (
        <div className="w-full">
            {showFilter && (
                <TableControls
                    filterComponent={filterComponent}
                    showFilter={showFilter}
                    onNewRow={handleAddNewRow}
                    onEnterEditMode={() => {
                        /* No-op - edit mode is controlled elsewhere */
                    }}
                    isVisible={true}
                    orgId=""
                    projectId=""
                    documentId=""
                />
            )}
            <div
                className="relative w-full overflow-x-auto brutalist-scrollbar"
                style={{ maxWidth: '100%' }}
                ref={tableRef}
                onBlur={handleTableBlur}
                tabIndex={-1}
            >
                <div
                    style={{
                        minWidth: '100%',
                        maxWidth: '1000px',
                        width: 'max-content',
                    }}
                >
                    <Table className="[&_tr:last-child_td]:border-b-2 [&_tr]:border-b [&_td]:py-1 [&_th]:py-1 [&_td]:border-r [&_td:last-child]:border-r-0 [&_th]:border-r [&_th:last-child]:border-r-0">
                        <TableHeader
                            columns={columns}
                            sortKey={sortKey}
                            sortOrder={sortOrder}
                            onSort={handleSort}
                            isEditMode={isEditMode}
                        />
                        <TableBody>
                            {/* Existing rows */}
                            {sortedData.map((item, rowIndex) => (
                                <DataTableRow
                                    key={item.id}
                                    item={item}
                                    columns={columns}
                                    isEditing={isEditMode && !isAddingNew}
                                    editingData={editingData}
                                    onCellChange={typeSafeHandleCellChange}
                                    onDelete={handleDeleteClick}
                                    onHoverCell={handleHoverCell}
                                    rowIndex={rowIndex}
                                    selectedCell={selectedCell}
                                    onCellSelect={(row, col) =>
                                        dispatch({
                                            type: 'SET_SELECTED_CELL',
                                            payload: { row, col },
                                        })
                                    }
                                />
                            ))}

                            {/* New row being added */}
                            {isAddingNew && (
                                <NewRowForm
                                    columns={columns}
                                    editingData={editingData}
                                    onCellChange={typeSafeHandleCellChange}
                                    onSave={handleSaveNewRow}
                                    onCancel={handleCancelNewRow}
                                />
                            )}

                            {/* Add new row placeholder */}
                            {!isAddingNew && (isEditMode || alwaysShowAddRow) && (
                                <AddRowPlaceholder
                                    columns={columns}
                                    onClick={handleAddNewRow}
                                    isEditMode={isEditMode}
                                />
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            {/* Delete confirmation */}
            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={(open) =>
                    !open && dispatch({ type: 'CLOSE_DELETE_CONFIRM' })
                }
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}
// No direct Supabase import; using atoms-api for role checks
