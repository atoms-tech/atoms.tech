import { ReactNode } from 'react';

export interface WidgetSize {
    width: number;
    height: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
}

export interface WidgetPosition {
    x: number;
    y: number;
}

export interface WidgetConfig {
    [key: string]: unknown;
}

export interface WidgetInstance {
    id: string;
    type: string;
    position: WidgetPosition;
    size: WidgetSize;
    config: WidgetConfig;
    isVisible: boolean;
    isLocked?: boolean;
    zIndex?: number;
}

export interface WidgetDefinition {
    type: string;
    name: string;
    description: string;
    icon: ReactNode;
    category: WidgetCategory;
    defaultSize: WidgetSize;
    component: React.ComponentType<WidgetProps>;
    configSchema?: WidgetConfigSchema;
    previewImage?: string;
    tags?: string[];
    isPremium?: boolean;
}

export interface WidgetProps {
    instance: WidgetInstance;
    onConfigChange: (config: WidgetConfig) => void;
    onResize?: (size: WidgetSize) => void;
    onMove?: (position: WidgetPosition) => void;
    onRemove?: () => void;
    isEditing?: boolean;
    data?: unknown;
}

export interface WidgetConfigSchema {
    [key: string]: {
        type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'range';
        label: string;
        description?: string;
        default?: unknown;
        options?: Array<{ label: string; value: unknown }>;
        min?: number;
        max?: number;
        step?: number;
        required?: boolean;
    };
}

export type WidgetCategory =
    | 'productivity'
    | 'analytics'
    | 'communication'
    | 'project-management'
    | 'ai-tools'
    | 'utilities'
    | 'custom';

export interface DashboardLayout {
    id: string;
    name: string;
    description?: string;
    widgets: WidgetInstance[];
    gridSize: {
        columns: number;
        rows: number;
        cellSize: number;
    };
    theme?: string;
    isDefault?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface DashboardState {
    currentLayout: DashboardLayout;
    availableWidgets: WidgetDefinition[];
    isEditMode: boolean;
    selectedWidget?: string;
    draggedWidget?: WidgetInstance;
    clipboard?: WidgetInstance[];
}

export interface WidgetRegistry {
    register: (definition: WidgetDefinition) => void;
    unregister: (type: string) => void;
    get: (type: string) => WidgetDefinition | undefined;
    getAll: () => WidgetDefinition[];
    getByCategory: (category: WidgetCategory) => WidgetDefinition[];
    search: (query: string) => WidgetDefinition[];
}

export interface DashboardActions {
    addWidget: (type: string, position?: WidgetPosition) => void;
    removeWidget: (id: string) => void;
    updateWidget: (id: string, updates: Partial<WidgetInstance>) => void;
    moveWidget: (id: string, position: WidgetPosition) => void;
    resizeWidget: (id: string, size: WidgetSize) => void;
    duplicateWidget: (id: string) => void;
    toggleEditMode: () => void;
    saveLayout: () => void;
    loadLayout: (layoutId: string) => void;
    resetLayout: () => void;
    exportLayout: () => string;
    importLayout: (data: string) => void;
}

export interface WidgetContextMenuAction {
    label: string;
    icon?: ReactNode;
    action: () => void;
    disabled?: boolean;
    separator?: boolean;
}

export interface GridConfig {
    columns: number;
    rows: number;
    cellSize: number;
    gap: number;
    snapToGrid: boolean;
}

export interface DashboardTheme {
    id: string;
    name: string;
    colors: {
        background: string;
        surface: string;
        border: string;
        text: string;
        accent: string;
    };
    borderRadius: number;
    shadows: boolean;
    animations: boolean;
}

// Organization and Project types for widgets
export interface OrganizationData {
    id: string;
    name: string;
    type: 'enterprise' | 'team' | 'individual';
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface ProjectData {
    id: string;
    name: string;
    status: 'active' | 'inactive' | 'completed';
    organization_id: string;
    created_at: string;
    updated_at: string;
}

export interface WidgetDataProps {
    organizations?: OrganizationData[];
    projects?: ProjectData[];
    userId?: string;
    [key: string]: unknown;
}

// Config field option type
export interface ConfigFieldOption {
    label: string;
    value: unknown;
}
