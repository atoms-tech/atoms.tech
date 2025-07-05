'use client';

import { AlertCircle, Clock, Filter, User } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { WorkspaceContext } from '@/hooks/useWorkspaceContext';
import { cn } from '@/lib/utils';

interface SmartFilter {
    id: string;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
    isActive?: boolean;
}

interface SmartFiltersProps {
    context: WorkspaceContext;
    className?: string;
}

export function SmartFilters({ context, className }: SmartFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

    const toggleFilter = (filterId: string) => {
        setActiveFilters((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(filterId)) {
                newSet.delete(filterId);
            } else {
                newSet.add(filterId);
            }
            return newSet;
        });
    };

    const getSmartFilters = (): SmartFilter[] => {
        const baseFilters: SmartFilter[] = [
            {
                id: 'recent',
                label: 'Modified this week',
                count: 67,
                icon: Clock,
                isActive: activeFilters.has('recent'),
            },
            {
                id: 'assigned',
                label: 'Assigned to me',
                count: 12,
                icon: User,
                isActive: activeFilters.has('assigned'),
            },
            {
                id: 'priority',
                label: 'High priority',
                count: 8,
                icon: AlertCircle,
                isActive: activeFilters.has('priority'),
            },
        ];

        // Add context-specific filters
        switch (context.level) {
            case 'org':
                return [
                    ...baseFilters,
                    {
                        id: 'active-projects',
                        label: 'Active projects',
                        count: 23,
                        icon: Filter,
                        isActive: activeFilters.has('active-projects'),
                    },
                ];

            case 'project':
                return [
                    ...baseFilters,
                    {
                        id: 'in-review',
                        label: 'In review',
                        count: 5,
                        icon: Filter,
                        isActive: activeFilters.has('in-review'),
                    },
                ];

            default:
                return baseFilters;
        }
    };

    const smartFilters = getSmartFilters();

    if (smartFilters.length === 0) {
        return null;
    }

    return (
        <div className={cn('px-2', className)}>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        className="w-full justify-between h-auto p-2 hover:bg-accent/50"
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                Smart Filters
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {activeFilters.size > 0 &&
                                `${activeFilters.size} active`}
                        </div>
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-2">
                    {smartFilters.map((filter) => (
                        <Button
                            key={filter.id}
                            variant="ghost"
                            className={cn(
                                'w-full justify-start h-auto p-2 hover:bg-accent/50',
                                filter.isActive &&
                                    'bg-accent text-accent-foreground',
                            )}
                            onClick={() => toggleFilter(filter.id)}
                        >
                            <div className="flex items-center gap-2 flex-1">
                                <filter.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium flex-1 text-left">
                                    {filter.label}
                                </span>
                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                    {filter.count}
                                </span>
                            </div>
                        </Button>
                    ))}

                    {activeFilters.size > 0 && (
                        <Button
                            variant="ghost"
                            className="w-full justify-center h-auto p-2 text-xs text-muted-foreground hover:bg-accent/50"
                            onClick={() => setActiveFilters(new Set())}
                        >
                            Clear all filters
                        </Button>
                    )}
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
