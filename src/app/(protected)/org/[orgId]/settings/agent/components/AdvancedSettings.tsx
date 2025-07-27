'use client';

import { AlertTriangle, Code, Database, Key, Shield } from 'lucide-react';
import React, { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface AdvancedSettingsProps {
    orgId: string;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
    orgId,
}) => {
    const { toast } = useToast();
    const [settings, setSettings] = useState({
        debugMode: false,
        customPrompts: '',
        apiTimeout: 30,
        maxRetries: 3,
        enableLogging: true,
        logLevel: 'info',
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        try {
            setIsSaving(true);

            // TODO: Replace with actual API call
            const response = await fetch(
                `/api/settings/agent/${orgId}/advanced`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(settings),
                },
            );

            if (response.ok) {
                toast({
                    variant: 'default',
                    title: 'Settings Saved',
                    description:
                        'Advanced settings have been updated successfully',
                });
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving advanced settings:', error);
            toast({
                variant: 'destructive',
                title: 'Save Error',
                description:
                    'Failed to save advanced settings. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        if (
            confirm(
                'Are you sure you want to reset all advanced settings to defaults?',
            )
        ) {
            setSettings({
                debugMode: false,
                customPrompts: '',
                apiTimeout: 30,
                maxRetries: 3,
                enableLogging: true,
                logLevel: 'info',
            });

            toast({
                variant: 'default',
                title: 'Settings Reset',
                description: 'Advanced settings have been reset to defaults',
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Warning Alert */}
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Advanced Settings</AlertTitle>
                <AlertDescription>
                    These settings are for advanced users only. Incorrect
                    configuration may affect your AI agent&apos;s performance or
                    functionality.
                </AlertDescription>
            </Alert>

            {/* Debug & Development */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Debug & Development
                    </CardTitle>
                    <CardDescription>
                        Development and debugging options for troubleshooting
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="debug-mode">Debug Mode</Label>
                            <p className="text-sm text-muted-foreground">
                                Enable detailed logging and error reporting
                            </p>
                        </div>
                        <Switch
                            id="debug-mode"
                            checked={settings.debugMode}
                            onCheckedChange={(checked) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    debugMode: checked,
                                }))
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="log-level">Log Level</Label>
                        <select
                            id="log-level"
                            className="w-full p-2 border border-input rounded-md bg-background"
                            value={settings.logLevel}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    logLevel: e.target.value,
                                }))
                            }
                        >
                            <option value="error">Error</option>
                            <option value="warn">Warning</option>
                            <option value="info">Info</option>
                            <option value="debug">Debug</option>
                        </select>
                        <p className="text-sm text-muted-foreground">
                            Set the minimum log level for system messages
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enable-logging">
                                Enable Logging
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Store conversation logs for analysis
                            </p>
                        </div>
                        <Switch
                            id="enable-logging"
                            checked={settings.enableLogging}
                            onCheckedChange={(checked) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    enableLogging: checked,
                                }))
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* API Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        API Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure API timeouts and retry behavior
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="api-timeout">
                                API Timeout (seconds)
                            </Label>
                            <Input
                                id="api-timeout"
                                type="number"
                                min="5"
                                max="300"
                                value={settings.apiTimeout}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        apiTimeout:
                                            parseInt(e.target.value) || 30,
                                    }))
                                }
                            />
                            <p className="text-sm text-muted-foreground">
                                Maximum time to wait for API responses
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="max-retries">Max Retries</Label>
                            <Input
                                id="max-retries"
                                type="number"
                                min="0"
                                max="10"
                                value={settings.maxRetries}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        maxRetries:
                                            parseInt(e.target.value) || 3,
                                    }))
                                }
                            />
                            <p className="text-sm text-muted-foreground">
                                Number of retry attempts for failed requests
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Custom Prompts */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Custom Prompts
                    </CardTitle>
                    <CardDescription>
                        Add custom system prompts to modify agent behavior
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="custom-prompts">System Prompts</Label>
                        <Textarea
                            id="custom-prompts"
                            placeholder="Enter custom system prompts here..."
                            rows={6}
                            value={settings.customPrompts}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    customPrompts: e.target.value,
                                }))
                            }
                        />
                        <p className="text-sm text-muted-foreground">
                            These prompts will be added to the system context
                            for all conversations
                        </p>
                    </div>

                    <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                            Custom prompts can significantly affect agent
                            behavior. Test thoroughly before deploying to
                            production.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security & Privacy
                    </CardTitle>
                    <CardDescription>
                        Configure security and privacy settings
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            All OAuth tokens are encrypted and stored securely
                            in Supabase Vault. Only organization members with
                            appropriate permissions can access integrations.
                        </AlertDescription>
                    </Alert>

                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">
                            Current Security Status
                        </h4>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• OAuth tokens encrypted at rest</li>
                            <li>• Organization-scoped access control</li>
                            <li>• Audit logging enabled</li>
                            <li>• Regular security updates</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isSaving}
                >
                    Reset to Defaults
                </Button>

                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </div>
    );
};
