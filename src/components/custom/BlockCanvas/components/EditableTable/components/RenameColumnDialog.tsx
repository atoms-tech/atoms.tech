import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RenameColumnDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentName: string;
    onConfirm: (newName: string) => void;
}

export function RenameColumnDialog({
    open,
    onOpenChange,
    currentName,
    onConfirm,
}: RenameColumnDialogProps) {
    const [newName, setNewName] = useState(currentName);
    const [error, setError] = useState('');

    // reset state when dialog opens with new column
    useEffect(() => {
        if (open) {
            setNewName(currentName);
            setError('');
        }
    }, [open, currentName]);

    const handleSubmit = () => {
        // validate the new name
        const trimmedName = newName.trim();

        if (!trimmedName) {
            setError('Column name cannot be empty');
            return;
        }

        if (trimmedName === currentName) {
            setError('New name must be different from current name');
            return;
        }

        // call the rename handler
        onConfirm(trimmedName);
        onOpenChange(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rename Column</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="current-name" className="text-right">
                            Current
                        </Label>
                        <div className="col-span-3 text-sm text-muted-foreground">
                            {currentName}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-name" className="text-right">
                            New Name
                        </Label>
                        <Input
                            id="new-name"
                            value={newName}
                            onChange={(e) => {
                                setNewName(e.target.value);
                                setError(''); // clear error on change
                            }}
                            onKeyPress={handleKeyPress}
                            className="col-span-3"
                            autoFocus
                        />
                    </div>
                    {error && (
                        <div className="text-sm text-red-500 text-center">{error}</div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSubmit}>
                        Rename
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
