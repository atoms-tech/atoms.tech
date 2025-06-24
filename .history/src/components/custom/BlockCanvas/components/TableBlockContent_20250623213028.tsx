import React, { useCallback, useMemo } from 'react';

import {
    EditableTable,
    TanStackEditableTable,
} from '@/components/custom/BlockCanvas/components/EditableTable';
import {
    EditableColumn,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    EditableColumnType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    PropertyConfig,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { DynamicRequirement } from '@/components/custom/BlockCanvas/hooks/useRequirementActions';
import { useDocumentStore } from '@/store/document.store';
import { ReqIdScope, generateSmartReqId } from '@/utils/reqIdGenerator';

interface TableBlockContentProps {
    dynamicRequirements: DynamicRequirement[];
    columns: EditableColumn<DynamicRequirement>[];
    onSaveRequirement: (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
    ) => Promise<void>;
    onDeleteRequirement: (dynamicReq: DynamicRequirement) => Promise<void>;
    refreshRequirements: () => Promise<void>;
    isEditMode: boolean;
    alwaysShowAddRow?: boolean;
    useTanStackTables?: boolean;
    blockId: string;
    documentId: string;
    projectId?: string;
    orgId?: string;
    reqIdScope?: ReqIdScope;
}

export const TableBlockContent: React.FC<TableBlockContentProps> = React.memo(
    ({
        dynamicRequirements,
        columns,
        onSaveRequirement,
        onDeleteRequirement,
        refreshRequirements,
        isEditMode,
        alwaysShowAddRow = false,
        useTanStackTables = false,
        blockId,
        documentId,
        projectId,
        orgId,
        reqIdScope = 'document',
    }) => {
        // Get global setting from doc store as fallback
        const { useTanStackTables: globalUseTanStackTables = false } =
            useDocumentStore();

        // Use prop value if provided, otherwise fall back to global setting
        const shouldUseTanStackTables =
            useTanStackTables || globalUseTanStackTables;

        // Memoize the table component selection
        const TableComponent = useMemo(
            () =>
                shouldUseTanStackTables ? TanStackEditableTable : EditableTable,
            [shouldUseTanStackTables],
        );

        // Memoize the save handler to prevent unnecessary re-renders
        const handleSave = useCallback(
            async (dynamicReq: DynamicRequirement, isNew: boolean) => {
                await onSaveRequirement(dynamicReq, isNew);
            },
            [onSaveRequirement],
        );

        // Memoize the delete handler
        const handleDelete = useCallback(
            async (dynamicReq: DynamicRequirement) => {
                await onDeleteRequirement(dynamicReq);
            },
            [onDeleteRequirement],
        );

        // Memoize the refresh handler
        const handleRefresh = useCallback(async () => {
            await refreshRequirements();
        }, [refreshRequirements]);

        // Create a custom new row initializer that auto-generates REQ-ID
        const customNewRowInitializer = useCallback(
            async (columns: EditableColumn<DynamicRequirement>[]) => {
                const newItem = {} as DynamicRequirement;

                // Initialize all columns with default values
                for (const col of columns) {
                    switch (col.type) {
                        case 'select':
                            newItem[col.accessor as keyof DynamicRequirement] =
                                null;
                            break;
                        case 'multi_select':
                            newItem[col.accessor as keyof DynamicRequirement] =
                                [] as any;
                            break;
                        case 'text':
                            // Check if this is the External_ID column
                            if (
                                col.accessor === 'External_ID' ||
                                col.accessor === 'external_id'
                            ) {
                                // Generate REQ-ID automatically with smart scoping
                                const reqId = await generateNextReqId(
                                    blockId,
                                    documentId,
                                    projectId,
                                    orgId,
                                    reqIdScope,
                                );
                                newItem[
                                    col.accessor as keyof DynamicRequirement
                                ] = reqId as any;
                            } else {
                                newItem[
                                    col.accessor as keyof DynamicRequirement
                                ] = '' as any;
                            }
                            break;
                        case 'number':
                            newItem[col.accessor as keyof DynamicRequirement] =
                                null;
                            break;
                        case 'date':
                            newItem[col.accessor as keyof DynamicRequirement] =
                                null;
                            break;
                        default:
                            newItem[col.accessor as keyof DynamicRequirement] =
                                null;
                    }
                }

                newItem.id = 'new';
                newItem.ai_analysis = null;
                return newItem;
            },
            [blockId, documentId, projectId, orgId, reqIdScope],
        );

        // Memoize the table props to prevent unnecessary re-renders
        const tableProps = useMemo(
            () => ({
                data: dynamicRequirements,
                columns,
                onSave: handleSave,
                onDelete: handleDelete,
                onPostSave: handleRefresh,
                emptyMessage:
                    "Click the 'New Row' below to add your first requirement.",
                showFilter: false,
                isEditMode,
                alwaysShowAddRow,
                customNewRowInitializer,
            }),
            [
                dynamicRequirements,
                columns,
                handleSave,
                handleDelete,
                handleRefresh,
                isEditMode,
                alwaysShowAddRow,
                customNewRowInitializer,
            ],
        );

        return (
            <div className="w-full min-w-0 relative">
                <div className="w-full min-w-0">
                    <div className="w-full max-w-full">
                        <TableComponent {...tableProps} />
                    </div>
                </div>
            </div>
        );
    },
);

TableBlockContent.displayName = 'TableBlockContent';
