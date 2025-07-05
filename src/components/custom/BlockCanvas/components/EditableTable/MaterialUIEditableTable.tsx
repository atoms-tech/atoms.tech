'use client';

/**
 * MaterialUIEditableTable Component
 *
 * A Material UI styled implementation that follows the same pattern as EditableTable
 * This component provides the same API surface as other table implementations
 * while using Material UI components for styling
 */
import React, { useReducer, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
    Table as MuiTable,
    TableBody as MuiTableBody,
    TableCell as MuiTableCell,
    TableContainer,
    TableHead as MuiTableHead,
    TableRow as MuiTableRow,
    Paper,
    Box,
    ThemeProvider,
    createTheme
} from '@mui/material';

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

// Create Material UI theme for consistent styling
const materialTheme = createTheme({
    palette: {
        mode: 'light', // This will be overridden by the app's theme
    },
    components: {
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderRight: '1px solid rgba(224, 224, 224, 1)',
                    '&:last-child': {
                        borderRight: 'none',
                    },
                    padding: '4px 8px',
                },
            },
        },
    },
});

export function MaterialUIEditableTable<
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
        <ThemeProvider theme={materialTheme}>
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

                {/* Material UI Table */}
                <TableContainer component={Paper} elevation={1}>
                    <MuiTable size="small" stickyHeader>
                        <MuiTableHead>
                            <MuiTableRow>
                                {columns.map((column) => (
                                    <MuiTableCell
                                        key={column.accessor as string}
                                        onClick={() => handleSort(column.accessor)}
                                        sx={{
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            backgroundColor: 'background.paper',
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                            },
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {column.header}
                                            {state.sortKey === column.accessor && (
                                                <span>{state.sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </Box>
                                    </MuiTableCell>
                                ))}
                                {isEditMode && <MuiTableCell>Actions</MuiTableCell>}
                            </MuiTableRow>
                        </MuiTableHead>
                        <MuiTableBody>
                            {sortedData.map((item, rowIndex) => (
                                <MuiTableRow
                                    key={item.id}
                                    hover
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                    }}
                                >
                                    {columns.map((column, colIndex) => (
                                        <MuiTableCell
                                            key={column.accessor as string}
                                            sx={{
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
                                            <div className="py-0.5 px-1">
                                                {item[column.accessor] !== null && item[column.accessor] !== undefined
                                                    ? String(item[column.accessor])
                                                    : ''}
                                            </div>
                                        </MuiTableCell>
                                    ))}
                                    {isEditMode && (
                                        <MuiTableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <button
                                                    onClick={() =>
                                                        dispatch({
                                                            type: 'OPEN_DELETE_CONFIRM',
                                                            payload: item,
                                                        })
                                                    }
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Delete
                                                </button>
                                            </Box>
                                        </MuiTableCell>
                                    )}
                                </MuiTableRow>
                            ))}

                            {/* Add new row */}
                            {!state.isAddingNew && isEditMode && (alwaysShowAddRow || isEditMode) && (
                                <AddRowPlaceholder
                                    columns={columns as EditableColumn<unknown>[]}
                                    onClick={() => dispatch({ type: 'START_ADD_ROW' })}
                                    isEditMode={isEditMode}
                                />
                            )}
                        </MuiTableBody>
                    </MuiTable>
                </TableContainer>

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
        </ThemeProvider>
    );
}
