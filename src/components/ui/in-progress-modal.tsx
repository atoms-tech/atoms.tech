'use client';

import { Wrench, X } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface InProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    features?: string[];
    estimatedCompletion?: string;
}

export function InProgressModal({
    isOpen,
    onClose,
    title,
    description,
    features = [],
    estimatedCompletion,
}: InProgressModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2 rounded-full bg-muted px-3 py-1.5">
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">
                                In Progress
                            </span>
                        </div>
                    </div>
                    <DialogTitle className="text-left">{title}</DialogTitle>
                    <DialogDescription className="text-left">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {features.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium mb-2">
                                Planned Features:
                            </h4>
                            <ul className="space-y-1">
                                {features.map((feature, index) => (
                                    <li
                                        key={index}
                                        className="text-sm text-muted-foreground flex items-center space-x-2"
                                    >
                                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {estimatedCompletion && (
                        <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-sm">
                                <span className="font-medium">
                                    Estimated completion:
                                </span>{' '}
                                <span className="text-muted-foreground">
                                    {estimatedCompletion}
                                </span>
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button variant="outline" onClick={onClose}>
                            <X className="h-4 w-4 mr-2" />
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
