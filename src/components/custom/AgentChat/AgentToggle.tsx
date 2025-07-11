'use client';

import { Bot, X } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useAgentStore } from './hooks/useAgentStore';

interface AgentToggleProps {
    isOpen: boolean;
    onClick: () => void;
    className?: string;
}

export const AgentToggle: React.FC<AgentToggleProps> = ({
    isOpen,
    onClick,
    className,
}) => {
    const { messages } = useAgentStore();

    // Count unread messages (for future implementation)
    const unreadCount = 0; // This could be calculated based on read/unread status

    return (
        <div
            className={cn(
                'fixed right-6 top-1/2 -translate-y-1/2 z-40 transition-all duration-500 ease-out',
                className,
            )}
        >
            {isOpen ? (
                /* Minimize Button when open */
                <Button
                    onClick={onClick}
                    size="sm"
                    variant="outline"
                    className="rounded-full h-10 w-10 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-slate-200 hover:bg-white [&_svg]:pointer-events-auto"
                >
                    <X className="h-4 w-4 text-slate-600" />
                </Button>
            ) : (
                /* Agent Card when closed */
                <div
                    onClick={onClick}
                    className={cn(
                        'group cursor-pointer bg-gradient-to-br from-slate-700 to-slate-800/95 dark:from-slate-100 dark:to-slate-200/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-600/80 dark:border-slate-300/80',
                        'hover:shadow-3xl hover:scale-105 transition-all duration-300 ease-out',
                        'hover:from-slate-600 hover:to-slate-700 hover:border-blue-400/90 dark:hover:from-slate-200 dark:hover:to-slate-100 dark:hover:border-blue-400/80',
                        'min-w-[100px] overflow-hidden',
                    )}
                >
                    {/* Header with Avatar */}
                    <div className="flex items-center gap-3 p-4 pb-3">
                        <div className="relative">
                            <div
                                className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                                    'bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:from-blue-600 group-hover:to-indigo-700',
                                )}
                            >
                                <Bot className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white dark:text-slate-900 text-sm">
                                Agent
                            </h3>
                            <p className="text-xs text-slate-300 dark:text-slate-500 truncate">
                                Ready to chat
                            </p>
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="px-4 pb-4">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 dark:text-slate-400">
                                Messages: {messages.length}
                            </span>
                            {unreadCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="h-5 px-2 text-xs"
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Hover indicator */}
                    <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </div>
            )}
        </div>
    );
};
