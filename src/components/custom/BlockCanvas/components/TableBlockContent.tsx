import React, { useCallback, useMemo } from 'react';

import {
    EditableTable,
    GlideEditableTable,
    TanStackEditableTable,
} from '@/components/custom/BlockCanvas/components/EditableTable';
import { RequirementAnalysisSidebar } from '@/components/custom/BlockCanvas/components/EditableTable/components/RequirementAnalysisSidebar';
import {
    EditableColumn,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    EditableColumnType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    PropertyConfig,
    RowDetailPanelRenderer,
    TableDataAdapter,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { DynamicRequirement } from '@/components/custom/BlockCanvas/hooks/useRequirementActions';
import { BlockTableMetadata } from '@/components/custom/BlockCanvas/types';
import { useDocumentStore } from '@/store/document.store';

interface TableBlockContentProps {
    dynamicRequirements: DynamicRequirement[];
    columns: EditableColumn<DynamicRequirement>[];
    onSaveRequirement: (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
        userId?: string,
        userName?: string,
    ) => Promise<void>;
    onDeleteRequirement: (dynamicReq: DynamicRequirement) => Promise<void>;
    onDeleteColumn: (columnId: string) => Promise<void>;
    onRenameColumn?: (columnId: string, newName: string) => Promise<void>; // ADD THIS LINE
    refreshRequirements: () => Promise<void>;
    isEditMode: boolean;
    alwaysShowAddRow?: boolean;
    useTanStackTables?: boolean;
    useGlideTables?: boolean;
    blockId?: string;
    tableMetadata?: BlockTableMetadata | null;
    rowDetailPanel?: RowDetailPanelRenderer<DynamicRequirement>;
    dataAdapter?: TableDataAdapter<DynamicRequirement>;
    rowMetadataKey?: 'requirements' | 'rows';
}

export const TableBlockContent: React.FC<TableBlockContentProps> = React.memo(
    ({
        dynamicRequirements,
        columns,
        onSaveRequirement,
        onDeleteRequirement,
        onDeleteColumn,
        onRenameColumn,
        refreshRequirements,
        isEditMode,
        alwaysShowAddRow = false,
        useTanStackTables = false,
        useGlideTables = false,
        blockId,
        tableMetadata,
        rowDetailPanel,
        dataAdapter,
        rowMetadataKey,
    }) => {
        // Get global setting from doc store as fallback
        const {
            useTanStackTables: globalUseTanStackTables = false,
            useGlideTables: globalUseGlideTables = false,
        } = useDocumentStore();

        // Use prop value if provided, otherwise fall back to global setting
        const shouldUseTanStackTables = useTanStackTables || globalUseTanStackTables;

        // Added implementation for Glide bool, should change for an enum system later.
        const shouldUseGlideTables = useGlideTables || globalUseGlideTables;

        // Memoize the table component selection
        const TableComponent = useMemo(() => {
            if (shouldUseGlideTables) return GlideEditableTable;
            if (shouldUseTanStackTables) return TanStackEditableTable;
            return EditableTable;
        }, [shouldUseGlideTables, shouldUseTanStackTables]) as React.FC<
            typeof tableProps
        >;

        // Memoize the save handler to prevent unnecessary re-renders
        const handleSave = useCallback(
            async (
                dynamicReq: DynamicRequirement,
                isNew: boolean,
                userId?: string,
                userName?: string,
            ) => {
                await onSaveRequirement(dynamicReq, isNew, userId, userName);
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

        // Default to requirement analysis sidebar if none provided
        const EffectiveRowDetailPanel =
            rowDetailPanel ??
            (RequirementAnalysisSidebar as unknown as RowDetailPanelRenderer<DynamicRequirement>);

        // Memoize the table props to prevent unnecessary re-renders
        const tableProps = useMemo(
            () => ({
                data: dynamicRequirements,
                columns,
                onSave: handleSave,
                onDelete: handleDelete,
                onPostSave: handleRefresh,
                emptyMessage: "Click the 'New Row' below to add your first requirement.",
                showFilter: false,
                isEditMode,
                alwaysShowAddRow,
                blockId,
                tableMetadata,
                onDeleteColumn,
                onRenameColumn,
                rowDetailPanel: EffectiveRowDetailPanel,
                dataAdapter,
                rowMetadataKey,
            }),
            [
                dynamicRequirements,
                columns,
                handleSave,
                handleDelete,
                handleRefresh,
                isEditMode,
                alwaysShowAddRow,
                blockId,
                tableMetadata,
                onDeleteColumn,
                onRenameColumn,
                EffectiveRowDetailPanel,
                dataAdapter,
                rowMetadataKey,
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
