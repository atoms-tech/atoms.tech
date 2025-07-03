import {
    BarChart3,
    Calendar,
    Clock,
    FolderOpen,
    Lightbulb,
    MessageSquare,
    Rocket,
    Settings,
    Target,
    Users,
    Zap,
} from 'lucide-react';
import { createElement } from 'react';

import { AISuggestionsWidget } from '@/components/custom/Dashboard/widgets/AISuggestionsWidget';
import { AnalyticsWidget } from '@/components/custom/Dashboard/widgets/AnalyticsWidget';
import { CalendarWidget } from '@/components/custom/Dashboard/widgets/CalendarWidget';
import { NotesWidget } from '@/components/custom/Dashboard/widgets/NotesWidget';
import { ProjectsWidget } from '@/components/custom/Dashboard/widgets/ProjectsWidget';
// Import widget components
import { QuickActionsWidget } from '@/components/custom/Dashboard/widgets/QuickActionsWidget';
import { RecentActivityWidget } from '@/components/custom/Dashboard/widgets/RecentActivityWidget';
import { TasksWidget } from '@/components/custom/Dashboard/widgets/TasksWidget';
import { TeamMembersWidget } from '@/components/custom/Dashboard/widgets/TeamMembersWidget';
import { WidgetDefinition } from '@/types/dashboard.types';

import {
    DEFAULT_WIDGET_SIZES,
    createWidgetDefinition,
} from './widget-registry';

