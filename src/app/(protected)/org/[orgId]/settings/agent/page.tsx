'use client';

import { Bot, Settings, Shield, Zap } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganization } from '@/lib/providers/organization.provider';

import { AdvancedSettings } from './components/AdvancedSettings';
import { GeneralSettings } from './components/GeneralSettings';
import { MCPIntegrations } from './components/MCPIntegrations';

export default function AgentSettingsPage() {
    const params = useParams<{ orgId: string }>();
    const { currentOrganization } = useOrganization();
    const [activeTab, setActiveTab] = useState('general');

    const orgId = params?.orgId;

    if (!orgId || !currentOrganization) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-muted-foreground">
                        Organization not found
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Agent Settings</h1>
                        <p className="text-muted-foreground">
                            Configure your AI agent and MCP integrations for{' '}
                            <span className="font-medium">
                                {currentOrganization.name}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Settings Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger
                        value="general"
                        className="flex items-center gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        General Settings
                    </TabsTrigger>
                    <TabsTrigger
                        value="integrations"
                        className="flex items-center gap-2"
                    >
                        <Zap className="h-4 w-4" />
                        MCP Integrations
                    </TabsTrigger>
                    <TabsTrigger
                        value="advanced"
                        className="flex items-center gap-2"
                    >
                        <Shield className="h-4 w-4" />
                        Advanced
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <GeneralSettings orgId={orgId} />
                </TabsContent>

                <TabsContent value="integrations" className="space-y-6">
                    <MCPIntegrations orgId={orgId} />
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                    <AdvancedSettings orgId={orgId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
