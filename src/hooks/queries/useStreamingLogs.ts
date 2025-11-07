import { useEffect, useState, useRef } from 'react';
import type { ServerLog } from '@/lib/schemas/mcp-install';

interface StreamingLogsOptions {
    level?: string;
    enabled?: boolean;
}

interface StreamEvent {
    type: 'connected' | 'log' | 'heartbeat' | 'error';
    serverId?: string;
    log?: ServerLog;
    timestamp?: string;
    error?: string;
}

export function useStreamingLogs(serverId: string, options: StreamingLogsOptions = {}) {
    const { level, enabled = true } = options;
    const [logs, setLogs] = useState<ServerLog[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (!enabled || !serverId) {
            return;
        }

        // Build URL with query params
        const params = new URLSearchParams();
        if (level && level !== 'all') {
            params.append('level', level);
        }

        const url = `/api/mcp/servers/${serverId}/logs/stream?${params.toString()}`;

        // Create EventSource for SSE
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setIsConnected(true);
            setError(null);
        };

        eventSource.onmessage = (event) => {
            try {
                const data: StreamEvent = JSON.parse(event.data);

                switch (data.type) {
                    case 'connected':
                        setIsConnected(true);
                        break;

                    case 'log':
                        if (data.log) {
                            setLogs((prev) => {
                                // Avoid duplicates by checking log ID
                                const exists = prev.some((log) => log.id === data.log!.id);
                                if (exists) return prev;

                                // Add new log and keep only last 100
                                const updated = [...prev, data.log];
                                return updated.slice(-100);
                            });
                        }
                        break;

                    case 'heartbeat':
                        // Just keep connection alive
                        break;

                    case 'error':
                        setError(data.error || 'Stream error');
                        break;
                }
            } catch (err) {
                console.error('Error parsing SSE event:', err);
            }
        };

        eventSource.onerror = (err) => {
            console.error('EventSource error:', err);
            setIsConnected(false);
            setError('Connection lost');
            eventSource.close();
        };

        // Cleanup on unmount
        return () => {
            eventSource.close();
            eventSourceRef.current = null;
        };
    }, [serverId, level, enabled]);

    const clearLogs = () => {
        setLogs([]);
    };

    const disconnect = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setIsConnected(false);
        }
    };

    return {
        logs,
        isConnected,
        error,
        clearLogs,
        disconnect,
    };
}

