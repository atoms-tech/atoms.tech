'use client';

import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SystemNodeData, CustomNodeProps } from '@/types/react-flow.types';
import { useDiagramElementLinks } from '@/hooks/queries/useDiagramElementLinks';
import { cn } from '@/lib/utils';

const SystemNode: React.FC<CustomNodeProps<SystemNodeData>> = memo(({
  id, data, selected, onLinkToRequirement, onEditNode, isCollaborating = false, collaborators = []
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { data: links } = useDiagramElementLinks(id);

  const getSystemIcon = (type: string) => {
    switch (type) {
      case 'internal': return '🏠';
      case 'external': return '🌐';
      case 'database': return '🗄️';
      case 'service': return '⚙️';
      default: return '💻';
    }
  };

  const getSystemColor = (type: string) => {
    switch (type) {
      case 'internal': return 'bg-green-500 text-white border-green-600';
      case 'external': return 'bg-red-500 text-white border-red-600';
      case 'database': return 'bg-yellow-500 text-black border-yellow-600';
      case 'service': return 'bg-purple-500 text-white border-purple-600';
      default: return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const hasLinks = links && links.length > 0;

  return (
    <div className={cn('relative min-w-[200px] max-w-[280px]', selected && 'ring-2 ring-blue-500 ring-offset-2', hasLinks && 'ring-1 ring-blue-300')}
         onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gray-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-gray-500 border-2 border-white" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-gray-500 border-2 border-white" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-gray-500 border-2 border-white" />

      <Card className={cn('shadow-md hover:shadow-lg transition-shadow border-2', getSystemColor(data.systemType))}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getSystemIcon(data.systemType)}</span>
              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                {data.systemType.toUpperCase()}
              </Badge>
            </div>
            {data.technology && (
              <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/30">
                {data.technology}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm leading-tight">{data.label}</h3>
            {data.description && <p className="text-xs opacity-90 line-clamp-2">{data.description}</p>}
            {hasLinks && (
              <div className="flex items-center gap-1 text-xs">
                <span>🔗</span><span>{links.length} link{links.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {isHovered && (
            <div className="mt-3 flex gap-1">
              <Button size="sm" variant="secondary" className="h-6 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
                      onClick={() => onLinkToRequirement?.(id)}>🔗 Link</Button>
              <Button size="sm" variant="secondary" className="h-6 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
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

      {hasLinks && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-500 rounded-full border border-white">
          <div className="w-full h-full bg-gray-400 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
});

SystemNode.displayName = 'SystemNode';
export default SystemNode;
