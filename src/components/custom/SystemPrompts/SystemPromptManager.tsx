'use client';

// eslint-disable @typescript-eslint/no-explicit-any
import {
    Check,
    Edit,
    Eye,
    Globe,
    Loader2,
    Plus,
    Tag,
    Trash2,
    Building2,
    User,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/lib/providers/user.provider';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

interface SystemPrompt {
    id: string;
    name: string;
    description: string | null;
    content: string;
    scope: 'user' | 'organization' | 'system';
    user_id: string | null;
    organization_id: string | null;
    tags: string[] | null;
    is_default: boolean | null;
    is_public: boolean | null;
    created_at: string | null;
    updated_at: string | null;
    created_by: string | null;
    updated_by: string | null;
}

interface SystemPromptManagerProps {
    currentOrganizationId?: string;
    onPromptSelected?: (promptId: string) => void;
}

type PromptScope = 'all' | 'user' | 'organization' | 'system';

export const SystemPromptManager: React.FC<SystemPromptManagerProps> = ({
    currentOrganizationId,
    onPromptSelected,
}) => {
    const { user: _user, profile: _profile } = useUser();
    const { toast } = useToast();
    const { isPlatformAdmin } = usePlatformAdmin();

    // State
    const [allPrompts, setAllPrompts] = useState<SystemPrompt[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<PromptScope>('all');
    const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
    const [previewPrompt, setPreviewPrompt] = useState<SystemPrompt | null>(null);
    const [mergedPreview, setMergedPreview] = useState<string>('');
    const [mergedDetails, setMergedDetails] = useState<{
        system?: string | null;
        organization?: string | null;
        user?: string | null;
    }>({});

    // Dialog state
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        content: '',
        scope: 'user' as 'user' | 'organization' | 'system',
        tags: [] as string[],
        is_default: false,
        is_public: false,
    });
    const [tagInput, setTagInput] = useState('');

    // Load prompts
    const loadPrompts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('scope', 'all');
            if (currentOrganizationId) {
                params.set('organization_id', currentOrganizationId);
            }
            params.set('include_public', 'true');

            const response = await fetch(`/api/system-prompts?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to load prompts');
            }

            const data = await response.json();
            const nextPrompts: SystemPrompt[] = data.prompts || [];
            setAllPrompts(nextPrompts);

            if (
                selectedPromptId &&
                !nextPrompts.some((prompt) => prompt.id === selectedPromptId)
            ) {
                setSelectedPromptId(null);
            }
        } catch (error) {
            console.error('Error loading prompts:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load system prompts',
            });
        } finally {
            setLoading(false);
        }
        },
        [currentOrganizationId, toast, selectedPromptId],
    );

    // Load merged preview
    const loadMergedPreview = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (currentOrganizationId) {
                params.set('organization_id', currentOrganizationId);
            }
            params.set('include_details', 'true');

            const response = await fetch(`/api/platform/default-prompt?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to load merged preview');
            }

            const data = await response.json();
            setMergedPreview((data.merged_content || '').trim());
            setMergedDetails({
                system: data.details?.system_content ?? null,
                organization: data.details?.organization_content ?? null,
                user: data.details?.user_content ?? null,
            });
        } catch (error) {
            console.error('Error loading merged preview:', error);
        }
    }, [currentOrganizationId]);

    useEffect(() => {
        loadPrompts();
    }, [loadPrompts]);

    useEffect(() => {
        loadMergedPreview();
    }, [loadMergedPreview]);

    const promptsByScope = useMemo<Record<PromptScope, SystemPrompt[]>>(
        () => ({
            all: allPrompts,
            user: allPrompts.filter((prompt) => prompt.scope === 'user'),
            organization: allPrompts.filter(
                (prompt) =>
                    prompt.scope === 'organization' &&
                    (!currentOrganizationId || prompt.organization_id === currentOrganizationId),
            ),
            system: allPrompts.filter((prompt) => prompt.scope === 'system'),
        }),
        [allPrompts, currentOrganizationId],
    );

    const scopedPrompts = promptsByScope[activeTab];

    useEffect(() => {
        const firstPrompt = scopedPrompts[0];
        if (selectedPromptId && !scopedPrompts.some((p) => p.id === selectedPromptId)) {
            setSelectedPromptId(firstPrompt?.id ?? null);
        } else if (!selectedPromptId && firstPrompt) {
            setSelectedPromptId(firstPrompt.id);
        }
    }, [scopedPrompts, selectedPromptId]);

    // Handle create prompt
    const handleCreatePrompt = async () => {
        if (!formData.name || !formData.content) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Name and content are required',
            });
            return;
        }

        if (formData.scope === 'organization' && !currentOrganizationId) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'No organization selected',
            });
            return;
        }

        try {
            const body: Record<string, unknown> = {
                name: formData.name,
                description: formData.description || null,
                content: formData.content,
                scope: formData.scope,
                tags: formData.tags,
                is_default: formData.is_default,
                is_public: formData.is_public,
            };

            if (formData.scope === 'organization') {
                body.organization_id = currentOrganizationId;
            }

            const response = await fetch('/api/system-prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create prompt');
            }

            toast({
                variant: 'default',
                title: 'Success',
                description: 'System prompt created successfully',
            });

            setCreateDialogOpen(false);
            resetForm();
            loadPrompts();
            loadMergedPreview();
        } catch (error: unknown) {
            console.error('Error creating prompt:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to create system prompt',
            });
        }
    };

    // Handle update prompt
    const handleUpdatePrompt = async () => {
        if (!editingPrompt) return;

        try {
            const body: Record<string, unknown> = {
                name: formData.name,
                description: formData.description || null,
                content: formData.content,
                tags: formData.tags,
                is_default: formData.is_default,
            };

            if (editingPrompt.scope === 'system') {
                body.is_public = formData.is_public;
            }

            const response = await fetch(`/api/system-prompts/${editingPrompt.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update prompt');
            }

            toast({
                variant: 'default',
                title: 'Success',
                description: 'System prompt updated successfully',
            });

            setEditDialogOpen(false);
            setEditingPrompt(null);
            resetForm();
            loadPrompts();
            loadMergedPreview();
        } catch (error: unknown) {
            console.error('Error updating prompt:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update system prompt',
            });
        }
    };

    // Handle delete prompt
    const handleDeletePrompt = async (promptId: string) => {
        if (!confirm('Are you sure you want to delete this prompt?')) {
            return;
        }

        try {
            const response = await fetch(`/api/system-prompts/${promptId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete prompt');
            }

            toast({
                variant: 'default',
                title: 'Success',
                description: 'System prompt deleted successfully',
            });

            loadPrompts();
            loadMergedPreview();
        } catch (error: unknown) {
            console.error('Error deleting prompt:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to delete system prompt',
            });
        }
    };

    // Handle select prompt
    const handleSelectPrompt = (promptId: string) => {
        setSelectedPromptId(promptId);
        if (onPromptSelected) {
            onPromptSelected(promptId);
        }
    };

    // Open edit dialog
    const openEditDialog = (prompt: SystemPrompt) => {
        setEditingPrompt(prompt);
        setFormData({
            name: prompt.name,
            description: prompt.description || '',
            content: prompt.content,
            scope: prompt.scope,
            tags: prompt.tags || [],
            is_default: prompt.is_default || false,
            is_public: prompt.is_public || false,
        });
        setEditDialogOpen(true);
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            content: '',
            scope: 'user',
            tags: [],
            is_default: false,
            is_public: false,
        });
        setTagInput('');
    };

    // Add tag
    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
            setTagInput('');
        }
    };

    // Remove tag
    const removeTag = (tag: string) => {
        setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
    };

    // Get scope icon
    const getScopeIcon = (scope: string) => {
        switch (scope) {
            case 'user':
                return <User className="h-4 w-4" />;
            case 'organization':
                return <Building2 className="h-4 w-4" />;
            case 'system':
                return <Globe className="h-4 w-4" />;
            default:
                return null;
        }
    };

    // Get scope color
    const getScopeColor = (scope: string) => {
        switch (scope) {
            case 'user':
                return 'bg-muted text-muted-foreground border-primary/30';
            case 'organization':
                return 'bg-muted text-muted-foreground border-primary/40';
            case 'system':
                return 'bg-muted text-muted-foreground border-primary/50';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    // Source sections for merged preview breakdown
    const mergedSections = useMemo(
        () =>
            [
                {
                    scope: 'system' as const,
                    label: 'System (Base Layer)',
                    description: 'Organization-wide defaults managed by platform admins.',
                    content: (mergedDetails.system || '').trim(),
                },
                {
                    scope: 'organization' as const,
                    label: 'Organization (Middle Layer)',
                    description: 'Applies when chatting within this organization.',
                    content: (mergedDetails.organization || '').trim(),
                },
                {
                    scope: 'user' as const,
                    label: 'Personal (Top Layer)',
                    description: 'Your personal adjustments on top of other prompts.',
                    content: (mergedDetails.user || '').trim(),
                },
            ].map((section) => ({
                ...section,
                hasContent: section.content.length > 0,
            })),
        [mergedDetails],
    );

    const tabOrder: PromptScope[] = ['all', 'user', 'organization', 'system'];

    const emptyMessages: Record<PromptScope, string> = {
        all: 'No prompts found yet. Create one to get started.',
        user: 'No personal prompts yet. Create one to tailor the agent just for you.',
        organization: 'No organization prompts yet. Create one to standardize responses for your team.',
        system: 'System prompts define the universal defaults. Create one to set the global tone.',
    };

    const highlightByTab: Record<PromptScope, 'system' | 'organization' | 'user' | undefined> = {
        all: undefined,
        user: 'user',
        organization: 'organization',
        system: 'system',
    };

    const renderMergedPreviewCard = (highlight?: 'system' | 'organization' | 'user') => (
        <Card className="border-border bg-card">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    Current Merged Prompt
                </CardTitle>
                <CardDescription className="text-xs">
                    This is the final prompt combining system, organization, and personal layers.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {mergedPreview ? (
                    <pre className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-sm text-foreground shadow-sm">
                        {mergedPreview}
                    </pre>
                ) : (
                    <div className="rounded-md border border-dashed border-muted-foreground/20 bg-muted/50 p-3 text-center text-xs text-muted-foreground">
                        No default prompt configured yet.
                    </div>
                )}

                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Prompt Layers
                    </p>
                    {mergedSections.map((section) => {
                        const isHighlighted = highlight === section.scope;
                        const hasContent = section.hasContent;
                        return (
                            <div
                                key={section.scope}
                                className={`rounded-md border bg-background p-3 text-xs transition-colors ${
                                    isHighlighted
                                        ? 'border-primary ring-1 ring-primary/20'
                                        : 'border-border'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2 text-foreground">
                                    <span className="flex items-center gap-2">
                                        {getScopeIcon(section.scope)}
                                        <span>{section.label}</span>
                                    </span>
                                    <Badge
                                        variant={hasContent ? 'outline' : 'secondary'}
                                        className={hasContent ? 'border-primary text-primary' : ''}
                                    >
                                        {hasContent ? 'Active' : 'Empty'}
                                    </Badge>
                                </div>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    {section.description}
                                </p>
                                <p
                                    className={`mt-2 whitespace-pre-wrap text-foreground ${
                                        hasContent ? '' : 'italic text-muted-foreground'
                                    }`}
                                >
                                    {hasContent
                                        ? section.content
                                        : 'No prompt configured for this layer yet.'}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );

    const renderPromptList = (scope: PromptScope) => {
        const prompts = promptsByScope[scope];
        return (
            <ScrollArea className="h-[400px]">
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : prompts.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        {emptyMessages[scope]}
                    </div>
                ) : (
                    <div className="space-y-3 pr-4">
                        {prompts.map((prompt) => (
                            <Card
                                key={prompt.id}
                                className={`cursor-pointer transition-all hover:shadow-md bg-card border-border ${
                                    selectedPromptId === prompt.id
                                        ? 'border-primary ring-1 ring-primary/20'
                                        : ''
                                }`}
                                onClick={() => handleSelectPrompt(prompt.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-sm">
                                                        {prompt.name}
                                                    </h4>
                                                    {prompt.is_default && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-xs bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary"
                                                        >
                                                            <Check className="mr-1 h-3 w-3" />
                                                            Default
                                                        </Badge>
                                                    )}
                                                    {selectedPromptId === prompt.id && (
                                                        <Check className="h-4 w-4 text-primary" />
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge variant="outline" className={`text-xs ${getScopeColor(prompt.scope)}`}>
                                                        {getScopeIcon(prompt.scope)}
                                                        <span className="ml-1 capitalize">
                                                            {prompt.scope}
                                                        </span>
                                                    </Badge>
                                                    {prompt.is_public && (
                                                        <Badge variant="outline" className="text-xs">
                                                            <Globe className="mr-1 h-3 w-3" />
                                                            Public
                                                        </Badge>
                                                    )}
                                                    {prompt.tags &&
                                                        prompt.tags.length > 0 &&
                                                        prompt.tags.slice(0, 3).map((tag) => (
                                                            <Badge
                                                                key={tag}
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                <Tag className="mr-1 h-3 w-3" />
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openEditDialog(prompt);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleDeletePrompt(prompt.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {prompt.description && (
                                            <p className="text-xs text-muted-foreground">
                                                {prompt.description}
                                            </p>
                                        )}

                                        <div className="rounded-md bg-muted/40 p-3 text-xs whitespace-pre-wrap">
                                            {prompt.content}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
        );
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">System Prompts</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage AI agent prompts across user, organization, and system scopes
                    </p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Prompt
                </Button>
            </div>

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab((value as PromptScope) || 'all')}
            >
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all" className="flex items-center gap-1">
                        All
                    </TabsTrigger>
                    <TabsTrigger value="user" className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Personal
                    </TabsTrigger>
                    <TabsTrigger value="organization" className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Organization
                    </TabsTrigger>
                    <TabsTrigger value="system" className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        System
                    </TabsTrigger>
                </TabsList>

                {tabOrder.map((scope) => (
                    <TabsContent key={scope} value={scope} className="mt-4 space-y-4">
                        {renderMergedPreviewCard(highlightByTab[scope])}
                        {renderPromptList(scope)}
                    </TabsContent>
                ))}
            </Tabs>

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New System Prompt</DialogTitle>
                        <DialogDescription>
                            Create a new prompt for user, organization, or system scope
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="My Custom Prompt"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="A brief description of this prompt"
                            />
                        </div>

                        {/* Scope */}
                        <div className="space-y-2">
                            <Label htmlFor="scope">Scope *</Label>
                            <Select
                                value={formData.scope}
                                onValueChange={(value: string) =>
                                    setFormData({ ...formData, scope: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Personal (User)
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="organization" disabled={!currentOrganizationId}>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Organization
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="system" disabled={!isPlatformAdmin}>
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            System (Admin Only)
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                            <Label htmlFor="content">Content *</Label>
                            <Textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) =>
                                    setFormData({ ...formData, content: e.target.value })
                                }
                                placeholder="You are a helpful AI assistant that..."
                                rows={8}
                                className="font-mono text-sm"
                            />
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="tags"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                    placeholder="Add a tag and press Enter"
                                />
                                <Button type="button" onClick={addTag} variant="outline" size="sm">
                                    Add
                                </Button>
                            </div>
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="cursor-pointer"
                                            onClick={() => removeTag(tag)}
                                        >
                                            {tag} ?
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Options */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Set as Default</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Use this prompt as the default for this scope
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.is_default}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, is_default: checked })
                                    }
                                />
                            </div>

                            {formData.scope === 'system' && (
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Make Public</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Allow all users to view this prompt
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.is_public}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, is_public: checked })
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreatePrompt}>Create Prompt</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit System Prompt</DialogTitle>
                        <DialogDescription>
                            Modify the prompt details and content
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Same form fields as create dialog */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Input
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-content">Content *</Label>
                            <Textarea
                                id="edit-content"
                                value={formData.content}
                                onChange={(e) =>
                                    setFormData({ ...formData, content: e.target.value })
                                }
                                rows={8}
                                className="font-mono text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-tags">Tags</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="edit-tags"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                    placeholder="Add a tag and press Enter"
                                />
                                <Button type="button" onClick={addTag} variant="outline" size="sm">
                                    Add
                                </Button>
                            </div>
                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="cursor-pointer"
                                            onClick={() => removeTag(tag)}
                                        >
                                            {tag} ?
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Set as Default</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Use this prompt as the default for this scope
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.is_default}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, is_default: checked })
                                    }
                                />
                            </div>

                            {editingPrompt?.scope === 'system' && (
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Make Public</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Allow all users to view this prompt
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.is_public}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, is_public: checked })
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdatePrompt}>Update Prompt</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={!!previewPrompt} onOpenChange={() => setPreviewPrompt(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            {previewPrompt?.name}
                        </DialogTitle>
                        {previewPrompt?.description && (
                            <DialogDescription>{previewPrompt.description}</DialogDescription>
                        )}
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={getScopeColor(previewPrompt?.scope || '')}>
                                {getScopeIcon(previewPrompt?.scope || '')}
                                <span className="ml-1 capitalize">{previewPrompt?.scope}</span>
                            </Badge>
                            {previewPrompt?.is_default && (
                                <Badge variant="secondary" className="bg-muted text-primary border-primary/30">
                                    <Check className="h-3 w-3 mr-1" />
                                    Default
                                </Badge>
                            )}
                            {previewPrompt?.is_public && (
                                <Badge variant="outline">
                                    <Globe className="h-3 w-3 mr-1" />
                                    Public
                                </Badge>
                            )}
                        </div>

                        {previewPrompt?.tags && previewPrompt.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {previewPrompt.tags.map((tag) => (
                                    <Badge key={tag} variant="outline">
                                        <Tag className="h-3 w-3 mr-1" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <Separator />

                        <div className="space-y-2">
                            <Label>Content</Label>
                            <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
                                <pre className="text-xs font-mono whitespace-pre-wrap">
                                    {previewPrompt?.content}
                                </pre>
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                            Created: {previewPrompt?.created_at ? new Date(previewPrompt.created_at).toLocaleString() : 'Unknown'}
                            {previewPrompt?.updated_at &&
                                previewPrompt.updated_at !== previewPrompt.created_at && (
                                    <> ? Updated: {new Date(previewPrompt.updated_at).toLocaleString()}</>
                                )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewPrompt(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
