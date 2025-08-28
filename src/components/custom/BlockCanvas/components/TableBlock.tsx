'use client';

import { GripVertical, MoreVertical, Plus } from 'lucide-react';
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
import { EditableColumnType, PropertyConfig } from './EditableTable/types';
import { TableBlockContent } from './TableBlockContent';
import { TableBlockLoadingState } from './TableBlockLoadingState';

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
    dragActivators,
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
                <div className="flex items-center gap-2">
                    {dragActivators && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 cursor-grab active:cursor-grabbing"
                            {...dragActivators}
                        >
                            <GripVertical className="h-4 w-4" />
                            <span className="sr-only">Drag to reorder</span>
                        </Button>
                    )}
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
                </div>
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
    console.log('🔍 TableBlock render:', {
        blockId: block.id,
        blockType: block.type,
        hasColumns: !!block.columns,
        columnsLength: block.columns?.length,
        columns: block.columns,
    });

    const params = useParams();
    const { currentOrganization } = useOrganization();
    const { createPropertyAndColumn, createColumnFromProperty, deleteColumn } =
        useColumnActions({
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
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);

    // Use the document store for edit mode state
    const { isEditMode, useTanStackTables, useGlideTables } = useDocumentStore();

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
            () => block.columns?.map((col) => col.property).filter(Boolean) as Property[],
            [block.columns],
        ),
    });

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
        if (!block.columns) return [];

        const metadataColumns = tableContentMetadata?.columns ?? [];

        const mapped = block.columns
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
                console.debug('[TableBlock] column mapped', {
                    id: col.id,
                    header: propertyKey,
                    property_type: _property.property_type,
                    mappedType: columnDef.type,
                    options: _property.options?.values,
                });
                return columnDef;
            })
            .sort((a, b) => a.position - b.position);
        return mapped;
    }, [block.columns, tableContentMetadata?.columns]);

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

        //console.debug('[TableBlock] Requirments with metadata: ', reqsWithMetadata);

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
                await createPropertyAndColumn(
                    name,
                    type,
                    propertyConfig,
                    defaultValue,
                    block.id,
                    userProfile.id,
                );
                await refreshRequirements();
            } catch (error) {
                console.error('Error adding column:', error);
            }
        },
        [createPropertyAndColumn, block.id, refreshRequirements, userProfile?.id],
    );

    const handleAddColumnFromProperty = useCallback(
        async (propertyId: string, defaultValue: string) => {
            if (!userProfile?.id) return;

            try {
                await createColumnFromProperty(
                    propertyId,
                    defaultValue,
                    block.id,
                    userProfile.id,
                );
                await refreshRequirements();
            } catch (error) {
                console.error('Error adding column from property:', error);
            }
        },
        [createColumnFromProperty, block.id, refreshRequirements, userProfile?.id],
    );

    // Memoize handler to pass down to table level.
    const handleDeleteColumn = useCallback(
        async (columnId: string) => {
            try {
                await deleteColumn(columnId, block.id);
            } catch (err) {
                console.error('Failed to delete column:', err);
            }
        },
        [block.id, deleteColumn],
    );

    // Memoize handleSaveRequirement
    const handleSaveRequirement = useCallback(
        async (
            dynamicReq: DynamicRequirement,
            isNew: boolean,
            userId?: string,
            userName?: string,
        ) => {
            // Retrieve user info from args or curr profile. Allows debouncing saves.
            const foundId = userId ?? userProfile?.id;
            const foundName = userName ?? userProfile?.full_name;

            console.log('🎯 STEP 4: handleSaveRequirement called in TableBlock', {
                isNew,
                dynamicReq,
                foundId,
            });

            if (!foundId) {
                console.log('❌ STEP 4: No userProfile.id or userId, returning early');
                return;
            }

            console.log('🎯 STEP 4: Calling saveRequirement from useRequirementActions');
            await saveRequirement(dynamicReq, isNew, foundId, foundName || '');
            console.log('✅ STEP 4: saveRequirement completed successfully');
        },
        [saveRequirement, userProfile?.id, userProfile?.full_name],
    );

    // Memoize handleDeleteRequirement
    const handleDeleteRequirement = useCallback(
        async (dynamicReq: DynamicRequirement) => {
            if (!userProfile?.id) return;
            await deleteRequirement(dynamicReq, userProfile.id);

            // Immediately remove from local state to prevent reappear
            setLocalRequirements((prev) =>
                prev.filter((req) => req.id !== dynamicReq.id),
            );

            //await refreshRequirements(); // Temp fix for better syncing. Should push down to table level or track deleted reqs at block level later.
        },
        [deleteRequirement, userProfile?.id],
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
                    {!block.columns ||
                    !Array.isArray(block.columns) ||
                    block.columns.length === 0 ? (
                        <>
                            <TableBlockLoadingState
                                isLoading={true}
                                isError={false}
                                error={null}
                            />
                        </>
                    ) : (
                        // Must be inlined, passing as an object causes remount on data change.
                        <TableBlockContent
                            dynamicRequirements={dynamicRequirements}
                            columns={columns}
                            onSaveRequirement={handleSaveRequirement}
                            onDeleteRequirement={handleDeleteRequirement}
                            onDeleteColumn={handleDeleteColumn}
                            refreshRequirements={refreshRequirements}
                            isEditMode={isEditMode}
                            alwaysShowAddRow={isEditMode}
                            useTanStackTables={useTanStackTables}
                            useGlideTables={useGlideTables}
                            blockId={block.id}
                            tableMetadata={tableContentMetadata}
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
