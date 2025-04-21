'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useCreateProject } from '@/hooks/mutations/useProjectMutations';
import { useAuth } from '@/hooks/useAuth';
import { useProjectStore } from '@/store/project.store';
import { ProjectStatus, Visibility } from '@/types';

const projectFormSchema = z.object({
    name: z
        .string()
        .min(2, 'Project name must be at least 2 characters')
        .max(50, 'Project name cannot exceed 50 characters')
        .trim()
        .refine(
            (val) => val.length > 0,
            'Project name cannot be empty or just spaces',
        )
        .refine(
            (val) => /^[a-zA-Z0-9\s\-_]+$/.test(val),
            'Project name can only contain letters, numbers, spaces, hyphens and underscores',
        ),
    description: z.string().optional(),
    status: z.nativeEnum(ProjectStatus),
    visibility: z.nativeEnum(Visibility),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const defaultValues: Partial<ProjectFormValues> = {
    status: ProjectStatus.active,
    visibility: Visibility.private,
    name: '',
};

interface ProjectFormProps {
    onSuccess: () => void;
    organizationId?: string;
}

export default function ProjectForm({
    onSuccess,
    organizationId,
}: ProjectFormProps) {
    const { userProfile } = useAuth();
    const { mutateAsync: createProject, isPending } = useCreateProject();
    const { toast } = useToast();
    const { selectProject } = useProjectStore();
    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectFormSchema),
        defaultValues,
    });

    async function onSubmit(data: ProjectFormValues) {
        if (!userProfile) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'You must be logged in to create a project',
            });
            return;
        }

        try {
            const trimmedName = data.name.trim();
            const project = await createProject({
                name: trimmedName,
                status: data.status,
                description: data.description || null,
                visibility: data.visibility,
                organization_id:
                    organizationId ||
                    userProfile.current_organization_id ||
                    userProfile.personal_organization_id ||
                    '',
                owned_by: userProfile.id,
                metadata: {
                    source: 'web_app',
                    template_version: '1.0',
                },
                slug: trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                created_by: userProfile.id,
                updated_by: userProfile.id,
            });

            toast({
                variant: 'default',
                title: 'Success',
                description: 'Project created successfully',
            });
            // Select the newly created project to open it in the side panel
            if (project) {
                selectProject(project.id, project.name);
            }
            onSuccess();
        } catch (error) {
            console.error('Failed to create project:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Failed to create project',
            });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter project name"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter project description"
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project status" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={ProjectStatus.active}>
                                        Active
                                    </SelectItem>
                                    <SelectItem value={ProjectStatus.draft}>
                                        Draft
                                    </SelectItem>
                                    <SelectItem value={ProjectStatus.archived}>
                                        Archived
                                    </SelectItem>
                                    <SelectItem value={ProjectStatus.deleted}>
                                        Deleted
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Visibility</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project visibility" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={Visibility.public}>
                                        Public
                                    </SelectItem>
                                    <SelectItem value={Visibility.private}>
                                        Private
                                    </SelectItem>
                                    <SelectItem value={Visibility.team}>
                                        Team
                                    </SelectItem>
                                    <SelectItem value={Visibility.organization}>
                                        Organization
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? 'Creating...' : 'Create Project'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
