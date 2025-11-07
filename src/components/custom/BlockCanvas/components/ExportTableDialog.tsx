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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface ExportTableDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: {
        includeHeader: boolean;
        format: 'csv' | 'excel' | 'reqif';
    }) => Promise<void> | void;
    defaultIncludeHeader?: boolean;
    defaultFormat?: 'csv' | 'excel' | 'reqif';
}

export function ExportTableDialog({
    isOpen,
    onClose,
    onConfirm,
    defaultIncludeHeader = true,
    defaultFormat = 'csv',
}: ExportTableDialogProps) {
    const [includeHeader, setIncludeHeader] =
        React.useState<boolean>(defaultIncludeHeader);
    const [format, setFormat] = React.useState<'csv' | 'excel' | 'reqif'>(defaultFormat);
    const [isBusy, setIsBusy] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setIncludeHeader(defaultIncludeHeader);
            setFormat(defaultFormat);
            setIsBusy(false);
        }
    }, [isOpen, defaultIncludeHeader, defaultFormat]);

    const handleConfirm = async () => {
        try {
            setIsBusy(true);
            await onConfirm({ includeHeader, format });
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
                        <Label className="cursor-pointer">Format</Label>
                        <Select
                            value={format}
                            onValueChange={(v) =>
                                setFormat(v as 'csv' | 'excel' | 'reqif')
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="csv">CSV (.csv)</SelectItem>
                                <SelectItem value="excel">Excel (.xls)</SelectItem>
                                <SelectItem value="reqif">ReqIF (.reqif)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
