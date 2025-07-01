'use client';

import { Copy, MoreVertical } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useDuplicateDocument } from '@/hooks/mutations/useDocumentMutations';
import { Document } from '@/types/base/documents.types';

import { DuplicateDialog } from './DuplicateDialog';

interface DocumentActionsProps {
    document: Document;
    userRole?: string;
    onEdit?: () => void;
    onDelete?: () => void;
    className?: string;
}

export function DocumentActions({
    document,
    userRole = 'viewer',
    onEdit,
    onDelete,
    className,
}: DocumentActionsProps) {
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
    const { toast } = useToast();
    const duplicateDocument = useDuplicateDocument();

    // Permission check helper
    const canPerformAction = (action: string) => {
        const rolePermissions = {
            owner: ['edit', 'delete', 'duplicate'],
            admin: ['edit', 'delete', 'duplicate'],
            maintainer: ['edit', 'duplicate'],
            editor: ['edit', 'duplicate'],
            viewer: ['duplicate'], // Allow viewers to duplicate to projects they have access to
        };

        return (
            rolePermissions[userRole as keyof typeof rolePermissions]?.includes(
                action,
            ) || false
        );
    };

    const handleDuplicate = async (
        targetProjectId: string,
        newName?: string,
    ) => {
        try {
            await duplicateDocument.mutateAsync({
                documentId: document.id,
                targetProjectId,
                newName,
                includeRequirements: true,
                includeProperties: true,
            });

            toast({
                title: 'Success',
                description: `Document "${newName || document.name + ' (Copy)'}" has been duplicated successfully.`,
                variant: 'default',
            });

            setShowDuplicateDialog(false);
        } catch (error) {
            toast({
                title: 'Error',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Failed to duplicate document',
                variant: 'destructive',
            });
        }
    };

    // If user has no permissions, don't render anything
    const hasAnyPermission =
        canPerformAction('edit') ||
        canPerformAction('delete') ||
        canPerformAction('duplicate');
    if (!hasAnyPermission) {
        return null;
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className={`h-8 w-8 p-0 opacity-0 group-hover:opacity-100 ${className}`}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {canPerformAction('duplicate') && (
                        <DropdownMenuItem
                            onClick={() => setShowDuplicateDialog(true)}
                            disabled={duplicateDocument.isPending}
                        >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                        </DropdownMenuItem>
                    )}

                    {(canPerformAction('edit') || canPerformAction('delete')) &&
                        canPerformAction('duplicate') && (
                            <DropdownMenuSeparator />
                        )}

                    {canPerformAction('edit') && onEdit && (
                        <DropdownMenuItem onClick={onEdit}>
                            Edit
                        </DropdownMenuItem>
                    )}

                    {canPerformAction('delete') && onDelete && (
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={onDelete}
                        >
                            Delete
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <DuplicateDialog
                isOpen={showDuplicateDialog}
                onClose={() => setShowDuplicateDialog(false)}
                document={document}
                onDuplicate={handleDuplicate}
                isLoading={duplicateDocument.isPending}
            />
        </>
    );
}

export default DocumentActions;
