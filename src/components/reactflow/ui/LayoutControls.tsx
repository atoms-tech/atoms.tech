'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutGrid, 
  GitBranch, 
  Zap, 
  Grid3X3,
  ChevronDown
} from 'lucide-react';
import { LayoutOptions } from '@/types/react-flow.types';

interface LayoutControlsProps {
  onLayoutChange: (options: LayoutOptions) => void;
}

const LayoutControls: React.FC<LayoutControlsProps> = ({ onLayoutChange }) => {
  const [isApplying, setIsApplying] = useState(false);

  const layoutOptions = [
    {
      algorithm: 'dagre' as const,
      direction: 'TB' as const,
      icon: GitBranch,
      label: 'Hierarchical (Top-Bottom)',
      description: 'Organized top-to-bottom flow',
    },
    {
      algorithm: 'dagre' as const,
      direction: 'LR' as const,
      icon: GitBranch,
      label: 'Hierarchical (Left-Right)',
      description: 'Organized left-to-right flow',
    },
    {
      algorithm: 'force' as const,
      direction: 'TB' as const,
      icon: Zap,
      label: 'Force-Directed',
      description: 'Natural physics-based layout',
    },
    {
      algorithm: 'hierarchical' as const,
      direction: 'TB' as const,
      icon: LayoutGrid,
      label: 'Hierarchical',
      description: 'Level-based arrangement',
    },
  ];

  const handleLayoutApply = async (options: LayoutOptions) => {
    setIsApplying(true);
    try {
      await onLayoutChange(options);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-2">
        <div className="flex items-center gap-1 mb-2">
          <LayoutGrid className="w-4 h-4" />
          <span className="text-sm font-medium">Layout</span>
        </div>
        <Separator className="mb-2" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-between"
              disabled={isApplying}
            >
              {isApplying ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Applying...
                </div>
              ) : (
                <>
                  Apply Layout
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {layoutOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <DropdownMenuItem
                  key={index}
                  onClick={() => handleLayoutApply({
                    algorithm: option.algorithm,
                    direction: option.direction,
                    spacing: { node: 50, rank: 100 },
                    alignment: 'UL',
                  })}
                  className="flex flex-col items-start p-3"
                >
                  <div className="flex items-center gap-2 w-full">
                    <IconComponent className="w-4 h-4" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {option.description}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
};

export default LayoutControls;
