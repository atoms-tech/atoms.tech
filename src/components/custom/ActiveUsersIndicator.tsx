'use client';

import React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDocumentStore, UserPresence } from '@/store/document.store';
import { cn } from '@/lib/utils';

interface ActiveUsersIndicatorProps {
    className?: string;
}

/**
 * Displays active users currently viewing/editing the document
 * Google Sheets style presence indicator
 */
export const ActiveUsersIndicator: React.FC<ActiveUsersIndicatorProps> = ({
    className,
}) => {
    const activeUsers = useDocumentStore((state) => state.activeUsers);

    // Convert Map to Array for rendering
    const users = Array.from(activeUsers.values());

    if (users.length === 0) {
        return null;
    }

    return (
        <div className={cn('flex items-center gap-1', className)}>
            <TooltipProvider>
                {users.map((user) => (
                    <UserAvatar key={user.userId} user={user} />
                ))}
            </TooltipProvider>
        </div>
    );
};

interface UserAvatarProps {
    user: UserPresence;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => {
    const initials = getInitials(user.userName);
    const color = getUserColor(user.userId);

    const tooltipContent = (
        <div className="text-xs">
            <div className="font-medium">{user.userName}</div>
            {user.userEmail && <div className="text-gray-400">{user.userEmail}</div>}
            {user.editingCell && (
                <div className="mt-1 text-gray-300">
                    Editing cell...
                </div>
            )}
        </div>
    );

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Avatar
                    className="h-8 w-8 border-2 cursor-pointer transition-transform hover:scale-110"
                    style={{ borderColor: color }}
                >
                    <AvatarFallback style={{ backgroundColor: color }} className="text-white text-xs">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            </TooltipTrigger>
            <TooltipContent>{tooltipContent}</TooltipContent>
        </Tooltip>
    );
};

/**
 * Get initials from user name
 */
function getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate consistent color for user based on their ID
 */
function getUserColor(userId: string): string {
    const colors = [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // purple
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#f97316', // orange
    ];

    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}
