import {
    Calendar,
    Check,
    ChevronDown,
    ChevronRight,
    FileText,
    Hash,
    User,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface RequirementWithoutId {
    id?: string;
    name?: string;
    description?: string | null;
    external_id?: string | null;
    created_at?: string | null;
    created_by?: string | null;
    status?: string;
    priority?: string;
    block_id?: string;
    block_name?: string;
}

interface AssignRequirementIdsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedIds: string[]) => void;
    requirementsWithoutIds: RequirementWithoutId[];
    isLoading?: boolean;
}

export function AssignRequirementIdsModal({
    isOpen,
    onClose,
    onConfirm,
    requirementsWithoutIds,
    isLoading = false,
}: AssignRequirementIdsModalProps) {
    const [selectedRequirements, setSelectedRequirements] = useState<Set<string>>(
        new Set(),
    );
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    // Initialize with all requirements selected by default
    useEffect(() => {
        if (requirementsWithoutIds.length > 0) {
            const allIds = new Set(
                requirementsWithoutIds
                    .map((req) => req.id)
                    .filter((id): id is string => Boolean(id)),
            );
            setSelectedRequirements(allIds);
        }
    }, [requirementsWithoutIds]);

    const toggleRequirement = (requirementId: string) => {
        setSelectedRequirements((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(requirementId)) {
                newSet.delete(requirementId);
            } else {
                newSet.add(requirementId);
            }
            return newSet;
        });
    };

    const toggleAll = () => {
        const allIds = requirementsWithoutIds
            .map((req) => req.id)
            .filter((id): id is string => Boolean(id));

        if (selectedRequirements.size === allIds.length) {
            // All selected, deselect all
            setSelectedRequirements(new Set());
        } else {
            // Not all selected, select all
            setSelectedRequirements(new Set(allIds));
        }
    };

    const toggleExpanded = (requirementId: string) => {
        setExpandedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(requirementId)) {
                newSet.delete(requirementId);
            } else {
                newSet.add(requirementId);
            }
            return newSet;
        });
    };

    const expandAll = () => {
        const allIds = requirementsWithoutIds
            .map((req) => req.id)
            .filter((id): id is string => Boolean(id));
        setExpandedItems(new Set(allIds));
    };

    const collapseAll = () => {
        setExpandedItems(new Set());
    };

    const handleConfirm = () => {
        const selectedIds = Array.from(selectedRequirements);
        onConfirm(selectedIds);
    };

    // Calculate selection state
    const totalCount = requirementsWithoutIds.length;
    const selectedCount = selectedRequirements.size;
    const allSelected = selectedCount === totalCount && totalCount > 0;
    const someSelected = selectedCount > 0 && selectedCount < totalCount;

    // Format date helper
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5 text-orange-500" />
                        Assign Requirement IDs
                    </DialogTitle>
                    <DialogDescription>
                        Found <strong>{totalCount}</strong> requirement
                        {totalCount === 1 ? '' : 's'} without proper IDs. Select which
                        requirements should receive auto-generated REQ-IDs.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col space-y-4 min-h-0 overflow-hidden">
                    {/* Controls */}
                    <div className="flex-shrink-0 flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                checked={allSelected}
                                ref={(el) => {
                                    if (el) el.indeterminate = someSelected;
                                }}
                                onChange={toggleAll}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <span className="text-sm font-medium">
                                {allSelected
                                    ? 'Deselect All'
                                    : someSelected
                                      ? 'Select All'
                                      : 'Select All'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                                {selectedCount} of {totalCount} selected
                            </Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={expandAll}
                                className="h-8 px-2 text-xs"
                            >
                                Expand All
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={collapseAll}
                                className="h-8 px-2 text-xs"
                            >
                                Collapse All
                            </Button>
                        </div>
                    </div>

                    {/* Requirements List */}
                    <div className="flex-1 overflow-hidden">
                        <div
                            className="h-full w-full overflow-y-auto pr-4 scrollbar-hide"
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                            }}
                        >
                            <div className="space-y-1">
                                {requirementsWithoutIds.map((requirement, index) => {
                                    const isSelected = requirement.id
                                        ? selectedRequirements.has(requirement.id)
                                        : false;
                                    const isExpanded = requirement.id
                                        ? expandedItems.has(requirement.id)
                                        : false;

                                    return (
                                        <div
                                            key={requirement.id || index}
                                            className={cn(
                                                'border rounded-lg transition-all duration-200',
                                                isSelected
                                                    ? 'border-primary/50 bg-primary/5 shadow-sm'
                                                    : 'border-border bg-muted/20 opacity-60',
                                            )}
                                        >
                                            {/* Compact Header */}
                                            <div className="flex items-center gap-2 p-3 hover:bg-muted/50">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={() =>
                                                        requirement.id &&
                                                        toggleRequirement(requirement.id)
                                                    }
                                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                    disabled={!requirement.id}
                                                />

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        requirement.id &&
                                                        toggleExpanded(requirement.id)
                                                    }
                                                    className="h-6 w-6 p-0 hover:bg-muted"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </Button>

                                                {/* Block Icon */}
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="text-sm font-medium truncate">
                                                        {requirement.name ||
                                                            'Unnamed Requirement'}
                                                    </span>
                                                </div>

                                                {/* Status Badges */}
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {requirement.status && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {requirement.status}
                                                        </Badge>
                                                    )}
                                                    {requirement.priority && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {requirement.priority}
                                                        </Badge>
                                                    )}

                                                    {/* Current ID Badge */}
                                                    <div className="flex items-center gap-2">
                                                        {requirement.external_id ? (
                                                            <Badge
                                                                variant="destructive"
                                                                className="text-xs"
                                                            >
                                                                {requirement.external_id}
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs text-muted-foreground"
                                                            >
                                                                No ID
                                                            </Badge>
                                                        )}
                                                        <span className="text-xs text-muted-foreground">
                                                            →
                                                        </span>
                                                        <Badge
                                                            variant="default"
                                                            className="text-xs bg-green-600 hover:bg-green-700"
                                                        >
                                                            REQ-###
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Details */}
                                            {isExpanded && (
                                                <div className="px-3 pb-3 border-t bg-muted/30">
                                                    <div className="pt-3 space-y-2">
                                                        {/* Description */}
                                                        {requirement.description && (
                                                            <div>
                                                                <p className="text-sm text-muted-foreground font-medium mb-1">
                                                                    Description:
                                                                </p>
                                                                <p className="text-sm text-foreground">
                                                                    {
                                                                        requirement.description
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Metadata */}
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            {requirement.created_by && (
                                                                <div className="flex items-center gap-1">
                                                                    <User className="h-3 w-3" />
                                                                    {
                                                                        requirement.created_by
                                                                    }
                                                                </div>
                                                            )}
                                                            {requirement.created_at && (
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {formatDate(
                                                                        requirement.created_at,
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="flex-shrink-0" />

                <DialogFooter className="flex-shrink-0 gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || selectedCount === 0}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Assigning IDs...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Assign {selectedCount} ID
                                {selectedCount === 1 ? '' : 's'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
