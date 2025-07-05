'use client';

/**
 * MantineEditableTable Component
 *
 * A Mantine styled implementation that follows the same pattern as EditableTable
 * This component provides the same API surface as other table implementations
 * while using Mantine components for styling
 */
import React, { useReducer, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
    Table as MantineTable,
    Paper,
    MantineProvider,
    createTheme,
    Group,
    ActionIcon,
    Tooltip
} from '@mantine/core';
import { IconTrash, IconChevronUp, IconChevronDown } from '@tabler/icons-react';

import { useUser } from '@/lib/providers/user.provider';
import { RequirementAiAnalysis } from '@/types/base/requirements.types';
import {
    AddRowPlaceholder,
    DeleteConfirmDialog,
    NewRowForm,
    TableControls,
    TableLoadingSkeleton,
} from './components';
// import { CellRenderer } from './CellRenderer'; // Removed for now
import { tableReducer, TableState } from './reducers/tableReducer';
import { CellValue, EditableTableProps, EditableColumn } from './types';

// Create Mantine theme for consistent styling
const mantineTheme = createTheme({
    components: {
        Table: {
            styles: {
                td: {
                    borderRight: '1px solid var(--mantine-color-gray-3)',
                    '&:last-child': {
                        borderRight: 'none',
                    },
                    padding: '4px 8px',
                },
                th: {
                    borderRight: '1px solid var(--mantine-color-gray-3)',
                    '&:last-child': {
                        borderRight: 'none',
                    },
                    padding: '4px 8px',
                },
            },
        },
    },
});

