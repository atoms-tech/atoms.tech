'use client';

/**
 * MCPPanel Component
 * 
 * Unified MCP panel with 3 tabs:
 * - Installed: View and manage installed servers
 * - Marketplace: Browse and install new servers
 * - Profiles: Manage MCP profiles and system settings
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Server, Store, Settings, Layers } from 'lucide-react';
import { EnhancedMarketplace } from './EnhancedMarketplace';
import { InstalledServersView } from './InstalledServersView';
import { MCPSystemSettings } from './MCPSystemSettings';
import { MCPProfiles } from './MCPProfiles';

interface MCPPanelProps {
    organizations?: Array<{ id: string; name: string }>;
    installedServers?: string[];
    onServerInstalled?: (serverId: string) => void;
}

export function MCPPanel({
    organizations = [],
    installedServers = [],
    onServerInstalled,
}: MCPPanelProps) {
    const [activeTab, setActiveTab] = useState<'installed' | 'marketplace' | 'profiles' | 'settings'>('marketplace');

    return (
        <div className="space-y-4">
            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'installed' | 'marketplace' | 'profiles' | 'settings')}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="installed" className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        Installed
                    </TabsTrigger>
                    <TabsTrigger value="marketplace" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Marketplace
                    </TabsTrigger>
                    <TabsTrigger value="profiles" className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Profiles
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                {/* Installed Tab */}
                <TabsContent value="installed" className="mt-4">
                    <InstalledServersView compact={true} />
                </TabsContent>

                {/* Marketplace Tab */}
                <TabsContent value="marketplace" className="mt-4">
                    <EnhancedMarketplace
                        organizations={organizations}
                        installedServers={installedServers}
                        showHeader={false}
                        onServerInstalled={(server) => {
                            if (onServerInstalled) {
                                onServerInstalled(server.id);
                            }
                        }}
                    />
                </TabsContent>

                {/* Profiles Tab */}
                <TabsContent value="profiles" className="mt-4">
                    <MCPProfiles compact={true} />
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="mt-4">
                    <MCPSystemSettings compact={true} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

