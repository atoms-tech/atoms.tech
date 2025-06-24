'use client';

import {
    ChevronDown,
    ChevronUp,
    Circle,
    Diamond,
    FileText,
    Folder,
    GripVertical,
    Plus,
    Server,
    Square,
    StickyNote,
    User,
} from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface NodeToolbarProps {
    onAddNode?: (nodeType: string) => void;
}

const NodeToolbar: React.FC<NodeToolbarProps> = ({ onAddNode }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const nodeTypes = [
        {
            type: 'requirement',
            icon: Square,
            label: 'Requirement',
            color: 'text-blue-600',
            description: 'Add a requirement node',
        },
        {
            type: 'process',
            icon: Circle,
            label: 'Process',
            color: 'text-green-600',
            description: 'Add a process step',
        },
        {
            type: 'decision',
            icon: Diamond,
            label: 'Decision',
            color: 'text-orange-600',
            description: 'Add a decision point',
        },
        {
            type: 'document',
            icon: FileText,
            label: 'Document',
            color: 'text-purple-600',
            description: 'Add a document reference',
        },
        {
            type: 'actor',
            icon: User,
            label: 'Actor',
            color: 'text-indigo-600',
            description: 'Add an actor/user',
        },
        {
            type: 'system',
            icon: Server,
            label: 'System',
            color: 'text-gray-600',
            description: 'Add a system component',
        },
        {
            type: 'note',
            icon: StickyNote,
            label: 'Note',
            color: 'text-yellow-600',
            description: 'Add a note or comment',
        },
        {
            type: 'group',
            icon: Folder,
            label: 'Group',
            color: 'text-gray-500',
            description: 'Add a grouping container',
        },
    ];

    const handleDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <Card className="shadow-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="p-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add Nodes</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? (
                            <ChevronDown className="w-3 h-3" />
                        ) : (
                            <ChevronUp className="w-3 h-3" />
                        )}
                    </Button>
                </div>

                {!isCollapsed && (
                    <>
                        <Separator className="mb-2" />
                        <div className="space-y-1">
                            {nodeTypes.map((nodeType) => {
                                const IconComponent = nodeType.icon;
                                return (
                                    <div
                                        key={nodeType.type}
                                        draggable
                                        onDragStart={(e) =>
                                            handleDragStart(e, nodeType.type)
                                        }
                                        className="group"
                                    >
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full h-8 px-2 justify-start hover:bg-gray-100 dark:hover:bg-gray-700 cursor-grab active:cursor-grabbing"
                                            onClick={() =>
                                                onAddNode?.(nodeType.type)
                                            }
                                            title={nodeType.description}
                                        >
                                            <IconComponent
                                                className={`w-4 h-4 mr-2 ${nodeType.color}`}
                                            />
                                            <span className="text-xs">
                                                {nodeType.label}
                                            </span>
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                        <Separator className="my-2" />
                        <div className="text-xs text-gray-500 text-center">
                            Click to add or drag to canvas
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default NodeToolbar;
