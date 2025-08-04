'use client';

// Remove unused X import
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';

interface InProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    features: string[];
    estimatedCompletion: string;
}

export function InProgressModal({
    isOpen,
    onClose,
    title,
    description,
    features,
    estimatedCompletion,
}: InProgressModalProps) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent data-testid="in-progress-modal" className="max-w-md">
                <DialogHeader>
                    <DialogTitle id="modal-title">{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {features.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2">Planned Features:</h4>
                            <ul className="space-y-1">
                                {features.map((feature, index) => (
                                    <li key={index} className="text-sm text-muted-foreground flex items-start">
                                        <span className="mr-2">•</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="pt-2 border-t">
                        <p className="text-sm">
                            <span className="font-medium">Estimated completion:</span>{' '}
                            {estimatedCompletion}
                        </p>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={onClose} aria-label="Close modal">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}