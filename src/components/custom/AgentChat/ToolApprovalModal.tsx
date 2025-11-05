'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ToolApprovalRequest {
    request_id: string;
    tool_name: string;
    tool_description: string;
    tool_input: Record<string, any>;
    approval_message: string;
    risk_level: 'low' | 'medium' | 'high';
    timestamp: string;
}

interface ToolApprovalModalProps {
    request: ToolApprovalRequest | null;
    open: boolean;
    onApprove: (requestId: string) => void;
    onDeny: (requestId: string) => void;
    onClose: () => void;
}

export const ToolApprovalModal: React.FC<ToolApprovalModalProps> = ({
    request,
    open,
    onApprove,
    onDeny,
    onClose,
}) => {
    if (!request) return null;

    const getRiskIcon = (level: string) => {
        switch (level) {
            case 'high':
                return <AlertTriangle className="h-5 w-5 text-destructive" />;
            case 'medium':
                return <Info className="h-5 w-5 text-yellow-500" />;
            default:
                return <CheckCircle className="h-5 w-5 text-green-500" />;
        }
    };

    const getRiskBadge = (level: string) => {
        const variants = {
            high: 'destructive',
            medium: 'secondary',
            low: 'outline',
        } as const;

        return (
            <Badge variant={variants[level as keyof typeof variants] || 'outline'}>
                {level.toUpperCase()} RISK
            </Badge>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        {getRiskIcon(request.risk_level)}
                        <div className="flex-1">
                            <DialogTitle>Tool Approval Required</DialogTitle>
                            <DialogDescription className="mt-1">
                                {request.tool_name}
                            </DialogDescription>
                        </div>
                        {getRiskBadge(request.risk_level)}
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Approval Message */}
                    <div>
                        <h4 className="mb-2 text-sm font-medium">Action</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {request.approval_message}
                        </p>
                    </div>

                    {/* Tool Description */}
                    {request.tool_description && (
                        <div>
                            <h4 className="mb-2 text-sm font-medium">Description</h4>
                            <p className="text-sm text-muted-foreground">
                                {request.tool_description}
                            </p>
                        </div>
                    )}

                    {/* Tool Input */}
                    {Object.keys(request.tool_input).length > 0 && (
                        <div>
                            <h4 className="mb-2 text-sm font-medium">Parameters</h4>
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <pre className="text-xs overflow-auto max-h-40">
                                    {JSON.stringify(request.tool_input, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Risk Warning */}
                    {request.risk_level === 'high' && (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                            <div className="flex-1 text-xs text-destructive">
                                <p className="font-medium">High Risk Action</p>
                                <p className="mt-1">
                                    This action may modify data or perform external operations.
                                    Please review carefully before approving.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => {
                            onDeny(request.request_id);
                            onClose();
                        }}
                        className="gap-2"
                    >
                        <XCircle className="h-4 w-4" />
                        Deny
                    </Button>
                    <Button
                        onClick={() => {
                            onApprove(request.request_id);
                            onClose();
                        }}
                        className={cn(
                            'gap-2',
                            request.risk_level === 'high' && 'bg-destructive hover:bg-destructive/90',
                        )}
                    >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

