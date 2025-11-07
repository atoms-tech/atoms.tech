'use client';

import { useState } from 'react';
import { useServerLogs } from '@/hooks/queries/useMCPServers';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

interface ServerLogsViewerProps {
    serverId: string;
}

const logLevelColors = {
    debug: 'text-gray-500',
    info: 'text-blue-500',
    warn: 'text-yellow-500',
    error: 'text-red-500',
};

export function ServerLogsViewer({ serverId }: ServerLogsViewerProps) {
    const [level, setLevel] = useState<string | undefined>();
    const { data, isLoading, refetch } = useServerLogs(serverId, { level });

    const downloadLogs = () => {
        if (!data?.logs) return;

        const logsText = data.logs
            .map((log) => `[${log.created_at}] [${log.level.toUpperCase()}] ${log.message}`)
            .join('\n');

        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mcp-server-${serverId}-logs.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Accordion type="single" collapsible>
            <AccordionItem value="logs">
                <AccordionTrigger>Server Logs ({data?.total || 0})</AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        {/* Controls */}
                        <div className="flex items-center gap-2">
                            <Select value={level} onValueChange={setLevel}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="All levels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All levels</SelectItem>
                                    <SelectItem value="debug">Debug</SelectItem>
                                    <SelectItem value="info">Info</SelectItem>
                                    <SelectItem value="warn">Warning</SelectItem>
                                    <SelectItem value="error">Error</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isLoading}
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                                />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={downloadLogs}
                                disabled={!data?.logs?.length}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                        </div>

                        {/* Logs */}
                        <div className="bg-black text-white p-4 rounded-md font-mono text-sm max-h-[400px] overflow-y-auto">
                            {isLoading ? (
                                <div>Loading logs...</div>
                            ) : data?.logs?.length ? (
                                data.logs.map((log) => (
                                    <div key={log.id} className="mb-1">
                                        <span className="text-gray-400">
                                            [{new Date(log.created_at).toLocaleTimeString()}]
                                        </span>{' '}
                                        <span className={logLevelColors[log.level]}>
                                            [{log.level.toUpperCase()}]
                                        </span>{' '}
                                        <span>{log.message}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-400">No logs available</div>
                            )}
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

