import { useParams } from 'next/navigation';
import { useState } from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useCheckRequirementRelationships } from '@/hooks/queries/useRequirementRelationships';

interface DeleteRequirementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    requirementId: string;
    requirementName: string;
    onConfirmDelete: () => void | Promise<void>;
}

export function DeleteRequirementDialog({
    open,
    onOpenChange,
    requirementId,
    requirementName,
    onConfirmDelete,
}: DeleteRequirementDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const params = useParams();

    const {
        data: relationshipCheck,
        isLoading: isCheckingRelationships,
        error: relationshipCheckError,
    } = useCheckRequirementRelationships(requirementId);

    const hasRelationships = relationshipCheck?.hasRelationships || false;
    const relatedRequirements = relationshipCheck?.relatedRequirements || [];

    // If there's an error checking relationships, treat it as if relationships exist (safer)
    const cannotDelete = hasRelationships || !!relationshipCheckError;

    const handleConfirm = async () => {
        try {
            setIsDeleting(true);
            setDeleteError(null);
            await onConfirmDelete();
            onOpenChange(false);
        } catch (error) {
            console.error('Error during requirement deletion:', error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to delete requirement';
            setDeleteError(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleGoToTraceability = () => {
        const orgId = params.orgId as string;
        const projectId = params.projectId as string;
        window.open(
            `/org/${orgId}/project/${projectId}/requirements/${requirementId}/trace`,
            '_blank',
        );
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Requirement?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {deleteError ? (
                            <div className="space-y-3">
                                <p className="text-red-600 font-semibold">
                                    {deleteError}
                                </p>
                                <p>
                                    Please disconnect all relationships on the
                                    Traceability page, then try deleting again.
                                </p>
                            </div>
                        ) : isCheckingRelationships ? (
                            <span>Checking for relationships...</span>
                        ) : relationshipCheckError ? (
                            <div className="space-y-3">
                                <p className="text-red-600 font-semibold">
                                    Unable to verify relationships
                                </p>
                                <p>
                                    Failed to check if this requirement has
                                    relationships. Please check the Traceability page
                                    to ensure no connections exist before deleting.
                                </p>
                                <p className="text-sm text-gray-600">
                                    Error:{' '}
                                    {relationshipCheckError instanceof Error
                                        ? relationshipCheckError.message
                                        : 'Unknown error'}
                                </p>
                            </div>
                        ) : hasRelationships ? (
                            <div className="space-y-3">
                                <p className="text-red-600 font-semibold">
                                    Cannot delete this requirement because it has
                                    relationships with other requirements.
                                </p>
                                <p>
                                    Please disconnect all relationships first on the
                                    Traceability page, then try deleting again.
                                </p>
                                <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
                                    <p className="mb-2 font-semibold text-yellow-800">
                                        Connected Requirements:
                                    </p>
                                    <ul className="list-inside list-disc space-y-1 text-sm text-yellow-700">
                                        {relatedRequirements.map((req) => (
                                            <li key={req.id}>
                                                {req.external_id} - {req.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <p>
                                Are you sure you want to delete &quot;
                                {requirementName}&quot;? This action cannot be undone.
                            </p>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {cannotDelete || deleteError ? (
                        <>
                            <AlertDialogCancel disabled={isDeleting}>
                                Cancel
                            </AlertDialogCancel>
                            <Button
                                onClick={handleGoToTraceability}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Go to Traceability
                            </Button>
                        </>
                    ) : (
                        <>
                            <AlertDialogCancel disabled={isDeleting}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirm}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                        </>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
