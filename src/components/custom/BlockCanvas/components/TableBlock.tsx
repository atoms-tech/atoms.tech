'use client';

/* eslint-disable react-hooks/exhaustive-deps */
import { MoreVertical, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useCallback, useMemo, useState } from 'react';

import { useColumnActions } from '@/components/custom/BlockCanvas/hooks/useColumnActions';
import {
    DynamicRequirement,
    useRequirementActions,
} from '@/components/custom/BlockCanvas/hooks/useRequirementActions';
import {
    BlockProps,
    BlockTableMetadata,
    BlockWithRequirements,
    Column,
    Property,
    PropertyType,
} from '@/components/custom/BlockCanvas/types';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useOrganization } from '@/lib/providers/organization.provider';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store/document.store';
import { Requirement } from '@/types/base/requirements.types';

import { AddColumnDialog } from './EditableTable/components/AddColumnDialog';
import {
    BaseRow,
    EditableColumn,
    EditableColumnType,
    PropertyConfig,
} from './EditableTable/types';
import { GenericTableBlockContent } from './GenericTableBlockContent';
import { TableBlockContent } from './TableBlockContent';
import { TableBlockLoadingState } from './TableBlockLoadingState';

// Toggle verbose debugging for this component
const DEBUG_TABLE_BLOCK = false;

// Helper function to convert property type to editable column type
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

const TableHeader: React.FC<{
    name: string;
    isEditMode: boolean;
    onNameChange: (name: string) => void;
    onAddColumn: (
        name: string,
        type: EditableColumnType,
        propertyConfig: PropertyConfig,
        defaultValue: string,
    ) => void;
    onAddColumnFromProperty?: (propertyId: string, defaultValue: string) => void;
    onDelete: () => void;
    dragActivators?: React.ComponentProps<typeof Button>;
    orgId: string;
    projectId?: string;
    documentId?: string;
    blockId?: string;
    tableMetadata?: BlockTableMetadata | null;
}> = ({
    name,
    isEditMode,
    onNameChange,
    onAddColumn,
    onAddColumnFromProperty,
    onDelete,
    orgId,
    projectId,
    documentId,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(name);
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);

    const handleBlur = () => {
        if (isEditing) {
            setIsEditing(false);
            if (inputValue.trim() !== name) {
                onNameChange(inputValue);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
            onNameChange(inputValue);
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setInputValue(name);
        }
    };

    // Sync inputValue when prop 'name' changes, to avoid stale input after edit from outside
    React.useEffect(() => {
        setInputValue(name);
    }, [name]);

    return (
        <>
            <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
                {isEditMode && isEditing ? (
                    <Input
                        value={inputValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setInputValue(e.target.value)
                        }
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className="max-w-[300px] h-9"
                        autoFocus
                    />
                ) : (
                    <h3
                        className={cn(
                            'text-lg font-semibold',
                            isEditMode && 'cursor-pointer',
                        )}
                        onClick={() => isEditMode && setIsEditing(true)}
                    >
                        {name}
                    </h3>
                )}
                <div className="flex items-center gap-2">
                    {isEditMode && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsAddColumnOpen(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Column
                            </Button>
                        </>
                    )}
                    {isEditMode && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => setIsAddColumnOpen(true)}
                                >
                                    Add Column
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onDelete}>
                                    Delete Table
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
            <AddColumnDialog
                isOpen={isAddColumnOpen}
                onClose={() => setIsAddColumnOpen(false)}
                onSave={onAddColumn}
                onSaveFromProperty={onAddColumnFromProperty}
                orgId={orgId}
                projectId={projectId}
                documentId={documentId}
            />
        </>
    );
};

