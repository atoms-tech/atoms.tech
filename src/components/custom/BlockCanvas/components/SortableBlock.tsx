'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockProps } from '../types';
import { TextBlock } from './TextBlock';
import { TableBlock } from './TableBlock';
import { BlockActions } from './BlockActions';
import { cn } from '@/lib/utils';

export const SortableBlock: React.FC<BlockProps> = ({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  isEditMode,
  onDoubleClick,
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
        'relative group bg-background',
        'hover:bg-accent/5 rounded-lg',
        'border border-transparent',
        'transition-all duration-200 ease-out',
        isSelected && 'bg-accent/10',
        isDragging && [
          'shadow-lg shadow-accent/10',
          'scale-[1.01]',
          'bg-accent/5',
          'cursor-grabbing',
          'border-accent/20',
          'backdrop-blur-[2px]',
        ],
        !isDragging && 'cursor-default'
      )}
      onDoubleClick={onDoubleClick}
    >
      <BlockActions
        onDelete={() => onDelete?.()}
        isEditMode={isEditMode ?? false}
        dragActivators={listeners}
      />
      {block.type === 'text' && (
        <TextBlock
          block={block}
          onUpdate={onUpdate}
          isSelected={isSelected}
          onSelect={onSelect}
          isEditMode={isEditMode}
          onDelete={onDelete}
          onDoubleClick={onDoubleClick}
        />
      )}
      {block.type === 'table' && (
        <TableBlock
          block={block}
          onUpdate={onUpdate}
          isSelected={isSelected}
          onSelect={onSelect}
          isEditMode={isEditMode}
          onDelete={onDelete}
          onDoubleClick={onDoubleClick}
        />
      )}
    </div>
  );
}; 