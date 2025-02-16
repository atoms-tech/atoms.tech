'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCreateDocument } from '@/hooks/mutations/useDocumentMutations';
// Document form schema based on the Document type and validation
const documentFormSchema = z.object({
    name: z.string().min(1, 'Document name is required'),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

const defaultValues: Partial<DocumentFormValues> = {
    name: '',
    description: '',
    tags: [],
};

interface DocumentFormProps {
    projectId: string;
    onSuccess: () => void;
}

export default function DocumentForm({ projectId, onSuccess }: DocumentFormProps) {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const { mutateAsync: createDocument, isPending: isCreatingDocument } = useCreateDocument();

    const form = useForm<DocumentFormValues>({
        resolver: zodResolver(documentFormSchema),
        defaultValues,
    });

    async function onSubmit(data: DocumentFormValues) {
        if (!userProfile) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'You must be logged in to create a document',
            });
            return;
        }

        try {
            await createDocument({
                name: data.name,
                description: data.description || null,
                project_id: projectId,
                slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                tags: data.tags || null,
                created_by: userProfile.id,
                updated_by: userProfile.id,
            });

            toast({
                variant: 'default',
                title: 'Success',
                description: 'Document created successfully',
            });
            onSuccess();
        } catch (error) {
            console.error('Failed to create document:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Failed to create document',
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

                {/* Tags input could be added here with a custom component or multi-select */}

                <div className="flex justify-end">
                    <Button type="submit" disabled={isCreatingDocument}>
                        {isCreatingDocument ? 'Creating...' : 'Create Document'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}