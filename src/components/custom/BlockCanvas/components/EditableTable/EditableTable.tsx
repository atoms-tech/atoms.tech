'use client';

import * as React from 'react';
import { useCallback, useEffect, useReducer, useState } from 'react';

import { Table, TableBody } from '@/components/ui/table';
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
    isLoading = false,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    emptyMessage = 'No items found.',
    /* eslint-enable @typescript-eslint/no-unused-vars */
    showFilter = true,
    filterComponent,
    isEditMode = false,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    alwaysShowAddRow = false,
    /* eslint-enable @typescript-eslint/no-unused-vars */
}: EditableTableProps<T>) {
    // Initialize the state with useReducer
    const initialState: TableState<T> = {
        localIsEditMode: isEditMode,
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
        localIsEditMode,
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

    // Effect to init edit data when entering edit mode
    useEffect(() => {
        if (isEditMode !== localIsEditMode) {
            dispatch({ type: 'SET_EDIT_MODE', payload: isEditMode });

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
        }
    }, [isEditMode, localIsEditMode, data]);

    // Effect to save all changes when exiting edit mode
    useEffect(() => {
        const saveChanges = async () => {
            if (!onSave || !editingData) return;

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

            // Save all modified items
            for (const [_id, item] of modifiedItems) {
                try {
                    await onSave(item, false);
                } catch (error) {
                    console.error('Failed to save:', error);
                }
            }
        };

        // If we're exiting edit mode and there are changes, save them
        if (!isEditMode && localIsEditMode) {
            saveChanges();
        }
    }, [isEditMode, localIsEditMode, editingData, onSave, data]);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            dispatch({ type: 'RESET_EDIT_STATE' });
        };
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!selectedCell || !sortedData.length || !localIsEditMode) return;

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
        [selectedCell, sortedData.length, columns.length, localIsEditMode],
    );

    // Reset selected cell when exiting edit mode
    useEffect(() => {
        if (!localIsEditMode) {
            dispatch({
                type: 'SET_SELECTED_CELL',
                payload: null,
            });
        }
    }, [localIsEditMode]);

    // Add keyboard event listener
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Handle clicking outside the table
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!selectedCell) return;

            // Check if the click is inside the table
            const tableElement = document.querySelector(
                '[data-table-container]',
            );
            if (tableElement && !tableElement.contains(e.target as Node)) {
                dispatch({
                    type: 'SET_SELECTED_CELL',
                    payload: null,
                });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedCell]);

    // Action handlers
    const handleCellChange = useCallback(
        (itemId: string, accessor: keyof T, value: CellValue) => {
            dispatch({
                type: 'SET_CELL_VALUE',
                payload: { itemId, accessor, value },
            });
        },
        [],
    );

    const handleAddNewRow = useCallback(() => {
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
    }, [columns, editingData]);

    const handleSaveNewRow = useCallback(async () => {
        const newItem = editingData['new'];
        if (!newItem || !onSave) return;

        try {
            // Remove the temporary id before saving
            const { id: _tempId, ...itemWithoutId } = newItem;
            await onSave(itemWithoutId as T, true);

            // Clear editing state after successful save
            dispatch({ type: 'CANCEL_ADD_ROW' });
        } catch (error) {
            console.error('Failed to save new row:', error);
        }
    }, [editingData, onSave]);

    const handleCancelNewRow = useCallback(() => {
        dispatch({ type: 'CANCEL_ADD_ROW' });
    }, []);

    const handleDeleteClick = useCallback((item: T) => {
        dispatch({ type: 'OPEN_DELETE_CONFIRM', payload: item });
    }, []);

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
                    sortKey={sortKey}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    columns={columns}
                    showFilter={showFilter}
                    onNewRow={handleAddNewRow}
                    onEnterEditMode={() =>
                        dispatch({ type: 'SET_EDIT_MODE', payload: true })
                    }
                    isVisible={true}
                    orgId=""
                />
            )}
            <div
                className="relative w-full overflow-x-auto brutalist-scrollbar"
                style={{ maxWidth: '100%' }}
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
                            isEditMode={localIsEditMode}
                        />
                        <TableBody>
                            {/* Existing rows */}
                            {sortedData.map((item, rowIndex) => (
                                <DataTableRow
                                    key={item.id}
                                    item={item}
                                    columns={columns}
                                    isEditing={localIsEditMode && !isAddingNew}
                                    editingData={editingData}
                                    onCellChange={handleCellChange}
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
                                    onCellChange={handleCellChange}
                                    onSave={handleSaveNewRow}
                                    onCancel={handleCancelNewRow}
                                />
                            )}

                            {/* Add new row placeholder */}
                            {!isAddingNew && (
                                <AddRowPlaceholder
                                    columns={columns}
                                    onClick={handleAddNewRow}
                                    isEditMode={localIsEditMode}
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
