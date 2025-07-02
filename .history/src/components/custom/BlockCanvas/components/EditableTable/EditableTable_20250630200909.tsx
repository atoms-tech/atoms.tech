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
import { useClipboard } from '@/hooks/useClipboard';
// import {
//     SHORTCUT_CATEGORIES,
//     createShortcut,
//     useKeyboardShortcuts,
// } from '@/hooks/useKeyboardShortcuts';
import { useUser } from '@/lib/providers/user.provider';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { RequirementAiAnalysis } from '@/types/base/requirements.types';

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

    // Clipboard functionality
    const { copyTableData, pasteFromClipboard, _isCopied } = useClipboard({
        onCopy: () => console.log('Table data copied to clipboard'),
        onPaste: () => console.log('Data pasted from clipboard'),
        onError: (error) => console.error(`Clipboard error: ${error.message}`),
    });

    // Function to save pending changes
    const savePendingChanges = useCallback(async () => {
        if (!onSave || !editingData) return;

        try {
            // Get all modified items
            const modifiedItems = Object.entries(editingData).filter(
                ([id, item]) => {
                    // Skip new items as they're handled separately
                    if (id === 'new') return false;

                    // Find original item
                    const originalItem = data.find((d) => d.id === id);
                    if (!originalItem) return false;

                    // Check if any values have changed
                    return Object.keys(item).some(
                        (key) => item[key] !== originalItem[key],
                    );
                },
            );

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
                admin: ['editTable', 'deleteRow', 'addRow'],
                maintainer: ['editTable', 'deleteRow', 'addRow'],
                editor: ['editTable', 'deleteRow', 'addRow'],
                viewer: [],
            }) as Record<
                'owner' | 'admin' | 'maintainer' | 'editor' | 'viewer',
                string[]
            >,
        [],
    );

    const canPerformAction = useCallback(
        async (action: string) => {
            const getUserRole = async (): Promise<
                keyof typeof rolePermissions
            > => {
                try {
                    const { data, error } = await supabase
                        .from('project_members')
                        .select('role')
                        .eq('user_id', userId) // Use userId from useUser
                        .eq(
                            'project_id',
                            Array.isArray(projectId) ? projectId[0] : projectId,
                        ) // Ensure projectId is a string
                        .single();

                    if (error) {
                        console.error('Error fetching user role:', error);
                        return 'viewer'; // Default to 'viewer' if there's an error
                    }

                    return data?.role || 'viewer'; // Default to 'viewer' if role is undefined
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
    useEffect(() => {
        // If we're exiting edit mode and there are changes, save them
        if (!isEditMode) {
            console.log('Exiting edit mode, saving any pending changes...');
            savePendingChanges();
        }
    }, [isEditMode, savePendingChanges]);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            dispatch({ type: 'RESET_EDIT_STATE' });
        };
    }, []);

    // Handle keyboard navigation within table
    const handleTableKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!selectedCell || !sortedData.length || !isEditMode) return;

            const maxRow = sortedData.length - 1;
            const maxCol = columns.length - 1;
            let newRow = selectedCell.row;
            let newCol = selectedCell.col;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    newRow = Math.max(0, selectedCell.row - 1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    newRow = Math.min(maxRow, selectedCell.row + 1);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    newCol = Math.max(0, selectedCell.col - 1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    newCol = Math.min(maxCol, selectedCell.col + 1);
                    break;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    handleDeleteCell();
                    return;
                default:
                    return;
            }

            dispatch({
                type: 'SET_SELECTED_CELL',
                payload: { row: newRow, col: newCol },
            });
        },
        [selectedCell, sortedData.length, columns.length, isEditMode, handleDeleteCell],
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

    // Remove the global keyboard event listener since we'll handle it locally

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

    // Copy selected cell or entire table
    const handleCopy = useCallback(
        async (e?: React.KeyboardEvent) => {
            if (!isEditMode) return;

            try {
                if (
                    selectedCell &&
                    selectedCell.row < sortedData.length &&
                    selectedCell.col < columns.length
                ) {
                    // Copy selected cell
                    const item = sortedData[selectedCell.row];
                    const column = columns[selectedCell.col];
                    const cellValue = String(item[column.accessor] || '');
                    await copyTableData([[cellValue]], [column.header]);
                    console.log('Copied cell:', cellValue);
                } else {
                    // Copy entire table
                    const headers = columns.map((col) => col.header);
                    const tableData = sortedData.map((item) =>
                        columns.map((col) => String(item[col.accessor] || '')),
                    );
                    await copyTableData(tableData, headers);
                    console.log('Copied entire table');
                }
                if (e) e.preventDefault();
            } catch (error) {
                console.error('Copy failed:', error);
            }
        },
        [isEditMode, selectedCell, sortedData, columns, copyTableData],
    );

    // Paste data into selected cell
    const handlePaste = useCallback(
        async (e?: React.KeyboardEvent) => {
            if (!isEditMode || !selectedCell) return;

            try {
                const data = await pasteFromClipboard();
                if (
                    data?.text &&
                    selectedCell.row < sortedData.length &&
                    selectedCell.col < columns.length
                ) {
                    const item = sortedData[selectedCell.row];
                    const column = columns[selectedCell.col];

                    if (item && column) {
                        handleCellChange(
                            item.id as string,
                            column.accessor as string,
                            data.text,
                        );
                        console.log('Pasted:', data.text);
                    }
                }
                if (e) e.preventDefault();
            } catch (error) {
                console.error('Paste failed:', error);
            }
        },
        [
            isEditMode,
            selectedCell,
            sortedData,
            columns,
            pasteFromClipboard,
            handleCellChange,
        ],
    );

    // Delete selected cell content
    const handleDeleteCell = useCallback(() => {
        if (!isEditMode || !selectedCell) return;

        if (
            selectedCell.row < sortedData.length &&
            selectedCell.col < columns.length
        ) {
            const item = sortedData[selectedCell.row];
            const column = columns[selectedCell.col];

            if (item && column) {
                handleCellChange(
                    item.id as string,
                    column.accessor as string,
                    '',
                );
                console.log('Deleted cell content');
            }
        }
    }, [isEditMode, selectedCell, sortedData, columns, handleCellChange]);

    // Handle keyboard shortcuts within table context
    const handleTableShortcuts = useCallback(
        (e: React.KeyboardEvent) => {
            if (!isEditMode) return;

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

            if (cmdOrCtrl && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                handleCopy(e);
            } else if (cmdOrCtrl && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                handlePaste(e);
            }
        },
        [isEditMode, handleCopy, handlePaste],
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
                    acc[col.accessor as keyof T] = '' as T[keyof T];
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

        dispatch({
            type: 'SET_INITIAL_EDIT_DATA',
            payload: { ...editingData, new: newItem },
        });
        dispatch({ type: 'START_ADD_ROW' });
    }, [canPerformAction, columns, editingData]);

    const handleSaveNewRow = useCallback(async () => {
        const newItem = editingData['new'];
        if (!newItem || !onSave) return;

        try {
            // Remove the temporary id before saving
            const { id: _tempId, ...itemWithoutId } = newItem;
            await onSave(itemWithoutId as T, true);

            // Call onPostSave after successfully saving to refresh data
            if (onPostSave) {
                await onPostSave();
            }

            // Clear editing state after successful save
            dispatch({ type: 'CANCEL_ADD_ROW' });
        } catch (error) {
            console.error('Failed to save new row:', error);
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
                onKeyDown={handleTableKeyDown}
                onKeyUp={handleTableShortcuts}
                tabIndex={isEditMode ? 0 : -1}
                role={isEditMode ? 'grid' : undefined}
                aria-label={isEditMode ? 'Editable data table' : undefined}
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
                            {!isAddingNew &&
                                (isEditMode || alwaysShowAddRow) && (
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
