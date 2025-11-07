'use client';

import { Badge } from '@/components/ui/badge';
import { useServerHealth } from '@/hooks/queries/useMCPServers';
import { Loader2 } from 'lucide-react';

interface ServerStatusBadgeProps {
    serverId: string;
}

const statusConfig = {
    running: { variant: 'default' as const, label: 'Running', icon: '🟢' },
    starting: { variant: 'secondary' as const, label: 'Starting', icon: '🟡' },
    stopped: { variant: 'secondary' as const, label: 'Stopped', icon: '🔴' },
    error: { variant: 'destructive' as const, label: 'Error', icon: '⚠️' },
    unknown: { variant: 'outline' as const, label: 'Unknown', icon: '🔵' },
};

export function ServerStatusBadge({ serverId }: ServerStatusBadgeProps) {
    const { data: health, isLoading } = useServerHealth(serverId);

    if (isLoading) {
        return (
            <Badge variant="outline">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Checking...
            </Badge>
        );
    }

    const status = health?.status || 'unknown';
    const config = statusConfig[status];

    return (
        <Badge variant={config.variant}>
            <span className="mr-1">{config.icon}</span>
            {config.label}
        </Badge>
    );
}

