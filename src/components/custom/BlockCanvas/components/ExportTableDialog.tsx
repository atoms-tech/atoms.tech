'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ExportTableDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: { includeHeader: boolean }) => Promise<void> | void;
    defaultIncludeHeader?: boolean;
}

export function ExportTableDialog({
    isOpen,
    onClose,
    onConfirm,
    defaultIncludeHeader = true,
}: ExportTableDialogProps) {
    const [includeHeader, setIncludeHeader] =
        React.useState<boolean>(defaultIncludeHeader);
    const [isBusy, setIsBusy] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setIncludeHeader(defaultIncludeHeader);
            setIsBusy(false);
        }
    }, [isOpen, defaultIncludeHeader]);

    const handleConfirm = async () => {
        try {
            setIsBusy(true);
            await onConfirm({ includeHeader });
            onClose();
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Export table</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    <div className="flex items-center justify-between gap-3 py-2">
                        <Label htmlFor="include-header" className="cursor-pointer">
                            Include column names as first row
                        </Label>
                        <Switch
                            id="include-header"
                            checked={includeHeader}
                            onCheckedChange={setIncludeHeader}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isBusy}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={isBusy}>
                        {isBusy ? 'Exporting…' : 'Export'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
