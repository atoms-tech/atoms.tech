'use client';

import React from 'react';
import { Loader2, CheckCircle, XCircle, Clock, Wrench } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ToolExecution {
    id: string;
    tool_name: string;
    status: 'pending' | 'running' | 'success' | 'error' | 'denied';
    input?: Record<string, any>;
    output?: any;
    error?: string;
    timestamp: string;
    duration?: number;
}

interface ToolExecutionStatusProps {
    execution: ToolExecution;
    className?: string;
}

export const ToolExecutionStatus: React.FC<ToolExecutionStatusProps> = ({
    execution,
    className,
}) => {
    const getStatusIcon = () => {
        switch (execution.status) {
            case 'pending':
                return <Clock className="h-4 w-4 text-muted-foreground" />;
            case 'running':
                return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-destructive" />;
            case 'denied':
                return <XCircle className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getStatusBadge = () => {
        const variants = {
            pending: 'secondary',
            running: 'default',
            success: 'outline',
            error: 'destructive',
            denied: 'secondary',
        } as const;

        const labels = {
            pending: 'Pending',
            running: 'Running',
            success: 'Success',
            error: 'Error',
            denied: 'Denied',
        };

        return (
            <Badge variant={variants[execution.status]} className="text-xs">
                {labels[execution.status]}
            </Badge>
        );
    };

    return (
        <Card
            className={cn(
                'overflow-hidden border-l-4',
                execution.status === 'success' && 'border-l-green-500',
                execution.status === 'error' && 'border-l-destructive',
                execution.status === 'running' && 'border-l-primary',
                execution.status === 'denied' && 'border-l-yellow-500',
                execution.status === 'pending' && 'border-l-muted-foreground',
                className,
            )}
        >
            <div className="p-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <Wrench className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">{execution.tool_name}</p>
                            {execution.duration && (
                                <p className="text-xs text-muted-foreground">
                                    {execution.duration}ms
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        {getStatusBadge()}
                    </div>
                </div>

                {/* Input Parameters */}
                {execution.input && Object.keys(execution.input).length > 0 && (
                    <div className="mt-3">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                            Parameters
                        </p>
                        <div className="rounded bg-muted/50 p-2">
                            <pre className="text-xs overflow-auto max-h-20">
                                {JSON.stringify(execution.input, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                {/* Output/Result */}
                {execution.status === 'success' && execution.output && (
                    <div className="mt-3">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                            Result
                        </p>
                        <div className="rounded bg-green-500/10 p-2">
                            <pre className="text-xs overflow-auto max-h-32">
                                {typeof execution.output === 'string'
                                    ? execution.output
                                    : JSON.stringify(execution.output, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {execution.status === 'error' && execution.error && (
                    <div className="mt-3">
                        <p className="mb-1 text-xs font-medium text-destructive">Error</p>
                        <div className="rounded bg-destructive/10 p-2">
                            <p className="text-xs text-destructive">{execution.error}</p>
                        </div>
                    </div>
                )}

                {/* Denied Message */}
                {execution.status === 'denied' && (
                    <div className="mt-3">
                        <div className="rounded bg-yellow-500/10 p-2">
                            <p className="text-xs text-yellow-700 dark:text-yellow-500">
                                Tool execution was denied by user
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

interface ToolExecutionListProps {
    executions: ToolExecution[];
    className?: string;
}

export const ToolExecutionList: React.FC<ToolExecutionListProps> = ({
    executions,
    className,
}) => {
    if (executions.length === 0) return null;

    return (
        <div className={cn('space-y-2', className)}>
            <p className="text-xs font-medium text-muted-foreground">Tool Executions</p>
            {executions.map((execution) => (
                <ToolExecutionStatus key={execution.id} execution={execution} />
            ))}
        </div>
    );
};

