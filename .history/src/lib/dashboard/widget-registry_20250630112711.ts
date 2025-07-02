import { WidgetDefinition, WidgetRegistry, WidgetCategory } from '@/types/dashboard.types';

class WidgetRegistryImpl implements WidgetRegistry {
    private widgets: Map<string, WidgetDefinition> = new Map();

    register(definition: WidgetDefinition): void {
        if (this.widgets.has(definition.type)) {
            console.warn(`Widget type "${definition.type}" is already registered. Overwriting.`);
        }
        this.widgets.set(definition.type, definition);
    }

    unregister(type: string): void {
        this.widgets.delete(type);
    }

    get(type: string): WidgetDefinition | undefined {
        return this.widgets.get(type);
    }

    getAll(): WidgetDefinition[] {
        return Array.from(this.widgets.values());
    }

    getByCategory(category: WidgetCategory): WidgetDefinition[] {
        return this.getAll().filter(widget => widget.category === category);
    }

    search(query: string): WidgetDefinition[] {
        const lowercaseQuery = query.toLowerCase();
        return this.getAll().filter(widget => 
            widget.name.toLowerCase().includes(lowercaseQuery) ||
            widget.description.toLowerCase().includes(lowercaseQuery) ||
            widget.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
    }

    getCategories(): WidgetCategory[] {
        const categories = new Set<WidgetCategory>();
        this.getAll().forEach(widget => categories.add(widget.category));
        return Array.from(categories);
    }

    getWidgetCount(): number {
        return this.widgets.size;
    }

    clear(): void {
        this.widgets.clear();
    }
}

// Create singleton instance
export const widgetRegistry = new WidgetRegistryImpl();

// Helper function to register multiple widgets at once
export function registerWidgets(definitions: WidgetDefinition[]): void {
    definitions.forEach(definition => widgetRegistry.register(definition));
}

// Helper function to create a widget definition with defaults
export function createWidgetDefinition(
    partial: Omit<WidgetDefinition, 'defaultSize'> & { defaultSize?: Partial<WidgetDefinition['defaultSize']> }
): WidgetDefinition {
    return {
        defaultSize: {
            width: 300,
            height: 200,
            minWidth: 200,
            minHeight: 150,
            ...partial.defaultSize
        },
        tags: [],
        isPremium: false,
        ...partial,
        defaultSize: {
            width: 300,
            height: 200,
            minWidth: 200,
            minHeight: 150,
            ...partial.defaultSize
        }
    };
}

// Widget categories with metadata
export const WIDGET_CATEGORIES: Record<WidgetCategory, { name: string; description: string; icon: string }> = {
    'productivity': {
        name: 'Productivity',
        description: 'Tools to boost your productivity',
        icon: '⚡'
    },
    'analytics': {
        name: 'Analytics',
        description: 'Data visualization and metrics',
        icon: '📊'
    },
    'communication': {
        name: 'Communication',
        description: 'Team collaboration and messaging',
        icon: '💬'
    },
    'project-management': {
        name: 'Project Management',
        description: 'Project tracking and organization',
        icon: '📋'
    },
    'ai-tools': {
        name: 'AI Tools',
        description: 'AI-powered features and automation',
        icon: '🤖'
    },
    'utilities': {
        name: 'Utilities',
        description: 'Helpful tools and utilities',
        icon: '🔧'
    },
    'custom': {
        name: 'Custom',
        description: 'Custom and third-party widgets',
        icon: '🎨'
    }
};

// Default widget sizes for different types
export const DEFAULT_WIDGET_SIZES = {
    small: { width: 200, height: 150 },
    medium: { width: 300, height: 200 },
    large: { width: 400, height: 300 },
    wide: { width: 600, height: 200 },
    tall: { width: 300, height: 400 },
    full: { width: 800, height: 600 }
};

// Utility functions for widget management
export function generateWidgetId(): string {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateWidgetDefinition(definition: WidgetDefinition): boolean {
    const required = ['type', 'name', 'description', 'category', 'component'];
    return required.every(field => definition[field as keyof WidgetDefinition] !== undefined);
}

export function getWidgetDisplayName(type: string): string {
    const widget = widgetRegistry.get(type);
    return widget?.name || type;
}

export function isWidgetAvailable(type: string): boolean {
    return widgetRegistry.get(type) !== undefined;
}
