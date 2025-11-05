'use client';

import React, { useEffect, useState } from 'react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { AgentPanel } from './AgentPanel';
import { AgentSettingsV6 } from './AgentSettingsV6';
import { AgentToggle } from './AgentToggle';
import { useAgentStore } from './hooks/useAgentStore';

interface AgentInterfaceProps {
    className?: string;
    autoInit?: boolean;
}

export const AgentInterface: React.FC<AgentInterfaceProps> = ({
    className,
    autoInit = false,
}) => {
    const {
        isOpen,
        setIsOpen,
        togglePanel,
        selectedModel,
        setSelectedModel,
    } = useAgentStore();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Auto-initialize the agent interface if autoInit is true (only once on mount)
    useEffect(() => {
        if (autoInit && !isOpen) {
            setIsOpen(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoInit]); // Intentionally exclude isOpen and setIsOpen to prevent auto-reopening

    const handleToggle = () => {
        togglePanel();
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleSettingsClick = () => {
        console.log('Settings button clicked, opening dialog');
        setIsSettingsOpen(true);
    };

    return (
        <>
            {/* Toggle Button */}
            <AgentToggle isOpen={isOpen} onClick={handleToggle} className={className} />

            {/* Agent Panel */}
            <AgentPanel
                isOpen={isOpen}
                onToggle={handleToggle}
                onClose={handleClose}
                onSettingsClick={handleSettingsClick}
            />

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogTitle>Agent Settings</DialogTitle>
                    <DialogDescription>
                        Configure your AI agent settings, including model selection and MCP
                        server configurations.
                    </DialogDescription>
                    <AgentSettingsV6
                        onClose={() => setIsSettingsOpen(false)}
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};