// Define all available widgets
export const CORE_WIDGETS: WidgetDefinition[] = [
    createWidgetDefinition({
        type: 'quick-actions',
        name: 'Quick Actions',
        description: 'Fast access to common tasks and shortcuts',
        icon: createElement(Zap, { className: 'h-5 w-5' }),
        category: 'productivity',
        component: QuickActionsWidget,
        defaultSize: {
            ...DEFAULT_WIDGET_SIZES.wide,
            height: 250,
        },
        configSchema: {
            layout: {
                type: 'select',
                label: 'Layout',
                description: 'How to display the action buttons',
                default: 'grid',
                options: [
                    { label: 'Grid', value: 'grid' },
                    { label: 'List', value: 'list' },
                    { label: 'Compact', value: 'compact' },
                ],
            },
            showShortcuts: {
                type: 'boolean',
                label: 'Show Keyboard Shortcuts',
                description: 'Display keyboard shortcuts on action buttons',
                default: true,
            },
        },
        tags: ['actions', 'shortcuts', 'productivity', 'navigation'],
    }),

    createWidgetDefinition({
        type: 'analytics-dashboard',
        name: 'Analytics Dashboard',
        description: 'Key metrics and performance indicators',
        icon: createElement(BarChart3, { className: 'h-5 w-5' }),
        category: 'analytics',
        component: AnalyticsWidget,
        defaultSize: DEFAULT_WIDGET_SIZES.large,
        configSchema: {
            displayMode: {
                type: 'select',
                label: 'Display Mode',
                description: 'How much detail to show',
                default: 'detailed',
                options: [
                    { label: 'Compact', value: 'compact' },
                    { label: 'Standard', value: 'standard' },
                    { label: 'Detailed', value: 'detailed' },
                ],
            },
            showTrends: {
                type: 'boolean',
                label: 'Show Trend Indicators',
                description: 'Display up/down arrows for metric changes',
                default: true,
            },
        },
        tags: ['analytics', 'metrics', 'dashboard', 'statistics'],
    }),

    createWidgetDefinition({
        type: 'recent-activity',
        name: 'Recent Activity',
        description: 'Latest actions and updates across your projects',
        icon: createElement(Clock, { className: 'h-5 w-5' }),
        category: 'communication',
        component: RecentActivityWidget,
        defaultSize: {
            ...DEFAULT_WIDGET_SIZES.medium,
            height: 350,
        },
        configSchema: {
            maxItems: {
                type: 'range',
                label: 'Maximum Items',
                description: 'Number of activities to display',
                default: 5,
                min: 3,
                max: 20,
                step: 1,
            },
            showProjects: {
                type: 'boolean',
                label: 'Show Project Names',
                description: 'Display which project each activity belongs to',
                default: true,
            },
            showUsers: {
                type: 'boolean',
                label: 'Show User Names',
                description: 'Display who performed each activity',
                default: true,
            },
            showTimestamps: {
                type: 'boolean',
                label: 'Show Timestamps',
                description: 'Display when each activity occurred',
                default: true,
            },
        },
        tags: ['activity', 'timeline', 'updates', 'history'],
    }),

    createWidgetDefinition({
        type: 'projects-overview',
        name: 'Projects Overview',
        description: 'Quick access to your projects and their status',
        icon: createElement(FolderOpen, { className: 'h-5 w-5' }),
        category: 'project-management',
        component: ProjectsWidget,
        defaultSize: {
            ...DEFAULT_WIDGET_SIZES.large,
            height: 400,
        },
        configSchema: {
            maxItems: {
                type: 'range',
                label: 'Maximum Projects',
                description: 'Number of projects to display',
                default: 6,
                min: 3,
                max: 12,
                step: 1,
            },
            viewMode: {
                type: 'select',
                label: 'View Mode',
                description: 'How to display the projects',
                default: 'grid',
                options: [
                    { label: 'Grid', value: 'grid' },
                    { label: 'List', value: 'list' },
                ],
            },
            showStats: {
                type: 'boolean',
                label: 'Show Statistics',
                description: 'Display requirement count and team size',
                default: true,
            },
            showOrganization: {
                type: 'boolean',
                label: 'Show Organization',
                description:
                    'Display which organization each project belongs to',
                default: true,
            },
        },
        tags: ['projects', 'overview', 'management', 'status'],
    }),


    // Additional utility widgets
    createWidgetDefinition({
        type: 'team-members',
        name: 'Team Members',
        description: 'View and manage team members across projects',
        icon: createElement(Users, { className: 'h-5 w-5' }),
        category: 'communication',
        component: TeamMembersWidget,
        defaultSize: DEFAULT_WIDGET_SIZES.medium,
        configSchema: {
            maxMembers: {
                type: 'range',
                label: 'Maximum Members',
                description: 'Number of team members to display',
                default: 6,
                min: 3,
                max: 12,
                step: 1,
            },
            showStatus: {
                type: 'boolean',
                label: 'Show Online Status',
                description: 'Display online/offline status indicators',
                default: true,
            },
            showProjects: {
                type: 'boolean',
                label: 'Show Project Tags',
                description: 'Display project assignments for each member',
                default: true,
            },
        },
        tags: ['team', 'members', 'collaboration', 'users'],
    }),

    createWidgetDefinition({
        type: 'calendar-events',
        name: 'Calendar Events',
        description: 'Upcoming deadlines and important dates',
        icon: createElement(Calendar, { className: 'h-5 w-5' }),
        category: 'utilities',
        component: CalendarWidget,
        defaultSize: DEFAULT_WIDGET_SIZES.medium,
        configSchema: {
            viewMode: {
                type: 'select',
                label: 'View Mode',
                description: 'How to display the calendar',
                default: 'month',
                options: [
                    { label: 'Month View', value: 'month' },
                    { label: 'Week View', value: 'week' },
                    { label: 'Agenda View', value: 'agenda' },
                ],
            },
            showWeekends: {
                type: 'boolean',
                label: 'Show Weekends',
                description: 'Display Saturday and Sunday',
                default: true,
            },
            highlightToday: {
                type: 'boolean',
                label: 'Highlight Today',
                description: 'Highlight the current date',
                default: true,
            },
        },
        tags: ['calendar', 'events', 'deadlines', 'schedule'],
    }),

    createWidgetDefinition({
        type: 'notifications',
        name: 'Notifications',
        description: 'Important alerts and system notifications',
        icon: createElement(MessageSquare, { className: 'h-5 w-5' }),
        category: 'communication',
        component: RecentActivityWidget, // Placeholder - would need actual component
        defaultSize: DEFAULT_WIDGET_SIZES.medium,
        tags: ['notifications', 'alerts', 'messages', 'updates'],
    }),

    createWidgetDefinition({
        type: 'tasks-manager',
        name: 'Tasks Manager',
        description: 'Track and manage your tasks and to-dos',
        icon: createElement(Target, { className: 'h-5 w-5' }),
        category: 'productivity',
        component: TasksWidget,
        defaultSize: DEFAULT_WIDGET_SIZES.medium,
        configSchema: {
            maxTasks: {
                type: 'range',
                label: 'Maximum Tasks',
                description: 'Number of tasks to display',
                default: 5,
                min: 3,
                max: 15,
                step: 1,
            },
            showCompleted: {
                type: 'boolean',
                label: 'Show Completed Tasks',
                description: 'Display completed tasks in the list',
                default: true,
            },
            showPriority: {
                type: 'boolean',
                label: 'Show Priority Indicators',
                description: 'Display priority colors and labels',
                default: true,
            },
        },
        tags: ['tasks', 'todo', 'productivity', 'management'],
    }),

    createWidgetDefinition({
        type: 'notes-quick',
        name: 'Quick Notes',
        description: 'Capture and organize your thoughts and ideas',
        icon: createElement(MessageSquare, { className: 'h-5 w-5' }),
        category: 'productivity',
        component: NotesWidget,
        defaultSize: DEFAULT_WIDGET_SIZES.medium,
        configSchema: {
            maxNotes: {
                type: 'range',
                label: 'Maximum Notes',
                description: 'Number of notes to display',
                default: 5,
                min: 3,
                max: 10,
                step: 1,
            },
            showSearch: {
                type: 'boolean',
                label: 'Show Search Bar',
                description: 'Display search functionality',
                default: true,
            },
            allowEdit: {
                type: 'boolean',
                label: 'Allow Inline Editing',
                description: 'Enable click-to-edit functionality',
                default: true,
            },
        },
        tags: ['notes', 'ideas', 'writing', 'productivity'],
    }),

    createWidgetDefinition({
        type: 'ai-suggestions',
        name: 'AI Suggestions',
        description: 'Smart recommendations to improve your workflow',
        icon: createElement(Lightbulb, { className: 'h-5 w-5' }),
        category: 'ai-tools',
        component: AISuggestionsWidget,
        defaultSize: DEFAULT_WIDGET_SIZES.medium,
        configSchema: {
            maxSuggestions: {
                type: 'range',
                label: 'Maximum Suggestions',
                description: 'Number of AI suggestions to display',
                default: 4,
                min: 2,
                max: 8,
                step: 1,
            },
            showPriority: {
                type: 'boolean',
                label: 'Show Priority Indicators',
                description: 'Display priority levels for suggestions',
                default: true,
            },
            showConfidence: {
                type: 'boolean',
                label: 'Show Confidence Scores',
                description: 'Display AI confidence percentages',
                default: true,
            },
        },
        tags: ['ai', 'suggestions', 'recommendations', 'smart'],
    }),

    createWidgetDefinition({
        type: 'system-status',
        name: 'System Status',
        description: 'Monitor system health and performance',
        icon: createElement(Settings, { className: 'h-5 w-5' }),
        category: 'utilities',
        component: AnalyticsWidget, // Placeholder - would need actual component
        defaultSize: DEFAULT_WIDGET_SIZES.small,
        tags: ['system', 'status', 'health', 'monitoring'],
    }),
];

// Function to initialize all core widgets
export function initializeCoreWidgets() {
    return CORE_WIDGETS;
}

// Helper to get widget by type
export function getCoreWidget(type: string): WidgetDefinition | undefined {
    return CORE_WIDGETS.find((widget) => widget.type === type);
}

// Helper to get widgets by category
export function getCoreWidgetsByCategory(category: string): WidgetDefinition[] {
    return CORE_WIDGETS.filter((widget) => widget.category === category);
}
