import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
    generateWidgetId,
    widgetRegistry,
} from '@/lib/dashboard/widget-registry';
import {
    DashboardActions,
    DashboardLayout,
    DashboardState,
    GridConfig,
    WidgetInstance,
    WidgetPosition,
    WidgetSize,
} from '@/types/dashboard.types';

interface DashboardStore extends DashboardState, DashboardActions {
    // Additional state
    gridConfig: GridConfig;
    isDragging: boolean;
    dragPreview: WidgetInstance | null;

    // Grid and layout utilities
    snapToGrid: (position: WidgetPosition) => WidgetPosition;
    findEmptyPosition: (size: WidgetSize) => WidgetPosition;
    checkCollision: (widget: WidgetInstance, excludeId?: string) => boolean;

    // Widget selection
    selectWidget: (id: string | null) => void;

    // Drag operations
    startDrag: (widget: WidgetInstance) => void;
    updateDragPreview: (position: WidgetPosition) => void;
    endDrag: (position?: WidgetPosition) => void;
    cancelDrag: () => void;

    // Bulk operations
    removeSelectedWidgets: () => void;
    duplicateSelectedWidgets: () => void;

    // Layout management
    initializeForUser: (isNewUser: boolean) => void;
    createNewLayout: (name: string) => void;
    deleteLayout: (id: string) => void;
    renameLayout: (id: string, name: string) => void;
}

const DEFAULT_GRID_CONFIG: GridConfig = {
    columns: 12,
    rows: 8,
    cellSize: 100,
    gap: 16,
    snapToGrid: true,
};

const createNewUserLayout = (): DashboardLayout => ({
    id: 'new-user',
    name: 'Welcome Dashboard',
    description: 'Your personalized getting started dashboard',
    widgets: [
        {
            id: 'welcome-onboarding',
            type: 'onboarding-guide',
            position: { x: 0, y: 0 },
            size: { width: 500, height: 450 },
            config: { showOptionalSteps: true, autoExpand: true },
            isVisible: true,
            zIndex: 1,
        },
        {
            id: 'welcome-quick-actions',
            type: 'quick-actions',
            position: { x: 516, y: 0 },
            size: { width: 350, height: 200 },
            config: { layout: 'compact', showShortcuts: false },
            isVisible: true,
            zIndex: 2,
        },
        {
            id: 'welcome-projects',
            type: 'projects-overview',
            position: { x: 516, y: 216 },
            size: { width: 350, height: 234 },
            config: { maxItems: 3, viewMode: 'list', showStats: false },
            isVisible: true,
            zIndex: 3,
        },
    ],
    gridSize: {
        columns: DEFAULT_GRID_CONFIG.columns,
        rows: DEFAULT_GRID_CONFIG.rows,
        cellSize: DEFAULT_GRID_CONFIG.cellSize,
    },
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
});

