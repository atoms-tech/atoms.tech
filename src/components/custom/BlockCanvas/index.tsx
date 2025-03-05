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
import React, { useCallback, useState } from 'react';

import { SortableBlock } from '@/components/custom/BlockCanvas/components/SortableBlock';
import { useBlockActions } from '@/components/custom/BlockCanvas/hooks/useBlockActions';
import {
    BlockCanvasProps,
    BlockWithRequirements,
} from '@/components/custom/BlockCanvas/types';
import { Button } from '@/components/ui/button';
import { useDocumentRealtime } from '@/hooks/queries/useDocumentRealtime';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentStore } from '@/lib/store/document.store';

const dropAnimationConfig = {
    ...defaultDropAnimation,
    dragSourceOpacity: 0.5,
};

export function BlockCanvas({ documentId }: BlockCanvasProps) {
    const { blocks, isLoading, setLocalBlocks } =
        useDocumentRealtime(documentId);
    const { reorderBlocks, isEditMode, setIsEditMode } = useDocumentStore();
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const { userProfile } = useAuth();
    const {
        handleAddBlock,
        handleUpdateBlock,
        handleDeleteBlock,
        handleReorder,
    } = useBlockActions({
        documentId,
        userProfile,
        blocks,
        setLocalBlocks,
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

        if (!over || active.id === over.id || !blocks) {
            return;
        }

        const oldIndex = blocks.findIndex((block) => block.id === active.id);
        const newIndex = blocks.findIndex((block) => block.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newBlocks = arrayMove(blocks, oldIndex, newIndex).map(
                (block, index) => ({
                    ...block,
                    position: index,
                }),
            );

            // Update local state immediately for smooth UI
            setLocalBlocks(newBlocks);

            // Update document store
            reorderBlocks(newBlocks);

            // Trigger server update
            handleReorder(newBlocks);
        }
    };

    // Don't render blocks until they're loaded
    if (isLoading) {
        return (
            <div className="relative min-h-[500px] space-y-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-24 bg-muted rounded-lg" />
                    <div className="h-24 bg-muted rounded-lg" />
                </div>
            </div>
        );
    }

    const activeBlock = blocks?.find((block) => block.id === activeId);

    return (
        <div className="relative min-h-[500px] space-y-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={blocks?.map((block) => block.id) || []}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-4">
                        {blocks?.map((block) => renderBlock(block))}
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
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            handleAddBlock('text', {
                                format: 'markdown',
                                text: '',
                            })
                        }
                        className="gap-2 cursor-pointer"
                    >
                        <Type className="h-4 w-4" />
                        Add Text
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            handleAddBlock('table', { requirements: [] })
                        }
                        className="gap-2 cursor-pointer"
                    >
                        <Table className="h-4 w-4" />
                        Add Requirements Table
                    </Button>
                </div>
            )}
        </div>
    );
}
