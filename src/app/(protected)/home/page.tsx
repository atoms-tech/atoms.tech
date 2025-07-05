'use client';

import { motion } from 'framer-motion';
import {
    Building,
    Clock,
    FileText,
    FolderOpen,
    Plus,
    Search,
    Settings,
    Star,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { SettingsSection } from '@/components/custom/SettingsSection';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { KeyboardShortcutsDialog } from '@/components/ui/keyboard-shortcuts-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LayoutView from '@/components/views/LayoutView';
import {
    useRecentActivity,
    useSearchRecentActivity,
    type RecentItem,
} from '@/hooks/queries/useRecentActivity';
import {
    defaultKeyboardShortcuts,
    useKeyboardNavigation,
    type KeyboardShortcut,
} from '@/hooks/useKeyboardNavigation';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';

export default function HomePage() {
    const { user, profile } = useUser();
    const { organizations: _organizations } = useOrganization();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('recent');

    // Get recent activity data
    const { data: _recentItems = [], isLoading } = useRecentActivity();
    const { data: filteredItems = [] } = useSearchRecentActivity(searchQuery);

    const handleCreateNew = useCallback(() => {
        // Navigate to organization selection or create new document flow
        router.push('/home/user');
    }, [router]);

    const handleItemClick = useCallback(
        (item: RecentItem) => {
            router.push(item.path);
        },
        [router],
    );

    // Set up keyboard navigation with custom shortcuts
    const homePageShortcuts: KeyboardShortcut[] = [
        ...defaultKeyboardShortcuts,
        {
            key: '/',
            description: 'Focus search',
            action: () => {
                if (typeof window === 'undefined') return;

                const searchInput = document.querySelector(
                    'input[placeholder*="Search"]',
                ) as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                }
            },
            category: 'Navigation',
        },
        {
            key: 'n',
            ctrlKey: true,
            description: 'Create new document',
            action: handleCreateNew,
            category: 'Actions',
        },
        {
            key: '1',
            description: 'Switch to Recent tab',
            action: () => setActiveTab('recent'),
            category: 'Navigation',
        },
        {
            key: '2',
            description: 'Switch to Starred tab',
            action: () => setActiveTab('starred'),
            category: 'Navigation',
        },
        {
            key: '3',
            description: 'Switch to Settings tab',
            action: () => setActiveTab('settings'),
            category: 'Navigation',
        },
    ];

    const { isHelpVisible, setIsHelpVisible } = useKeyboardNavigation(
        homePageShortcuts,
        {
            enableGlobalShortcuts: true,
            enableArrowNavigation: true,
            enableTabNavigation: true,
            enableEscapeHandling: true,
        },
    );

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60),
        );

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
        return date.toLocaleDateString();
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'document':
                return <FileText className="h-4 w-4" />;
            case 'project':
                return <FolderOpen className="h-4 w-4" />;
            case 'requirement':
                return <Star className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    return (
        <LayoutView>
            <div className="container mx-auto p-6 max-w-6xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Welcome back,{' '}
                                {profile?.full_name ||
                                    user?.email?.split('@')[0]}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Pick up where you left off and explore your
                                recent work
                            </p>
                        </div>
                        <Button
                            size="lg"
                            onClick={handleCreateNew}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create New
                        </Button>
                    </div>
                </motion.div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-6"
                >
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search documents, projects, and requirements..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                            aria-label="Search documents, projects, and requirements (Press / to focus)"
                            role="searchbox"
                        />
                    </div>
                </motion.div>

                {/* Content Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-3 keyboard-nav-container">
                            <TabsTrigger
                                value="recent"
                                className="flex items-center gap-2 keyboard-nav-item"
                                role="tab"
                                aria-label="Recent activity tab (Press 1)"
                            >
                                <Clock className="h-4 w-4" />
                                Recent
                            </TabsTrigger>
                            <TabsTrigger
                                value="starred"
                                className="flex items-center gap-2 keyboard-nav-item"
                                role="tab"
                                aria-label="Starred items tab (Press 2)"
                            >
                                <Star className="h-4 w-4" />
                                Starred
                            </TabsTrigger>
                            <TabsTrigger
                                value="settings"
                                className="flex items-center gap-2 keyboard-nav-item"
                                role="tab"
                                aria-label="Settings tab (Press 3)"
                            >
                                <Settings className="h-4 w-4" />
                                Settings
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="recent" className="mt-6">
                            <RecentActivitySection
                                items={filteredItems}
                                onItemClick={handleItemClick}
                                getTimeAgo={getTimeAgo}
                                getItemIcon={getItemIcon}
                                isLoading={isLoading}
                            />
                        </TabsContent>

                        <TabsContent value="starred" className="mt-6">
                            <div className="text-center py-12 text-muted-foreground">
                                <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Starred items will appear here</p>
                                <p className="text-sm mt-2">
                                    Star documents and projects to access them
                                    quickly
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="settings" className="mt-6">
                            <SettingsSection />
                        </TabsContent>
                    </Tabs>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-8"
                >
                    <h2 className="text-xl font-semibold mb-4">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-5 w-5" />
                                    New Document
                                </CardTitle>
                                <CardDescription>
                                    Create a new requirements document
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FolderOpen className="h-5 w-5" />
                                    New Project
                                </CardTitle>
                                <CardDescription>
                                    Start a new project workspace
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Link href="/home/user">
                            <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Building className="h-5 w-5" />
                                        Organizations
                                    </CardTitle>
                                    <CardDescription>
                                        View all organizations and projects
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Keyboard Shortcuts Dialog */}
            <KeyboardShortcutsDialog
                isOpen={isHelpVisible}
                onClose={() => setIsHelpVisible(false)}
                shortcuts={homePageShortcuts}
            />
        </LayoutView>
    );
}

interface RecentActivitySectionProps {
    items: RecentItem[];
    onItemClick: (item: RecentItem) => void;
    getTimeAgo: (dateString: string) => string;
    getItemIcon: (type: string) => React.ReactNode;
    isLoading?: boolean;
}

function RecentActivitySection({
    items,
    onItemClick,
    getTimeAgo,
    getItemIcon,
    isLoading = false,
}: RecentActivitySectionProps) {
    if (isLoading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                    <Card key={index} className="animate-pulse">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-4 h-4 bg-muted rounded" />
                                    <div className="flex-1">
                                        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                                        <div className="h-3 bg-muted rounded w-1/2" />
                                    </div>
                                </div>
                                <div className="w-16 h-3 bg-muted rounded" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }
    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm mt-2">
                    Start working on documents and projects to see them here
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2 keyboard-nav-container">
            {items.map((item, index) => (
                <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                    <Card
                        className="cursor-pointer hover:shadow-md transition-all duration-200 hover:bg-muted/50 keyboard-nav-item"
                        onClick={() => onItemClick(item)}
                        tabIndex={0}
                        role="button"
                        aria-label={`Open ${item.title} in ${item.organization}${item.projectName ? ` - ${item.projectName}` : ''}`}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onItemClick(item);
                            }
                        }}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="text-muted-foreground">
                                        {getItemIcon(item.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>{item.organization}</span>
                                            {item.projectName && (
                                                <>
                                                    <span>•</span>
                                                    <span>
                                                        {item.projectName}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {getTimeAgo(item.lastModified)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
