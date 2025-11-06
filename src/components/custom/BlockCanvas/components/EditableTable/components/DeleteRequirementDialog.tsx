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
import { Checkbox } from '@/components/ui/checkbox';
import {
    useCheckRequirementRelationships,
    useDeleteRelationship,
} from '@/hooks/queries/useRequirementRelationships';

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
    const [confirmChecked, setConfirmChecked] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { data: relationshipCheck, isLoading: isCheckingRelationships } =
        useCheckRequirementRelationships(requirementId);
    const deleteRelationshipMutation = useDeleteRelationship();

    const hasRelationships = relationshipCheck?.hasRelationships || false;
    const relatedRequirements = relationshipCheck?.relatedRequirements || [];

    const handleConfirm = async () => {
        try {
            setIsDeleting(true);

            // If there are relationships, disconnect them first
            if (hasRelationships && relatedRequirements.length > 0) {
                for (const relatedReq of relatedRequirements) {
                    // Determine if the current requirement is ancestor or descendant
                    // We'll try both directions since we don't know the exact relationship type
                    try {
                        await deleteRelationshipMutation.mutateAsync({
                            ancestorId: requirementId,
                            descendantId: relatedReq.id,
                        });
                    } catch {
                        // If it fails, try the opposite direction
                        try {
                            await deleteRelationshipMutation.mutateAsync({
                                ancestorId: relatedReq.id,
                                descendantId: requirementId,
                            });
                        } catch (error) {
                            console.error('Failed to delete relationship:', error);
                        }
                    }
                }
            }

            // Now delete the requirement itself
            await onConfirmDelete();

            // Reset state and close dialog
            setConfirmChecked(false);
            onOpenChange(false);
        } catch (error) {
            console.error('Error during requirement deletion:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const canDelete = !hasRelationships || confirmChecked;

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
                                <p>
                                    This requirement is connected to other requirements.
                                    Deleting it will also disconnect all relationships.
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
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="confirm-delete"
                                        checked={confirmChecked}
                                        onChange={(e) =>
                                            setConfirmChecked(e.target.checked)
                                        }
                                        label="I understand, disconnect and delete this requirement"
                                    />
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
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={!canDelete || isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
