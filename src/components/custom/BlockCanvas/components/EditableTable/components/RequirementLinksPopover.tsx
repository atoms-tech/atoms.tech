'use client';

import { ExternalLink, Link2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface RequirementLinksPopoverProps {
    requirementId: string;
    requirementName?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface RelationshipCheckResult {
    hasRelationships: boolean;
    relationshipCount: number;
    relatedRequirements: Array<{
        id: string;
        name: string;
        external_id: string | null;
    }>;
}

export function RequirementLinksPopover({
    requirementId,
    requirementName,
    open,
    onOpenChange,
}: RequirementLinksPopoverProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<RelationshipCheckResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const params = useParams();

    // Fetch relationships when dialog opens
    useEffect(() => {
        if (open && !data && !loading) {
            fetchRelationships();
        }
    }, [open]);

    // Reset data when dialog closes
    useEffect(() => {
        if (!open) {
            setData(null);
            setError(null);
        }
    }, [open]);

    const fetchRelationships = async () => {
        setLoading(true);
        setError(null);
        try {
            const searchParams = new URLSearchParams({
                requirementId,
                type: 'check',
            });
            const response = await fetch(
                `/api/requirements/relationships?${searchParams}`,
            );

            if (!response.ok) {
                throw new Error('Failed to fetch relationships');
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            console.error('Error fetching relationships:', err);
            setError(err instanceof Error ? err.message : 'Failed to load relationships');
        } finally {
            setLoading(false);
        }
    };

    const handleGoToTrace = () => {
        const orgId = params.orgId as string;
        const projectId = params.projectId as string;
        window.open(
            `/org/${orgId}/project/${projectId}/requirements/${requirementId}/trace`,
            '_blank',
        );
        onOpenChange(false);
    };

    const relationshipCount = data?.relationshipCount ?? 0;
    const hasRelationships = data?.hasRelationships ?? false;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-blue-600" />
                        Linked Requirements
                    </DialogTitle>
                    <DialogDescription>
                        {requirementName && `Relationships for "${requirementName}"`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {loading && (
                        <div className="text-sm text-gray-500 text-center py-4">
                            Loading relationships...
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-600 text-center py-4">
                            Error: {error}
                        </div>
                    )}

                    {!loading && !error && data && (
                        <>
                            {!hasRelationships ? (
                                <div className="text-sm text-gray-500 text-center py-4">
                                    <p>No relationships yet.</p>
                                    <p className="text-xs mt-2">
                                        Click &quot;Go to Trace&quot; below to add links.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-600">
                                        {relationshipCount} relationship
                                        {relationshipCount !== 1 ? 's' : ''} found
                                    </p>
                                    <div className="max-h-80 overflow-y-auto space-y-2">
                                        {data.relatedRequirements.map((req) => (
                                            <div
                                                key={req.id}
                                                className="rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="font-medium text-gray-900">
                                                    {req.external_id || 'No ID'}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {req.name || 'Unnamed'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex justify-end pt-2 border-t">
                        <Button onClick={handleGoToTrace} className="gap-2" size="sm">
                            Go to Trace
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
