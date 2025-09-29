import { GridDragEventArgs, Item } from '@glideapps/glide-data-grid';

import { BlockTableMetadata } from '@/components/custom/BlockCanvas/types';
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

export type EditableColumnType =
    | 'text'
    | 'select'
    | 'multi_select'
    | 'number'
    | 'date'
    | 'people';

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

export type BaseRow = {
    id: string;
    position?: number;
    height?: number;
    [key: string]: CellValue | undefined;
};

export interface EditableColumn<T extends BaseRow> {
    id: string;
    header: string;
    width?: number;
    position?: number;
    accessor: keyof T;
    type: EditableColumnType;
    options?: string[]; // For select type columns
    propertyId?: string; // Underlying property id for persistence of options
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

export interface EditableTableProps<T extends BaseRow> {
    data: T[];
    columns: EditableColumn<T>[];
    onSave?: (
        item: T,
        isNew: boolean,
        userId?: string,
        userName?: string,
    ) => Promise<void>;
    onDelete?: (item: T) => Promise<void>;
    onPostSave?: () => Promise<void>; // Callback to refresh data after a save operation
    isLoading?: boolean;
    _emptyMessage?: string;
    showFilter?: boolean;
    filterComponent?: React.ReactNode;
    isEditMode?: boolean;
    alwaysShowAddRow?: boolean; // Always show the "Add New Row" row, even when there are no items
    blockId?: string;
    tableMetadata?: BlockTableMetadata | null;
}

export interface SaveContext {
    blockId?: string;
    documentId?: string;
}

export interface TableDataAdapter<T extends BaseRow> {
    saveRow: (item: T, isNew: boolean, context?: SaveContext) => Promise<void>;
    deleteRow?: (item: T, context?: SaveContext) => Promise<void>;
    postSaveRefresh?: () => Promise<void>;
}

export type RowDetailPanelRenderer<T extends BaseRow> = React.FC<{
    row: T | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    columns: Array<EditableColumn<T>>;
}>;

export interface GlideTableProps<T extends BaseRow> extends EditableTableProps<T> {
    onAddRow?: () => void;
    deleteConfirmOpen?: boolean;
    //onDeleteConfirm?: () => void;
    //setDeleteConfirmOpen?: (open: boolean) => void;

    onDeleteColumn?: (columnId: string) => Promise<void>;
    onRenameColumn?: (columnId: string, newName: string) => Promise<void>;

    onDragStart?: (args: GridDragEventArgs) => void;
    onDragOverCell?: (cell: Item, dataTransfer: DataTransfer | null) => void;
    onDrop?: (cell: Item, dataTransfer: DataTransfer | null) => void;

    // New, for data-agnostic composition
    dataAdapter?: TableDataAdapter<T>;
    rowDetailPanel?: RowDetailPanelRenderer<T>;
    rowMetadataKey?: string; // default 'requirements', can be 'rows'
}

// Adapters to be implemented outside:
// - RequirementsDataAdapter implements TableDataAdapter<DynamicRequirement>
// - GenericRowsDataAdapter implements TableDataAdapter<TableRow>
//   where TableRow extends BaseRow { any fields }

export interface TableSideMenuProps {
    showFilter?: boolean;
    filterComponent?: React.ReactNode;
    onNewRow: () => void;
    onEnterEditMode: () => void;
}
