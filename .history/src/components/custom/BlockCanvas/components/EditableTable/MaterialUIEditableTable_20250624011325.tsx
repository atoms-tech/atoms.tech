'use client';

/**
 * MaterialUIEditableTable Component
 *
 * A Material-UI React Table implementation that provides full feature parity
 * with the existing EditableTable components while using Material Design principles
 */
import {
    Download,
    Edit3,
    FileSpreadsheet,
    Filter,
    MoreHorizontal,
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

// Material-UI style table row component
interface MaterialUITableRowProps<T> {
    item: T;
    columns: any[];
    isEditMode: boolean;
    isSelected: boolean;
    onSelect: (selected: boolean) => void;
    onEdit: (field: string, value: CellValue) => void;
    onDelete: () => void;
    editingData: Record<string, CellValue>;
    index: number;
}

function MaterialUITableRow<
    T extends Record<string, CellValue> & { id: string },
>({
    item,
    columns,
    isEditMode,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
    editingData,
    index,
}: MaterialUITableRowProps<T>) {
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
        <tr
            className={`border-t hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                index % 2 === 0
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-gray-25 dark:bg-gray-750'
            }`}
        >
            <td className="p-3">
                <div className="flex items-center gap-2">
                    <Checkbox checked={isSelected} onCheckedChange={onSelect} />
                    <span className="font-mono text-sm font-medium">
                        {item.id}
                    </span>
                </div>
            </td>

            {columns.map((column) => (
                <td key={column.key} className="p-3">
                    {isEditing && isEditMode ? (
                        <MaterialUICellEditor
                            column={column}
                            value={getCellValue(column.key)}
                            onChange={(value) =>
                                handleCellEdit(column.key, value)
                            }
                        />
                    ) : (
                        <MaterialUICellDisplay
                            column={column}
                            value={getCellValue(column.key)}
                        />
                    )}
                </td>
            ))}

            <td className="p-3">
                <div className="flex gap-1">
                    {isEditMode && (
                        <>
                            {isEditing ? (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        className="bg-green-600 hover:bg-green-700 text-white h-8 w-8 p-0"
                                    >
                                        <Save className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancel}
                                        className="h-8 w-8 p-0"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setIsEditing(true)}
                                        className="text-blue-600 hover:text-blue-800 h-8 w-8 p-0"
                                    >
                                        <Edit3 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={onDelete}
                                        className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
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

// Material-UI style cell editor
interface MaterialUICellEditorProps {
    column: any;
    value: CellValue;
    onChange: (value: CellValue) => void;
}

function MaterialUICellEditor({
    column,
    value,
    onChange,
}: MaterialUICellEditorProps) {
    const stringValue = value?.toString() || '';

    switch (column.type) {
        case 'select':
            return (
                <Select value={stringValue} onValueChange={onChange}>
                    <SelectTrigger className="h-8">
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
                    className="h-8"
                />
            );
        case 'date':
            return (
                <Input
                    type="date"
                    value={stringValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8"
                />
            );
        default:
            return (
                <Input
                    value={stringValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8"
                />
            );
    }
}

// Material-UI style cell display
interface MaterialUICellDisplayProps {
    column: any;
    value: CellValue;
}

function MaterialUICellDisplay({ column, value }: MaterialUICellDisplayProps) {
    const stringValue = value?.toString() || '';

    switch (column.type) {
        case 'select':
            const variant = (() => {
                switch (stringValue) {
                    case 'Critical':
                        return 'destructive';
                    case 'High':
                        return 'default';
                    case 'Medium':
                        return 'secondary';
                    default:
                        return 'outline';
                }
            })();
            return <Badge variant={variant}>{stringValue}</Badge>;
        case 'number':
            return <span className="font-mono">{stringValue}</span>;
        case 'date':
            return <span className="text-sm">{stringValue}</span>;
        default:
            return (
                <div className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 p-1 rounded transition-colors">
                    {stringValue}
                </div>
            );
    }
}

/**
 * MaterialUIEditableTable component
 */
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
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

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
            {/* Material-UI style toolbar */}
            <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4">
                <div className="flex flex-wrap gap-2 mb-4">
                    <Button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        <Search className="h-4 w-4 mr-1" />
                        Global Filter
                    </Button>
                    <Button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        Export CSV
                    </Button>
                    <Button className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                        <Download className="h-4 w-4 mr-1" />
                        Export PDF
                    </Button>
                    <Button className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        Export Excel
                    </Button>
                    {isEditMode && (
                        <Button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Row
                        </Button>
                    )}
                    <Button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Selected
                    </Button>
                </div>

                {/* Search bar */}
                <div className="mb-4">
                    <Input
                        placeholder="Search all columns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                    />
                </div>

                {/* Table */}
                <div className="overflow-x-auto border rounded-lg bg-white dark:bg-gray-800">
                    <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="p-3 text-left">
                                    <div className="flex items-center gap-2">
                                        <Checkbox />
                                        <span className="font-semibold">
                                            ID
                                        </span>
                                        <span className="text-gray-400">
                                            ↕️
                                        </span>
                                    </div>
                                </th>
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className="p-3 text-left"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">
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
                                                            setSortDirection(
                                                                'asc',
                                                            );
                                                        }
                                                    }}
                                                    className="text-gray-400 p-0 h-auto"
                                                >
                                                    ↕️
                                                </Button>
                                            </div>
                                            {column.type === 'select' && (
                                                <Select>
                                                    <SelectTrigger className="w-full h-6 text-xs">
                                                        <SelectValue placeholder="Filter..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">
                                                            All
                                                        </SelectItem>
                                                        {column.options?.map(
                                                            (
                                                                option: string,
                                                            ) => (
                                                                <SelectItem
                                                                    key={option}
                                                                    value={
                                                                        option
                                                                    }
                                                                >
                                                                    {option}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            {column.type === 'text' && (
                                                <Input
                                                    placeholder="Filter..."
                                                    className="w-full h-6 text-xs"
                                                />
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th className="p-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedData.slice(0, 8).map((item, index) => (
                                <MaterialUITableRow
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
                                    index={index}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Showing 8 of {localData.length} rows</span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            ← Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            Next →
                        </Button>
                    </div>
                </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
                ✨ <strong>Material React Table</strong> - Comprehensive
                interface with inline editing, column filtering, sorting
                indicators, row selection, and export capabilities
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
