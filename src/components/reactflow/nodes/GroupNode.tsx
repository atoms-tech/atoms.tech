'use client';

import React, { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BaseNodeData, CustomNodeProps } from '@/types/react-flow.types';
import { cn } from '@/lib/utils';

const GroupNode: React.FC<CustomNodeProps<BaseNodeData>> = memo(({
  id, data, selected, onEditNode, isCollaborating = false, collaborators = []
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={cn('relative min-w-[300px] min-h-[200px]', selected && 'ring-2 ring-gray-500 ring-offset-2')}
         onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      
      <Card className="shadow-md hover:shadow-lg transition-shadow bg-gray-50 border-gray-300 border-dashed w-full h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📁</span>
              <h3 className="font-semibold text-sm text-gray-700">{data.label}</h3>
            </div>
            <span className="text-xs text-gray-500 font-semibold">GROUP</span>
          </div>
        </CardHeader>

        <CardContent className="pt-0 h-full">
          <div className="space-y-2">
            {data.description && <p className="text-xs text-gray-600">{data.description}</p>}
            <div className="text-xs text-gray-500 italic">Drag nodes here to group them</div>
          </div>

          {isHovered && (
            <div className="absolute top-2 right-2">
              <Button size="sm" variant="outline" className="h-6 px-2 text-xs border-gray-400 text-gray-700 hover:bg-gray-200"
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

GroupNode.displayName = 'GroupNode';
export default GroupNode;
