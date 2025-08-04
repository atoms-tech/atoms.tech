'use client';

import Image from 'next/image';
import React from 'react';

import { Badge } from '@/components/ui/badge';
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
    const { currentPinnedOrganizationId, organizationMessages } = useAgentStore();

    // Get messages for current organization (reactive to currentPinnedOrganizationId changes)
    const messages = React.useMemo(() => {
        if (!currentPinnedOrganizationId) {
            return [];
        }
        return organizationMessages[currentPinnedOrganizationId] || [];
    }, [currentPinnedOrganizationId, organizationMessages]);

    // Count unread messages (for future implementation)
    const unreadCount = 0; // This could be calculated based on read/unread status

    // Don't show anything when panel is open
    if (isOpen) {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed right-6 bottom-20 z-40 transition-all duration-300 ease-out',
                className,
            )}
        >
            {/* Agent Card when closed */}
            <div
                onClick={onClick}
                className={cn(
                    'group cursor-pointer',
                    'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
                    'rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-out',
                    'hover:bg-zinc-50 dark:hover:bg-zinc-750',
                    'min-w-[120px] max-w-[160px] overflow-hidden',
                    'flex flex-col items-center',
                )}
            >
                {/* Header: ATOMS logo and name */}
                <div className="flex flex-row items-center justify-center p-3 gap-2 w-full">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <Image
                            src="/atom.png"
                            alt="Atoms logo"
                            width={32}
                            height={32}
                            className="object-contain dark:invert"
                        />
                    </div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base tracking-wide">
                        ATOMS
                    </h3>
                </div>
                {/* Status */}
                <div className="px-3 pb-3 w-full">
                    <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {messages.length} messages
                        </span>
                        {unreadCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="h-4 px-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            >
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                        )}
                    </div>
                </div>
                {/* Hover indicator */}
                <div className="h-0.5 bg-blue-500 dark:bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left w-full" />
            </div>
        </div>
    );
};
