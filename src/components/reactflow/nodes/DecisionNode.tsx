'use client';

import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { 
  DecisionNodeData, 
  CustomNodeProps 
} from '@/types/react-flow.types';
import { useDiagramElementLinks } from '@/hooks/queries/useDiagramElementLinks';
import { cn } from '@/lib/utils';

interface DecisionNodeProps extends CustomNodeProps<DecisionNodeData> {}

const DecisionNode: React.FC<DecisionNodeProps> = memo(({
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

  const hasLinks = links && links.length > 0;

  return (
    <div
      className={cn(
        'relative',
        selected && 'ring-2 ring-blue-500 ring-offset-2',
        isHovered && 'shadow-lg',
        hasLinks && 'ring-1 ring-blue-300'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-orange-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 !bg-green-500 border-2 border-white"
        style={{ left: '25%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 !bg-red-500 border-2 border-white"
        style={{ left: '75%' }}
      />

      {/* Diamond Shape */}
      <div className="relative w-32 h-32">
        <div className={cn(
          'absolute inset-0 transform rotate-45 bg-orange-500 shadow-md hover:shadow-lg transition-shadow',
          'flex items-center justify-center'
        )}>
          <div className="transform -rotate-45 text-center p-2 text-white">
            {/* Icon */}
            <div className="text-lg mb-1">❓</div>
            
            {/* Title */}
            <h3 className="font-semibold text-xs leading-tight line-clamp-2">
              {data.label}
            </h3>
            
            {/* Condition */}
            {data.condition && (
              <p className="text-xs opacity-90 mt-1 line-clamp-1">
                {data.condition}
              </p>
            )}

            {/* Links Indicator */}
            {hasLinks && (
              <div className="flex items-center justify-center gap-1 text-xs mt-1">
                <span>🔗</span>
                <span>{links.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* True/False Labels */}
        <div className="absolute -bottom-6 left-0 text-xs text-green-600 font-semibold">
          {data.trueLabel || 'Yes'}
        </div>
        <div className="absolute -bottom-6 right-0 text-xs text-red-600 font-semibold">
          {data.falseLabel || 'No'}
        </div>

        {/* Hover Actions */}
        {isHovered && (
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs"
              onClick={() => onLinkToRequirement?.(id)}
            >
              🔗
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 text-xs"
              onClick={() => onEditNode?.(id, data)}
            >
              ✏️
            </Button>
          </div>
        )}
      </div>

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

DecisionNode.displayName = 'DecisionNode';

export default DecisionNode;
