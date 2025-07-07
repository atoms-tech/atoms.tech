import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

import { Block } from '@/types/base/documents.types';
import { Profile } from '@/types/base/profiles.types';
import { Requirement } from '@/types/base/requirements.types';

// Default property keys enum for use in block creation
export enum DefaultPropertyKeys {
    NAME = 'name',
    DESCRIPTION = 'description',
    STATUS = 'status',
    PRIORITY = 'priority',
    ID = 'id',
}

// Property type enum
export enum PropertyType {
    text = 'text',
    number = 'number',
    boolean = 'boolean',
    date = 'date',
    select = 'select',
    multi_select = 'multi_select',
    user = 'user',
    url = 'url',
    email = 'email',
    rich_text = 'rich_text',
}

export interface BlockContent {
    position?: number;
    text?: string;
    format?: string;
    image?: string;
    requirements?: Requirement[];
}

export interface BlockCanvasProps {
    documentId: string;
    _useTanStackTables?: boolean;
    _useGlideTables?: boolean;
    triggerAssignIds?: number;
}

export interface BlockWithRequirements extends Block {
    requirements: Requirement[];
    order: number;
    project_id?: string;
    height?: number;
    columns?: Column[];
    name: string;
}

export enum BlockType {
    text = 'text',
    table = 'table',
}

export interface BlockProps {
    block: BlockWithRequirements;
    _isSelected?: boolean;
    onSelect?: (blockId: string) => void;
    onUpdate: (updates: Partial<BlockWithRequirements>) => void;
    onDelete?: () => void;
    properties?: Property[];
    dragActivators?: SyntheticListenerMap;
}

export interface BlockActionsProps {
    onDelete: () => void;
    isEditMode: boolean;
}

export interface UseBlockActionsProps {
    documentId: string;
    userProfile: Profile | null;
    blocks: BlockWithRequirements[] | undefined;
    setLocalBlocks: React.Dispatch<
        React.SetStateAction<BlockWithRequirements[]>
    >;
    orgId: string;
    projectId: string;
}

// Property interface aligned with CollaborativeTable
export interface Property {
    id: string;
    name: string;
    property_type: PropertyType;
    org_id: string;
    project_id: string | null;
    document_id: string | null;
    is_base: boolean | null;
    options: PropertyOptions | null;
    scope: string;
    created_at: string | null;
    updated_at: string | null;
}

// Property options interface aligned with CollaborativeTable
export interface PropertyOptions {
    values?: string[];
    default?: string | number | boolean | null;
    format?: string;
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
}

// Column interface aligned with CollaborativeTable
export interface Column {
    id: string;
    block_id: string | null;
    property_id: string;
    position: number;
    width: number | null;
    is_hidden: boolean | null;
    is_pinned: boolean | null;
    created_at: string | null;
    updated_at: string | null;
    default_value: string | null;
    property?: Property;
}

// Column creation data interface
export interface ColumnCreateData {
    block_id: string;
    property_id: string;
    position: number;
    width?: number | null;
    is_hidden?: boolean | null;
    is_pinned?: boolean | null;
}
