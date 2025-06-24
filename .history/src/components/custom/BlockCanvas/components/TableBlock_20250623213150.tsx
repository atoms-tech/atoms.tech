'use client';

import { GripVertical, MoreVertical, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

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
    onAddColumnFromProperty?: (
        propertyId: string,
        defaultValue: string,
    ) => void;
    _onAddRow: () => void;
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
    _onAddRow,
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
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => setInputValue(e.target.value)}
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
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                            >
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
    const { userProfile } = useAuth();
    const params = useParams();
    const { currentOrganization } = useOrganization();
    const { createPropertyAndColumn, createColumnFromProperty } =
        useColumnActions({
            orgId: currentOrganization?.id || '',
            projectId: params.projectId as string,
            documentId: params.documentId as string,
        });
    const projectId = params?.projectId as string;

    const [_selectedRequirement, _setSelectedRequirement] =
        useState<Requirement | null>(null);
    const [localRequirements, setLocalRequirements] = useState<Requirement[]>(
        block.requirements || [],
    );
    const [blockName, setBlockName] = useState(block.name || 'Untitled Table');
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);

    // Use the document store for edit mode state
    const { isEditMode, useTanStackTables } = useDocumentStore();

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
        properties: block.columns
            ?.map((col) => col.property)
            .filter(Boolean) as Property[],
        projectId: projectId,
        orgId: currentOrganization?.id,
        reqIdScope: 'org', // Use organization-wide scope for maximum uniqueness
    });

    const handleNameChange = (newName: string) => {
        setBlockName(newName);
        onUpdate({
            name: newName,
            updated_by: userProfile?.id || null,
            updated_at: new Date().toISOString(),
        } as Partial<BlockWithRequirements>);
    };

    // Fetch fresh requirements when exiting edit mode
    useEffect(() => {
        if (!isEditMode) {
            refreshRequirements();
        }
    }, [isEditMode, refreshRequirements]);

    // Get table columns from block columns
    const getColumnsFromProperties = useCallback(() => {
        if (!block.columns) return [];

        // Create columns array from block columns, sorted by position
        const columns = block.columns
            .filter((col) => col.property)
            .map((col) => {
                const _property = col.property as Property;
                const propertyKey = _property.name;

                return {
                    header: propertyKey,
                    accessor: propertyKey as keyof DynamicRequirement,
                    type: propertyTypeToColumnType(_property.property_type),
                    width: 150,
                    required: false,
                    isSortable: true,
                    options: _property.options?.values,
                };
            })
            .sort((a, b) => {
                const aPos =
                    block.columns?.find(
                        (col) => col.property?.name === a.header,
                    )?.position || 0;
                const bPos =
                    block.columns?.find(
                        (col) => col.property?.name === b.header,
                    )?.position || 0;
                return aPos - bPos;
            });

        return columns;
    }, [block.columns]);

    // Convert the columns to table format
    const columns = getColumnsFromProperties();

    // Get requirements in dynamic format
    const dynamicRequirements = getDynamicRequirements();

    // Handle adding a new column with a new property
    const handleAddColumn = async (
        name: string,
        type: EditableColumnType,
        propertyConfig: PropertyConfig,
        defaultValue: string,
    ) => {
        if (!userProfile?.id) return;

        try {
            // Create property and column in the database
            await createPropertyAndColumn(
                name,
                type,
                propertyConfig,
                defaultValue,
                block.id,
                userProfile.id,
            );

            // After column creation, we just need to refresh requirements
            await refreshRequirements();
        } catch (error) {
            console.error('Error adding column:', error);
        }
    };

    // Handle adding a column from an existing property
    const handleAddColumnFromProperty = async (
        propertyId: string,
        defaultValue: string,
    ) => {
        if (!userProfile?.id) return;

        try {
            // Create column using an existing property
            await createColumnFromProperty(
                propertyId,
                defaultValue,
                block.id,
                userProfile.id,
            );

            // After column creation, refresh requirements
            await refreshRequirements();
        } catch (error) {
            console.error('Error adding column from property:', error);
        }
    };

    const handleAddRow = () => {};

    // Create wrapper functions to handle the user ID
    const handleSaveRequirement = async (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
    ) => {
        if (!userProfile?.id) return;
        await saveRequirement(
            dynamicReq,
            isNew,
            userProfile.id,
            userProfile.full_name || '',
        );
        // Refresh requirements after save
        await refreshRequirements();
    };

    const handleDeleteRequirement = async (dynamicReq: DynamicRequirement) => {
        if (!userProfile?.id) return;
        await deleteRequirement(dynamicReq, userProfile.id);
        // Refresh requirements after delete
        await refreshRequirements();
    };

    // Handle deleting the entire block
    const handleBlockDelete = useCallback(() => {
        if (onDelete) {
            onDelete();
        }
    }, [onDelete]);

    // Use isEditMode directly from the document store
    const TableContent = () => {
        return (
            <TableBlockContent
                dynamicRequirements={dynamicRequirements}
                columns={columns}
                onSaveRequirement={handleSaveRequirement}
                onDeleteRequirement={handleDeleteRequirement}
                refreshRequirements={refreshRequirements}
                isEditMode={isEditMode}
                alwaysShowAddRow={isEditMode}
                useTanStackTables={useTanStackTables}
                blockId={block.id}
                documentId={block.document_id}
                projectId={projectId}
                orgId={currentOrganization?.id}
                reqIdScope="org" // Use organization-wide scope for maximum uniqueness
            />
        );
    };

    return (
        <div className="w-full max-w-full bg-background border-b rounded-lg overflow-hidden">
            <div className="flex flex-col w-full max-w-full min-w-0">
                <TableHeader
                    name={blockName}
                    isEditMode={isEditMode}
                    onNameChange={handleNameChange}
                    onAddColumn={handleAddColumn}
                    onAddColumnFromProperty={handleAddColumnFromProperty}
                    _onAddRow={handleAddRow}
                    onDelete={handleBlockDelete}
                    dragActivators={dragActivators}
                    orgId={currentOrganization?.id || ''}
                    projectId={projectId}
                    documentId={params.documentId as string}
                />
                <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 min-w-0">
                    {!block.columns ? (
                        <TableBlockLoadingState
                            isLoading={true}
                            isError={false}
                            error={null}
                        />
                    ) : (
                        <TableContent />
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