export const TableBlock: React.FC<BlockProps> = ({
    block,
    onUpdate,
    onDelete,
    dragActivators,
    userProfile,
}) => {
    if (DEBUG_TABLE_BLOCK) {
        console.log('🔍 TableBlock render:', {
            blockId: block.id,
            blockType: block.type,
            hasColumns: !!block.columns,
            columnsLength: block.columns?.length,
            columns: block.columns,
        });
    }

    const params = useParams();
    const { currentOrganization } = useOrganization();

    const {
        createPropertyAndColumn,
        createColumnFromProperty,
        deleteColumn,
        renameProperty = undefined, // provide default to handle if not implemented yet
    } = useColumnActions({
        orgId: currentOrganization?.id || '',
        projectId: params.projectId as string,
        documentId: params.documentId as string,
    });

    const projectId = params?.projectId as string;

    // IMPORTANT: Initialize localRequirements once from block.requirements
    // but prevent resetting on every rerender:
    const [localRequirements, setLocalRequirements] = React.useState<Requirement[]>(
        () => block.requirements || [],
    );

    // Only update localRequirements if block.requirements changes (and is different)
    React.useEffect(() => {
        setLocalRequirements(block.requirements || []);
    }, [block.requirements]);

    const [blockName, setBlockName] = useState(block.name || 'Untitled Table');

    // keep local title in sync with server updates (e.g., after create or external rename)
    React.useEffect(() => {
        if (block.name && block.name !== blockName) {
            setBlockName(block.name);
        }
    }, [block.name]);
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);

    // Use the document store for edit mode state
    const { isEditMode, useTanStackTables, useGlideTables } = useDocumentStore();

    // Optimistic columns state to immediately reflect column adds/deletes before realtime
    const [optimisticColumns, setOptimisticColumns] = useState<Column[] | null>(null);

    // reset optimistic columns when we get a new block (new table created)
    React.useEffect(() => {
        // clear any cached column state for new tables
        setOptimisticColumns(null);
        // clear deleted columns tracking for new table
        setDeletedColumnIds(new Set());

        // if this is a new table with no columns yet, don't carry over old state
        if (!block.columns || block.columns.length === 0) {
            console.debug('[TableBlock] New table detected, clearing column state');
            setOptimisticColumns(null);
            setDeletedColumnIds(new Set());
        }
    }, [block.id]);

    // track deleted column ids to prevent them from reappearing
    const [deletedColumnIds, setDeletedColumnIds] = useState<Set<string>>(new Set());

    // merge server columns into optimistic view when server updates arrive
    React.useEffect(() => {
        const serverCols = block.columns || [];

        // only set optimistic columns if we have actual server columns
        // don't merge with previous state if this is a fresh table
        if (serverCols.length > 0) {
            setOptimisticColumns((prev) => {
                // if no previous state or block id changed, use server columns directly
                if (!prev || prev.length === 0) {
                    console.debug(
                        '[TableBlock] Using server columns directly:',
                        serverCols.length,
                    );
                    // clear deleted columns tracker when starting fresh
                    setDeletedColumnIds(new Set());
                    return serverCols;
                }

                // only merge if we're working with the same table
                // check if the columns are for the same table by comparing properties
                const prevIds = new Set(prev.map((c) => c.id));
                const serverIds = new Set(serverCols.map((c) => c.id));
                const hasOverlap = [...prevIds].some((id) => serverIds.has(id));

                if (!hasOverlap && serverCols.length > 0) {
                    // completely different set of columns - use server columns
                    console.debug(
                        '[TableBlock] New table columns detected, replacing old state',
                    );
                    // clear deleted columns tracker for new table
                    setDeletedColumnIds(new Set());
                    return serverCols;
                }

                // same table - merge updates but respect deletions
                const byId = new Map<string, Column>();

                // add previous columns first (excluding deleted ones)
                for (const c of prev) {
                    if (!deletedColumnIds.has(c.id)) {
                        byId.set(c.id, c);
                    }
                }

                // update with server columns (but don't resurrect deleted ones)
                for (const c of serverCols) {
                    if (!deletedColumnIds.has(c.id)) {
                        byId.set(c.id, c);
                    }
                }

                // check if deleted columns are no longer in server response
                // if so, they're confirmed deleted and we can clear them from tracking
                const confirmedDeleted = [...deletedColumnIds].filter(
                    (id) => !serverIds.has(id),
                );
                if (confirmedDeleted.length > 0) {
                    setDeletedColumnIds((prev) => {
                        const newSet = new Set(prev);
                        confirmedDeleted.forEach((id) => newSet.delete(id));
                        return newSet;
                    });
                }

                return Array.from(byId.values());
            });
        }
    }, [block.columns, block.id, deletedColumnIds]); // add deletedColumnIds as dependency

    // Effective columns used by UI (optimistic first, then server)
    const effectiveColumnsRaw = useMemo(() => {
        return optimisticColumns ?? block.columns ?? [];
    }, [optimisticColumns, block.columns]);

    // Read tableKind once to decide pipeline
    const tableKind = (block.content as unknown as { tableKind?: string })?.tableKind;
    const isGenericTable =
        tableKind === 'genericTable' || tableKind === 'textTable' || tableKind === 'rows';
    if (DEBUG_TABLE_BLOCK && block.type === 'table') {
        console.log('🔎 TableBlock pipeline:', {
            tableKind: tableKind ?? 'unknown',
            isGenericTable,
        });
    }

    // Grab column/requirement metadata from block level.
    const tableContentMetadata: BlockTableMetadata | null = useMemo(() => {
        if (block.type !== 'table') return null;
        const content = block.content;

        try {
            // Ensure content is an object and contains valid arrays for 'columns' and 'requirements'
            const isValid =
                typeof content === 'object' &&
                content !== null &&
                'columns' in content &&
                'requirements' in content &&
                Array.isArray((content as Record<string, unknown>).columns) &&
                Array.isArray((content as Record<string, unknown>).requirements) &&
                (content as { columns: unknown[] }).columns.every(
                    (col) =>
                        typeof col === 'object' &&
                        col !== null &&
                        'columnId' in col &&
                        typeof (col as Record<string, unknown>).columnId === 'string' &&
                        'position' in col &&
                        typeof (col as Record<string, unknown>).position === 'number',
                ) &&
                (content as { requirements: unknown[] }).requirements.every(
                    (req) =>
                        typeof req === 'object' &&
                        req !== null &&
                        'requirementId' in req &&
                        typeof (req as Record<string, unknown>).requirementId ===
                            'string' &&
                        'position' in req &&
                        typeof (req as Record<string, unknown>).position === 'number',
                );

            if (isValid) {
                const parsed = content as unknown as BlockTableMetadata;
                console.debug(
                    `[TableBlock] Parsed tableContentMetadata for ${block.id}: `,
                    parsed,
                );
                return parsed;
            } else {
                console.warn(
                    `[TableBlock] Invalid BlockTableMetadata structure for ${block.id}: `,
                    content,
                );
            }
        } catch (err) {
            console.error(
                `[TableBlock] Failed to parse content as BlockTableMetadata for ${block.id}: `,
                err,
            );
        }

        return null;
    }, [block.content, block.id, block.type]);

    // Initialize requirement actions with properties
    const {
        getDynamicRequirements,
        saveRequirement,
        deleteRequirement,
        refreshRequirements,
    } = useRequirementActions({
        blockId: block.id,
        documentId: block.document_id,
        localRequirements,
        setLocalRequirements,
        properties: useMemo(
            () =>
                (effectiveColumnsRaw || [])
                    .map((col) => col.property)
                    .filter(Boolean) as Property[],
            [effectiveColumnsRaw],
        ),
    });

    const handleSaveRequirement = useCallback(
        async (
            dynamicReq: DynamicRequirement,
            isNew: boolean,
            userId?: string,
            userName?: string,
        ) => {
            const foundId = userId ?? userProfile?.id;
            const foundName = userName ?? userProfile?.full_name;
            if (!foundId) return;
            await saveRequirement(dynamicReq, isNew, foundId, foundName || '');
        },
        [saveRequirement, userProfile?.id, userProfile?.full_name],
    );

    const handleDeleteRequirement = useCallback(
        async (dynamicReq: DynamicRequirement) => {
            if (!userProfile?.id) return;
            await deleteRequirement(dynamicReq, userProfile.id);
            setLocalRequirements((prev) =>
                prev.filter((req) => req.id !== dynamicReq.id),
            );
        },
        [deleteRequirement, userProfile?.id],
    );

    const handleNameChange = useCallback(
        (newName: string) => {
            setBlockName(newName);
            onUpdate({
                name: newName,
                updated_by: userProfile?.id || null,
                updated_at: new Date().toISOString(),
            } as Partial<BlockWithRequirements>);
        },
        [onUpdate, userProfile?.id],
    );

    // Memoize columns to prevent unnecessary recalculations and re-renders
    const columns = useMemo(() => {
        if (!effectiveColumnsRaw) return [];

        const metadataColumns = tableContentMetadata?.columns ?? [];

        const mapped = effectiveColumnsRaw
            .filter((col) => col.property)
            .map((col, index) => {
                const _property = col.property as Property;
                const propertyKey = _property.name;

                // Look for matching column metadata by ID
                const metadata = metadataColumns.find((meta) => meta.columnId === col.id);

                const columnDef = {
                    id: col.id,
                    header: propertyKey,
                    accessor: propertyKey as keyof DynamicRequirement,
                    type: propertyTypeToColumnType(_property.property_type),
                    width: metadata?.width ?? col.width ?? 150,
                    position: metadata?.position ?? col.position ?? index,
                    required: false,
                    isSortable: true,
                    options: _property.options?.values,
                };
                // console.debug('[TableBlock] column mapped', {
                //     id: col.id,
                //     header: propertyKey,
                //     property_type: _property.property_type,
                //     mappedType: columnDef.type,
                //     options: _property.options?.values,
                // });
                return columnDef;
            })
            .sort((a, b) => a.position - b.position);
        return mapped;
    }, [effectiveColumnsRaw, tableContentMetadata?.columns]);

    // Memoize dynamicRequirements to avoid recreating every render unless localRequirements changes
    const dynamicRequirements = useMemo(() => {
        const reqs = getDynamicRequirements();

        const metadataMap = new Map(
            (tableContentMetadata?.requirements || []).map((meta) => [
                meta.requirementId,
                meta,
            ]),
        );

        const reqsWithMetadata = reqs
            .map((req, idx) => {
                const meta = metadataMap.get(req.id);
                return {
                    ...req,
                    position: meta?.position ?? req.position ?? idx,
                    height: meta?.height,
                };
            })
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

        return reqsWithMetadata;
    }, [getDynamicRequirements, tableContentMetadata?.requirements]);

    // Memoize handleAddColumn and handleAddColumnFromProperty
    const handleAddColumn = useCallback(
        async (
            name: string,
            type: EditableColumnType,
            propertyConfig: PropertyConfig,
            defaultValue: string,
        ) => {
            if (!userProfile?.id) return;

            try {
                const result = await createPropertyAndColumn(
                    name,
                    type,
                    propertyConfig,
                    defaultValue,
                    block.id,
                    userProfile.id,
                );
                // optimistically add the new column to local state for immediate ui feedback
                if (result?.column) {
                    // calculate the position for the new column (at the end)
                    const currentColumns = optimisticColumns ?? (block.columns || []);
                    const maxPosition = Math.max(
                        -1, // start at -1 so first column gets position 0
                        ...currentColumns.map((c) => c.position ?? 0),
                    );

                    const enrichedCol = {
                        ...(result.column as Column),
                        property: result.property as Property,
                        position: maxPosition + 1, // place at the end
                    } as Column;

                    setOptimisticColumns((prev) => {
                        const base = prev ?? (block.columns || []);
                        // simply append the new column at the end
                        return [...base, enrichedCol];
                    });
                }
                await refreshRequirements();
            } catch (error) {
                console.error('Error adding column:', error);
            }
        },
        [
            createPropertyAndColumn,
            block.id,
            refreshRequirements,
            userProfile?.id,
            block.columns,
        ],
    );

    const handleAddColumnFromProperty = useCallback(
        async (propertyId: string, defaultValue: string) => {
            if (!userProfile?.id) return;

            try {
                const result = await createColumnFromProperty(
                    propertyId,
                    defaultValue,
                    block.id,
                    userProfile.id,
                );
                if (result?.column) {
                    setOptimisticColumns((prev) => {
                        const base = prev ?? (block.columns || []);
                        // calculate proper position for the new column
                        const maxPosition = Math.max(
                            -1,
                            ...base.map((c) => c.position ?? 0),
                        );

                        const columnWithPosition = {
                            ...(result.column as Column),
                            position: maxPosition + 1, // place at the end
                        };

                        return [...base, columnWithPosition];
                    });
                }
                await refreshRequirements();
            } catch (error) {
                console.error('Error adding column from property:', error);
            }
        },
        [
            createColumnFromProperty,
            block.id,
            refreshRequirements,
            userProfile?.id,
            block.columns,
        ],
    );

    const handleDeleteColumn = useCallback(
        async (columnId: string) => {
            try {
                // mark column as deleted to prevent it from reappearing
                setDeletedColumnIds((prev) => new Set(prev).add(columnId));

                // perform the deletion
                await deleteColumn(columnId, block.id);

                // update optimistic columns
                setOptimisticColumns((prev) =>
                    (prev || []).filter((c) => c.id !== columnId),
                );
            } catch (err) {
                console.error('Failed to delete column:', err);
                // if deletion fails, remove from deleted tracking
                setDeletedColumnIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(columnId);
                    return newSet;
                });
            }
        },
        [block.id, deleteColumn],
    );

    const handleRenameColumn = useCallback(
        async (columnId: string, newName: string) => {
            try {
                // find the column to rename
                const columnToRename = effectiveColumnsRaw.find(
                    (col) => col.id === columnId,
                );
                if (!columnToRename || !columnToRename.property) {
                    console.error('Column or property not found for rename');
                    return;
                }

                // check if renameProperty function exists before calling
                if (typeof renameProperty === 'function') {
                    // update the property name in the database
                    await renameProperty(columnToRename.property.id, newName);
                } else {
                    console.warn(
                        '[TableBlock] renameProperty function not available, falling back to local update only',
                    );
                }

                // optimistically update the local state for immediate ui feedback
                setOptimisticColumns((prev) => {
                    const base = prev ?? effectiveColumnsRaw;
                    return base.map((col) => {
                        if (col.id === columnId && col.property) {
                            return {
                                ...col,
                                property: {
                                    ...col.property,
                                    name: newName,
                                },
                            };
                        }
                        return col;
                    });
                });

                // refresh to get updated data from database
                await refreshRequirements();

                console.debug('[TableBlock] Column renamed successfully:', {
                    columnId,
                    newName,
                    propertyId: columnToRename.property.id,
                });
            } catch (err) {
                console.error('Failed to rename column:', err);
                // show error to user if needed
            }
        },
        [effectiveColumnsRaw, refreshRequirements, renameProperty],
    );

    const handleBlockDelete = useCallback(() => {
        if (onDelete) {
            onDelete();
        }
    }, [onDelete]);

    return (
        <div className="w-full max-w-full bg-background border-b rounded-lg overflow-hidden">
            <div className="flex flex-col w-full max-w-full min-w-0">
                <TableHeader
                    name={blockName}
                    isEditMode={isEditMode}
                    onNameChange={handleNameChange}
                    onAddColumn={handleAddColumn}
                    onAddColumnFromProperty={handleAddColumnFromProperty}
                    onDelete={handleBlockDelete}
                    dragActivators={dragActivators}
                    orgId={currentOrganization?.id || ''}
                    projectId={projectId}
                    documentId={params.documentId as string}
                />
                <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 min-w-0">
                    {isGenericTable ? (
                        <GenericTableBlockContent
                            blockId={block.id}
                            documentId={block.document_id}
                            columns={
                                // For generic tables, ignore base/system properties so blank tables start empty
                                (effectiveColumnsRaw || [])
                                    .filter((col) => {
                                        if (!col.property) return false;
                                        const prop = col.property as Property;
                                        return !prop.is_base; // hide organization base properties in generic tables
                                    })
                                    .map((col, index) => {
                                        const _property = col.property as Property;
                                        const propertyKey = _property.name;
                                        const metadata = (
                                            tableContentMetadata?.columns ?? []
                                        ).find((meta) => meta.columnId === col.id);
                                        return {
                                            id: col.id,
                                            header: propertyKey,
                                            accessor: propertyKey as keyof BaseRow,
                                            type: propertyTypeToColumnType(
                                                _property.property_type,
                                            ),
                                            width: metadata?.width ?? col.width ?? 150,
                                            position:
                                                metadata?.position ??
                                                col.position ??
                                                index,
                                            required: false,
                                            isSortable: true,
                                            options: _property.options?.values,
                                        } as unknown as EditableColumn<BaseRow>;
                                    })
                                    .sort(
                                        (a, b) => (a.position ?? 0) - (b.position ?? 0),
                                    ) as unknown as EditableColumn<BaseRow>[]
                            } // ok when empty
                            isEditMode={isEditMode}
                            alwaysShowAddRow={isEditMode}
                            tableMetadata={tableContentMetadata}
                        />
                    ) : !effectiveColumnsRaw ||
                      !Array.isArray(effectiveColumnsRaw) ||
                      effectiveColumnsRaw.length === 0 ? (
                        <TableBlockLoadingState
                            isLoading={true}
                            isError={false}
                            error={null}
                        />
                    ) : (
                        <TableBlockContent
                            dynamicRequirements={dynamicRequirements}
                            columns={columns}
                            onSaveRequirement={handleSaveRequirement}
                            onDeleteRequirement={handleDeleteRequirement}
                            onDeleteColumn={handleDeleteColumn}
                            onRenameColumn={handleRenameColumn}
                            refreshRequirements={refreshRequirements}
                            isEditMode={isEditMode}
                            alwaysShowAddRow={isEditMode}
                            useTanStackTables={useTanStackTables}
                            useGlideTables={useGlideTables}
                            blockId={block.id}
                            tableMetadata={tableContentMetadata}
                            rowMetadataKey={'requirements'}
                        />
                    )}
                </div>
            </div>
            <AddColumnDialog
                isOpen={isAddColumnOpen}
                onClose={() => setIsAddColumnOpen(false)}
                onSave={handleAddColumn}
                onSaveFromProperty={handleAddColumnFromProperty}
                orgId={currentOrganization?.id || ''}
                projectId={projectId}
                documentId={params.documentId as string}
            />
        </div>
    );
};
