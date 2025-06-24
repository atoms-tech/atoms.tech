'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ContextMenuAction } from '@/types/react-flow.types';

interface ContextMenuProps {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  nodeId?: string;
  edgeId?: string;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  actions,
  nodeId,
  edgeId,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport
  const adjustedPosition = React.useMemo(() => {
    if (typeof window === 'undefined') return { x, y };

    const menuWidth = 200;
    const menuHeight = actions.length * 40 + 20;
    
    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > window.innerWidth) {
      adjustedX = window.innerWidth - menuWidth - 10;
    }

    if (y + menuHeight > window.innerHeight) {
      adjustedY = window.innerHeight - menuHeight - 10;
    }

    return { x: adjustedX, y: adjustedY };
  }, [x, y, actions.length]);

  const handleAction = (action: ContextMenuAction) => {
    if (action.disabled) return;
    
    const targetId = nodeId || edgeId;
    if (targetId) {
      action.action(targetId, null);
    }
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      <Card className="shadow-lg border">
        <CardContent className="p-1">
          {actions.map((action, index) => (
            <React.Fragment key={action.id}>
              {action.separator ? (
                <Separator className="my-1" />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 px-2 text-sm"
                  onClick={() => handleAction(action)}
                  disabled={action.disabled}
                >
                  {action.icon && (
                    <span className="mr-2">{action.icon}</span>
                  )}
                  {action.label}
                </Button>
              )}
            </React.Fragment>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContextMenu;
