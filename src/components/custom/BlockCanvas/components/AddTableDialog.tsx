'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type TableLayoutOption = 'blank' | 'requirements_default';

interface AddTableDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (layout: TableLayoutOption, name: string) => Promise<void> | void;
}

export function AddTableDialog({ isOpen, onClose, onCreate }: AddTableDialogProps) {
    const [layout, setLayout] = useState<TableLayoutOption>('requirements_default');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tableName, setTableName] = useState('');

    const handleCreate = async () => {
        if (isSubmitting) return;
        try {
            setIsSubmitting(true);
            // Close immediately to prevent flicker/reopen during hydration
            onClose();
            await onCreate(layout, tableName.trim());
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                // Only handle close from internal interactions (esc, click outside)
                if (!open) onClose();
            }}
        >
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle>New Table</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Table Name</label>
                        <Input
                            placeholder="Untitled Table"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                        />
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setLayout('requirements_default')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ')
                                setLayout('requirements_default');
                        }}
                        className={`border rounded-md p-3 cursor-pointer ${layout === 'requirements_default' ? 'ring-2 ring-primary' : 'hover:bg-muted'}`}
                    >
                        <div className="font-medium">Requirements Default</div>
                        <div className="text-sm text-muted-foreground">
                            External_ID, Name, Description, Status, Priority columns. No
                            rows.
                        </div>
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setLayout('blank')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') setLayout('blank');
                        }}
                        className={`border rounded-md p-3 cursor-pointer ${layout === 'blank' ? 'ring-2 ring-primary' : 'hover:bg-muted'}`}
                    >
                        <div className="font-medium">Blank</div>
                        <div className="text-sm text-muted-foreground">
                            No columns, no rows.
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Table'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
