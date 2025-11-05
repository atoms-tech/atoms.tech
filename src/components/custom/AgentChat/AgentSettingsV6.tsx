// @ts-nocheck
/**
 * AgentSettings V6 - Using AI SDK 6
 * 
 * Settings panel with model selection and chat history
 */

'use client';

import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModelInfo } from '@/lib/services/agentapi.service';
import { DEFAULT_MODEL } from '@/lib/providers/atomsagent.provider';
import { SystemPromptManager } from '@/components/custom/SystemPrompts';
import { MCPPanel } from '@/components/mcp';
import { useUser } from '@/lib/providers/user.provider';

import { formatModelDisplayName } from './utils/modelUtils';

interface AgentSettingsV6Props {
    onClose: () => void;
    selectedModel?: string;
    onModelChange?: (model: string) => void;
}

export const AgentSettingsV6: React.FC<AgentSettingsV6Props> = ({
    onClose,
    selectedModel = DEFAULT_MODEL,
    onModelChange,
}) => {
    const { profile } = useUser();
    const [models, setModels] = useState<ModelInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load models
    useEffect(() => {
        fetch('/api/models')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load models');
                return res.json();
            })
            .then((data) => {
                setModels(data.data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load models:', err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    return (
        <div className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="prompts">Prompts</TabsTrigger>
                    <TabsTrigger value="mcp">MCP</TabsTrigger>
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general" className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">General Settings</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Configure your AI assistant preferences
                        </p>

                        <div className="space-y-6">
                            {/* Model Selection - Moved from Models tab */}
                            <div className="space-y-2">
                                <Label htmlFor="model-select">Model Selection</Label>
                                {loading && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Loading models...</span>
                                    </div>
                                )}
                                {error && (
                                    <div className="text-destructive text-sm">
                                        Error loading models: {error}
                                    </div>
                                )}
                                {!loading && !error && (
                                    <>
                                        <Select
                                            value={selectedModel}
                                            onValueChange={onModelChange}
                                        >
                                            <SelectTrigger id="model-select">
                                                <SelectValue placeholder="Select a model" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {models.map((model) => {
                                                    const display = formatModelDisplayName(
                                                        model.id,
                                                        model.owned_by,
                                                    );
                                                    const providerLabel =
                                                        display.providerLabel || 'Unknown provider';
                                                    return (
                                                        <SelectItem key={model.id} value={model.id}>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">
                                                                    {display.displayName}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {providerLabel}
                                                                    {model.context_length && (
                                                                        <>
                                                                            {' '}
                                                                            &bull;{' '}
                                                                            {model.context_length.toLocaleString()} tokens
                                                                        </>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-muted-foreground">
                                            Choose the AI model for your conversations
                                        </p>

                                        {/* Model details */}
                                        {selectedModel && (
                                            <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
                                                <h4 className="font-medium text-sm">Model Details</h4>
                                                {models
                                                    .filter((m) => m.id === selectedModel)
                                                    .map((model) => (
                                                        <div
                                                            key={model.id}
                                                            className="text-sm space-y-1"
                                                        >
                                                            <div>
                                                                <span className="text-muted-foreground">
                                                                    Provider:{' '}
                                                                </span>
                                                                {formatModelDisplayName(
                                                                    model.id,
                                                                    model.owned_by,
                                                                ).providerLabel || 'Unknown provider'}
                                                            </div>
                                                            {model.context_length && (
                                                                <div>
                                                                    <span className="text-muted-foreground">
                                                                        Context:{' '}
                                                                    </span>
                                                                    {model.context_length.toLocaleString()}{' '}
                                                                    tokens
                                                                </div>
                                                            )}
                                                            {model.capabilities &&
                                                                model.capabilities.length > 0 && (
                                                                    <div>
                                                                        <span className="text-muted-foreground">
                                                                            Capabilities:{' '}
                                                                        </span>
                                                                        {model.capabilities.join(', ')}
                                                                    </div>
                                                                )}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Auto-save conversations */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Auto-save Conversations</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically save chat history
                                    </p>
                                </div>
                                <input type="checkbox" defaultChecked className="h-4 w-4" />
                            </div>

                            {/* Message streaming */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Stream Responses</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Show responses as they&apos;re generated
                                    </p>
                                </div>
                                <input type="checkbox" defaultChecked className="h-4 w-4" />
                            </div>

                            {/* Code syntax highlighting */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Syntax Highlighting</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Highlight code blocks in responses
                                    </p>
                                </div>
                                <input type="checkbox" defaultChecked className="h-4 w-4" />
                            </div>

                            {/* Default context window */}
                            <div className="space-y-2">
                                <Label>Default Context Window</Label>
                                <Select defaultValue="standard">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="standard">Standard (200K tokens)</SelectItem>
                                        <SelectItem value="extended">Extended (1M tokens)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">
                                    Choose default context window size for new chats
                                </p>
                            </div>

                            {/* Temperature */}
                            <div className="space-y-2">
                                <Label>Response Creativity</Label>
                                <Select defaultValue="balanced">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="precise">Precise (Low temperature)</SelectItem>
                                        <SelectItem value="balanced">Balanced (Medium temperature)</SelectItem>
                                        <SelectItem value="creative">Creative (High temperature)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">
                                    Control how creative or focused responses should be
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Models Tab - REMOVED */}

                {/* System Prompts Tab */}
                <TabsContent value="prompts" className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">System Prompts</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Manage system prompts for your AI assistant
                        </p>
                        <SystemPromptManager
                            currentOrganizationId={profile?.current_organization_id || undefined}
                            onPromptSelected={(promptId) => {
                                console.log('Selected prompt:', promptId);
                            }}
                        />
                    </div>
                </TabsContent>

                {/* MCP Servers Tab */}
                <TabsContent value="mcp" className="space-y-4">
                    <MCPPanel
                        organizations={[]}
                        installedServers={[]}
                        onServerInstalled={(serverId) => {
                            console.log('Server installed:', serverId);
                        }}
                    />
                </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    );
};
