'use client';

import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { Link2, Link2Off, Pencil } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { RequirementPicker } from './RequirementPicker';

type ElementWithRequirementProps = ExcalidrawElement & {
    requirementId?: string;
    documentId?: string;
};

interface RequirementLinkPanelProps {
    selectedElements: readonly ExcalidrawElement[];
    projectId: string;
    documentId: string;
    onLink: (requirementId: string, requirementName: string) => void;
    onUnlink: () => void;
    position?: { x: number; y: number };
}

export function RequirementLinkPanel({
    selectedElements,
    projectId,
    documentId: _documentId,
    onLink,
    onUnlink,
    position,
}: RequirementLinkPanelProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedRequirementId, setSelectedRequirementId] = useState('');

    if (!selectedElements.length) return null;

    // Check if any selected element has a requirement link
    const hasRequirementLink = selectedElements.some((el) => {
        const element = el as ElementWithRequirementProps;
        return !!element.requirementId;
    });

    // Get the first element's requirement ID (for display)
    const firstElement = selectedElements.find((el) => {
        const element = el as ElementWithRequirementProps;
        return !!element.requirementId;
    }) as ElementWithRequirementProps | undefined;
    const firstRequirementId = firstElement?.requirementId;

    const handleLink = (requirementId: string, requirementName: string) => {
        onLink(requirementId, requirementName);
        setIsDialogOpen(false);
        setSelectedRequirementId('');
    };

    const handleUnlink = () => {
        onUnlink();
    };

    const handleOpenDialog = () => {
        // Pre-select current requirement if exists
        if (firstRequirementId) {
            setSelectedRequirementId(firstRequirementId);
        }
        setIsDialogOpen(true);
    };

    return (
        <>
            {/* Floating panel */}
            <div
                className="absolute z-[1002] bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-2 flex gap-1"
                style={{
                    left: position?.x || 10,
                    top: position?.y || 10,
                }}
            >
                {hasRequirementLink ? (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5"
                            onClick={handleOpenDialog}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Link
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={handleUnlink}
                        >
                            <Link2Off className="h-3.5 w-3.5" />
                            Unlink
                        </Button>
                    </>
                ) : (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5"
                        onClick={handleOpenDialog}
                    >
                        <Link2 className="h-3.5 w-3.5" />
                        Link to Requirement
                    </Button>
                )}
            </div>

            {/* Link dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {hasRequirementLink
                                ? 'Edit Requirement Link'
                                : 'Link to Requirement'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedElements.length === 1
                                ? 'Link this element to a requirement'
                                : `Link ${selectedElements.length} selected elements to a requirement`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <RequirementPicker
                            projectId={projectId}
                            value={selectedRequirementId}
                            onChange={handleLink}
                            onClose={() => setIsDialogOpen(false)}
                            placeholder="Search by ID or name..."
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
