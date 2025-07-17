'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
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
import { useDuplicateDocument } from '@/hooks/mutations/useDocumentMutations';
import { useOrganizationProjects } from '@/hooks/queries/useProject';
import { Document } from '@/types/base/documents.types';
import { Project } from '@/types/base/projects.types';

const duplicateDocumentSchema = z.object({
    destinationProjectId: z.string().min(1, 'Please select a destination project'),
    newName: z.string().min(1, 'Document name is required'),
});

type DuplicateDocumentFormValues = z.infer<typeof duplicateDocumentSchema>;

interface DuplicateDocumentModalProps {
    document: Document;
    isOpen: boolean;
    onClose: () => void;
    organizationId: string;
    userId: string;
}

export default function DuplicateDocumentModal({
    document,
    isOpen,
    onClose,
    organizationId,
    userId,
}: DuplicateDocumentModalProps) {
    const { toast } = useToast();
    const duplicateDocument = useDuplicateDocument();
    const { data: projects } = useOrganizationProjects(organizationId);

    const form = useForm<DuplicateDocumentFormValues>({
        resolver: zodResolver(duplicateDocumentSchema),
        defaultValues: {
            destinationProjectId: document.project_id, // Default to current project
            newName: `${document.name} (Copy)`,
        },
    });

    async function onSubmit(data: DuplicateDocumentFormValues) {
        try {
            await duplicateDocument.mutateAsync({
                documentId: document.id,
                destinationProjectId: data.destinationProjectId,
                newName: data.newName,
                userId,
            });

            toast({
                variant: 'default',
                title: 'Success',
                description: `Document "${data.newName}" duplicated successfully`,
            });

            onClose();
            form.reset();
        } catch (error) {
            console.error('Error duplicating document:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to duplicate document. Please try again.',
            });
        }
    }

    const handleClose = () => {
        onClose();
        form.reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Duplicate Document</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="destinationProjectId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Destination Project</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a project" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {projects?.map((project: Project) => (
                                                <SelectItem
                                                    key={project.id}
                                                    value={project.id}
                                                >
                                                    {project.name}
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
                            name="newName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Document Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter new document name"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={duplicateDocument.isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={duplicateDocument.isPending}>
                                {duplicateDocument.isPending
                                    ? 'Duplicating...'
                                    : 'Duplicate'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
