'use client';

import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BaseNodeData, CustomNodeProps } from '@/types/react-flow.types';
import { cn } from '@/lib/utils';

const NoteNode: React.FC<CustomNodeProps<BaseNodeData>> = memo(({
  id, data, selected, onEditNode, isCollaborating = false, collaborators = []
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={cn('relative min-w-[150px] max-w-[250px]', selected && 'ring-2 ring-yellow-500 ring-offset-2')}
         onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-yellow-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-yellow-500 border-2 border-white" />

      <Card className="shadow-md hover:shadow-lg transition-shadow bg-yellow-100 border-yellow-300 border-dashed">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <span className="text-xs text-yellow-700 font-semibold">NOTE</span>
            </div>
            <h3 className="font-semibold text-sm leading-tight text-yellow-800">{data.label}</h3>
            {data.description && <p className="text-xs text-yellow-700 line-clamp-3">{data.description}</p>}
          </div>

          {isHovered && (
            <div className="mt-3 flex gap-1">
              <Button size="sm" variant="outline" className="h-6 px-2 text-xs border-yellow-400 text-yellow-700 hover:bg-yellow-200"
                      onClick={() => onEditNode?.(id, data)}>✏️ Edit</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isCollaborating && collaborators.length > 0 && (
        <div className="absolute -top-2 -right-2 flex -space-x-1">
          {collaborators.slice(0, 3).map((collaborator) => (
            <div key={collaborator.id} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                 style={{ backgroundColor: collaborator.color }} title={collaborator.name}>
              {collaborator.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

NoteNode.displayName = 'NoteNode';
export default NoteNode;
