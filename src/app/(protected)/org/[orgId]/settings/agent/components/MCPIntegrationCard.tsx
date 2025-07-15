'use client';

import { Check, ExternalLink, Unlink, X } from 'lucide-react';
import React, { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

interface IntegrationStatus {
    connected: boolean;
    lastConnected?: Date | string;
    userEmail?: string;
    error?: string;
}

interface MCPIntegrationCardProps {
    provider: string;
    title: string;
    description: string;
    icon: ReactNode;
    status: IntegrationStatus;
    onConnect: () => void;
    onDisconnect: () => void;
    features: string[];
}

export const MCPIntegrationCard: React.FC<MCPIntegrationCardProps> = ({
    provider: _provider,
    title,
    description,
    icon,
    status,
    onConnect,
    onDisconnect,
    features,
}) => {
    const formatDate = (date: Date | string | undefined) => {
        if (!date) return '';
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            if (isNaN(dateObj.getTime())) return '';
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(dateObj);
        } catch {
            return '';
        }
    };

    return (
        <Card
            className={`transition-all duration-200 ${
                status.connected
                    ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20'
                    : 'hover:shadow-md'
            }`}
        >
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2 rounded-lg ${
                                status.connected
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            {icon}
                        </div>
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {title}
                                {status.connected && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    >
                                        <Check className="h-3 w-3 mr-1" />
                                        Connected
                                    </Badge>
                                )}
                                {status.error && (
                                    <Badge variant="destructive">
                                        <X className="h-3 w-3 mr-1" />
                                        Error
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {status.connected ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onDisconnect}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                            >
                                <Unlink className="h-4 w-4 mr-1" />
                                Disconnect
                            </Button>
                        ) : (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={onConnect}
                            >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Connect
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Connection Status */}
                {status.connected && (
                    <div className="bg-white dark:bg-gray-900/50 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-green-700 dark:text-green-300 font-medium">
                                Active Connection
                            </span>
                            {status.lastConnected && (
                                <span className="text-gray-600 dark:text-gray-400">
                                    Connected {formatDate(status.lastConnected)}
                                </span>
                            )}
                        </div>
                        {status.userEmail && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Authenticated as: {status.userEmail}
                            </p>
                        )}
                    </div>
                )}

                {/* Error Status */}
                {status.error && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <X className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800 dark:text-red-200">
                                Connection Error
                            </span>
                        </div>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                            {status.error}
                        </p>
                    </div>
                )}

                {/* Features List */}
                <div>
                    <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                        Available Features:
                    </h4>
                    <ul className="space-y-1">
                        {features.map((feature, index) => (
                            <li
                                key={index}
                                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                            >
                                <div
                                    className={`h-1.5 w-1.5 rounded-full ${
                                        status.connected
                                            ? 'bg-green-500'
                                            : 'bg-gray-400'
                                    }`}
                                />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Connection Instructions */}
                {!status.connected && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            Click &quot;Connect&quot; to authorize this
                            integration for your organization. You&apos;ll be
                            redirected to {title} to grant the necessary
                            permissions.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
