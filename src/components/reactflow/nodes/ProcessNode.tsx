'use client';

import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ProcessNodeData, 
  CustomNodeProps 
} from '@/types/react-flow.types';
import { useDiagramElementLinks } from '@/hooks/queries/useDiagramElementLinks';
import { cn } from '@/lib/utils';

interface ProcessNodeProps extends CustomNodeProps<ProcessNodeData> {}

const ProcessNode: React.FC<ProcessNodeProps> = memo(({
  id,
  data,
  selected,
  onLinkToRequirement,
  onEditNode,
  onDeleteNode,
  isCollaborating = false,
  collaborators = [],
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { data: links } = useDiagramElementLinks(id);

  // Process type styling
  const getProcessStyle = (processType: string) => {
    switch (processType) {
      case 'start':
        return {
          shape: 'rounded-full',
          color: 'bg-green-500 text-white',
          icon: '▶️',
        };
      case 'end':
        return {
          shape: 'rounded-full',
          color: 'bg-red-500 text-white',
          icon: '⏹️',
        };
      case 'task':
        return {
          shape: 'rounded-lg',
          color: 'bg-blue-500 text-white',
          icon: '⚙️',
        };
      case 'subprocess':
        return {
          shape: 'rounded-lg border-2 border-dashed',
          color: 'bg-purple-500 text-white',
          icon: '📦',
        };
      default:
        return {
          shape: 'rounded-lg',
          color: 'bg-gray-500 text-white',
          icon: '📋',
        };
    }
  };

  const processStyle = getProcessStyle(data.processType);
  const hasLinks = links && links.length > 0;

  // Handle positions based on process type
  const getHandlePositions = (processType: string) => {
    switch (processType) {
      case 'start':
        return { target: false, source: true };
      case 'end':
        return { target: true, source: false };
      default:
        return { target: true, source: true };
    }
  };

  const handlePositions = getHandlePositions(data.processType);

  return (
    <div
      className={cn(
        'relative min-w-[200px] max-w-[300px]',
        selected && 'ring-2 ring-blue-500 ring-offset-2',
        isHovered && 'shadow-lg',
        hasLinks && 'ring-1 ring-blue-300'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection Handles */}
      {handlePositions.target && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 !bg-blue-500 border-2 border-white"
          />
          <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3 !bg-blue-500 border-2 border-white"
          />
        </>
      )}
      
      {handlePositions.source && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-blue-500 border-2 border-white"
          />
          <Handle
            type="source"
            position={Position.Right}
            className="w-3 h-3 !bg-blue-500 border-2 border-white"
          />
        </>
      )}

      <Card className={cn(
        'shadow-md hover:shadow-lg transition-shadow',
        processStyle.shape,
        data.processType === 'start' || data.processType === 'end' ? 'aspect-square w-24 h-24' : ''
      )}>
        <CardContent className={cn(
          'p-3 h-full flex flex-col justify-center',
          processStyle.color,
          processStyle.shape
        )}>
          <div className="space-y-2 text-center">
            {/* Icon */}
            <div className="text-lg">
              {processStyle.icon}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-sm leading-tight">
              {data.label}
            </h3>

            {/* Process Type Badge */}
            {data.processType !== 'start' && data.processType !== 'end' && (
              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                {data.processType.replace('_', ' ').toUpperCase()}
              </Badge>
            )}

            {/* Duration */}
            {data.duration && (
              <div className="text-xs opacity-90">
                ⏱️ {data.duration}min
              </div>
            )}

            {/* Assignee */}
            {data.assignee && (
              <div className="text-xs opacity-90">
                👤 {data.assignee}
              </div>
            )}

            {/* Description */}
            {data.description && data.processType !== 'start' && data.processType !== 'end' && (
              <p className="text-xs opacity-90 line-clamp-2">
                {data.description}
              </p>
            )}

            {/* Links Indicator */}
            {hasLinks && (
              <div className="flex items-center justify-center gap-1 text-xs">
                <span>🔗</span>
                <span>{links.length}</span>
              </div>
            )}
          </div>

          {/* Hover Actions */}
          {isHovered && data.processType !== 'start' && data.processType !== 'end' && (
            <div className="mt-2 flex gap-1 justify-center">
              <Button
                size="sm"
                variant="secondary"
                className="h-6 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => onLinkToRequirement?.(id)}
              >
                🔗
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-6 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => onEditNode?.(id, data)}
              >
                ✏️
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collaboration Indicators */}
      {isCollaborating && collaborators.length > 0 && (
        <div className="absolute -top-2 -right-2 flex -space-x-1">
          {collaborators.slice(0, 3).map((collaborator, index) => (
            <div
              key={collaborator.id}
              className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: collaborator.color }}
              title={collaborator.name}
            >
              {collaborator.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {collaborators.length > 3 && (
            <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs font-bold text-white">
              +{collaborators.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Link Indicator */}
      {hasLinks && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white">
          <div className="w-full h-full bg-blue-400 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
});

ProcessNode.displayName = 'ProcessNode';

export default ProcessNode;
