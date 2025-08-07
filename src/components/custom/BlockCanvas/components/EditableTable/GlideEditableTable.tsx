'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import '@/styles/globals.css';

// We still need to validate role perms so readers cannot exit, ect.

import DataEditor, {
    DataEditorRef,
    GridCell,
    GridCellKind,
    GridColumn,
    GridSelection,
    // CompactSelection,
    //GridDragEventArgs,
    Item,
    Rectangle,
} from '@glideapps/glide-data-grid';
import { useTheme } from 'next-themes';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { glideDarkTheme } from './glideDarkTheme';
import { glideLightTheme } from './glideLightTheme';

import '@glideapps/glide-data-grid/dist/index.css';

import debounce from 'lodash/debounce';
import { useParams } from 'next/navigation';
import { useLayer } from 'react-laag';

//import { RequirementAiAnalysis } from '@/types/base/requirements.types';
import { RequirementAnalysisSidebar } from '@/components/custom/BlockCanvas/components/EditableTable/components/RequirementAnalysisSidebar';
import {
    BlockTableMetadata,
    useBlockMetadataActions,
} from '@/components/custom/BlockCanvas/hooks/useBlockMetadataActions';
import { DynamicRequirement } from '@/components/custom/BlockCanvas/hooks/useRequirementActions';
//import { useColumnActions } from '@/components/custom/BlockCanvas/hooks/useColumnActions';
import { useUser } from '@/lib/providers/user.provider';

import { DeleteConfirmDialog, TableControls, TableLoadingSkeleton } from './components';
import { /*CellValue,*/ EditableColumn, GlideTableProps } from './types';

// import { /*CellValue,*/ GlideTableProps } from './types';
// import { ChartNoAxesColumnDecreasingIcon } from 'lucide-react';
// import { table } from 'console';
// import { string } from 'zod';

