'use client';

import React from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAgentStore } from './hooks/useAgentStore';

interface AgentToggleProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const AgentToggle: React.FC<AgentToggleProps> = ({
  isOpen,
  onClick,
  className,
}) => {
  const { messages, isConnected, connectionStatus } = useAgentStore();
  
  // Count unread messages (for future implementation)
  const unreadCount = 0; // This could be calculated based on read/unread status

  return (
    <div
      className={cn(
        'fixed right-6 bottom-6 z-40 transition-all duration-300 ease-out',
        className
      )}
    >
      <Button
        onClick={onClick}
        size="lg"
        className={cn(
          'rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200',
          'bg-primary hover:bg-primary/90 text-primary-foreground',
          'border border-border/50',
          isOpen && 'rotate-180'
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>
      
      {/* Connection Status Indicator */}
      {!isOpen && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <Badge
            variant={isConnected ? 'default' : 'secondary'}
            className={cn(
              'h-3 w-3 rounded-full p-0 border-2 border-background',
              isConnected 
                ? 'bg-green-500 animate-pulse' 
                : connectionStatus === 'connecting'
                  ? 'bg-yellow-500 animate-spin'
                  : connectionStatus === 'error'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
            )}
          />
        </div>
      )}
    </div>
  );
}; 