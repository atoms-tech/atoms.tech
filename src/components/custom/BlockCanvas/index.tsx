'use client';

import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    defaultDropAnimation,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Table, Type } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import { SortableBlock } from '@/components/custom/BlockCanvas/components/SortableBlock';
import { TableBlockLoadingState } from '@/components/custom/BlockCanvas/components/TableBlockLoadingState';
import { useBlockActions } from '@/components/custom/BlockCanvas/hooks/useBlockActions';
import {
    BlockCanvasProps,
    BlockType,
    BlockWithRequirements,
    // Unused but might be needed in the future
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Property,
} from '@/components/custom/BlockCanvas/types';
import { Button } from '@/components/ui/button';
import { useDocumentRealtime } from '@/hooks/queries/useDocumentRealtime';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useDocumentStore } from '@/lib/store/document.store';
import { Block } from '@/types';
// Unused but might be needed in the future
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Json } from '@/types/base/database.types';

const dropAnimationConfig = {
    ...defaultDropAnimation,
    dragSourceOpacity: 0.5,
};

export function BlockCanvas({ documentId }: BlockCanvasProps) {
    const {
        blocks: originalBlocks,
        loading,
        error,
        setDocument,
        blocks,
    } = useDocumentRealtime({
        documentId,
        _orgId: '',
        _projectId: '',
        _userProfile: null,
    });
    const { reorderBlocks, isEditMode, setIsEditMode } = useDocumentStore();
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const { userProfile } = useAuth();
    const { currentOrganization } = useOrganization();
    const params = useParams();

    // Get org_id and project_id from URL params for new blocks
    const orgId = currentOrganization?.id as string;
    const projectId = params?.projectId as string;

    // Add order property to each block if it doesn't exist
    const [enhancedBlocks, setEnhancedBlocks] = useState<
        BlockWithRequirements[]
    >([]);

    // Adapt the blocks to include order property
    useEffect(() => {
        if (originalBlocks) {
            const blocksWithOrder = originalBlocks.map(
                (block: BlockWithRequirements, index: number) => {
                    // Create a new object with all required properties
                    const enhancedBlock = {
                        ...block,
                        order: block.position || index, // Use position as order or fallback to index
                    } as BlockWithRequirements;

                    return enhancedBlock;
                },
            );
            setEnhancedBlocks(blocksWithOrder);
        }
    }, [originalBlocks, orgId, projectId]);

    // Wrapper for setLocalBlocks that adds order
    const setEnhancedLocalBlocks = useCallback(
        (updater: React.SetStateAction<BlockWithRequirements[]>) => {
            const processBlocks = (
                blocks: BlockWithRequirements[],
            ): BlockWithRequirements[] => {
                return blocks.map(
                    (block: BlockWithRequirements, index: number) =>
                        ({
                            ...block,
                            order: index,
                        }) as BlockWithRequirements,
                );
            };

            if (typeof updater === 'function') {
                const prevBlocks = blocks || [];
                const newBlocks = updater(prevBlocks);
                setDocument(processBlocks(newBlocks));
            } else {
                setDocument(processBlocks(updater));
            }
        },
        [setDocument, blocks],
    );

    const {
        handleAddBlock,
        handleUpdateBlock,
        handleDeleteBlock,
        handleReorder,
        _createDefaultBlockProperties,
    } = useBlockActions({
        documentId,
        userProfile,
        blocks: enhancedBlocks,
        setLocalBlocks: setEnhancedLocalBlocks,
        orgId,
        projectId,
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const renderBlock = useCallback(
        (block: BlockWithRequirements) => {
            const isSelected = block.id === selectedBlockId;

            return (
                <SortableBlock
                    key={block.id}
                    block={block}
                    isSelected={isSelected}
                    isEditMode={isEditMode}
                    onSelect={() => setSelectedBlockId(block.id)}
                    onUpdate={(content) => handleUpdateBlock(block.id, content)}
                    onDelete={() => handleDeleteBlock(block.id)}
                    onDoubleClick={() => {
                        setSelectedBlockId(block.id);
                        setIsEditMode(true);
                    }}
                />
            );
        },
        [
            selectedBlockId,
            isEditMode,
            handleUpdateBlock,
            handleDeleteBlock,
            setIsEditMode,
        ],
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;

        if (!over || active.id === over.id || !enhancedBlocks) {
            return;
        }

        const oldIndex = enhancedBlocks.findIndex(
            (block) => block.id === active.id,
        );
        const newIndex = enhancedBlocks.findIndex(
            (block) => block.id === over.id,
        );

        if (oldIndex !== -1 && newIndex !== -1) {
            const newBlocks = arrayMove(enhancedBlocks, oldIndex, newIndex).map(
                (block: BlockWithRequirements, index: number) => ({
                    ...block,
                    position: index,
                    order: index, // Ensure order is set
                }),
            );

            // Update local state immediately for smooth UI
            setEnhancedLocalBlocks(newBlocks);

            // Update document store
            reorderBlocks(newBlocks as Block[]);

            // Trigger server update
            handleReorder(newBlocks);
        }
    };

    // Don't render blocks until they're loaded
    if (loading) {
        return (
            <div className="relative min-h-[500px] space-y-4">
                <TableBlockLoadingState
                    isLoading={true}
                    isError={false}
                    error={null}
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="relative min-h-[500px] space-y-4">
                <TableBlockLoadingState
                    isLoading={false}
                    isError={true}
                    error={error}
                />
            </div>
        );
    }

    // Get active block with order property
    const activeBlock = enhancedBlocks?.find(
        (block: BlockWithRequirements) => block.id === activeId,
    );

    return (
        <div className="relative min-h-[500px] space-y-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={
                        enhancedBlocks?.map(
                            (block: BlockWithRequirements) => block.id,
                        ) || []
                    }
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {enhancedBlocks?.map((block: BlockWithRequirements) =>
                            renderBlock(block),
                        )}
                    </div>
                </SortableContext>

                <DragOverlay dropAnimation={dropAnimationConfig}>
                    {activeId && activeBlock ? (
                        <div className="opacity-100 w-full pointer-events-none">
                            <SortableBlock
                                block={activeBlock}
                                isSelected={false}
                                isEditMode={isEditMode}
                                onSelect={() => {}}
                                onUpdate={() => {}}
                                onDelete={() => {}}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {!isEditMode && (
                <div className="flex gap-2 mt-4 z-10 relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            handleAddBlock(BlockType.text, {
                                format: 'markdown',
                                text: '',
                            })
                        }
                    >
                        <Type className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            handleAddBlock(BlockType.table, {
                                requirements: [],
                            })
                        }
                    >
                        <Table className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
