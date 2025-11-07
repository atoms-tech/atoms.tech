'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import '@/styles/globals.css';

// We still need to validate role perms so readers cannot edit, ect.

import DataEditor, {
    CompactSelection,
    DataEditorRef,
    GridCell,
    GridCellKind,
    GridColumn,
    GridSelection,
    // CompactSelection,
    //GridDragEventArgs,
    Item,
    NumberCell,
    Rectangle,
    TextCell,
} from '@glideapps/glide-data-grid';
import {
    DatePickerCell,
    DropdownCell,
    DropdownCellType,
    MultiSelectCell,
    allCells,
} from '@glideapps/glide-data-grid-cells';
import { useTheme } from 'next-themes';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import FixedDropdownCell from './glideCells/dropdown-cell';
import FixedMultiSelectCell from './glideCells/multi-select-cell';
import { glideDarkTheme } from './glideDarkTheme';
import { glideLightTheme } from './glideLightTheme';

import '@glideapps/glide-data-grid/dist/index.css';

import debounce from 'lodash/debounce';
import { useParams } from 'next/navigation';
import { useLayer } from 'react-laag';

//import { RequirementAiAnalysis } from '@/types/base/requirements.types';
import {
    BlockTableMetadata,
    useBlockMetadataActions,
} from '@/components/custom/BlockCanvas/hooks/useBlockMetadataActions';
import { useColumnActions } from '@/components/custom/BlockCanvas/hooks/useColumnActions';
// import { DynamicRequirement } from '@/components/custom/BlockCanvas/hooks/useRequirementActions';
import { PropertyType } from '@/components/custom/BlockCanvas/types';
import { useUser } from '@/lib/providers/user.provider';

import { DeleteConfirmDialog, TableControls, TableLoadingSkeleton } from './components';
import { AddColumnDialog } from './components/AddColumnDialog';
import { RenameColumnDialog } from './components/RenameColumnDialog';
import { useGlideCopy } from './hooks/useGlideCopy';
import { usePeopleOptions } from './hooks/usePeopleOptions';
import {
    BaseRow /*CellValue,*/,
    EditableColumn,
    EditableColumnType,
    GlideTableProps,
    PropertyConfig,
} from './types';

// define default columns that cannot be renamed
const SYSTEM_COLUMNS = [
    'external_id',
    'name',
    'description',
    'status',
    'priority',
    'assignee',
];

const isSystemColumn = (columnHeader: string): boolean => {
    return SYSTEM_COLUMNS.includes(columnHeader.toLowerCase());
};

// import { /*CellValue,*/ GlideTableProps } from './types';
// import { ChartNoAxesColumnDecreasingIcon } from 'lucide-react';
// import { table } from 'console';
// import { string } from 'zod';

