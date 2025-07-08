'use client';

import React, { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

import { AgentPanel } from './AgentPanel';
import { AgentSettings } from './AgentSettings';
import { AgentToggle } from './AgentToggle';
import { useAgentStore } from './hooks/useAgentStore';

interface AgentInterfaceProps {
    className?: string;
    autoInit?: boolean; // Whether to automatically initialize the connection
}

export const AgentInterface: React.FC<AgentInterfaceProps> = ({
    className,
    autoInit = false,
}) => {
    const {
        isOpen,
        setIsOpen,
        togglePanel,
        initializeConnection,
        connectionStatus,
    } = useAgentStore();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Auto-initialize connection if configured
    useEffect(() => {
        if (autoInit && connectionStatus === 'disconnected') {
            initializeConnection();
        }
    }, [autoInit, connectionStatus, initializeConnection]);

    const handleToggle = () => {
        togglePanel();
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleSettingsClick = () => {
        setIsSettingsOpen(true);
    };

    return (
        <>
            {/* Toggle Button */}
            <AgentToggle
                isOpen={isOpen}
                onClick={handleToggle}
                className={className}
            />

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
                    <AgentSettings onClose={() => setIsSettingsOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
};
