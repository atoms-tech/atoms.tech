'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userInstallSchema, type UserInstallForm } from '@/lib/schemas/mcp-install';
import { useInstallMCPServer } from '@/hooks/mutations/useMCPServerMutations';
import { OAuthFlowDialog } from './OAuthFlowDialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface UserInstallFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserInstallFormDialog({ open, onOpenChange }: UserInstallFormProps) {
    const { toast } = useToast();
    const [showOAuthDialog, setShowOAuthDialog] = useState(false);
    const [pendingInstallData, setPendingInstallData] = useState<UserInstallForm | null>(null);

    const form = useForm<UserInstallForm>({
        resolver: zodResolver(userInstallSchema),
        defaultValues: {
            name: '',
            url: '',
            transport: 'sse',
            auth: 'none',
            scope: 'user',
        },
    });

    const installMutation = useInstallMCPServer();

    const onSubmit = async (data: UserInstallForm) => {
        // If OAuth is selected, show OAuth dialog first
        if (data.auth === 'oauth') {
            setPendingInstallData(data);
            setShowOAuthDialog(true);
            return;
        }

        // Otherwise, install directly
        installMutation.mutate(data, {
            onSuccess: () => {
                toast({
                    title: 'Server installed',
                    description: 'MCP server has been successfully installed.',
                });
                onOpenChange(false);
                form.reset();
            },
            onError: (error: Error) => {
                toast({
                    title: 'Installation failed',
                    description: error.message,
                    variant: 'destructive',
                });
            },
        });
    };

    const handleOAuthComplete = (authResult: any) => {
        if (!pendingInstallData) return;

        // Install server with OAuth tokens
        const dataWithOAuth = {
            ...pendingInstallData,
            token: authResult.access_token,
        };

        installMutation.mutate(dataWithOAuth, {
            onSuccess: () => {
                toast({
                    title: 'Server installed',
                    description: 'MCP server has been successfully installed with OAuth.',
                });
                onOpenChange(false);
                form.reset();
                setPendingInstallData(null);
            },
            onError: (error: Error) => {
                toast({
                    title: 'Installation failed',
                    description: error.message,
                    variant: 'destructive',
                });
            },
        });
    };

    const authType = form.watch('auth');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Install MCP Server</DialogTitle>
                    <DialogDescription>Add a new MCP server to your workspace</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Server Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="My MCP Server" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Server URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://api.example.com/mcp" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="transport"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Transport</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select transport type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="sse">SSE (Server-Sent Events)</SelectItem>
                                            <SelectItem value="http">HTTP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        How the server communicates with clients
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="auth"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Authentication</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select auth method" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="bearer">Bearer Token</SelectItem>
                                            <SelectItem value="oauth">OAuth</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {authType === 'bearer' && (
                            <FormField
                                control={form.control}
                                name="token"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bearer Token</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Enter token" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="scope"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Scope</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select scope" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="organization">Organization</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>Who can access this server</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={installMutation.isPending}>
                                {installMutation.isPending ? 'Installing...' : 'Install Server'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>

            {/* OAuth Dialog */}
            {pendingInstallData && (
                <OAuthFlowDialog
                    open={showOAuthDialog}
                    onOpenChange={setShowOAuthDialog}
                    mcpNamespace={`user:${pendingInstallData.name}`}
                    organizationId={pendingInstallData.organization_id}
                    onComplete={handleOAuthComplete}
                />
            )}
        </Dialog>
    );
}

