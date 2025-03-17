'use client';

import { CaretSortIcon } from '@radix-ui/react-icons';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { transitionConfig } from '@/lib/utils/animations';

import { CellRenderer } from './CellRenderer';
import { TableSideMenu } from './TableSideMenu';
import { CellValue, EditableColumn, EditableTableProps } from './types';

export function EditableTable<
    T extends Record<string, CellValue> & { id: string },
>({
    data,
    columns,
    onSave,
    onDelete,
    isLoading = false,
    emptyMessage = 'No items found.',
    showFilter = true,
    filterComponent,
    isEditMode = false,
}: EditableTableProps<T>) {
    const [sortKey, setSortKey] = useState<keyof T | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [_hoveredCell, setHoveredCell] = useState<{
        row: number;
        col: number;
    } | null>(null);
    const [editingData, setEditingData] = useState<Record<string, T>>({});
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<T | null>(null);
    const [editingTimeouts, setEditingTimeouts] = useState<
        Record<string, NodeJS.Timeout>
    >({});
    const previousDataRef = useRef<T[]>([]);
    const [isHoveringTable, setIsHoveringTable] = useState(false);
    const [localIsEditMode, setLocalIsEditMode] = useState(isEditMode);

    useEffect(() => {
        setLocalIsEditMode(isEditMode);
    }, [isEditMode]);

    // Clear all editing timeouts on unmount
    useEffect(() => {
        return () => {
            Object.values(editingTimeouts).forEach((timeout) =>
                clearTimeout(timeout),
            );
        };
    }, [editingTimeouts]);

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            if (!sortKey) return 0;
            const aValue = a[sortKey];
            const bValue = b[sortKey];

            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return sortOrder === 'asc' ? -1 : 1;
            if (bValue == null) return sortOrder === 'asc' ? 1 : -1;

            // Handle Date objects
            if (aValue instanceof Date && bValue instanceof Date) {
                return sortOrder === 'asc'
                    ? aValue.getTime() - bValue.getTime()
                    : bValue.getTime() - aValue.getTime();
            }

            // Handle regular values
            return sortOrder === 'asc'
                ? String(aValue).localeCompare(String(bValue))
                : String(bValue).localeCompare(String(aValue));
        });
    }, [data, sortKey, sortOrder]);

    // Update editing data when data changes or edit mode is toggled
    useEffect(() => {
        // Skip if data hasn't changed and we're not toggling edit mode
        if (
            JSON.stringify(data) === JSON.stringify(previousDataRef.current) &&
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
            Object.values(editingTimeouts).forEach((timeout) =>
                clearTimeout(timeout),
            );
            setEditingTimeouts({});
        }
    }, [localIsEditMode, data, editingData, editingTimeouts]);

    const handleDeleteClick = (item: T) => {
        setItemToDelete(item);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;

        try {
            await onDelete?.(itemToDelete);
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const handleCellChange = (
        itemId: string,
        accessor: keyof T,
        value: CellValue,
    ) => {
        // Update local state immediately
        setEditingData((prev) => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [accessor]: value,
            },
        }));

        // Don't auto-save if this is a new row
        if (itemId === 'new') return;

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

                const savedItem = await onSave?.(editedItem, false);

                // Update editing data with saved values
                if (savedItem) {
                    setEditingData((prev) => ({
                        ...prev,
                        [itemId]: savedItem,
                    }));
                }

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
    };

    const handleMockRowClick = () => {
        const newItem = columns.reduce((acc, col) => {
            switch (col.type) {
                case 'select':
                    acc[col.accessor as keyof T] = (col.options?.[0] ??
                        '') as T[keyof T];
                    break;
                case 'text':
                    acc[col.accessor as keyof T] = '' as T[keyof T];
                    break;
                case 'number':
                    acc[col.accessor as keyof T] = '0' as T[keyof T];
                    break;
                case 'date':
                    acc[col.accessor as keyof T] = new Date()
                        .toISOString()
                        .split('T')[0] as T[keyof T];
                    break;
                default:
                    acc[col.accessor as keyof T] = '' as T[keyof T];
            }
            return acc;
        }, {} as T);

        newItem.id = 'new';
        setEditingData((prev) => ({
            ...prev,
            new: newItem,
        }));
        setIsAddingNew(true);
    };

    const handleSaveNewRow = async () => {
        const newItem = editingData['new'];
        if (!newItem) return;

        try {
            // Remove the temporary id before saving
            const { id: _tempId, ...itemWithoutId } = newItem;
            await onSave?.(itemWithoutId as T, true);

            // Clear editing state after successful save
            setIsAddingNew(false);
            setEditingData((prev) => {
                const { new: _newItem, ...rest } = prev;
                return rest;
            });
        } catch (error) {
            console.error('Failed to save new row:', error);
        }
    };

    const handleCancelNewRow = () => {
        setIsAddingNew(false);
        setEditingData((prev) => {
            const { new: _newItem, ...rest } = prev;
            return rest;
        });
    };

    const renderCell = (
        item: T,
        column: EditableColumn<T>,
        _rowIndex: number,
        _colIndex: number,
    ) => {
        const isEditing = localIsEditMode || item.id === 'new';
        const value = isEditing
            ? editingData[item.id as string]?.[column.accessor]
            : item[column.accessor];

        return (
            <CellRenderer
                item={item}
                column={column}
                isEditing={isEditing}
                value={value}
                onCellChange={handleCellChange}
            />
        );
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-muted rounded-lg" />
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-muted rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <LayoutGroup>
            <motion.div
                className="relative"
                layout
                transition={transitionConfig}
            >
                <div className="relative">
                    <div
                        className="relative overflow-visible font-mono group"
                        onMouseEnter={() =>
                            !localIsEditMode && setIsHoveringTable(true)
                        }
                        onMouseLeave={() =>
                            !localIsEditMode && setIsHoveringTable(false)
                        }
                    >
                        {/* Slide-out Controls */}
                        <AnimatePresence>
                            {isHoveringTable && !localIsEditMode && (
                                <TableSideMenu
                                    showFilter={showFilter}
                                    filterComponent={filterComponent}
                                    onNewRow={handleMockRowClick}
                                    onEnterEditMode={() =>
                                        setLocalIsEditMode(true)
                                    }
                                />
                            )}
                        </AnimatePresence>

                        {sortedData.length === 0 && !isAddingNew ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {emptyMessage}
                            </div>
                        ) : (
                            <div className="relative">
                                <Table className="[&_tr:last-child_td]:border-b-2 [&_tr]:border-b [&_td]:py-1 [&_th]:py-1 [&_td]:border-r [&_td:last-child]:border-r-0 [&_th]:border-r [&_th:last-child]:border-r-0">
                                    <TableHeader>
                                        <TableRow>
                                            {columns.map((column) => (
                                                <TableHead
                                                    key={column.header}
                                                    style={{
                                                        width: column.width
                                                            ? `${column.width}px`
                                                            : undefined,
                                                    }}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => {
                                                            if (
                                                                column.isSortable
                                                            ) {
                                                                if (
                                                                    sortKey ===
                                                                    column.accessor
                                                                ) {
                                                                    setSortOrder(
                                                                        sortOrder ===
                                                                            'asc'
                                                                            ? 'desc'
                                                                            : 'asc',
                                                                    );
                                                                } else {
                                                                    setSortKey(
                                                                        column.accessor,
                                                                    );
                                                                    setSortOrder(
                                                                        'asc',
                                                                    );
                                                                }
                                                            }
                                                        }}
                                                        className={cn(
                                                            'h-8 text-left font-medium',
                                                            column.isSortable &&
                                                                'cursor-pointer',
                                                        )}
                                                        disabled={
                                                            !column.isSortable
                                                        }
                                                    >
                                                        {column.header}
                                                        {column.isSortable && (
                                                            <CaretSortIcon className="ml-2 h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableHead>
                                            ))}
                                            {localIsEditMode && (
                                                <TableHead
                                                    style={{ width: '100px' }}
                                                >
                                                    Actions
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedData.map((item, rowIndex) => (
                                            <TableRow
                                                key={item.id}
                                                className="font-mono"
                                            >
                                                {columns.map(
                                                    (column, colIndex) => (
                                                        <TableCell
                                                            key={`${String(item.id)}-${String(column.accessor)}`}
                                                            onMouseEnter={() =>
                                                                setHoveredCell({
                                                                    row: rowIndex,
                                                                    col: colIndex,
                                                                })
                                                            }
                                                            onMouseLeave={() =>
                                                                setHoveredCell(
                                                                    null,
                                                                )
                                                            }
                                                        >
                                                            {renderCell(
                                                                item,
                                                                column,
                                                                rowIndex,
                                                                colIndex,
                                                            )}
                                                        </TableCell>
                                                    ),
                                                )}
                                                {localIsEditMode && (
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    handleDeleteClick(
                                                                        item,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                        {/* New row being added */}
                                        {isAddingNew && (
                                            <TableRow className="font-mono">
                                                {columns.map(
                                                    (column, colIndex) => (
                                                        <TableCell
                                                            key={`new-${String(column.accessor)}`}
                                                        >
                                                            {renderCell(
                                                                {
                                                                    ...editingData[
                                                                        'new'
                                                                    ],
                                                                } as T,
                                                                column,
                                                                -1,
                                                                colIndex,
                                                            )}
                                                        </TableCell>
                                                    ),
                                                )}
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={
                                                                handleSaveNewRow
                                                            }
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={
                                                                handleCancelNewRow
                                                            }
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {/* Mock row for adding new items */}
                                        {!isAddingNew && (
                                            <TableRow
                                                className={cn(
                                                    'font-mono cursor-pointer group/mock-row',
                                                )}
                                                onClick={handleMockRowClick}
                                            >
                                                {columns.map(
                                                    (column, colIndex) => (
                                                        <TableCell
                                                            key={`mock-${String(column.accessor)}`}
                                                            className={cn(
                                                                'text-muted-foreground/50',
                                                                colIndex ===
                                                                    0 &&
                                                                    'font-medium',
                                                            )}
                                                        >
                                                            {colIndex === 0 ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Plus className="h-4 w-4" />
                                                                    New Row
                                                                </div>
                                                            ) : (
                                                                '...'
                                                            )}
                                                        </TableCell>
                                                    ),
                                                )}
                                                {localIsEditMode && (
                                                    <TableCell />
                                                )}
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            <AlertDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete this requirement.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </LayoutGroup>
    );
}
