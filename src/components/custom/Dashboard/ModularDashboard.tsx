'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
    Download,
    Edit3,
    Eye,
    Grid,
    Plus,
    RotateCcw,
    Upload,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
import { initializeWidgets } from '@/lib/dashboard/initialize-widgets';
import { useDashboardStore } from '@/store/dashboard.store';
import { WidgetInstance } from '@/types/dashboard.types';

import { DashboardGrid } from './DashboardGrid';
import { DashboardToolbar } from './DashboardToolbar';
import { WidgetPalette } from './WidgetPalette';
import { WidgetRenderer } from './WidgetRenderer';

interface ModularDashboardProps {
    className?: string;
    data?: Record<string, unknown>;
}

export function ModularDashboard({ className, data }: ModularDashboardProps) {
    const {
        currentLayout,
        isEditMode,
        selectedWidget,
        toggleEditMode,
        saveLayout,
        resetLayout,
        exportLayout,
        importLayout,
        initializeForUser,
    } = useDashboardStore();

    const [showPalette, setShowPalette] = useState(false);
    const [_draggedWidget, _setDraggedWidget] = useState<WidgetInstance | null>(
        null,
    );

    // Initialize widgets and layout on component mount
    useEffect(() => {
        initializeWidgets();

        // Initialize layout based on user status
        const isNewUser = data?.onboardingProgress?.is_new_user || false;
        initializeForUser(isNewUser);
    }, [data?.onboardingProgress?.is_new_user, initializeForUser]);

    // Auto-save layout changes
    useEffect(() => {
        const timer = setTimeout(() => {
            saveLayout();
        }, 2000);

        return () => clearTimeout(timer);
    }, [currentLayout, saveLayout]);

    const handleExport = () => {
        const data = exportLayout();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-${currentLayout.name.toLowerCase().replace(/\s+/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = e.target?.result as string;
                    importLayout(data);
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    return (
        <div
            className={`min-h-screen ${isEditMode ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-950'} ${className}`}
        >
            {/* Dashboard Header - Only show in edit mode */}
            {isEditMode && (
                <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Dashboard Editor
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Customize your workspace
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                    {currentLayout.widgets.length} widgets
                                </span>
                                <span className="text-xs text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">
                                    Edit Mode
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPalette(!showPalette)}
                                className="flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Widget
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                className="flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Export
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleImport}
                                className="flex items-center gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                Import
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetLayout}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700"
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset
                            </Button>

                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

                            <Button
                                variant="default"
                                size="sm"
                                onClick={toggleEditMode}
                                className="flex items-center gap-2"
                            >
                                <Eye className="h-4 w-4" />
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Add Widget Button - Show when not in edit mode */}
            {!isEditMode && (
                <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
                    <Button
                        onClick={() => {
                            toggleEditMode();
                            setShowPalette(true);
                        }}
                        className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 group"
                        title="Add Widget"
                    >
                        <Plus className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    </Button>
                    <div className="text-center">
                        <span className="text-xs text-gray-500 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full shadow-sm">
                            Add Widget
                        </span>
                    </div>
                </div>
            )}

            {/* Edit Mode Toggle - Always visible */}
            {!isEditMode && currentLayout.widgets.length > 0 && (
                <Button
                    onClick={toggleEditMode}
                    variant="outline"
                    size="sm"
                    className="fixed top-4 right-4 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
                    title="Customize Dashboard"
                >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Customize
                </Button>
            )}

            {/* Dashboard Content */}
            <div className="relative">
                {/* Widget Palette */}
                <AnimatePresence>
                    {showPalette && (
                        <motion.div
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-[60] overflow-y-auto shadow-xl"
                        >
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Add Widgets
                                    </h2>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowPalette(false)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                {!isEditMode && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                        Select widgets to add to your dashboard.
                                        You'll enter edit mode automatically.
                                    </p>
                                )}
                            </div>
                            <WidgetPalette
                                onClose={() => setShowPalette(false)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Backdrop for widget palette */}
                <AnimatePresence>
                    {showPalette && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 z-[50]"
                            onClick={() => setShowPalette(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Main Dashboard Area */}
                <div
                    className={`transition-all duration-300 ${showPalette ? 'ml-80' : ''}`}
                    style={{ position: 'relative', zIndex: 1 }}
                >
                    {/* Dashboard Toolbar */}
                    {isEditMode && <DashboardToolbar />}

                    {/* Dashboard Grid */}
                    <DashboardGrid className="p-4">
                        {currentLayout.widgets.map((widget) => (
                            <WidgetRenderer
                                key={widget.id}
                                widget={widget}
                                isEditMode={isEditMode}
                                isSelected={selectedWidget === widget.id}
                                data={data}
                            />
                        ))}
                    </DashboardGrid>

                    {/* Empty State */}
                    {currentLayout.widgets.length === 0 && (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                            <div className="p-8 rounded-lg bg-gray-100 dark:bg-gray-800 max-w-md">
                                <Grid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Your dashboard is empty
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Add widgets to customize your dashboard and
                                    boost your productivity.
                                </p>
                                <Button
                                    onClick={() => {
                                        if (!isEditMode) toggleEditMode();
                                        setShowPalette(true);
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Your First Widget
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Drag Overlay */}
            {draggedWidget && (
                <div className="fixed inset-0 pointer-events-none z-50">
                    <div
                        className="absolute bg-blue-500/20 border-2 border-blue-500 border-dashed rounded-lg"
                        style={{
                            left: draggedWidget.position.x,
                            top: draggedWidget.position.y,
                            width: draggedWidget.size.width,
                            height: draggedWidget.size.height,
                        }}
                    />
                </div>
            )}
        </div>
    );
}
