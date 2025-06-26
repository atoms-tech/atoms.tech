'use client';

// EditableTable Component (with optional Glide rendering)
// Features:
// - Toggle between classic HTML table and Glide Data Grid
// - Auto-save on blur and edit exit
// - Keyboard navigation, sort, filter
// - Role-based permissions, Supabase integration

import { useParams } from 'next/navigation';
import * as React from 'react';
import { useCallback, useEffect, useReducer } from 'react';

import { Table, TableBody } from '@/components/ui/table';
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
import { GlideEditableGrid } from './GlideEditableGrid';

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
    useGlide = true, // NEW TOGGLE FLAG
}: EditableTableProps<T> & { useGlide?: boolean }) {
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
        itemToDelete,
        deleteConfirmOpen,
        selectedCell,
    } = state;

    //const [isHoveringTable, setIsHoveringTable] = useState(false);
    const { sortedData, handleSort } = useTableSort(data, sortKey);
    const { user } = useUser();
    const userId = user?.id || '';
    const params = useParams();
    const projectId = params?.projectId || '';
    const tableRef = React.useRef<HTMLDivElement>(null);

    const savePendingChanges = useCallback(async () => {
        if (!onSave || !editingData) return;
        const modifiedItems = Object.entries(editingData).filter(([id, item]) => {
            if (id === 'new') return false;
            const originalItem = data.find((d) => d.id === id);
            return originalItem && Object.keys(item).some(key => item[key] !== originalItem[key]);
        });
        if (modifiedItems.length === 0) return;
        for (const [_id, item] of modifiedItems) {
            try {
                await onSave(item, false);
            } catch (error) {
                console.error(`Failed to save item ${_id}:`, error);
            }
        }
        if (onPostSave) await onPostSave();
    }, [editingData, onSave, data, onPostSave]);

    const handleTableBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
        if (isEditMode && tableRef.current && !tableRef.current.contains(e.relatedTarget as Node)) {
            savePendingChanges();
        }
    }, [isEditMode, savePendingChanges]);

    const rolePermissions = React.useMemo(() => ({
        owner: ['editTable', 'deleteRow', 'addRow'],
        admin: ['editTable', 'deleteRow', 'addRow'],
        maintainer: ['editTable', 'deleteRow', 'addRow'],
        editor: ['editTable', 'deleteRow', 'addRow'],
        viewer: [''],
    }), []);

    const canPerformAction = useCallback(async (action: string) => {
        const { data } = await supabase
            .from('project_members')
            .select('role')
            .eq('user_id', userId)
            .eq('project_id', Array.isArray(projectId) ? projectId[0] : projectId)
            .single();
        const role = data?.role || 'viewer';
        return rolePermissions[role].includes(action);
    }, [userId, projectId, rolePermissions]);

    useEffect(() => {
        if (isEditMode && data.length > 0) {
            const initialEditData = data.reduce((acc, item) => {
                if (item.id) acc[item.id as string] = { ...item };
                return acc;
            }, {} as Record<string, T>);
            dispatch({ type: 'SET_INITIAL_EDIT_DATA', payload: initialEditData });
        } else if (!isEditMode) {
            dispatch({ type: 'RESET_EDIT_STATE' });
        }
    }, [isEditMode, data]);

    useEffect(() => {
        if (!isEditMode) savePendingChanges();
    }, [isEditMode, savePendingChanges]);

    useEffect(() => () => dispatch({ type: 'RESET_EDIT_STATE' }), []);

    const handleCellChange = useCallback((rowId: string, columnId: string, newValue: CellValue) => {
        if (!isEditMode) return;
        const item = editingData[rowId] || data.find((d) => d.id === rowId);
        if (!item) return;
        dispatch({ type: 'UPDATE_EDITING_DATA', payload: { rowId, columnId, value: newValue } });
    }, [isEditMode, editingData, data]);

    const typeSafeHandleCellChange = useCallback((itemId: string, accessor: keyof T, value: CellValue) => {
        handleCellChange(itemId, accessor as string, value);
    }, [handleCellChange]);

    const handleAddNewRow = useCallback(async () => {
        const canAdd = await canPerformAction('addRow');
        if (!canAdd) return;
        const newItem = columns.reduce((acc, col) => {
            acc[col.accessor as keyof T] = null as T[keyof T];
            return acc;
        }, {} as T);
        newItem.id = 'new';
        dispatch({ type: 'SET_INITIAL_EDIT_DATA', payload: { ...editingData, new: newItem } });
        dispatch({ type: 'START_ADD_ROW' });
    }, [canPerformAction, columns, editingData]);

    const handleSaveNewRow = useCallback(async () => {
        const newItem = editingData['new'];
        if (!newItem || !onSave) return;
        const { id: _tempId, ...itemWithoutId } = newItem;
        await onSave(itemWithoutId as T, true);
        if (onPostSave) await onPostSave();
        dispatch({ type: 'CANCEL_ADD_ROW' });
    }, [editingData, onSave, onPostSave]);

    const handleCancelNewRow = useCallback(() => {
        dispatch({ type: 'CANCEL_ADD_ROW' });
    }, []);

    const handleDeleteClick = useCallback(async (item: T) => {
        const canDelete = await canPerformAction('deleteRow');
        if (!canDelete) return;
        dispatch({ type: 'OPEN_DELETE_CONFIRM', payload: item });
    }, [canPerformAction]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!itemToDelete || !onDelete) return;
        await onDelete(itemToDelete);
        dispatch({ type: 'CLOSE_DELETE_CONFIRM' });
    }, [itemToDelete, onDelete]);

    const glideColumns = columns.map((col) => ({
    accessor: col.accessor,
    title: col.header ?? col.accessor, // fallback if no header
    width: col.width,
    }));

    const displayedData = isEditMode ? Object.values(editingData) : sortedData;

    if (isLoading) {
        return <TableLoadingSkeleton columns={columns.length} />;
    }

    // ✅ GLIDE VERSION
    if (useGlide) {
        return (
            <div className="w-full">
                {showFilter && (
                    <TableControls
                        filterComponent={filterComponent}
                        showFilter={showFilter}
                        onNewRow={handleAddNewRow}
                        onEnterEditMode={() => {}}
                        isVisible={true}
                        orgId=""
                        projectId=""
                        documentId=""
                    />
                )}
                <GlideEditableGrid
                    data={displayedData}
                    columns={glideColumns}
                    onCellChange={typeSafeHandleCellChange}
                    //onBlur={handleTableBlur}
                    isEditMode={isEditMode}
                    showFilter={showFilter}
                    filterComponent={filterComponent}
                    onAddRow={handleAddNewRow}
                    onSaveNewRow={handleSaveNewRow}
                    onCancelNewRow={handleCancelNewRow}
                    isAddingNew={isAddingNew}
                />
                <DeleteConfirmDialog
                    open={deleteConfirmOpen}
                    onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DELETE_CONFIRM' })}
                    onConfirm={handleDeleteConfirm}
                />
            </div>
        );
    }

    // ✅ ORIGINAL TABLE FALLBACK
    return (
        <div className="w-full">
            {showFilter && (
                <TableControls
                    filterComponent={filterComponent}
                    showFilter={showFilter}
                    onNewRow={handleAddNewRow}
                    onEnterEditMode={() => {}}
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
                <div style={{ minWidth: '100%', maxWidth: '1000px', width: 'max-content' }}>
                    <Table>
                        <TableHeader
                            columns={columns}
                            sortKey={sortKey}
                            sortOrder={sortOrder}
                            onSort={handleSort}
                            isEditMode={isEditMode}
                        />
                        <TableBody>
                            {sortedData.map((item, rowIndex) => (
                                <DataTableRow
                                    key={item.id}
                                    item={item}
                                    columns={columns}
                                    isEditing={isEditMode && !isAddingNew}
                                    editingData={editingData}
                                    onCellChange={typeSafeHandleCellChange}
                                    onDelete={handleDeleteClick}
                                    onHoverCell={() => {}}
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
                            {isAddingNew && (
                                <NewRowForm
                                    columns={columns}
                                    editingData={editingData}
                                    onCellChange={typeSafeHandleCellChange}
                                    onSave={handleSaveNewRow}
                                    onCancel={handleCancelNewRow}
                                />
                            )}
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
            <DeleteConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DELETE_CONFIRM' })}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}