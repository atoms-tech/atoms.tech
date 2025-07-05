'use client';

import { useWorkspaceContext } from '@/hooks/useWorkspaceContext';
import { cn } from '@/lib/utils';

import { ContextHeader } from './ContextHeader';
import { ContextualNavigation } from './ContextualNavigation';
import { ContextualSearch } from './ContextualSearch';
import { RecentActivity } from './RecentActivity';
import { SmartFilters } from './SmartFilters';

interface IntelligentSidebarProps {
    className?: string;
}

export function IntelligentSidebar({ className }: IntelligentSidebarProps) {
    const context = useWorkspaceContext();

    const handleSearch = (query: string) => {
        console.log('Search query:', query, 'in scope:', context.searchScope);
        // TODO: Implement actual search functionality
    };

    const handleSearchSelect = (result: any) => {
        console.log('Selected search result:', result);
        // TODO: Navigate to selected result
    };

    return (
        <div className={cn('flex flex-col', className)}>
            {/* Context Header - shows current workspace context */}
            <ContextHeader context={context} />

            {/* Contextual Search - adapts to current context */}
            <div className="px-3 py-3">
                <ContextualSearch
                    placeholder={context.searchPlaceholder}
                    scope={context.searchScope}
                    onSearch={handleSearch}
                    onSelect={handleSearchSelect}
                />
            </div>

            {/* Recent Activity - shows recent items across contexts */}
            <div className="flex-1 overflow-y-auto">
                <RecentActivity className="mb-6" />

                {/* Contextual Navigation - adapts based on current location */}
                <ContextualNavigation context={context} className="mb-6" />

                {/* Smart Filters - enterprise-scale filtering */}
                <SmartFilters context={context} />
            </div>
        </div>
    );
}