export function GlideEditableTable<T extends DynamicRequirement = DynamicRequirement>(
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
        //tableMetadata, // Unneeded: metadata is being used in parent to pass in settings, and saving uses local array to track.
    } = props;

    const [selection, setSelection] = useState<GridSelection | undefined>(undefined);
    const selectionRef = useRef<GridSelection | undefined>(undefined);
    const isPastingRef = useRef(false);
    const pasteOperationIdRef = useRef(0);

    const tableRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<DataEditorRef | null>(null);
    const lastEditedCellRef = useRef<Item | undefined>(undefined);
    const prevEditModeRef = useRef<boolean>(isEditMode);
    const isSavingRef = useRef(false);

    // Get user site profile info for saves.
    const { profile } = useUser();
    const userId = profile?.id;
    const userName = profile?.full_name || '';

    const { updateBlockMetadata } = useBlockMetadataActions();
    //const [columnToDelete, setColumnToDelete] = useState<{ id: string; blockId: string } | null>(null);
    const [columnToDelete, setColumnToDelete] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // States for AI Analysis Sidebar
    const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(
        null,
    );
    const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

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

            for (const [rowId, changes] of rows) {
                const originalItem = data.find((d) => d.id === rowId);
                if (!originalItem) {
                    continue;
                }
                const fullItem: T = { ...originalItem, ...changes };
                await onSave?.(fullItem, false, userId, userName);
            }

            await onPostSave?.();

            // small delay to let the updated props.data come in, then clear buffer
            await new Promise((r) => setTimeout(r, 250));
            setEditingData({});
        } catch {
            // see this testing
        } finally {
            isSavingRef.current = false;
        }
    }, [onPostSave, data, onSave, userId, userName]);

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

        handleResize(); // Run immediately on mount
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const params = useParams();
    const orgId = params?.orgId || '';
    const projectId = params?.projectId || ''; // Ensure projectId is extracted correctly
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

    // Normalize columns to use `title` instead of `header` if needed
    const normalizedColumns = useMemo(() => {
        return columns.map((col) => ({
            ...col,
            title: col.header, // map header to title
        }));
    }, [columns]);

    const [localColumns, setLocalColumns] = useState(
        [...normalizedColumns].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    );
    const localColumnsRef = useRef(localColumns);
    useEffect(() => {
        localColumnsRef.current = localColumns;
    }, [localColumns]);

    const [localData, setLocalData] = useState<T[]>(() => [...data]);

    const [colSizes, setColSizes] = useState<Partial<Record<keyof T, number>>>({});

    // Build column definitions using user-defined column sizes (if available)
    const columnDefs: GridColumn[] = useMemo(
        () =>
            localColumns.map((col, idx) => ({
                title: col.title,
                width: colSizes[col.accessor] || col.width || 120, // prioritize user's resized width
                hasMenu: true,
                menuIcon: 'dots',
                trailingRowOptions:
                    idx === 0
                        ? {
                              hint: 'Add row',
                              addIcon: 'plus',
                              targetColumn: 0,
                          }
                        : undefined,
            })),
        [localColumns, colSizes],
    );

    // Sort localData by metadata position key.
    const sortedData = useMemo(() => {
        return [...localData].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }, [localData]);

    // For AI Sidebar
    const selectedRequirement = useMemo(() => {
        return sortedData.find((r) => r.id === selectedRequirementId) || null;
    }, [sortedData, selectedRequirementId]);

    const [columnMenu, setColumnMenu] = useState<
        | {
              colIndex: number;
              bounds: Rectangle;
          }
        | undefined
    >(undefined);

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
        const latestSortedData = sortedData; // Already sorted by position

        const columnMetadata = latestLocalColumns.map((col, idx) => ({
            columnId: col.id,
            position: idx,
            ...(col.width !== undefined ? { width: col.width } : {}),
        }));

        const rowMetadata = latestSortedData.map((row, idx) => ({
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
            const metadataToSave: Partial<BlockTableMetadata> = {
                columns: columnMetadata,
                requirements: rowMetadata,
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
    }, [blockId, columns, sortedData, updateBlockMetadata]);

    // References to latest version of save methods. Fixes stale reference when editing data on a newly added column.
    const handleSaveAllRef = useRef(handleSaveAll);
    useEffect(() => {
        handleSaveAllRef.current = handleSaveAll;
    }, [handleSaveAll]);

    const saveTableMetadataRef = useRef(saveTableMetadata);
    useEffect(() => {
        saveTableMetadataRef.current = saveTableMetadata;
    }, [saveTableMetadata]);

    // Sync db row changes with existing pending changes for local data.
    useEffect(() => {
        if (isPastingRef.current) {
            return;
        }
        if (isSavingRef.current) {
            return;
        }

        const pendingEdits = editingDataRef.current;

        const _localById = new Map(localData.map((r) => [r.id, r]));

        // merge server rows with any pending edits
        const mergedIncoming = data.map((incoming) => {
            const rowId = incoming.id;
            const pending = pendingEdits[rowId] ?? {};
            return Object.keys(pending).length ? { ...incoming, ...pending } : incoming;
        });

        const extraLocal = localData.filter((r) => !data.some((d) => d.id === r.id));

        const newMerged = [...mergedIncoming, ...extraLocal];

        // detect differences
        const mismatch =
            newMerged.length !== localData.length ||
            newMerged.some((row, i) => {
                const lr = localData[i];
                if (!lr || row.id !== lr.id) return true;
                return Object.keys(row).some((k) => {
                    if (k === 'position' || k === 'height') return false;
                    return row[k] !== lr[k];
                });
            });

        if (mismatch) {
            console.debug('applying merged array');
            setLocalData(newMerged);
        } else {
            console.debug('no merge needed');
        }
        console.groupEnd();
    }, [data, localData]);

    // Watch for changes in columns from db
    useEffect(() => {
        const normalized = columns.map((col) => ({
            ...col,
            title: col.header,
        }));
        const sortedNormalized = [...normalized].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0),
        );

        const localAccessors = new Set(localColumns.map((c) => c.accessor));
        const normalizedAccessors = new Set(sortedNormalized.map((c) => c.accessor));

        const columnsAdded = [...normalizedAccessors].filter(
            (a) => !localAccessors.has(a),
        );
        const columnsRemoved = [...localAccessors].filter(
            (a) => !normalizedAccessors.has(a),
        );

        if (columnsAdded.length || columnsRemoved.length) {
            //console.debug('[GlideEditableTable] Detected column count change. Updating localColumns...');

            // Merge new columns at end, preserving existing column order and metadata
            const merged = [...localColumns];

            for (const added of columnsAdded) {
                const newCol = sortedNormalized.find((c) => c.accessor === added);
                if (newCol) merged.push(newCol);
            }

            // Filter out removed columns
            const filtered = merged.filter((col) =>
                normalizedAccessors.has(col.accessor),
            );

            setLocalColumns(filtered);
        }
    }, [columns, localColumns]);

    // Debugs for tracing loading issues, ignore.
    // const instanceId = useMemo(() => Math.random().toString(36).slice(2), []);
    // console.debug(`[GlideEditableTable] MOUNT instance=${instanceId}`);
    // console.debug('[GlideEditableTable] Local Columns:', localColumns);
    // useEffect(() => {
    //     console.debug(`[GlideEditableTable] PROPS for instance=${instanceId}:`, {
    //         dataLength: data.length,
    //         columnCount: columns.length,
    //         firstRow: data[0],
    //         columns,
    //     });
    // }, [data, columns, instanceId]);

    // useEffect(() => {
    //     console.debug('[GlideEditableTable] Props:', {
    //         dataLength: data?.length,
    //         columns,
    //         firstRow: data?.[0],
    //     });
    // }, [data, columns]);

    // useEffect(() => {
    //     console.debug('[Glide TABLE INIT] Local Columns:', localColumns);
    // }, [localColumns]);

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

                debouncedSave(); // Call debounced save with newly updated columns.
                return updated;
            });
        },
        [debouncedSave, localColumns],
    );

    const handleColumnMoved = useCallback(
        (startIndex: number, endIndex: number) => {
            setLocalColumns((prevCols) => {
                const updated = [...prevCols];
                const [moved] = updated.splice(startIndex, 1);
                updated.splice(endIndex, 0, moved);

                const reindexed = updated.map((col, i) => ({
                    ...col,
                    position: i,
                }));

                return reindexed;
            });

            debouncedSave(); // Trigger debounced save on column metadata change
        },
        [debouncedSave],
    );

    const getCellContent = useCallback(
        ([col, row]: Item): GridCell => {
            const rowData = sortedData[row];
            const accessor = localColumns[col].accessor;
            const value = rowData?.[accessor];

            return {
                kind: GridCellKind.Text,
                allowOverlay: isEditMode,
                data: value?.toString() ?? '',
                displayData: value?.toString() ?? '',
            };
        },
        [sortedData, localColumns, isEditMode],
    );

    const onCellEdited = useCallback(
        async (cell: Item, newValue: GridCell) => {
            // Ignore edits during paste
            if (isPastingRef.current) {
                console.debug('[onCellEdited] Ignoring during paste');
                return;
            }

            const [colIndex, rowIndex] = cell;
            if (newValue.kind !== GridCellKind.Text) return;

            const gridRow = sortedData[rowIndex];
            if (!gridRow) {
                console.warn('[onCellEdited] No row at index', { rowIndex });
                return;
            }

            const accessor = localColumns[colIndex].accessor;
            const rowId = gridRow.id;
            const nextVal = newValue.data;
            const prevVal = (gridRow as any)?.[accessor];

            if ((prevVal ?? '').toString() === (nextVal ?? '')) return;

            console.debug('[onCellEdited]', {
                rowIndex,
                rowId,
                accessor: String(accessor),
                old: prevVal,
                new: nextVal,
            });

            setLocalData((prev) =>
                prev.map((r) =>
                    r.id === rowId ? ({ ...r, [accessor]: nextVal } as T) : r,
                ),
            );

            // Buffer for debounced batch save
            setEditingData((prev) => {
                const merged = {
                    ...(prev[rowId] ?? {}),
                    [accessor]: nextVal,
                } as Partial<T>;
                return { ...prev, [rowId]: merged };
            });

            debouncedSave();
            lastEditedCellRef.current = cell;
        },
        [sortedData, localColumns, debouncedSave],
    );

    // Add new row.
    const handleRowAppended = useCallback(() => {
        const maxPosition = Math.max(0, ...data.map((d) => d.position ?? 0));
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

        onSave?.(newRow, true);
    }, [columns, data, onSave]);

    const handleRowMoved = useCallback(
        (from: number, to: number) => {
            if (from === to) return;

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
        },
        [debouncedSave],
    );

    const handleRowResize = useCallback(
        (rowIndex: number, newSize: number) => {
            const rowId = sortedData[rowIndex]?.id;
            if (!rowId) return;

            setLocalData((prev) => {
                const updated = prev.map((row) =>
                    row.id === rowId ? { ...row, height: newSize } : row,
                );
                debouncedSave(); // Call debounced save with newly updated columns.
                return updated;
            });
        },
        [debouncedSave, sortedData],
    );

    const handleColumnDeleteConfirm = useCallback(async () => {
        if (!columnToDelete) return;

        try {
            await props.onDeleteColumn?.(columnToDelete);

            // Compute updated local columns *before* triggering state update
            const newLocalColumns = localColumnsRef.current.filter(
                (col) => col.id !== columnToDelete,
            );

            // Update ref and state, then call metadata update.
            localColumnsRef.current = newLocalColumns;
            setLocalColumns(newLocalColumns);

            saveTableMetadata();
        } catch (err) {
            console.error('[GlideEditableTable] Failed to delete column:', err);
            return;
        }
        // Cleanup state on success.
        setColumnToDelete(null);
        setDeleteConfirmOpen(false);
    }, [columnToDelete, props, saveTableMetadata]);

    // Modify Trailing Row Visuals
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

    // Called when edit mode is turned false. Curr salls HandleSaveAll ...
    useEffect(() => {
        const wasEditMode = prevEditModeRef.current;
        prevEditModeRef.current = isEditMode;
        if (wasEditMode && !isEditMode) {
            console.debug(
                '[GlideEditableTable] Edit mode exited. Checking for unsaved edits...',
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

    // Save hotkey, temp fix for dev. 'Ctrl' + 's'
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const isMac =
                (navigator as any).userAgentData?.platform === 'macOS' ||
                navigator.userAgent.toLowerCase().includes('mac');
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
            }
        },
        [handleSaveAll, saveTableMetadata],
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // Open side panel for AI Analysis
    const handleCellActivated = useCallback(
        (cell: Item) => {
            if (!isEditMode) {
                const row = sortedData[cell[1]];
                if (row?.id) {
                    setSelectedRequirementId(row.id);
                    setIsAiSidebarOpen(true);
                }
            }
        },
        [isEditMode, sortedData],
    );

    // enhanced selection tracking
    useEffect(() => {
        selectionRef.current = selection;
    }, [selection]);

    // enhanced paste handler with crash protection
    const handlePaste = useCallback(
        async (event: ClipboardEvent) => {
            const op = ++pasteOperationIdRef.current;
            console.debug(`📋 [handlePaste] op=${op} start`, { isEditMode });

            if (!isEditMode) {
                console.debug('[handlePaste] Not in edit mode');
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            if (isPastingRef.current) {
                console.debug('[handlePaste] Already pasting; skipping nested paste');
                return;
            }

            const text = event.clipboardData?.getData('text/plain') ?? '';
            if (!text.trim()) {
                console.debug('[handlePaste] Empty clipboard');
                return;
            }

            isPastingRef.current = true;

            try {
                const rows = text
                    .trim()
                    .split(/\r?\n/)
                    .map((r) => r.split('\t'));

                // Start position from selection
                const startCell = selectionRef.current?.current?.cell;
                const startCol = startCell?.[0] ?? 0;
                const startRow = startCell?.[1] ?? 0;
                console.debug('[handlePaste] startCell', {
                    startRow,
                    startCol,
                    pasteRows: rows.length,
                    pasteCols: rows[0]?.length ?? 0,
                });

                // Clear selection so DataEditor doesn't try to keep an overlay
                setSelection(undefined);
                selectionRef.current = undefined;

                // Build fast lookup for current localData
                const localById = new Map(localData.map((r) => [r.id, r]));
                const updatedById = new Map(
                    localData.map((r) => [r.id, r] as [string, T]),
                );
                const newRowsToCreate: T[] = [];
                const existingRowUpdates: Record<string, Partial<T>> = {};

                // Helper for new row
                const makeBlankRow = (): T =>
                    ({
                        id: crypto.randomUUID(),
                        position:
                            Math.max(0, ...localData.map((d) => d.position ?? 0)) + 1,
                        ...Object.fromEntries(
                            localColumnsRef.current.map((c) => [
                                c.accessor as string,
                                '',
                            ]),
                        ),
                    }) as T;

                for (let i = 0; i < rows.length; i++) {
                    const vals = rows[i];
                    const targetIdx = startRow + i;

                    let targetId: string;
                    let baseRow: T;
                    const existingInGrid = sortedData[targetIdx];

                    if (existingInGrid) {
                        targetId = existingInGrid.id;
                        baseRow = { ...(localById.get(targetId) ?? existingInGrid) };
                    } else {
                        baseRow = makeBlankRow();
                        targetId = baseRow.id;
                        newRowsToCreate.push(baseRow);
                    }

                    const workingRow = { ...baseRow };

                    for (let j = 0; j < vals.length; j++) {
                        const colIdx = startCol + j;
                        const col = localColumnsRef.current[colIdx];
                        if (!col) {
                            console.warn('[handlePaste] colIdx out of range', { colIdx });
                            continue;
                        }

                        // Skip your not-yet-implemented Priority column
                        if (String(col.accessor).toLowerCase().includes('priority')) {
                            console.debug('[handlePaste] ⏭️ Skipping priority column', {
                                colIdx,
                                accessor: String(col.accessor),
                            });
                            continue;
                        }

                        const newVal = vals[j] ?? '';
                        const oldVal = (workingRow as any)[col.accessor];

                        if (oldVal !== newVal) {
                            (workingRow as any)[col.accessor] = newVal;
                            if (!existingInGrid) {
                            } else {
                                existingRowUpdates[targetId] ??= {};
                                (existingRowUpdates[targetId] as any)[col.accessor] =
                                    newVal;
                            }

                            console.debug('[handlePaste] set cell', {
                                rowIndex: targetIdx,
                                rowId: targetId,
                                accessor: String(col.accessor),
                                old: oldVal,
                                new: newVal,
                            });
                        }
                    }

                    updatedById.set(targetId, workingRow);
                }

                const nextLocal = localData
                    .map((r) => updatedById.get(r.id) ?? r)
                    .concat(newRowsToCreate);
                setLocalData(nextLocal);
                console.debug('[handlePaste] localData updated', {
                    total: nextLocal.length,
                    changedExisting: Object.keys(existingRowUpdates).length,
                    newRows: newRowsToCreate.length,
                });

                for (const [rowId, changes] of Object.entries(existingRowUpdates)) {
                    const full = updatedById.get(rowId) as T;
                    console.debug('[handlePaste] save existing', { rowId, changes });
                    await onSave?.({ ...full, ...changes }, false, userId, userName);
                    console.debug('[handlePaste] saved existing', { rowId });
                }

                for (const newRow of newRowsToCreate) {
                    console.debug('[handlePaste] save new row', { id: newRow.id });
                    await onSave?.(newRow, true, userId, userName);
                    console.debug('[handlePaste] saved new row', { id: newRow.id });
                }
            } catch (err) {
                console.error('[handlePaste] error', err);
            } finally {
                setTimeout(() => {
                    isPastingRef.current = false;
                    console.debug(`📋 [handlePaste] op=${op} complete`);
                }, 200);
            }
        },
        [isEditMode, localData, sortedData, onSave, userId, userName],
    );

    // paste event listener setup
    useEffect(() => {
        const tableElement = tableRef.current;
        if (!tableElement) return;

        console.debug('[useEffect] Attaching paste event listener to table element');

        tableElement.addEventListener('paste', handlePaste, {
            capture: true,
            passive: false,
        });

        return () => {
            console.debug('[useEffect] Removing paste event listener from table element');
            tableElement.removeEventListener('paste', handlePaste, {
                capture: true,
            });
        };
    }, [handlePaste]);

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

    function insertColumnAt(colIndex: number) {
        console.log('Function not implemented, but got index: ');
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
                    overflowX: 'hidden',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div style={{ width: '100%' }}>
                    <div style={{ height: 500 }}>
                        <DataEditor
                            ref={gridRef}
                            columns={columnDefs}
                            getCellContent={getCellContent}
                            onCellEdited={isEditMode ? onCellEdited : undefined}
                            onCellActivated={isEditMode ? undefined : handleCellActivated}
                            rows={sortedData.length}
                            rowHeight={(row) => sortedData[row]?.height ?? 43}
                            onColumnResize={isEditMode ? handleColumnResize : undefined}
                            onColumnMoved={isEditMode ? handleColumnMoved : undefined}
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
                            gridSelection={selection}
                            onGridSelectionChange={handleSelectionChange}
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
                        />

                        <RequirementAnalysisSidebar
                            requirement={selectedRequirement}
                            open={isAiSidebarOpen}
                            onOpenChange={(open) => {
                                setIsAiSidebarOpen(open);
                                if (!open) {
                                    setSelectedRequirementId(null);
                                    // Refocus after delay to accommodate keyboard controls.
                                    setTimeout(() => {
                                        gridRef.current?.focus();
                                    }, 50);
                                }
                            }}
                            columns={localColumns as EditableColumn<DynamicRequirement>[]}
                        />

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
                                        borderRadius: 5,
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
            </div>
        </div>
    );
}
