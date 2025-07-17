import React, { memo, useState } from 'react';

import {
    TestMatrixViewConfiguration,
    TestMatrixViewState,
} from '@/components/custom/RequirementsTesting/types';
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

interface SaveViewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (viewData: Omit<TestMatrixViewState, 'id'> | TestMatrixViewState) => void;
    currentView?: TestMatrixViewState;
    projectId: string;
    configuration: TestMatrixViewConfiguration;
}

function SaveViewDialogComponent({
    isOpen,
    onClose,
    onSave,
    currentView,
    projectId,
    configuration,
}: SaveViewDialogProps) {
    const [viewName, setViewName] = useState(currentView?.name || '');

    const handleSave = () => {
        if (!viewName.trim()) return;

        const viewData = currentView
            ? {
                  ...currentView,
                  name: viewName,
                  configuration,
              }
            : {
                  name: viewName,
                  configuration,
                  projectId,
              };

        onSave(viewData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {currentView ? 'Update View' : 'Save New View'}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="viewName">View Name</Label>
                    <Input
                        id="viewName"
                        value={viewName}
                        onChange={(e) => setViewName(e.target.value)}
                        placeholder="Enter a name for your view"
                        className="mt-2"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!viewName.trim()}>
                        {currentView ? 'Update' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export const SaveViewDialog = memo(SaveViewDialogComponent);
