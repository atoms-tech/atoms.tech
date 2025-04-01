'use client';

import { useState } from 'react';

import {
    EditableColumnType,
    PropertyConfig,
    PropertyScope,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddColumnDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (
        columnName: string,
        type: EditableColumnType,
        propertyConfig: PropertyConfig,
        defaultValue: string,
    ) => void;
    orgId: string;
    projectId?: string;
    documentId?: string;
}

export function AddColumnDialog({
    isOpen,
    onClose,
    onSave,
    orgId,
    projectId,
    documentId,
}: AddColumnDialogProps) {
    const [columnName, setColumnName] = useState('');
    const [columnType, setColumnType] = useState<EditableColumnType>('text');
    const [scope, setScope] = useState<PropertyScope[]>(['document']);
    const [isBase, setIsBase] = useState(false);
    const [defaultValue, setDefaultValue] = useState('');
    const [options, setOptions] = useState('');

    const handleSave = () => {
        const propertyConfig: PropertyConfig = {
            scope,
            is_base: isBase,
            org_id: orgId,
            ...(projectId &&
                scope.includes('project') && { project_id: projectId }),
            ...(documentId &&
                scope.includes('document') && { document_id: documentId }),
            ...(['select', 'multi_select'].includes(columnType) &&
                options && {
                    options: options.split(',').map((opt) => opt.trim()),
                }),
        };

        onSave(columnName, columnType, propertyConfig, defaultValue);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Column</DialogTitle>
                </DialogHeader>
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
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            Type
                        </Label>
                        <select
                            id="type"
                            value={columnType}
                            onChange={(e) =>
                                setColumnType(
                                    e.target.value as EditableColumnType,
                                )
                            }
                            className="col-span-3"
                        >
                            <option value="text">Text</option>
                            <option value="select">Select</option>
                            <option value="multi_select">Multi Select</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Scope</Label>
                        <div className="col-span-3 space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="org"
                                    checked={scope.includes('org')}
                                    onChange={(event) => {
                                        setScope((prev) =>
                                            event.target.checked
                                                ? [...prev, 'org']
                                                : prev.filter(
                                                      (s) => s !== 'org',
                                                  ),
                                        );
                                    }}
                                />
                                <Label htmlFor="org">Organization</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="project"
                                    checked={scope.includes('project')}
                                    onChange={(event) => {
                                        setScope((prev) =>
                                            event.target.checked
                                                ? [...prev, 'project']
                                                : prev.filter(
                                                      (s) => s !== 'project',
                                                  ),
                                        );
                                    }}
                                />
                                <Label htmlFor="project">Project</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="document"
                                    checked={scope.includes('document')}
                                    onChange={(event) => {
                                        setScope((prev) =>
                                            event.target.checked
                                                ? [...prev, 'document']
                                                : prev.filter(
                                                      (s) => s !== 'document',
                                                  ),
                                        );
                                    }}
                                />
                                <Label htmlFor="document">Document</Label>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Base Property</Label>
                        <div className="col-span-3">
                            <Checkbox
                                id="base"
                                checked={isBase}
                                onChange={(event) =>
                                    setIsBase(event.target.checked)
                                }
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="default" className="text-right">
                            Default Value
                        </Label>
                        <Input
                            id="default"
                            value={defaultValue}
                            onChange={(e) => setDefaultValue(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    {['select', 'multi_select'].includes(columnType) && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="options" className="text-right">
                                Options
                            </Label>
                            <Input
                                id="options"
                                value={options}
                                onChange={(e) => setOptions(e.target.value)}
                                placeholder="Option1, Option2, Option3"
                                className="col-span-3"
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSave}>
                        Add Column
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
