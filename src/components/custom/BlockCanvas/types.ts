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
