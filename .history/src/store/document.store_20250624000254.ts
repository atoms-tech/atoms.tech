// unstable_batchedUpdates is imported but not used yet - keeping for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { unstable_batchedUpdates } from 'react-dom';
import { create } from 'zustand';

import { Block, Document } from '@/types/base/documents.types';

// Table library types
export type TableLibraryType = 'default' | 'tanstack' | 'mantine' | 'material-ui';

interface DocumentState {
    currentDocument: Document | null;
    blocks: Block[];
    selectedBlockId: string | null;
    isEditMode: boolean;
    useTanStackTables: boolean; // Deprecated - kept for backward compatibility
    tableLibrary: TableLibraryType;

    // Document actions
    setCurrentDocument: (document: Document | null) => void;

    // Block actions
    setBlocks: (blocks: Block[]) => void;
    addBlock: (block: Block) => void;
    updateBlock: (blockId: string, content: Block['content']) => void;
    deleteBlock: (blockId: string) => void;
    moveBlock: (blockId: string, newPosition: number) => void;
    reorderBlocks: (blocks: Block[]) => void;
    setSelectedBlock: (blockId: string | null) => void;
    setIsEditMode: (isEditMode: boolean) => void;

    // Table implementation
    setUseTanStackTables: (useTanStackTables: boolean) => void; // Deprecated
    setTableLibrary: (library: TableLibraryType) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
    currentDocument: null,
    blocks: [],
    selectedBlockId: null,
    isEditMode: false,
    useTanStackTables: false, // Deprecated - kept for backward compatibility
    tableLibrary: 'default' as TableLibraryType,

    // Document actions
    setCurrentDocument: (document) => set({ currentDocument: document }),

    // Block actions
    setBlocks: (blocks) => {
        // Use setTimeout to ensure this update happens outside of the render cycle
        setTimeout(() => {
            set({ blocks });
        }, 0);
    },

    addBlock: (block) => {
        const blocks = get().blocks;
        set({ blocks: [...blocks, block] });
    },

    updateBlock: (blockId, content) => {
        const blocks = get().blocks;
        set({
            blocks: blocks.map((block) =>
                block.id === blockId
                    ? {
                          ...block,
                          content,
                          updated_at: new Date().toISOString(),
                      }
                    : block,
            ),
        });
    },

    deleteBlock: (blockId) => {
        const blocks = get().blocks;
        set({
            blocks: blocks.filter((block) => block.id !== blockId),
        });
    },

    moveBlock: (blockId, newPosition) => {
        const blocks = get().blocks;
        const blockIndex = blocks.findIndex((block) => block.id === blockId);
        if (blockIndex === -1) return;

        const block = blocks[blockIndex];
        const newBlocks = [...blocks];
        newBlocks.splice(blockIndex, 1);
        newBlocks.splice(newPosition, 0, block);

        // Update positions for all blocks
        const updatedBlocks = newBlocks.map((block, index) => ({
            ...block,
            position: index,
            updated_at: new Date().toISOString(),
        }));

        set({ blocks: updatedBlocks });
    },

    reorderBlocks: (blocks) => {
        // Update positions for all blocks
        const updatedBlocks = blocks.map((block, index) => ({
            ...block,
            position: index,
            updated_at: new Date().toISOString(),
        }));

        set({ blocks: updatedBlocks });
    },

    setSelectedBlock: (blockId) => set({ selectedBlockId: blockId }),

    setIsEditMode: (isEditMode) => set({ isEditMode }),

    // Table implementation
    setUseTanStackTables: (useTanStackTables) => set({ useTanStackTables }),
}));
