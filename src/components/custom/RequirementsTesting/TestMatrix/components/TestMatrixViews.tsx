import { MoreVertical, Pencil, PlusCircle, Star, Trash } from 'lucide-react';
import React, { memo, useState } from 'react';

import { useTestMatrixViews } from '@/components/custom/RequirementsTesting/hooks/useTestViews';
import { TestMatrixViewState } from '@/components/custom/RequirementsTesting/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

interface TestMatrixViewsProps {
    projectId: string;
    onViewSelect: (view: TestMatrixViewState) => void;
    onCreateNewView: () => void;
}

function TestMatrixViewsComponent({
    projectId,
    onViewSelect,
    onCreateNewView,
}: TestMatrixViewsProps) {
    const { views, isLoading, updateView, deleteView } =
        useTestMatrixViews(projectId);
    const { toast } = useToast();
    const [isRenaming, setIsRenaming] = useState(false);
    const [viewToRename, setViewToRename] =
        useState<TestMatrixViewState | null>(null);
    const [newName, setNewName] = useState('');

    const handleSetDefault = async (
        view: TestMatrixViewState,
        e: React.MouseEvent,
    ) => {
        e.stopPropagation();
        try {
            await updateView.mutateAsync({
                ...view,
                isDefault: true,
            });
            toast({
                title: 'Default view updated',
                description: `"${view.name}" is now your default view.`,
                variant: 'default',
            });
        } catch (error: unknown) {
            console.error('Failed to update default view:', error);
            toast({
                title: 'Error',
                description: 'Failed to update default view.',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async (
        view: TestMatrixViewState,
        e: React.MouseEvent,
    ) => {
        e.stopPropagation();
        try {
            await deleteView.mutateAsync({ id: view.id });
            toast({
                title: 'View deleted',
                description: `"${view.name}" has been deleted.`,
                variant: 'default',
            });
        } catch (error: unknown) {
            console.error(`Failed to delete view "${view.name}":`, error);
            toast({
                title: 'Error',
                description: 'Failed to delete view.',
                variant: 'destructive',
            });
        }
    };

    const openRenameDialog = (
        view: TestMatrixViewState,
        e: React.MouseEvent,
    ) => {
        e.stopPropagation();
        setViewToRename(view);
        setNewName(view.name);
        setIsRenaming(true);
    };

    const handleRename = async () => {
        if (!viewToRename) return;

        try {
            await updateView.mutateAsync({
                ...viewToRename,
                name: newName,
            });
            toast({
                title: 'View renamed',
                description: `View has been renamed to "${newName}".`,
                variant: 'default',
            });
            setIsRenaming(false);
            setViewToRename(null);
        } catch (error: unknown) {
            console.error(`Failed to rename view to "${newName}":`, error);
            toast({
                title: 'Error',
                description: 'Failed to rename view.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium">Test Run History</h2>
                <Button onClick={onCreateNewView}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Test Run
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center text-muted-foreground">
                    Loading test runs...
                </div>
            ) : views.length === 0 ? (
                <div className="text-center text-muted-foreground">
                    <p>No test runs yet</p>
                    <p className="text-sm mt-2">
                        Create a new test run to get started
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {views.map((view) => (
                        <Card
                            key={view.id}
                            className="p-4 cursor-pointer hover:border-primary/50 transition-colors relative"
                            onClick={() => onViewSelect(view)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <h3 className="font-medium mr-8">
                                        {view.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {view.configuration
                                            .selectedRequirementIds?.length ||
                                            0}{' '}
                                        requirements,{' '}
                                        {view.configuration.selectedTestCaseIds
                                            ?.length || 0}{' '}
                                        test cases
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {view.isDefault && (
                                        <Star className="h-4 w-4 text-amber-500 mr-1" />
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            asChild
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="w-36"
                                        >
                                            <DropdownMenuItem
                                                onClick={(e) =>
                                                    openRenameDialog(view, e)
                                                }
                                                className="cursor-pointer"
                                            >
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) =>
                                                    handleDelete(view, e)
                                                }
                                                className="cursor-pointer text-destructive"
                                            >
                                                <Trash className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                            {!view.isDefault && (
                                                <DropdownMenuItem
                                                    onClick={(e) =>
                                                        handleSetDefault(
                                                            view,
                                                            e,
                                                        )
                                                    }
                                                    className="cursor-pointer"
                                                >
                                                    <Star className="h-4 w-4 mr-2" />
                                                    Set default
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Test Run</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter new name"
                            className="w-full"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRenaming(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRename}
                            disabled={!newName.trim()}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export const TestMatrixViews = memo(TestMatrixViewsComponent);
