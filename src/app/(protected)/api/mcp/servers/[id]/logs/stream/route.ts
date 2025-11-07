import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest } from 'next/server';
import { getOrCreateProfileForWorkOSUser } from '@/lib/auth/profile-sync';
import { createServerClient } from '@/lib/database';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mcp/servers/[id]/logs/stream
 * Stream server logs in real-time using Server-Sent Events
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { user } = await withAuth();

        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const profile = await getOrCreateProfileForWorkOSUser(user);
        if (!profile) {
            return new Response('Profile not found', { status: 404 });
        }

        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const level = searchParams.get('level');

        const supabase = await createServerClient();

        // Check server access
        const { data: server, error: serverError } = await supabase
            .from('mcp_servers')
            .select('*')
            .eq('id', id)
            .single();

        if (serverError || !server) {
            return new Response('Server not found', { status: 404 });
        }

        if (server.scope === 'user' && server.user_id !== profile.id) {
            return new Response('Access denied', { status: 403 });
        }

        // Create a readable stream for SSE
        const encoder = new TextEncoder();
        let intervalId: NodeJS.Timeout;

        const stream = new ReadableStream({
            async start(controller) {
                // Send initial connection message
                const data = `data: ${JSON.stringify({ type: 'connected', serverId: id })}\n\n`;
                controller.enqueue(encoder.encode(data));

                // Poll for new logs every 2 seconds
                intervalId = setInterval(async () => {
                    try {
                        // Query for recent logs (last 10 seconds)
                        const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();

                        let query = supabase
                            .from('mcp_server_usage_logs')
                            .select('*')
                            .eq('user_server_id', id) // Using user_server_id instead of server_id
                            .gte('created_at', tenSecondsAgo)
                            .order('created_at', { ascending: true });

                        if (level && level !== 'all') {
                            query = query.eq('level', level);
                        }

                        const { data: logs, error: logsError } = await query;

                        if (logsError) {
                            logger.error('Error fetching logs for stream', logsError, {
                                serverId: id,
                            });
                            return;
                        }

                        // Send each log as an SSE event
                        if (logs && logs.length > 0) {
                            for (const log of logs) {
                                const eventData = `data: ${JSON.stringify({ type: 'log', log })}\n\n`;
                                controller.enqueue(encoder.encode(eventData));
                            }
                        }

                        // Send heartbeat
                        const heartbeat = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`;
                        controller.enqueue(encoder.encode(heartbeat));
                    } catch (error) {
                        logger.error('Error in log stream', error, { serverId: id });
                        const errorData = `data: ${JSON.stringify({ type: 'error', error: 'Stream error' })}\n\n`;
                        controller.enqueue(encoder.encode(errorData));
                    }
                }, 2000);
            },
            cancel() {
                // Clean up interval when stream is closed
                if (intervalId) {
                    clearInterval(intervalId);
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        });
    } catch (error) {
        logger.error('Log stream error', error, {
            route: '/api/mcp/servers/[id]/logs/stream',
        });
        return new Response('Internal server error', { status: 500 });
    }
}

