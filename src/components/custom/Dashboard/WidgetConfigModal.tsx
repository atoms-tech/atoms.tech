'use client';

import { Settings } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import { WidgetConfigSchema, WidgetInstance, WidgetConfig, ConfigFieldOption } from '@/types/dashboard.types';

interface WidgetConfigModalProps {
    widget: WidgetInstance;
    configSchema?: WidgetConfigSchema;
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: WidgetConfig) => void;
}

export function WidgetConfigModal({
    widget,
    configSchema,
    isOpen,
    onClose,
    onSave,
}: WidgetConfigModalProps) {
    const [config, setConfig] = useState(widget.config || {});

    const handleSave = () => {
        onSave(config);
        onClose();
    };

    const renderConfigField = (key: string, field: WidgetConfigSchema[string]) => {
        const value = config[key] ?? field.default;

        switch (field.type) {
            case 'string':
                return (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key}>{field.label}</Label>
                        <Input
                            id={key}
                            value={String(value) || ''}
                            onChange={(e) =>
                                setConfig({ ...config, [key]: e.target.value })
                            }
                            placeholder={field.description}
                        />
                        {field.description && (
                            <p className="text-xs text-gray-500">
                                {field.description}
                            </p>
                        )}
                    </div>
                );

            case 'number':
                return (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key}>{field.label}</Label>
                        <Input
                            id={key}
                            type="number"
                            value={String(value) || ''}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    [key]: Number(e.target.value),
                                })
                            }
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            placeholder={field.description}
                        />
                        {field.description && (
                            <p className="text-xs text-gray-500">
                                {field.description}
                            </p>
                        )}
                    </div>
                );

            case 'boolean':
                return (
                    <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                            id={key}
                            checked={Boolean(value) || false}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    [key]: e.target.checked,
                                })
                            }
                        />
                        <div className="space-y-0.5">
                            <Label htmlFor={key}>{field.label}</Label>
                            {field.description && (
                                <p className="text-xs text-gray-500">
                                    {field.description}
                                </p>
                            )}
                        </div>
                    </div>
                );

            case 'select':
                return (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key}>{field.label}</Label>
                        <Select
                            value={String(value || field.default)}
                            onValueChange={(newValue) =>
                                setConfig({ ...config, [key]: newValue })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={field.description} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.options?.map((option: ConfigFieldOption) => (
                                    <SelectItem
                                        key={String(option.value)}
                                        value={String(option.value)}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {field.description && (
                            <p className="text-xs text-gray-500">
                                {field.description}
                            </p>
                        )}
                    </div>
                );

            case 'range':
                return (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key}>{field.label}</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id={key}
                                type="range"
                                value={Number(value || field.default || field.min || 0)}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        [key]: Number(e.target.value),
                                    })
                                }
                                min={field.min || 0}
                                max={field.max || 100}
                                step={field.step || 1}
                                className="flex-1"
                            />
                            <span className="text-sm text-gray-500 min-w-[3rem] text-right">
                                {String(value || field.default || field.min || 0)}
                            </span>
                        </div>
                        {field.description && (
                            <p className="text-xs text-gray-500">
                                {field.description}
                            </p>
                        )}
                    </div>
                );

            case 'color':
                return (
                    <div key={key} className="space-y-2">
                        <Label htmlFor={key}>{field.label}</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id={key}
                                type="color"
                                value={String(value || field.default || '#000000')}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        [key]: e.target.value,
                                    })
                                }
                                className="w-16 h-10 p-1 border rounded"
                            />
                            <Input
                                value={String(value || field.default || '#000000')}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        [key]: e.target.value,
                                    })
                                }
                                placeholder="#000000"
                                className="flex-1"
                            />
                        </div>
                        {field.description && (
                            <p className="text-xs text-gray-500">
                                {field.description}
                            </p>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Configure Widget
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {configSchema ? (
                        Object.entries(configSchema).map(([key, field]) =>
                            renderConfigField(key, field),
                        )
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>
                                No configuration options available for this
                                widget.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
