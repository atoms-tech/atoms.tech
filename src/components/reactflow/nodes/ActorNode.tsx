'use client';

import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ActorNodeData, CustomNodeProps } from '@/types/react-flow.types';
import { useDiagramElementLinks } from '@/hooks/queries/useDiagramElementLinks';
import { cn } from '@/lib/utils';

const ActorNode: React.FC<CustomNodeProps<ActorNodeData>> = memo(({
  id, data, selected, onLinkToRequirement, onEditNode, isCollaborating = false, collaborators = []
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { data: links } = useDiagramElementLinks(id);

  const getActorIcon = (type: string) => {
    switch (type) {
      case 'user': return '👤';
      case 'system': return '🤖';
      case 'external': return '🌐';
      default: return '👥';
    }
  };

  const getActorColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-500 text-white';
      case 'system': return 'bg-gray-500 text-white';
      case 'external': return 'bg-orange-500 text-white';
      default: return 'bg-indigo-500 text-white';
    }
  };

  const hasLinks = links && links.length > 0;

  return (
    <div className={cn('relative min-w-[150px] max-w-[200px]', selected && 'ring-2 ring-blue-500 ring-offset-2', hasLinks && 'ring-1 ring-blue-300')}
         onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-indigo-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-indigo-500 border-2 border-white" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-indigo-500 border-2 border-white" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-indigo-500 border-2 border-white" />

      <Card className={cn('shadow-md hover:shadow-lg transition-shadow', getActorColor(data.actorType))}>
        <CardContent className="p-3 text-center">
          <div className="space-y-2">
            <div className="text-2xl">{getActorIcon(data.actorType)}</div>
            <h3 className="font-semibold text-sm leading-tight">{data.label}</h3>
            <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
              {data.actorType.toUpperCase()}
            </Badge>
            {data.role && <div className="text-xs opacity-90">Role: {data.role}</div>}
            {data.description && <p className="text-xs opacity-90 line-clamp-2">{data.description}</p>}
            {hasLinks && (
              <div className="flex items-center justify-center gap-1 text-xs">
                <span>🔗</span><span>{links.length}</span>
              </div>
            )}
          </div>

          {isHovered && (
            <div className="mt-2 flex gap-1 justify-center">
              <Button size="sm" variant="secondary" className="h-6 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
                      onClick={() => onLinkToRequirement?.(id)}>🔗</Button>
              <Button size="sm" variant="secondary" className="h-6 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
                      onClick={() => onEditNode?.(id, data)}>✏️</Button>
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

      {hasLinks && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border border-white">
          <div className="w-full h-full bg-indigo-400 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
});

ActorNode.displayName = 'ActorNode';
export default ActorNode;
