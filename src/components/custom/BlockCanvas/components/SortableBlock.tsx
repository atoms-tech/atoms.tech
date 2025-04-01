'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

import { BlockProps } from '@/components/custom/BlockCanvas/types';
import { cn } from '@/lib/utils';

import { TableBlock } from './TableBlock';
import { TextBlock } from './TextBlock';

export const SortableBlock: React.FC<BlockProps> = ({
    block,
    _isSelected,
    onSelect,
    onUpdate,
    onDelete,
    isEditMode,
    onDoubleClick,
    properties,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: block.id,
        transition: {
            duration: 200,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative' as const,
        zIndex: isDragging ? 999 : 'auto',
        willChange: isDragging ? 'transform' : 'auto',
        transformOrigin: 'center',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={cn(
                'relative group bg-background w-full max-w-full min-w-0',
                'rounded-lg',
                'border border-transparent',
                'transition-all duration-200 ease-out',
                isDragging && [
                    'shadow-lg shadow-accent/10',
                    'scale-[1.01]',
                    'cursor-grabbing',
                    'border-accent/20',
                    'backdrop-blur-[2px]',
                ],
                !isDragging && 'cursor-default',
            )}
            onDoubleClick={onDoubleClick}
        >
            {block.type === 'text' && (
                <TextBlock
                    block={block}
                    onUpdate={onUpdate}
                    _isSelected={_isSelected}
                    onSelect={onSelect}
                    isEditMode={isEditMode}
                    onDelete={onDelete}
                    onDoubleClick={onDoubleClick}
                    dragActivators={listeners}
                />
            )}
            {block.type === 'table' && (
                <TableBlock
                    block={block}
                    onUpdate={onUpdate}
                    _isSelected={_isSelected}
                    onSelect={onSelect}
                    isEditMode={isEditMode}
                    onDelete={onDelete}
                    onDoubleClick={onDoubleClick}
                    properties={properties}
                    dragActivators={listeners}
                />
            )}
        </div>
    );
};