const createDefaultLayout = (): DashboardLayout => ({
    id: 'default',
    name: 'Dashboard',
    description: 'Your personalized dashboard',
    widgets: [
        {
            id: 'default-quick-actions',
            type: 'quick-actions',
            position: { x: 0, y: 0 },
            size: { width: 600, height: 250 },
            config: { layout: 'grid', showShortcuts: true },
            isVisible: true,
            zIndex: 1,
        },
        {
            id: 'default-projects',
            type: 'projects-overview',
            position: { x: 0, y: 266 },
            size: { width: 400, height: 400 },
            config: { maxItems: 6, viewMode: 'grid', showStats: true },
            isVisible: true,
            zIndex: 2,
        },
        {
            id: 'default-analytics',
            type: 'analytics-dashboard',
            position: { x: 416, y: 266 },
            size: { width: 300, height: 200 },
            config: { displayMode: 'standard', showTrends: true },
            isVisible: true,
            zIndex: 3,
        },
        {
            id: 'default-activity',
            type: 'recent-activity',
            position: { x: 416, y: 482 },
            size: { width: 300, height: 300 },
            config: { maxItems: 5, showProjects: true, showTimestamps: true },
            isVisible: true,
            zIndex: 4,
        },
    ],
    gridSize: {
        columns: DEFAULT_GRID_CONFIG.columns,
        rows: DEFAULT_GRID_CONFIG.rows,
        cellSize: DEFAULT_GRID_CONFIG.cellSize,
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
});

export const useDashboardStore = create<DashboardStore>()(
    persist(
        (set, get) => ({
            // Initial state - will be updated based on user status
            currentLayout: createDefaultLayout(),
            availableWidgets: [],
            isEditMode: false,
            selectedWidget: undefined,
            draggedWidget: undefined,
            clipboard: [],
            gridConfig: DEFAULT_GRID_CONFIG,
            isDragging: false,
            dragPreview: null,

            // Widget management actions
            addWidget: (type: string, position?: WidgetPosition) => {
                const definition = widgetRegistry.get(type);
                if (!definition) {
                    console.error(
                        `Widget type "${type}" not found in registry`,
                    );
                    return;
                }

                const state = get();
                const id = generateWidgetId();
                const size = definition.defaultSize;
                const finalPosition = position || state.findEmptyPosition(size);

                const newWidget: WidgetInstance = {
                    id,
                    type,
                    position: state.gridConfig.snapToGrid
                        ? state.snapToGrid(finalPosition)
                        : finalPosition,
                    size,
                    config: {},
                    isVisible: true,
                    zIndex: state.currentLayout.widgets.length,
                };

                set((state) => ({
                    currentLayout: {
                        ...state.currentLayout,
                        widgets: [...state.currentLayout.widgets, newWidget],
                        updatedAt: new Date(),
                    },
                }));
            },

            removeWidget: (id: string) => {
                set((state) => ({
                    currentLayout: {
                        ...state.currentLayout,
                        widgets: state.currentLayout.widgets.filter(
                            (w) => w.id !== id,
                        ),
                        updatedAt: new Date(),
                    },
                    selectedWidget:
                        state.selectedWidget === id
                            ? undefined
                            : state.selectedWidget,
                }));
            },

            updateWidget: (id: string, updates: Partial<WidgetInstance>) => {
                set((state) => ({
                    currentLayout: {
                        ...state.currentLayout,
                        widgets: state.currentLayout.widgets.map((w) =>
                            w.id === id ? { ...w, ...updates } : w,
                        ),
                        updatedAt: new Date(),
                    },
                }));
            },

            moveWidget: (id: string, position: WidgetPosition) => {
                const state = get();
                const finalPosition = state.gridConfig.snapToGrid
                    ? state.snapToGrid(position)
                    : position;
                state.updateWidget(id, { position: finalPosition });
            },

            resizeWidget: (id: string, size: WidgetSize) => {
                get().updateWidget(id, { size });
            },

            duplicateWidget: (id: string) => {
                const state = get();
                const widget = state.currentLayout.widgets.find(
                    (w) => w.id === id,
                );
                if (!widget) return;

                const newId = generateWidgetId();
                const newPosition = state.findEmptyPosition(widget.size);

                const duplicatedWidget: WidgetInstance = {
                    ...widget,
                    id: newId,
                    position: newPosition,
                    zIndex: state.currentLayout.widgets.length,
                };

                set((state) => ({
                    currentLayout: {
                        ...state.currentLayout,
                        widgets: [
                            ...state.currentLayout.widgets,
                            duplicatedWidget,
                        ],
                        updatedAt: new Date(),
                    },
                }));
            },

            toggleEditMode: () => {
                set((state) => ({
                    isEditMode: !state.isEditMode,
                    selectedWidget: undefined,
                }));
            },

            selectWidget: (id: string | null) => {
                set({ selectedWidget: id || undefined });
            },

            // Drag operations
            startDrag: (widget: WidgetInstance) => {
                set({
                    isDragging: true,
                    dragPreview: { ...widget },
                    selectedWidget: widget.id,
                });
            },

            updateDragPreview: (position: WidgetPosition) => {
                const state = get();
                if (state.dragPreview) {
                    const snappedPosition = state.gridConfig.snapToGrid
                        ? state.snapToGrid(position)
                        : position;
                    set({
                        dragPreview: {
                            ...state.dragPreview,
                            position: snappedPosition,
                        },
                    });
                }
            },

            endDrag: (position?: WidgetPosition) => {
                const state = get();
                if (state.dragPreview && position) {
                    const finalPosition = state.gridConfig.snapToGrid
                        ? state.snapToGrid(position)
                        : position;
                    state.updateWidget(state.dragPreview.id, {
                        position: finalPosition,
                    });
                }
                set({
                    isDragging: false,
                    dragPreview: null,
                });
            },

            cancelDrag: () => {
                set({
                    isDragging: false,
                    dragPreview: null,
                });
            },

            // Grid utilities
            snapToGrid: (position: WidgetPosition): WidgetPosition => {
                const { cellSize, gap } = get().gridConfig;
                const gridUnit = cellSize + gap;

                return {
                    x: Math.round(position.x / gridUnit) * gridUnit,
                    y: Math.round(position.y / gridUnit) * gridUnit,
                };
            },

            findEmptyPosition: (size: WidgetSize): WidgetPosition => {
                const state = get();
                const { columns, cellSize, gap } = state.gridConfig;
                const gridUnit = cellSize + gap;

                // Simple algorithm: try positions from top-left
                for (let row = 0; row < 20; row++) {
                    for (let col = 0; col < columns; col++) {
                        const position = {
                            x: col * gridUnit,
                            y: row * gridUnit,
                        };

                        const testWidget: WidgetInstance = {
                            id: 'test',
                            type: 'test',
                            position,
                            size,
                            config: {},
                            isVisible: true,
                        };

                        if (!state.checkCollision(testWidget)) {
                            return position;
                        }
                    }
                }

                // Fallback: place at bottom
                return { x: 0, y: 20 * gridUnit };
            },

            checkCollision: (
                widget: WidgetInstance,
                excludeId?: string,
            ): boolean => {
                const state = get();
                const widgets = state.currentLayout.widgets.filter(
                    (w) => w.id !== excludeId && w.isVisible,
                );

                return widgets.some((other) => {
                    const w1 = widget;
                    const w2 = other;

                    return !(
                        w1.position.x + w1.size.width <= w2.position.x ||
                        w2.position.x + w2.size.width <= w1.position.x ||
                        w1.position.y + w1.size.height <= w2.position.y ||
                        w2.position.y + w2.size.height <= w1.position.y
                    );
                });
            },

            // Layout management
            saveLayout: () => {
                // This would typically save to a backend
                console.log('Layout saved:', get().currentLayout);
            },

            loadLayout: (layoutId: string) => {
                // This would typically load from a backend
                console.log('Loading layout:', layoutId);
            },

            initializeForUser: (isNewUser: boolean) => {
                const layout = isNewUser
                    ? createNewUserLayout()
                    : createDefaultLayout();
                set({ currentLayout: layout });
            },

            resetLayout: () => {
                set({
                    currentLayout: createDefaultLayout(),
                    selectedWidget: undefined,
                });
            },

            exportLayout: (): string => {
                return JSON.stringify(get().currentLayout, null, 2);
            },

            importLayout: (data: string) => {
                try {
                    const layout = JSON.parse(data) as DashboardLayout;
                    set({
                        currentLayout: {
                            ...layout,
                            id: generateWidgetId(),
                            updatedAt: new Date(),
                        },
                    });
                } catch (error) {
                    console.error('Failed to import layout:', error);
                }
            },

            createNewLayout: (name: string) => {
                const newLayout: DashboardLayout = {
                    id: generateWidgetId(),
                    name,
                    widgets: [],
                    gridSize: {
                        columns: DEFAULT_GRID_CONFIG.columns,
                        rows: DEFAULT_GRID_CONFIG.rows,
                        cellSize: DEFAULT_GRID_CONFIG.cellSize,
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                set({ currentLayout: newLayout });
            },

            deleteLayout: (id: string) => {
                // Implementation would depend on how layouts are stored
                console.log('Deleting layout:', id);
            },

            renameLayout: (id: string, name: string) => {
                set((state) => ({
                    currentLayout: {
                        ...state.currentLayout,
                        name,
                        updatedAt: new Date(),
                    },
                }));
            },

            // Bulk operations
            removeSelectedWidgets: () => {
                const state = get();
                if (state.selectedWidget) {
                    state.removeWidget(state.selectedWidget);
                }
            },

            duplicateSelectedWidgets: () => {
                const state = get();
                if (state.selectedWidget) {
                    state.duplicateWidget(state.selectedWidget);
                }
            },
        }),
        {
            name: 'dashboard-store',
            partialize: (state) => ({
                currentLayout: state.currentLayout,
                gridConfig: state.gridConfig,
            }),
        },
    ),
);
