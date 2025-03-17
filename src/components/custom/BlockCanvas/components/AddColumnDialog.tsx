import { PlusCircle } from 'lucide-react';
import type { FC, FormEvent } from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface AddColumnDialogProps {
    onAddColumn: (name: string, dataType: string) => Promise<void>;
    disabled?: boolean;
}

export const AddColumnDialog: FC<AddColumnDialogProps> = ({
    onAddColumn,
    disabled = false,
}) => {
    const [open, setOpen] = useState(false);
    const [columnName, setColumnName] = useState('');
    const [dataType, setDataType] = useState('string');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Validate input
        if (!columnName.trim()) {
            setError('Column name is required');
            return;
        }

        // Check if column name contains only alphanumeric characters and spaces
        if (!/^[a-zA-Z0-9 ]+$/.test(columnName)) {
            setError(
                'Column name can only contain letters, numbers, and spaces',
            );
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            await onAddColumn(columnName, dataType);
            setOpen(false);
            setColumnName('');
            setDataType('string');
        } catch (err) {
            console.error('Failed to add column:', err);
            setError('Failed to add column. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={disabled}
                >
                    <PlusCircle className="h-4 w-4" />
                    Add Column
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Column</DialogTitle>
                    <DialogDescription>
                        Create a new column for your table. This will add a new
                        property to all requirements.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={columnName}
                                onChange={(e) => setColumnName(e.target.value)}
                                className="col-span-3"
                                placeholder="Enter column name"
                                autoComplete="off"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dataType" className="text-right">
                                Data Type
                            </Label>
                            <Select
                                value={dataType}
                                onValueChange={setDataType}
                            >
                                <SelectTrigger
                                    className="col-span-3"
                                    id="dataType"
                                >
                                    <SelectValue placeholder="Select data type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="string">Text</SelectItem>
                                    <SelectItem value="number">
                                        Number
                                    </SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="boolean">
                                        Boolean
                                    </SelectItem>
                                    <SelectItem value="enum">Select</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {error && (
                            <div className="text-sm text-red-500 mt-2">
                                {error}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !columnName.trim()}
                        >
                            {isSubmitting ? 'Adding...' : 'Add Column'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
