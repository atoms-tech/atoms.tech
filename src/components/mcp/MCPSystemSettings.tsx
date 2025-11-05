'use client';

import { useState } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

interface MCPSystemSettingsProps {
    compact?: boolean;
}

export function MCPSystemSettings({ compact = false }: MCPSystemSettingsProps) {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        autoStartServers: true,
        enableLogging: true,
        logLevel: 'info',
        maxConcurrentServers: 10,
        serverTimeout: 30,
        enableHealthChecks: true,
        healthCheckInterval: 60,
    });

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            // TODO: Implement API call to save settings
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            
            toast({
                variant: 'default',
                title: 'Settings Saved',
                description: 'MCP system settings have been updated successfully.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save settings. Please try again.',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* General Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">General Settings</CardTitle>
                    <CardDescription>
                        Configure global MCP server behavior
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Auto-start Servers</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically start enabled servers on login
                            </p>
                        </div>
                        <Switch
                            checked={settings.autoStartServers}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, autoStartServers: checked })
                            }
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Enable Health Checks</Label>
                            <p className="text-sm text-muted-foreground">
                                Periodically check server health status
                            </p>
                        </div>
                        <Switch
                            checked={settings.enableHealthChecks}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, enableHealthChecks: checked })
                            }
                        />
                    </div>

                    {settings.enableHealthChecks && (
                        <div className="space-y-2">
                            <Label htmlFor="healthCheckInterval">Health Check Interval (seconds)</Label>
                            <Input
                                id="healthCheckInterval"
                                type="number"
                                value={settings.healthCheckInterval}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        healthCheckInterval: parseInt(e.target.value) || 60,
                                    })
                                }
                                min={10}
                                max={300}
                            />
                        </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="maxConcurrentServers">Max Concurrent Servers</Label>
                        <Input
                            id="maxConcurrentServers"
                            type="number"
                            value={settings.maxConcurrentServers}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    maxConcurrentServers: parseInt(e.target.value) || 10,
                                })
                            }
                            min={1}
                            max={50}
                        />
                        <p className="text-sm text-muted-foreground">
                            Maximum number of servers that can run simultaneously
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="serverTimeout">Server Timeout (seconds)</Label>
                        <Input
                            id="serverTimeout"
                            type="number"
                            value={settings.serverTimeout}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    serverTimeout: parseInt(e.target.value) || 30,
                                })
                            }
                            min={5}
                            max={300}
                        />
                        <p className="text-sm text-muted-foreground">
                            Timeout for server operations
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Logging Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Logging Settings</CardTitle>
                    <CardDescription>
                        Configure MCP server logging
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Enable Logging</Label>
                            <p className="text-sm text-muted-foreground">
                                Log MCP server activity and errors
                            </p>
                        </div>
                        <Switch
                            checked={settings.enableLogging}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, enableLogging: checked })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </div>
    );
}

