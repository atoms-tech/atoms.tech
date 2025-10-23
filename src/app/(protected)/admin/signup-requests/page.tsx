'use client';

import { AlertCircle, Check, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface SignupRequest {
    id: string;
    email: string;
    full_name: string;
    message: string | null;
    status: 'pending' | 'approved' | 'denied';
    created_at: string;
    approved_at: string | null;
    denied_at: string | null;
    denial_reason: string | null;
}

export default function SignupRequestsPage() {
    const [requests, setRequests] = useState<SignupRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<SignupRequest | null>(null);
    const [denyReason, setDenyReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showDenyDialog, setShowDenyDialog] = useState(false);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const { toast } = useToast();

    const fetchRequests = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/admin/signup-requests');

            if (!response.ok) {
                throw new Error('Failed to fetch signup requests');
            }

            const data = await response.json();
            setRequests(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            toast({
                title: 'Error',
                description: 'Failed to fetch signup requests',
                variant: 'destructive' as const,
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApprove = async (request: SignupRequest) => {
        setSelectedRequest(request);
        setShowApproveConfirm(true);
    };

    const confirmApprove = async () => {
        if (!selectedRequest) return;

        setIsProcessing(true);
        try {
            const response = await fetch('/api/admin/signup-requests?action=approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: selectedRequest.id }),
            });

            if (!response.ok) {
                throw new Error('Failed to approve signup request');
            }

            toast({
                title: 'Success',
                description: `Approved ${selectedRequest.email} and sent invitation email`,
                variant: 'default' as const,
            });

            setShowApproveConfirm(false);
            setSelectedRequest(null);
            await fetchRequests();
        } catch (err) {
            toast({
                title: 'Error',
                description:
                    err instanceof Error ? err.message : 'Failed to approve request',
                variant: 'destructive' as const,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeny = async (request: SignupRequest) => {
        setSelectedRequest(request);
        setDenyReason('');
        setShowDenyDialog(true);
    };

    const confirmDeny = async () => {
        if (!selectedRequest) return;

        setIsProcessing(true);
        try {
            const response = await fetch('/api/admin/signup-requests?action=deny', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: selectedRequest.id,
                    reason: denyReason,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to deny signup request');
            }

            toast({
                title: 'Success',
                description: `Denied signup request for ${selectedRequest.email}`,
                variant: 'default' as const,
            });

            setShowDenyDialog(false);
            setSelectedRequest(null);
            setDenyReason('');
            await fetchRequests();
        } catch (err) {
            toast({
                title: 'Error',
                description:
                    err instanceof Error ? err.message : 'Failed to deny request',
                variant: 'destructive' as const,
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const pendingRequests = requests.filter((r) => r.status === 'pending');
    const approvedRequests = requests.filter((r) => r.status === 'approved');
    const deniedRequests = requests.filter((r) => r.status === 'denied');

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Signup Requests</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Manage user signup requests and send invitations
                </p>
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    <CardContent className="pt-6 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <p className="text-red-700 dark:text-red-200">{error}</p>
                    </CardContent>
                </Card>
            )}

            {isLoading ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-gray-500">Loading...</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Pending Requests */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Requests</CardTitle>
                            <CardDescription>
                                {pendingRequests.length} awaiting review
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingRequests.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    No pending requests
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {pendingRequests.map((request) => (
                                        <div
                                            key={request.id}
                                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium">
                                                        {request.full_name}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {request.email}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(request.created_at)}
                                                </p>
                                            </div>
                                            {request.message && (
                                                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                                                    &ldquo;{request.message}&rdquo;
                                                </p>
                                            )}
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(request)}
                                                    disabled={isProcessing}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeny(request)}
                                                    disabled={isProcessing}
                                                >
                                                    <X className="h-4 w-4 mr-1" />
                                                    Deny
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Approved Requests */}
                    {approvedRequests.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Approved</CardTitle>
                                <CardDescription>
                                    {approvedRequests.length} approved requests
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {approvedRequests.map((request) => (
                                        <div
                                            key={request.id}
                                            className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {request.full_name}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {request.email}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Approved{' '}
                                                    {formatDate(request.approved_at!)}
                                                </p>
                                            </div>
                                            <Check className="h-4 w-4 text-green-600" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Denied Requests */}
                    {deniedRequests.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Denied</CardTitle>
                                <CardDescription>
                                    {deniedRequests.length} denied requests
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {deniedRequests.map((request) => (
                                        <div
                                            key={request.id}
                                            className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {request.full_name}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {request.email}
                                                </p>
                                                {request.denial_reason && (
                                                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                                                        Reason: {request.denial_reason}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Denied{' '}
                                                    {formatDate(request.denied_at!)}
                                                </p>
                                            </div>
                                            <X className="h-4 w-4 text-red-600" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Approve Confirmation Dialog */}
            <AlertDialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve Signup Request?</AlertDialogTitle>
                        <AlertDialogDescription>
                            An invitation email will be sent to{' '}
                            <span className="font-medium">{selectedRequest?.email}</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-3">
                        <AlertDialogCancel disabled={isProcessing}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmApprove}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isProcessing ? 'Approving...' : 'Approve'}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* Deny Dialog */}
            <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deny Signup Request</DialogTitle>
                        <DialogDescription>
                            Provide a reason for denying the signup request for{' '}
                            <span className="font-medium">{selectedRequest?.email}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason (optional)</Label>
                            <Textarea
                                id="reason"
                                placeholder="Enter reason for denial..."
                                value={denyReason}
                                onChange={(e) => setDenyReason(e.target.value)}
                                disabled={isProcessing}
                                className="resize-none"
                                rows={4}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowDenyDialog(false)}
                                disabled={isProcessing}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDeny}
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Denying...' : 'Deny Request'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
