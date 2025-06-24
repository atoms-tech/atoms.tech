'use client';

import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DocumentNodeData, CustomNodeProps } from '@/types/react-flow.types';
import { useDiagramElementLinks } from '@/hooks/queries/useDiagramElementLinks';
import { cn } from '@/lib/utils';

const DocumentNode: React.FC<CustomNodeProps<DocumentNodeData>> = memo(({
  id, data, selected, onLinkToRequirement, onEditNode, isCollaborating = false, collaborators = []
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { data: links } = useDiagramElementLinks(id);

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'specification': return '📋';
      case 'design': return '🎨';
      case 'test': return '🧪';
      case 'manual': return '📖';
      default: return '📄';
    }
  };

  const hasLinks = links && links.length > 0;

  return (
    <div className={cn('relative min-w-[200px] max-w-[280px]', selected && 'ring-2 ring-blue-500 ring-offset-2', hasLinks && 'ring-1 ring-blue-300')}
         onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-purple-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-purple-500 border-2 border-white" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-purple-500 border-2 border-white" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-purple-500 border-2 border-white" />

      <Card className="shadow-md hover:shadow-lg transition-shadow bg-purple-50 border-purple-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getDocumentIcon(data.documentType)}</span>
              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-300">
                {data.documentType.toUpperCase()}
              </Badge>
            </div>
            {data.version && (
              <Badge variant="secondary" className="text-xs">v{data.version}</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="text-xs text-gray-500 font-mono">{data.documentId}</div>
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">{data.label}</h3>
            {data.description && <p className="text-xs text-gray-600 line-clamp-2">{data.description}</p>}
            {hasLinks && (
              <div className="flex items-center gap-1 text-xs text-purple-600">
                <span>🔗</span><span>{links.length} link{links.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {isHovered && (
            <div className="mt-3 flex gap-1">
              <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => onLinkToRequirement?.(id)}>🔗 Link</Button>
              <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => onEditNode?.(id, data)}>✏️ Edit</Button>
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
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border border-white">
          <div className="w-full h-full bg-purple-400 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
});

DocumentNode.displayName = 'DocumentNode';
export default DocumentNode;
