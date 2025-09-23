import { TableDataAdapter } from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { DynamicRequirement } from '@/components/custom/BlockCanvas/hooks/useRequirementActions';

export function createRequirementsAdapter(opts: {
    saveRequirement: (
        item: DynamicRequirement,
        isNew: boolean,
        userId: string,
        userName: string,
    ) => Promise<unknown>;
    deleteRequirement: (item: DynamicRequirement, userId: string) => Promise<void>;
    refreshRequirements: () => Promise<void>;
    userId: string;
    userName: string;
}): TableDataAdapter<DynamicRequirement> {
    const { saveRequirement, deleteRequirement, refreshRequirements, userId, userName } =
        opts;

    return {
        async saveRow(item, isNew) {
            await saveRequirement(item, isNew, userId, userName);
        },
        async deleteRow(item) {
            await deleteRequirement(item, userId);
        },
        async postSaveRefresh() {
            await refreshRequirements();
        },
    };
}
