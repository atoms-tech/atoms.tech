// unstable_batchedUpdates is imported but not used yet - keeping for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { unstable_batchedUpdates } from 'react-dom';
import { create } from 'zustand';

import { Block, Document } from '@/types/base/documents.types';

// Presence tracking for concurrent editing
export interface UserPresence {
    userId: string;
    userName: string;
    userEmail?: string;
    onlineAt: string;
    editingCell?: {
        blockId: string;
        rowId: string;
        columnId: string;
    } | null;
    cursorPosition?: {
        blockId: string;
        rowIndex: number;
        colIndex: number;
    } | null;
}

// Real-time cell update for immediate display (before DB save)
export interface CellUpdate {
    blockId: string;
    rowId: string;
    columnId: string;
    value: unknown;
    userId: string;
    timestamp: number;
}

interface DocumentState {
    currentDocument: Document | null;
    blocks: Block[];
    selectedBlockId: string | null;
    isEditMode: boolean;
    useTanStackTables: boolean;
    useGlideTables: boolean;

    // Presence state for concurrent editing
    activeUsers: Map<string, UserPresence>;
    pendingCellUpdates: Map<string, CellUpdate>; // key: `${blockId}:${rowId}:${columnId}`

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
    setUseTanStackTables: (useTanStackTables: boolean) => void;
    setUseGlideTables: (useGlideTables: boolean) => void;

    // Presence actions
    setActiveUsers: (users: Map<string, UserPresence>) => void;
    updateUserPresence: (userId: string, presence: Partial<UserPresence>) => void;
    removeUser: (userId: string) => void;

    // Real-time cell updates
    setPendingCellUpdate: (
        blockId: string,
        rowId: string,
        columnId: string,
        value: unknown,
        userId: string,
    ) => void;
    removePendingCellUpdate: (blockId: string, rowId: string, columnId: string) => void;
    getPendingCellUpdate: (
        blockId: string,
        rowId: string,
        columnId: string,
    ) => CellUpdate | undefined;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
    currentDocument: null,
    blocks: [],
    selectedBlockId: null,
    isEditMode: false,
    useTanStackTables: false,
    useGlideTables: false,
    activeUsers: new Map(),
    pendingCellUpdates: new Map(),

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

    // Table implementation(s)
    setUseTanStackTables: (useTanStackTables) => set({ useTanStackTables }),
    setUseGlideTables: (useGlideTables) => set({ useGlideTables }),

    // Presence actions
    setActiveUsers: (users) => set({ activeUsers: new Map(users) }),

    updateUserPresence: (userId, presence) => {
        const currentUsers = get().activeUsers;
        const existingPresence = currentUsers.get(userId);
        const updatedPresence = existingPresence
            ? { ...existingPresence, ...presence }
            : ({
                  userId,
                  userName: presence.userName || 'Unknown',
                  onlineAt: new Date().toISOString(),
                  ...presence,
              } as UserPresence);

        const newUsers = new Map(currentUsers);
        newUsers.set(userId, updatedPresence);
        set({ activeUsers: newUsers });
    },

    removeUser: (userId) => {
        const currentUsers = get().activeUsers;
        const newUsers = new Map(currentUsers);
        newUsers.delete(userId);
        set({ activeUsers: newUsers });
    },

    // Real-time cell updates
    setPendingCellUpdate: (blockId, rowId, columnId, value, userId) => {
        const key = `${blockId}:${rowId}:${columnId}`;
        const currentUpdates = get().pendingCellUpdates;
        const newUpdates = new Map(currentUpdates);
        newUpdates.set(key, {
            blockId,
            rowId,
            columnId,
            value,
            userId,
            timestamp: Date.now(),
        });
        set({ pendingCellUpdates: newUpdates });
    },

    removePendingCellUpdate: (blockId, rowId, columnId) => {
        const key = `${blockId}:${rowId}:${columnId}`;
        const currentUpdates = get().pendingCellUpdates;
        const newUpdates = new Map(currentUpdates);
        newUpdates.delete(key);
        set({ pendingCellUpdates: newUpdates });
    },

    getPendingCellUpdate: (blockId, rowId, columnId) => {
        const key = `${blockId}:${rowId}:${columnId}`;
        return get().pendingCellUpdates.get(key);
    },
}));
