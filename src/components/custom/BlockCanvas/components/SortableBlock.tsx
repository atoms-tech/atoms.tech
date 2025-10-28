'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import React from 'react';

import { BlockProps } from '@/components/custom/BlockCanvas/types';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store/document.store';

import { TableBlock } from './TableBlock';
import { TextBlock } from './TextBlock';

export const SortableBlock: React.FC<BlockProps> = ({
    block,
    isOver,
    linePosition,
    onUpdate,
    onDelete,
    properties,
    userProfile,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({
            id: block.id,
        });

    // Removes scaling to prevent unequal sized block from stretching to fit
    const adjustedTransform = transform ? { ...transform, scaleX: 1, scaleY: 1 } : null;

    const style = {
        transform: isDragging ? CSS.Transform.toString(adjustedTransform) : undefined,
        transition,
        position: 'relative' as const,
        zIndex: isDragging ? 999 : 'auto',
        willChange: isDragging ? 'transform' : 'auto',
        transformOrigin: 'center',
    };

    const { isEditMode } = useDocumentStore();

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={cn(
                'relative group bg-background w-full max-w-full min-w-0 p-2',
                'flex space-x-2',
                'rounded-lg',
                'border border-transparent',
                isDragging && [
                    'opacity-50',
                    'shadow-lg shadow-accent/10',
                    'scale-[1.01]',
                    'cursor-grabbing',
                    'border-border',
                    'backdrop-blur-[2px]',
                ],
                !isDragging && 'cursor-default',
            )}
        >
            <div
                className={`absolute top-0 left-1/2 w-1/2 h-[2px] bg-blue-500 -translate-x-1/2 ${isOver && linePosition === 'top' ? 'visible' : 'invisible'}`}
            />
            <div
                className={`absolute bottom-0 left-1/2 w-1/2 h-[2px] bg-blue-500 -translate-x-1/2 ${isOver && linePosition === 'bottom' ? 'visible' : 'invisible'}`}
            />
            {isEditMode && (
                <div className="flex flex-col gap-2">
                    <div {...listeners} className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.();
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            )}
            {block.type === 'text' && (
                <TextBlock
                    block={block}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    dragActivators={listeners}
                />
            )}
            {block.type === 'table' && (
                <TableBlock
                    block={block}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    properties={properties}
                    dragActivators={listeners}
                    userProfile={userProfile}
                />
            )}
        </div>
    );
};
