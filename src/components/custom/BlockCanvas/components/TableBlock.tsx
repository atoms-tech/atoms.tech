'use client';

import { FilterIcon, GripVertical, MoreVertical, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import { useColumnActions } from '@/components/custom/BlockCanvas/hooks/useColumnActions';
import {
    DynamicRequirement,
    useRequirementActions,
} from '@/components/custom/BlockCanvas/hooks/useRequirementActions';
import {
    BlockProps /* eslint-disable-next-line @typescript-eslint/no-unused-vars */,
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
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useDocumentStore } from '@/lib/store/document.store';
import { cn } from '@/lib/utils';
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
    _onAddRow,
    onDelete,
    dragActivators,
    orgId,
    projectId,
    documentId,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [localName, setLocalName] = useState(name);
    const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);

    useEffect(() => {
        setLocalName(name);
    }, [name]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localName !== name) {
            onNameChange(localName);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setLocalName(name);
        }
    };

    return (
        <>
            <div
                className="flex items-center justify-between px-2 py-1 border-b bg-background w-full sticky top-0 z-10 min-w-0"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isEditMode && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 cursor-grab active:cursor-grabbing"
                            {...dragActivators}
                        >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                        </Button>
                    )}
                    {isEditMode && isEditing ? (
                        <input
                            type="text"
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            className="text-sm font-medium px-1 rounded max-w-[200px] bg-gray-100 outline-none border-none"
                            autoFocus
                        />
                    ) : (
                        <span
                            className={cn(
                                'text-sm font-medium px-1 rounded truncate max-w-[200px]',
                                isEditMode && 'hover:bg-gray-100 cursor-text',
                            )}
                            onClick={() => isEditMode && setIsEditing(true)}
                        >
                            {localName}
                        </span>
                    )}
                </div>
                <div
                    className={cn(
                        'flex items-center gap-1 flex-shrink-0 opacity-0 transition-opacity duration-200',
                        (isHovered || isEditMode) && 'opacity-100',
                    )}
                >
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                        <FilterIcon className="w-4 h-4" />
                        <span className="ml-1 hidden sm:inline">Filter</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => isEditMode && setIsAddColumnOpen(true)}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="ml-1 hidden sm:inline">Column</span>
                    </Button>
                    {/* <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => isEditMode && _onAddRow()}>
                        <Plus className="w-4 h-4" />
                        <span className="ml-1 hidden sm:inline">Row</span>
                    </Button> */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem
                                onClick={onDelete}
                                disabled={!isEditMode}
                            >
                                Delete Block
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <AddColumnDialog
                isOpen={isAddColumnOpen}
                onClose={() => setIsAddColumnOpen(false)}
                onSave={(name, type, config, defaultValue) => {
                    onAddColumn(name, type, config, defaultValue);
                    setIsAddColumnOpen(false);
                }}
                orgId={orgId}
                projectId={projectId}
                documentId={documentId}
            />
        </>
    );
};

export const TableBlock: React.FC<BlockProps> = ({
    block,
    isEditMode: _isEditMode,
    onUpdate,
    onDelete,
    dragActivators,
}) => {
    const { userProfile } = useAuth();
    const params = useParams();
    const { currentOrganization } = useOrganization();
    const { createColumn } = useColumnActions({
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
    const { isEditMode: globalIsEditMode } = useDocumentStore();

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
    });

    const handleNameChange = (newName: string) => {
        setBlockName(newName);
        onUpdate({
            name: newName,
            content: block.content, // Preserve existing content
            updated_by: userProfile?.id || null,
            updated_at: new Date().toISOString(),
        });
    };

    // Fetch fresh requirements when exiting edit mode
    useEffect(() => {
        if (!globalIsEditMode) {
            refreshRequirements();
        }
    }, [globalIsEditMode, refreshRequirements]);

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

    // Handle adding a new column
    const handleAddColumn = async (
        name: string,
        type: EditableColumnType,
        propertyConfig: PropertyConfig,
        defaultValue: string,
    ) => {
        if (!userProfile?.id) return;

        try {
            // Create property and column in the database
            await createColumn(
                name,
                type,
                propertyConfig,
                defaultValue,
                block.id,
                userProfile.id,
            );

            // No need to update block directly as createColumn handles everything:
            // 1. Creates property
            // 2. Creates column
            // 3. Updates requirements with new property
            // 4. Invalidates queries to refresh data

            // After column creation, we just need to refresh requirements
            await refreshRequirements();
        } catch (error) {
            console.error('Error adding column:', error);
        }
    };

    const handleAddRow = () => {};

    // Create wrapper functions to handle the user ID
    const handleSaveRequirement = async (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
    ) => {
        if (!userProfile?.id) return;
        await saveRequirement(dynamicReq, isNew, userProfile.id);
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

    return (
        <div className="w-full max-w-full bg-background border-b rounded-lg overflow-hidden">
            <div className="flex flex-col w-full max-w-full min-w-0">
                <TableHeader
                    name={blockName}
                    isEditMode={globalIsEditMode}
                    onNameChange={handleNameChange}
                    onAddColumn={handleAddColumn}
                    _onAddRow={handleAddRow}
                    onDelete={handleBlockDelete}
                    dragActivators={dragActivators}
                    orgId={currentOrganization?.id || ''}
                    projectId={projectId}
                    documentId={block.document_id || undefined}
                />
                <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300 min-w-0">
                    {!block.columns ? (
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
                            isEditMode={globalIsEditMode}
                            alwaysShowAddRow={globalIsEditMode}
                        />
                    )}
                </div>
            </div>
            <AddColumnDialog
                isOpen={isAddColumnOpen}
                onClose={() => setIsAddColumnOpen(false)}
                onSave={(name, type, config, defaultValue) => {
                    handleAddColumn(name, type, config, defaultValue);
                    setIsAddColumnOpen(false);
                }}
                orgId={currentOrganization?.id || ''}
                projectId={projectId}
                documentId={block.document_id || undefined}
            />
        </div>
    );
};
