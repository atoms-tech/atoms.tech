import { GridDragEventArgs, Item } from '@glideapps/glide-data-grid';

import { RequirementAiAnalysis } from '@/types/base/requirements.types';

export type PropertyScope = 'org' | 'project' | 'document';

export interface PropertyConfig {
    scope: PropertyScope[];
    is_base: boolean;
    options?: string[]; // For select/multi-select types
    org_id: string;
    project_id?: string;
    document_id?: string;
}

export type EditableColumnType = 'text' | 'select' | 'multi_select' | 'number' | 'date';

export interface ValidationRule {
    validate: (value: string | number | Date | null) => boolean;
    message: string;
}

export interface ColumnValidation {
    rules?: ValidationRule[];
    required?: boolean;
    requiredMessage?: string;
    pattern?: RegExp;
    patternMessage?: string;
    min?: number;
    max?: number;
    minMessage?: string;
    maxMessage?: string;
    custom?: (value: string | number | Date | null) => string | undefined;
}

// Type for the possible values in a cell
export type CellValue = string | number | Date | string[] | RequirementAiAnalysis | null;

export interface EditableColumn<T> {
    header: string;
    width?: number;
    position?: number;
    accessor: keyof T;
    type: EditableColumnType;
    options?: string[]; // For select type columns
    required?: boolean;
    validation?: ColumnValidation;
    isSortable?: boolean;
    propertyConfig?: PropertyConfig;
    default_value?: CellValue;
    // Add type-specific validation functions
    typeValidation?: {
        text?: (value: string) => boolean;
        number?: (value: number) => boolean;
        date?: (value: Date) => boolean;
        select?: (value: string) => boolean;
    };
}

export interface EditableTableProps<
    T extends Record<string, CellValue> & { id: string },
> {
    data: T[];
    columns: EditableColumn<T>[];
    onSave?: (item: T, isNew: boolean) => Promise<void>;
    onDelete?: (item: T) => Promise<void>;
    onPostSave?: () => Promise<void>; // Callback to refresh data after a save operation
    isLoading?: boolean;
    _emptyMessage?: string;
    showFilter?: boolean;
    filterComponent?: React.ReactNode;
    isEditMode?: boolean;
    alwaysShowAddRow?: boolean; // Always show the "Add New Row" row, even when there are no items
}

// Additional props needed for GlideDataTables. Allows hooking into the existing EditableTableProps like isLoading
export interface GlideTableProps<T extends Record<string, CellValue> & { id: string }>
    extends EditableTableProps<T> {
    onAddRow?: () => void;
    deleteConfirmOpen?: boolean;
    onDeleteConfirm?: () => void;
    setDeleteConfirmOpen?: (open: boolean) => void;
    onColumnOrderChange?: (columns: EditableColumn<T>[]) => void;

    onDragStart?: (args: GridDragEventArgs) => void;
    onDragOverCell?: (cell: Item, dataTransfer: DataTransfer | null) => void;
    onDrop?: (cell: Item, dataTransfer: DataTransfer | null) => void;
}

export interface TableSideMenuProps {
    showFilter?: boolean;
    filterComponent?: React.ReactNode;
    onNewRow: () => void;
    onEnterEditMode: () => void;
}
