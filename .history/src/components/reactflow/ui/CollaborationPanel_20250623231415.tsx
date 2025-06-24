'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Eye, EyeOff } from 'lucide-react';
import { CollaborationUser } from '@/types/react-flow.types';

interface CollaborationPanelProps {
  projectId?: string;
  diagramId?: string;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  projectId,
  diagramId,
}) => {
  const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  // Mock collaborators for demo
  useEffect(() => {
    const mockCollaborators: CollaborationUser[] = [
      {
        id: '1',
        name: 'John Doe',
        avatar: 'JD',
        color: '#3B82F6',
        cursor: { x: 100, y: 200 },
        selection: ['node-1'],
      },
      {
        id: '2',
        name: 'Jane Smith',
        avatar: 'JS',
        color: '#10B981',
        cursor: { x: 300, y: 150 },
        selection: [],
      },
    ];

    // Simulate real-time updates
    const interval = setInterval(() => {
      setCollaborators(prev => 
        prev.map(user => ({
          ...user,
          cursor: {
            x: Math.random() * 800,
            y: Math.random() * 600,
          },
        }))
      );
    }, 3000);

    setCollaborators(mockCollaborators);

    return () => clearInterval(interval);
  }, [projectId, diagramId]);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 z-10"
      >
        <Eye className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Card className="w-64 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Collaborators ({collaborators.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            <EyeOff className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {collaborators.length === 0 ? (
            <p className="text-sm text-gray-500">No active collaborators</p>
          ) : (
            collaborators.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.avatar || user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {user.selection && user.selection.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {user.selection.length} selected
                    </Badge>
                  )}
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              </div>
            ))
          )}
        </div>
        
        {collaborators.length > 0 && (
          <div className="mt-3 pt-2 border-t">
            <p className="text-xs text-gray-500">
              Real-time collaboration active
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CollaborationPanel;
