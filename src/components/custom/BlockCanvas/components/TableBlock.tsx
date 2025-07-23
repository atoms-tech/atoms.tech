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
import { useAuth } from '@/hooks/useAuth';
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
        case PropertyType.multi_select:
            return 'select';
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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsAddColumnOpen(true)}>
                                Add Column
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDelete}>
                                Delete Table
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
}) => {
    console.log('🔍 TableBlock render:', {
        blockId: block.id,
        blockType: block.type,
        hasColumns: !!block.columns,
        columnsLength: block.columns?.length,
        columns: block.columns,
    });

    const { userProfile } = useAuth();
    const params = useParams();
    const { currentOrganization } = useOrganization();
    const { createPropertyAndColumn, createColumnFromProperty } = useColumnActions({
        orgId: currentOrganization?.id || '',
        projectId: params.projectId as string,
        documentId: params.documentId as string,
    });
    const projectId = params?.projectId as string;

    // Debugs for tracing loading issues, ignore.
    const instanceId = useMemo(() => Math.random().toString(36).slice(2), []);
    console.debug(`[TableBlock] MOUNT instance=${instanceId}`);

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

        return block.columns
            .filter((col) => col.property)
            .map((col) => {
                const _property = col.property as Property;
                const propertyKey = _property.name;

                return {
                    header: propertyKey,
                    accessor: propertyKey as keyof DynamicRequirement,
                    type: propertyTypeToColumnType(_property.property_type),
                    width: col.width ?? 150,
                    position: col.position ?? 0,
                    required: false,
                    isSortable: true,
                    options: _property.options?.values,
                };
            })
            .sort((a, b) => a.position - b.position);
    }, [block.columns]);

    // Memoize dynamicRequirements to avoid recreating every render unless localRequirements changes
    const dynamicRequirements = useMemo(
        () => getDynamicRequirements(),
        [getDynamicRequirements],
    );

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

    // Memoize handleSaveRequirement
    const handleSaveRequirement = useCallback(
        async (dynamicReq: DynamicRequirement, isNew: boolean) => {
            console.log('🎯 STEP 4: handleSaveRequirement called in TableBlock', {
                isNew,
                dynamicReq,
                userId: userProfile?.id,
            });

            if (!userProfile?.id) {
                console.log('❌ STEP 4: No userProfile.id, returning early');
                return;
            }

            console.log('🎯 STEP 4: Calling saveRequirement from useRequirementActions');
            await saveRequirement(
                dynamicReq,
                isNew,
                userProfile.id,
                userProfile.full_name || '',
            );
            console.log('✅ STEP 4: saveRequirement completed successfully');
        },
        [saveRequirement, userProfile?.id, userProfile?.full_name],
    );

    // Memoize handleDeleteRequirement
    const handleDeleteRequirement = useCallback(
        async (dynamicReq: DynamicRequirement) => {
            if (!userProfile?.id) return;
            await deleteRequirement(dynamicReq, userProfile.id);
        },
        [deleteRequirement, userProfile?.id],
    );

    const handleBlockDelete = useCallback(() => {
        if (onDelete) {
            onDelete();
        }
    }, [onDelete]);

    // * This method was causing a new instance of the table to be made on each data update.
    // * This is due to it being seen as a new TableConent instance.
    // * We now inline it in the return below, to avoid this. Can remove if testing is ok.
    // const TableContent = useCallback(() => {
    //     return (
    //         <TableBlockContent
    //             dynamicRequirements={dynamicRequirements}
    //             columns={columns}
    //             onSaveRequirement={handleSaveRequirement}
    //             onDeleteRequirement={handleDeleteRequirement}
    //             refreshRequirements={refreshRequirements}
    //             isEditMode={isEditMode}
    //             alwaysShowAddRow={isEditMode}
    //             useTanStackTables={useTanStackTables}
    //         />
    //     );
    // }, [
    //     dynamicRequirements,
    //     columns,
    //     handleSaveRequirement,
    //     handleDeleteRequirement,
    //     refreshRequirements,
    //     isEditMode,
    //     useTanStackTables,
    // ]);

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
                        <TableBlockContent
                            dynamicRequirements={dynamicRequirements}
                            columns={columns}
                            onSaveRequirement={handleSaveRequirement}
                            onDeleteRequirement={handleDeleteRequirement}
                            refreshRequirements={refreshRequirements}
                            isEditMode={isEditMode}
                            alwaysShowAddRow={isEditMode}
                            useTanStackTables={useTanStackTables}
                            useGlideTables={useGlideTables}
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
