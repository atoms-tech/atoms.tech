'use client';

import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Copy,
    Grid,
    Layers,
    Redo,
    Trash2,
    Undo,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDashboardStore } from '@/store/dashboard.store';

export function DashboardToolbar() {
    const { selectedWidget, duplicateWidget, removeWidget, gridConfig } =
        useDashboardStore();

    const hasSelection = selectedWidget !== undefined;

    return (
        <div className="sticky top-16 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 p-2 overflow-x-auto">
                {/* Grid Controls */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        title="Toggle grid snap"
                    >
                        <Grid className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-gray-500 px-2">
                        {gridConfig.cellSize}px grid
                    </span>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Alignment Tools */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={!hasSelection}
                        title="Align left"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={!hasSelection}
                        title="Align center"
                    >
                        <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={!hasSelection}
                        title="Align right"
                    >
                        <AlignRight className="h-4 w-4" />
                    </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Layer Controls */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={!hasSelection}
                        title="Bring to front"
                    >
                        <Layers className="h-4 w-4" />
                    </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Edit Actions */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={!hasSelection}
                        onClick={() =>
                            selectedWidget && duplicateWidget(selectedWidget)
                        }
                        title="Duplicate widget"
                    >
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-red-600 hover:text-red-700"
                        disabled={!hasSelection}
                        onClick={() =>
                            selectedWidget && removeWidget(selectedWidget)
                        }
                        title="Delete widget"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* History */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled
                        title="Undo (coming soon)"
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled
                        title="Redo (coming soon)"
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                </div>

                {/* Selection Info */}
                {hasSelection && (
                    <>
                        <Separator orientation="vertical" className="h-6" />
                        <div className="text-xs text-gray-600 dark:text-gray-400 px-2">
                            Widget selected
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
