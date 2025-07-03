'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
    Copy,
    Maximize2,
    Minimize2,
    MoreVertical,
    Move,
    Settings,
    Trash2,
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { widgetRegistry } from '@/lib/dashboard/widget-registry';
import { useDashboardStore } from '@/store/dashboard.store';
import { WidgetInstance } from '@/types/dashboard.types';

import { WidgetConfigModal } from './WidgetConfigModal';

interface WidgetRendererProps {
    widget: WidgetInstance;
    isEditMode: boolean;
    isSelected: boolean;
    data?: any;
}

export function WidgetRenderer({
    widget,
    isEditMode,
    isSelected,
    data,
}: WidgetRendererProps) {
    const {
        updateWidget,
        removeWidget,
        duplicateWidget,
        selectWidget,
        moveWidget,
        resizeWidget,
        startDrag,
        updateDragPreview,
        endDrag,
        cancelDrag,
        isDragging: globalIsDragging,
        dragPreview,
    } = useDashboardStore();

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showConfigModal, setShowConfigModal] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);

    const isBeingDragged = globalIsDragging && dragPreview?.id === widget.id;

    const definition = widgetRegistry.get(widget.type);
    const WidgetComponent = definition?.component;

    const handleConfigChange = (config: any) => {
        updateWidget(widget.id, { config });
    };

    const handleConfigSave = (config: any) => {
        updateWidget(widget.id, { config });
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isEditMode && !isDragging) {
            e.stopPropagation();
            selectWidget(isSelected ? null : widget.id);
        }
    };

    const handleDuplicate = () => {
        duplicateWidget(widget.id);
    };

    const handleRemove = () => {
        removeWidget(widget.id);
    };

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            // Only handle left mouse button
            if (e.button !== 0) return;

            // Don't drag if not in edit mode, if resizing, or if clicking on buttons
            if (!isEditMode || isResizing) return;

            // Don't drag if clicking on interactive elements
            const target = e.target as HTMLElement;
            if (
                target.closest('button') ||
                target.closest('[role="button"]') ||
                target.closest('input') ||
                target.closest('select') ||
                target.closest('a') ||
                target.closest('[contenteditable]')
            ) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            // Prevent text selection during drag
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';

            // Find the grid container to calculate relative offset
            const gridContainer = document.querySelector(
                '[data-grid-container="true"]',
            ) as HTMLElement;
            if (gridContainer) {
                const gridRect = gridContainer.getBoundingClientRect();
                // Calculate offset from mouse to widget position relative to grid
                const offsetX = e.clientX - gridRect.left - widget.position.x;
                const offsetY = e.clientY - gridRect.top - widget.position.y;
                console.log(
                    'Drag offset calculated:',
                    { x: offsetX, y: offsetY },
                    'Widget pos:',
                    widget.position,
                    'Mouse:',
                    { x: e.clientX, y: e.clientY },
                    'Grid rect:',
                    gridRect,
                );
                setDragOffset({ x: offsetX, y: offsetY });
            } else {
                // Fallback to widget-relative offset
                const rect = dragRef.current?.getBoundingClientRect();
                if (rect) {
                    const offsetX = e.clientX - rect.left;
                    const offsetY = e.clientY - rect.top;
                    setDragOffset({ x: offsetX, y: offsetY });
                }
            }

            setIsDragging(true);
            startDrag(widget);
            selectWidget(widget.id);
        },
        [isEditMode, isResizing, widget, startDrag, selectWidget],
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging || !isEditMode) return;

            // Find the grid container to calculate relative position
            const gridContainer = document.querySelector(
                '[data-grid-container="true"]',
            ) as HTMLElement;
            if (!gridContainer) return;

            const gridRect = gridContainer.getBoundingClientRect();
            const newPosition = {
                x: Math.max(0, e.clientX - gridRect.left - dragOffset.x),
                y: Math.max(0, e.clientY - gridRect.top - dragOffset.y),
            };

            console.log(
                'Drag preview position:',
                newPosition,
                'Mouse:',
                { x: e.clientX, y: e.clientY },
                'Grid rect:',
                gridRect,
                'Offset:',
                dragOffset,
            );
            updateDragPreview(newPosition);
        },
        [isDragging, isEditMode, dragOffset, updateDragPreview],
    );

    const handleMouseUp = useCallback(
        (e: MouseEvent) => {
            if (!isDragging) return;

            // Calculate final position relative to grid container
            const gridContainer = document.querySelector(
                '[data-grid-container="true"]',
            ) as HTMLElement;
            if (gridContainer) {
                const gridRect = gridContainer.getBoundingClientRect();
                const finalPosition = {
                    x: Math.max(0, e.clientX - gridRect.left - dragOffset.x),
                    y: Math.max(0, e.clientY - gridRect.top - dragOffset.y),
                };
                console.log(
                    'Final drop position:',
                    finalPosition,
                    'Will be snapped to grid',
                );
                endDrag(finalPosition);
            } else {
                // Fallback to drag preview position
                const { dragPreview } = useDashboardStore.getState();
                if (dragPreview) {
                    endDrag(dragPreview.position);
                }
            }

            setIsDragging(false);

            // Restore text selection
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
        },
        [isDragging, dragOffset, endDrag],
    );

    // Add global mouse event listeners for dragging
    React.useEffect(() => {
        if (!isDragging) return;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    if (!definition) {
        return (
            <div
                className="absolute bg-red-100 border-2 border-red-300 rounded-lg p-4 flex items-center justify-center"
                style={{
                    left: widget.position.x,
                    top: widget.position.y,
                    width: widget.size.width,
                    height: widget.size.height,
                    zIndex: widget.zIndex || 0,
                }}
            >
                <div className="text-center text-red-600">
                    <p className="font-medium">Widget not found</p>
                    <p className="text-sm">Type: {widget.type}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <motion.div
                ref={dragRef}
                className={`absolute group select-none ${isBeingDragged ? 'opacity-30 z-50' : ''} ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-400 hover:ring-opacity-60 hover:shadow-lg' : 'cursor-pointer'}`}
                style={{
                    left: widget.position.x,
                    top: widget.position.y,
                    width: widget.size.width,
                    height: widget.size.height,
                    zIndex: isBeingDragged ? 9999 : widget.zIndex || 0,
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                    opacity: isBeingDragged ? 0.3 : 1,
                    scale: isEditMode && !isBeingDragged ? 1 : 0.98,
                    filter: isBeingDragged
                        ? 'brightness(0.7)'
                        : 'brightness(1)',
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={
                    isEditMode && !isBeingDragged
                        ? {
                              scale: 1.02,
                              filter: 'brightness(0.8)',
                              transition: { duration: 0.2 },
                          }
                        : {
                              scale: 1.01,
                              transition: { duration: 0.2 },
                          }
                }
                onClick={handleClick}
                onMouseDown={isEditMode ? handleMouseDown : undefined}
                transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                    opacity: { duration: 0.15 },
                    scale: { duration: 0.15 },
                    filter: { duration: 0.15 },
                }}
            >
                <Card
                    className={`h-full w-full overflow-hidden transition-all duration-200 ${
                        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                    } ${isEditMode ? 'hover:shadow-md' : ''}`}
                >
                    {/* Widget Header (Edit Mode) */}
                    {isEditMode && (
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md p-1 shadow-sm">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                        >
                                            <MoreVertical className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={handleDuplicate}
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                setShowConfigModal(true)
                                            }
                                        >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Configure
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleRemove}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remove
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )}

                    {/* Widget Content */}
                    <div className="h-full w-full">
                        <WidgetComponent
                            instance={widget}
                            onConfigChange={handleConfigChange}
                            onResize={(size) => resizeWidget(widget.id, size)}
                            onMove={(position) =>
                                moveWidget(widget.id, position)
                            }
                            onRemove={() => removeWidget(widget.id)}
                            isEditing={isEditMode}
                            data={data}
                        />
                    </div>

                    {/* Resize Handles (Edit Mode) */}
                    {isEditMode && isSelected && (
                        <>
                            {/* Corner resize handle */}
                            <div
                                className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{
                                    clipPath:
                                        'polygon(100% 0, 100% 100%, 0 100%)',
                                }}
                            />

                            {/* Edge resize handles */}
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-blue-500/50 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity rounded-t" />
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-6 bg-blue-500/50 cursor-e-resize opacity-0 group-hover:opacity-100 transition-opacity rounded-l" />
                        </>
                    )}
                </Card>
            </motion.div>

            {/* Drag Preview Overlay */}
            {isBeingDragged && dragPreview && (
                <motion.div
                    className="absolute pointer-events-none"
                    style={{
                        left: dragPreview.position.x,
                        top: dragPreview.position.y,
                        width: widget.size.width,
                        height: widget.size.height,
                        zIndex: 10000,
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                        opacity: 0.6,
                        scale: 1.05,
                        rotate: 2,
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                    }}
                >
                    {/* Actual widget content preview */}
                    <div className="w-full h-full opacity-40 filter blur-sm">
                        <Card className="h-full w-full overflow-hidden border-2 border-blue-500 border-dashed">
                            <CardContent className="p-4 h-full">
                                {WidgetComponent && (
                                    <WidgetComponent
                                        instance={widget}
                                        data={data}
                                        isEditing={false}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Overlay indicator */}
                    <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center">
                        <div className="text-white font-medium text-sm bg-blue-600/80 px-3 py-1 rounded-full shadow-lg">
                            Moving Widget
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Drop Zone Preview */}
            {globalIsDragging && !isBeingDragged && (
                <motion.div
                    className="absolute pointer-events-none border-2 border-green-400 border-dashed rounded-lg bg-green-400/10"
                    style={{
                        left: widget.position.x,
                        top: widget.position.y,
                        width: widget.size.width,
                        height: widget.size.height,
                        zIndex: 9997,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    exit={{ opacity: 0 }}
                />
            )}

            {/* Configuration Modal */}
            <WidgetConfigModal
                widget={widget}
                configSchema={definition.configSchema}
                isOpen={showConfigModal}
                onClose={() => setShowConfigModal(false)}
                onSave={handleConfigSave}
            />
        </>
    );
}
