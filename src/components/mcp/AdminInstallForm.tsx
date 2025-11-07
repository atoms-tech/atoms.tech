'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminInstallSchema, type AdminInstallForm } from '@/lib/schemas/mcp-install';
import { useInstallMCPServer } from '@/hooks/mutations/useMCPServerMutations';
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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminInstallFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AdminInstallFormDialog({ open, onOpenChange }: AdminInstallFormProps) {
    const { toast } = useToast();

    const form = useForm<AdminInstallForm>({
        resolver: zodResolver(adminInstallSchema),
        defaultValues: {
            name: '',
            url: '',
            transport: 'sse',
            auth: 'none',
            scope: 'user',
            env_vars: {},
            custom_config: {},
        },
    });

    const installMutation = useInstallMCPServer();

    const onSubmit = async (data: AdminInstallForm) => {
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

    const transportType = form.watch('transport');
    const authType = form.watch('auth');
    const scope = form.watch('scope');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Install MCP Server (Admin)</DialogTitle>
                    <DialogDescription>
                        Advanced installation with all transport types and options
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Tabs defaultValue="basic">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Basic</TabsTrigger>
                                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                                <TabsTrigger value="config">Config</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4">
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
                                    name="transport"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Transport Type</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select transport" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="stdio">
                                                        STDIO (Local Process)
                                                    </SelectItem>
                                                    <SelectItem value="sse">
                                                        SSE (Server-Sent Events)
                                                    </SelectItem>
                                                    <SelectItem value="http">HTTP</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                How the server communicates
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {transportType === 'stdio' ? (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="command"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Command</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="node server.js"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Command to start the server
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Server URL</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="https://api.example.com/mcp"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="auth"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Authentication</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select auth method" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="bearer">
                                                        Bearer Token
                                                    </SelectItem>
                                                    <SelectItem value="oauth">OAuth</SelectItem>
                                                    <SelectItem value="api_key">API Key</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {(authType === 'bearer' || authType === 'api_key') && (
                                    <FormField
                                        control={form.control}
                                        name="token"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {authType === 'bearer' ? 'Bearer Token' : 'API Key'}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Enter token"
                                                        {...field}
                                                    />
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
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select scope" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="user">User</SelectItem>
                                                    <SelectItem value="organization">
                                                        Organization
                                                    </SelectItem>
                                                    <SelectItem value="system">System</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                Who can access this server
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {scope === 'organization' && (
                                    <FormField
                                        control={form.control}
                                        name="organization_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Organization ID</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter organization UUID"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </TabsContent>

                            <TabsContent value="advanced" className="space-y-4">
                                {transportType === 'stdio' && (
                                    <FormField
                                        control={form.control}
                                        name="args"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Command Arguments</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter arguments (one per line)"
                                                        {...field}
                                                        value={field.value?.join('\n') || ''}
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value
                                                                    .split('\n')
                                                                    .filter((s) => s.trim())
                                                            )
                                                        }
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Command line arguments (one per line)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <div>
                                    <FormLabel>Environment Variables</FormLabel>
                                    <FormDescription className="mb-2">
                                        Enter environment variables as JSON
                                    </FormDescription>
                                    <Textarea
                                        placeholder='{"KEY": "value"}'
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                form.setValue('env_vars', parsed);
                                            } catch {
                                                // Invalid JSON, ignore
                                            }
                                        }}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="config" className="space-y-4">
                                <div>
                                    <FormLabel>Custom Configuration</FormLabel>
                                    <FormDescription className="mb-2">
                                        Enter custom configuration as JSON
                                    </FormDescription>
                                    <Textarea
                                        placeholder='{"option": "value"}'
                                        rows={10}
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                form.setValue('custom_config', parsed);
                                            } catch {
                                                // Invalid JSON, ignore
                                            }
                                        }}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={installMutation.isPending}>
                                {installMutation.isPending ? 'Installing...' : 'Install Server'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

