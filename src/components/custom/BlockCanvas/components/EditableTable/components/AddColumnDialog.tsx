'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { usePeopleOptions } from '@/components/custom/BlockCanvas/components/EditableTable/hooks/usePeopleOptions';
import {
    EditableColumnType,
    PropertyConfig,
    PropertyScope,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
import { Property } from '@/components/custom/BlockCanvas/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganizationProperties } from '@/hooks/queries/useProperties';

interface AddColumnDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (
        columnName: string,
        type: EditableColumnType,
        propertyConfig: PropertyConfig,
        defaultValue: string,
    ) => void;
    onSaveFromProperty?: (propertyId: string, defaultValue: string) => void;
    orgId: string;
    projectId?: string;
    documentId?: string;
    availableProperties?: Property[];
}

export function AddColumnDialog({
    isOpen,
    onClose,
    onSave,
    onSaveFromProperty,
    orgId,
    projectId,
    documentId,
    availableProperties: initialProperties,
}: AddColumnDialogProps) {
    const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');
    const [columnName, setColumnName] = useState('');
    const [columnType, setColumnType] = useState<EditableColumnType>('text');
    const [options, setOptions] = useState('');
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

    // Use React Query to fetch and cache properties
    const { data: properties, isLoading: isLoadingProperties } =
        useOrganizationProperties(orgId, isOpen && activeTab === 'existing');

    // Prefill people options from org/project members when creating a People column
    const params = useParams();
    const resolvedOrgId = orgId || (params?.orgId as string) || '';
    const resolvedProjectId = (params?.projectId as string) || '';
    const { data: peoplePrefill = [] } = usePeopleOptions(
        resolvedOrgId || undefined,
        resolvedProjectId || undefined,
    );

    // Memoize availableProperties to prevent unnecessary recalculations
    const availableProperties = useMemo(
        () => initialProperties || properties || [],
        [initialProperties, properties],
    );

    // Default values for fields removed from UI
    const defaultScope: PropertyScope[] = ['document'];
    const defaultIsBase = false;
    const defaultValue = '';

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            setColumnName('');
            setColumnType('text');
            setOptions('');
            setActiveTab('new');

            // Set the first property as selected if there are any
            if (availableProperties.length > 0) {
                setSelectedPropertyId(availableProperties[0].id);
            }
        }
    }, [isOpen, availableProperties]);

    const handleSaveNewProperty = () => {
        const propertyConfig: PropertyConfig = {
            scope: defaultScope,
            is_base: defaultIsBase,
            org_id: orgId,
            ...(projectId &&
                defaultScope.includes('project') && { project_id: projectId }),
            ...(documentId &&
                defaultScope.includes('document') && {
                    document_id: documentId,
                }),
            ...(['select', 'multi_select', 'people'].includes(columnType) && {
                options:
                    columnType === 'people'
                        ? Array.from(
                              new Set([
                                  ...peoplePrefill,
                                  ...((options || '')
                                      .split(',')
                                      .map((opt) => opt.trim())
                                      .filter(Boolean) || []),
                              ]),
                          )
                        : (options || '')
                              .split(',')
                              .map((opt) => opt.trim())
                              .filter(Boolean),
            }),
        };

        onSave(columnName, columnType, propertyConfig, defaultValue);
        onClose();
    };

    const handleSaveExistingProperty = () => {
        if (!onSaveFromProperty || !selectedPropertyId) return;

        onSaveFromProperty(selectedPropertyId, defaultValue);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Column</DialogTitle>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as 'new' | 'existing')}
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="new">Create New Property</TabsTrigger>
                        <TabsTrigger value="existing" disabled={!onSaveFromProperty}>
                            Use Existing Property
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="new">
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
                                    className="col-span-3 h-10 px-3 py-2 rounded-md border border-input"
                                >
                                    <option value="text">Text</option>
                                    <option value="select">Select</option>
                                    <option value="multi_select">Multi Select</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="people">People</option>
                                </select>
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
                            <Button
                                type="submit"
                                onClick={handleSaveNewProperty}
                                disabled={!columnName}
                            >
                                Add Column
                            </Button>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="existing">
                        {isLoadingProperties ? (
                            <div className="py-8 text-center">
                                Loading available properties...
                            </div>
                        ) : availableProperties.length === 0 ? (
                            <div className="py-8 text-center">
                                No properties available
                            </div>
                        ) : (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="existingProperty"
                                        className="text-right"
                                    >
                                        Property
                                    </Label>
                                    <select
                                        id="existingProperty"
                                        value={selectedPropertyId}
                                        onChange={(e) =>
                                            setSelectedPropertyId(e.target.value)
                                        }
                                        className="col-span-3 h-10 px-3 py-2 rounded-md border border-input"
                                    >
                                        {availableProperties.map((property) => (
                                            <option key={property.id} value={property.id}>
                                                {property.name} ({property.property_type})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                type="submit"
                                onClick={handleSaveExistingProperty}
                                disabled={!selectedPropertyId || !onSaveFromProperty}
                            >
                                Add Column
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
