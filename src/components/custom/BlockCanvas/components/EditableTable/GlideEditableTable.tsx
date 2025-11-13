'use client';

/* eslint-disable @typescript-eslint/no-unused-vars, prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import '@/styles/globals.css';

import DataEditor, {
    CompactSelection,
    DataEditorRef,
    GridCell,
    GridCellKind,
    GridColumn,
    GridSelection,
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

import {
    BlockTableMetadata,
    useBlockMetadataActions,
} from '@/components/custom/BlockCanvas/hooks/useBlockMetadataActions';
import { useColumnActions } from '@/components/custom/BlockCanvas/hooks/useColumnActions';
import { PropertyType } from '@/components/custom/BlockCanvas/types';
import { useAuthenticatedSupabase } from '@/hooks/useAuthenticatedSupabase';
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

export function GlideEditableTable<T extends BaseRow = BaseRow>(
    props: GlideTableProps<T>,
) {
    const { resolvedTheme } = useTheme();

    const {
        data,
        columns,
        onSave,
        onPostSave,
        isEditMode = false,
        showFilter = false,
        filterComponent,
        onAddRow,
        isLoading = false,
        blockId,
        dataAdapter,
        onDelete,
        rowMetadataKey,
        rowDetailPanel,
        tableMetadata,
    } = props;

    const [selection, setSelection] = useState<GridSelection | undefined>(undefined);
    const selectionRef = useRef<GridSelection | undefined>(undefined);

    type PasteState = {
        isPasting: boolean;
        pasteOperationActive: boolean;
        recentlyPastedRows: Set<string>;
        pasteOperationId: number;
        columnCreationPromises: Map<string, Promise<any>>;
        columnVerificationPromises: Map<string, Promise<boolean>>;
        savePromises: Map<string, Promise<any>>;
        columnsConfirmed: boolean; // Tracks if columns have been confirmed for this table
        columnConfirmationPromise: Promise<boolean> | null;
        columnCreationPromise: Promise<
            Array<{
                success: boolean;
                columnId?: string;
                tempId: string;
                realAccessor?: string;
                error?: any;
            }>
        > | null;
    };

    const pasteStateMapRef = useRef<Map<string, PasteState>>(new Map());

    const getPasteState = useCallback((): PasteState => {
        const tableId = blockId || 'default';
        if (!pasteStateMapRef.current.has(tableId)) {
            pasteStateMapRef.current.set(tableId, {
                isPasting: false,
                pasteOperationActive: false,
                recentlyPastedRows: new Set(),
                pasteOperationId: 0,
                columnCreationPromises: new Map(),
                columnCreationPromise: null,
                columnVerificationPromises: new Map(),
                savePromises: new Map(),
                columnsConfirmed: false,
                columnConfirmationPromise: null,
            });
        }
        return pasteStateMapRef.current.get(tableId)!;
    }, [blockId]);

    useEffect(() => {
        return () => {
            if (blockId) {
                pasteStateMapRef.current.delete(blockId);
            }
        };
    }, [blockId]);

    const tableRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<DataEditorRef | null>(null);
    const lastEditedCellRef = useRef<Item | undefined>(undefined);
    const isEditingCellRef = useRef<boolean>(false);

    const lastSelectedCellRef = useRef<Item | undefined>(undefined);
    const onCellEditedRef = useRef<((cell: Item, newValue: GridCell) => void) | null>(
        null,
    );

    const prevEditModeRef = useRef<boolean>(isEditMode);
    const isSavingRef = useRef(false);
    const deletedRowIdsRef = useRef<Set<string>>(new Set());
    const deletedColumnIdsRef = useRef<Set<string>>(new Set());

    const { profile } = useUser();
    const userId = profile?.id;
    const userName = profile?.full_name || '';

    const { updateBlockMetadata } = useBlockMetadataActions();
    const saveRow = useCallback(
        async (
            item: T,
            isNew: boolean,
            context?: { blockId?: string; skipRefresh?: boolean },
        ) => {
            if (dataAdapter) {
                await dataAdapter.saveRow(item, isNew, { blockId, ...context });
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

    const refreshAfterSave = useCallback(
        async (skipIfPasting: boolean = false) => {
            // Prevent premature refresh during paste operations
            if (skipIfPasting) {
                const pasteState = getPasteState();
                if (pasteState.isPasting || pasteState.pasteOperationActive) {
                    console.debug(
                        '[refreshAfterSave] Skipping refresh - paste operation in progress',
                    );
                    return;
                }
            }

            if (dataAdapter?.postSaveRefresh) {
                await dataAdapter.postSaveRefresh();
            } else {
                await onPostSave?.();
            }
        },
        [dataAdapter, onPostSave, getPasteState],
    );

    const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [columnToRename, setColumnToRename] = useState<{
        id: string;
        currentName: string;
    } | null>(null);

    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
    const [isRowDetailOpen, setIsRowDetailOpen] = useState(false);

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

    const isUndoingRef = useRef(false);

    const addToHistory = useCallback(
        (action: (typeof historyRef.current)[0]) => {
            if (isUndoingRef.current) return;

            if (historyIndex < historyRef.current.length - 1) {
                historyRef.current = historyRef.current.slice(0, historyIndex + 1);
            }

            historyRef.current.push(action);

            if (historyRef.current.length > 100) {
                historyRef.current = historyRef.current.slice(-100);
            }

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

    const [editingData, setEditingData] = useState<Record<string, Partial<T>>>({});
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

            const currentColumns = localColumnsRef.current;

            for (const [rowId, changes] of rows) {
                const originalItem = data.find((d) => d.id === rowId);
                if (!originalItem) {
                    continue;
                }

                const remappedChanges: any = {};
                Object.entries(changes).forEach(([key, value]) => {
                    const column = currentColumns.find(
                        (col) => col.accessor === key || col.header === key,
                    );
                    if (column) {
                        remappedChanges[column.header] = value;
                    } else {
                        remappedChanges[key] = value;
                    }
                });

                const fullItem: T = { ...originalItem, ...remappedChanges };
                await saveRow(fullItem, false);
            }

            await refreshAfterSave();

            await new Promise((r) => setTimeout(r, 250));
            setEditingData({});
        } catch (error) {
            console.error('[handleSaveAll] Error:', error);
        } finally {
            isSavingRef.current = false;
        }
    }, [refreshAfterSave, data, saveRow]);

    const useDebouncedSave = (delay = 5000) => {
        const debounced = useRef(
            debounce(() => {
                void handleSaveAllRef.current?.();
                void saveTableMetadataRef.current?.();
            }, delay),
        );

        useEffect(() => {
            const d = debounced.current;
            return () => d.cancel();
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

        handleResize();
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

    const { createPropertyAndColumn, createColumnFromProperty, appendPropertyOptions } =
        useColumnActions({
            orgId: String(orgId),
            projectId: String(projectId),
            documentId: String(documentId),
        });

    const {
        supabase,
        isLoading: supabaseLoading,
        error: supabaseError,
        getClientOrThrow,
    } = useAuthenticatedSupabase();

    const waitForSupabaseClient = useCallback(
        async (maxRetries = 10, delayMs = 100): Promise<void> => {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    getClientOrThrow();
                    return; // Client is ready
                } catch (error) {
                    if (i < maxRetries - 1) {
                        await new Promise((resolve) => setTimeout(resolve, delayMs));
                    } else {
                        throw new Error(
                            'Supabase client failed to initialize after retries',
                        );
                    }
                }
            }
        },
        [getClientOrThrow],
    );

    const verifyColumnsExist = useCallback(
        async (
            columnIds: string[],
            maxRetries = 10,
            initialDelayMs = 100,
            maxDelayMs = 500,
        ): Promise<boolean> => {
            if (columnIds.length === 0) return true;

            await waitForSupabaseClient();
            const supabase = getClientOrThrow();
            const tableId = blockId || 'default';

            let delayMs = initialDelayMs;

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const { data: columns, error } = await supabase
                        .from('columns')
                        .select('id, block_id')
                        .in('id', columnIds)
                        .eq('block_id', tableId);

                    if (error) {
                        console.warn(
                            `[verifyColumnsExist] Query error on attempt ${attempt + 1}/${maxRetries} for table ${tableId}:`,
                            error,
                        );
                        if (attempt < maxRetries - 1) {
                            await new Promise((resolve) => setTimeout(resolve, delayMs));
                            delayMs = Math.min(delayMs * 1.5, maxDelayMs);
                            continue;
                        }
                        return false;
                    }

                    const foundIds = new Set((columns || []).map((col) => col.id));
                    const allFound = columnIds.every((id) => foundIds.has(id));

                    if (allFound) {
                        console.debug(
                            `[verifyColumnsExist] All ${columnIds.length} columns verified in database for table ${tableId} after ${attempt + 1} attempt(s)`,
                        );
                        return true;
                    }

                    const missing = columnIds.filter((id) => !foundIds.has(id));
                    console.debug(
                        `[verifyColumnsExist] Attempt ${attempt + 1}/${maxRetries} for table ${tableId}: Found ${foundIds.size}/${columnIds.length} columns. Missing: ${missing.join(', ')}`,
                    );

                    if (attempt < maxRetries - 1) {
                        await new Promise((resolve) => setTimeout(resolve, delayMs));
                        delayMs = Math.min(delayMs * 1.5, maxDelayMs);
                    } else {
                        console.warn(
                            `[verifyColumnsExist] Failed to verify all columns for table ${tableId} after ${maxRetries} attempts. Missing: ${missing.join(', ')}`,
                        );
                        return false;
                    }
                } catch (error) {
                    console.error(
                        `[verifyColumnsExist] Error on attempt ${attempt + 1}/${maxRetries} for table ${tableId}:`,
                        error,
                    );
                    if (attempt < maxRetries - 1) {
                        await new Promise((resolve) => setTimeout(resolve, delayMs));
                        delayMs = Math.min(delayMs * 1.5, maxDelayMs); // Exponential backoff
                    } else {
                        return false;
                    }
                }
            }

            return false;
        },
        [waitForSupabaseClient, getClientOrThrow, blockId],
    );

    const confirmColumnsForTable = useCallback(
        async (columnIds: string[], operationId: string): Promise<boolean> => {
            const pasteState = getPasteState();
            const tableId = blockId || 'default';

            if (pasteState.columnsConfirmed) {
                console.debug(
                    `[confirmColumnsForTable] Columns already confirmed for table ${tableId}, skipping`,
                );
                return true;
            }

            if (pasteState.columnConfirmationPromise) {
                console.debug(
                    `[confirmColumnsForTable] Column confirmation already in progress for table ${tableId}, waiting...`,
                );
                return await pasteState.columnConfirmationPromise;
            }

            console.debug(
                `[${operationId}] Starting column confirmation barrier for table ${tableId} with ${columnIds.length} columns...`,
            );

            const confirmationPromise = (async (): Promise<boolean> => {
                try {
                    const verified = await verifyColumnsExist(columnIds);

                    if (verified) {
                        pasteState.columnsConfirmed = true;
                        console.debug(
                            `[${operationId}] Column confirmation barrier PASSED for table ${tableId}. All columns verified.`,
                        );
                        return true;
                    } else {
                        console.warn(
                            `[${operationId}] Column confirmation barrier FAILED for table ${tableId}. Some columns not verified.`,
                        );
                        pasteState.columnsConfirmed = true;
                        return false;
                    }
                } catch (error) {
                    console.error(
                        `[${operationId}] Column confirmation barrier ERROR for table ${tableId}:`,
                        error,
                    );
                    pasteState.columnsConfirmed = true;
                    return false;
                } finally {
                    pasteState.columnConfirmationPromise = null;
                }
            })();

            pasteState.columnConfirmationPromise = confirmationPromise;

            return await confirmationPromise;
        },
        [getPasteState, blockId, verifyColumnsExist],
    );

    const { data: peopleNames = [] } = usePeopleOptions(
        String(orgId) || undefined,
        String(projectId) || undefined,
    );

    const normalizedColumns = useMemo(() => {
        return columns.map((col) => ({
            ...col,
            title: col.header, // map header to title
        }));
    }, [columns]);

    const [localColumns, setLocalColumns] = useState(() => {
        const sorted = [...normalizedColumns].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0),
        );
        return sorted.map((col, index) => ({
            ...col,
            position: col.position !== undefined ? col.position : index,
        }));
    });

    const prevBlockIdRef = useRef(blockId);
    useEffect(() => {
        if (blockId && blockId !== prevBlockIdRef.current) {
            console.log('[GlideEditableTable] Block ID changed, resetting columns', {
                oldBlockId: prevBlockIdRef.current,
                newBlockId: blockId,
            });

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

    const sortedData = useMemo(() => {
        return [...localData]
            .filter((row) => !deletedRowIdsRef.current.has(row.id))
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }, [localData]);

    const sortedDataRef = useRef<T[]>([]);
    useEffect(() => {
        sortedDataRef.current = sortedData;
    }, [sortedData]);

    const selectedRow = useMemo(() => {
        return sortedData.find((r) => r.id === selectedRowId) || null;
    }, [sortedData, selectedRowId]);

    const [gridSelection, setGridSelection] = useState<GridSelection>({
        rows: CompactSelection.empty(),
        columns: CompactSelection.empty(),
    });
    const [rowDeleteConfirmOpen, setRowDeleteConfirmOpen] = useState(false);
    const [rowsToDelete, setRowsToDelete] = useState<T[]>([]);

    const handleGridSelectionChange = useCallback((newSelection: GridSelection) => {
        setGridSelection(newSelection);

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

    const saveTableMetadata = useCallback(async () => {
        if (!blockId) return;

        const latestLocalColumns = localColumnsRef.current;
        const latestSortedData = sortedDataRef.current;

        const columnMetadata = latestLocalColumns.map((col, idx) => ({
            columnId: col.id,
            position: col.position !== undefined ? col.position : idx,
            name: col.header,
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
                name: col.header,
            }))
            .sort((a, b) => a.position - b.position);

        const currentColumnState = columnMetadata
            .map(({ columnId, position, width, name }) => ({
                id: columnId,
                position,
                width,
                name,
            }))
            .sort((a, b) => a.position - b.position);

        const isColumnMetadataChanged =
            originalColumnState.length !== currentColumnState.length ||
            originalColumnState.some((col) => {
                const curr = currentColumnState.find((c) => c.id === col.id);
                if (!curr) return true;
                return (
                    col.position !== curr.position ||
                    (col.width ?? null) !== (curr.width ?? null) ||
                    col.name !== curr.name
                );
            });

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

    const handleSaveAllRef = useRef(handleSaveAll);
    useEffect(() => {
        handleSaveAllRef.current = handleSaveAll;
    }, [handleSaveAll]);

    const saveTableMetadataRef = useRef(saveTableMetadata);
    useEffect(() => {
        saveTableMetadataRef.current = saveTableMetadata;
    }, [saveTableMetadata]);

    useEffect(() => {
        const incomingIds = new Set(data.map((r) => r.id));
        const allDeletedSynced = [...deletedRowIdsRef.current].every(
            (id) => !incomingIds.has(id),
        );

        if (allDeletedSynced) {
            deletedRowIdsRef.current.clear();
        }

        const incomingColumnIds = new Set(columns.map((c) => c.id));
        const allDeletedColumnsSynced = [...deletedColumnIdsRef.current].every(
            (id) => !incomingColumnIds.has(id),
        );

        if (allDeletedColumnsSynced) {
            deletedColumnIdsRef.current.clear();
        }
    }, [columns, data]);

    useEffect(() => {
        if (localColumns.length === 0 && columns.length > 0) {
            const normalized = columns.map((col) => ({
                ...col,
                title: col.header,
            }));
            const sorted = [...normalized].sort(
                (a, b) => (a.position ?? 0) - (b.position ?? 0),
            );
            setLocalColumns(sorted as typeof localColumns);
            return;
        }

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
            setLocalColumns(sorted as typeof localColumns);
        }
    }, [columns.length]);

    const isReorderingRef = useRef(false);

    useEffect(() => {
        const pasteState = getPasteState();
        if (pasteState.isPasting || pasteState.pasteOperationActive) {
            console.debug(
                `[Data Sync] Skipping - paste in progress for table ${blockId || 'default'}`,
            );
            return;
        }
        if (isSavingRef.current) {
            console.debug('[Data Sync] Skipping - save in progress');
            return;
        }

        const syncTimer = setTimeout(() => {
            const pasteState = getPasteState();
            if (pasteState.isPasting || pasteState.pasteOperationActive) {
                console.debug(
                    `[Data Sync] Skipping after delay - paste now active for table ${blockId || 'default'}`,
                );
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

                const pendingEdits = editingDataRef.current || {};
                const hasPendingEdits = Object.keys(pendingEdits).length > 0;
                const mergedFromServerOrder = data.map((row) =>
                    pendingEdits[row.id]
                        ? ({ ...row, ...(pendingEdits[row.id] as Partial<T>) } as T)
                        : row,
                );

                const sameIdSet = (() => {
                    if (data.length !== prev.length) return false;
                    const a = new Set<string>(data.map((r: any) => r.id));
                    for (const r of prev as any[]) if (!a.has(r.id)) return false;
                    return true;
                })();

                if (sameIdSet && (needsUpdate || hasPendingEdits)) {
                    const incomingById = new Map<string, T>(
                        mergedFromServerOrder.map((r: any) => [r.id as string, r]),
                    );
                    const mergedPreservingOrder = (prev as any[]).map((r, idx) => {
                        const incoming = incomingById.get(r.id);
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
        }, 200);

        return () => clearTimeout(syncTimer);
    }, [data]);

    useEffect(() => {
        const pasteState = getPasteState();
        if (pasteState.isPasting || pasteState.pasteOperationActive) {
            console.debug(
                `[Data Rehydration] Skipping - paste in progress for table ${blockId || 'default'}`,
            );
            return;
        }

        const dynamicColumns = localColumnsRef.current.filter(
            (col: any) => col.isDynamic,
        );

        if (dynamicColumns.length === 0) return;

        const rowsWithCustomProps = data.filter(
            (row: any) =>
                row.custom_properties &&
                typeof row.custom_properties === 'object' &&
                Object.keys(row.custom_properties).length > 0,
        );

        if (rowsWithCustomProps.length === 0) return;

        console.debug(
            '[Data Rehydration] Restoring dynamic column data from custom_properties...',
            {
                dynamicColumns: dynamicColumns.map((c) => ({
                    id: c.id,
                    accessor: String(c.accessor),
                    header: c.header,
                })),
                rowsWithData: rowsWithCustomProps.length,
            },
        );

        setLocalData((prevData) => {
            const customPropsMap = new Map(
                rowsWithCustomProps.map((row) => [
                    row.id,
                    (row as any).custom_properties,
                ]),
            );

            return prevData.map((row) => {
                const customProps = customPropsMap.get(row.id);

                if (!customProps || typeof customProps !== 'object') {
                    return row;
                }

                const rehydratedRow = { ...row };
                let hasChanges = false;

                dynamicColumns.forEach((col) => {
                    const accessor = String(col.accessor);

                    const value =
                        customProps[accessor] ||
                        customProps[col.id] ||
                        customProps[col.header] ||
                        customProps[`dynamic_${accessor}`];

                    if (
                        value !== undefined &&
                        (rehydratedRow as any)[col.accessor] !== value
                    ) {
                        (rehydratedRow as any)[col.accessor] = value;
                        hasChanges = true;
                        console.debug(
                            `[Data Rehydration] Restored ${accessor} = ${value} for row ${row.id}`,
                        );
                    }
                });

                return hasChanges ? rehydratedRow : row;
            });
        });

        console.debug('[Data Rehydration] Completed restoration of dynamic column data');
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

                debouncedSave();
                return updated;
            });

            setTimeout(() => {
                if (gridRef.current) {
                    gridRef.current.updateCells(
                        sortedData.map((_, rowIndex) => ({ cell: [0, rowIndex] })),
                    );
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

            debouncedSave();
        },
        [debouncedSave, localColumns, addToHistory],
    );

    const getCellContent = useCallback(
        (cell: Item): GridCell => {
            const [col, row] = cell;

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
                    const textValue = value?.toString() ?? '';
                    return {
                        kind: GridCellKind.Text,
                        allowOverlay: isEditMode,
                        data: textValue,
                        displayData: textValue,
                        allowWrapping: true,
                        copyData: textValue.replace(/\n/g, ' '),
                    } as TextCell;
            }
        },
        [sortedData, localColumns, isEditMode, peopleNames],
    );

    const { getCellsForSelection } = useGlideCopy(getCellContent);

    const onCellEdited = useCallback(
        async (cell: Item, newValue: GridCell) => {
            // Ignore edits during paste for this table instance
            const pasteState = getPasteState();
            if (pasteState.isPasting) {
                console.debug(
                    `[onCellEdited] Ignoring during paste for table ${blockId || 'default'}`,
                );
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
            // Opportunistically update metadata
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

                    // handle NaN and empty values consistently
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
                // First update the property name via the rename handler
                if (props.onRenameColumn) {
                    try {
                        await props.onRenameColumn(columnToRename.id, newName);
                    } catch (renameError) {
                        console.error(
                            '[GlideEditableTable] Failed to rename column property:',
                            renameError,
                        );
                        // Re-throw to trigger error handling below
                        throw renameError;
                    }
                }

                // Save metadata to blocks.content.columns with updated name
                // This ensures the rename persists in block metadata by columnId
                await saveTableMetadataRef.current?.();

                // Verify the metadata was saved correctly by checking the update succeeded
                // The saveTableMetadata function updates blocks.content.columns with the new name
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
        [
            isEditMode,
            gridSelection,
            sortedData,
            props.skipDeleteConfirm,
            handleRowDeleteConfirm,
        ],
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

    // enhanced paste handler with crash protection - scoped per table instance
    const handlePaste = useCallback(
        (target: Item, cells: readonly (readonly string[])[]): boolean => {
            // Get scoped paste state for this table instance
            const pasteState = getPasteState();
            const tableId = blockId || 'default';

            // Exit if not in edit mode
            if (!isEditMode) return false;

            // Prevent nested paste operations for THIS table instance
            if (pasteState.isPasting || pasteState.pasteOperationActive) return false;

            const operationId = `paste_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            const t0 = Date.now();
            console.group(`[paste_sync][${operationId}] START paste (t=${t0})`);
            console.debug(
                `[paste_sync][${operationId}] isEditMode=${isEditMode} isPasting=${pasteState.isPasting} pasteOpActive=${pasteState.pasteOperationActive}`,
            );

            console.debug(
                `[paste_sync][${operationId}] currentColumns (localColumns.length) =`,
                localColumnsRef.current.length,
                localColumnsRef.current.map((c) => ({
                    id: c.id,
                    accessor: String(c.accessor),
                    header: c.header,
                    position: c.position,
                })),
            );
            console.debug(
                `[paste_sync][${operationId}] incoming prop columns.length =`,
                columns.length,
                columns.map((c) => ({
                    id: c.id,
                    accessor: String(c.accessor),
                    header: c.header,
                    position: c.position,
                })),
            );

            pasteState.isPasting = true;
            pasteState.pasteOperationActive = true;

            gridRef.current?.focus();

            const startCell: Item = target;
            const startCol = Math.max(0, startCell[0]);
            const startRow = Math.max(0, startCell[1]);

            // Convert cells array to clipboardRows format
            // Empty cells should be preserved to match Excel/Sheets behavior
            const clipboardRows = cells.map((row) => row.map((cell) => cell.trim()));

            const validClipboardRows = clipboardRows.filter((row) =>
                row.some((cell) => cell.length > 0),
            );

            // Ensure clipboardRows is always a valid 2D array
            if (validClipboardRows.length === 0) {
                console.debug(
                    `[paste_sync][${operationId}] No valid clipboard rows, aborting`,
                );
                console.groupEnd();
                return false;
            }

            let pasteStartCol = 0;
            let pasteStartRow = 0;
            let pasteEndCol = 0;
            let pasteEndRow = 0;
            let clipboardRowsForRestore: string[][] = [];
            // declare at function scope for access in finally block
            let newRowsToCreate: T[] = [];

            // Store coordinates for reference (but don't clear selection yet)
            pasteStartCol = startCol;
            pasteStartRow = startRow;
            clipboardRowsForRestore = validClipboardRows;
            pasteEndCol =
                validClipboardRows.length > 0
                    ? startCol + Math.max(...validClipboardRows.map((r) => r.length)) - 1
                    : startCol;
            pasteEndRow = startRow + Math.max(0, validClipboardRows.length - 1);

            try {
                // Store coordinates for reference (but don't clear selection yet)
                pasteStartCol = startCol;
                pasteStartRow = startRow;
                clipboardRowsForRestore = validClipboardRows;
                pasteEndCol =
                    validClipboardRows.length > 0
                        ? startCol +
                          Math.max(...validClipboardRows.map((r) => r.length)) -
                          1
                        : startCol;
                pasteEndRow = startRow + Math.max(0, validClipboardRows.length - 1);

                const currentData = [...sortedData];
                let currentColumns = [...localColumnsRef.current];

                // Calculate maximum columns needed from pasted data
                const maxPastedColumns = Math.max(
                    0,
                    ...validClipboardRows.map((row) => row.length),
                );
                const maxTargetColumnIndex = startCol + maxPastedColumns - 1;
                const columnsNeeded = maxTargetColumnIndex + 1;

                // Dynamically create missing columns if pasted data exceeds existing columns
                const newColumnsToCreate: Array<{
                    index: number;
                    name: string;
                    position: number;
                    tempId: string;
                }> = [];
                if (columnsNeeded > currentColumns.length) {
                    const existingColumnCount = currentColumns.length;

                    // Find the highest numbered "Column X" to determine next index
                    let highestColumnNumber = 0;
                    currentColumns.forEach((col) => {
                        // Match "Column X" pattern
                        const match = col.header.match(/^Column (\d+)$/);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (num > highestColumnNumber) {
                                highestColumnNumber = num;
                            }
                        } else {
                            const suffixMatch = col.header.match(/(\d+)$/);
                            if (suffixMatch) {
                                const num = parseInt(suffixMatch[1], 10);
                                if (num > highestColumnNumber) {
                                    highestColumnNumber = num;
                                }
                            }
                        }
                    });

                    // If no numeric columns found, use the current column count as base
                    if (highestColumnNumber === 0 && existingColumnCount > 0) {
                        highestColumnNumber = existingColumnCount;
                    }

                    // New columns should be positioned after existing columns, starting sequentially
                    const columnsToCreate = columnsNeeded - existingColumnCount;
                    for (let i = 0; i < columnsToCreate; i++) {
                        const colIndex = existingColumnCount + i;
                        const columnNumber = highestColumnNumber + i + 1;
                        const columnName = `Column ${columnNumber}`;
                        const columnPosition = existingColumnCount + i;
                        const tempId = `temp-${Date.now()}-${i}`;
                        newColumnsToCreate.push({
                            index: colIndex,
                            name: columnName,
                            position: columnPosition,
                            tempId: tempId,
                        });
                        console.debug(
                            `[${operationId}] Will create new column at index ${colIndex}: "${columnName}" at position ${columnPosition} (existingColumns.length=${existingColumnCount})`,
                        );
                    }
                }

                // Process cell data after columns are confirmed in database
                // Initialize results array - will be populated by async column creation
                let columnCreationResults: Array<{
                    success: boolean;
                    columnId?: string;
                    tempId: string;
                    realAccessor?: string;
                    error?: any;
                }> = [];
                let confirmedColumnIds: string[] = [];
                // This map will be built synchronously from placeholder columns for immediate UI use
                let tempAccessorToRealAccessor = new Map<string, string>();
                const tempIdToTempAccessor = new Map<string, string>();

                if (newColumnsToCreate.length > 0 && blockId) {
                    // Create placeholder columns synchronously for immediate UI display
                    const placeholderColumns = newColumnsToCreate.map(
                        ({ name, position, tempId }) => ({
                            id: tempId,
                            header: name,
                            title: name,
                            accessor: name.toLowerCase().replace(/\s+/g, '_') as keyof T,
                            type: 'text' as EditableColumnType,
                            width: 150,
                            position: position,
                            options: undefined,
                        }),
                    );

                    currentColumns.push(...placeholderColumns);
                    currentColumns.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

                    // Update localColumns state immediately so UI shows new columns
                    setLocalColumns((prev) => {
                        const updated = [...prev, ...placeholderColumns];
                        return updated.sort(
                            (a, b) => (a.position ?? 0) - (b.position ?? 0),
                        );
                    });

                    // Update ref immediately
                    localColumnsRef.current =
                        currentColumns as typeof localColumnsRef.current;

                    console.debug(`[${operationId}] Placeholder columns created:`, {
                        count: placeholderColumns.length,
                        columns: placeholderColumns.map((c) => ({
                            id: c.id,
                            header: c.header,
                            accessor: c.accessor,
                            position: c.position,
                        })),
                        allColumnAccessors: localColumnsRef.current.map(
                            (c) => c.accessor,
                        ),
                    });

                    const columnCreationPromise = (async () => {
                        try {
                            await waitForSupabaseClient();

                            // Collect all column creation promises in an array
                            const columnCreationPromises: Promise<any>[] = [];

                            // Fire all column creation requests in parallel and collect promises
                            const columnPromises = newColumnsToCreate.map(
                                async ({ name, position, tempId, index: arrayIndex }) => {
                                    try {
                                        const tempAccessor = name
                                            .toLowerCase()
                                            .replace(/\s+/g, '_');
                                        console.debug(
                                            `[paste_sync][${operationId}] creating new column localId=${tempId} accessor=${tempAccessor} position=${position} name="${name}"`,
                                        );
                                        const createStart = Date.now();

                                        const columnPromise = createPropertyAndColumn(
                                            name,
                                            'text',
                                            {
                                                scope: ['document'],
                                                is_base: false,
                                                org_id: String(orgId),
                                                project_id: String(projectId),
                                                document_id: String(documentId),
                                            },
                                            '',
                                            blockId,
                                            userId || '',
                                        );

                                        // Store promise in both the Map (for tracking) and array (for Promise.all)
                                        pasteState.columnCreationPromises.set(
                                            tempId,
                                            columnPromise,
                                        );
                                        columnCreationPromises.push(columnPromise);

                                        const result = await columnPromise;
                                        const createDuration = Date.now() - createStart;
                                        console.debug(
                                            `[paste_sync][${operationId}] createPropertyAndColumn returned (duration=${createDuration}ms) ->`,
                                            {
                                                success: !!(
                                                    result?.column && result?.property
                                                ),
                                                columnId: result?.column?.id,
                                                propertyName: result?.property?.name,
                                                realAccessor: result?.property?.name,
                                                tempId,
                                            },
                                        );

                                        if (result?.column && result?.property) {
                                            // Update placeholder with real column data
                                            const placeholderIndex =
                                                currentColumns.findIndex(
                                                    (col) => col.id === tempId,
                                                );
                                            if (placeholderIndex !== -1) {
                                                const updatedColumn = {
                                                    id: result.column.id,
                                                    header: name,
                                                    title: name,
                                                    accessor: result.property
                                                        .name as keyof T,
                                                    type: 'text' as EditableColumnType,
                                                    width: 150,
                                                    position: position,
                                                    options: undefined,
                                                };
                                                currentColumns[placeholderIndex] =
                                                    updatedColumn;

                                                // Update local state with real column
                                                setLocalColumns((prev) => {
                                                    const updated = prev.map((col) =>
                                                        col.id === tempId
                                                            ? updatedColumn
                                                            : col,
                                                    );
                                                    return updated.sort(
                                                        (a, b) =>
                                                            (a.position ?? 0) -
                                                            (b.position ?? 0),
                                                    );
                                                });
                                                localColumnsRef.current =
                                                    currentColumns as typeof localColumnsRef.current;
                                            }

                                            return {
                                                success: true,
                                                columnId: result.column.id,
                                                tempId: tempId,
                                                realAccessor: result.property.name,
                                                originalIndex: arrayIndex,
                                            };
                                        } else {
                                            return {
                                                success: false,
                                                name,
                                                error: 'No result',
                                                tempId: tempId,
                                                originalIndex: arrayIndex,
                                            };
                                        }
                                    } catch (columnError) {
                                        return {
                                            success: false,
                                            name,
                                            error: columnError,
                                            tempId: tempId,
                                            originalIndex: arrayIndex,
                                        };
                                    }
                                },
                            );

                            // ensures all columns exist in the database before we save any row data
                            console.debug(
                                `[paste_sync][${operationId}] Waiting for ${columnCreationPromises.length} column creation promises to complete...`,
                            );
                            await Promise.all(columnCreationPromises);
                            console.debug(
                                `[paste_sync][${operationId}] All column creation promises resolved. Processing results...`,
                            );

                            // Now process the results
                            const settledResults =
                                await Promise.allSettled(columnPromises);

                            // Extract results
                            const results = settledResults.map((result, index) => {
                                if (result.status === 'fulfilled') {
                                    return result.value;
                                } else {
                                    return {
                                        success: false,
                                        tempId: newColumnsToCreate[index].tempId,
                                        error: result.reason,
                                    };
                                }
                            });

                            // Extract successful column IDs for confirmation
                            const successfulColumnIds = results
                                .filter(
                                    (r) => r.success && 'columnId' in r && !!r.columnId,
                                )
                                .map((r) => (r as { columnId: string }).columnId)
                                .filter((id): id is string => !!id);

                            console.debug(
                                `[paste_sync][${operationId}] ALL createColumn promises resolved, totalNewColumns=${results.length}, successful=${successfulColumnIds.length}`,
                            );

                            // Confirm columns exist in database before proceeding
                            if (successfulColumnIds.length > 0) {
                                const confirmed = await confirmColumnsForTable(
                                    successfulColumnIds,
                                    operationId,
                                );
                                if (!confirmed) {
                                    console.warn(
                                        `[paste_sync][${operationId}] Some columns failed confirmation, but proceeding with successful ones`,
                                    );
                                }
                            }

                            // Short pause to allow DB eventual consistency (if any)
                            console.debug(
                                `[paste_sync][${operationId}] Adding 100ms delay to ensure columns are registered in backend...`,
                            );
                            await new Promise((r) => setTimeout(r, 100));
                            console.debug(
                                `[paste_sync][${operationId}] Delay complete, columns should be ready for row data save`,
                            );

                            // Log current authoritative columns via props (after await)
                            console.debug(
                                `[paste_sync][${operationId}] after col-create, prop columns (len) =`,
                                columns.length,
                                columns
                                    .map((c) => ({
                                        id: c.id,
                                        accessor: String(c.accessor),
                                    }))
                                    .slice(0, 20),
                            );

                            return results;
                        } catch (error) {
                            console.error(
                                `[paste_sync][${operationId}] Error creating columns:`,
                                error,
                            );
                            return [];
                        }
                    })();

                    // Store the overall column creation promise for later use in save phase
                    pasteState.columnCreationPromise = columnCreationPromise.then(
                        (results) => {
                            // Update columnCreationResults for use in save phase
                            columnCreationResults = results;

                            // Build mapping from temp accessor to real accessor for save phase
                            results.forEach((result) => {
                                if (
                                    result.success &&
                                    result.tempId &&
                                    'realAccessor' in result &&
                                    result.realAccessor
                                ) {
                                    const placeholderCol = currentColumns.find(
                                        (col) => col.id === result.tempId,
                                    );
                                    if (placeholderCol) {
                                        const tempAccessor = String(
                                            placeholderCol.accessor,
                                        );
                                        tempAccessorToRealAccessor.set(
                                            tempAccessor,
                                            result.realAccessor,
                                        );
                                    }
                                }
                            });
                            return results;
                        },
                    );

                    // allows UI to display dynamic column data right away using temp accessors
                    newColumnsToCreate.forEach(({ tempId, name }) => {
                        const placeholderCol = currentColumns.find(
                            (col) => col.id === tempId,
                        );
                        if (placeholderCol) {
                            const tempAccessor = String(placeholderCol.accessor);
                            tempIdToTempAccessor.set(tempId, tempAccessor);
                            tempAccessorToRealAccessor.set(tempAccessor, tempAccessor);
                        }
                    });
                }

                // Track changes to apply - split by standard vs dynamic columns
                const updatedRows = new Map<string, T>();
                const rowsWithDynamicColumns = new Map<
                    string,
                    {
                        row: T;
                        dynamicColumnData: Record<string, any>; // accessor -> value for dynamic columns
                        tempColumnIds: string[]; // tempIds of dynamic columns in this row
                    }
                >();
                newRowsToCreate = [];
                const newRowsWithDynamicColumns: Array<{
                    row: T;
                    dynamicColumnData: Record<string, any>;
                    tempColumnIds: string[];
                }> = [];
                const editingUpdates: Record<string, Partial<T>> = {};

                // Build mapping from tempId to temp accessor for immediate use
                // used to track which columns are dynamic during cell processing
                const tempIdToAccessor = new Map<string, string>();
                newColumnsToCreate.forEach(({ tempId, name }) => {
                    const placeholderCol = currentColumns.find(
                        (col) => col.id === tempId,
                    );
                    if (placeholderCol) {
                        const tempAccessor = String(placeholderCol.accessor);
                        tempIdToAccessor.set(tempId, tempAccessor);
                    }
                });

                // Calculate the maximum position for new rows from current data
                const currentPositions = currentData.map((d) => d.position ?? 0);
                let maxPosition =
                    currentPositions.length > 0 ? Math.max(...currentPositions) : 0;

                for (
                    let clipboardRowIndex = 0;
                    clipboardRowIndex < validClipboardRows.length;
                    clipboardRowIndex++
                ) {
                    const clipboardCells = validClipboardRows[clipboardRowIndex];
                    // Calculate target row index relative to start cell
                    const targetRowIndex = startRow + clipboardRowIndex;

                    // determine if we're updating existing row or creating new one
                    const existingRow = currentData[targetRowIndex];
                    let targetRow: T;
                    let isNewRow = false;

                    if (existingRow) {
                        targetRow = { ...existingRow };
                    } else {
                        // create new row
                        isNewRow = true;
                        maxPosition++;

                        // create base row w all column defaults
                        const newRowData = currentColumns.reduce((acc, col) => {
                            if (col.accessor === 'id') return acc;
                            acc[col.accessor as keyof T] = '' as any;
                            return acc;
                        }, {} as Partial<T>);

                        const newRowId = crypto.randomUUID();
                        targetRow = {
                            ...newRowData,
                            id: newRowId,
                            position: maxPosition,
                        } as T;
                    }

                    // Track if row has any changes
                    let rowHasChanges = isNewRow;
                    // Track dynamic column data separately
                    const dynamicColumnData: Record<string, any> = {};
                    const tempColumnIds: string[] = [];

                    // Process each cell in the clipboard row
                    for (
                        let cellIndex = 0;
                        cellIndex < clipboardCells.length;
                        cellIndex++
                    ) {
                        // Calculate target column index relative to start cell
                        const targetColIndex = startCol + cellIndex;
                        const targetColumn = currentColumns[targetColIndex];
                        // Cell values are already trimmed during parsing
                        const cellValue = clipboardCells[cellIndex] ?? '';

                        // Guard against undefined column access - create placeholder if needed
                        if (!targetColumn) {
                            console.warn(
                                `[${operationId}] Column at index ${targetColIndex} not found for cell [${clipboardRowIndex}, ${cellIndex}]. ` +
                                    `Current columns: ${currentColumns.length}, needed: ${columnsNeeded}, startCol: ${startCol}`,
                            );
                            continue;
                        }

                        const trimmedValue = cellValue;
                        const currentValue = (
                            targetRow[targetColumn.accessor] ?? ''
                        ).toString();

                        // Empty cells from clipboard should overwrite existing values
                        if (currentValue === trimmedValue && trimmedValue !== '') {
                            continue;
                        }

                        // Handle different column types with proper validation
                        let processedValue: any = trimmedValue;

                        switch (targetColumn.type) {
                            case 'multi_select': {
                                const rawParts = trimmedValue
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
                                processedValue =
                                    validOptions.length > 0
                                        ? rawParts.filter((p) => validOptions.includes(p))
                                        : rawParts;
                                break;
                            }
                            case 'people': {
                                const rawParts = trimmedValue
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
                                processedValue =
                                    validOptions.length > 0
                                        ? rawParts.filter((p) => validOptions.includes(p))
                                        : rawParts;
                                break;
                            }
                            case 'select':
                                if (
                                    Array.isArray(targetColumn.options) &&
                                    targetColumn.options.length > 0
                                ) {
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
                                    if (
                                        trimmedValue &&
                                        validOptions.includes(trimmedValue)
                                    ) {
                                        processedValue = trimmedValue;
                                    } else {
                                        processedValue = '';
                                    }
                                } else {
                                    processedValue = trimmedValue;
                                }
                                break;
                            case 'text':
                            default:
                                processedValue = trimmedValue;
                                break;
                        }

                        // Check if this is a dynamic column
                        const isDynamicColumn =
                            targetColumn.id && targetColumn.id.startsWith('temp-');

                        if (isDynamicColumn) {
                            const tempAccessor = String(targetColumn.accessor);

                            // ensures dynamic column values appear instantly in the UI
                            (targetRow as any)[tempAccessor] = processedValue;

                            // track in dynamicColumnData for backend persistence
                            dynamicColumnData[tempAccessor] = processedValue;

                            if (
                                targetColumn.id &&
                                !tempColumnIds.includes(targetColumn.id)
                            ) {
                                tempColumnIds.push(targetColumn.id);
                            }

                            console.debug(`[${operationId}] Added dynamic column data:`, {
                                rowId: targetRow.id,
                                columnId: targetColumn.id,
                                accessor: tempAccessor,
                                value: processedValue,
                                isEmpty: processedValue === '',
                            });
                        } else {
                            // Standard column - update row immediately
                            (targetRow as any)[targetColumn.accessor] = processedValue;
                        }
                        rowHasChanges = true;
                    }

                    // Add row to appropriate collection
                    // track it separately in dynamicColumnData for backend persistence with real accessors
                    if (isNewRow) {
                        // Dynamic column data is already added to targetRow above
                        if (tempColumnIds.length > 0) {
                            // New row with dynamic columns - track separately for deferred save
                            newRowsWithDynamicColumns.push({
                                row: targetRow,
                                dynamicColumnData,
                                tempColumnIds,
                            });
                        } else {
                            // New row with only standard columns
                            newRowsToCreate.push(targetRow);
                        }
                    } else if (rowHasChanges) {
                        if (tempColumnIds.length > 0) {
                            rowsWithDynamicColumns.set(targetRow.id, {
                                row: targetRow,
                                dynamicColumnData,
                                tempColumnIds,
                            });
                        } else {
                            // Updated row with only standard columns
                            updatedRows.set(targetRow.id, targetRow);
                        }

                        // Track changes for editing buffer
                        // both standard and dynamic column data
                        const changes: Partial<T> = {};
                        for (
                            let cellIndex = 0;
                            cellIndex < clipboardCells.length;
                            cellIndex++
                        ) {
                            const targetColIndex = startCol + cellIndex;
                            const targetColumn = currentColumns[targetColIndex];
                            if (targetColumn) {
                                const accessor = String(targetColumn.accessor);
                                (changes as any)[accessor] = (targetRow as any)[accessor];
                            }
                        }
                        editingUpdates[targetRow.id] = changes;
                    }
                }

                setLocalData((prevData) => {
                    const updatedData = [...prevData];

                    console.debug(`[${operationId}] Updating localData:`, {
                        prevCount: prevData.length,
                        updatedRowsCount: updatedRows.size,
                        rowsWithDynamicCount: rowsWithDynamicColumns.size,
                        newRowsCount: newRowsToCreate.length,
                        newRowsWithDynamicCount: newRowsWithDynamicColumns.length,
                        columnsCount: localColumnsRef.current.length,
                    });

                    // Update existing rows with standard columns only
                    updatedRows.forEach((updatedRow, rowId) => {
                        const index = updatedData.findIndex((row) => row.id === rowId);
                        if (index !== -1) {
                            updatedData[index] = { ...updatedRow };
                        } else {
                            console.warn(
                                `[${operationId}] Row ${rowId} not found in localData for update`,
                            );
                        }
                    });

                    // Update existing rows with dynamic columns (already includes dynamic column data in row object)
                    rowsWithDynamicColumns.forEach(({ row }, rowId) => {
                        const index = updatedData.findIndex((r) => r.id === rowId);
                        if (index !== -1) {
                            const dynamicKeys = Object.keys(row).filter((key) =>
                                newColumnsToCreate.some((col) => {
                                    const tempAccessor = col.name
                                        .toLowerCase()
                                        .replace(/\s+/g, '_');
                                    return key === tempAccessor;
                                }),
                            );
                            if (dynamicKeys.length > 0) {
                                console.debug(
                                    `[${operationId}] Row ${rowId} has dynamic column data:`,
                                    dynamicKeys,
                                    dynamicKeys.map((k) => ({
                                        key: k,
                                        value: (row as any)[k],
                                    })),
                                );
                            }
                            updatedData[index] = { ...row };
                        } else {
                            console.warn(
                                `[${operationId}] Row ${rowId} not found in localData for dynamic update`,
                            );
                        }
                    });

                    // Append new rows with standard columns only
                    newRowsToCreate.forEach((newRow) => {
                        if (!updatedData.some((row) => row.id === newRow.id)) {
                            updatedData.push({ ...newRow });
                        } else {
                            console.warn(
                                `[${operationId}] New row ${newRow.id} already exists in localData`,
                            );
                        }
                    });

                    // Append new rows with dynamic columns
                    newRowsWithDynamicColumns.forEach(({ row }) => {
                        if (!updatedData.some((r) => r.id === row.id)) {
                            const dynamicKeys = Object.keys(row).filter((key) =>
                                newColumnsToCreate.some((col) => {
                                    const tempAccessor = col.name
                                        .toLowerCase()
                                        .replace(/\s+/g, '_');
                                    return key === tempAccessor;
                                }),
                            );
                            if (dynamicKeys.length > 0) {
                                console.debug(
                                    `[${operationId}] New row ${row.id} has dynamic column data:`,
                                    dynamicKeys,
                                    dynamicKeys.map((k) => ({
                                        key: k,
                                        value: (row as any)[k],
                                    })),
                                );
                            }
                            updatedData.push({ ...row });
                        } else {
                            console.warn(
                                `[${operationId}] New row ${row.id} already exists in localData`,
                            );
                        }
                    });

                    // Sort by position
                    const sorted = updatedData.sort((a, b) => {
                        const posA = a.position ?? 0;
                        const posB = b.position ?? 0;
                        return posA - posB;
                    });

                    console.debug(`[${operationId}] localData update complete:`, {
                        finalCount: sorted.length,
                        columnsCount: localColumnsRef.current.length,
                    });

                    console.log(
                        `[${operationId}] Columns:`,
                        localColumnsRef.current.map((c) => ({
                            id: c.id,
                            header: c.header,
                            accessor: c.accessor,
                            isDynamic: c.id?.startsWith('temp-'),
                        })),
                    );

                    console.log(
                        `[${operationId}] Row data (first 3 rows):`,
                        sorted.slice(0, 3).map((r) => ({
                            id: r.id,
                            keys: Object.keys(r),
                            dynamicKeys: Object.keys(r).filter((k) =>
                                localColumnsRef.current.some(
                                    (c) => c.id?.startsWith('temp-') && c.accessor === k,
                                ),
                            ),
                        })),
                    );

                    localColumnsRef.current
                        .filter((c) => c.id?.startsWith('temp-'))
                        .forEach((c) => {
                            const accessor = String(c.accessor);
                            const values = sorted.map((r) => (r as any)[accessor]);
                            console.log(
                                `[${operationId}] Column ${c.header} (${accessor}):`,
                                values,
                            );
                        });

                    return sorted;
                });

                if (Object.keys(editingUpdates).length > 0) {
                    setEditingData((prev) => ({
                        ...prev,
                        ...editingUpdates,
                    }));
                    editingDataRef.current = {
                        ...editingDataRef.current,
                        ...editingUpdates,
                    };
                }

                setLocalColumns((prev) => {
                    const sorted = [...prev].sort(
                        (a, b) => (a.position ?? 0) - (b.position ?? 0),
                    );
                    const normalized = sorted.map((col, idx) => ({
                        ...col,
                        position: idx,
                    }));
                    localColumnsRef.current =
                        normalized as typeof localColumnsRef.current;
                    return normalized as typeof prev;
                });

                // ensures the DataEditor re-renders with new columns and data
                requestAnimationFrame(() => {
                    if (gridRef.current) {
                        // Update all cells to force grid refresh
                        gridRef.current.updateCells([]);
                        console.log(`[${operationId}] Grid invalidated after paste`);
                    }
                });

                // Clearing selection too early causes first-paste collapse
                setSelection(undefined);
                selectionRef.current = undefined;
                setGridSelection({
                    rows: CompactSelection.empty(),
                    columns: CompactSelection.empty(),
                });

                // Start immediate save sequence
                (async () => {
                    try {
                        await waitForSupabaseClient();

                        const BATCH_SIZE = 20;
                        let tempAccessorToRealAccessorMap = new Map<string, string>();
                        const hasDynamicColumns =
                            rowsWithDynamicColumns.size > 0 ||
                            newRowsWithDynamicColumns.length > 0;
                        let updatedLocalDataRows: T[] = [];
                        let remappedRows: T[] = []; // Declare at function scope so it's available for save phase
                        let remapEndTime: number | undefined; // Track when remap completes for timing comparison

                        if (hasDynamicColumns && pasteState.columnCreationPromise) {
                            console.log(
                                `[paste_sync] Waiting for all dynamic columns to finish before remapping...`,
                            );

                            const columnResults = await pasteState.columnCreationPromise;
                            const successfulColumns = columnResults.filter(
                                (r) => r.success,
                            ).length;
                            console.log(
                                `[paste_sync][${operationId}] ✅ All dynamic columns created (${successfulColumns} columns)`,
                            );

                            console.log(
                                `[paste_sync][${operationId}] Adding 300ms delay to allow state to sync...`,
                            );
                            await new Promise((r) => setTimeout(r, 300));
                            console.log(
                                `[paste_sync][${operationId}] Delay complete, columns should be ready for row data save`,
                            );

                            // Persist stable column order immediately after column creation
                            console.log(
                                `[paste_sync][${operationId}] Saving table metadata to persist column order...`,
                            );
                            try {
                                await saveTableMetadata();
                                console.log(
                                    `[paste_sync][${operationId}] ✅ Table metadata saved (column order persisted)`,
                                );
                            } catch (error) {
                                console.error(
                                    `[paste_sync][${operationId}] ❌ Failed to save table metadata:`,
                                    error,
                                );
                            }

                            console.log(
                                `[remap_debug][${operationId}] Validating column sync before remapping...`,
                            );
                            console.log(
                                `[remap_debug][${operationId}] localColumnsRef.length=${localColumnsRef.current.length} before remap`,
                            );
                            console.log(
                                `[remap_debug][${operationId}] columns prop.length=${columns.length} before remap`,
                            );
                            console.log(
                                `[remap_debug][${operationId}] Expected new columns=${successfulColumns}`,
                            );

                            // Build mapping from temp accessor to real accessor for confirmed columns
                            console.log(
                                `[mapping_pairs][${operationId}] Building temp -> real accessor mapping from ${columnResults.length} column results...`,
                            );

                            columnResults.forEach((result, index) => {
                                if (
                                    result.success &&
                                    result.tempId &&
                                    'realAccessor' in result &&
                                    result.realAccessor
                                ) {
                                    // Get temp accessor from stored mapping (created when placeholder was made)
                                    const tempAccessor = tempIdToTempAccessor.get(
                                        result.tempId,
                                    );

                                    if (tempAccessor) {
                                        tempAccessorToRealAccessorMap.set(
                                            tempAccessor,
                                            result.realAccessor,
                                        );
                                        console.log(
                                            `[mapping_pairs][${operationId}] Pair ${index + 1}: "${tempAccessor}" → "${result.realAccessor}" (tempId: ${result.tempId})`,
                                        );
                                    } else {
                                        console.warn(
                                            `[mapping_pairs][${operationId}] ⚠️ No temp accessor found for tempId "${result.tempId}" when mapping to real accessor "${result.realAccessor}"`,
                                        );
                                        const placeholderCol =
                                            localColumnsRef.current.find(
                                                (col) => col.id === result.tempId,
                                            );
                                        if (placeholderCol) {
                                            const fallbackTempAccessor = String(
                                                placeholderCol.accessor,
                                            );
                                            tempAccessorToRealAccessorMap.set(
                                                fallbackTempAccessor,
                                                result.realAccessor,
                                            );
                                            console.log(
                                                `[mapping_pairs][${operationId}] Fallback Pair ${index + 1}: "${fallbackTempAccessor}" → "${result.realAccessor}"`,
                                            );
                                        }
                                    }
                                } else {
                                    console.warn(
                                        `[mapping_pairs][${operationId}] ⚠️ Column creation result ${index + 1} missing required fields:`,
                                        {
                                            success: result.success,
                                            tempId: result.tempId,
                                            hasRealAccessor: 'realAccessor' in result,
                                            realAccessor: result.realAccessor,
                                        },
                                    );
                                }
                            });

                            // Log complete mapping with clear structure
                            const mappingEntries = Array.from(
                                tempAccessorToRealAccessorMap.entries(),
                            );
                            console.log(
                                `[mapping_pairs][${operationId}] ========================================`,
                            );
                            console.log(
                                `[mapping_pairs][${operationId}] COMPLETE MAPPING (${mappingEntries.length} pairs):`,
                            );
                            mappingEntries.forEach(([temp, real], idx) => {
                                console.log(
                                    `[mapping_pairs][${operationId}]   ${idx + 1}. "${temp}" → "${real}"`,
                                );
                            });
                            console.log(
                                `[mapping_pairs][${operationId}] ========================================`,
                            );

                            const expectedTempAccessors = Array.from(
                                tempIdToTempAccessor.values(),
                            );
                            const mappedTempAccessors = mappingEntries.map(
                                ([temp]) => temp,
                            );
                            const missingMappings = expectedTempAccessors.filter(
                                (temp) => !mappedTempAccessors.includes(temp),
                            );

                            const incompleteRealAccessors = mappingEntries.filter(
                                ([temp, real]) =>
                                    real.startsWith('temp-') || real === temp,
                            );

                            if (incompleteRealAccessors.length > 0) {
                                console.warn(
                                    `[paste_sync] ❌ Some accessors still temporary, delaying remap...`,
                                    incompleteRealAccessors,
                                );
                                // Wait additional time for columns to fully propagate
                                await new Promise((r) => setTimeout(r, 300));
                                // Re-check after delay
                                const recheckIncomplete = Array.from(
                                    tempAccessorToRealAccessorMap.entries(),
                                ).filter(
                                    ([temp, real]) =>
                                        real.startsWith('temp-') || real === temp,
                                );
                                if (recheckIncomplete.length > 0) {
                                    console.error(
                                        `[paste_sync] ❌ Still incomplete after delay:`,
                                        recheckIncomplete,
                                    );
                                }
                            }

                            if (missingMappings.length > 0) {
                                console.warn(
                                    `[${operationId}] Missing mappings for ${missingMappings.length} temp accessors:`,
                                    missingMappings,
                                );
                            } else if (expectedTempAccessors.length > 0) {
                                console.debug(
                                    `[${operationId}] All ${expectedTempAccessors.length} temp accessors have real accessor mappings.`,
                                );
                            }

                            if (successfulColumns === 0) {
                                console.warn(
                                    `[${operationId}] No columns were created successfully. Dynamic column data may not be saved.`,
                                );
                            }

                            const finalMappingEntries = Array.from(
                                tempAccessorToRealAccessorMap.entries(),
                            );
                            const finalExpectedTempAccessors = Array.from(
                                tempIdToTempAccessor.values(),
                            );
                            const finalMappedTempAccessors = finalMappingEntries.map(
                                ([temp]) => temp,
                            );
                            const finalMissingMappings =
                                finalExpectedTempAccessors.filter(
                                    (temp) => !finalMappedTempAccessors.includes(temp),
                                );

                            if (finalMissingMappings.length > 0) {
                                console.error(
                                    `[paste_sync] ❌ Cannot proceed with remap: Missing ${finalMissingMappings.length} mappings:`,
                                    finalMissingMappings,
                                );
                                console.error(
                                    `[paste_sync] Expected temp accessors:`,
                                    finalExpectedTempAccessors,
                                );
                                console.error(
                                    `[paste_sync] Mapped temp accessors:`,
                                    finalMappedTempAccessors,
                                );
                                return; // Exit early - don't proceed with remap or save
                            }

                            const finalIncompleteRealAccessors =
                                finalMappingEntries.filter(
                                    ([temp, real]) =>
                                        real.startsWith('temp-') ||
                                        real === temp ||
                                        !real ||
                                        real.trim() === '',
                                );
                            if (finalIncompleteRealAccessors.length > 0) {
                                console.error(
                                    `[paste_sync] ❌ Cannot proceed with remap: ${finalIncompleteRealAccessors.length} real accessors still temporary:`,
                                    finalIncompleteRealAccessors,
                                );
                                return;
                            }

                            console.log(
                                `[paste_sync] Verified mapping keys:`,
                                Array.from(tempAccessorToRealAccessorMap.keys()),
                            );
                            console.log(
                                `[paste_sync] ✅ All dynamic columns ready, proceeding with remap...`,
                            );

                            const remapStartTime = Date.now();
                            console.log(
                                `[remap_debug][${operationId}] STARTING remap at t=${remapStartTime}`,
                            );

                            // Log mapping pairs before remapping
                            const mappingPairs = Array.from(
                                tempAccessorToRealAccessorMap.entries(),
                            );
                            console.log(
                                `[mapping_pairs][${operationId}] Mapping pairs (${mappingPairs.length} total):`,
                                mappingPairs.map(([temp, real]) => ({ temp, real })),
                            );

                            // Collect all rows that need remapping
                            const allAffectedRows: T[] = [
                                ...updatedRows.values(),
                                ...newRowsToCreate,
                                ...Array.from(rowsWithDynamicColumns.values()).map(
                                    ({ row }) => row,
                                ),
                                ...newRowsWithDynamicColumns.map(({ row }) => row),
                            ];

                            console.log(
                                `[remap_debug][${operationId}] Collected ${allAffectedRows.length} rows for remapping`,
                            );

                            // Log first row BEFORE remapping to see temp accessors
                            if (allAffectedRows.length > 0) {
                                const firstRow = allAffectedRows[0];
                                const firstRowKeys = Object.keys(firstRow);
                                const firstRowTempKeys = firstRowKeys.filter(
                                    (key) =>
                                        tempAccessorToRealAccessorMap.has(key) &&
                                        tempAccessorToRealAccessorMap.get(key) !== key,
                                );
                                console.log(
                                    `[remap_debug][${operationId}] FIRST ROW BEFORE REMAP (id=${firstRow.id}):`,
                                    {
                                        allKeys: firstRowKeys,
                                        tempKeys: firstRowTempKeys,
                                        tempKeyValues: firstRowTempKeys.map((k) => ({
                                            key: k,
                                            value: (firstRow as any)[k],
                                        })),
                                    },
                                );
                            }

                            // Remap temp accessors to real accessors in each row
                            remappedRows = allAffectedRows.map((row, rowIndex) => {
                                const remapped = { ...row };
                                let remappedCount = 0;
                                const remappedPairs: Array<{
                                    temp: string;
                                    real: string;
                                    value: any;
                                }> = [];

                                // Log row keys before remapping for this specific row
                                const rowKeysBefore = Object.keys(remapped);
                                const matchingTempKeys = rowKeysBefore.filter((key) =>
                                    tempAccessorToRealAccessorMap.has(key),
                                );
                                if (rowIndex === 0 && matchingTempKeys.length > 0) {
                                    console.log(
                                        `[remap_debug][${operationId}] Row ${row.id} keys that match mapping:`,
                                        matchingTempKeys,
                                    );
                                    matchingTempKeys.forEach((key) => {
                                        const mappedReal =
                                            tempAccessorToRealAccessorMap.get(key);
                                        console.log(
                                            `[remap_debug][${operationId}]   "${key}" → "${mappedReal}" (value: ${(remapped as any)[key]})`,
                                        );
                                    });
                                }

                                // Replace all temp accessors with real accessors
                                for (const [
                                    tempAccessor,
                                    realAccessor,
                                ] of tempAccessorToRealAccessorMap.entries()) {
                                    const hasProperty = (remapped as any).hasOwnProperty(
                                        tempAccessor,
                                    );
                                    if (rowIndex === 0) {
                                        console.debug(
                                            `[remap_debug][${operationId}] Checking "${tempAccessor}" → "${realAccessor}": hasProperty=${hasProperty}, value=${hasProperty ? (remapped as any)[tempAccessor] : 'N/A'}`,
                                        );
                                    }

                                    if (tempAccessor !== realAccessor && hasProperty) {
                                        // Verify real accessor is valid before remapping
                                        if (
                                            !realAccessor ||
                                            realAccessor.startsWith('temp-') ||
                                            realAccessor === tempAccessor
                                        ) {
                                            console.error(
                                                `[remap_debug][${operationId}] ⚠️ Invalid real accessor for "${tempAccessor}": "${realAccessor}"`,
                                            );
                                            continue; // Skip this mapping
                                        }

                                        const value = (remapped as any)[tempAccessor];
                                        // Copy value from temp to real accessor
                                        (remapped as any)[realAccessor] = value;
                                        // Remove temp accessor
                                        delete (remapped as any)[tempAccessor];
                                        remappedCount++;
                                        remappedPairs.push({
                                            temp: tempAccessor,
                                            real: realAccessor,
                                            value,
                                        });

                                        if (rowIndex === 0) {
                                            console.log(
                                                `[remap_debug][${operationId}] ✅ Remapped "${tempAccessor}" → "${realAccessor}" with value:`,
                                                value,
                                            );
                                        }
                                    }
                                }

                                const remainingTempKeys = Object.keys(remapped).filter(
                                    (key) =>
                                        tempAccessorToRealAccessorMap.has(key) &&
                                        tempAccessorToRealAccessorMap.get(key) !== key,
                                );
                                if (remainingTempKeys.length > 0) {
                                    console.error(
                                        `[remap_debug][${operationId}] ⚠️ Row ${row.id} still has temp accessors after remapping:`,
                                        remainingTempKeys,
                                    );
                                    console.error(
                                        `[remap_debug][${operationId}] Row keys:`,
                                        Object.keys(remapped),
                                    );
                                    console.error(
                                        `[remap_debug][${operationId}] Available mappings:`,
                                        Array.from(
                                            tempAccessorToRealAccessorMap.entries(),
                                        ),
                                    );
                                }

                                if (remappedCount > 0) {
                                    console.debug(
                                        `[remap_debug][${operationId}] Remapped ${remappedCount} accessors in row ${row.id}:`,
                                        remappedPairs,
                                    );
                                }

                                return remapped;
                            });

                            if (remappedRows.length > 0) {
                                const firstRemappedRow = remappedRows[0];
                                const firstRemappedKeys = Object.keys(firstRemappedRow);
                                const firstRemappedTempKeys = firstRemappedKeys.filter(
                                    (key) =>
                                        tempAccessorToRealAccessorMap.has(key) &&
                                        tempAccessorToRealAccessorMap.get(key) !== key,
                                );
                                const firstRemappedRealKeys = firstRemappedKeys.filter(
                                    (key) => {
                                        const mappedReal = Array.from(
                                            tempAccessorToRealAccessorMap.values(),
                                        );
                                        return mappedReal.includes(key);
                                    },
                                );
                                console.log(
                                    `[remap_debug][${operationId}] FIRST ROW AFTER REMAP (id=${firstRemappedRow.id}):`,
                                    {
                                        allKeys: firstRemappedKeys,
                                        tempKeysRemaining: firstRemappedTempKeys,
                                        realKeysAdded: firstRemappedRealKeys,
                                        realKeyValues: firstRemappedRealKeys.map((k) => ({
                                            key: k,
                                            value: (firstRemappedRow as any)[k],
                                        })),
                                    },
                                );
                            }

                            remapEndTime = Date.now();
                            console.log(
                                `[remap_debug][${operationId}] ========================================`,
                            );
                            console.log(
                                `[remap_debug][${operationId}] REMAP COMPLETE at t=${remapEndTime} (duration=${remapEndTime - remapStartTime}ms)`,
                            );
                            console.log(
                                `[remap_debug][${operationId}] ✅ Mapping complete - ${remappedRows.length} rows remapped`,
                            );
                            console.log(
                                `[remap_debug][${operationId}] remappedRows array populated with ${remappedRows.length} rows`,
                            );

                            if (remappedRows.length > 0) {
                                const sampleRow = remappedRows[0];
                                const sampleKeys = Object.keys(sampleRow);
                                const sampleTempKeys = sampleKeys.filter(
                                    (key) =>
                                        tempAccessorToRealAccessorMap.has(key) &&
                                        tempAccessorToRealAccessorMap.get(key) !== key,
                                );
                                const sampleRealKeys = sampleKeys.filter((key) => {
                                    const mappedReal = Array.from(
                                        tempAccessorToRealAccessorMap.values(),
                                    );
                                    return mappedReal.includes(key);
                                });
                                console.log(
                                    `[remap_debug][${operationId}] Sample remapped row (id=${sampleRow.id}):`,
                                    {
                                        totalKeys: sampleKeys.length,
                                        tempKeysRemaining: sampleTempKeys.length,
                                        realKeysFound: sampleRealKeys.length,
                                        realKeys: sampleRealKeys,
                                    },
                                );

                                if (sampleTempKeys.length > 0) {
                                    console.error(
                                        `[remap_debug][${operationId}] ❌ CRITICAL: Sample row still has ${sampleTempKeys.length} temp keys after remap:`,
                                        sampleTempKeys,
                                    );
                                } else {
                                    console.log(
                                        `[remap_debug][${operationId}] ✅ Sample row has NO temp keys - remap successful`,
                                    );
                                }
                            }
                            console.log(
                                `[remap_debug][${operationId}] ========================================`,
                            );

                            // Update localData with remapped rows
                            setLocalData((prevData) => {
                                // Create a map of remapped rows by ID for quick lookup
                                const remappedMap = new Map(
                                    remappedRows.map((r) => [r.id, r]),
                                );

                                const updated = prevData.map(
                                    (row) => remappedMap.get(row.id) || row,
                                );

                                // Add any new rows that weren't in prevData
                                remappedRows.forEach((remappedRow) => {
                                    if (!updated.some((r) => r.id === remappedRow.id)) {
                                        updated.push(remappedRow);
                                    }
                                });

                                // Store for use in save phase
                                updatedLocalDataRows = updated;

                                return updated;
                            });

                            console.log(
                                `[paste_sync] 🔁 Remapped temp accessors to real accessors (${remappedRows.length} rows)`,
                            );

                            await new Promise((resolve) => setTimeout(resolve, 0));

                            const afterRemapTime = Date.now();
                            console.log(
                                `[remap_debug][${operationId}] ✅ Remap phase complete at t=${afterRemapTime}, ready for save phase`,
                            );
                        } else if (!hasDynamicColumns) {
                            console.log(
                                `[paste_sync] No dynamic columns detected. Proceeding with immediate save.`,
                            );
                        }

                        if (hasDynamicColumns) {
                            const expectedTempAccessors = Array.from(
                                tempIdToTempAccessor.values(),
                            );
                            const mappingEntries = Array.from(
                                tempAccessorToRealAccessorMap.entries(),
                            );
                            const mappedTempAccessors = mappingEntries.map(
                                ([temp]) => temp,
                            );
                            const missingMappings = expectedTempAccessors.filter(
                                (temp) => !mappedTempAccessors.includes(temp),
                            );

                            const incompleteRealAccessors = mappingEntries.filter(
                                ([temp, real]) =>
                                    real.startsWith('temp-') ||
                                    real === temp ||
                                    !real ||
                                    real.trim() === '',
                            );

                            if (tempAccessorToRealAccessorMap.size === 0) {
                                console.error(
                                    `[paste_sync] ⚠️ Cannot save rows: Dynamic columns exist but mapping is empty`,
                                );
                                pasteState.isPasting = false;
                                pasteState.pasteOperationActive = false;
                                return;
                            }

                            if (missingMappings.length > 0) {
                                console.error(
                                    `[paste_sync] ⚠️ Cannot save rows: Missing mappings for ${missingMappings.length} temp accessors:`,
                                    missingMappings,
                                );
                                pasteState.isPasting = false;
                                pasteState.pasteOperationActive = false;
                                return;
                            }

                            if (incompleteRealAccessors.length > 0) {
                                console.error(
                                    `[paste_sync] ⚠️ Cannot save rows: ${incompleteRealAccessors.length} accessors still temporary:`,
                                    incompleteRealAccessors,
                                );
                                pasteState.isPasting = false;
                                pasteState.pasteOperationActive = false;
                                return;
                            }

                            console.log(
                                `[paste_sync] ✅ Mapping verified complete: ${mappingEntries.length} mappings ready`,
                            );
                        }

                        // Prepare all rows for saving
                        console.log(`[paste_sync] Preparing rows for save...`);
                        const allRowsToSave: Array<{
                            row: T;
                            isNew: boolean;
                            id: string;
                        }> = [];

                        // Collect all row IDs that need to be saved
                        const rowIdsToSave = new Set<string>();
                        updatedRows.forEach((_, rowId) => rowIdsToSave.add(rowId));
                        newRowsToCreate.forEach((row) => rowIdsToSave.add(row.id));
                        rowsWithDynamicColumns.forEach((_, rowId) =>
                            rowIdsToSave.add(rowId),
                        );
                        newRowsWithDynamicColumns.forEach(({ row }) =>
                            rowIdsToSave.add(row.id),
                        );

                        console.log(
                            `[paste_sync] Found ${rowIdsToSave.size} rows to save (${updatedRows.size} updated, ${newRowsToCreate.length} new standard, ${rowsWithDynamicColumns.size} updated dynamic, ${newRowsWithDynamicColumns.length} new dynamic)`,
                        );

                        if (rowIdsToSave.size === 0) {
                            console.log(
                                `[paste_sync] No rows to save, completing paste operation`,
                            );
                            pasteState.isPasting = false;
                            pasteState.pasteOperationActive = false;
                            return;
                        }

                        const saveStartTime = Date.now();
                        console.log(
                            `[save_debug][${operationId}] ========================================`,
                        );
                        console.log(
                            `[save_debug][${operationId}] STARTING save collection at t=${saveStartTime}`,
                        );
                        console.log(
                            `[save_debug][${operationId}] hasDynamicColumns=${hasDynamicColumns}`,
                        );
                        console.log(
                            `[save_debug][${operationId}] remappedRows.length=${remappedRows.length}, updatedLocalDataRows.length=${updatedLocalDataRows.length}`,
                        );
                        console.log(
                            `[save_debug][${operationId}] ========================================`,
                        );

                        // Log column metadata before save
                        console.log(
                            `[save_debug][${operationId}] localColumnsRef.length=${localColumnsRef.current.length} before save`,
                        );
                        console.log(
                            `[save_debug][${operationId}] columns prop.length=${columns.length} before save`,
                        );

                        // Use remappedRows directly if available, otherwise fall back to updatedLocalDataRows or original collections
                        let rowsToUse: T[];
                        if (hasDynamicColumns) {
                            if (remappedRows.length > 0) {
                                console.log(
                                    `[save_debug][${operationId}] ✅ Using remappedRows directly (${remappedRows.length} rows with real accessors)`,
                                );
                                rowsToUse = remappedRows;
                            } else if (updatedLocalDataRows.length > 0) {
                                console.log(
                                    `[save_debug][${operationId}] Using updatedLocalDataRows (${updatedLocalDataRows.length} rows)`,
                                );
                                rowsToUse = updatedLocalDataRows;
                            } else {
                                console.warn(
                                    `[save_debug][${operationId}] ⚠️ No remapped rows available, using original collections`,
                                );
                                console.warn(
                                    `[save_debug][${operationId}] ⚠️ This may cause temp accessor errors!`,
                                );
                                rowsToUse = [
                                    ...updatedRows.values(),
                                    ...newRowsToCreate,
                                    ...Array.from(rowsWithDynamicColumns.values()).map(
                                        ({ row }) => row,
                                    ),
                                    ...newRowsWithDynamicColumns.map(({ row }) => row),
                                ];
                            }
                        } else {
                            rowsToUse = [
                                ...updatedRows.values(),
                                ...newRowsToCreate,
                                ...Array.from(rowsWithDynamicColumns.values()).map(
                                    ({ row }) => row,
                                ),
                                ...newRowsWithDynamicColumns.map(({ row }) => row),
                            ];
                        }

                        // Log first row in rowsToUse to verify it has real accessors
                        if (rowsToUse.length > 0 && hasDynamicColumns) {
                            const firstRowToSave = rowsToUse[0];
                            const firstRowKeys = Object.keys(firstRowToSave);
                            const firstRowTempKeys = firstRowKeys.filter(
                                (key) =>
                                    tempAccessorToRealAccessorMap.has(key) &&
                                    tempAccessorToRealAccessorMap.get(key) !== key,
                            );
                            const firstRowRealKeys = firstRowKeys.filter((key) => {
                                const mappedReal = Array.from(
                                    tempAccessorToRealAccessorMap.values(),
                                );
                                return mappedReal.includes(key);
                            });
                            console.log(
                                `[save_debug][${operationId}] FIRST ROW TO SAVE (id=${firstRowToSave.id}):`,
                                {
                                    allKeys: firstRowKeys,
                                    tempKeys: firstRowTempKeys,
                                    realKeys: firstRowRealKeys,
                                    realKeyValues: firstRowRealKeys.map((k) => ({
                                        key: k,
                                        value: (firstRowToSave as any)[k],
                                    })),
                                },
                            );
                        }

                        // Process all rows that need saving
                        console.log(
                            `[save_debug][${operationId}] Processing ${rowIdsToSave.size} row IDs for save collection...`,
                        );
                        Array.from(rowIdsToSave).forEach((rowId, index) => {
                            const row = rowsToUse.find((r) => r.id === rowId);
                            if (!row) {
                                console.warn(
                                    `[save_debug][${operationId}] Row ${rowId} not found in rows collection, skipping save`,
                                );
                                return;
                            }

                            // Only check for temp accessors if we have dynamic columns
                            if (hasDynamicColumns) {
                                const rowKeys = Object.keys(row);
                                const tempKeys = rowKeys.filter(
                                    (key) =>
                                        tempAccessorToRealAccessorMap.has(key) &&
                                        tempAccessorToRealAccessorMap.get(key) !== key,
                                );

                                // Log first row in detail
                                if (index === 0) {
                                    console.log(
                                        `[save_debug][${operationId}] ========================================`,
                                    );
                                    console.log(
                                        `[save_debug][${operationId}] INSPECTING ROW ${rowId} (first row) at t=${Date.now()}`,
                                    );
                                    console.log(
                                        `[save_debug][${operationId}] Row source: ${remappedRows.some((r) => r.id === rowId) ? 'remappedRows' : 'other collection'}`,
                                    );
                                    console.log(
                                        `[save_debug][${operationId}] Total row keys: ${rowKeys.length}`,
                                    );
                                    console.log(
                                        `[save_debug][${operationId}] Temp keys found: ${tempKeys.length}`,
                                    );
                                    if (tempKeys.length > 0) {
                                        console.error(
                                            `[save_debug][${operationId}] ❌ TEMP KEYS:`,
                                            tempKeys,
                                        );
                                        tempKeys.forEach((tempKey) => {
                                            const mappedReal =
                                                tempAccessorToRealAccessorMap.get(
                                                    tempKey,
                                                );
                                            const hasRealKey = rowKeys.includes(
                                                mappedReal || '',
                                            );
                                            console.error(
                                                `[save_debug][${operationId}]   "${tempKey}" → "${mappedReal}" (real key exists: ${hasRealKey})`,
                                            );
                                        });
                                    } else {
                                        console.log(
                                            `[save_debug][${operationId}] ✅ NO TEMP KEYS - row is ready for save`,
                                        );
                                    }

                                    // Show real keys that should be present
                                    const expectedRealKeys = Array.from(
                                        tempAccessorToRealAccessorMap.values(),
                                    );
                                    const presentRealKeys = rowKeys.filter((k) =>
                                        expectedRealKeys.includes(k),
                                    );
                                    console.log(
                                        `[save_debug][${operationId}] Expected real keys: ${expectedRealKeys.length}, Present: ${presentRealKeys.length}`,
                                    );
                                    if (presentRealKeys.length > 0) {
                                        console.log(
                                            `[save_debug][${operationId}] ✅ Real keys present:`,
                                            presentRealKeys,
                                        );
                                    }
                                    console.log(
                                        `[save_debug][${operationId}] ========================================`,
                                    );
                                }

                                if (tempKeys.length > 0) {
                                    console.error(
                                        `[save_debug][${operationId}] ⚠️ Row ${rowId} still has temp accessors at save time:`,
                                        tempKeys,
                                    );
                                    console.error(
                                        `[save_debug][${operationId}] Row keys:`,
                                        rowKeys,
                                    );
                                    console.error(
                                        `[save_debug][${operationId}] Available mappings:`,
                                        Array.from(
                                            tempAccessorToRealAccessorMap.entries(),
                                        ),
                                    );
                                    console.error(
                                        `[save_debug][${operationId}] Row object:`,
                                        row,
                                    );
                                    return;
                                }
                            }

                            // Determine if this is a new row
                            const isNew =
                                newRowsToCreate.some((r) => r.id === rowId) ||
                                newRowsWithDynamicColumns.some(
                                    ({ row: r }) => r.id === rowId,
                                );

                            allRowsToSave.push({ row, isNew, id: rowId });
                        });

                        console.log(
                            `[save_debug][${operationId}] Collected ${allRowsToSave.length} rows ready for save (out of ${rowIdsToSave.size} requested)`,
                        );

                        if (allRowsToSave.length === 0) {
                            console.warn(
                                `[paste_sync][${operationId}] No valid rows to save after processing, completing paste operation`,
                            );
                            pasteState.isPasting = false;
                            pasteState.pasteOperationActive = false;
                            console.groupEnd();
                            return;
                        }

                        console.debug(
                            `[paste_sync][${operationId}] localData snapshot (first 10):`,
                            localData.slice(0, 10).map((r) => ({
                                id: r.id,
                                position: r.position,
                                keys: Object.keys(r).slice(0, 20),
                            })),
                        );

                        console.debug(
                            '[paste_sync][TIMING]',
                            'columns available before row save:',
                            columns.map((c) => ({
                                id: c.id,
                                accessor: c.accessor,
                                header: c.header,
                            })),
                        );
                        console.debug(
                            '[paste_sync][TIMING]',
                            'localColumnsRef:',
                            localColumnsRef.current.map((c) => ({
                                id: c.id,
                                accessor: c.accessor,
                                header: c.header,
                            })),
                        );

                        // Save all rows immediately with await
                        const t1 = Date.now();
                        console.log(
                            `[save_debug][${operationId}] ========================================`,
                        );
                        console.log(
                            `[save_debug][${operationId}] STARTING actual row saves at t=${t1}`,
                        );
                        console.log(
                            `[save_debug][${operationId}] Time since remap complete: ${remappedRows.length > 0 ? t1 - (remapEndTime || 0) + 'ms' : 'N/A (no remap)'}`,
                        );
                        console.log(
                            `[paste_sync][${operationId}] Columns saved, starting row data save...`,
                        );
                        console.log(
                            `[paste_sync][${operationId}] Saving ${allRowsToSave.length} rows (${updatedRows.size} updated, ${newRowsToCreate.length + newRowsWithDynamicColumns.length} new)...`,
                        );
                        console.log(
                            `[save_debug][${operationId}] ========================================`,
                        );

                        for (let i = 0; i < allRowsToSave.length; i += BATCH_SIZE) {
                            const batch = allRowsToSave.slice(i, i + BATCH_SIZE);
                            console.log(
                                `[paste_sync][${operationId}] Saving batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allRowsToSave.length / BATCH_SIZE)} (${batch.length} rows)...`,
                            );

                            await Promise.all(
                                batch.map(async ({ row, isNew, id }, batchIndex) => {
                                    try {
                                        const saveStart = Date.now();
                                        const payloadKeys = Object.keys(row);

                                        // Final check for temp accessors right before save
                                        if (hasDynamicColumns) {
                                            const tempKeysInPayload = payloadKeys.filter(
                                                (key) =>
                                                    tempAccessorToRealAccessorMap.has(
                                                        key,
                                                    ) &&
                                                    tempAccessorToRealAccessorMap.get(
                                                        key,
                                                    ) !== key,
                                            );

                                            if (tempKeysInPayload.length > 0) {
                                                console.error(
                                                    `[save_debug][${operationId}] ❌ CRITICAL: Row ${id} has temp accessors RIGHT BEFORE SAVE:`,
                                                    tempKeysInPayload,
                                                );
                                                console.error(
                                                    `[save_debug][${operationId}] Row payload keys:`,
                                                    payloadKeys,
                                                );
                                                console.error(
                                                    `[save_debug][${operationId}] Row object:`,
                                                    row,
                                                );
                                                throw new Error(
                                                    `Row ${id} still has temp accessors: ${tempKeysInPayload.join(', ')}`,
                                                );
                                            }

                                            // Log first row in batch with full details
                                            if (batchIndex === 0 && i === 0) {
                                                const realKeysInPayload =
                                                    payloadKeys.filter((k) => {
                                                        const mappedReal = Array.from(
                                                            tempAccessorToRealAccessorMap.values(),
                                                        );
                                                        return mappedReal.includes(k);
                                                    });
                                                console.log(
                                                    `[save_debug][${operationId}] ========================================`,
                                                );
                                                console.log(
                                                    `[save_debug][${operationId}] FINAL CHECK BEFORE SAVE - Row ${id} at t=${saveStart}`,
                                                );
                                                console.log(
                                                    `[save_debug][${operationId}] ✅ NO temp keys found`,
                                                );
                                                console.log(
                                                    `[save_debug][${operationId}] Real keys in payload: ${realKeysInPayload.length}`,
                                                    realKeysInPayload,
                                                );
                                                console.log(
                                                    `[save_debug][${operationId}] Total payload keys: ${payloadKeys.length}`,
                                                );
                                                console.log(
                                                    `[save_debug][${operationId}] ========================================`,
                                                );
                                            }
                                        }

                                        console.debug(
                                            `[paste_sync][${operationId}] saving row id=${id} isNew=${isNew} payloadKeys=${payloadKeys.join(',')}`,
                                        );
                                        console.debug(
                                            `[paste_sync][${operationId}] saveRequirement payload`,
                                            row,
                                        );
                                        const savePromise = saveRow(row, isNew, {
                                            blockId,
                                            skipRefresh: true,
                                        });
                                        pasteState.savePromises.set(id, savePromise);
                                        await savePromise;
                                        pasteState.savePromises.delete(id);
                                        const saveDuration = Date.now() - saveStart;
                                        console.debug(
                                            `[paste_sync][${operationId}] saved row id=${id} duration=${saveDuration}ms`,
                                        );
                                    } catch (err) {
                                        pasteState.savePromises.delete(id);
                                        console.error(
                                            `[paste_sync][${operationId}] ERROR saving row id=${id}`,
                                            err,
                                        );
                                        throw err;
                                    }
                                }),
                            );
                        }
                        const t2 = Date.now();
                        console.log(
                            `[paste_sync][${operationId}] 💾 All ${allRowsToSave.length} rows saved successfully (duration=${t2 - t1}ms)`,
                        );

                        // Wait for any remaining save promises to complete
                        const allSavePromises = Array.from(
                            pasteState.savePromises.values(),
                        );
                        if (allSavePromises.length > 0) {
                            console.log(
                                `[paste_sync][${operationId}] Waiting for ${allSavePromises.length} remaining save promises...`,
                            );
                            await Promise.allSettled(allSavePromises);
                            console.log(
                                `[paste_sync][${operationId}] All save promises resolved`,
                            );
                        }

                        // After all saves:
                        const t3 = Date.now();
                        console.debug(
                            `[paste_sync][${operationId}] done saving rows (duration=${t3 - t0}ms) -> calling onPostSave()`,
                        );

                        // Force save metadata before refresh to ensure column order is persisted
                        const mdStart = Date.now();
                        try {
                            await saveTableMetadata();
                            const mdDuration = Date.now() - mdStart;
                            console.debug(
                                `[paste_sync][${operationId}] saveTableMetadata done (duration=${mdDuration}ms)`,
                            );
                        } catch (error) {
                            const mdDuration = Date.now() - mdStart;
                            console.error(
                                `[paste_sync][${operationId}] ❌ saveTableMetadata failed (duration=${mdDuration}ms):`,
                                error,
                            );
                        }

                        // Clear paste flags BEFORE refresh to allow refresh to proceed
                        pasteState.isPasting = false;
                        pasteState.pasteOperationActive = false;
                        console.debug(
                            `[paste_sync][${operationId}] Paste flags cleared, allowing refresh`,
                        );

                        // Call onPostSave() after all rows are saved and flags are cleared
                        const postStart = Date.now();
                        try {
                            await refreshAfterSave(false);
                            const postDuration = Date.now() - postStart;
                            console.debug(
                                `[paste_sync][${operationId}] onPostSave done (duration=${postDuration}ms)`,
                            );
                        } catch (error) {
                            const postDuration = Date.now() - postStart;
                            console.error(
                                `[paste_sync][${operationId}] ❌ onPostSave() failed (duration=${postDuration}ms):`,
                                error,
                            );
                        }

                        // final cleanup
                        const totalDuration = Date.now() - t0;
                        console.debug(
                            `[paste_sync][${operationId}] FINISH totalDuration=${totalDuration}ms`,
                        );
                        console.groupEnd();
                    } catch (error) {
                        console.error(
                            `[paste_sync][${operationId}] Paste save error:`,
                            error,
                        );
                        // Clear flags even on error to prevent stuck state
                        pasteState.isPasting = false;
                        pasteState.pasteOperationActive = false;
                        console.groupEnd();
                    }
                })();
            } catch (error) {
                console.error(
                    `[paste_sync][${operationId}] Paste operation failed for table ${tableId}:`,
                    error,
                );
                if (error instanceof Error) {
                    console.error(
                        `[paste_sync][${operationId}] Error stack:`,
                        error.stack,
                    );
                }
                // Clear flags on error
                pasteState.isPasting = false;
                pasteState.pasteOperationActive = false;
                console.groupEnd();
            } finally {
                // track pasted rows for deduplication for THIS table instance
                newRowsToCreate.forEach((row) => {
                    pasteState.recentlyPastedRows.add(row.id);
                });

                // clear pasted row tracking after sufficient time for db sync
                setTimeout(() => {
                    pasteState.recentlyPastedRows.clear();
                    console.debug(
                        `[paste_sync][${operationId}] Cleared recently pasted rows tracking for table ${tableId}`,
                    );
                }, 10000);

                console.debug(
                    `[paste_sync][${operationId}] Waiting for database acknowledgment for table ${tableId}...`,
                );
                return true;
            }
        },
        [
            isEditMode,
            sortedData,
            onPostSave,
            saveTableMetadata,
            saveRow,
            localData,
            waitForSupabaseClient,
            verifyColumnsExist,
            confirmColumnsForTable,
            getPasteState,
            blockId,
            orgId,
            projectId,
            documentId,
            userId,
            createPropertyAndColumn,
        ],
    );

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
                                    sortedData.slice(0, 21).reduce((total, _, index) => {
                                        // showing max 20 rows
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
                                1200, // max height before scrolling
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
                            onPaste={isEditMode ? handlePaste : undefined}
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
                                                              setTimeout(
                                                                  () =>
                                                                      handleRowDeleteConfirm(),
                                                                  0,
                                                              );
                                                          } else {
                                                              setRowDeleteConfirmOpen(
                                                                  true,
                                                              );
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
