'use client';

import { useToolPermissions, useServerTools } from '@/hooks/queries/useMCPServers';
import { useUpdateToolPermissions } from '@/hooks/mutations/useMCPServerMutations';
import type { PermissionLevel } from '@/lib/schemas/mcp-install';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, XCircle, HelpCircle, Bot } from 'lucide-react';

interface ToolPermissionsProps {
    serverId: string;
}

const permissionConfig = {
    always_allow: {
        label: 'Always Allow',
        icon: CheckCircle2,
        color: 'text-green-500',
        variant: 'default' as const,
    },
    always_deny: {
        label: 'Always Deny',
        icon: XCircle,
        color: 'text-red-500',
        variant: 'destructive' as const,
    },
    prompt: {
        label: 'Prompt',
        icon: HelpCircle,
        color: 'text-yellow-500',
        variant: 'secondary' as const,
    },
    agent_decided: {
        label: 'Agent Decided',
        icon: Bot,
        color: 'text-blue-500',
        variant: 'outline' as const,
    },
};

export function ToolPermissions({ serverId }: ToolPermissionsProps) {
    const { toast } = useToast();
    const { data: permissions, isLoading: permissionsLoading } = useToolPermissions(serverId);
    const { data: tools, isLoading: toolsLoading } = useServerTools(serverId);
    const updateMutation = useUpdateToolPermissions(serverId);

    const handlePermissionChange = (toolName: string, permission: PermissionLevel) => {
        if (!permissions) return;

        const newPermissions = {
            ...permissions,
            [toolName]: permission,
        };

        updateMutation.mutate(newPermissions, {
            onSuccess: () => {
                toast({
                    title: 'Permission updated',
                    description: `${toolName} permission set to ${permissionConfig[permission].label}`,
                });
            },
            onError: (error: Error) => {
                toast({
                    title: 'Update failed',
                    description: error.message,
                    variant: 'destructive',
                });
            },
        });
    };

    const setBulkPermission = (permission: PermissionLevel) => {
        if (!tools) return;

        const newPermissions = tools.reduce(
            (acc, tool) => ({
                ...acc,
                [tool]: permission,
            }),
            {}
        );

        updateMutation.mutate(newPermissions, {
            onSuccess: () => {
                toast({
                    title: 'Bulk update complete',
                    description: `All tools set to ${permissionConfig[permission].label}`,
                });
            },
        });
    };

    if (permissionsLoading || toolsLoading) {
        return <div>Loading permissions...</div>;
    }

    if (!tools || tools.length === 0) {
        return <div className="text-sm text-muted-foreground">No tools available</div>;
    }

    return (
        <div className="space-y-4">
            {/* Bulk Actions */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">Set all to:</span>
                <Button variant="outline" size="sm" onClick={() => setBulkPermission('always_allow')}>
                    Always Allow
                </Button>
                <Button variant="outline" size="sm" onClick={() => setBulkPermission('prompt')}>
                    Prompt
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkPermission('agent_decided')}
                >
                    Agent Decided
                </Button>
            </div>

            {/* Tool List */}
            <div className="space-y-2">
                {tools.map((toolName) => {
                    const permission = (permissions?.[toolName] as PermissionLevel) || 'agent_decided';
                    const config = permissionConfig[permission];
                    const Icon = config.icon;

                    return (
                        <div
                            key={toolName}
                            className="flex items-center justify-between p-3 border rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={`h-5 w-5 ${config.color}`} />
                                <div>
                                    <div className="font-medium">{toolName}</div>
                                    <Badge variant={config.variant} className="mt-1">
                                        {config.label}
                                    </Badge>
                                </div>
                            </div>

                            <Select
                                value={permission}
                                onValueChange={(value) =>
                                    handlePermissionChange(toolName, value as PermissionLevel)
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="always_allow">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            Always Allow
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="always_deny">
                                        <div className="flex items-center gap-2">
                                            <XCircle className="h-4 w-4 text-red-500" />
                                            Always Deny
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="prompt">
                                        <div className="flex items-center gap-2">
                                            <HelpCircle className="h-4 w-4 text-yellow-500" />
                                            Prompt
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="agent_decided">
                                        <div className="flex items-center gap-2">
                                            <Bot className="h-4 w-4 text-blue-500" />
                                            Agent Decided
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

