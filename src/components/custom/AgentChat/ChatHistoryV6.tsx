/**
 * ChatHistory V6 - Using AI SDK 6
 * 
 * Displays chat history with session management
 */

'use client';

import { ChevronLeft, ChevronRight, Loader2, MessageSquare } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatSession } from '@/lib/services/agentapi.service';
import { cn } from '@/lib/utils';

interface ChatHistoryV6Props {
    onLoadSession?: (sessionId: string) => void;
}

export const ChatHistoryV6: React.FC<ChatHistoryV6Props> = ({ onLoadSession }) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);

    // Load sessions
    useEffect(() => {
        setLoading(true);
        setError(null);

        fetch(`/api/history?page=${page}&page_size=20`)
            .then(async (res) => {
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ error: res.statusText }));
                    throw new Error(errorData.error || `Failed to load chat history: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                setSessions(data.sessions || []);
                setHasMore(data.has_more || false);
                setTotal(data.total || 0);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load chat history:', err);
                setError(err.message || 'Failed to load chat history');
                setLoading(false);
            });
    }, [page]);

    const handleLoadSession = async (sessionId: string) => {
        if (onLoadSession) {
            onLoadSession(sessionId);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Chat History</h3>
                    <p className="text-sm text-muted-foreground">
                        {total > 0 ? `${total} conversation${total !== 1 ? 's' : ''}` : 'No conversations yet'}
                    </p>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {error && (
                <div className="text-destructive text-sm p-4 border border-destructive rounded-lg">
                    Error loading chat history: {error}
                </div>
            )}

            {!loading && !error && sessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No chat history yet</p>
                    <p className="text-sm">Start a conversation to see it here</p>
                </div>
            )}

            {!loading && !error && sessions.length > 0 && (
                <>
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                            {sessions.map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => handleLoadSession(session.id)}
                                    className={cn(
                                        'w-full text-left p-3 rounded-lg border transition-colors',
                                        'hover:bg-accent hover:border-accent-foreground/20',
                                        'focus:outline-none focus:ring-2 focus:ring-ring',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">
                                                {session.title || 'Untitled Conversation'}
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {session.message_count} message
                                                {session.message_count !== 1 ? 's' : ''}
                                                {session.model && ` • ${session.model}`}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {formatDate(session.created_at)}
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                                            {session.tokens_total.toLocaleString()} tokens
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-2 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={!hasMore || loading}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

