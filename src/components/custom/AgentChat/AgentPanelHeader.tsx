/**
 * AgentPanelHeader - Menu bar for agent panel
 * 
 * Features:
 * - Model Selector
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
import { ModelSelector } from './ModelSelector';
import { DEFAULT_MODEL } from '@/lib/providers/atomsagent.provider';

interface AgentPanelHeaderProps {
    selectedModel?: string;
    onModelChange?: (model: string) => void;
    onNewChat: () => void;
    onDownloadPDF: () => void;
    onDownloadTXT: () => void;
    onChatHistory: () => void;
    onSettings: () => void;
    onClose: () => void;
}

export const AgentPanelHeader: React.FC<AgentPanelHeaderProps> = ({
    selectedModel,
    onModelChange,
    onNewChat,
    onDownloadPDF,
    onDownloadTXT,
    onChatHistory,
    onSettings,
    onClose,
}) => {
    return (
        <div className="flex items-center justify-between gap-2 p-3 border-b bg-background">
            {/* Left section - Model Selector */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                {onModelChange ? (
                    <ModelSelector
                        selectedModel={selectedModel || DEFAULT_MODEL}
                        onModelChange={onModelChange}
                    />
                ) : (
                    <span className="text-sm text-muted-foreground">Model Selector</span>
                )}
            </div>

            {/* Right section - Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
                {/* New Chat */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNewChat}
                    title="New Chat"
                >
                    <MessageSquarePlus className="h-4 w-4" />
                </Button>

                {/* Download Dropdown - Show on hover */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            title="Download"
                            className="group"
                            onMouseEnter={(e) => {
                                // Trigger dropdown on hover
                                const button = e.currentTarget;
                                setTimeout(() => button.click(), 100);
                            }}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
        </div>
    );
};

