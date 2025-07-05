'use client';

import { AlertCircle, Search } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Requirement } from '@/types/base/requirements.types';

interface RequirementSearchModalTestProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectRequirement: (requirement: Requirement, url: string) => void;
    currentLink?: string;
}

// Mock requirements data for testing
const mockRequirements: Requirement[] = [
    {
        id: '1',
        name: 'User Authentication System',
        description: 'The system shall provide secure user authentication using multi-factor authentication',
        external_id: 'REQ-001',
        level: 'system',
        priority: 'high',
        tags: ['security', 'authentication', 'user-management'],
        document_id: 'doc1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
    },
    {
        id: '2',
        name: 'Data Encryption Requirements',
        description: 'All sensitive data shall be encrypted at rest and in transit using AES-256 encryption',
        external_id: 'REQ-002',
        level: 'component',
        priority: 'critical',
        tags: ['security', 'encryption', 'data-protection'],
        document_id: 'doc1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
    },
    {
        id: '3',
        name: 'Performance Requirements',
        description: 'The system shall respond to user requests within 2 seconds under normal load conditions',
        external_id: 'REQ-003',
        level: 'system',
        priority: 'medium',
        tags: ['performance', 'response-time', 'user-experience'],
        document_id: 'doc1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
    },
    {
        id: '4',
        name: 'Accessibility Compliance',
        description: 'The user interface shall comply with WCAG 2.1 AA accessibility standards',
        external_id: 'REQ-004',
        level: 'interface',
        priority: 'medium',
        tags: ['accessibility', 'compliance', 'ui', 'wcag'],
        document_id: 'doc1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
    },
    {
        id: '5',
        name: 'Backup and Recovery',
        description: 'The system shall automatically backup all data daily and provide recovery capabilities within 4 hours',
        external_id: 'REQ-005',
        level: 'system',
        priority: 'high',
        tags: ['backup', 'recovery', 'data-protection', 'reliability'],
        document_id: 'doc1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
    },
];

export const RequirementSearchModalTest: React.FC<RequirementSearchModalTestProps> = ({
    isOpen,
    onClose,
    onSelectRequirement,
    currentLink,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
    const [customUrl, setCustomUrl] = useState('');
    const [urlError, setUrlError] = useState('');

    // Filter requirements based on search query
    const filteredRequirements = useMemo(() => {
        if (!searchQuery.trim()) return mockRequirements.slice(0, 10);
        
        const query = searchQuery.toLowerCase();
        return mockRequirements.filter(req => 
            req.name.toLowerCase().includes(query) ||
            (req.description && req.description.toLowerCase().includes(query)) ||
            (req.external_id && req.external_id.toLowerCase().includes(query)) ||
            (req.tags && req.tags.some(tag => tag.toLowerCase().includes(query)))
        ).slice(0, 10);
    }, [searchQuery]);

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
                'www.atoms.tech'
            ];
            
            // Check for Vercel deployment URLs
            const isVercelApp = hostname.endsWith('.vercel.app');
            const isAllowedDomain = allowedDomains.some(domain => 
                hostname === domain || hostname.endsWith(`.${domain}`)
            );
            
            return isAllowedDomain || isVercelApp;
        } catch {
            return false;
        }
    };

    // Generate requirement URL
    const generateRequirementUrl = (requirement: Requirement): string => {
        return `${window.location.origin}/org/demo/project/demo/requirements/${requirement.id}`;
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
            setUrlError('URL must be from atoms.tech, localhost, or *.vercel.app domain');
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
                        Link to Requirement (Test Mode)
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
                            <span className="text-sm font-medium">Available Requirements (Mock Data)</span>
                        </div>
                        <div className="overflow-y-auto max-h-[300px]">
                            {filteredRequirements.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">
                                    {searchQuery ? 'No requirements found matching your search' : 'No requirements available'}
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {filteredRequirements.map((requirement) => (
                                        <div
                                            key={requirement.id}
                                            className={cn(
                                                'p-3 cursor-pointer hover:bg-muted/50 transition-colors',
                                                selectedRequirement?.id === requirement.id && 'bg-primary/10 border-l-2 border-l-primary'
                                            )}
                                            onClick={() => handleRequirementSelect(requirement)}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">
                                                        {requirement.name}
                                                    </div>
                                                    {requirement.external_id && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            ID: {requirement.external_id}
                                                        </div>
                                                    )}
                                                    {requirement.description && (
                                                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                            {requirement.description}
                                                        </div>
                                                    )}
                                                    {requirement.tags && requirement.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {requirement.tags.slice(0, 3).map((tag) => (
                                                                <span
                                                                    key={tag}
                                                                    className="inline-block px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                            {requirement.tags.length > 3 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    +{requirement.tags.length - 3} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={cn(
                                                        'text-xs px-2 py-1 rounded',
                                                        'bg-secondary text-secondary-foreground'
                                                    )}>
                                                        {requirement.level}
                                                    </span>
                                                    <span className={cn(
                                                        'text-xs px-2 py-1 rounded',
                                                        requirement.priority === 'critical' && 'bg-destructive text-destructive-foreground',
                                                        requirement.priority === 'high' && 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                                                        requirement.priority === 'medium' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                                                        requirement.priority === 'low' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    )}>
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
                            <label className="text-sm font-medium">Requirement URL</label>
                            <Input
                                placeholder="https://atoms.tech/org/..."
                                value={customUrl}
                                onChange={(e) => handleUrlChange(e.target.value)}
                                className={cn(urlError && 'border-destructive')}
                            />
                            {urlError && (
                                <div className="flex items-center gap-2 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    {urlError}
                                </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                                URL will be validated to ensure it&apos;s from an allowed domain (atoms.tech, localhost, or *.vercel.app)
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
                        disabled={!selectedRequirement || !customUrl || !!urlError}
                    >
                        Link Requirement
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
