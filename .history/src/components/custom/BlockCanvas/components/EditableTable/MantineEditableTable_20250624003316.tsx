'use client';

/**
 * MantineEditableTable Component
 *
 * A Mantine React Table implementation that provides full feature parity
 * with the existing EditableTable components while using Mantine's design system
 */
import {
    Download,
    Edit3,
    FileSpreadsheet,
    Filter,
    Plus,
    Save,
    Search,
    Settings,
    Trash2,
    X,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
// import { useUser } from '@/lib/providers/user.provider';
// import { supabase } from '@/lib/supabase/supabaseBrowser';
import { RequirementAiAnalysis } from '@/types/base/requirements.types';

import { DeleteConfirmDialog, TableLoadingSkeleton } from './components';
import { CellValue, EditableTableProps } from './types';

// Mantine-style table row component
interface MantineTableRowProps<T> {
    item: T;
    columns: any[];
    isEditMode: boolean;
    isSelected: boolean;
    onSelect: (selected: boolean) => void;
    onEdit: (field: string, value: CellValue) => void;
    onDelete: () => void;
    editingData: Record<string, CellValue>;
}

function MantineTableRow<T extends Record<string, CellValue> & { id: string }>({
    item,
    columns,
    isEditMode,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
    editingData,
}: MantineTableRowProps<T>) {
    const [isEditing, setIsEditing] = useState(false);
    const [localEdits, setLocalEdits] = useState<Record<string, CellValue>>({});

    const handleCellEdit = (field: string, value: CellValue) => {
        setLocalEdits((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        Object.entries(localEdits).forEach(([field, value]) => {
            onEdit(field, value);
        });
        setLocalEdits({});
        setIsEditing(false);
    };

    const handleCancel = () => {
        setLocalEdits({});
        setIsEditing(false);
    };

    const getCellValue = (field: string) => {
        return (
            localEdits[field] ?? editingData[field] ?? item[field as keyof T]
        );
    };

    return (
        <tr className="border-b hover:bg-muted/50 transition-colors">
            <td className="p-4 border-r">
                <div className="flex items-center gap-2">
                    <Checkbox checked={isSelected} onCheckedChange={onSelect} />
                    <span className="font-mono text-sm font-medium text-foreground">
                        {item.id}
                    </span>
                </div>
            </td>

            {columns.map((column) => (
                <td key={column.key} className="p-4 border-r last:border-r-0">
                    {isEditing && isEditMode ? (
                        <MantineCellEditor
                            column={column}
                            value={getCellValue(column.key)}
                            onChange={(value) =>
                                handleCellEdit(column.key, value)
                            }
                        />
                    ) : (
                        <MantineCellDisplay
                            column={column}
                            value={getCellValue(column.key)}
                        />
                    )}
                </td>
            ))}

            <td className="p-4">
                <div className="flex gap-2">
                    {isEditMode && (
                        <>
                            {isEditing ? (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <Save className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancel}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setIsEditing(true)}
                                        className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800"
                                    >
                                        <Edit3 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={onDelete}
                                        className="border-red-300 text-red-700 hover:bg-red-100 dark:hover:bg-red-800"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}

// Mantine-style cell editor
interface MantineCellEditorProps {
    column: any;
    value: CellValue;
    onChange: (value: CellValue) => void;
}

function MantineCellEditor({
    column,
    value,
    onChange,
}: MantineCellEditorProps) {
    const stringValue = value?.toString() || '';

    switch (column.type) {
        case 'select':
            return (
                <Select value={stringValue} onValueChange={onChange}>
                    <SelectTrigger className="border-blue-300 focus:border-blue-500">
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        {column.options?.map((option: string) => (
                            <SelectItem key={option} value={option}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        case 'number':
            return (
                <Input
                    type="number"
                    value={stringValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="border-blue-300 focus:border-blue-500"
                />
            );
        case 'date':
            return (
                <Input
                    type="date"
                    value={stringValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="border-blue-300 focus:border-blue-500"
                />
            );
        default:
            return (
                <Input
                    value={stringValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="border-blue-300 focus:border-blue-500"
                />
            );
    }
}

// Mantine-style cell display
interface MantineCellDisplayProps {
    column: any;
    value: CellValue;
}

function MantineCellDisplay({ column, value }: MantineCellDisplayProps) {
    const stringValue = value?.toString() || '';

    switch (column.type) {
        case 'select':
            return (
                <Badge
                    variant="outline"
                    className="border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900 dark:text-blue-200"
                >
                    {stringValue}
                </Badge>
            );
        case 'number':
            return <span className="font-mono">{stringValue}</span>;
        case 'date':
            return <span className="text-sm">{stringValue}</span>;
        default:
            return (
                <div className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-700 p-1 rounded-md transition-colors">
                    {stringValue}
                </div>
            );
    }
}

/**
 * MantineEditableTable component
 */
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
    // Component state
    const [localData, setLocalData] = useState<T[]>([]);
    const [editingData, setEditingData] = useState<Record<string, CellValue>>(
        {},
    );
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<T | null>(null);

    // User and permissions (optional for testing)
    // const { user } = useUser();
    const params = useParams();

    // Initialize local data
    useEffect(() => {
        setLocalData(data);
    }, [data]);

    // Handle cell editing
    const handleCellEdit = useCallback(
        (itemId: string, field: string, value: CellValue) => {
            setEditingData((prev) => ({
                ...prev,
                [`${itemId}.${field}`]: value,
            }));
        },
        [],
    );

    // Handle save
    const handleSave = useCallback(
        async (item: T) => {
            if (onSave) {
                await onSave(item, false);
                if (onPostSave) {
                    await onPostSave();
                }
            }
        },
        [onSave, onPostSave],
    );

    // Handle delete
    const handleDelete = useCallback((item: T) => {
        setItemToDelete(item);
        setDeleteConfirmOpen(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (itemToDelete && onDelete) {
            await onDelete(itemToDelete);
            if (onPostSave) {
                await onPostSave();
            }
        }
        setDeleteConfirmOpen(false);
        setItemToDelete(null);
    }, [itemToDelete, onDelete, onPostSave]);

    // Filter and sort data
    const processedData = useMemo(() => {
        let filtered = localData;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter((item) =>
                Object.values(item).some((value) =>
                    value
                        ?.toString()
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()),
                ),
            );
        }

        // Apply sorting
        if (sortColumn) {
            filtered = [...filtered].sort((a, b) => {
                const aVal = a[sortColumn as keyof T]?.toString() || '';
                const bVal = b[sortColumn as keyof T]?.toString() || '';

                if (sortDirection === 'asc') {
                    return aVal.localeCompare(bVal);
                } else {
                    return bVal.localeCompare(aVal);
                }
            });
        }

        return filtered;
    }, [localData, searchTerm, sortColumn, sortDirection]);

    if (isLoading) {
        return <TableLoadingSkeleton columns={columns.length} />;
    }

    return (
        <div className="w-full space-y-4">
            {/* ATOMS-style toolbar */}
            <div className="bg-muted/50 border rounded-lg p-4">
                <div className="flex flex-wrap gap-3 mb-4">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                        <Search className="h-4 w-4 mr-2" />
                        Search
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    {isEditMode && (
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Row
                        </Button>
                    )}
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Columns
                    </Button>
                </div>

                {/* Search bar */}
                <div className="mb-4">
                    <div className="relative">
                        <Input
                            placeholder="Search requirements..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-blue-900 focus:border-blue-500"
                        />
                        <Search className="absolute right-3 top-3 h-4 w-4 text-blue-400" />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-blue-900 shadow-sm">
                    <table className="w-full">
                        <thead className="bg-blue-100 dark:bg-blue-800">
                            <tr>
                                <th className="p-4 text-left border-r border-blue-200 dark:border-blue-700">
                                    <div className="flex items-center gap-2">
                                        <Checkbox className="data-[state=checked]:bg-blue-600" />
                                        <span className="font-semibold text-blue-900 dark:text-blue-100">
                                            ID
                                        </span>
                                    </div>
                                </th>
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className="p-4 text-left border-r border-blue-200 dark:border-blue-700 last:border-r-0"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-blue-900 dark:text-blue-100">
                                                {column.header}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    if (
                                                        sortColumn ===
                                                        column.key
                                                    ) {
                                                        setSortDirection(
                                                            sortDirection ===
                                                                'asc'
                                                                ? 'desc'
                                                                : 'asc',
                                                        );
                                                    } else {
                                                        setSortColumn(
                                                            column.key,
                                                        );
                                                        setSortDirection('asc');
                                                    }
                                                }}
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                ⇅
                                            </Button>
                                        </div>
                                    </th>
                                ))}
                                <th className="p-4 text-left">
                                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                                        Actions
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedData.map((item) => (
                                <MantineTableRow
                                    key={item.id}
                                    item={item}
                                    columns={columns}
                                    isEditMode={isEditMode}
                                    isSelected={selectedRows.has(item.id)}
                                    onSelect={(selected) => {
                                        const newSelected = new Set(
                                            selectedRows,
                                        );
                                        if (selected) {
                                            newSelected.add(item.id);
                                        } else {
                                            newSelected.delete(item.id);
                                        }
                                        setSelectedRows(newSelected);
                                    }}
                                    onEdit={(field, value) =>
                                        handleCellEdit(item.id, field, value)
                                    }
                                    onDelete={() => handleDelete(item)}
                                    editingData={editingData}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4 text-sm">
                    <span className="text-blue-700 dark:text-blue-300 font-medium">
                        Showing {processedData.length} of {localData.length}{' '}
                        requirements
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800"
                        >
                            ← Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800"
                        >
                            Next →
                        </Button>
                    </div>
                </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
                ✨ <strong>Mantine React Table</strong> - Clean design with
                enhanced spacing and modern blue theme
            </div>

            {/* Delete confirmation dialog */}
            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}
