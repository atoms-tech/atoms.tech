'use client';

import { GripVertical, Plus } from 'lucide-react';
import React, { useState } from 'react';

import { BlockActionsProps } from '@/components/custom/BlockCanvas/types';
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

export const BlockActions: React.FC<BlockActionsProps> = ({
    onDelete,
    isEditMode,
    dragActivators,
}) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    if (!isEditMode) return null;

    return (
        <>
            <div className="absolute -left-14 top-1/2 -translate-y-1/2 flex flex-row items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/50 rounded-md p-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 cursor-grab active:cursor-grabbing hover:bg-accent"
                    {...dragActivators}
                >
                    <GripVertical className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteDialog(true);
                    }}
                >
                    <Plus className="h-4 w-4 rotate-45" />
                </Button>
            </div>

            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete this block and all its contents.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                                setShowDeleteDialog(false);
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