export function MantineEditableTable<
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
    const _userId = user?.id || '';
    const params = useParams();
    const projectId = Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId || '';
    const orgId = Array.isArray(params?.orgId) ? params.orgId[0] : params?.orgId || '';
    const documentId = Array.isArray(params?.documentId) ? params.documentId[0] : params?.documentId || '';

    // Initialize the state with useReducer (same as EditableTable)
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

    const [state, dispatch] = useReducer(tableReducer<T>, initialState);

    // Merge data with editing data (same logic as EditableTable)
    const mergedData = useMemo(() => {
        if (!isEditMode) return data;

        return data.map((item) => {
            const editedItem = state.editingData[item.id];
            return editedItem ? { ...item, ...editedItem } : item;
        });
    }, [data, state.editingData, isEditMode]);

    // Handle cell changes (same logic as EditableTable)
    const _handleCellChange = (itemId: string, accessor: keyof T, value: CellValue) => {
        if (!isEditMode) return;

        dispatch({
            type: 'SET_CELL_VALUE',
            payload: { itemId, accessor, value },
        });

        // Clear any existing timeout for this item
        if (state.editingTimeouts[itemId]) {
            clearTimeout(state.editingTimeouts[itemId]);
        }

        // Set new timeout for debounced save
        const timeoutId = setTimeout(async () => {
            try {
                const editedItem = {
                    ...state.editingData[itemId],
                    [accessor]: value,
                };

                await onSave?.(editedItem, false);
                await onPostSave?.();
            } catch (error) {
                console.error('Failed to save:', error);
            }
        }, 500);

        dispatch({
            type: 'SET_TIMEOUT',
            payload: { itemId, timeoutId },
        });
    };

    // Handle sorting (same logic as EditableTable)
    const handleSort = (key: keyof T) => {
        const newOrder = state.sortKey === key && state.sortOrder === 'asc' ? 'desc' : 'asc';
        dispatch({
            type: 'SET_SORT',
            payload: { key: key as string, order: newOrder },
        });
    };

    // Handle delete
    const handleDelete = async (item: T) => {
        try {
            await onDelete?.(item);
            await onPostSave?.();
            dispatch({ type: 'CLOSE_DELETE_CONFIRM' });
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    // Sort data
    const sortedData = useMemo(() => {
        if (!state.sortKey) return mergedData;

        return [...mergedData].sort((a, b) => {
            const aVal = a[state.sortKey as keyof T];
            const bVal = b[state.sortKey as keyof T];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const comparison = aVal < bVal ? -1 : 1;
            return state.sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [mergedData, state.sortKey, state.sortOrder]);

    if (isLoading) {
        return <TableLoadingSkeleton columns={columns.length} />;
    }

    return (
        <MantineProvider theme={mantineTheme}>
            <div className="w-full">
                {/* Table Controls */}
                <TableControls
                    showFilter={showFilter}
                    filterComponent={filterComponent}
                    onNewRow={() => dispatch({ type: 'START_ADD_ROW' })}
                    onEnterEditMode={() => {
                        // This would be handled by parent component
                    }}
                    isVisible={isEditMode}
                    orgId={orgId}
                    projectId={projectId}
                    documentId={documentId}
                />

                {/* Mantine Table */}
                <Paper shadow="xs" p="md">
                    <MantineTable striped highlightOnHover withTableBorder>
                        <MantineTable.Thead>
                            <MantineTable.Tr>
                                {columns.map((column) => (
                                    <MantineTable.Th
                                        key={column.accessor as string}
                                        onClick={() => handleSort(column.accessor)}
                                        style={{
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                        }}
                                    >
                                        <Group gap="xs">
                                            {column.header}
                                            {state.sortKey === column.accessor && (
                                                state.sortOrder === 'asc' ?
                                                    <IconChevronUp size={14} /> :
                                                    <IconChevronDown size={14} />
                                            )}
                                        </Group>
                                    </MantineTable.Th>
                                ))}
                                {isEditMode && <MantineTable.Th>Actions</MantineTable.Th>}
                            </MantineTable.Tr>
                        </MantineTable.Thead>
                        <MantineTable.Tbody>
                            {sortedData.map((item, rowIndex) => (
                                <MantineTable.Tr key={item.id}>
                                    {columns.map((column, colIndex) => (
                                        <MantineTable.Td
                                            key={column.accessor as string}
                                            style={{
                                                position: 'relative',
                                                cursor: isEditMode ? 'pointer' : 'default',
                                            }}
                                            onClick={() => {
                                                if (isEditMode) {
                                                    dispatch({
                                                        type: 'SET_SELECTED_CELL',
                                                        payload: { row: rowIndex, col: colIndex },
                                                    });
                                                }
                                            }}
                                        >
                                            {/* Simple cell rendering for now */}
                                            <div style={{ padding: '4px 8px' }}>
                                                {item[column.accessor] !== null && item[column.accessor] !== undefined
                                                    ? String(item[column.accessor])
                                                    : ''}
                                            </div>
                                        </MantineTable.Td>
                                    ))}
                                    {isEditMode && (
                                        <MantineTable.Td>
                                            <Group gap="xs">
                                                <Tooltip label="Delete">
                                                    <ActionIcon
                                                        size="sm"
                                                        variant="subtle"
                                                        color="red"
                                                        onClick={() =>
                                                            dispatch({
                                                                type: 'OPEN_DELETE_CONFIRM',
                                                                payload: item,
                                                            })
                                                        }
                                                    >
                                                        <IconTrash size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        </MantineTable.Td>
                                    )}
                                </MantineTable.Tr>
                            ))}

                            {/* Add new row */}
                            {!state.isAddingNew && isEditMode && (alwaysShowAddRow || isEditMode) && (
                                <AddRowPlaceholder
                                    columns={columns as EditableColumn<unknown>[]}
                                    onClick={() => dispatch({ type: 'START_ADD_ROW' })}
                                    isEditMode={isEditMode}
                                />
                            )}
                        </MantineTable.Tbody>
                    </MantineTable>
                </Paper>

                {/* New Row Form */}
                {state.isAddingNew && (
                    <NewRowForm
                        columns={columns as EditableColumn<unknown>[]}
                        editingData={state.editingData}
                        onCellChange={(itemId, accessor, value) => {
                            dispatch({
                                type: 'SET_CELL_VALUE',
                                payload: { itemId, accessor, value },
                            });
                        }}
                        onSave={async () => {
                            // Handle save logic here
                            dispatch({ type: 'CANCEL_ADD_ROW' });
                        }}
                        onCancel={() => dispatch({ type: 'CANCEL_ADD_ROW' })}
                    />
                )}

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmDialog
                    open={state.deleteConfirmOpen}
                    onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DELETE_CONFIRM' })}
                    onConfirm={() => {
                        if (state.itemToDelete) {
                            handleDelete(state.itemToDelete);
                        }
                    }}
                />
            </div>
        </MantineProvider>
    );
}
