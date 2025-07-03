'use client';

import { ReactNode, useState } from 'react';

import { useDashboardStore } from '@/store/dashboard.store';

interface DashboardGridProps {
    children: ReactNode;
    className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
    const { gridConfig, isEditMode, addWidget } = useDashboardStore();
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Check if we have widget data
        const hasWidgetData = e.dataTransfer.types.includes('widget-type');
        if (hasWidgetData) {
            e.dataTransfer.dropEffect = 'copy';
            if (!isDragOver) {
                setIsDragOver(true);
            }
        } else {
            e.dataTransfer.dropEffect = 'none';
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Only set drag over to false if we're leaving the grid container
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;

        if (
            x < rect.left ||
            x > rect.right ||
            y < rect.top ||
            y > rect.bottom
        ) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const widgetType = e.dataTransfer.getData('widget-type');
        console.log('Drop event received, widget type:', widgetType);

        if (widgetType) {
            // Calculate drop position relative to the grid container
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.max(0, e.clientX - rect.left);
            const y = Math.max(0, e.clientY - rect.top);

            // Snap to grid with proper spacing
            const gridUnit = gridConfig.cellSize + gridConfig.gap;
            const snappedX = Math.round(x / gridUnit) * gridUnit;
            const snappedY = Math.round(y / gridUnit) * gridUnit;

            console.log('Dropping widget at:', {
                original: { x, y },
                snapped: { x: snappedX, y: snappedY },
                gridUnit,
            });

            addWidget(widgetType, { x: snappedX, y: snappedY });
        } else {
            console.log('No widget type found in drop data');
        }

        // Reset drag over state
        setIsDragOver(false);
    };

    return (
        <div
            data-grid-container="true"
            className={`relative min-h-screen transition-all duration-300 ${className} ${
                isEditMode
                    ? 'bg-gray-50 dark:bg-gray-900'
                    : 'bg-white dark:bg-gray-950'
            } ${isDragOver && isEditMode ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
            style={{
                backgroundImage: isEditMode
                    ? `
                    linear-gradient(to right, rgba(156, 163, 175, 0.15) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(156, 163, 175, 0.15) 1px, transparent 1px)
                `
                    : undefined,
                backgroundSize: isEditMode
                    ? `${gridConfig.cellSize + gridConfig.gap}px ${gridConfig.cellSize + gridConfig.gap}px`
                    : undefined,
                pointerEvents: 'auto',
                zIndex: 1,
            }}
            onDragOver={isEditMode ? handleDragOver : undefined}
            onDragLeave={isEditMode ? handleDragLeave : undefined}
            onDrop={isEditMode ? handleDrop : undefined}
        >
            {/* Grid overlay for better visibility in edit mode */}
            {isEditMode && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
                </div>
            )}

            {/* Drop zone indicator */}
            {isDragOver && isEditMode && (
                <div className="absolute inset-0 pointer-events-none z-10">
                    <div className="absolute inset-4 border-2 border-dashed border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                Drop widget here
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {children}
        </div>
    );
}
