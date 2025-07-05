'use client';

import { formatDistanceToNow } from 'date-fns';
import { Clock, FileText, Folder, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { activityService, ActivityItem } from '@/lib/services/activity.service';
import { cn } from '@/lib/utils';

interface RecentActivityProps {
    className?: string;
    maxItems?: number;
}

export function RecentActivity({ className, maxItems = 8 }: RecentActivityProps) {
    const [recentItems, setRecentItems] = useState<ActivityItem[]>([]);

    useEffect(() => {
        // Load recent activity from service
        const items = activityService.getRecentActivity(maxItems);
        setRecentItems(items);

        // If no items exist, add some sample data for demo
        if (items.length === 0) {
            const sampleItems = [
                {
                    type: 'document' as const,
                    title: 'API Requirements Document',
                    context: 'Project Alpha › Engineering',
                    url: '/org/123/project/456/doc/789',
                    isActive: true,
                },
                {
                    type: 'project' as const,
                    title: 'Sprint Planning Notes',
                    context: 'Engineering Team',
                    url: '/org/123/project/456',
                },
                {
                    type: 'requirement' as const,
                    title: 'Security Review Checklist',
                    context: 'Project Alpha',
                    url: '/org/123/requirements/101',
                },
            ];

            // Add sample items with staggered timestamps
            sampleItems.forEach((item, index) => {
                setTimeout(() => {
                    activityService.trackActivity(item);
                    setRecentItems(activityService.getRecentActivity(maxItems));
                }, index * 100);
            });
        }
    }, [maxItems]);

    const groupedItems = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const groups = {
            today: [] as ActivityItem[],
            yesterday: [] as ActivityItem[],
            thisWeek: [] as ActivityItem[],
            earlier: [] as ActivityItem[],
        };

        recentItems.forEach((item) => {
            const itemDate = new Date(
                item.lastAccessed.getFullYear(),
                item.lastAccessed.getMonth(),
                item.lastAccessed.getDate()
            );

            if (itemDate.getTime() === today.getTime()) {
                groups.today.push(item);
            } else if (itemDate.getTime() === yesterday.getTime()) {
                groups.yesterday.push(item);
            } else if (itemDate >= thisWeek) {
                groups.thisWeek.push(item);
            } else {
                groups.earlier.push(item);
            }
        });

        return groups;
    }, [recentItems]);

    const getTypeIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'organization':
                return <Users className="h-3.5 w-3.5" />;
            case 'project':
                return <Folder className="h-3.5 w-3.5" />;
            case 'document':
                return <FileText className="h-3.5 w-3.5" />;
            case 'requirement':
                return <FileText className="h-3.5 w-3.5" />;
            default:
                return <FileText className="h-3.5 w-3.5" />;
        }
    };

    const renderGroup = (title: string, items: ActivityItem[]) => {
        if (items.length === 0) return null;

        return (
            <div key={title} className="mb-4">
                <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    {title}
                </h4>
                <div className="space-y-1">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            href={item.url}
                            className={cn(
                                'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent/50 transition-colors group',
                                item.isActive && 'bg-accent/30'
                            )}
                        >
                            <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                                {getTypeIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs truncate group-hover:text-foreground transition-colors">
                                    {item.title}
                                </div>
                                {item.context && (
                                    <div className="text-xs text-muted-foreground truncate">
                                        {item.context}
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                {formatDistanceToNow(item.lastAccessed, { addSuffix: true })}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        );
    };

    const hasAnyItems = Object.values(groupedItems).some(group => group.length > 0);

    if (!hasAnyItems) {
        return (
            <div className={cn('px-2', className)}>
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                    <Clock className="h-4 w-4" />
                    <span>No recent activity</span>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('px-2', className)}>
            <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Recent Activity</h3>
            </div>
            <div className="space-y-2">
                {renderGroup('Today', groupedItems.today)}
                {renderGroup('Yesterday', groupedItems.yesterday)}
                {renderGroup('This Week', groupedItems.thisWeek)}
                {renderGroup('Earlier', groupedItems.earlier)}
            </div>
        </div>
    );
}
