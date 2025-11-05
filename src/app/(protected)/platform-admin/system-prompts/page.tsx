'use client';

import { Plus, Edit, Trash2, RefreshCw, Shield, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LayoutView from '@/components/views/LayoutView';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

interface SystemPrompt {
    id: string;
    name: string;
    description: string;
    content: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function SystemPromptsPage() {
    const { isPlatformAdmin, isLoading: adminLoading, error: adminError } = usePlatformAdmin();
    const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        content: '',
    });

    const fetchPrompts = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Mock data for now - in real implementation, this would fetch from API
            const mockPrompts: SystemPrompt[] = [
                {
                    id: '1',
                    name: 'Default Assistant',
                    description: 'Standard AI assistant prompt for general use',
                    content: 'You are a helpful AI assistant. Please provide accurate and helpful responses.',
                    is_active: true,
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z',
                },
                {
                    id: '2',
                    name: 'Technical Support',
                    description: 'Specialized prompt for technical support scenarios',
                    content: 'You are a technical support specialist. Help users resolve technical issues with clear, step-by-step instructions.',
                    is_active: true,
                    created_at: '2024-01-02T00:00:00Z',
                    updated_at: '2024-01-02T00:00:00Z',
                },
                {
                    id: '3',
                    name: 'Creative Writing',
                    description: 'Prompt optimized for creative writing tasks',
                    content: 'You are a creative writing assistant. Help users craft engaging stories, poems, and creative content.',
                    is_active: false,
                    created_at: '2024-01-03T00:00:00Z',
                    updated_at: '2024-01-03T00:00:00Z',
                },
            ];

            setPrompts(mockPrompts);
        } catch (err) {
            console.error('Error fetching prompts:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddPrompt = async () => {
        if (!formData.name || !formData.content) {
            setError('Name and content are required');
            return;
        }

        try {
            // Mock API call - in real implementation, this would call the API
            const newPrompt: SystemPrompt = {
                id: Date.now().toString(),
                name: formData.name,
                description: formData.description,
                content: formData.content,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            setPrompts(prev => [newPrompt, ...prev]);
            setFormData({ name: '', description: '', content: '' });
            setIsAddDialogOpen(false);
        } catch (err) {
            console.error('Error adding prompt:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const handleEditPrompt = async () => {
        if (!editingPrompt || !formData.name || !formData.content) {
            setError('Name and content are required');
            return;
        }

        try {
            // Mock API call - in real implementation, this would call the API
            const updatedPrompt: SystemPrompt = {
                ...editingPrompt,
                name: formData.name,
                description: formData.description,
                content: formData.content,
                updated_at: new Date().toISOString(),
            };

            setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? updatedPrompt : p));
            setEditingPrompt(null);
            setFormData({ name: '', description: '', content: '' });
            setIsEditDialogOpen(false);
        } catch (err) {
            console.error('Error editing prompt:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const handleDeletePrompt = async (id: string) => {
        if (!confirm('Are you sure you want to delete this system prompt?')) {
            return;
        }

        try {
            // Mock API call - in real implementation, this would call the API
            setPrompts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Error deleting prompt:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const openEditDialog = (prompt: SystemPrompt) => {
        setEditingPrompt(prompt);
        setFormData({
            name: prompt.name,
            description: prompt.description,
            content: prompt.content,
        });
        setIsEditDialogOpen(true);
    };

    useEffect(() => {
        if (isPlatformAdmin) {
            fetchPrompts();
        }
    }, [isPlatformAdmin]);

    // Redirect if not platform admin
    if (!adminLoading && !isPlatformAdmin) {
        return (
            <LayoutView>
                <div className="container mx-auto p-6">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                            <p className="text-muted-foreground text-center">
                                You need platform admin privileges to access this page.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </LayoutView>
        );
    }

    if (adminLoading) {
        return (
            <LayoutView>
                <div className="container mx-auto p-6">
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading...</span>
                    </div>
                </div>
            </LayoutView>
        );
    }

    if (adminError) {
        return (
            <LayoutView>
                <div className="container mx-auto p-6">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Shield className="h-12 w-12 text-destructive mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Error</h2>
                            <p className="text-muted-foreground text-center">{adminError}</p>
                        </CardContent>
                    </Card>
                </div>
            </LayoutView>
        );
    }

    return (
        <LayoutView>
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <FileText className="h-8 w-8" />
                            System Prompts Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage AI system prompts used across the platform
                        </p>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Prompt
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Add System Prompt</DialogTitle>
                                <DialogDescription>
                                    Create a new system prompt for AI interactions.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g., Customer Support Assistant"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Brief description of this prompt's purpose"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="content">Prompt Content</Label>
                                    <Textarea
                                        id="content"
                                        value={formData.content}
                                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                        placeholder="Enter the system prompt content..."
                                        rows={8}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAddPrompt}>Add Prompt</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{prompts.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Prompts</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {prompts.filter(p => p.is_active).length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inactive Prompts</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-muted-foreground">
                                {prompts.filter(p => !p.is_active).length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Prompts List */}
                <Card>
                    <CardHeader>
                        <CardTitle>System Prompts</CardTitle>
                        <CardDescription>
                            Manage and configure AI system prompts
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <RefreshCw className="h-6 w-6 animate-spin" />
                                <span className="ml-2">Loading prompts...</span>
                            </div>
                        ) : prompts.length > 0 ? (
                            <div className="space-y-4">
                                {prompts.map((prompt) => (
                                    <div
                                        key={prompt.id}
                                        className="flex items-start justify-between p-4 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-medium">{prompt.name}</h3>
                                                <Badge variant={prompt.is_active ? "default" : "secondary"}>
                                                    {prompt.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {prompt.description}
                                            </p>
                                            <div className="text-xs text-muted-foreground">
                                                Updated: {new Date(prompt.updated_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(prompt)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeletePrompt(prompt.id)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No system prompts found</h3>
                                <p className="text-muted-foreground">
                                    Create your first system prompt to get started.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit System Prompt</DialogTitle>
                            <DialogDescription>
                                Update the system prompt configuration.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Customer Support Assistant"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-description">Description</Label>
                                <Input
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of this prompt's purpose"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-content">Prompt Content</Label>
                                <Textarea
                                    id="edit-content"
                                    value={formData.content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="Enter the system prompt content..."
                                    rows={8}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditPrompt}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </LayoutView>
    );
}