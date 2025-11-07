'use client';

import { useState, useEffect, useRef } from 'react';
import { useServerLogs } from '@/hooks/queries/useMCPServers';
import { useStreamingLogs } from '@/hooks/queries/useStreamingLogs';
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
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, Play, Pause, Trash2 } from 'lucide-react';

interface StreamingLogsViewerProps {
    serverId: string;
}

const logLevelColors = {
    debug: 'text-gray-500',
    info: 'text-blue-500',
    warn: 'text-yellow-500',
    error: 'text-red-500',
};

export function StreamingLogsViewer({ serverId }: StreamingLogsViewerProps) {
    const [level, setLevel] = useState<string | undefined>();
    const [isStreaming, setIsStreaming] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Static logs (for initial load and refresh)
    const { data: staticData, isLoading, refetch } = useServerLogs(serverId, { level });

    // Streaming logs
    const {
        logs: streamingLogs,
        isConnected,
        error: streamError,
        clearLogs,
        disconnect,
    } = useStreamingLogs(serverId, { level, enabled: isStreaming });

    // Combine static and streaming logs
    const allLogs = isStreaming
        ? [...(staticData?.logs || []), ...streamingLogs]
        : staticData?.logs || [];

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (isStreaming && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [allLogs.length, isStreaming]);

    const toggleStreaming = () => {
        if (isStreaming) {
            disconnect();
            setIsStreaming(false);
        } else {
            clearLogs();
            setIsStreaming(true);
        }
    };

    const handleClearLogs = () => {
        clearLogs();
        if (!isStreaming) {
            refetch();
        }
    };

    const downloadLogs = () => {
        if (!allLogs.length) return;

        const logsText = allLogs
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
                <AccordionTrigger>
                    <div className="flex items-center gap-2">
                        <span>Server Logs ({allLogs.length})</span>
                        {isStreaming && (
                            <Badge variant="default" className="ml-2">
                                <span className="animate-pulse mr-1">●</span>
                                Live
                            </Badge>
                        )}
                        {isConnected && !isStreaming && (
                            <Badge variant="outline">Connected</Badge>
                        )}
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        {/* Controls */}
                        <div className="flex items-center gap-2 flex-wrap">
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
                                onClick={toggleStreaming}
                                disabled={isLoading}
                            >
                                {isStreaming ? (
                                    <>
                                        <Pause className="h-4 w-4 mr-2" />
                                        Stop Stream
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Start Stream
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isLoading || isStreaming}
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                                />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearLogs}
                                disabled={!allLogs.length}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={downloadLogs}
                                disabled={!allLogs.length}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </Button>
                        </div>

                        {streamError && (
                            <div className="text-sm text-red-500">Stream error: {streamError}</div>
                        )}

                        {/* Logs */}
                        <div className="bg-black text-white p-4 rounded-md font-mono text-sm max-h-[400px] overflow-y-auto">
                            {isLoading ? (
                                <div>Loading logs...</div>
                            ) : allLogs.length ? (
                                <>
                                    {allLogs.map((log) => (
                                        <div key={log.id} className="mb-1">
                                            <span className="text-gray-400">
                                                [{new Date(log.created_at).toLocaleTimeString()}]
                                            </span>{' '}
                                            <span className={logLevelColors[log.level]}>
                                                [{log.level.toUpperCase()}]
                                            </span>{' '}
                                            <span>{log.message}</span>
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </>
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

