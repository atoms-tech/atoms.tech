export interface ActivityItem {
    id: string;
    type: 'organization' | 'project' | 'document' | 'requirement';
    title: string;
    context?: string;
    lastAccessed: Date;
    url: string;
    isActive?: boolean;
    userId?: string;
    orgId?: string;
    projectId?: string;
}

class ActivityService {
    private static instance: ActivityService;
    private activities: ActivityItem[] = [];
    private readonly STORAGE_KEY = 'atoms_recent_activity';
    private readonly MAX_ITEMS = 50;

    private constructor() {
        this.loadFromStorage();
    }

    static getInstance(): ActivityService {
        if (!ActivityService.instance) {
            ActivityService.instance = new ActivityService();
        }
        return ActivityService.instance;
    }

    private loadFromStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as ActivityItem[];
                this.activities = parsed.map((item) => ({
                    ...item,
                    lastAccessed: new Date(item.lastAccessed),
                }));
            }
        } catch (error) {
            console.error('Failed to load activity from storage:', error);
            this.activities = [];
        }
    }

    private saveToStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify(this.activities),
            );
        } catch (error) {
            console.error('Failed to save activity to storage:', error);
        }
    }

    trackActivity(item: Omit<ActivityItem, 'id' | 'lastAccessed'>): void {
        const now = new Date();
        const existingIndex = this.activities.findIndex(
            (activity) => activity.url === item.url,
        );

        if (existingIndex >= 0) {
            // Update existing activity
            this.activities[existingIndex] = {
                ...this.activities[existingIndex],
                ...item,
                lastAccessed: now,
            };
        } else {
            // Add new activity
            const newActivity: ActivityItem = {
                ...item,
                id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                lastAccessed: now,
            };
            this.activities.unshift(newActivity);
        }

        // Keep only the most recent items
        this.activities = this.activities
            .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
            .slice(0, this.MAX_ITEMS);

        this.saveToStorage();
    }

    getRecentActivity(maxItems: number = 20): ActivityItem[] {
        return this.activities
            .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
            .slice(0, maxItems);
    }

    getActivityByContext(
        context: {
            orgId?: string;
            projectId?: string;
            type?: ActivityItem['type'];
        },
        maxItems: number = 10,
    ): ActivityItem[] {
        return this.activities
            .filter((activity) => {
                if (context.orgId && activity.orgId !== context.orgId)
                    return false;
                if (
                    context.projectId &&
                    activity.projectId !== context.projectId
                )
                    return false;
                if (context.type && activity.type !== context.type)
                    return false;
                return true;
            })
            .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
            .slice(0, maxItems);
    }

    clearActivity(): void {
        this.activities = [];
        this.saveToStorage();
    }

    removeActivity(id: string): void {
        this.activities = this.activities.filter(
            (activity) => activity.id !== id,
        );
        this.saveToStorage();
    }
}

export const activityService = ActivityService.getInstance();

// Hook for React components
export function useActivityTracking() {
    const trackActivity = (item: Omit<ActivityItem, 'id' | 'lastAccessed'>) => {
        activityService.trackActivity(item);
    };

    return { trackActivity };
}
