'use client';

import { AlertCircle, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    useProjectRequirements,
    useSearchProjectRequirements,
} from '@/hooks/queries/useProjectRequirements';
import { cn } from '@/lib/utils';
import { Requirement } from '@/types/base/requirements.types';

interface RequirementSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectRequirement: (requirement: Requirement, url: string) => void;
    currentLink?: string;
}

export const RequirementSearchModal: React.FC<RequirementSearchModalProps> = ({
    isOpen,
    onClose,
    onSelectRequirement,
    currentLink,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequirement, setSelectedRequirement] =
        useState<Requirement | null>(null);
    const [customUrl, setCustomUrl] = useState('');
    const [urlError, setUrlError] = useState('');

    const pathname = usePathname();

    // Extract project context from URL
    const pathParts = pathname.split('/');
    const orgIndex = pathParts.indexOf('org');
    const projectIndex = pathParts.indexOf('project');

    const orgId = orgIndex >= 0 ? pathParts[orgIndex + 1] : '';
    const projectId = projectIndex >= 0 ? pathParts[projectIndex + 1] : '';

    // Use project-wide requirements search
    const { data: allRequirements, isLoading: isLoadingAll } =
        useProjectRequirements(projectId);
    const { data: searchResults, isLoading: isSearching } =
        useSearchProjectRequirements(projectId, searchQuery);

    const requirements = searchQuery.trim() ? searchResults : allRequirements;
    const isLoading = searchQuery.trim() ? isSearching : isLoadingAll;

    // Filter and limit requirements for display
    const filteredRequirements = useMemo(() => {
        if (!requirements) return [];
        return requirements.slice(0, 10); // Limit results for performance
    }, [requirements]);

    // Validate URL
    const validateUrl = (url: string): boolean => {
        if (!url.trim()) return false;

        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;

            // Check for allowed domains
            const allowedDomains = [
                'localhost',
                'atoms.tech',
                'www.atoms.tech',
            ];

            // Check for Vercel deployment URLs
            const isVercelApp = hostname.endsWith('.vercel.app');
            const isAllowedDomain = allowedDomains.some(
                (domain) =>
                    hostname === domain || hostname.endsWith(`.${domain}`),
            );

            return isAllowedDomain || isVercelApp;
        } catch {
            return false;
        }
    };

    // Generate requirement URL
    const generateRequirementUrl = (requirement: Requirement): string => {
        return `${window.location.origin}/org/${orgId}/project/${projectId}/requirements/${requirement.id}`;
    };

    // Handle requirement selection
    const handleRequirementSelect = (requirement: Requirement) => {
        setSelectedRequirement(requirement);
        const url = generateRequirementUrl(requirement);
        setCustomUrl(url);
        setUrlError('');
    };

    // Handle custom URL change
    const handleUrlChange = (value: string) => {
        setCustomUrl(value);
        if (value && !validateUrl(value)) {
            setUrlError(
                'URL must be from atoms.tech, localhost, or *.vercel.app domain',
            );
        } else {
            setUrlError('');
        }
    };

    // Handle confirm selection
    const handleConfirm = () => {
        if (!selectedRequirement || !customUrl || urlError) return;

        onSelectRequirement(selectedRequirement, customUrl);
        onClose();
    };

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSelectedRequirement(null);
            setCustomUrl(currentLink || '');
            setUrlError('');
        }
    }, [isOpen, currentLink]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Link to Requirement
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 flex-1 min-h-0">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, description, ID, or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Requirements List */}
                    <div className="flex-1 min-h-0 border rounded-md">
                        <div className="p-2 border-b bg-muted/30">
                            <span className="text-sm font-medium">
                                Available Requirements
                            </span>
                        </div>
                        <div className="overflow-y-auto max-h-[300px]">
                            {isLoading ? (
                                <div className="p-4 text-center text-muted-foreground">
                                    Loading requirements...
                                </div>
                            ) : filteredRequirements.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">
                                    {searchQuery
                                        ? 'No requirements found matching your search'
                                        : 'No requirements available'}
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {filteredRequirements.map((requirement) => (
                                        <div
                                            key={requirement.id}
                                            className={cn(
                                                'p-3 cursor-pointer hover:bg-muted/50 transition-colors',
                                                selectedRequirement?.id ===
                                                    requirement.id &&
                                                    'bg-primary/10 border-l-2 border-l-primary',
                                            )}
                                            onClick={() =>
                                                handleRequirementSelect(
                                                    requirement,
                                                )
                                            }
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">
                                                        {requirement.name}
                                                    </div>
                                                    {requirement.external_id && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            ID:{' '}
                                                            {
                                                                requirement.external_id
                                                            }
                                                        </div>
                                                    )}
                                                    {requirement.description && (
                                                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {
                                                                requirement.description
                                                            }
                                                        </div>
                                                    )}
                                                    {requirement.tags &&
                                                        requirement.tags
                                                            .length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {requirement.tags
                                                                    .slice(0, 3)
                                                                    .map(
                                                                        (
                                                                            tag,
                                                                        ) => (
                                                                            <span
                                                                                key={
                                                                                    tag
                                                                                }
                                                                                className="inline-block px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded"
                                                                            >
                                                                                {
                                                                                    tag
                                                                                }
                                                                            </span>
                                                                        ),
                                                                    )}
                                                                {requirement
                                                                    .tags
                                                                    .length >
                                                                    3 && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        +
                                                                        {requirement
                                                                            .tags
                                                                            .length -
                                                                            3}{' '}
                                                                        more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span
                                                        className={cn(
                                                            'text-xs px-2 py-1 rounded',
                                                            'bg-secondary text-secondary-foreground',
                                                        )}
                                                    >
                                                        {requirement.level}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'text-xs px-2 py-1 rounded',
                                                            requirement.priority ===
                                                                'critical' &&
                                                                'bg-destructive text-destructive-foreground',
                                                            requirement.priority ===
                                                                'high' &&
                                                                'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                                                            requirement.priority ===
                                                                'medium' &&
                                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                                                            requirement.priority ===
                                                                'low' &&
                                                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                                                        )}
                                                    >
                                                        {requirement.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* URL Input */}
                    {selectedRequirement && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Requirement URL
                            </label>
                            <Input
                                placeholder="https://atoms.tech/org/..."
                                value={customUrl}
                                onChange={(e) =>
                                    handleUrlChange(e.target.value)
                                }
                                className={cn(urlError && 'border-destructive')}
                            />
                            {urlError && (
                                <div className="flex items-center gap-2 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    {urlError}
                                </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                                URL will be validated to ensure it&apos;s from an
                                allowed domain (atoms.tech, localhost, or
                                *.vercel.app)
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={
                            !selectedRequirement || !customUrl || !!urlError
                        }
                    >
                        Link Requirement
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
