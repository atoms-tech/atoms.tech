import React from 'react';

import { EditableTable } from '@/components/custom/BlockCanvas/components/EditableTable';
import {
    EditableColumn,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    EditableColumnType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    PropertyConfig,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { DynamicRequirement } from '@/components/custom/BlockCanvas/hooks/useRequirementActions';

interface TableBlockContentProps {
    dynamicRequirements: DynamicRequirement[];
    columns: EditableColumn<DynamicRequirement>[];
    onSaveRequirement: (
        dynamicReq: DynamicRequirement,
        isNew: boolean,
    ) => Promise<void>;
    onDeleteRequirement: (dynamicReq: DynamicRequirement) => Promise<void>;
    isEditMode: boolean;
    alwaysShowAddRow?: boolean;
}

export const TableBlockContent: React.FC<TableBlockContentProps> = ({
    dynamicRequirements,
    columns,
    onSaveRequirement,
    onDeleteRequirement,
    isEditMode,
    alwaysShowAddRow = false,
}) => {
    return (
        <div className="w-full min-w-0 relative">
            <div className="w-full min-w-0">
                <div className="w-full max-w-full">
                    <EditableTable
                        data={dynamicRequirements}
                        columns={columns}
                        onSave={onSaveRequirement}
                        onDelete={onDeleteRequirement}
                        emptyMessage="Click the 'New Row' below to add your first requirement."
                        showFilter={false}
                        isEditMode={isEditMode}
                        alwaysShowAddRow={alwaysShowAddRow}
                    />
                </div>
            </div>
        </div>
    );
};
