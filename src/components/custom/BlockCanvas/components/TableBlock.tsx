'use client';

import React, { useEffect, useState } from 'react';

import {
    DynamicRequirement,
    useRequirementActions,
} from '@/components/custom/BlockCanvas/hooks/useRequirementActions';
import { useTableBlockActions } from '@/components/custom/BlockCanvas/hooks/useTableBlockActions';
import { useTableColumns } from '@/components/custom/BlockCanvas/hooks/useTableColumns';
import { BlockProps } from '@/components/custom/BlockCanvas/types';
import { useBlockPropertySchemas } from '@/hooks/queries/usePropertySchemas';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentStore } from '@/lib/store/document.store';
import { Requirement } from '@/types/base/requirements.types';

import { TableBlockContent } from './TableBlockContent';
import { TableBlockLoadingState } from './TableBlockLoadingState';
import { TableBlockSchemaInitializer } from './TableBlockSchemaInitializer';

export const TableBlock: React.FC<BlockProps> = ({
    block,
    isEditMode: _isEditMode,
}) => {
    const { userProfile } = useAuth();
    const [_selectedRequirement, _setSelectedRequirement] =
        useState<Requirement | null>(null);
    const [localRequirements, setLocalRequirements] = useState<Requirement[]>(
        block.requirements || [],
    );

    // Use the document store for edit mode state
    const { isEditMode: globalIsEditMode } = useDocumentStore();

    // Fetch block property schemas
    const {
        data: blockPropertySchemas,
        isLoading: isLoadingSchemas,
        isError: isSchemasError,
        error: schemasError,
    } = useBlockPropertySchemas(block.id);

    // Initialize table block actions
    const { createBlockPropertySchemas, createCustomBlockPropertySchema } =
        useTableBlockActions({
            documentId: block.document_id,
            blockId: block.id,
        });

    // Initialize requirement actions
    const { getDynamicRequirements, saveRequirement, deleteRequirement } =
        useRequirementActions({
            blockId: block.id,
            documentId: block.document_id,
            localRequirements,
            setLocalRequirements,
            blockPropertySchemas,
        });

    // Get table columns
    const columns = useTableColumns(blockPropertySchemas);

    // Update local requirements when block.requirements changes
    useEffect(() => {
        setLocalRequirements(block.requirements || []);
    }, [block.requirements]);

    // Handle saving a requirement
    const handleSaveRequirement = async (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
    ) => {
        if (!userProfile?.id) return;

        try {
            await saveRequirement(dynamicReq, isNew, userProfile.id);
        } catch (error) {
            // Handle error (could add toast notification here)
            console.error(error);
        }
    };

    // Handle deleting a requirement
    const handleDeleteRequirement = async (dynamicReq: DynamicRequirement) => {
        if (!userProfile?.id) return;

        try {
            await deleteRequirement(dynamicReq, userProfile.id);
        } catch (error) {
            // Handle error (could add toast notification here)
            console.error(error);
        }
    };

    // Handle adding a new column
    const handleAddColumn = async (name: string, dataType: string) => {
        if (!userProfile?.id) return;

        try {
            // Create a new block property schema
            await createCustomBlockPropertySchema(name, dataType);

            // Update all existing requirements with the new column
            if (localRequirements.length > 0) {
                await Promise.all(
                    localRequirements.map(async (req) => {
                        // Skip deleted requirements
                        if (req.is_deleted) return;

                        // Add the new column to the requirement's data
                        const updatedData = {
                            ...(req.data || {}),
                            [name]: '', // Initialize with empty value
                        };

                        // Sync the requirement data and KVs
                        await saveRequirement(
                            {
                                id: req.id,
                                Name: req.name,
                                Description: req.description,
                                Status: req.status,
                                Priority: req.priority,
                                ...updatedData,
                            },
                            false,
                            userProfile.id,
                        );
                    }),
                );
            }
        } catch (error) {
            // Handle error (could add toast notification here)
            throw error;
        }
    };

    // Get dynamic requirements for the table
    const dynamicRequirements = getDynamicRequirements();

    return (
        <>
            {/* Schema Initializer Component */}
            <TableBlockSchemaInitializer
                block={block}
                blockPropertySchemas={blockPropertySchemas}
                isLoadingSchemas={isLoadingSchemas}
                createBlockPropertySchemas={createBlockPropertySchemas}
            />

            {/* Loading and Error States */}
            <TableBlockLoadingState
                isLoading={isLoadingSchemas}
                isError={isSchemasError}
                error={schemasError}
                onCreateDefaultSchemas={createBlockPropertySchemas}
                noSchemas={
                    !blockPropertySchemas || blockPropertySchemas.length === 0
                }
            />

            {/* Table Content */}
            {!isLoadingSchemas &&
                !isSchemasError &&
                blockPropertySchemas &&
                blockPropertySchemas.length > 0 && (
                    <TableBlockContent
                        dynamicRequirements={dynamicRequirements}
                        columns={columns}
                        onSaveRequirement={handleSaveRequirement}
                        onDeleteRequirement={handleDeleteRequirement}
                        onAddColumn={handleAddColumn}
                        isEditMode={globalIsEditMode}
                    />
                )}
        </>
    );
};
