'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Square, 
  Circle, 
  Diamond, 
  FileText, 
  User, 
  Server,
  StickyNote,
  Folder
} from 'lucide-react';

interface NodeToolbarProps {
  onAddNode?: (nodeType: string) => void;
}

const NodeToolbar: React.FC<NodeToolbarProps> = ({ onAddNode }) => {
  const nodeTypes = [
    { type: 'requirement', icon: Square, label: 'Requirement', color: 'text-blue-600' },
    { type: 'process', icon: Circle, label: 'Process', color: 'text-green-600' },
    { type: 'decision', icon: Diamond, label: 'Decision', color: 'text-orange-600' },
    { type: 'document', icon: FileText, label: 'Document', color: 'text-purple-600' },
    { type: 'actor', icon: User, label: 'Actor', color: 'text-indigo-600' },
    { type: 'system', icon: Server, label: 'System', color: 'text-gray-600' },
    { type: 'note', icon: StickyNote, label: 'Note', color: 'text-yellow-600' },
    { type: 'group', icon: Folder, label: 'Group', color: 'text-gray-500' },
  ];

  return (
    <Card className="absolute top-4 left-4 z-10 shadow-lg">
      <CardContent className="p-2">
        <div className="flex items-center gap-1 mb-2">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Node</span>
        </div>
        <Separator className="mb-2" />
        <div className="grid grid-cols-2 gap-1">
          {nodeTypes.map((nodeType) => {
            const IconComponent = nodeType.icon;
            return (
              <Button
                key={nodeType.type}
                variant="ghost"
                size="sm"
                className="h-8 px-2 justify-start"
                onClick={() => onAddNode?.(nodeType.type)}
              >
                <IconComponent className={`w-4 h-4 mr-1 ${nodeType.color}`} />
                <span className="text-xs">{nodeType.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default NodeToolbar;
