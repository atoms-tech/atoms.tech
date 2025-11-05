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
import { ServerMarketplace } from '@/components/mcp';
import { useUser } from '@/lib/providers/user.provider';

import { ChatHistoryV6 } from './ChatHistoryV6';

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
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="models">Models</TabsTrigger>
                    <TabsTrigger value="prompts">Prompts</TabsTrigger>
                    <TabsTrigger value="mcp">MCP</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general" className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">General Settings</h3>
                        <p className="text-sm text-muted-foreground">
                            Configure your AI assistant preferences
                        </p>
                    </div>
                </TabsContent>

                {/* Models Tab */}
                <TabsContent value="models" className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Model Selection</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Choose the AI model for your conversations
                        </p>

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
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="model-select">Select Model</Label>
                                    <Select
                                        value={selectedModel}
                                        onValueChange={onModelChange}
                                    >
                                        <SelectTrigger id="model-select">
                                            <SelectValue placeholder="Select a model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {models.map((model) => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {model.id}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {model.owned_by}
                                                            {model.context_length &&
                                                                ` • ${model.context_length} tokens`}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Model details */}
                                {selectedModel && (
                                    <div className="border rounded-lg p-4 space-y-2">
                                        <h4 className="font-medium">Model Details</h4>
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
                                                        {model.owned_by}
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
                            </div>
                        )}
                    </div>
                </TabsContent>

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
                    <div>
                        <h3 className="text-lg font-semibold mb-2">MCP Servers</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Browse and install Model Context Protocol servers
                        </p>
                        <ServerMarketplace />
                    </div>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-4">
                    <ChatHistoryV6
                        onLoadSession={(sessionId) => {
                            console.log('Load session:', sessionId);
                            // TODO: Implement session loading
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

