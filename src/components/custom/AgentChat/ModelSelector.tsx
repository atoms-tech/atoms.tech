/**
 * ModelSelector - Compact model selector for chat bar
 * 
 * Syncs with settings modal model selection
 */

'use client';

import { Check, ChevronDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ModelInfo } from '@/lib/services/agentapi.service';

import { formatModelDisplayName } from './utils/modelUtils';

interface ModelSelectorProps {
    selectedModel: string;
    onModelChange: (model: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    selectedModel,
    onModelChange,
}) => {
    const [models, setModels] = useState<ModelInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/models')
            .then((res) => res.json())
            .then((data) => {
                setModels(data.data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load models:', err);
                setLoading(false);
            });
    }, []);

    const selectedModelInfo = models.find((m) => m.id === selectedModel);
    const displayName = selectedModelInfo
        ? formatModelDisplayName(selectedModelInfo.id, selectedModelInfo.owned_by).displayName
        : selectedModel;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={loading}
                >
                    <span className="max-w-[150px] truncate">
                        {loading ? 'Loading...' : displayName}
                    </span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[250px]">
                {models.map((model) => {
                    const display = formatModelDisplayName(model.id, model.owned_by);
                    return (
                        <DropdownMenuItem
                            key={model.id}
                            onClick={() => onModelChange(model.id)}
                            className="flex items-center justify-between"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{display.displayName}</span>
                                <span className="text-xs text-muted-foreground">
                                    {display.providerLabel || model.owned_by}
                                </span>
                            </div>
                            {selectedModel === model.id && (
                                <Check className="h-4 w-4" />
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
