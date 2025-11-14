'use client';

import { ExternalLink, Link2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

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

    // Define fetchRelationships first (before useEffect that uses it)
    const fetchRelationships = useCallback(async () => {
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
    }, [requirementId]);

    // Fetch relationships when dialog opens or requirementId changes
    // Note: Don't include 'loading' in deps to avoid infinite loop
    useEffect(() => {
        if (open && !data && !loading) {
            fetchRelationships();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, data, fetchRelationships]);

    // Reset data when dialog closes
    useEffect(() => {
        if (!open) {
            setData(null);
            setError(null);
        }
    }, [open]);

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
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                <p>Loading relationships...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 text-center py-4 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                            <p className="font-semibold">Error</p>
                            <p className="mt-1">{error}</p>
                        </div>
                    )}

                    {!loading && !error && data && (
                        <>
                            {!hasRelationships ? (
                                <div className="text-center py-6 space-y-4">
                                    <div className="flex justify-center">
                                        <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-4">
                                            <Link2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            No relationships yet
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Create traceability links to connect this
                                            requirement with others
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {relationshipCount} linked requirement
                                            {relationshipCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto space-y-2">
                                        {data.relatedRequirements.map((req) => (
                                            <div
                                                key={req.id}
                                                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                    {req.external_id || 'No ID'}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {req.name || 'Unnamed'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex justify-end pt-2 border-t dark:border-gray-700">
                        <Button
                            onClick={handleGoToTrace}
                            className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                            size="sm"
                        >
                            {hasRelationships ? 'View in Traceability' : 'Create Links'}
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
