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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useUpdateDocument } from '@/hooks/mutations/useDocumentMutations';
import { Document } from '@/types/base/documents.types';

// Document form schema based on the Document type and validation
const documentFormSchema = z.object({
    name: z.string().min(1, 'Document name is required'),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

interface EditDocumentFormProps {
    document: Document;
    isOpen: boolean;
    onClose: () => void;
    onDelete?: () => void;
    canDelete?: boolean;
}

export default function EditDocumentForm({
    document,
    isOpen,
    onClose,
    onDelete,
    canDelete = false,
}: EditDocumentFormProps) {
    const { toast } = useToast();
    const updateDocument = useUpdateDocument();

    const form = useForm<DocumentFormValues>({
        resolver: zodResolver(documentFormSchema),
        defaultValues: {
            name: document.name,
            description: document.description || '',
            tags: document.tags || [],
        },
    });

    async function onSubmit(data: DocumentFormValues) {
        try {
            await updateDocument.mutateAsync({
                ...document,
                name: data.name,
                description: data.description || null,
                tags: data.tags || null,
            });

            toast({
                variant: 'default',
                title: 'Success',
                description: 'Document updated successfully',
            });
            onClose();
        } catch (error) {
            console.error('Failed to update document:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description:
                    error instanceof Error ? error.message : 'Failed to update document',
            });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Document</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Document Name</FormLabel>
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

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter document description"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2">
                            {canDelete && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={onDelete}
                                >
                                    Delete
                                </Button>
                            )}
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateDocument.isPending}>
                                {updateDocument.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
