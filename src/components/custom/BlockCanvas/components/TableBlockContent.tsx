import React, { useCallback, useMemo } from 'react';

import {
    EditableTable,
    GlideEditableTable,
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

interface TableBlockContentProps {
    dynamicRequirements: DynamicRequirement[];
    columns: EditableColumn<DynamicRequirement>[];
    onSaveRequirement: (dynamicReq: DynamicRequirement, isNew: boolean) => Promise<void>;
    onDeleteRequirement: (dynamicReq: DynamicRequirement) => Promise<void>;
    refreshRequirements: () => Promise<void>;
    isEditMode: boolean;
    alwaysShowAddRow?: boolean;
    useTanStackTables?: boolean;
    useGlideTables?: boolean;
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
        useGlideTables = false,
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
            }),
            [
                dynamicRequirements,
                columns,
                handleSave,
                handleDelete,
                handleRefresh,
                isEditMode,
                alwaysShowAddRow,
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
