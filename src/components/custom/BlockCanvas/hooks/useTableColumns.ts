import React from 'react';

import { EditableColumn } from '@/components/custom/BlockCanvas/components/EditableTable';
import { DynamicRequirement } from '@/components/custom/BlockCanvas/hooks/useRequirementActions';
import { BlockPropertySchema } from '@/components/custom/BlockCanvas/types';
import {
    RequirementPriority,
    RequirementStatus,
} from '@/types/base/enums.types';

export const useTableColumns = (
    blockPropertySchemas: BlockPropertySchema[] | undefined,
) => {
    // Generate columns dynamically based on block property schemas
    const columns: EditableColumn<DynamicRequirement>[] = React.useMemo(() => {
        if (!blockPropertySchemas) {
            return [];
        }

        return blockPropertySchemas.map((schema) => {
            // Create a column for each property schema
            const column: EditableColumn<DynamicRequirement> = {
                header: schema.name,
                accessor: schema.name as keyof DynamicRequirement,
                type: 'text', // Default to text
                width: schema.name === 'Description' ? 300 : 150,
                required: schema.name === 'Name',
                isSortable: true,
            };

            // Special handling for specific columns
            if (schema.name === 'Status') {
                column.type = 'select';
                column.options = Object.values(RequirementStatus);
            } else if (schema.name === 'Priority') {
                column.type = 'select';
                column.options = Object.values(RequirementPriority);
            } else if (schema.data_type === 'number') {
                column.type = 'number';
            } else if (schema.data_type === 'date') {
                column.type = 'date';
            } else if (schema.data_type === 'boolean') {
                column.type = 'text'; // Use text for boolean since 'checkbox' is not a valid type
            } else if (schema.data_type === 'enum') {
                column.type = 'select';
                // You would need to define options for custom select columns
                column.options = ['Option 1', 'Option 2', 'Option 3'];
            }

            return column;
        });
    }, [blockPropertySchemas]);

    return columns;
};
