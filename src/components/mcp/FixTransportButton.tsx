'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Wrench, Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function FixTransportButton() {
    const { toast } = useToast();
    const [fixing, setFixing] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFix = async () => {
        setFixing(true);
        setResult(null);

        try {
            const response = await fetch('/api/mcp/fix-transport-types', {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Failed to fix transport types');
            }

            setResult(data);
            toast({
                title: 'Success',
                description: `Fixed ${data.count || 0} servers`,
            });
        } catch (error) {
            console.error('Fix transport error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to fix transport types',
            });
        } finally {
            setFixing(false);
        }
    };

    return (
        <>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Wrench className="h-4 w-4 mr-2" />
                        Fix Transport Types
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Fix Server Transport Types</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will update all MCP servers to use the correct transport types and URLs
                            based on the official MCP registry.
                            <br /><br />
                            <strong>What it does:</strong>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Updates transport types (stdio → http where applicable)</li>
                                <li>Sets correct server URLs for HTTP/SSE servers</li>
                                <li>Cleans up invalid URLs (empty objects, GitHub repos)</li>
                            </ul>
                            <br />
                            This is a one-time operation that is safe to run multiple times.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleFix} disabled={fixing}>
                            {fixing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Fixing...
                                </>
                            ) : (
                                'Fix Transport Types'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {result && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="font-medium mb-2">
                        Fixed {result.count || 0} server{result.count !== 1 ? 's' : ''}
                    </p>
                    {result.updates && result.updates.length > 0 && (
                        <div className="space-y-2 text-sm">
                            {result.updates.map((update: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="font-mono">{update.namespace}</span>
                                    <span className="text-muted-foreground">
                                        {update.old} → {update.new}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