export function GlideEditableTable<T extends BaseRow = BaseRow>(
    props: GlideTableProps<T>,
) {
    const { resolvedTheme } = useTheme();

    const {
        data,
        columns,
        //onCellChange,
        onSave,
        onPostSave,
        //onBlur,
        isEditMode = false,
        showFilter = false,
        filterComponent,
        onAddRow,
        //onSaveNewRow,
        //onCancelNewRow,
        //isAddingNew = false,
        //deleteConfirmOpen = false,
        //onDeleteConfirm,
        //onDeleteColumn,
        //setDeleteConfirmOpen,
        isLoading = false,
        blockId,
        dataAdapter,
        onDelete,
        rowMetadataKey,
        rowDetailPanel,
        tableMetadata, // Use to detect table kind as a fallback
    } = props;

    const [selection, setSelection] = useState<GridSelection | undefined>(undefined);
    const selectionRef = useRef<GridSelection | undefined>(undefined);
    const isPastingRef = useRef(false);
    const pasteOperationIdRef = useRef(0);

    const tableRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<DataEditorRef | null>(null);
    const lastEditedCellRef = useRef<Item | undefined>(undefined);
    const isEditingCellRef = useRef<boolean>(false);

    const lastSelectedCellRef = useRef<Item | undefined>(undefined);

    const recentlyPastedRowsRef = useRef<Set<string>>(new Set());
    const pasteOperationActiveRef = useRef<boolean>(false);
    const onCellEditedRef = useRef<((cell: Item, newValue: GridCell) => void) | null>(
        null,
    );

    const prevEditModeRef = useRef<boolean>(isEditMode);
    const isSavingRef = useRef(false);
    const deletedRowIdsRef = useRef<Set<string>>(new Set());
    const deletedColumnIdsRef = useRef<Set<string>>(new Set());

    // Get user site profile info for saves.
    const { profile } = useUser();
    const userId = profile?.id;
    const userName = profile?.full_name || '';

    const { updateBlockMetadata } = useBlockMetadataActions();
    // Wrapper persistence functions to support adapter or fallback props
    const saveRow = useCallback(
        async (item: T, isNew: boolean) => {
            if (dataAdapter) {
                await dataAdapter.saveRow(item, isNew, blockId ? { blockId } : undefined);
            } else {
                await onSave?.(item, isNew, userId, userName);
            }
        },
        [dataAdapter, blockId, onSave, userId, userName],
    );

    const deleteRow = useCallback(
        async (item: T) => {
            if (dataAdapter?.deleteRow) {
                await dataAdapter.deleteRow(item, blockId ? { blockId } : undefined);
            } else {
                await onDelete?.(item);
            }
        },
        [dataAdapter, blockId, onDelete],
    );

    const refreshAfterSave = useCallback(async () => {
        if (dataAdapter?.postSaveRefresh) {
            await dataAdapter.postSaveRefresh();
        } else {
            await onPostSave?.();
        }
    }, [dataAdapter, onPostSave]);

    //const [columnToDelete, setColumnToDelete] = useState<{ id: string; blockId: string } | null>(null);
    const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    // column rename dialog state
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [columnToRename, setColumnToRename] = useState<{
        id: string;
        currentName: string;
    } | null>(null);

    // Optional row detail panel state
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
    const [isRowDetailOpen, setIsRowDetailOpen] = useState(false);

    // undo/redo history management
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const historyRef = useRef<
        Array<{
            type:
                | 'cell_edit'
                | 'row_add'
                | 'row_delete'
                | 'column_move'
                | 'column_resize'
                | 'row_move';
            timestamp: number;
            data: {
                // for cell edits
                rowId?: string;
                accessor?: keyof T;
                oldValue?: any;
                newValue?: any;
                // for row operations
                rows?: T[];
                rowIndices?: number[];
                // for column operations
                columns?: typeof localColumns;
                oldColumnState?: typeof localColumns;
                newColumnState?: typeof localColumns;
                // for position changes
                from?: number;
                to?: number;
            };
        }>
    >([]);

    // track if we're currently performing an undo/redo to prevent recording it
    const isUndoingRef = useRef(false);

    // helper to add action to history
    const addToHistory = useCallback(
        (action: (typeof historyRef.current)[0]) => {
            // don't record history during undo/redo operations
            if (isUndoingRef.current) return;

            // trim history if we're not at the end (user made edits after undoing)
            if (historyIndex < historyRef.current.length - 1) {
                historyRef.current = historyRef.current.slice(0, historyIndex + 1);
            }

            // add new action
            historyRef.current.push(action);

            // limit history size to prevent memory issues (keep last 100 actions)
            if (historyRef.current.length > 100) {
                historyRef.current = historyRef.current.slice(-100);
            }

            // update index to point to latest action
            setHistoryIndex(historyRef.current.length - 1);

            console.debug(
                '[History] Added action:',
                action.type,
                'New length:',
                historyRef.current.length,
            );
        },
        [historyIndex],
    );

    // useEffect(() => {
    //     console.debug('[GlideEditableTable] Received tableMetadata:', tableMetadata);
    // }, [tableMetadata]);

    const [editingData, setEditingData] = useState<Record<string, Partial<T>>>({});
    // Ref to refresh editing data when autosave evaluated.
    const editingDataRef = useRef(editingData);
    useEffect(() => {
        editingDataRef.current = editingData;
    }, [editingData]);

    const handleSaveAll = useCallback(async () => {
        if (isSavingRef.current) {
            return;
        }

        isSavingRef.current = true;

        try {
            const currentEdits = editingDataRef.current;
            const rows = Object.entries(currentEdits);

            if (rows.length === 0) {
                return;
            }

            // Get current column configuration to ensure we save with correct property names
            const currentColumns = localColumnsRef.current;

            for (const [rowId, changes] of rows) {
                const originalItem = data.find((d) => d.id === rowId);
                if (!originalItem) {
                    continue;
                }

                // Remap changes to use current column names
                const remappedChanges: any = {};
                Object.entries(changes).forEach(([key, value]) => {
                    // Find if this key matches any column's current accessor
                    const column = currentColumns.find(
                        (col) => col.accessor === key || col.header === key,
                    );
                    if (column) {
                        // Use the current header/accessor name
                        remappedChanges[column.header] = value;
                    } else {
                        // Keep as is if no matching column
                        remappedChanges[key] = value;
                    }
                });

                const fullItem: T = { ...originalItem, ...remappedChanges };
                await saveRow(fullItem, false);
            }

            await refreshAfterSave();

            // Clear buffer after successful save
            await new Promise((r) => setTimeout(r, 250));
            setEditingData({});
        } catch (error) {
            console.error('[handleSaveAll] Error:', error);
        } finally {
            isSavingRef.current = false;
        }
    }, [refreshAfterSave, data, saveRow]);

    // Debounce saves, should be abstracted to table props and switched off when realtime collaboration enabled.
    const useDebouncedSave = (delay = 5000) => {
        const debounced = useRef(
            debounce(() => {
                void handleSaveAllRef.current?.();
                void saveTableMetadataRef.current?.();
            }, delay),
        );

        useEffect(() => {
            const d = debounced.current;
            return () => d.cancel(); // cleanup on unmount
        }, []);

        return debounced.current;
    };

    const debouncedSave = useDebouncedSave();

    const [_tableWidth, setTableWidth] = useState<number>(0);

    useEffect(() => {
        const handleResize = () => {
            if (tableRef.current) {
                setTableWidth(tableRef.current.offsetWidth);
            }
        };

        handleResize(); // run immediately on mount
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const params = useParams();
    const orgId = params?.orgId || '';
    const projectId = params?.projectId || '';
    const documentId = params?.documentId || '';

    if (!orgId) {
        console.error('Project ID is missing from the URL.');
    }

    if (!projectId) {
        console.error('Project ID is missing from the URL.');
    }

    if (!documentId) {
        console.error('Project ID is missing from the URL.');
    }

    // Column actions for creating columns
    const { createPropertyAndColumn, createColumnFromProperty, appendPropertyOptions } =
        useColumnActions({
            orgId: String(orgId),
            projectId: String(projectId),
            documentId: String(documentId),
        });

    // Preload people options to inject into people columns
    const { data: peopleNames = [] } = usePeopleOptions(
        String(orgId) || undefined,
        String(projectId) || undefined,
    );

    // Normalize columns to use `title` instead of `header` if needed
    const normalizedColumns = useMemo(() => {
        return columns.map((col) => ({
            ...col,
            title: col.header, // map header to title
        }));
    }, [columns]);

    // use blockId as part of the state key to ensure isolation
    const [localColumns, setLocalColumns] = useState(() => {
        // always start fresh with the provided columns for this specific block
        const sorted = [...normalizedColumns].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0),
        );
        return sorted.map((col, index) => ({
            ...col,
            position: col.position !== undefined ? col.position : index,
        }));
    });

    // force reset when blockId changes (completely new table)
    const prevBlockIdRef = useRef(blockId);
    useEffect(() => {
        if (blockId && blockId !== prevBlockIdRef.current) {
            console.log('[GlideEditableTable] Block ID changed, resetting columns', {
                oldBlockId: prevBlockIdRef.current,
                newBlockId: blockId,
            });

            // completely reset to incoming columns only
            const sorted = [...normalizedColumns].sort(
                (a, b) => (a.position ?? 0) - (b.position ?? 0),
            );
            setLocalColumns(
                sorted.map((col, index) => ({
                    ...col,
                    position: col.position !== undefined ? col.position : index,
                })) as typeof localColumns,
            );

            prevBlockIdRef.current = blockId;
        }
    }, [blockId, normalizedColumns]);

    const localColumnsRef = useRef(localColumns);
    useEffect(() => {
        localColumnsRef.current = localColumns;
    }, [localColumns]);

    const [localData, setLocalData] = useState<T[]>(() => [...data]);

    const [colSizes, setColSizes] = useState<Partial<Record<keyof T, number>>>({});

    const columnDefs: GridColumn[] = useMemo(
        () =>
            localColumns.map((col, idx) => ({
                title: col.title,
                width: colSizes[col.accessor] || col.width || 120,
                hasMenu: true,
                menuIcon: 'dots',
                trailingRowOptions:
                    idx === 0
                        ? {
                              hint: 'Add Row',
                              addIcon: 'plus',
                              targetColumn: 0,
                          }
                        : undefined,
            })),
        [localColumns, colSizes],
    );

    // Sort localData by metadata position key.
    const sortedData = useMemo(() => {
        return [...localData]
            .filter((row) => !deletedRowIdsRef.current.has(row.id))
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }, [localData]);

    const sortedDataRef = useRef<T[]>([]);
    useEffect(() => {
        sortedDataRef.current = sortedData;
    }, [sortedData]);

    // For optional row detail panel
    const selectedRow = useMemo(() => {
        return sortedData.find((r) => r.id === selectedRowId) || null;
    }, [sortedData, selectedRowId]);

    // Row deletion and selection tracking logic
    const [gridSelection, setGridSelection] = useState<GridSelection>({
        rows: CompactSelection.empty(),
        columns: CompactSelection.empty(),
    });
    const [rowDeleteConfirmOpen, setRowDeleteConfirmOpen] = useState(false);
    const [rowsToDelete, setRowsToDelete] = useState<T[]>([]);

    // track grid selection changes and remember last selected cell
    const handleGridSelectionChange = useCallback((newSelection: GridSelection) => {
        setGridSelection(newSelection);

        // store the current selected cell for paste operations
        if (newSelection?.current?.cell) {
            lastSelectedCellRef.current = newSelection.current.cell;
            console.debug('[Selection] Updated last selected cell:', {
                col: newSelection.current.cell[0],
                row: newSelection.current.cell[1],
            });
        }
    }, []);

    const [columnMenu, setColumnMenu] = useState<
        | {
              colIndex: number;
              bounds: Rectangle;
          }
        | undefined
    >(undefined);

    // Add Column dialog state
    const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false);
    const [pendingInsertIndex, setPendingInsertIndex] = useState<number | null>(null);

    const { renderLayer, layerProps } = useLayer({
        isOpen: columnMenu !== undefined,
        auto: true,
        placement: 'bottom-end',
        triggerOffset: 2,

        trigger: {
            getBounds: () => ({
                left: columnMenu?.bounds.x ?? 0,
                top: columnMenu?.bounds.y ?? 0,
                width: columnMenu?.bounds.width ?? 0,
                height: columnMenu?.bounds.height ?? 0,
                right: (columnMenu?.bounds.x ?? 0) + (columnMenu?.bounds.width ?? 0),
                bottom: (columnMenu?.bounds.y ?? 0) + (columnMenu?.bounds.height ?? 0),
            }),
        },

        onOutsideClick: () => setColumnMenu(undefined),
    });

    useEffect(() => {
        console.debug('[GlideEditableTable] Sorted Data:', sortedData);
    }, [sortedData]);

    // Needs to be validated, I don't think change checks properly catch changed.
    // So may be called more often then needed. Harmless but wasteful and may cause issues with concurrent editing.
    const saveTableMetadata = useCallback(async () => {
        if (!blockId) return;

        const latestLocalColumns = localColumnsRef.current;
        const latestSortedData = sortedDataRef.current;

        const columnMetadata = latestLocalColumns.map((col, idx) => ({
            columnId: col.id,
            position: col.position !== undefined ? col.position : idx, // use existing position if available
            name: col.header, // always include the column name in metadata
            ...(col.width !== undefined ? { width: col.width } : {}),
        }));

        const rowMetadataRows = latestSortedData.map((row, idx) => ({
            rowId: row.id,
            position: idx,
            ...(row.height !== undefined ? { height: row.height } : {}),
        }));

        const rowMetadataRequirements = latestSortedData.map((row, idx) => ({
            requirementId: row.id,
            position: idx,
            ...(row.height !== undefined ? { height: row.height } : {}),
        }));

        const originalColumnState = columns
            .map((col) => ({
                id: col.id,
                position: col.position ?? 0,
                width: col.width ?? undefined,
            }))
            .sort((a, b) => a.position - b.position);

        const currentColumnState = columnMetadata
            .map(({ columnId, position, width }) => ({
                id: columnId,
                position,
                width,
            }))
            .sort((a, b) => a.position - b.position);

        const isColumnMetadataChanged =
            originalColumnState.length !== currentColumnState.length ||
            originalColumnState.some((col, idx) => {
                const curr = currentColumnState[idx];
                return (
                    col.id !== curr.id ||
                    col.position !== curr.position ||
                    (col.width ?? null) !== (curr.width ?? null)
                );
            });

        // Always assume row position/height may change
        const hasRowChanges = true;

        if (!isColumnMetadataChanged && !hasRowChanges) {
            console.debug(
                '[GlideEditableTable] No metadata changes detected. Skipping save.',
            );
            return;
        }

        try {
            const isGeneric =
                rowMetadataKey === 'rows' ||
                (tableMetadata as unknown as { tableKind?: string })?.tableKind ===
                    'genericTable';

            const metadataToSave: Partial<BlockTableMetadata> = {
                columns: columnMetadata,
                ...(isGeneric
                    ? { rows: rowMetadataRows }
                    : { requirements: rowMetadataRequirements }),
                tableKind: isGeneric ? 'genericTable' : 'requirements',
            };

            await updateBlockMetadata(blockId, metadataToSave);
            console.debug(
                '[GlideEditableTable] Saved combined row + column metadata:',
                metadataToSave,
            );
        } catch (err) {
            console.error(
                '[GlideEditableTable] Failed to save combined table metadata:',
                err,
            );
        }
    }, [blockId, columns, updateBlockMetadata, rowMetadataKey]);

    // References to latest version of save methods. Fixes stale reference when editing data on a newly added column.
    const handleSaveAllRef = useRef(handleSaveAll);
    useEffect(() => {
        handleSaveAllRef.current = handleSaveAll;
    }, [handleSaveAll]);

    const saveTableMetadataRef = useRef(saveTableMetadata);
    useEffect(() => {
        saveTableMetadataRef.current = saveTableMetadata;
    }, [saveTableMetadata]);

    // Check DB sync, reset local edit refs.
    useEffect(() => {
        // If all deleted IDs are missing from incoming data, assume server is up to date.
        const incomingIds = new Set(data.map((r) => r.id));
        const allDeletedSynced = [...deletedRowIdsRef.current].every(
            (id) => !incomingIds.has(id),
        );

        if (allDeletedSynced) {
            deletedRowIdsRef.current.clear();
            //console.debug('[GlideEditableTable] Cleared deletedRowIdsRef after DB sync.');
        }

        // If all deleted IDs are missing from incoming columns, assume synced
        const incomingColumnIds = new Set(columns.map((c) => c.id));
        const allDeletedColumnsSynced = [...deletedColumnIdsRef.current].every(
            (id) => !incomingColumnIds.has(id),
        );

        if (allDeletedColumnsSynced) {
            deletedColumnIdsRef.current.clear();
            //console.debug('[GlideEditableTable] Cleared deletedColumnIdsRef after DB sync.');
        }
    }, [columns, data]);

    // watch for changes in columns from database and sync w local state
    useEffect(() => {
        // skip if this is initial mount
        if (localColumns.length === 0 && columns.length > 0) {
            const normalized = columns.map((col) => ({
                ...col,
                title: col.header,
            }));
            const sorted = [...normalized].sort(
                (a, b) => (a.position ?? 0) - (b.position ?? 0),
            );
            // ensure the type matches localColumns
            setLocalColumns(sorted as typeof localColumns);
            return;
        }

        // only sync if we have actual structural changes (columns added/removed)
        const localIds = new Set(localColumns.map((c) => c.id));
        const incomingIds = new Set(columns.map((c) => c.id));

        const hasNewColumns = [...incomingIds].some((id) => !localIds.has(id));
        const hasRemovedColumns = [...localIds].some((id) => !incomingIds.has(id));

        if (hasNewColumns || hasRemovedColumns) {
            console.log(
                '[GlideEditableTable] Structural change detected, syncing columns',
            );
            const normalized = columns.map((col) => ({
                ...col,
                title: col.header,
            }));
            const sorted = [...normalized].sort(
                (a, b) => (a.position ?? 0) - (b.position ?? 0),
            );
            // ensure the type matches localColumns
            setLocalColumns(sorted as typeof localColumns);
        }
        // if no structural changes, keep local state (preserves renames)
    }, [columns.length]); // only depend on length to detect structural changes

    // Track if a manual row reorder is in progress to avoid remote overwrite
    const isReorderingRef = useRef(false);

    // sync incoming database data with local state
    useEffect(() => {
        // prevent sync during active operations
        if (isPastingRef.current || pasteOperationActiveRef.current) {
            console.debug('[Data Sync] Skipping - paste in progress');
            return;
        }
        if (isSavingRef.current) {
            console.debug('[Data Sync] Skipping - save in progress');
            return;
        }

        // add a delay to let operations complete
        const syncTimer = setTimeout(() => {
            // double-check paste isn't active after delay
            if (isPastingRef.current || pasteOperationActiveRef.current) {
                console.debug('[Data Sync] Skipping after delay - paste now active');
                return;
            }

            setLocalData((prev) => {
                console.debug('[Data Sync] Starting sync', {
                    incomingCount: data.length,
                    localCount: prev.length,
                });

                if (data.length === 0) {
                    return prev;
                }

                // If user just reordered rows, avoid overwriting local order until save completes
                if (isReorderingRef.current) {
                    console.debug('[Data Sync] Skipping - local reordering in progress');
                    return prev;
                }

                const needsUpdate =
                    data.length !== prev.length ||
                    !data.every((row, index) => {
                        const localRow = prev[index];
                        return localRow && row.id === localRow.id;
                    });

                // Merge pending edits into incoming data to avoid overwriting user changes
                const pendingEdits = editingDataRef.current || {};
                const hasPendingEdits = Object.keys(pendingEdits).length > 0;
                const mergedFromServerOrder = data.map((row) =>
                    pendingEdits[row.id]
                        ? ({ ...row, ...(pendingEdits[row.id] as Partial<T>) } as T)
                        : row,
                );

                // Detect pure order change: same IDs as prev but different sequence
                const sameIdSet = (() => {
                    if (data.length !== prev.length) return false;
                    const a = new Set<string>(data.map((r: any) => r.id));
                    for (const r of prev as any[]) if (!a.has(r.id)) return false;
                    return true;
                })();

                if (sameIdSet && (needsUpdate || hasPendingEdits)) {
                    // Preserve local order; only update row contents from server and pending edits
                    const incomingById = new Map<string, T>(
                        mergedFromServerOrder.map((r: any) => [r.id as string, r]),
                    );
                    const mergedPreservingOrder = (prev as any[]).map((r, idx) => {
                        const incoming = incomingById.get(r.id);
                        // Keep the local position/order when rehydrating data
                        return incoming
                            ? ({ ...incoming, position: r.position } as T)
                            : (r as T);
                    });
                    console.debug(
                        '[Data Sync] Applying merged data preserving local order',
                    );
                    return mergedPreservingOrder;
                }

                if (needsUpdate || hasPendingEdits) {
                    console.debug(
                        '[Data Sync] Applying merged data (server + pending edits)',
                    );
                    return mergedFromServerOrder;
                }

                console.debug('[Data Sync] No changes needed - already in sync');
                return prev;
            });
        }, 200); // 200ms delay

        // cleanup timer on unmount or dependency change
        return () => clearTimeout(syncTimer);
    }, [data]);

    const handleColumnResize = useCallback(
        (col: GridColumn, newSize: number) => {
            setColSizes((prev) => {
                const updated = { ...prev };
                const target = localColumns.find((c) => c.title === col.title);
                if (target) {
                    updated[target.accessor] = newSize;
                }
                return updated;
            });

            setLocalColumns((prev) => {
                const updated = prev.map((c) =>
                    c.title === col.title ? { ...c, width: newSize } : c,
                );

                debouncedSave(); // call debounced save w updated columns
                return updated;
            });

            // Force grid to recalculate row heights after column resize
            // Ensures text wrapping adjusts properly to new column width
            // Triggers dynamic reflow of wrapped text with unlimited wrapping
            setTimeout(() => {
                if (gridRef.current) {
                    // Update all cells to trigger row height recalculation
                    gridRef.current.updateCells(
                        sortedData.map((_, rowIndex) => ({ cell: [0, rowIndex] })),
                    );
                    // Force a repaint to ensure smooth animation
                    gridRef.current.updateCells([]);
                }
            }, 50);
        },
        [debouncedSave, localColumns, sortedData],
    );

    const handleColumnMoved = useCallback(
        (startIndex: number, endIndex: number) => {
            const oldState = [...localColumns];

            setLocalColumns((prevCols) => {
                const updated = [...prevCols];
                const [moved] = updated.splice(startIndex, 1);
                updated.splice(endIndex, 0, moved);

                const reindexed = updated.map((col, i) => ({
                    ...col,
                    position: i,
                }));

                // record in history (if not undoing)
                if (!isUndoingRef.current) {
                    addToHistory({
                        type: 'column_move',
                        timestamp: Date.now(),
                        data: {
                            oldColumnState: oldState,
                            newColumnState: reindexed,
                            from: startIndex,
                            to: endIndex,
                        },
                    });
                }

                return reindexed;
            });

            debouncedSave(); // Trigger debounced save on column metadata change
        },
        [debouncedSave, localColumns, addToHistory],
    );

    const getCellContent = useCallback(
        (cell: Item): GridCell => {
            const [col, row] = cell;

            // Ensure column exists
            const column = localColumns[col];
            if (!column) {
                console.warn(`[getCellContent] Column at index ${col} not found`);
                return {
                    kind: GridCellKind.Text,
                    allowOverlay: false,
                    data: '',
                    displayData: '',
                } as TextCell;
            }

            const rowData = sortedData[row];
            if (!rowData) {
                return {
                    kind: GridCellKind.Text,
                    allowOverlay: false,
                    data: '',
                    displayData: '',
                } as TextCell;
            }

            const value = rowData?.[column.accessor];
            const columnOptions = Array.isArray(column.options) ? column.options : [];

            switch (column.type) {
                case 'people': {
                    const stringValue = Array.isArray(value)
                        ? value.join(', ')
                        : String(value ?? '');
                    const options = peopleNames.length > 0 ? peopleNames : columnOptions;
                    return {
                        kind: GridCellKind.Custom,
                        allowOverlay: isEditMode,
                        copyData: stringValue,
                        data: {
                            kind: 'people-cell',
                            value: stringValue,
                            allowedValues: options,
                        },
                    } as GridCell;
                }
                case 'multi_select': {
                    const values = Array.isArray(value)
                        ? (value as string[])
                        : value
                          ? [String(value)]
                          : [];
                    const options = columnOptions;

                    return {
                        kind: GridCellKind.Custom,
                        allowOverlay: isEditMode,
                        copyData: values.join(', '),
                        data: {
                            kind: 'multi-select-cell',
                            values,
                            options,
                            allowCreation: false,
                            allowDuplicates: false,
                        },
                    } as GridCell;
                }
                case 'select': {
                    const stringValue = typeof value === 'string' ? value : '';
                    const options = columnOptions;

                    return {
                        kind: GridCellKind.Custom,
                        allowOverlay: isEditMode,
                        copyData: stringValue,
                        data: {
                            kind: 'dropdown-cell',
                            value: stringValue,
                            allowedValues: options,
                        },
                    } as GridCell;
                }
                case 'number': {
                    const num =
                        typeof value === 'number'
                            ? value
                            : value != null && value !== ''
                              ? Number(value)
                              : null;
                    const safe = Number.isFinite(num as number) ? (num as number) : null;
                    return {
                        kind: GridCellKind.Number,
                        allowOverlay: isEditMode,
                        data: safe,
                        displayData: safe != null ? String(safe) : '',
                    } as NumberCell;
                }
                case 'date': {
                    let dateVal: Date | null = null;
                    if (value instanceof Date) {
                        dateVal = Number.isNaN(value.getTime()) ? null : value;
                    } else if (typeof value === 'string' && value) {
                        const parsed = new Date(value);
                        if (Number.isNaN(parsed.getTime())) {
                            // Invalid date: fix via editing pipeline (set to null)
                            const key = `${col}:${row}`;
                            setTimeout(() => {
                                try {
                                    const newValue = {
                                        kind: GridCellKind.Custom,
                                        allowOverlay: false,
                                        copyData: '',
                                        data: {
                                            kind: 'date-picker-cell',
                                            date: null,
                                            displayDate: '',
                                            format: 'date',
                                        },
                                    } as GridCell;
                                    onCellEditedRef.current?.([col, row], newValue);
                                } catch {}
                            }, 0);
                            dateVal = null;
                            console.warn(
                                '[GlideEditableTable] Invalid date detected in cell. Cleared to prevent rendering errors.',
                            );
                        } else {
                            dateVal = parsed;
                        }
                    }
                    const displayDate = dateVal ? dateVal.toISOString().slice(0, 10) : '';
                    return {
                        kind: GridCellKind.Custom,
                        allowOverlay: isEditMode,
                        copyData: displayDate,
                        data: {
                            kind: 'date-picker-cell',
                            date: dateVal,
                            displayDate,
                            format: 'date',
                        },
                    } as GridCell;
                }
                case 'text':
                default:
                    // Row height calculated dynamically to include padding via calculateMinRowHeight
                    const textValue = value?.toString() ?? '';
                    return {
                        kind: GridCellKind.Text,
                        allowOverlay: isEditMode,
                        data: textValue,
                        displayData: textValue,
                        allowWrapping: true,
                        // Copy as flat single-line text (replace newlines with spaces)
                        copyData: textValue.replace(/\n/g, ' '),
                    } as TextCell;
            }
        },
        [sortedData, localColumns, isEditMode, peopleNames],
    );

    const { getCellsForSelection } = useGlideCopy(getCellContent);

    const onCellEdited = useCallback(
        async (cell: Item, newValue: GridCell) => {
            // Ignore edits during paste
            if (isPastingRef.current) {
                console.debug('[onCellEdited] Ignoring during paste');
                return;
            }

            const [colIndex, rowIndex] = cell;

            const column = localColumns[colIndex];
            if (!column) {
                console.warn('[onCellEdited] Column not found at index:', colIndex);
                return;
            }

            const rowData = sortedData[rowIndex];
            if (!rowData) {
                console.warn('[onCellEdited] Row not found at index:', rowIndex);
                return;
            }

            if (!rowData || !column) {
                console.warn('[onCellEdited] Invalid row/column', { rowIndex, colIndex });
                return;
            }

            const accessor = column.accessor;
            const rowId = rowData.id;

            // Handle Text cells
            if (newValue.kind === GridCellKind.Text) {
                const newValueStr = newValue.data;
                const originalValue = rowData?.[accessor];
                if ((originalValue ?? '').toString() === (newValueStr ?? '')) return;

                console.debug('[onCellEdited] Text cell update', {
                    rowIndex,
                    rowId,
                    accessor: String(accessor),
                    old: originalValue,
                    new: newValueStr,
                });

                // record history before making change (if not undoing)
                if (!isUndoingRef.current) {
                    addToHistory({
                        type: 'cell_edit',
                        timestamp: Date.now(),
                        data: {
                            rowId,
                            accessor,
                            oldValue: originalValue,
                            newValue: newValueStr,
                        },
                    });
                }

                // Optimistically update local data
                setLocalData((prev) =>
                    prev.map((r) =>
                        r.id === rowId ? ({ ...r, [accessor]: newValueStr } as T) : r,
                    ),
                );

                // Update the editing buffer
                setEditingData((prev) => ({
                    ...prev,
                    [rowId]: { ...(prev[rowId] ?? {}), [accessor]: newValueStr },
                }));
            }
            // Handle built-in Number cells
            else if (newValue.kind === GridCellKind.Number) {
                const numVal = (newValue as any).data as number | null;
                console.debug('[onCellEdited] Number cell update', {
                    rowIndex,
                    rowId,
                    accessor: String(accessor),
                    value: numVal,
                });
                setLocalData((prev) =>
                    prev.map((r) =>
                        r.id === rowId ? ({ ...r, [accessor]: numVal } as T) : r,
                    ),
                );
                setEditingData((prev) => ({
                    ...prev,
                    [rowId]: { ...(prev[rowId] ?? {}), [accessor]: numVal },
                }));
            }
            // Handle Custom editors (dropdown-cell, multi-select-cell, date-picker-cell)
            else if (newValue.kind === GridCellKind.Custom) {
                const data = (newValue as any).data;
                const kind = data?.kind as string | undefined;
                if (kind === 'dropdown-cell' || kind === 'dropdown-cell-fixed') {
                    const displayValue = (data?.value ?? '').toString();
                    console.debug('[onCellEdited] Dropdown cell update', {
                        rowIndex,
                        rowId,
                        accessor: String(accessor),
                        value: displayValue,
                    });
                    setLocalData((prev) =>
                        prev.map((r) =>
                            r.id === rowId
                                ? ({ ...r, [accessor]: displayValue } as T)
                                : r,
                        ),
                    );
                    setEditingData((prev) => ({
                        ...prev,
                        [rowId]: { ...(prev[rowId] ?? {}), [accessor]: displayValue },
                    }));
                } else if (kind === 'multi-select-cell') {
                    const values: string[] = Array.isArray(data?.values)
                        ? (data.values as string[])
                        : [];
                    console.debug('[onCellEdited] Multi-select cell update', {
                        rowIndex,
                        rowId,
                        accessor: String(accessor),
                        values,
                    });
                    setLocalData((prev) =>
                        prev.map((r) =>
                            r.id === rowId ? ({ ...r, [accessor]: values } as T) : r,
                        ),
                    );
                    setEditingData((prev) => ({
                        ...prev,
                        [rowId]: { ...(prev[rowId] ?? {}), [accessor]: values },
                    }));
                    // If column carries a propertyId and allowCreation, persist new options
                    const colDef = localColumns[colIndex] as any;
                    const propertyId: string | undefined = colDef?.propertyId;
                    const allowCreation: boolean = Boolean(data?.allowCreation);
                    if (propertyId && allowCreation) {
                        try {
                            const unique = Array.from(new Set(values));
                            // optimistic local update of options list
                            setLocalColumns((prev) =>
                                prev.map((c) =>
                                    c.accessor === colDef.accessor
                                        ? ({
                                              ...c,
                                              options: Array.from(
                                                  new Set([
                                                      ...(c.options || []),
                                                      ...unique,
                                                  ]),
                                              ),
                                          } as any)
                                        : c,
                                ),
                            );
                            // Persist to DB property options
                            await appendPropertyOptions(propertyId, unique);
                        } catch {}
                    }
                } else if (kind === 'date-picker-cell') {
                    const dateVal: Date | null = data?.date ?? null;
                    const iso =
                        dateVal && !Number.isNaN(dateVal.getTime())
                            ? dateVal.toISOString()
                            : '';
                    console.debug('[onCellEdited] Date picker update', {
                        rowIndex,
                        rowId,
                        accessor: String(accessor),
                        iso,
                    });
                    setLocalData((prev) =>
                        prev.map((r) =>
                            r.id === rowId ? ({ ...r, [accessor]: iso } as T) : r,
                        ),
                    );
                    setEditingData((prev) => ({
                        ...prev,
                        [rowId]: { ...(prev[rowId] ?? {}), [accessor]: iso },
                    }));
                }
            }

            // Debounce save if set, else leave in buffer
            debouncedSave();
            lastEditedCellRef.current = cell;

            // Re-highlight and focus last edited cell to preserve keyboard navigation
            const zeroRect: Rectangle = { x: cell[0], y: cell[1], width: 1, height: 1 };
            const selectionObj: GridSelection = {
                rows: CompactSelection.empty(),
                columns: CompactSelection.empty(),
                current: { cell, range: zeroRect, rangeStack: [zeroRect] },
            };
            setGridSelection(selectionObj);
            setSelection(selectionObj);
            selectionRef.current = selectionObj;
            // Editing finished; re-enable blur-based deselection and refocus grid
            (isEditingCellRef as React.RefObject<boolean>).current = false;
            try {
                document.body.style.overflow = '';
            } catch {}
            gridRef.current?.focus();
        },
        [localColumns, debouncedSave, addToHistory, sortedData, appendPropertyOptions],
    );

    useEffect(() => {
        onCellEditedRef.current = (cell: Item, newValue: GridCell) => {
            void onCellEdited(cell, newValue);
        };
    }, [onCellEdited]);

    // Add new row. Queue if a save is in progress; otherwise proceed and flush edits.
    const handleRowAppended = useCallback(async () => {
        try {
            // If a save is actively in progress, queue the row add until it finishes
            if (isSavingRef.current) {
                // Defer row append slightly to allow the current save to settle
                setTimeout(() => {
                    handleRowAppended();
                }, 150);
                return;
            }

            // Flush any pending edits so they are persisted before we add a new row
            // Do not await metadata save to avoid blocking UI
            saveTableMetadataRef.current?.();
            // Persist buffered cell edits synchronously
            await handleSaveAllRef.current?.();

            // Create the new row at the end (position = max + 1)
            const maxPosition = Math.max(0, ...localData.map((d) => d.position ?? 0));
            const newRow = {
                ...columns.reduce(
                    (acc, col) => {
                        if (col.accessor !== 'id') acc[col.accessor as string] = '';
                        return acc;
                    },
                    {} as Record<string, unknown>,
                ),
                id: crypto.randomUUID(),
                position: maxPosition + 1,
            } as T;

            // record in history (if not undoing)
            if (!isUndoingRef.current) {
                addToHistory({
                    type: 'row_add',
                    timestamp: Date.now(),
                    data: {
                        rows: [newRow],
                    },
                });
            }

            // Persist the new row; avoid immediate full refresh to reduce flicker
            await saveRow(newRow, true);
            // Opportunistically update metadata (non-blocking)
            saveTableMetadataRef.current?.();
        } catch (e) {
            console.error('[GlideEditableTable] Failed to append row:', e);
        }
    }, [columns, localData, saveRow, refreshAfterSave, addToHistory]);

    const handleRowMoved = useCallback(
        (from: number, to: number) => {
            if (from === to) return;

            // record in history (if not undoing)
            if (!isUndoingRef.current) {
                addToHistory({
                    type: 'row_move',
                    timestamp: Date.now(),
                    data: {
                        from,
                        to,
                    },
                });
            }

            // mark reordering window to avoid remote overwrite
            isReorderingRef.current = true;

            setLocalData((prev) => {
                const updated = [...prev];
                const [moved] = updated.splice(from, 1);
                updated.splice(to, 0, moved);

                const reindexed = updated.map((row, index) => ({
                    ...row,
                    position: index,
                }));

                debouncedSave(); // Call debounced save with newly updated columns.

                return reindexed;
            });
            saveTableMetadataRef.current?.();
            // allow some time for metadata save/realtime to propagate, then re-enable sync
            setTimeout(() => {
                isReorderingRef.current = false;
            }, 1000);
        },
        [debouncedSave, addToHistory],
    );

    // sort rows by a column and persist order to metadata
    const handleSortByColumn = useCallback(
        (colIndex: number, direction: 'asc' | 'desc') => {
            const column = localColumnsRef.current?.[colIndex];
            if (!column) return;

            const accessor = column.accessor as keyof T;
            const type = (column as any)?.type as string | undefined;

            const getComparable = (row: T): number | string => {
                const raw: any = row?.[accessor];
                switch (type) {
                    case 'number': {
                        const n =
                            typeof raw === 'number'
                                ? raw
                                : raw == null || raw === ''
                                  ? Number.NaN
                                  : Number(raw);
                        return Number.isFinite(n) ? n : Number.NaN;
                    }
                    case 'date': {
                        if (raw instanceof Date) return raw.getTime();
                        if (typeof raw === 'string' && raw) {
                            const t = Date.parse(raw);
                            return Number.isNaN(t) ? 0 : t;
                        }
                        return 0;
                    }
                    case 'multi_select': {
                        if (Array.isArray(raw)) return raw.join(',').toLowerCase();
                        if (typeof raw === 'string') return raw.toLowerCase();
                        return '';
                    }
                    case 'select':
                    default: {
                        return (raw ?? '').toString().toLowerCase();
                    }
                }
            };

            // work from the currently displayed order
            const current = [...sortedDataRef.current];

            const sortedRows = current
                .slice()
                .sort((a, b) => {
                    const av = getComparable(a);
                    const bv = getComparable(b);

                    // handle NaN and empty values consistently (push to end for asc)
                    const aIsEmpty =
                        av === '' ||
                        av === null ||
                        av === undefined ||
                        (typeof av === 'number' && Number.isNaN(av));
                    const bIsEmpty =
                        bv === '' ||
                        bv === null ||
                        bv === undefined ||
                        (typeof bv === 'number' && Number.isNaN(bv));
                    if (aIsEmpty && bIsEmpty) return 0;
                    if (aIsEmpty) return direction === 'asc' ? 1 : -1;
                    if (bIsEmpty) return direction === 'asc' ? -1 : 1;

                    if (typeof av === 'number' && typeof bv === 'number') {
                        return direction === 'asc' ? av - bv : bv - av;
                    }

                    const aStr = String(av);
                    const bStr = String(bv);
                    return direction === 'asc'
                        ? aStr.localeCompare(bStr)
                        : bStr.localeCompare(aStr);
                })
                .map((row, index) => ({ ...row, position: index })) as T[];

            // update local state with new positions and persist metadata
            sortedDataRef.current = sortedRows;
            setLocalData(sortedRows);
            try {
                saveTableMetadataRef.current?.();
            } catch (e) {
                console.error('[GlideEditableTable] Failed to save sort metadata', e);
            }
        },
        [],
    );

    // Calculate row height dynamically based on text content and column width
    // Unlimited wrapping - all text is always visible, no line limits
    const calculateMinRowHeight = useCallback(
        (rowData: T, columnWidths: Record<string, number>) => {
            const baseHeight = 43;

            const lineHeight = 16;

            // values are enforced consistently across all cells and resize states
            const paddingTop = 6;
            const paddingBottom = 6;
            const paddingLeft = 8;
            const paddingRight = 8;
            const totalVerticalPadding = paddingTop + paddingBottom;
            const totalHorizontalPadding = paddingLeft + paddingRight;

            let maxRequiredHeight = baseHeight;

            // Check each column to calculate required height for wrapped text
            localColumns.forEach((column) => {
                // Only apply dynamic wrapping to text columns TBD
                if (column.type !== 'text' && column.type !== undefined) return;

                const value = rowData?.[column.accessor]?.toString() || '';
                if (value.length === 0) return;

                const columnWidth =
                    columnWidths[column.accessor as string] || column.width || 120;

                // Calculate available text width: column width minus horizontal padding
                // Ensure minimum available width even for very narrow columns
                const availableTextWidth = Math.max(
                    columnWidth - totalHorizontalPadding,
                    20,
                );

                // Estimate characters per line based on average character width
                const avgCharWidth = 8;
                const charsPerLine = Math.floor(availableTextWidth / avgCharWidth);

                if (charsPerLine > 0) {
                    // Calculate total lines needed - no cap, unlimited wrapping
                    const estimatedLines = Math.ceil(value.length / charsPerLine);
                    // Account for existing newlines in the text
                    const existingNewlines = (value.match(/\n/g) || []).length;
                    const totalLines = Math.max(estimatedLines, existingNewlines + 1);

                    // Calculate required height with explicit padding:
                    const textHeight = totalLines * lineHeight;
                    const requiredHeight = textHeight + totalVerticalPadding;

                    if (requiredHeight > maxRequiredHeight) {
                        maxRequiredHeight = requiredHeight;
                    }
                } else {
                    // Even with no text or very narrow columns, ensure minimum height with padding
                    const minHeightWithPadding = lineHeight + totalVerticalPadding;
                    if (minHeightWithPadding > maxRequiredHeight) {
                        maxRequiredHeight = minHeightWithPadding;
                    }
                }
            });

            // Ensure the calculated height is at least the base height
            // maintains consistency with single-line cells
            return Math.max(maxRequiredHeight, baseHeight);
        },
        [localColumns],
    );

    const handleRowResize = useCallback(
        (rowIndex: number, newSize: number) => {
            const rowId = sortedData[rowIndex]?.id;
            if (!rowId) return;

            setLocalData((prev) => {
                const updated = prev.map((row) =>
                    row.id === rowId ? { ...row, height: newSize } : row,
                );
                debouncedSave(); // call debounced save w newly updated columns
                return updated;
            });
        },
        [debouncedSave, sortedData],
    );

    const handleColumnDeleteConfirm = useCallback(async () => {
        if (!columnToDelete) return;

        try {
            // Find the column to get its accessor before deletion
            const columnToRemove = localColumns.find((col) => col.id === columnToDelete);
            const columnAccessor = columnToRemove?.accessor;

            await props.onDeleteColumn?.(columnToDelete);

            // Update local deletion tracker
            deletedColumnIdsRef.current.add(columnToDelete);

            // Update columns
            const newLocalColumns = localColumnsRef.current.filter(
                (col) => col.id !== columnToDelete,
            );

            // clean up data for the deleted column
            if (columnAccessor) {
                // Remove this column's data from localData
                setLocalData((prevData) =>
                    prevData.map((row) => {
                        const newRow = { ...row };
                        delete newRow[columnAccessor];
                        return newRow;
                    }),
                );

                // Remove this column's data from editingData
                setEditingData((prevEdits) => {
                    const newEdits = { ...prevEdits };
                    Object.keys(newEdits).forEach((rowId) => {
                        if (newEdits[rowId] && columnAccessor in newEdits[rowId]) {
                            delete newEdits[rowId][columnAccessor as keyof Partial<T>];
                            // If no more edits for this row, remove the row entry
                            if (Object.keys(newEdits[rowId]).length === 0) {
                                delete newEdits[rowId];
                            }
                        }
                    });
                    return newEdits;
                });
            }

            // Update ref and state
            localColumnsRef.current = newLocalColumns;
            setLocalColumns(newLocalColumns);

            await saveTableMetadata();

            // Force grid to refresh
            gridRef.current?.updateCells([]);
        } catch (err) {
            console.error('[GlideEditableTable] Failed to delete column:', err);
            return;
        }

        // Cleanup state on success
        setColumnToDelete(null);
        setDeleteConfirmOpen(false);
    }, [columnToDelete, props, saveTableMetadata]);

    // handle column rename with optimistic updates and error recovery
    const handleColumnRename = useCallback(
        async (newName: string) => {
            if (!columnToRename || !newName.trim()) return;

            const oldName = columnToRename.currentName;

            try {
                setLocalColumns((prev) => {
                    const updated = prev.map((col) => {
                        if (col.id === columnToRename.id) {
                            return {
                                ...col,
                                header: newName,
                                title: newName,
                                accessor: newName as keyof T,
                            };
                        }
                        return col;
                    });
                    localColumnsRef.current = updated;
                    return updated;
                });

                // Migrate localData keys from old name to new name
                setLocalData((prevData) =>
                    prevData.map((row) => {
                        if (oldName in row) {
                            const newRow = { ...row };
                            newRow[newName as keyof T] = row[oldName as keyof T];
                            delete newRow[oldName as keyof T];
                            return newRow;
                        }
                        return row;
                    }),
                );

                // Migrate editing buffer keys from old name to new name
                setEditingData((prevEdits) => {
                    const newEdits: Record<string, Partial<T>> = {};
                    Object.entries(prevEdits).forEach(([rowId, rowEdits]) => {
                        const newRowEdits: Partial<T> = {};
                        Object.entries(rowEdits).forEach(([key, value]) => {
                            if (key === oldName) {
                                (newRowEdits as any)[newName] = value;
                            } else {
                                (newRowEdits as any)[key] = value;
                            }
                        });
                        newEdits[rowId] = newRowEdits;
                    });
                    return newEdits;
                });

                // Persist the column rename to backend
                if (props.onRenameColumn) {
                    await props.onRenameColumn(columnToRename.id, newName);
                }

                // Save metadata but DO NOT refresh data
                await saveTableMetadataRef.current?.();

                // DO NOT call refreshAfterSave() - this clears the data!
                // DO NOT clear editingData - let it save normally
            } catch (err) {
                console.error('[GlideEditableTable] Failed to rename column:', err);
                // Revert changes on error
                setLocalColumns((prev) =>
                    prev.map((col) =>
                        col.id === columnToRename.id
                            ? {
                                  ...col,
                                  header: oldName,
                                  title: oldName,
                                  accessor: oldName as keyof T,
                              }
                            : col,
                    ),
                );

                setLocalData((prevData) =>
                    prevData.map((row) => {
                        if (newName in row) {
                            const newRow = { ...row };
                            newRow[oldName as keyof T] = row[newName as keyof T];
                            delete newRow[newName as keyof T];
                            return newRow;
                        }
                        return row;
                    }),
                );
            } finally {
                setColumnToRename(null);
                setRenameDialogOpen(false);
            }
        },
        [columnToRename, props.onRenameColumn],
    );

    // Call row deletion on array of selected Dynamic Requirement objects.
    const handleRowDeleteConfirm = useCallback(async () => {
        if (rowsToDelete.length === 0) return;

        // record indices before deletion for undo
        const rowIndices = rowsToDelete.map((row) =>
            sortedData.findIndex((r) => r.id === row.id),
        );

        // record in history (if not undoing)
        if (!isUndoingRef.current) {
            addToHistory({
                type: 'row_delete',
                timestamp: Date.now(),
                data: {
                    rows: [...rowsToDelete], // copy rows before deletion
                    rowIndices,
                },
            });
        }

        // Update local deletion tracker
        const deletedIds = rowsToDelete.map((r) => r.id);
        for (const id of deletedIds) {
            deletedRowIdsRef.current.add(id);
        }
        // Update local state.
        setLocalData((prev) => prev.filter((r) => !deletedIds.includes(r.id)));

        // Call DB deletes, sync local metadata to db.
        for (const row of rowsToDelete) {
            props.onDelete?.(row);
        }
        void saveTableMetadata();

        // Cleanup.
        setRowsToDelete([]);
        setRowDeleteConfirmOpen(false);
        setGridSelection({
            rows: CompactSelection.empty(),
            columns: CompactSelection.empty(),
        });
    }, [rowsToDelete, saveTableMetadata, props, sortedData, addToHistory]);

    // Modify Trailing Row Visuals.
    columns.map((col, idx) => ({
        title: col.header,
        width: colSizes[col.accessor] || col.width || 120,
        trailingRowOptions:
            idx === 0
                ? {
                      hint: 'Add row',
                      addIcon: true,
                      targetColumn: true,
                  }
                : undefined,
    }));

    // Called when edit mode is turned false. Curr calls HandleSaveAll ...
    useEffect(() => {
        const wasEditMode = prevEditModeRef.current;
        prevEditModeRef.current = isEditMode;
        if (wasEditMode && !isEditMode) {
            console.debug(
                '[GlideEditableTable] Edit mode exited. Checking for unsaved edits...',
            );

            // clear undo history when exiting edit mode
            historyRef.current = [];
            setHistoryIndex(-1);
            console.debug(
                '[GlideEditableTable] Cleared undo/redo history on edit mode exit',
            );

            const hasPendingEdits = Object.keys(editingDataRef.current).length > 0;

            if (hasPendingEdits) {
                console.debug(
                    '[GlideEditableTable] Flushing pending edits on edit mode exit...',
                );
                void handleSaveAll();
            } else {
                console.debug('[GlideEditableTable] No edits to save on exit.');
            }

            // clear any selection highlighting when exiting edit mode
            setGridSelection({
                rows: CompactSelection.empty(),
                columns: CompactSelection.empty(),
            });
            setSelection(undefined);
            selectionRef.current = undefined;
            console.debug('[GlideEditableTable] Cleared selection on edit mode exit');

            void saveTableMetadata();
        }
    }, [
        isEditMode,
        localColumns,
        editingData,
        onSave,
        onPostSave,
        handleSaveAll,
        saveTableMetadata,
    ]);

    // clear selection highlight when table loses focus
    useEffect(() => {
        const handleTableBlur = (e: FocusEvent) => {
            // check if focus is moving outside the table container
            const tableElement = tableRef.current;
            if (!tableElement) return;

            // use setTimeout to check focus after it has moved
            setTimeout(() => {
                // if new focused element is not within the table, clear selection
                if (!tableElement.contains(document.activeElement)) {
                    // Skip clearing selection during popup cell edit
                    if (
                        isEditMode &&
                        (isEditingCellRef as React.RefObject<boolean>).current
                    ) {
                        return;
                    }
                    setGridSelection({
                        rows: CompactSelection.empty(),
                        columns: CompactSelection.empty(),
                    });
                    setSelection(undefined);
                    selectionRef.current = undefined;
                    console.debug('[GlideEditableTable] Cleared selection on table blur');
                }
            }, 0);
        };

        const tableElement = tableRef.current;
        if (tableElement) {
            tableElement.addEventListener('blur', handleTableBlur, true);
            return () => {
                tableElement.removeEventListener('blur', handleTableBlur, true);
            };
        }
    }, [isEditMode]);

    // undo/redo functionality
    const performUndo = useCallback(() => {
        if (historyIndex < 0 || historyRef.current.length === 0) {
            console.debug('[Undo] No actions to undo');
            return;
        }

        const action = historyRef.current[historyIndex];
        isUndoingRef.current = true;

        console.debug('[Undo] Performing undo for action:', action.type);

        switch (action.type) {
            case 'cell_edit':
                // revert cell edit
                if (action.data.rowId && action.data.accessor !== undefined) {
                    setLocalData((prev) =>
                        prev.map((r) =>
                            r.id === action.data.rowId
                                ? ({
                                      ...r,
                                      [action.data.accessor!]: action.data.oldValue,
                                  } as T)
                                : r,
                        ),
                    );

                    // update editing buffer
                    setEditingData((prev) => {
                        const updated = { ...prev };
                        if (updated[action.data.rowId!]) {
                            if (
                                action.data.oldValue === undefined ||
                                action.data.oldValue === ''
                            ) {
                                // remove from buffer if reverting to empty
                                delete updated[action.data.rowId!][action.data.accessor!];
                                if (
                                    Object.keys(updated[action.data.rowId!]).length === 0
                                ) {
                                    delete updated[action.data.rowId!];
                                }
                            } else {
                                updated[action.data.rowId!] = {
                                    ...updated[action.data.rowId!],
                                    [action.data.accessor!]: action.data.oldValue,
                                };
                            }
                        }
                        return updated;
                    });
                }
                break;

            case 'row_add':
                // remove added rows
                if (action.data.rows) {
                    const rowIds = action.data.rows.map((r) => r.id);
                    setLocalData((prev) => prev.filter((r) => !rowIds.includes(r.id)));
                }
                break;

            case 'row_delete':
                // restore deleted rows
                if (action.data.rows && action.data.rowIndices) {
                    setLocalData((prev) => {
                        const updated = [...prev];
                        // insert rows back at their original positions
                        action.data.rows!.forEach((row, i) => {
                            const index = action.data.rowIndices![i];
                            updated.splice(index, 0, row);
                        });
                        return updated;
                    });

                    // clear from deletion tracker
                    action.data.rows.forEach((row) => {
                        deletedRowIdsRef.current.delete(row.id);
                    });
                }
                break;

            case 'column_move':
                // revert column move
                if (action.data.oldColumnState) {
                    setLocalColumns(action.data.oldColumnState);
                }
                break;

            case 'row_move':
                // revert row move
                if (action.data.from !== undefined && action.data.to !== undefined) {
                    setLocalData((prev) => {
                        const updated = [...prev];
                        // reverse the move
                        const [moved] = updated.splice(action.data.to!, 1);
                        updated.splice(action.data.from!, 0, moved);
                        // reindex positions
                        return updated.map((row, index) => ({
                            ...row,
                            position: index,
                        }));
                    });
                }
                break;
        }

        setHistoryIndex((prev) => Math.max(-1, prev - 1));

        // trigger debounced save to persist undo
        debouncedSave();

        setTimeout(() => {
            isUndoingRef.current = false;
        }, 100);
    }, [historyIndex, debouncedSave]);

    const performRedo = useCallback(() => {
        if (historyIndex >= historyRef.current.length - 1) {
            console.debug('[Redo] No actions to redo');
            return;
        }

        const nextIndex = historyIndex + 1;
        const action = historyRef.current[nextIndex];
        isUndoingRef.current = true;

        console.debug('[Redo] Performing redo for action:', action.type);

        switch (action.type) {
            case 'cell_edit':
                // reapply cell edit
                if (action.data.rowId && action.data.accessor !== undefined) {
                    setLocalData((prev) =>
                        prev.map((r) =>
                            r.id === action.data.rowId
                                ? ({
                                      ...r,
                                      [action.data.accessor!]: action.data.newValue,
                                  } as T)
                                : r,
                        ),
                    );

                    // update editing buffer
                    setEditingData((prev) => ({
                        ...prev,
                        [action.data.rowId!]: {
                            ...(prev[action.data.rowId!] || {}),
                            [action.data.accessor!]: action.data.newValue,
                        },
                    }));
                }
                break;

            case 'row_add':
                // re-add rows
                if (action.data.rows) {
                    setLocalData((prev) => [...prev, ...action.data.rows!]);
                }
                break;

            case 'row_delete':
                // re-delete rows
                if (action.data.rows) {
                    const rowIds = action.data.rows.map((r) => r.id);
                    setLocalData((prev) => prev.filter((r) => !rowIds.includes(r.id)));

                    // add back to deletion tracker
                    rowIds.forEach((id) => {
                        deletedRowIdsRef.current.add(id);
                    });
                }
                break;

            case 'column_move':
                // reapply column move
                if (action.data.newColumnState) {
                    setLocalColumns(action.data.newColumnState);
                }
                break;

            case 'row_move':
                // reapply row move
                if (action.data.from !== undefined && action.data.to !== undefined) {
                    setLocalData((prev) => {
                        const updated = [...prev];
                        const [moved] = updated.splice(action.data.from!, 1);
                        updated.splice(action.data.to!, 0, moved);
                        // reindex positions
                        return updated.map((row, index) => ({
                            ...row,
                            position: index,
                        }));
                    });
                }
                break;
        }

        setHistoryIndex(nextIndex);

        // trigger debounced save to persist redo
        debouncedSave();

        setTimeout(() => {
            isUndoingRef.current = false;
        }, 100);
    }, [historyIndex, debouncedSave]);
    // Save hotkey, temp fix for dev. 'Ctrl' + 's'
    // now also handles undo/redo
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const isMac =
                (navigator as any).userAgentData?.platform === 'macOS' ||
                navigator.userAgent.toLowerCase().includes('mac');

            // save hotkey
            const isSaveKey =
                (isMac && e.metaKey && e.key === 's') ||
                (!isMac && e.ctrlKey && e.key === 's');

            if (isSaveKey) {
                e.preventDefault(); // Prevent browser's save dialog
                console.debug(
                    '[GlideEditableTable] Ctrl+S detected. Saving pending changes...',
                );
                void handleSaveAll();
                void saveTableMetadata();
                return;
            }

            // undo hotkey (ctrl+z or cmd+z)
            const isUndoKey =
                (isMac && e.metaKey && e.key === 'z' && !e.shiftKey) ||
                (!isMac && e.ctrlKey && e.key === 'z' && !e.shiftKey);

            if (isUndoKey && isEditMode) {
                e.preventDefault();
                e.stopPropagation();
                console.debug('[GlideEditableTable] Undo triggered');
                performUndo();
                return;
            }

            // redo hotkey (ctrl+shift+z, ctrl+y, or cmd+shift+z)
            const isRedoKey =
                (isMac && e.metaKey && e.key === 'z' && e.shiftKey) ||
                (!isMac && e.ctrlKey && e.key === 'z' && e.shiftKey) ||
                (!isMac && e.ctrlKey && e.key === 'y');

            if (isRedoKey && isEditMode) {
                e.preventDefault();
                e.stopPropagation();
                console.debug('[GlideEditableTable] Redo triggered');
                performRedo();
                return;
            }
        },
        [handleSaveAll, saveTableMetadata, isEditMode, performUndo, performRedo],
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // Detect type-to-edit path to mark editing active before overlay opens
    const handleGridKeyDown = useCallback(
        (e: {
            ctrlKey: boolean;
            metaKey: boolean;
            altKey: boolean;
            key: string;
            code?: string;
            preventDefault?: () => void;
            stopPropagation?: () => void;
        }) => {
            if (!isEditMode) return;

            const hasSelection = Boolean(selectionRef.current?.current?.cell);
            const isModifier = e.ctrlKey || e.metaKey || e.altKey;
            const code = e.code || '';
            const key = e.key;
            const isNavKey =
                code === 'ArrowUp' ||
                code === 'ArrowDown' ||
                code === 'ArrowLeft' ||
                code === 'ArrowRight' ||
                code === 'Tab' ||
                code === 'Enter' ||
                code === 'Escape';
            const startsEdit = !isModifier && !isNavKey && key.length === 1;

            // If starting an edit by typing/enter/space, mark editing active so blur won't clear
            if (hasSelection && (startsEdit || code === 'Enter' || key === ' ')) {
                (isEditingCellRef as React.RefObject<boolean>).current = true;
            }
            if (code === 'Escape') {
                (isEditingCellRef as React.RefObject<boolean>).current = false;
            }

            // Hijack row delete: if Delete/Backspace pressed while rows are selected and not editing a cell
            const selectedRowIndices = gridSelection.rows.toArray();
            const hasRowSelection = selectedRowIndices.length > 0;
            const isDeleteKey = key === 'Delete' || key === 'Backspace';
            const isEditingOverlay = (isEditingCellRef as React.RefObject<boolean>)
                .current;

            if (hasRowSelection && isDeleteKey && !isEditingOverlay) {
                // Prevent Glide from clearing cell contents
                e.preventDefault?.();
                e.stopPropagation?.();

                const rowsToDeleteLocal = selectedRowIndices
                    .map((i) => sortedData[i])
                    .filter(Boolean);
                if (rowsToDeleteLocal.length > 0) {
                    setRowsToDelete(rowsToDeleteLocal);
                    if (props.skipDeleteConfirm) {
                        // Skip confirmation dialog and delete directly
                        setTimeout(() => handleRowDeleteConfirm(), 0);
                    } else {
                        setRowDeleteConfirmOpen(true);
                    }
                }
            }
        },
        [isEditMode, gridSelection, sortedData, props.skipDeleteConfirm, handleRowDeleteConfirm],
    );

    // handle cell activation and track selected position
    const handleCellActivated = useCallback(
        (cell: Item) => {
            // track activated cell for navigation and paste
            lastSelectedCellRef.current = cell;
            console.debug('[Cell Activated] Cell selected for potential paste/edit:', {
                col: cell[0],
                row: cell[1],
            });

            if (isEditMode) {
                // entering popup edit mode: temporarily disable blur-based deselection
                (isEditingCellRef as React.RefObject<boolean>).current = true;
            } else {
                // open row detail panel in view mode if provided
                if (props.rowDetailPanel) {
                    const row = sortedData[cell[1]];
                    // Open if row has an id (requirement rows always have stable ids)
                    const hasId = Boolean(row?.id);
                    if (hasId) {
                        setSelectedRowId(row.id);
                        setIsRowDetailOpen(true);
                    } else {
                        setIsRowDetailOpen(false);
                    }
                }
            }
        },
        [isEditMode, sortedData, props.rowDetailPanel],
    );

    // enhanced selection tracking
    useEffect(() => {
        selectionRef.current = selection;
    }, [selection]);

    // enhanced paste handler with crash protection
    const handlePaste = useCallback(
        async (event: ClipboardEvent) => {
            const operationId = `paste_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.group(
                `[handlePaste] Operation ${operationId} TRIGGERED - PASTE EVENT DETECTED!`,
            );

            let pasteStartCol = 0;
            let pasteStartRow = 0;
            let pasteEndCol = 0;
            let pasteEndRow = 0;
            let clipboardRowsForRestore: string[][] = [];
            // declare at function scope for access in finally block
            let newRowsToCreate: T[] = [];

            console.debug(`PASTE EVENT CAPTURED! Event details:`, {
                eventType: event.type,
                eventTarget: event.target,
                clipboardDataExists: !!event.clipboardData,
                clipboardDataTypes: event.clipboardData?.types,
                isEditMode,
                isPastingRefCurrent: isPastingRef.current,
                localDataLength: localData.length,
                sortedDataLength: sortedData.length,
                tableRefExists: !!tableRef.current,
                gridRefExists: !!gridRef.current,
            });

            // exit if not in edit mode
            if (!isEditMode) {
                console.debug(`[${operationId}] Not in edit mode, aborting paste`);
                console.groupEnd();
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            console.debug(`[${operationId}] Event prevented and stopped propagation`);

            // prevent nested paste operations
            if (isPastingRef.current) {
                console.debug(
                    `[${operationId}] Already pasting (isPastingRef.current = true), aborting paste`,
                );
                console.groupEnd();
                return;
            }

            // get clipboard text
            const text = event.clipboardData?.getData('text/plain') ?? '';
            if (!text.trim()) {
                console.debug(`[${operationId}] Empty clipboard, nothing to paste`);
                console.groupEnd();
                return;
            }

            console.debug(`[${operationId}] Raw clipboard text:`, {
                length: text.length,
                preview: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                lineCount: text.split(/\r?\n/).length,
            });

            // set pasting flag to prevent conflicts
            isPastingRef.current = true;
            console.debug(`[${operationId}] Set isPastingRef.current = true`);

            // set paste operation active flag
            pasteOperationActiveRef.current = true;
            console.debug(`[${operationId}] Paste operation active flag set`);

            try {
                // parse clipboard data into rows and cells
                const rawRows = text.trim().split(/\r?\n/);
                console.debug(`[${operationId}] Raw rows split:`, {
                    totalRawRows: rawRows.length,
                    rawRowsPreview: rawRows
                        .slice(0, 3)
                        .map((row, i) => `Row ${i}: "${row}"`),
                });

                const clipboardRows = rawRows
                    .map((row, index) => {
                        const cells = row.split('\t');
                        console.debug(`[${operationId}] Row ${index} parsed:`, {
                            rawRow: row,
                            cellCount: cells.length,
                            cells: cells.map(
                                (cell, cellIndex) => `Cell ${cellIndex}: "${cell}"`,
                            ),
                        });
                        return cells;
                    })
                    .filter((row, index) => {
                        const hasContent = row.some((cell) => cell.trim());
                        console.debug(`[${operationId}] Row ${index} filter check:`, {
                            hasContent,
                            row: row.map((cell, cellIndex) => `[${cellIndex}]:"${cell}"`),
                        });
                        return hasContent;
                    });

                console.debug(`[${operationId}] Final parsed clipboard data:`, {
                    totalValidRows: clipboardRows.length,
                    maxColumns: Math.max(...clipboardRows.map((row) => row.length)),
                    allRowsPreview: clipboardRows.map((row, i) => ({
                        rowIndex: i,
                        cellCount: row.length,
                        cells: row.map(
                            (cell, j) =>
                                `[${j}]:"${cell.substring(0, 20)}${cell.length > 20 ? '...' : ''}"`,
                        ),
                    })),
                });

                // determine starting position from current or last selected cell
                const currentSelection = selectionRef.current?.current?.cell;
                const lastSelection = lastSelectedCellRef.current;
                const gridSelectionCell = selectionRef.current?.current?.cell;

                const startCell = currentSelection ||
                    lastSelection ||
                    gridSelectionCell || [0, 0];
                const startCol = Math.max(0, startCell[0]);
                const startRow = Math.max(0, startCell[1]);

                // store coordinates for selection restoration
                pasteStartCol = startCol;
                pasteStartRow = startRow;
                clipboardRowsForRestore = clipboardRows;
                pasteEndCol =
                    startCol + Math.max(...clipboardRows.map((r) => r.length)) - 1;
                pasteEndRow = startRow + clipboardRows.length - 1;

                console.debug(`[${operationId}] Paste position determined:`, {
                    currentSelection,
                    lastSelection,
                    gridSelectionCell,
                    finalStartCell: startCell,
                    startCol,
                    startRow,
                });

                console.debug(`[${operationId}] Paste target position:`, {
                    selectionRefCurrent: selectionRef.current,
                    startCellRaw: startCell,
                    startCol,
                    startRow,
                    targetRange: {
                        fromRow: startRow,
                        toRow: startRow + clipboardRows.length - 1,
                        fromCol: startCol,
                        toCol:
                            startCol +
                            Math.max(...clipboardRows.map((row) => row.length)) -
                            1,
                    },
                });

                // store selection before clearing (to restore after paste)
                const selectionBeforePaste = {
                    cell: startCell,
                    range: selectionRef.current?.current?.range,
                };

                // clear selection completely - no restoration
                setSelection(undefined);
                selectionRef.current = undefined;
                setGridSelection({
                    rows: CompactSelection.empty(),
                    columns: CompactSelection.empty(),
                });
                console.debug(`[${operationId}] Cleared all selection state`);

                const currentData = [...sortedData];
                const currentColumns = [...localColumnsRef.current];

                console.debug(`[${operationId}] 📸 Current state snapshot:`, {
                    currentDataLength: currentData.length,
                    currentDataIds: currentData.map((row) => ({
                        id: row.id,
                        position: row.position,
                    })),
                    localDataLength: localData.length,
                    localDataIds: localData.map((row) => ({
                        id: row.id,
                        position: row.position,
                    })),
                    currentColumnsLength: currentColumns.length,
                    currentColumnsInfo: currentColumns.map((col, i) => ({
                        index: i,
                        id: col.id,
                        accessor: String(col.accessor),
                        type: col.type,
                        header: col.header,
                    })),
                });

                // track changes to apply
                const updatedRows = new Map<string, T>();
                // use the newRowsToCreate declared at function scope - don't redeclare with const
                newRowsToCreate = [];
                const editingUpdates: Record<string, Partial<T>> = {};

                // calculate the maximum position for new rows from current data
                const currentPositions = currentData.map((d) => d.position ?? 0);
                let maxPosition =
                    currentPositions.length > 0 ? Math.max(...currentPositions) : 0;

                console.debug(`[${operationId}] Position calculation:`, {
                    currentPositions,
                    calculatedMaxPosition: maxPosition,
                    willCreateNewRowsFrom: maxPosition + 1,
                });

                // process each clipboard row
                for (
                    let clipboardRowIndex = 0;
                    clipboardRowIndex < clipboardRows.length;
                    clipboardRowIndex++
                ) {
                    const clipboardCells = clipboardRows[clipboardRowIndex];
                    const targetRowIndex = startRow + clipboardRowIndex;

                    console.group(
                        `[${operationId}] Processing clipboard row ${clipboardRowIndex}/${clipboardRows.length - 1}`,
                    );
                    console.debug(`Row processing details:`, {
                        clipboardRowIndex,
                        targetRowIndex,
                        clipboardCells: clipboardCells.map(
                            (cell, i) => `[${i}]:"${cell}"`,
                        ),
                        currentDataLength: currentData.length,
                        isTargetRowBeyondExisting: targetRowIndex >= currentData.length,
                    });

                    // determine if we're updating existing row or creating new one
                    const existingRow = currentData[targetRowIndex];
                    let targetRow: T;
                    let isNewRow = false;

                    if (existingRow) {
                        // update existing row
                        targetRow = { ...existingRow };
                        console.debug(`Updating existing row:`, {
                            targetRowIndex,
                            existingRowId: existingRow.id,
                            existingRowPosition: existingRow.position,
                            existingRowData: Object.entries(existingRow).reduce(
                                (acc, [key, value]) => {
                                    if (typeof value !== 'function') {
                                        acc[key] = value;
                                    }
                                    return acc;
                                },
                                {} as any,
                            ),
                        });
                    } else {
                        // create new row
                        isNewRow = true;
                        maxPosition++;

                        console.debug(`Creating new row:`, {
                            targetRowIndex,
                            newPosition: maxPosition,
                            availableColumns: currentColumns.length,
                        });

                        // create base row w all column defaults
                        const newRowData = currentColumns.reduce((acc, col, colIndex) => {
                            if (col.accessor === 'id') {
                                console.debug(`Skipping id column ${colIndex}`);
                                return acc;
                            }

                            // set appropriate default values based on column type
                            let defaultValue: any = '';
                            switch (col.type) {
                                case 'select':
                                    defaultValue = '';
                                    console.debug(
                                        `Column ${colIndex} (${String(col.accessor)}) set to empty string for select type`,
                                    );
                                    break;
                                case 'text':
                                default:
                                    defaultValue = '';
                                    console.debug(
                                        `Column ${colIndex} (${String(col.accessor)}) set to empty string for text type`,
                                    );
                                    break;
                            }

                            acc[col.accessor as keyof T] = defaultValue as any;
                            return acc;
                        }, {} as Partial<T>);

                        const newRowId = crypto.randomUUID();
                        targetRow = {
                            ...newRowData,
                            id: newRowId,
                            position: maxPosition,
                        } as T;

                        console.debug(`New row created:`, {
                            newRowId,
                            position: maxPosition,
                            targetRowData: Object.entries(targetRow).reduce(
                                (acc, [key, value]) => {
                                    if (typeof value !== 'function') {
                                        acc[key] = value;
                                    }
                                    return acc;
                                },
                                {} as any,
                            ),
                        });
                    }

                    // track if row has any changes
                    let rowHasChanges = false;

                    // process each cell in the clipboard row
                    for (
                        let cellIndex = 0;
                        cellIndex < clipboardCells.length;
                        cellIndex++
                    ) {
                        const targetColIndex = startCol + cellIndex;
                        const targetColumn = currentColumns[targetColIndex];
                        const cellValue = clipboardCells[cellIndex] ?? '';

                        console.group(
                            `Processing cell [${clipboardRowIndex}][${cellIndex}]`,
                        );
                        console.debug(`Cell details:`, {
                            cellIndex,
                            targetColIndex,
                            rawCellValue: `"${cellValue}"`,
                            trimmedCellValue: `"${cellValue.trim()}"`,
                            columnExists: !!targetColumn,
                            columnInfo: targetColumn
                                ? {
                                      id: targetColumn.id,
                                      accessor: String(targetColumn.accessor),
                                      type: targetColumn.type,
                                      header: targetColumn.header,
                                      hasOptions: Array.isArray(targetColumn.options),
                                      optionsCount: Array.isArray(targetColumn.options)
                                          ? targetColumn.options.length
                                          : 0,
                                  }
                                : 'NO_COLUMN',
                        });

                        // skip if column doesn't exist
                        if (!targetColumn) {
                            console.warn(
                                `Target column ${targetColIndex} doesn't exist, skipping cell`,
                            );
                            console.groupEnd();
                            continue;
                        }

                        // check if priority or status column that should be skipped
                        const columnAccessorLower = String(
                            targetColumn.accessor,
                        ).toLowerCase();
                        const columnHeaderLower = targetColumn.header.toLowerCase();
                        const isPriorityColumn =
                            columnAccessorLower.includes('priority') ||
                            columnHeaderLower.includes('priority');
                        const isStatusColumn =
                            columnAccessorLower.includes('status') ||
                            columnHeaderLower.includes('status');

                        if (isPriorityColumn) {
                            console.debug(
                                `Skipping priority column "${targetColumn.header}" as requested`,
                            );
                            console.groupEnd();
                            continue;
                        }

                        if (isStatusColumn) {
                            console.debug(
                                `Skipping status column "${targetColumn.header}" as requested`,
                            );
                            console.groupEnd();
                            continue;
                        }

                        const newValue = cellValue.trim();
                        const currentValue = (
                            targetRow[targetColumn.accessor] ?? ''
                        ).toString();

                        console.debug(`Value comparison:`, {
                            currentValue: `"${currentValue}"`,
                            newValue: `"${newValue}"`,
                            valuesAreEqual: currentValue === newValue,
                            willSkipDueToSameValue: currentValue === newValue,
                        });

                        // Skip if value hasn't changed
                        if (currentValue === newValue) {
                            console.debug(`Values are identical, skipping cell update`);
                            console.groupEnd();
                            continue;
                        }

                        // Handle different column types
                        let processedValue: any = newValue;

                        switch (targetColumn.type) {
                            case 'multi_select': {
                                // For multi-select columns, split by comma and validate options
                                const rawParts = newValue
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter((s) => s.length > 0);

                                let validOptions: string[] = [];
                                if (Array.isArray(targetColumn.options)) {
                                    validOptions = targetColumn.options.map((opt) => {
                                        if (typeof opt === 'string') return opt;
                                        if (
                                            typeof opt === 'object' &&
                                            opt !== null &&
                                            'label' in opt
                                        ) {
                                            return (opt as { label: string }).label;
                                        }
                                        return String(opt);
                                    });
                                }

                                const filtered =
                                    validOptions.length > 0
                                        ? rawParts.filter((p) => validOptions.includes(p))
                                        : rawParts;

                                processedValue = filtered;
                                console.debug(`Multi-select value parsed`, filtered);
                                break;
                            }
                            case 'people': {
                                // Split comma separated people names
                                const rawParts = newValue
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter((s) => s.length > 0);

                                let validOptions: string[] = [];
                                if (Array.isArray(targetColumn.options)) {
                                    validOptions = targetColumn.options.map((opt) => {
                                        if (typeof opt === 'string') return opt;
                                        if (
                                            typeof opt === 'object' &&
                                            opt !== null &&
                                            'label' in opt
                                        ) {
                                            return (opt as { label: string }).label;
                                        }
                                        return String(opt);
                                    });
                                }

                                const filtered =
                                    validOptions.length > 0
                                        ? rawParts.filter((p) => validOptions.includes(p))
                                        : rawParts;

                                processedValue = filtered;
                                break;
                            }
                            case 'select':
                                console.debug(`Processing select column:`, {
                                    columnOptions: targetColumn.options,
                                    isOptionsArray: Array.isArray(targetColumn.options),
                                });

                                // For select columns, validate against allowed options
                                if (Array.isArray(targetColumn.options)) {
                                    const validOptions = targetColumn.options.map(
                                        (opt) => {
                                            if (typeof opt === 'string') return opt;
                                            if (
                                                typeof opt === 'object' &&
                                                opt !== null &&
                                                'label' in opt
                                            ) {
                                                return (opt as { label: string }).label;
                                            }
                                            return String(opt);
                                        },
                                    );

                                    console.debug(`Valid options for select:`, {
                                        validOptions,
                                        newValueInOptions:
                                            validOptions.includes(newValue),
                                        newValueEmpty: !newValue,
                                    });

                                    // Only use the value if it's in the allowed options, otherwise use empty string
                                    if (newValue && validOptions.includes(newValue)) {
                                        processedValue = newValue;
                                        console.debug(
                                            `Using valid option: "${processedValue}"`,
                                        );
                                    } else if (newValue) {
                                        console.warn(
                                            `Invalid option "${newValue}" for select column "${targetColumn.header}", using empty string`,
                                        );
                                        processedValue = '';
                                    } else {
                                        processedValue = '';
                                        console.debug(
                                            `Empty value for select column, using empty string`,
                                        );
                                    }
                                } else {
                                    console.warn(
                                        `Select column "${targetColumn.header}" has no valid options, using empty string`,
                                    );
                                    processedValue = '';
                                }
                                break;

                            case 'text':
                            default:
                                processedValue = newValue;
                                console.debug(`Using text value: "${processedValue}"`);
                                break;
                        }

                        // Update the target row
                        (targetRow as any)[targetColumn.accessor] = processedValue;
                        rowHasChanges = true;

                        console.debug(`Cell updated successfully:`, {
                            accessor: String(targetColumn.accessor),
                            oldValue: `"${currentValue}"`,
                            newValue: `"${processedValue}"`,
                            columnType: targetColumn.type,
                        });
                        console.groupEnd();
                    }

                    console.debug(`Row processing summary:`, {
                        clipboardRowIndex,
                        isNewRow,
                        rowHasChanges,
                        targetRowId: targetRow.id,
                        targetRowPosition: (targetRow as any).position,
                    });

                    // Only process rows that have changes
                    if (rowHasChanges) {
                        if (isNewRow) {
                            newRowsToCreate.push(targetRow);
                            console.debug(`Added new row to creation queue:`, {
                                rowId: targetRow.id,
                                position: (targetRow as any).position,
                                queueLength: newRowsToCreate.length,
                            });
                        } else {
                            updatedRows.set(targetRow.id, targetRow);

                            // Track changes for editing buffer
                            const changes: Partial<T> = {};
                            for (
                                let cellIndex = 0;
                                cellIndex < clipboardCells.length;
                                cellIndex++
                            ) {
                                const targetColIndex = startCol + cellIndex;
                                const targetColumn = currentColumns[targetColIndex];
                                if (
                                    targetColumn &&
                                    !String(targetColumn.accessor)
                                        .toLowerCase()
                                        .includes('priority') &&
                                    !String(targetColumn.accessor)
                                        .toLowerCase()
                                        .includes('status')
                                ) {
                                    (changes as any)[targetColumn.accessor] = (
                                        targetRow as any
                                    )[targetColumn.accessor];
                                }
                            }
                            editingUpdates[targetRow.id] = changes;

                            console.debug(`Added existing row to update queue:`, {
                                rowId: targetRow.id,
                                changes: Object.entries(changes).reduce(
                                    (acc, [key, value]) => {
                                        acc[key] = value;
                                        return acc;
                                    },
                                    {} as any,
                                ),
                                updateQueueSize: updatedRows.size,
                            });
                        }
                    } else {
                        console.debug(`Row has no changes, skipping`);
                    }
                    console.groupEnd();
                }

                console.debug(`[${operationId}] Final processing summary:`, {
                    clipboardRowsProcessed: clipboardRows.length,
                    existingRowsToUpdate: updatedRows.size,
                    newRowsToCreate: newRowsToCreate.length,
                    editingUpdatesCount: Object.keys(editingUpdates).length,
                    finalMaxPosition: maxPosition,
                    newRowDetails: newRowsToCreate.map((row) => ({
                        id: row.id,
                        position: (row as any).position,
                    })),
                    updatedRowDetails: Array.from(updatedRows.entries()).map(
                        ([id, row]) => ({
                            id,
                            position: (row as any).position,
                        }),
                    ),
                });

                // Apply all changes to local state immediately for optimistic updates
                console.debug(
                    `[${operationId}] Applying optimistic updates to local state...`,
                );

                setLocalData((prevData) => {
                    console.debug(`[${operationId}] Before local data update:`, {
                        prevDataLength: prevData.length,
                    });

                    // create a clean copy of current data
                    const updatedData = [...prevData];

                    // update existing rows in place
                    updatedRows.forEach((updatedRow, rowId) => {
                        const index = updatedData.findIndex((row) => row.id === rowId);
                        if (index !== -1) {
                            updatedData[index] = updatedRow;
                            console.debug(
                                `[${operationId}] Updated row at index ${index}:`,
                                rowId,
                            );
                        }
                    });

                    // append new rows at the end
                    newRowsToCreate.forEach((newRow) => {
                        // double-check this row doesn't already exist
                        if (!updatedData.some((row) => row.id === newRow.id)) {
                            updatedData.push(newRow);
                            console.debug(`[${operationId}] Added new row:`, newRow.id);
                        } else {
                            console.warn(
                                `[${operationId}] Skipping duplicate row:`,
                                newRow.id,
                            );
                        }
                    });

                    const finalArray = updatedData;

                    console.debug(`[${operationId}] Local data update complete:`, {
                        existingRowsUpdated: updatedRows.size,
                        newRowsAdded: newRowsToCreate.length,
                        finalArrayLength: finalArray.length,
                        finalArrayIds: finalArray.map((row) => ({
                            id: row.id,
                            position: row.position,
                        })),
                    });

                    return finalArray;
                });

                // Update editing buffer for existing rows
                if (Object.keys(editingUpdates).length > 0) {
                    console.debug(`[${operationId}] Updating editing buffer:`, {
                        editingUpdatesKeys: Object.keys(editingUpdates),
                        editingUpdatesDetails: editingUpdates,
                    });

                    setEditingData((prev) => ({
                        ...prev,
                        ...editingUpdates,
                    }));
                }

                // Save changes to database
                console.debug(`[${operationId}] Starting database save operations...`);

                const BATCH_SIZE = 10; // process saves in batches to prevent overwhelming the system

                // save updated existing rows in batches
                let savedExistingCount = 0;
                const existingRowEntries = Array.from(updatedRows.entries());
                for (let i = 0; i < existingRowEntries.length; i += BATCH_SIZE) {
                    const batch = existingRowEntries.slice(i, i + BATCH_SIZE);
                    const batchPromises = batch.map(async ([rowId, updatedRow]) => {
                        try {
                            console.debug(
                                `[${operationId}] Saving existing row ${rowId}...`,
                            );
                            await saveRow(updatedRow, false);
                            savedExistingCount++;
                            console.debug(
                                `[${operationId}] Successfully saved existing row ${rowId}`,
                            );
                            return { success: true, rowId };
                        } catch (error) {
                            console.error(
                                `[${operationId}] Failed to save existing row ${rowId}:`,
                                error,
                            );
                            return { success: false, rowId, error };
                        }
                    });

                    // wait for batch to complete before proceeding to next batch
                    await Promise.all(batchPromises);
                    console.debug(
                        `[${operationId}] Completed batch ${Math.floor(i / BATCH_SIZE) + 1} of existing rows`,
                    );
                }

                // save new rows in batches
                let savedNewCount = 0;
                for (let i = 0; i < newRowsToCreate.length; i += BATCH_SIZE) {
                    const batch = newRowsToCreate.slice(i, i + BATCH_SIZE);
                    const batchPromises = batch.map(async (newRow) => {
                        try {
                            console.debug(
                                `[${operationId}] Saving new row ${newRow.id}...`,
                            );
                            await saveRow(newRow, true);
                            savedNewCount++;
                            console.debug(
                                `[${operationId}] Successfully saved new row ${newRow.id}`,
                            );
                            return { success: true, rowId: newRow.id };
                        } catch (error) {
                            console.error(
                                `[${operationId}] Failed to save new row ${newRow.id}:`,
                                error,
                            );
                            return { success: false, rowId: newRow.id, error };
                        }
                    });

                    // wait for batch to complete before proceeding to next batch
                    await Promise.all(batchPromises);
                    console.debug(
                        `[${operationId}] Completed batch ${Math.floor(i / BATCH_SIZE) + 1} of new rows`,
                    );

                    // small delay between batches to prevent overwhelming the system
                    if (i + BATCH_SIZE < newRowsToCreate.length) {
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }
                }

                console.debug(`[${operationId}] Database save summary:`, {
                    existingRowsSaved: savedExistingCount,
                    newRowsSaved: savedNewCount,
                    totalRowsSaved: savedExistingCount + savedNewCount,
                });

                // ensure all saves are fully processed before allowing sync
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // force a refresh from the database
                console.debug(`[${operationId}] Forcing data refresh...`);
                await onPostSave?.();
                await new Promise((resolve) => setTimeout(resolve, 500)); // additional wait after refresh

                // mark paste operation as completing to prevent sync interference
                isPastingRef.current = true;

                // save table metadata
                try {
                    await saveTableMetadata();
                    console.debug(`[${operationId}] saveTableMetadata completed`);
                } catch (error) {
                    console.error(`[${operationId}] saveTableMetadata failed:`, error);
                }

                console.debug(`[${operationId}] Paste operation completed successfully`);
            } catch (error) {
                console.error(`[${operationId}] Paste operation failed:`, error);
                if (error instanceof Error) {
                    console.error(`[${operationId}] Error stack:`, error.stack);
                }
            } finally {
                // track pasted rows for deduplication
                newRowsToCreate.forEach((row) => {
                    recentlyPastedRowsRef.current.add(row.id);
                });

                // clear pasted row tracking after sufficient time for db sync
                setTimeout(() => {
                    recentlyPastedRowsRef.current.clear();
                    console.debug(
                        `[${operationId}] Cleared recently pasted rows tracking`,
                    );
                }, 10000);

                console.debug(`[${operationId}] Waiting for database acknowledgment...`);

                // reset pasting flag and restore selection after operations complete
                setTimeout(() => {
                    // Always clear flags after paste completes to avoid soft-locking
                    isPastingRef.current = false;
                    pasteOperationActiveRef.current = false;
                    console.debug(`[${operationId}] Paste flags cleared safely`);

                    setGridSelection({
                        rows: CompactSelection.empty(),
                        columns: CompactSelection.empty(),
                    });
                    setSelection(undefined);
                    selectionRef.current = undefined;

                    console.debug(`[${operationId}] Paste operation fully completed`);
                    console.groupEnd();
                }, 3000);
            }
        },
        [isEditMode, sortedData, onPostSave, saveTableMetadata, saveRow, localData],
    );

    // paste event listener setup
    useEffect(() => {
        const tableElement = tableRef.current;
        if (!tableElement) {
            return;
        }

        // helper to decide if we should intercept paste
        const shouldHandlePaste = (event: ClipboardEvent) => {
            if (!isEditMode) return false;

            const target = event.target as HTMLElement | null;
            const isWithinTable = !!target && tableElement.contains(target);

            // Do not intercept when typing into a text field/contentEditable
            const isTypingIntoTextField =
                !!target &&
                (target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    (target as HTMLElement).isContentEditable === true);

            // If a popup cell editor is active, let it handle the paste
            const isOverlayEditing =
                (isEditingCellRef as React.RefObject<boolean>).current === true;

            // Consider grid "active" if we have a selection or last selected cell
            const hasGridContext =
                !!selectionRef.current?.current?.cell || !!lastSelectedCellRef.current;

            return (
                isWithinTable ||
                (hasGridContext && !isTypingIntoTextField && !isOverlayEditing)
            );
        };

        // main paste handler
        const pasteHandler = (event: ClipboardEvent) => {
            if (shouldHandlePaste(event)) {
                return handlePaste(event);
            }
        };

        // attach paste listener to the table element
        tableElement.addEventListener('paste', pasteHandler, {
            capture: true,
            passive: false,
        });

        // attach to window as a fallback
        const windowPasteHandler = (event: ClipboardEvent) => {
            if (shouldHandlePaste(event)) {
                return handlePaste(event);
            }
        };

        window.addEventListener('paste', windowPasteHandler, {
            capture: true,
            passive: false,
        });

        // cleanup function
        return () => {
            tableElement.removeEventListener('paste', pasteHandler, {
                capture: true,
            });

            window.removeEventListener('paste', windowPasteHandler, {
                capture: true,
            });
        };
    }, [handlePaste, isEditMode]);

    // enhanced selection change handler
    const handleSelectionChange = useCallback((newSelection: GridSelection) => {
        console.debug('[handleSelectionChange] Selection updated:', {
            hasSelection: !!newSelection?.current,
            cell: newSelection?.current?.cell,
            range: newSelection?.current?.range,
        });
        setSelection(newSelection);
    }, []);

    if (isLoading) {
        return <TableLoadingSkeleton columns={columns.length} />;
    }

    // Map PropertyType (db) to EditableColumnType (ui)
    const propertyTypeToColumnType = (type: PropertyType): EditableColumnType => {
        switch (type) {
            case PropertyType.select:
                return 'select';
            case PropertyType.multi_select:
                return 'multi_select';
            case PropertyType.number:
                return 'number';
            case PropertyType.date:
                return 'date';
            default:
                return 'text';
        }
    };

    async function insertColumnAt(colIndex: number) {
        // open the full Add Column dialog used at block level, but insert at this index
        setPendingInsertIndex(colIndex);
        setAddColumnDialogOpen(true);
    }

    // Note: if we want to clear the highlighting on the cells on blur, need to use girdSelection in DataEditor and track manually.
    return (
        <div className="w-full">
            {showFilter && (
                <TableControls
                    filterComponent={filterComponent}
                    showFilter={showFilter}
                    onNewRow={onAddRow || (() => {})}
                    onEnterEditMode={() => {}}
                    isVisible={true}
                    orgId=""
                    projectId=""
                    documentId=""
                />
            )}

            <div
                className="w-full"
                ref={tableRef}
                tabIndex={-1}
                style={{
                    overflowX: 'auto',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '100%',
                    position: 'relative',
                }}
            >
                <div style={{ width: '100%' }}>
                    <div
                        style={{
                            // calculating dynamic height based on rows
                            height: Math.min(
                                89 +
                                    sortedData.slice(0, 11).reduce((total, _, index) => {
                                        // showing max 10 rows
                                        const rowData = sortedData[index];
                                        if (!rowData) return total + 43; // default height

                                        if (rowData.height && rowData.height > 43) {
                                            return total + rowData.height;
                                        }

                                        const currentColumnWidths = localColumns.reduce(
                                            (acc, col) => {
                                                acc[col.accessor as string] =
                                                    colSizes[col.accessor] ||
                                                    col.width ||
                                                    360; // This determins max column width.
                                                return acc;
                                            },
                                            {} as Record<string, number>,
                                        );
                                        return (
                                            total +
                                            calculateMinRowHeight(
                                                rowData,
                                                currentColumnWidths,
                                            )
                                        );
                                    }, 0),
                                500, // max height before scrolling
                            ),
                            minHeight: 89,
                            // Smooth row height transitions
                            transition: 'height 0.35s ease-in-out',
                        }}
                    >
                        <DataEditor
                            ref={gridRef}
                            columns={columnDefs}
                            customRenderers={[
                                FixedDropdownCell,
                                FixedMultiSelectCell,
                                ...allCells,
                            ]}
                            width={tableRef.current?.offsetWidth || undefined}
                            getCellContent={getCellContent}
                            getCellsForSelection={getCellsForSelection}
                            onCellEdited={isEditMode ? onCellEdited : undefined}
                            onCellActivated={handleCellActivated}
                            onKeyDown={handleGridKeyDown}
                            rows={sortedData.length}
                            rowHeight={(row) => {
                                const rowData = sortedData[row];
                                if (!rowData) return 43; // default height

                                if (rowData.height && rowData.height > 43) {
                                    return rowData.height;
                                }

                                const currentColumnWidths = localColumns.reduce(
                                    (acc, col) => {
                                        acc[col.accessor as string] =
                                            colSizes[col.accessor] || col.width || 120;
                                        return acc;
                                    },
                                    {} as Record<string, number>,
                                );
                                return calculateMinRowHeight(
                                    rowData,
                                    currentColumnWidths,
                                );
                            }}
                            onColumnResize={isEditMode ? handleColumnResize : undefined}
                            onColumnMoved={isEditMode ? handleColumnMoved : undefined}
                            gridSelection={gridSelection}
                            onGridSelectionChange={handleGridSelectionChange}
                            trailingRowOptions={{
                                tint: true,
                                sticky: true,
                            }}
                            // onRowAppended={isEditMode ? handleRowAppended : undefined}

                            onRowAppended={
                                isEditMode
                                    ? (colIndex?: number) => {
                                          handleRowAppended();
                                      }
                                    : undefined
                            }
                            rowMarkers="both"
                            onRowMoved={isEditMode ? handleRowMoved : undefined}
                            theme={
                                resolvedTheme === 'dark'
                                    ? glideDarkTheme
                                    : glideLightTheme
                            }
                            //onRowResize={handleRowResize}
                            onHeaderMenuClick={
                                isEditMode
                                    ? (col, bounds) => {
                                          setColumnMenu({
                                              colIndex: col,
                                              bounds: bounds,
                                          });
                                      }
                                    : undefined
                            }
                            // Right side DOM element for row actions (deletion). Should prob be own component.
                            rightElement={
                                isEditMode && gridSelection.rows.length > 0
                                    ? (() => {
                                          const selectedRowIndices =
                                              gridSelection.rows.toArray();
                                          const rowsToDelete = selectedRowIndices.map(
                                              (i) => sortedData[i],
                                          );

                                          return (
                                              <div
                                                  style={{
                                                      position: 'absolute',
                                                      bottom: 16,
                                                      right: 16,
                                                      zIndex: 1000,
                                                      pointerEvents: 'auto',
                                                      transition:
                                                          'opacity 0.2s ease-in-out',
                                                  }}
                                              >
                                                  <button
                                                      onClick={() => {
                                                          setRowsToDelete(rowsToDelete);
                                                          if (props.skipDeleteConfirm) {
                                                              setTimeout(() => handleRowDeleteConfirm(), 0);
                                                          } else {
                                                              setRowDeleteConfirmOpen(true);
                                                          }
                                                      }}
                                                      style={{
                                                          height: 42,
                                                          lineHeight: '42px',
                                                          padding: '0 24px',
                                                          backgroundColor: '#7C3AED',
                                                          color: 'white',
                                                          border: 'none',
                                                          fontWeight: 600,
                                                          fontSize: 14,
                                                          cursor: 'pointer',
                                                          boxShadow:
                                                              '0 4px 16px rgba(0, 0, 0, 0.15)',
                                                          backdropFilter: 'blur(10px)',
                                                          background:
                                                              resolvedTheme === 'dark'
                                                                  ? 'rgba(124, 58, 237, 0.8)'
                                                                  : 'rgba(124, 58, 237, 0.85)',
                                                          transition:
                                                              'background 0.2s ease-in-out',
                                                          whiteSpace: 'nowrap',
                                                          display: 'inline-block',
                                                      }}
                                                      onMouseEnter={(e) =>
                                                          (e.currentTarget.style.backgroundColor =
                                                              resolvedTheme === 'dark'
                                                                  ? 'rgba(140, 95, 202, 1)'
                                                                  : 'rgba(140, 95, 202, 1)')
                                                      }
                                                      onMouseLeave={(e) =>
                                                          (e.currentTarget.style.backgroundColor =
                                                              resolvedTheme === 'dark'
                                                                  ? 'rgba(124, 58, 237, 0.8)'
                                                                  : 'rgba(124, 58, 237, 0.85)')
                                                      }
                                                  >
                                                      Delete {selectedRowIndices.length}{' '}
                                                      Row
                                                      {selectedRowIndices.length !== 1
                                                          ? 's'
                                                          : ''}
                                                  </button>
                                              </div>
                                          );
                                      })()
                                    : null
                            }
                            rightElementProps={{
                                sticky: true,
                            }}
                        />

                        {props.rowDetailPanel ? (
                            <props.rowDetailPanel
                                row={selectedRow}
                                open={isRowDetailOpen}
                                onOpenChange={(open) => {
                                    setIsRowDetailOpen(open);
                                    if (!open) {
                                        setSelectedRowId(null);
                                        setTimeout(() => {
                                            gridRef.current?.focus();
                                        }, 50);
                                    }
                                }}
                                columns={localColumns as EditableColumn<T>[]}
                            />
                        ) : null}

                        {/* Add Column Dialog invoked from header menu (left/right) */}
                        {isEditMode && (
                            <AddColumnDialog
                                isOpen={addColumnDialogOpen}
                                onClose={() => {
                                    setAddColumnDialogOpen(false);
                                    setPendingInsertIndex(null);
                                    // keep menu closed and refocus grid for keyboard flow
                                    setTimeout(() => gridRef.current?.focus(), 50);
                                }}
                                onSave={async (
                                    name,
                                    type,
                                    propertyConfig,
                                    defaultValue,
                                ) => {
                                    if (pendingInsertIndex == null) return;
                                    try {
                                        if (!blockId || !userId) return;
                                        const { property, column } =
                                            await createPropertyAndColumn(
                                                name,
                                                type,
                                                propertyConfig,
                                                defaultValue,
                                                blockId,
                                                userId,
                                            );

                                        const newCol: any = {
                                            id: column.id,
                                            header: property.name,
                                            title: property.name,
                                            accessor: property.name as keyof T,
                                            type,
                                            width: column.width ?? 200,
                                            position: pendingInsertIndex,
                                            required: false,
                                            isSortable: true,
                                            ...(type === 'select' ||
                                            type === 'multi_select'
                                                ? {
                                                      options:
                                                          (property.options as any)
                                                              ?.values || [],
                                                  }
                                                : {}),
                                        } as EditableColumn<T> & { title: string };

                                        setLocalColumns((prev) => {
                                            const next = [...prev];
                                            const clamped = Math.max(
                                                0,
                                                Math.min(pendingInsertIndex, next.length),
                                            );
                                            next.splice(clamped, 0, newCol);
                                            const reindexed = next.map((c, i) => ({
                                                ...c,
                                                position: i,
                                            }));
                                            localColumnsRef.current =
                                                reindexed as typeof localColumnsRef.current;
                                            return reindexed as typeof prev;
                                        });

                                        await saveTableMetadataRef.current?.();
                                        await onPostSave?.();
                                    } finally {
                                        setAddColumnDialogOpen(false);
                                        setPendingInsertIndex(null);
                                        setTimeout(() => gridRef.current?.focus(), 50);
                                    }
                                }}
                                onSaveFromProperty={async (
                                    propertyId: string,
                                    defaultValue: string,
                                ) => {
                                    if (pendingInsertIndex == null) return;
                                    try {
                                        if (!blockId || !userId) return;
                                        const result = await createColumnFromProperty(
                                            propertyId,
                                            defaultValue,
                                            blockId,
                                            userId,
                                        );
                                        const column = result.column;
                                        const property = result.property as
                                            | {
                                                  name: string;
                                                  property_type: any;
                                                  options?: unknown;
                                              }
                                            | undefined;

                                        if (!property) {
                                            console.error(
                                                '[GlideEditableTable] Missing property payload from createColumnFromProperty',
                                            );
                                            return;
                                        }

                                        const mappedType = propertyTypeToColumnType(
                                            property.property_type,
                                        );
                                        const newCol: any = {
                                            id: column.id,
                                            header: property.name,
                                            title: property.name,
                                            accessor: property.name as keyof T,
                                            type: mappedType,
                                            width: column.width ?? 150,
                                            position: pendingInsertIndex,
                                            required: false,
                                            isSortable: true,
                                            ...(mappedType === 'select' ||
                                            mappedType === 'multi_select'
                                                ? {
                                                      options:
                                                          (property.options as any)
                                                              ?.values || [],
                                                  }
                                                : {}),
                                        } as EditableColumn<T> & { title: string };

                                        setLocalColumns((prev) => {
                                            const next = [...prev];
                                            const clamped = Math.max(
                                                0,
                                                Math.min(pendingInsertIndex, next.length),
                                            );
                                            next.splice(clamped, 0, newCol);
                                            const reindexed = next.map((c, i) => ({
                                                ...c,
                                                position: i,
                                            }));
                                            localColumnsRef.current =
                                                reindexed as typeof localColumnsRef.current;
                                            return reindexed as typeof prev;
                                        });

                                        await saveTableMetadataRef.current?.();
                                        await onPostSave?.();
                                    } finally {
                                        setAddColumnDialogOpen(false);
                                        setPendingInsertIndex(null);
                                        setTimeout(() => gridRef.current?.focus(), 50);
                                    }
                                }}
                                orgId={String(orgId)}
                                projectId={String(projectId)}
                                documentId={String(documentId)}
                            />
                        )}

                        {columnMenu &&
                            renderLayer(
                                <div
                                    {...layerProps}
                                    style={{
                                        ...layerProps.style,
                                        background:
                                            resolvedTheme === 'dark'
                                                ? '#1f1f1f'
                                                : '#ffffff', // background color
                                        border:
                                            resolvedTheme === 'dark'
                                                ? '1px solid #444'
                                                : '1px solid #ccc', // border
                                        // dropdown shadows
                                        boxShadow:
                                            resolvedTheme === 'dark'
                                                ? '0px 6px 16px rgba(0, 0, 0, 0.6)'
                                                : '0px 6px 16px rgba(0, 0, 0, 0.12)',
                                        padding: 6,
                                        zIndex: 1000,
                                        color:
                                            resolvedTheme === 'dark' ? '#ffffff' : '#222',
                                        minWidth: 160,
                                    }}
                                >
                                    <div
                                        onClick={() => {
                                            handleSortByColumn(
                                                columnMenu.colIndex,
                                                'asc',
                                            );
                                            setColumnMenu(undefined);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background:
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9',
                                            borderBottom:
                                                resolvedTheme === 'dark'
                                                    ? '1px solid #333'
                                                    : '1px solid #eee',
                                            color:
                                                resolvedTheme === 'dark'
                                                    ? '#f1f1f1'
                                                    : '#222',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#3a3a3a'
                                                    : '#e6e6e6')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9')
                                        }
                                    >
                                        Sort Ascending
                                    </div>

                                    <div
                                        onClick={() => {
                                            handleSortByColumn(
                                                columnMenu.colIndex,
                                                'desc',
                                            );
                                            setColumnMenu(undefined);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background:
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9',
                                            borderBottom:
                                                resolvedTheme === 'dark'
                                                    ? '1px solid #333'
                                                    : '1px solid #eee',
                                            color:
                                                resolvedTheme === 'dark'
                                                    ? '#f1f1f1'
                                                    : '#222',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#3a3a3a'
                                                    : '#e6e6e6')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9')
                                        }
                                    >
                                        Sort Descending
                                    </div>

                                    <div
                                        onClick={() => {
                                            insertColumnAt(columnMenu.colIndex);
                                            setColumnMenu(undefined);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background:
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9',
                                            borderBottom:
                                                resolvedTheme === 'dark'
                                                    ? '1px solid #333'
                                                    : '1px solid #eee', // subtle divider between items
                                            color:
                                                resolvedTheme === 'dark'
                                                    ? '#f1f1f1'
                                                    : '#222', // text color
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={
                                            (e) =>
                                                (e.currentTarget.style.background =
                                                    resolvedTheme === 'dark'
                                                        ? '#3a3a3a'
                                                        : '#e6e6e6') // hover background effect
                                        }
                                        onMouseLeave={
                                            (e) =>
                                                (e.currentTarget.style.background =
                                                    resolvedTheme === 'dark'
                                                        ? '#1f1f1f'
                                                        : '#f9f9f9') // revert when mouse leaves
                                        }
                                    >
                                        + Add Column Left
                                    </div>

                                    <div
                                        onClick={() => {
                                            insertColumnAt(columnMenu.colIndex + 1);
                                            setColumnMenu(undefined);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background:
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9',
                                            borderBottom:
                                                resolvedTheme === 'dark'
                                                    ? '1px solid #333'
                                                    : '1px solid #eee',
                                            color:
                                                resolvedTheme === 'dark'
                                                    ? '#f1f1f1'
                                                    : '#222',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#3a3a3a'
                                                    : '#e6e6e6')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9')
                                        }
                                    >
                                        + Add Column Right
                                    </div>

                                    <div
                                        onClick={() => {
                                            const col = localColumns[columnMenu.colIndex];
                                            if (col) {
                                                // check if this is a default column
                                                // prevent renaming system columns
                                                if (isSystemColumn(col.header)) {
                                                    alert(
                                                        `"${col.header}" is a system column and cannot be renamed.`,
                                                    );
                                                    setColumnMenu(undefined);
                                                    return;
                                                }

                                                setColumnToRename({
                                                    id: col.id,
                                                    currentName: col.header,
                                                });
                                                setRenameDialogOpen(true);
                                                setColumnMenu(undefined);
                                            }
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background:
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9',
                                            borderBottom:
                                                resolvedTheme === 'dark'
                                                    ? '1px solid #333'
                                                    : '1px solid #eee',
                                            color:
                                                resolvedTheme === 'dark'
                                                    ? '#f1f1f1'
                                                    : '#222',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#3a3a3a'
                                                    : '#e6e6e6')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9')
                                        }
                                    >
                                        Rename Column
                                    </div>

                                    <div
                                        onClick={() => {
                                            const colId =
                                                localColumns[columnMenu.colIndex]?.id;
                                            if (colId) {
                                                console.log(
                                                    'Column ID to delete:',
                                                    colId,
                                                );
                                                setColumnToDelete(colId);
                                                setDeleteConfirmOpen?.(true);
                                                setTimeout(() => {
                                                    setColumnMenu(undefined);
                                                }, 0);
                                            } else {
                                                setColumnMenu(undefined);
                                            }
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background:
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9',
                                            borderBottom:
                                                resolvedTheme === 'dark'
                                                    ? '1px solid #333'
                                                    : '1px solid #eee',
                                            color:
                                                resolvedTheme === 'dark'
                                                    ? '#ed3f3f'
                                                    : 'red',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#3a3a3a'
                                                    : '#e6e6e6')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9')
                                        }
                                    >
                                        x Delete Column
                                    </div>

                                    <div
                                        onClick={() => {
                                            setColumnMenu(undefined);
                                        }}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            background:
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9',
                                            color:
                                                resolvedTheme === 'dark'
                                                    ? '#f1f1f1'
                                                    : '#222',
                                            transition: 'background 0.2s ease',
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#3a3a3a'
                                                    : '#e6e6e6')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                                resolvedTheme === 'dark'
                                                    ? '#1f1f1f'
                                                    : '#f9f9f9')
                                        }
                                    >
                                        x Close Menu
                                    </div>
                                </div>,
                            )}
                    </div>
                </div>
                <DeleteConfirmDialog
                    open={deleteConfirmOpen}
                    onOpenChange={(open) => setDeleteConfirmOpen?.(open)}
                    onConfirm={handleColumnDeleteConfirm}
                />
                <DeleteConfirmDialog
                    open={rowDeleteConfirmOpen}
                    onOpenChange={(open) => {
                        setRowDeleteConfirmOpen(open);
                        if (!open) {
                            setRowsToDelete([]);
                        }
                    }}
                    onConfirm={handleRowDeleteConfirm}
                />
                <RenameColumnDialog
                    open={renameDialogOpen}
                    onOpenChange={(open: boolean) => {
                        setRenameDialogOpen(open);
                        if (!open) {
                            setColumnToRename(null);
                        }
                    }}
                    currentName={columnToRename?.currentName || ''}
                    onConfirm={handleColumnRename}
                />
            </div>
        </div>
    );
}
