'use client';

import React, { memo, useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  RequirementNodeData, 
  CustomNodeProps 
} from '@/types/react-flow.types';
import { useDiagramElementLinks } from '@/hooks/queries/useDiagramElementLinks';
import { cn } from '@/lib/utils';

interface RequirementNodeProps extends CustomNodeProps<RequirementNodeData> {}

const RequirementNode: React.FC<RequirementNodeProps> = memo(({
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
  const { data: links, isLoading: linksLoading } = useDiagramElementLinks(id);

  // Priority colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Type icons
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'functional': return '⚙️';
      case 'non_functional': return '📊';
      case 'constraint': return '🔒';
      default: return '📋';
    }
  };

  const hasLinks = links && links.length > 0;

  return (
    <div
      className={cn(
        'relative min-w-[250px] max-w-[350px]',
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
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />

      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getTypeIcon(data.type)}</span>
              <div className="flex flex-col">
                <Badge 
                  variant="outline" 
                  className={cn('text-xs', getPriorityColor(data.priority))}
                >
                  {data.priority.toUpperCase()}
                </Badge>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={cn('text-xs', getStatusColor(data.status))}
            >
              {data.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-2">
            {/* Requirement ID */}
            <div className="text-xs text-gray-500 font-mono">
              {data.requirementId}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">
              {data.label}
            </h3>

            {/* Description */}
            {data.description && (
              <p className="text-xs text-gray-600 line-clamp-3">
                {data.description}
              </p>
            )}

            {/* Links Indicator */}
            {hasLinks && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <span>🔗</span>
                <span>{links.length} link{links.length > 1 ? 's' : ''}</span>
              </div>
            )}

            {/* Metadata */}
            {data.metadata && Object.keys(data.metadata).length > 0 && (
              <div className="text-xs text-gray-500">
                <span>+{Object.keys(data.metadata).length} properties</span>
              </div>
            )}
          </div>

          {/* Hover Actions */}
          {isHovered && !linksLoading && (
            <div className="mt-3 flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => onLinkToRequirement?.(id)}
              >
                🔗 Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                onClick={() => onEditNode?.(id, data)}
              >
                ✏️ Edit
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

RequirementNode.displayName = 'RequirementNode';

export default RequirementNode;
