/**
 * Example usage of MCPOAuthConnect component
 *
 * This file demonstrates how to integrate the OAuth connection modal
 * in your application.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MCPOAuthConnect } from './MCPOAuthConnect';

export function MCPOAuthConnectExample() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSuccess = () => {
        console.log('OAuth flow initiated successfully');
        // Add any additional logic here, such as:
        // - Refreshing the list of connected providers
        // - Updating UI state
        // - Showing a confirmation message
        setIsModalOpen(false);
    };

    const handleClose = () => {
        console.log('Modal closed');
        setIsModalOpen(false);
    };

    return (
        <div className="p-4">
            <Button onClick={() => setIsModalOpen(true)}>
                Connect OAuth Provider
            </Button>

            <MCPOAuthConnect
                isOpen={isModalOpen}
                onClose={handleClose}
                onSuccess={handleSuccess}
            />
        </div>
    );
}

/**
 * Example with custom success handler
 */
export function MCPOAuthConnectWithCustomHandler() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lastProvider, setLastProvider] = useState<string | null>(null);

    const handleSuccess = (provider?: string) => {
        // Custom success handling
        console.log('OAuth connection initiated');
        if (provider) {
            setLastProvider(provider);
        }

        // You might want to:
        // 1. Track analytics
        // 2. Update global state
        // 3. Navigate to a different page
        // 4. Show a success message

        setIsModalOpen(false);
    };

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">MCP OAuth Settings</h2>
                    <p className="text-sm text-muted-foreground">
                        Connect your OAuth providers for MCP server integration
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    Add Provider
                </Button>
            </div>

            {lastProvider && (
                <div className="rounded-lg border bg-muted/50 p-3">
                    <p className="text-sm">
                        Last connected: {lastProvider}
                    </p>
                </div>
            )}

            <MCPOAuthConnect
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
