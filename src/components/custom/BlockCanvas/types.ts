import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';

import { Json } from '@/types/base/database.types';
import { Block } from '@/types/base/documents.types';
import { Profile } from '@/types/base/profiles.types';
import { Requirement } from '@/types/base/requirements.types';

export interface BlockContent {
    position?: number;
    text?: string;
    format?: string;
    image?: string;
    requirements?: Requirement[];
    property_schemas?: BlockPropertySchema[];
}

export interface BlockCanvasProps {
    documentId: string;
}

export interface BlockWithRequirements extends Block {
    requirements: Requirement[];
}

export interface BlockProps {
    block: BlockWithRequirements;
    onUpdate: (content: Json) => void;
    isSelected?: boolean;
    onSelect?: () => void;
    isEditMode?: boolean;
    onDelete?: () => void;
    onDoubleClick?: () => void;
}

export interface BlockActionsProps {
    onDelete: () => void;
    isEditMode: boolean;
    dragActivators?: SyntheticListenerMap;
}

export type BlockType = 'text' | 'table';

export interface UseBlockActionsProps {
    documentId: string;
    userProfile: Profile | null;
    blocks: BlockWithRequirements[] | undefined;
    setLocalBlocks: React.Dispatch<
        React.SetStateAction<BlockWithRequirements[]>
    >;
}

export interface PropertySchema {
    id: string;
    name: string;
    data_type: string;
    created_at?: string | null;
    updated_at?: string | null;
    created_by?: string | null;
    updated_by?: string | null;
    version?: number;
    is_deleted?: boolean;
    deleted_at?: string | null;
    deleted_by?: string | null;
}

export interface DocumentPropertySchema extends PropertySchema {
    document_id: string;
}

export interface BlockPropertySchema extends PropertySchema {
    block_id: string;
}

export interface PropertyKeyValue {
    id: string;
    block_id: string;
    requirement_id: string;
    property_name: string;
    property_value: string;
    position: number;
    created_at?: string | null;
    updated_at?: string | null;
    created_by?: string | null;
    updated_by?: string | null;
    version?: number;
    is_deleted?: boolean | null;
    deleted_at?: string | null;
    deleted_by?: string | null;
}
