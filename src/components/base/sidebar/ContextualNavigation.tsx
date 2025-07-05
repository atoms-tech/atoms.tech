'use client';

import {
    ChevronDown,
    ChevronRight,
    FileText,
    Folder,
    Settings,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { WorkspaceContext } from '../../../hooks/useWorkspaceContext';

interface NavigationItem {
    id: string;
    label: string;
    count?: number;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive?: boolean;
    children?: NavigationItem[];
}

interface ContextualNavigationProps {
    context: WorkspaceContext;
    className?: string;
}

export function ContextualNavigation({
    context,
    className,
}: ContextualNavigationProps) {
    const pathname = usePathname();
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['main'])
    );

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const getNavigationItems = (): NavigationItem[] => {
        switch (context.level) {
            case 'home':
                return [
                    {
                        id: 'organizations',
                        label: 'Organizations',
                        count: 12,
                        url: '/home/user',
                        icon: Users,
                        isActive: pathname === '/home/user',
                    },
                    {
                        id: 'recent',
                        label: 'Recent Projects',
                        count: 8,
                        url: '/home/recent',
                        icon: Folder,
                        isActive: pathname === '/home/recent',
                    },
                ];

            case 'org':
                return [
                    {
                        id: 'projects',
                        label: 'Projects',
                        count: 23,
                        url: `/org/${context.orgId}`,
                        icon: Folder,
                        isActive: pathname === `/org/${context.orgId}`,
                    },
                    {
                        id: 'requirements',
                        label: 'Requirements',
                        count: 156,
                        url: `/org/${context.orgId}/requirements`,
                        icon: FileText,
                        isActive: pathname.includes('/requirements'),
                    },
                    {
                        id: 'members',
                        label: 'Team Members',
                        count: 12,
                        url: `/org/${context.orgId}/members`,
                        icon: Users,
                        isActive: pathname.includes('/members'),
                    },
                    {
                        id: 'settings',
                        label: 'Settings',
                        url: `/org/${context.orgId}/settings`,
                        icon: Settings,
                        isActive: pathname.includes('/settings'),
                    },
                ];

            case 'project':
                return [
                    {
                        id: 'overview',
                        label: 'Overview',
                        url: `/org/${context.orgId}/project/${context.projectId}`,
                        icon: Folder,
                        isActive: pathname === `/org/${context.orgId}/project/${context.projectId}`,
                    },
                    {
                        id: 'documents',
                        label: 'Documents',
                        count: 45,
                        url: `/org/${context.orgId}/project/${context.projectId}/documents`,
                        icon: FileText,
                        isActive: pathname.includes('/documents'),
                    },
                    {
                        id: 'requirements',
                        label: 'Requirements',
                        count: 23,
                        url: `/org/${context.orgId}/project/${context.projectId}/requirements`,
                        icon: FileText,
                        isActive: pathname.includes('/requirements'),
                    },
                    {
                        id: 'members',
                        label: 'Members',
                        count: 8,
                        url: `/org/${context.orgId}/project/${context.projectId}/members`,
                        icon: Users,
                        isActive: pathname.includes('/members'),
                    },
                ];

            case 'document':
                return [
                    {
                        id: 'outline',
                        label: 'Document Outline',
                        url: `#outline`,
                        icon: FileText,
                        isActive: false,
                    },
                    {
                        id: 'comments',
                        label: 'Comments',
                        count: 5,
                        url: `#comments`,
                        icon: FileText,
                        isActive: false,
                    },
                    {
                        id: 'related',
                        label: 'Related Documents',
                        count: 3,
                        url: `#related`,
                        icon: FileText,
                        isActive: false,
                    },
                ];

            default:
                return [];
        }
    };

    const navigationItems = getNavigationItems();

    if (navigationItems.length === 0) {
        return null;
    }

    const renderNavigationItem = (item: NavigationItem, level = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedSections.has(item.id);

        return (
            <div key={item.id}>
                <div className="flex items-center">
                    {hasChildren && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 mr-1"
                            onClick={() => toggleSection(item.id)}
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                            ) : (
                                <ChevronRight className="h-3 w-3" />
                            )}
                        </Button>
                    )}
                    <Link
                        href={item.url}
                        className={cn(
                            'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent/50 transition-colors flex-1',
                            item.isActive && 'bg-accent text-accent-foreground',
                            !hasChildren && 'ml-7'
                        )}
                        style={{ paddingLeft: `${level * 12 + 8}px` }}
                    >
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-xs flex-1">
                            {item.label}
                        </span>
                        {item.count !== undefined && (
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                {item.count}
                            </span>
                        )}
                    </Link>
                </div>
                {hasChildren && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                        {item.children!.map((child) =>
                            renderNavigationItem(child, level + 1)
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={cn('px-2', className)}>
            <div className="space-y-1">
                {navigationItems.map((item) => renderNavigationItem(item))}
            </div>
        </div>
    );
}
