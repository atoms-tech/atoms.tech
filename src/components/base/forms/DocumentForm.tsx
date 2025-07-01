'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
// import { v4 as uuidv4 } from 'uuid'; // Reserved for future use
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useCreateDocumentWithDefaultSchemas } from '@/hooks/mutations/useDocumentMutations';
import { useAuth } from '@/hooks/useAuth';

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

export default function DocumentForm({
    projectId,
    onSuccess,
}: DocumentFormProps) {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const {
        mutateAsync: createDocumentWithSchemas,
        isPending: isCreatingDocument,
    } = useCreateDocumentWithDefaultSchemas();

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
            await createDocumentWithSchemas({
                name: data.name,
                description: data.description || null,
                project_id: projectId as string,
                slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                tags: data.tags || null,
                created_by: userProfile.id,
                updated_by: userProfile.id,
            });

            toast({
                variant: 'default',
                title: 'Success',
                description:
                    'Document created successfully with default property schemas',
            });
            onSuccess();
        } catch (error) {
            console.error('Failed to create document with schemas:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description:
                    error instanceof Error
                        ? error.message
                        : 'Failed to create document with schemas',
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
