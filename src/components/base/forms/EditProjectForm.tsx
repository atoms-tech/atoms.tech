'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trash } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
    useDeleteProject,
    useUpdateProject,
} from '@/hooks/mutations/useProjectMutations';
import { useAuth } from '@/hooks/useAuth';
import { ProjectStatus, Visibility } from '@/types';
import { Project } from '@/types/base/projects.types';

const projectFormSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Project name must be at least 2 characters')
        .max(50, 'Project name cannot exceed 50 characters')
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

interface EditProjectFormProps {
    project: Project;
    onSuccess: () => void;
    onCancel: () => void;
    showDeleteConfirm: boolean;
    setShowDeleteConfirm: (show: boolean) => void;
}

export default function EditProjectForm({
    project,
    onSuccess,
    onCancel,
    showDeleteConfirm,
    setShowDeleteConfirm,
}: EditProjectFormProps) {
    const { userProfile } = useAuth();
    const { mutateAsync: updateProject, isPending } = useUpdateProject(
        project.id,
    );
    const { mutateAsync: deleteProject, isPending: isDeleting } =
        useDeleteProject();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams<{ orgId: string }>();

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectFormSchema),
        defaultValues: {
            name: project.name,
            description: project.description || '',
            status: project.status,
            visibility: project.visibility,
        },
    });

    async function onSubmit(data: ProjectFormValues) {
        if (!userProfile) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'You must be logged in to update the project',
            });
            return;
        }

        try {
            const trimmedName = data.name.trim();
            await updateProject({
                name: trimmedName,
                status: data.status,
                description: data.description || null,
                visibility: data.visibility,
                updated_by: userProfile.id,
            });

            toast({
                variant: 'default',
                title: 'Success',
                description: 'Project updated successfully',
            });
            onSuccess();
        } catch (error) {
            console.error('Error updating project:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update project. Please try again.',
            });
        }
    }

    const handleDeleteProject = async () => {
        if (!project || !userProfile) return;

        try {
            await deleteProject({
                projectId: project.id,
                userId: userProfile.id,
            });

            toast({
                variant: 'default',
                title: 'Success',
                description: 'Project deleted successfully',
            });

            // Navigate back to organization dashboard
            router.push(`/org/${params?.orgId}`);
        } catch (error) {
            console.error('Error deleting project:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete project. Please try again.',
            });
        }
    };

    return (
        <>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                >
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
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
                                    <Textarea {...field} />
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
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.values(ProjectStatus)
                                            .filter(
                                                (status) =>
                                                    status !==
                                                    ProjectStatus.deleted,
                                            ) // Disable changing status to deleted, let the delete button handle that.
                                            .map((status) => (
                                                <SelectItem
                                                    key={status}
                                                    value={status}
                                                >
                                                    {status}
                                                </SelectItem>
                                            ))}
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
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select visibility" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.values(Visibility).map(
                                            (visibility) => (
                                                <SelectItem
                                                    key={visibility}
                                                    value={visibility}
                                                >
                                                    {visibility}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-between items-center">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isDeleting}
                        >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Project
                        </Button>
                        <div className="flex space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={isPending || isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending || isDeleting}
                            >
                                {isPending ? 'Updating...' : 'Update Project'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the project and remove all associated data
                            including documents, requirements, and other
                            resources.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProject}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Project'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
