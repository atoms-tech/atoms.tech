'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Copy, 
  FileText, 
  FolderOpen, 
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  description?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  requirementsCount: number;
  tags: string[];
}

interface DuplicateOptions {
  newTitle: string;
  newDescription: string;
  targetOrganization: string;
  includeRequirements: boolean;
  includeTags: boolean;
  includeMetadata: boolean;
  preserveIds: boolean;
}

interface DocumentDuplicatorProps {
  document: Document;
  organizations: Array<{ id: string; name: string }>;
  onDuplicate: (documentId: string, options: DuplicateOptions) => Promise<void>;
  trigger?: React.ReactNode;
}

export function DocumentDuplicator({ 
  document, 
  organizations, 
  onDuplicate, 
  trigger 
}: DocumentDuplicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<DuplicateOptions>({
    newTitle: `${document.title} (Copy)`,
    newDescription: document.description || '',
    targetOrganization: document.organizationId,
    includeRequirements: true,
    includeTags: true,
    includeMetadata: false,
    preserveIds: false,
  });

  const handleDuplicate = async () => {
    if (!options.newTitle.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onDuplicate(document.id, options);
      setIsOpen(false);
      // Reset form
      setOptions({
        newTitle: `${document.title} (Copy)`,
        newDescription: document.description || '',
        targetOrganization: document.organizationId,
        includeRequirements: true,
        includeTags: true,
        includeMetadata: false,
        preserveIds: false,
      });
    } catch (error) {
      console.error('Failed to duplicate document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOption = <K extends keyof DuplicateOptions>(
    key: K, 
    value: DuplicateOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Copy className="h-4 w-4" />
            <span>Duplicate</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Copy className="h-5 w-5" />
            <span>Duplicate Document</span>
          </DialogTitle>
          <DialogDescription>
            Create a copy of "{document.title}" with customizable options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Source Document Info */}
          <Card className="bg-gray-50 dark:bg-gray-800/50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {document.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {document.description || 'No description'}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>{document.requirementsCount} requirements</span>
                    <span>{document.tags.length} tags</span>
                    <span>Created {new Date(document.createdAt).toLocaleDateString()}</span>
                  </div>
                  {document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {document.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Basic Settings
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="newTitle">Document Title *</Label>
              <Input
                id="newTitle"
                value={options.newTitle}
                onChange={(e) => updateOption('newTitle', e.target.value)}
                placeholder="Enter new document title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newDescription">Description</Label>
              <Textarea
                id="newDescription"
                value={options.newDescription}
                onChange={(e) => updateOption('newDescription', e.target.value)}
                placeholder="Enter document description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetOrganization">Target Organization</Label>
              <Select
                value={options.targetOrganization}
                onValueChange={(value) => updateOption('targetOrganization', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="h-4 w-4" />
                        <span>{org.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Copy Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Copy Options
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRequirements"
                  checked={options.includeRequirements}
                  onCheckedChange={(checked) => 
                    updateOption('includeRequirements', checked as boolean)
                  }
                />
                <Label htmlFor="includeRequirements" className="flex items-center space-x-2">
                  <span>Include all requirements</span>
                  <Badge variant="secondary" className="text-xs">
                    {document.requirementsCount} items
                  </Badge>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTags"
                  checked={options.includeTags}
                  onCheckedChange={(checked) => 
                    updateOption('includeTags', checked as boolean)
                  }
                />
                <Label htmlFor="includeTags" className="flex items-center space-x-2">
                  <span>Include tags</span>
                  <Badge variant="secondary" className="text-xs">
                    {document.tags.length} tags
                  </Badge>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeMetadata"
                  checked={options.includeMetadata}
                  onCheckedChange={(checked) => 
                    updateOption('includeMetadata', checked as boolean)
                  }
                />
                <Label htmlFor="includeMetadata">
                  Include metadata (creation dates, author info)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="preserveIds"
                  checked={options.preserveIds}
                  onCheckedChange={(checked) => 
                    updateOption('preserveIds', checked as boolean)
                  }
                />
                <Label htmlFor="preserveIds" className="flex items-center space-x-2">
                  <span>Preserve requirement IDs</span>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                </Label>
              </div>
            </div>

            {options.preserveIds && (
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Warning: ID Conflicts
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        Preserving IDs may cause conflicts if duplicating within the same organization. 
                        Consider using this option only when copying to a different organization.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Duplication Summary
              </h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p>• New document will be created: "{options.newTitle}"</p>
                <p>• Target organization: {organizations.find(o => o.id === options.targetOrganization)?.name}</p>
                {options.includeRequirements && (
                  <p>• {document.requirementsCount} requirements will be copied</p>
                )}
                {options.includeTags && (
                  <p>• {document.tags.length} tags will be copied</p>
                )}
                {options.includeMetadata && (
                  <p>• Original metadata will be preserved</p>
                )}
                {options.preserveIds && (
                  <p>• Original requirement IDs will be preserved</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDuplicate} 
            disabled={!options.newTitle.trim() || isLoading}
            className="flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>{isLoading ? 'Duplicating...' : 'Duplicate Document'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
