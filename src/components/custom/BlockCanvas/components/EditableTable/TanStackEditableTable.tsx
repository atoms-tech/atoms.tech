'use client';

/**
 * TanStackEditableTable Component
 *
 * A replacement for the original EditableTable that uses TanStack Table (react-table v8)
 * This component preserves the same API surface while using modern table state management
 */
import {
    ColumnDef,
    SortingState,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    AddRowPlaceholder,
    DeleteConfirmDialog,
    NewRowForm,
    TableControls,
    TableHeader,
    TableLoadingSkeleton,
    TanStackDataTableRow,
} from '@/components/custom/BlockCanvas/components/EditableTable/components';
import { Table, TableBody } from '@/components/ui/table';
import { useUser } from '@/lib/providers/user.provider';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { RequirementAiAnalysis } from '@/types/base/requirements.types';

import { TanStackCellRenderer } from './TanStackCellRenderer';
import { CellValue, EditableTableProps } from './types';

// Add these types near the top of the file
type OptimisticUpdate = {
    itemId: string;
    field: string;
    oldValue: CellValue;
    newValue: CellValue;
};

/**
 * TanStackEditableTable component
 *
 * This is a TanStack Table implementation of the EditableTable
 * that preserves the same API surface while using modern table state management
 */
export function TanStackEditableTable<
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
    // Table permissions
    const { user } = useUser();
    const userId = user?.id || '';
    const params = useParams();
    const projectId = params?.projectId || '';

    // Create a ref to track the table wrapper
    const tableRef = React.useRef<HTMLDivElement>(null);

    // Local state for optimistic updates
    const [localData, setLocalData] = useState<T[]>([]);
    const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set());

    // Track optimistic updates for potential rollback
    const [optimisticUpdates, setOptimisticUpdates] = useState<
        OptimisticUpdate[]
    >([]);

    // Enhanced error handling for failed saves
    const handleSaveError = useCallback(
        (error: Error, failedUpdates: OptimisticUpdate[]) => {
            console.error('Save failed:', error);

            // Rollback the failed updates in localData
            setLocalData((prevData) => {
                const newData = [...prevData];
                failedUpdates.forEach((update) => {
                    const item = newData.find(
                        (item) => item.id === update.itemId,
                    );
                    if (item) {
                        (item as Record<string, CellValue>)[update.field] =
                            update.oldValue;
                    }
                });
                return newData;
            });

            // Clear the failed updates
            setOptimisticUpdates((prev) =>
                prev.filter((update) => !failedUpdates.includes(update)),
            );

            // Remove from pending saves
            setPendingSaves((prev) => {
                const next = new Set(prev);
                failedUpdates.forEach((update) => next.delete(update.itemId));
                return next;
            });
        },
        [],
    );

    // Initialize local data when actual data changes
    useEffect(() => {
        if (data) {
            setLocalData(data);
        }
    }, [data]);

    // TanStack Table state
    const [sorting, setSorting] = useState<SortingState>([]);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<T | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{
        rowIndex: number;
        columnId: string;
    } | null>(null);
    const [editingData, setEditingData] = useState<Record<string, T>>({});

    // Define role permissions
    type RoleType = 'owner' | 'admin' | 'maintainer' | 'editor' | 'viewer';

    const rolePermissions = React.useMemo(
        () =>
            ({
                owner: ['editTable', 'deleteRow', 'addRow'],
                admin: ['editTable', 'deleteRow', 'addRow'],
                maintainer: ['editTable', 'deleteRow', 'addRow'],
                editor: ['editTable', 'deleteRow', 'addRow'],
                viewer: [],
            }) as Record<RoleType, string[]>,
        [],
    );

    // Permission check helper
    const canPerformAction = useCallback(
        async (action: string) => {
            const getUserRole = async () => {
                try {
                    const { data, error } = await supabase
                        .from('project_members')
                        .select('role')
                        .eq('user_id', userId)
                        .eq(
                            'project_id',
                            Array.isArray(projectId) ? projectId[0] : projectId,
                        )
                        .single();

                    if (error) {
                        console.error('Error fetching user role:', error);
                        return 'viewer';
                    }

                    return data?.role || 'viewer';
                } catch (err) {
                    console.error('Unexpected error fetching user role:', err);
                    return 'viewer';
                }
            };

            const userRole = await getUserRole();
            return rolePermissions[userRole].includes(action);
        },
        [userId, projectId, rolePermissions],
    );

    // Modified handleCellChange to update state without triggering save
    const handleCellChange = useCallback(
        (itemId: string, accessor: keyof T, newValue: CellValue) => {
            if (!isEditMode) return;

            // Get the current value before update
            const currentItem = localData.find((item) => item.id === itemId);
            const _oldValue = currentItem ? currentItem[accessor] : null;

            // Update editing data for saving later
            setEditingData((prev) => {
                const item = prev[itemId] || {
                    ...localData.find((d) => d.id === itemId)!,
                };
                return {
                    ...prev,
                    [itemId]: {
                        ...item,
                        [accessor]: newValue,
                    },
                };
            });

            // Update local data immediately for optimistic UI
            setLocalData((prev) =>
                prev.map((item) =>
                    item.id === itemId
                        ? { ...item, [accessor]: newValue }
                        : item,
                ),
            );

            // Add to pending saves
            setPendingSaves((prev) => new Set(prev).add(itemId));

            // No longer need to set a debounce timer or call savePendingChanges here
            // Saving will happen on blur
        },
        [isEditMode, localData],
    );

    // Enhanced savePendingChanges with better error handling
    const savePendingChanges = useCallback(async () => {
        if (!onSave || !editingData || pendingSaves.size === 0) return;

        const savingItemIds = Array.from(pendingSaves);
        const updatesToSave = optimisticUpdates.filter((update) =>
            savingItemIds.includes(update.itemId),
        );

        try {
            for (const itemId of savingItemIds) {
                const item = editingData[itemId];
                if (!item) continue;

                await onSave(item, false);

                // Remove from pending saves after successful save
                setPendingSaves((prev) => {
                    const next = new Set(prev);
                    next.delete(itemId);
                    return next;
                });

                // Clear successful updates from optimisticUpdates
                setOptimisticUpdates((prev) =>
                    prev.filter((update) => update.itemId !== itemId),
                );
            }

            if (!isEditMode && onPostSave) {
                await onPostSave();
            }
        } catch (error) {
            handleSaveError(error as Error, updatesToSave);
        }
    }, [
        editingData,
        onSave,
        onPostSave,
        isEditMode,
        pendingSaves,
        optimisticUpdates,
        handleSaveError,
    ]);

    // Handle cell blur to save changes - moved after savePendingChanges
    const handleCellBlur = useCallback(() => {
        // Save any pending changes when a cell loses focus
        if (pendingSaves.size > 0) {
            savePendingChanges();
        }
    }, [pendingSaves, savePendingChanges]);

    // Convert EditableColumn[] to TanStack ColumnDef[]
    const tableColumns = useMemo<ColumnDef<T>[]>(() => {
        return columns.map((column) => ({
            id: String(column.accessor),
            accessorKey: String(column.accessor),
            header: column.header,
            size: column.width,
            cell: ({ cell }) => {
                const isEditing = isEditMode && !isAddingNew;
                const isSelected =
                    selectedCell?.rowIndex === cell.row.index &&
                    selectedCell?.columnId === cell.column.id;

                // Simplified value extraction - the table already has the right data
                const value = cell.getValue() as CellValue;

                return (
                    <div
                        className="relative w-full h-full min-h-[32px]"
                        onClick={(e) => {
                            if (!isEditing) return;
                            e.stopPropagation();
                            setSelectedCell({
                                rowIndex: cell.row.index,
                                columnId: cell.column.id,
                            });
                        }}
                    >
                        <TanStackCellRenderer
                            cell={cell}
                            isEditing={isEditing}
                            isSelected={isSelected}
                            value={value}
                            onSave={(newValue) => {
                                handleCellChange(
                                    cell.row.original.id,
                                    cell.column.id as keyof T,
                                    newValue,
                                );
                            }}
                            onBlur={handleCellBlur}
                        />
                    </div>
                );
            },
        }));
    }, [
        columns,
        isEditMode,
        isAddingNew,
        handleCellChange,
        handleCellBlur,
        selectedCell,
    ]);

    // Create derived data source that combines original data with edited values
    const tableData = useMemo(() => {
        // If not in edit mode, just use the local data
        if (!isEditMode) return localData;

        // Otherwise, merge local data with editingData
        return localData.map((item) => {
            const editedItem = editingData[item.id];
            // If we have edited this item, merge original with edits
            if (editedItem) {
                return {
                    ...item,
                    ...editedItem,
                };
            }
            // Otherwise return original item
            return item;
        });
    }, [localData, editingData, isEditMode]);

    // Initialize TanStack Table with tableData (merged data including edits)
    const table = useReactTable({
        data: tableData,
        columns: tableColumns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableRowSelection: true,
    });

    // Get sorted data (replacement for custom useTableSort hook)
    const sortedData = table.getRowModel().rows.map((row) => row.original);

    // Handle blur events on the table wrapper
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
            setEditingData(initialEditData);
        } else if (!isEditMode) {
            setEditingData({});
        }
    }, [isEditMode, data]);

    // Effect to save all changes when exiting edit mode
    useEffect(() => {
        if (!isEditMode) {
            console.log('Exiting edit mode, saving any pending changes...');
            savePendingChanges();
        }
    }, [isEditMode, savePendingChanges]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!selectedCell || !sortedData.length || !isEditMode) return;

            const maxRow = sortedData.length - 1;
            const columns = table.getAllColumns();
            const columnIds = columns.map((col) => col.id);
            const maxCol = columnIds.length - 1;

            let currentColIndex = columnIds.findIndex(
                (id) => id === selectedCell.columnId,
            );
            if (currentColIndex === -1) currentColIndex = 0;

            let newRowIndex = selectedCell.rowIndex;
            let newColIndex = currentColIndex;

            switch (e.key) {
                case 'ArrowUp':
                    newRowIndex = Math.max(0, selectedCell.rowIndex - 1);
                    break;
                case 'ArrowDown':
                    newRowIndex = Math.min(maxRow, selectedCell.rowIndex + 1);
                    break;
                case 'ArrowLeft':
                    newColIndex = Math.max(0, currentColIndex - 1);
                    break;
                case 'ArrowRight':
                    newColIndex = Math.min(maxCol, currentColIndex + 1);
                    break;
                default:
                    return;
            }

            e.preventDefault();
            setSelectedCell({
                rowIndex: newRowIndex,
                columnId: columnIds[newColIndex],
            });
        },
        [selectedCell, sortedData.length, isEditMode, table],
    );

    // Reset selected cell when exiting edit mode
    useEffect(() => {
        if (!isEditMode) {
            setSelectedCell(null);
        }
    }, [isEditMode]);

    // Add keyboard event listener
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

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

        setEditingData((prev) => ({
            ...prev,
            new: newItem,
        }));
        setIsAddingNew(true);
    }, [canPerformAction, columns]);

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
            setIsAddingNew(false);
            setEditingData((prev) => {
                const { new: _, ...rest } = prev;
                return rest;
            });
        } catch (error) {
            console.error('Failed to save new row:', error);
        }
    }, [editingData, onSave, onPostSave]);

    const handleCancelNewRow = useCallback(() => {
        setIsAddingNew(false);
        setEditingData((prev) => {
            const { new: _, ...rest } = prev;
            return rest;
        });
    }, []);

    const _handleDeleteClick = useCallback(
        async (item: T) => {
            const canDelete = await canPerformAction('deleteRow');
            if (!canDelete) {
                return;
            }

            setItemToDelete(item);
            setDeleteConfirmOpen(true);
        },
        [canPerformAction],
    );

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

    // Handle sort function with proper typing
    const handleSort = useCallback(
        (key: string | null) => {
            if (!key) return;

            // Find if the key is already being sorted
            const existingSortIndex = sorting.findIndex((s) => s.id === key);

            if (existingSortIndex !== -1) {
                // Toggle sort direction or remove if it was descending
                const existingSort = sorting[existingSortIndex];
                if (existingSort.desc) {
                    // Remove this sorting criteria
                    setSorting((prev) => prev.filter((s) => s.id !== key));
                } else {
                    // Change to descending
                    setSorting((prev) =>
                        prev.map((s, i) =>
                            i === existingSortIndex ? { ...s, desc: true } : s,
                        ),
                    );
                }
            } else {
                // Add new ascending sort
                setSorting([{ id: key, desc: false }]);
            }
        },
        [sorting],
    );

    // Render table
    if (isLoading) {
        return <TableLoadingSkeleton columns={columns.length} />;
    }

    return (
        <div className="w-full">
            {showFilter && (
                <TableControls
                    filterComponent={filterComponent}
                    sortKey={sorting.length > 0 ? sorting[0].id : null}
                    sortOrder={
                        sorting.length > 0
                            ? sorting[0].desc
                                ? 'desc'
                                : 'asc'
                            : 'asc'
                    }
                    onSort={handleSort as (key: keyof T) => void}
                    columns={columns}
                    showFilter={showFilter}
                    onNewRow={handleAddNewRow}
                    onEnterEditMode={() => {
                        /* No-op - edit mode is controlled elsewhere */
                    }}
                    isVisible={true}
                    orgId=""
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
                            sortKey={sorting.length > 0 ? sorting[0].id : null}
                            sortOrder={
                                sorting.length > 0
                                    ? sorting[0].desc
                                        ? 'desc'
                                        : 'asc'
                                    : 'asc'
                            }
                            onSort={handleSort as (key: keyof T) => void}
                            isEditMode={isEditMode}
                        />
                        <TableBody>
                            {/* Mapped rows from TanStack table */}
                            {table.getRowModel().rows.map((row) => (
                                <TanStackDataTableRow
                                    key={row.id}
                                    row={row}
                                    isEditMode={isEditMode}
                                    selectedCell={selectedCell}
                                    onCellChange={handleCellChange}
                                    onCellBlur={handleCellBlur}
                                    onCellSelect={(rowIndex, columnId) => {
                                        setSelectedCell({
                                            rowIndex,
                                            columnId,
                                        });
                                    }}
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
                onOpenChange={(open) => !open && setDeleteConfirmOpen(false)}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}
