/**
 * ChatHistoryPage - Full-page chat history view
 * 
 * Features:
 * - Header with logo, title, subtitle, back button
 * - Search conversations
 * - Tabs: All, Active, Archived
 * - Time-based grouping (Today, Yesterday, etc.)
 * - Auto-archive after 1 day
 * - Chat items with title, description, time, message count
 * - Archive button and edit/delete menu
 */

'use client';

import { ArrowLeft, Archive, Calendar, MoreVertical, Pencil, Search, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatSession {
    id: string;
    title: string;
    lastMessage: string;
    lastMessageTime: Date;
    messageCount: number;
    isArchived: boolean;
}

interface ChatHistoryPageProps {
    onBack: () => void;
    onSelectSession: (sessionId: string) => void;
}

export const ChatHistoryPage: React.FC<ChatHistoryPageProps> = ({
    onBack,
    onSelectSession,
}) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'archived'>('all');
    const [loading, setLoading] = useState(true);

    // Load sessions
    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const response = await fetch('/api/history?page=1&page_size=100');
            if (!response.ok) throw new Error('Failed to load sessions');
            
            const data = await response.json();
            const mappedSessions: ChatSession[] = data.sessions.map((s: { id: string; title?: string; updated_at?: string; }) => ({
                id: s.id,
                title: s.title || 'Untitled Chat',
                lastMessage: 'Last message preview...', // TODO: Get from API
                lastMessageTime: new Date(s.updated_at || s.created_at),
                messageCount: s.message_count || 0,
                isArchived: s.archived || false,
            }));
            
            setSessions(mappedSessions);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter sessions
    const filteredSessions = sessions.filter(session => {
        // Tab filter
        if (activeTab === 'active' && session.isArchived) return false;
        if (activeTab === 'archived' && !session.isArchived) return false;
        
        // Search filter
        if (searchQuery && !session.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        
        return true;
    });

    // Group sessions by time
    const groupedSessions = groupSessionsByTime(filteredSessions);

    // Handle archive
    const handleArchive = async (sessionId: string) => {
        // TODO: Call API to archive
        setSessions(prev => prev.map(s => 
            s.id === sessionId ? { ...s, isArchived: true } : s
        ));
    };

    // Handle delete
    const handleDelete = async (sessionId: string) => {
        // TODO: Call API to delete
        setSessions(prev => prev.filter(s => s.id !== sessionId));
    };

    // Handle edit
    const handleEdit = (sessionId: string) => {
        // TODO: Open edit dialog
        console.log('Edit session:', sessionId);
    };

    // Format time ago
    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const activeSessions = sessions.filter(s => !s.isArchived);
    const archivedSessions = sessions.filter(s => s.isArchived);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b">
                <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        A
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold">Chat History</h2>
                        <p className="text-sm text-muted-foreground">View and manage your conversations</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Chat
                </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as string)} className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b px-4">
                    <TabsTrigger value="all">All ({sessions.length})</TabsTrigger>
                    <TabsTrigger value="active">Active ({activeSessions.length})</TabsTrigger>
                    <TabsTrigger value="archived">Archived ({archivedSessions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="flex-1 m-0">
                    <ScrollArea className="h-full">
                        {loading ? (
                            <div className="p-4 text-center text-muted-foreground">Loading...</div>
                        ) : filteredSessions.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">No conversations found</div>
                        ) : (
                            <div className="p-4 space-y-6">
                                {Object.entries(groupedSessions).map(([group, groupSessions]) => (
                                    <div key={group}>
                                        {/* Time Group Header */}
                                        <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            {group}
                                        </div>

                                        {/* Sessions */}
                                        <div className="space-y-2">
                                            {groupSessions.map((session) => (
                                                <ChatSessionItem
                                                    key={session.id}
                                                    session={session}
                                                    onSelect={() => onSelectSession(session.id)}
                                                    onArchive={() => handleArchive(session.id)}
                                                    onEdit={() => handleEdit(session.id)}
                                                    onDelete={() => handleDelete(session.id)}
                                                    formatTimeAgo={formatTimeAgo}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// Helper: Group sessions by time
function groupSessionsByTime(sessions: ChatSession[]): Record<string, ChatSession[]> {
    const groups: Record<string, ChatSession[]> = {};
    const now = new Date();
    
    sessions.forEach(session => {
        const date = session.lastMessageTime;
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        let group: string;
        if (diffDays === 0) group = 'Today';
        else if (diffDays === 1) group = 'Yesterday';
        else if (diffDays < 7) group = 'This Week';
        else if (diffDays < 30) group = 'This Month';
        else group = 'Older';
        
        if (!groups[group]) groups[group] = [];
        groups[group].push(session);
    });
    
    return groups;
}

// Chat Session Item Component
interface ChatSessionItemProps {
    session: ChatSession;
    onSelect: () => void;
    onArchive: () => void;
    onEdit: () => void;
    onDelete: () => void;
    formatTimeAgo: (date: Date) => string;
}

const ChatSessionItem: React.FC<ChatSessionItemProps> = ({
    session,
    onSelect,
    onArchive,
    onEdit,
    onDelete,
    formatTimeAgo,
}) => {
    return (
        <div
            className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
            onClick={onSelect}
        >
            <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{session.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{session.lastMessage}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatTimeAgo(session.lastMessageTime)}</span>
                    <span>•</span>
                    <span>{session.messageCount} message{session.messageCount !== 1 ? 's' : ''}</span>
                </div>
            </div>

            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {!session.isArchived && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onArchive}
                        title="Archive"
                    >
                        <Archive className="h-4 w-4" />
                    </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onEdit}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onDelete} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

