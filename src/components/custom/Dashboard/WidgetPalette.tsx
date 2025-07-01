'use client';

import { motion } from 'framer-motion';
import { Move, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    WIDGET_CATEGORIES,
    widgetRegistry,
} from '@/lib/dashboard/widget-registry';
import { useDashboardStore } from '@/store/dashboard.store';
import { WidgetCategory } from '@/types/dashboard.types';

interface WidgetPaletteProps {
    onClose: () => void;
}

export function WidgetPalette({ onClose }: WidgetPaletteProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<
        WidgetCategory | 'all'
    >('all');

    const { addWidget, isEditMode, toggleEditMode } = useDashboardStore();

    const availableWidgets = widgetRegistry.getAll();

    const filteredWidgets = availableWidgets.filter((widget) => {
        const matchesSearch =
            searchQuery === '' ||
            widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            widget.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            widget.tags?.some((tag) =>
                tag.toLowerCase().includes(searchQuery.toLowerCase()),
            );

        const matchesCategory =
            selectedCategory === 'all' || widget.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const categories = Object.keys(WIDGET_CATEGORIES) as WidgetCategory[];

    const handleAddWidget = (type: string) => {
        // Enter edit mode if not already in it
        if (!isEditMode) {
            toggleEditMode();
        }
        addWidget(type);
        // Don't close palette to allow adding multiple widgets
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Widget Library
                </h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search widgets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={
                            selectedCategory === 'all' ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => setSelectedCategory('all')}
                    >
                        All
                    </Button>
                    {categories.map((category) => (
                        <Button
                            key={category}
                            variant={
                                selectedCategory === category
                                    ? 'default'
                                    : 'outline'
                            }
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                            className="text-xs"
                        >
                            {WIDGET_CATEGORIES[category].icon}{' '}
                            {WIDGET_CATEGORIES[category].name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Widget List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredWidgets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No widgets found</p>
                        <p className="text-sm">
                            Try adjusting your search or category filter
                        </p>
                    </div>
                ) : (
                    filteredWidgets.map((widget, index) => (
                        <motion.div
                            key={widget.type}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{
                                scale: 1.02,
                                y: -2,
                                transition: { duration: 0.2 },
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Card
                                className="cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-700 group select-none"
                                style={{
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    MozUserSelect: 'none',
                                    msUserSelect: 'none',
                                }}
                                onClick={(e) => {
                                    // Only handle click if not dragging
                                    if (!e.defaultPrevented) {
                                        handleAddWidget(widget.type);
                                    }
                                }}
                                draggable
                                onDragStart={(e) => {
                                    console.log(
                                        'Starting drag for widget type:',
                                        widget.type,
                                    );
                                    e.dataTransfer.setData(
                                        'widget-type',
                                        widget.type,
                                    );
                                    e.dataTransfer.effectAllowed = 'copy';

                                    // Prevent text selection during drag
                                    document.body.style.userSelect = 'none';
                                    document.body.style.webkitUserSelect =
                                        'none';

                                    // Create a proper drag image from the current element
                                    const dragImage = e.currentTarget.cloneNode(
                                        true,
                                    ) as HTMLElement;
                                    dragImage.style.transform = 'rotate(2deg)';
                                    dragImage.style.opacity = '0.8';
                                    dragImage.style.pointerEvents = 'none';
                                    dragImage.style.position = 'absolute';
                                    dragImage.style.top = '-1000px';
                                    dragImage.style.left = '-1000px';
                                    document.body.appendChild(dragImage);

                                    e.dataTransfer.setDragImage(
                                        dragImage,
                                        50,
                                        25,
                                    );

                                    // Clean up drag image after drag starts
                                    requestAnimationFrame(() => {
                                        if (document.body.contains(dragImage)) {
                                            document.body.removeChild(
                                                dragImage,
                                            );
                                        }
                                    });
                                }}
                                onDragEnd={(e) => {
                                    console.log(
                                        'Drag ended for widget type:',
                                        widget.type,
                                    );

                                    // Restore text selection
                                    document.body.style.userSelect = '';
                                    document.body.style.webkitUserSelect = '';
                                }}
                            >
                                <CardContent className="p-4 relative">
                                    {/* Drag Handle */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-blue-500 text-white p-1 rounded cursor-grab active:cursor-grabbing">
                                            <Move className="h-3 w-3" />
                                        </div>
                                    </div>

                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="text-lg">
                                                {widget.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                                                    {widget.name}
                                                </h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {widget.description}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="h-6 w-6 p-0 shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddWidget(widget.type);
                                            }}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {
                                                WIDGET_CATEGORIES[
                                                    widget.category
                                                ].name
                                            }
                                        </Badge>

                                        <div className="text-xs text-gray-500">
                                            {widget.defaultSize.width}×
                                            {widget.defaultSize.height}
                                        </div>
                                    </div>

                                    {widget.tags && widget.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {widget.tags
                                                .slice(0, 3)
                                                .map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1 py-0.5 rounded"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            {widget.tags.length > 3 && (
                                                <span className="text-xs text-gray-500">
                                                    +{widget.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 text-center">
                    {filteredWidgets.length} of {availableWidgets.length}{' '}
                    widgets available
                </p>
            </div>
        </div>
    );
}
