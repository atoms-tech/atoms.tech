import { useState } from 'react';
import { useParams } from 'next/navigation';

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
    const params = useParams();

    const { data: relationshipCheck, isLoading: isCheckingRelationships } =
        useCheckRequirementRelationships(requirementId);

    const hasRelationships = relationshipCheck?.hasRelationships || false;
    const relatedRequirements = relationshipCheck?.relatedRequirements || [];

    const handleConfirm = async () => {
        try {
            setIsDeleting(true);
            await onConfirmDelete();
            onOpenChange(false);
        } catch (error) {
            console.error('Error during requirement deletion:', error);
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
                        {isCheckingRelationships ? (
                            <span>Checking for relationships...</span>
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
                    {hasRelationships ? (
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
