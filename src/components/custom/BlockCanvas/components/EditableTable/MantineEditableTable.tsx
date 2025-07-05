'use client';

/**
 * MantineEditableTable Component
 *
 * A Mantine implementation using Mantine React Table (MRT)
 * This component provides the same API surface as other table implementations
 * while using Mantine components and styling
 */
import { useMemo, useState, useCallback, useEffect } from 'react';
import {
    MantineReactTable,
    useMantineReactTable,
    type MRT_ColumnDef,
    type MRT_Row,
} from 'mantine-react-table';
import { useParams } from 'next/navigation';
import { Box, ActionIcon, Tooltip, Group } from '@mantine/core';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';

import { useUser } from '@/lib/providers/user.provider';
import { RequirementAiAnalysis } from '@/types/base/requirements.types';

import { CellValue, EditableTableProps } from './types';

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
    const _projectId = params?.projectId || '';

    // Local state for optimistic updates
    const [localData, setLocalData] = useState<T[]>([]);
    const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set());
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Initialize local data
    useEffect(() => {
        setLocalData(data);
    }, [data]);

    // Convert columns to Mantine React Table format
    const mantineColumns = useMemo<MRT_ColumnDef<T>[]>(() => {
        return columns.map((col) => ({
            accessorKey: col.accessor as string,
            header: col.header,
            enableEditing: isEditMode,
            mantineEditTextInputProps: ({ row }) => ({
                required: col.required,
                type: col.type === 'number' ? 'number' : 'text',
                error: validationErrors[`${row.id}-${String(col.accessor)}`],
                onBlur: (event) => {
                    handleCellEdit(row.original, String(col.accessor), event.target.value);
                },
            }),
            Cell: ({ cell }) => {
                const value = cell.getValue();
                
                // Handle different cell types
                if (col.type === 'select' && col.options) {
                    return <span>{value as string}</span>;
                }
                
                if (col.type === 'date' && value) {
                    return <span>{new Date(value as string).toLocaleDateString()}</span>;
                }
                
                return <span>{value as string}</span>;
            },
        }));
    }, [columns, isEditMode, validationErrors]);

    // Handle cell editing
    const handleCellEdit = useCallback(async (
        item: T,
        field: string,
        newValue: CellValue
    ) => {
        if (!isEditMode || !onSave) return;

        // Validate the new value
        const column = columns.find(col => col.accessor === field);
        if (column?.required && (!newValue || newValue === '')) {
            setValidationErrors(prev => ({
                ...prev,
                [`${item.id}-${field}`]: `${column.header} is required`
            }));
            return;
        }

        // Clear validation error
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[`${item.id}-${field}`];
            return newErrors;
        });

        // Update local data optimistically
        const updatedItem = { ...item, [field]: newValue };
        setLocalData(prev => prev.map(row => 
            row.id === item.id ? updatedItem : row
        ));

        // Mark as pending save
        setPendingSaves(prev => new Set(prev).add(item.id));

        try {
            await onSave(updatedItem, false);
            setPendingSaves(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
            });
            
            if (onPostSave) {
                await onPostSave();
            }
        } catch (error) {
            console.error('Failed to save:', error);
            // Revert optimistic update
            setLocalData(prev => prev.map(row => 
                row.id === item.id ? item : row
            ));
            setPendingSaves(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
            });
        }
    }, [isEditMode, onSave, onPostSave, columns]);

    // Handle row deletion
    const handleDelete = useCallback(async (row: MRT_Row<T>) => {
        if (!onDelete) return;

        try {
            await onDelete(row.original);
            setLocalData(prev => prev.filter(item => item.id !== row.original.id));
            
            if (onPostSave) {
                await onPostSave();
            }
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    }, [onDelete, onPostSave]);

    // Handle adding new row
    const handleAddRow = useCallback(() => {
        // This would typically open a modal or add an empty row
        // For now, we'll just log the action
        console.log('Add new row clicked');
    }, []);

    // Configure the Mantine React Table
    const table = useMantineReactTable({
        columns: mantineColumns,
        data: localData,
        enableEditing: isEditMode,
        editDisplayMode: 'cell', // Enable cell-level editing
        enableRowActions: isEditMode,
        enableColumnFilters: showFilter,
        enableGlobalFilter: showFilter,
        enableSorting: true,
        enablePagination: true,
        initialState: {
            pagination: { pageSize: 10, pageIndex: 0 },
            showColumnFilters: showFilter,
        },
        state: {
            isLoading,
        },
        mantineTableBodyCellProps: ({ row }) => ({
            style: {
                backgroundColor: pendingSaves.has(row.original.id) ? 'rgba(255, 193, 7, 0.1)' : 'inherit',
                cursor: isEditMode ? 'pointer' : 'default',
            },
        }),
        renderRowActions: ({ row }) => (
            <Group gap="xs">
                {isEditMode && (
                    <>
                        <Tooltip label="Edit">
                            <ActionIcon
                                size="sm"
                                variant="subtle"
                                onClick={() => {
                                    // Handle edit action
                                    console.log('Edit row:', row.original);
                                }}
                            >
                                <IconEdit size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete">
                            <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="red"
                                onClick={() => handleDelete(row)}
                            >
                                <IconTrash size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </>
                )}
            </Group>
        ),
        renderTopToolbarCustomActions: () => (
            <Group>
                {isEditMode && alwaysShowAddRow && (
                    <Tooltip label="Add New Row">
                        <ActionIcon onClick={handleAddRow}>
                            <IconPlus size={16} />
                        </ActionIcon>
                    </Tooltip>
                )}
            </Group>
        ),
        mantineTableProps: {
            style: {
                '& td': {
                    borderRight: '1px solid var(--mantine-color-gray-3)',
                },
                '& td:last-child': {
                    borderRight: 'none',
                },
            },
        },
    });

    return (
        <Box w="100%">
            {filterComponent && showFilter && (
                <Box mb="md">
                    {filterComponent}
                </Box>
            )}
            <MantineReactTable table={table} />
        </Box>
    );
}
