'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, ExternalLink, FileText, AlertCircle, Check } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRequirements } from '@/hooks/queries/useRequirement';
import type { 
    RequirementSelectionState, 
    DiagramElementLink 
} from '@/types/diagram-element-links.types';
import type { Requirement } from '@/types/base/requirements.types';

interface RequirementLinkDialogProps {
    state: RequirementSelectionState;
    onClose: () => void;
    onConfirm: (requirementId: string, elementId: string, existingLink?: DiagramElementLink) => void;
    projectId: string;
    isLoading?: boolean;
}

interface RequirementItemProps {
    requirement: Requirement;
    isSelected: boolean;
    onSelect: (id: string) => void;
    searchQuery: string;
}

function RequirementItem({ requirement, isSelected, onSelect, searchQuery }: RequirementItemProps) {
    const highlightText = (text: string, query: string) => {
        if (!query.trim()) return text;
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        
        return parts.map((part, index) => 
            regex.test(part) ? (
                <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
                    {part}
                </mark>
            ) : part
        );
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'in_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <div
            onClick={() => onSelect(requirement.id)}
            className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                            {highlightText(requirement.name, searchQuery)}
                        </h4>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    
                    {requirement.external_id && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            ID: {requirement.external_id}
                        </div>
                    )}
                    
                    {requirement.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                            {highlightText(requirement.description, searchQuery)}
                        </p>
                    )}
                    
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${getPriorityColor(requirement.priority)}`}>
                            {requirement.priority}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(requirement.status)}`}>
                            {requirement.status}
                        </Badge>
                        {requirement.type && (
                            <Badge variant="outline" className="text-xs">
                                {requirement.type}
                            </Badge>
                        )}
                    </div>
                </div>
                
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
        </div>
    );
}

export function RequirementLinkDialog({
    state,
    onClose,
    onConfirm,
    projectId,
    isLoading = false,
}: RequirementLinkDialogProps) {
    const [searchQuery, setSearchQuery] = useState(state.searchQuery || '');
    const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(
        state.selectedRequirementId || null
    );

    // Get requirements for the project
    const { data: requirements = [], isLoading: isLoadingRequirements } = useRequirements({
        projectId,
        // Add search filter if needed
    });

    // Filter requirements based on search query
    const filteredRequirements = useMemo(() => {
        if (!searchQuery.trim()) return requirements;
        
        const query = searchQuery.toLowerCase();
        return requirements.filter(req => 
            req.name.toLowerCase().includes(query) ||
            req.description?.toLowerCase().includes(query) ||
            req.external_id?.toLowerCase().includes(query) ||
            req.type?.toLowerCase().includes(query)
        );
    }, [requirements, searchQuery]);

    // Reset selection when dialog opens/closes
    useEffect(() => {
        if (state.isOpen) {
            setSearchQuery(state.searchQuery || '');
            setSelectedRequirementId(state.selectedRequirementId || null);
        }
    }, [state.isOpen, state.searchQuery, state.selectedRequirementId]);

    const handleConfirm = () => {
        if (selectedRequirementId && state.elementId) {
            onConfirm(selectedRequirementId, state.elementId, state.existingLink);
        }
    };

    const selectedRequirement = requirements.find(req => req.id === selectedRequirementId);

    return (
        <Dialog open={state.isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ExternalLink className="w-5 h-5" />
                        {state.existingLink ? 'Edit Requirement Link' : 'Link to Requirement'}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search requirements by name, description, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Requirements List */}
                    <div className="flex-1 min-h-0">
                        {isLoadingRequirements ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="text-sm text-gray-500">Loading requirements...</div>
                            </div>
                        ) : filteredRequirements.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                                <AlertCircle className="w-8 h-8 mb-2" />
                                <div className="text-sm">
                                    {searchQuery ? 'No requirements match your search' : 'No requirements found'}
                                </div>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="text-xs text-blue-600 hover:underline mt-1"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        ) : (
                            <ScrollArea className="h-full">
                                <div className="space-y-2 pr-4">
                                    {filteredRequirements.map((requirement) => (
                                        <RequirementItem
                                            key={requirement.id}
                                            requirement={requirement}
                                            isSelected={selectedRequirementId === requirement.id}
                                            onSelect={setSelectedRequirementId}
                                            searchQuery={searchQuery}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    {/* Selected Requirement Preview */}
                    {selectedRequirement && (
                        <div className="border-t pt-3">
                            <div className="text-sm font-medium mb-1">Selected:</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                {selectedRequirement.name}
                                {selectedRequirement.external_id && (
                                    <span className="ml-2 text-xs text-gray-500">
                                        ({selectedRequirement.external_id})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedRequirementId || isLoading}
                    >
                        {isLoading ? 'Linking...' : state.existingLink ? 'Update Link' : 'Create Link'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default RequirementLinkDialog;
