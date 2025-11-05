/**
 * AgentPanelHeader - Menu bar for agent panel
 * 
 * Features:
 * - New Chat button
 * - Download dropdown (PDF/TXT)
 * - Chat History button
 * - Settings button
 * - Close button
 */

'use client';

import { Download, History, MessageSquarePlus, Settings, X } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AgentPanelHeaderProps {
    onNewChat: () => void;
    onDownloadPDF: () => void;
    onDownloadTXT: () => void;
    onChatHistory: () => void;
    onSettings: () => void;
    onClose: () => void;
}

export const AgentPanelHeader: React.FC<AgentPanelHeaderProps> = ({
    onNewChat,
    onDownloadPDF,
    onDownloadTXT,
    onChatHistory,
    onSettings,
    onClose,
}) => {
    return (
        <div className="flex items-center gap-2 p-3 border-b bg-background">
            {/* New Chat */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onNewChat}
                title="New Chat"
            >
                <MessageSquarePlus className="h-4 w-4" />
            </Button>

            {/* Download Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        title="Download"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={onDownloadPDF}>
                        Download as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDownloadTXT}>
                        Download as TXT
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Chat History */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onChatHistory}
                title="Chat History"
            >
                <History className="h-4 w-4" />
            </Button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Settings */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onSettings}
                title="Settings"
            >
                <Settings className="h-4 w-4" />
            </Button>

            {/* Close */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                title="Close"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
};

