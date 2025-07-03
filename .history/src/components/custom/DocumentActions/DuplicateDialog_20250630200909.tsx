'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/lib/providers/user.provider';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Document } from '@/types/base/documents.types';

const duplicateSchema = z.object({
    targetProjectId: z.string().min(1, 'Please select a target project'),
    newName: z.string().min(1, 'Document name is required'),
});

type DuplicateFormData = z.infer<typeof duplicateSchema>;

interface Project {
    id: string;
    name: string;
    organization_id: string;
    role: string;
}

interface DuplicateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    document: Document;
    onDuplicate: (targetProjectId: string, newName?: string) => Promise<void>;
    isLoading: boolean;
}

export function DuplicateDialog({
    isOpen,
    onClose,
    document,
    onDuplicate,
    isLoading,
}: DuplicateDialogProps) {
    const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();

    const form = useForm<DuplicateFormData>({
        resolver: zodResolver(duplicateSchema),
        defaultValues: {
            targetProjectId: '',
            newName: `${document.name} (Copy)`,
        },
    });

    // Fetch available projects when dialog opens
    useEffect(() => {
        if (isOpen && user) {
            fetchAvailableProjects();
        }
    }, [isOpen, user, fetchAvailableProjects]);

    const fetchAvailableProjects = useCallback(async () => {
        if (!user) return;

        setLoadingProjects(true);
        try {
            // Get all projects where user has permission to create documents
            const { data: projects, error } = await supabase
                .from('projects')
                .select(
                    `
                    id,
                    name,
                    organization_id,
                    project_members!inner(
                        role
                    )
                `,
                )
                .eq('project_members.user_id', user.id)
                .in('project_members.role', [
                    'owner',
                    'admin',
                    'maintainer',
                    'editor',
                ])
                .eq('status', 'active')
                .order('name');

            if (error) {
                console.error('Error fetching projects:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load available projects',
                    variant: 'destructive',
                });
                return;
            }

            const formattedProjects: Project[] = projects.map((project) => ({
                id: project.id,
                name: project.name,
                organization_id: project.organization_id,
                role: project.project_members[0]?.role || 'viewer',
            }));

            setAvailableProjects(formattedProjects);
        } catch (error) {
            console.error('Error fetching projects:', error);
            toast({
                title: 'Error',
                description: 'Failed to load available projects',
                variant: 'destructive',
            });
        } finally {
            setLoadingProjects(false);
        }
    }, [user, toast]);

    const onSubmit = async (data: DuplicateFormData) => {
        try {
            await onDuplicate(data.targetProjectId, data.newName);
            form.reset();
        } catch {
            // Error handling is done in the parent component
        }
    };

    const handleClose = () => {
        form.reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Duplicate Document</DialogTitle>
                    <DialogDescription>
                        Create a copy of &quot;{document.name}&quot; in another project.
                        All blocks, requirements, and properties will be copied.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="targetProjectId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Target Project</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={loadingProjects}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={
                                                        loadingProjects
                                                            ? 'Loading projects...'
                                                            : 'Select a project'
                                                    }
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {availableProjects.map(
                                                (project) => (
                                                    <SelectItem
                                                        key={project.id}
                                                        value={project.id}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span>
                                                                {project.name}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                Role:{' '}
                                                                {project.role}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="newName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Document Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter document name"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || loadingProjects}
                            >
                                {isLoading
                                    ? 'Duplicating...'
                                    : 'Duplicate Document'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
