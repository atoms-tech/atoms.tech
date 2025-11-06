'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Server,
  Link,
  Shield,
  Key,
  Terminal,
  Globe,
  Building,
  User,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

// Types
type TransportType = 'sse' | 'http' | 'stdio';
type AuthType = 'oauth' | 'bearer' | 'none';
type ServerScope = 'user' | 'organization' | 'system';

interface MCPServerConfig {
  id?: string;
  name: string;
  description: string;
  serverUrl?: string;
  transport: TransportType;
  authType: AuthType;
  scope: ServerScope;
  bearerToken?: string;
  stdioCommand?: string;
  environmentVariables?: Record<string, string>;
  workingDirectory?: string;
  organizationId?: string;
}

interface MCPServerConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (server: MCPServerConfig) => void;
  editingServer?: MCPServerConfig;
  userRole?: 'user' | 'admin' | 'platform_admin';
  organizationId?: string;
}

// Validation schemas
const baseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  transport: z.enum(['sse', 'http', 'stdio']),
  authType: z.enum(['oauth', 'bearer', 'none']),
  scope: z.enum(['user', 'organization', 'system']),
});

const userOrgSchema = baseSchema
  .extend({
    serverUrl: z.string().url('Invalid URL').min(1, 'Server URL is required'),
    bearerToken: z.string().optional(),
    organizationId: z.string().optional(),
  })
  .refine(
    (data) => {
      // User/Org scope only allows SSE/HTTP
      if (data.scope !== 'system' && data.transport === 'stdio') {
        return false;
      }
      return true;
    },
    {
      message: 'STDIO transport is only available for system scope',
      path: ['transport'],
    }
  )
  .refine(
    (data) => {
      // User/Org scope requires OAuth or Bearer
      if (data.scope !== 'system' && data.authType === 'none') {
        return false;
      }
      return true;
    },
    {
      message: 'OAuth or Bearer token required for user/organization scope',
      path: ['authType'],
    }
  )
  .refine(
    (data) => {
      // Bearer auth requires token
      if (data.authType === 'bearer' && !data.bearerToken?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: 'Bearer token is required when using bearer authentication',
      path: ['bearerToken'],
    }
  );

const systemSchema = baseSchema
  .extend({
    serverUrl: z.string().url('Invalid URL').optional(),
    bearerToken: z.string().optional(),
    stdioCommand: z.string().optional(),
    environmentVariables: z.record(z.string(), z.string()).optional(),
    workingDirectory: z.string().optional(),
  })
  .refine(
    (data) => {
      // STDIO requires command
      if (data.transport === 'stdio' && !data.stdioCommand?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: 'Command is required for STDIO transport',
      path: ['stdioCommand'],
    }
  )
  .refine(
    (data) => {
      // SSE/HTTP require URL
      if ((data.transport === 'sse' || data.transport === 'http') && !data.serverUrl?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: 'Server URL is required for SSE/HTTP transport',
      path: ['serverUrl'],
    }
  );

export function MCPServerConfigDialog({
  isOpen,
  onClose,
  onSuccess,
  editingServer,
  userRole = 'user',
  organizationId,
}: MCPServerConfigDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    detectedAuth?: string;
  } | null>(null);
  const [envVarInput, setEnvVarInput] = useState('');

  const isPlatformAdmin = userRole === 'platform_admin';
  const defaultScope: ServerScope = isPlatformAdmin ? 'system' : organizationId ? 'organization' : 'user';

  const form = useForm<MCPServerConfig>({
    resolver: zodResolver(isPlatformAdmin ? systemSchema : userOrgSchema),
    defaultValues: editingServer || {
      name: '',
      description: '',
      transport: 'sse',
      authType: 'oauth',
      scope: defaultScope,
      serverUrl: '',
      bearerToken: '',
      stdioCommand: '',
      environmentVariables: {},
      workingDirectory: '',
      organizationId: organizationId,
    },
  });

  const selectedScope = form.watch('scope');
  const selectedTransport = form.watch('transport');
  const selectedAuthType = form.watch('authType');

  // Reset transport if switching to user/org scope and STDIO is selected
  useEffect(() => {
    if (selectedScope !== 'system' && selectedTransport === 'stdio') {
      form.setValue('transport', 'sse');
    }
  }, [selectedScope, selectedTransport, form]);

  // Reset auth type if switching to user/org scope and none is selected
  useEffect(() => {
    if (selectedScope !== 'system' && selectedAuthType === 'none') {
      form.setValue('authType', 'oauth');
    }
  }, [selectedScope, selectedAuthType, form]);

  const handleTestConnection = async () => {
    const serverUrl = form.getValues('serverUrl');
    const transport = form.getValues('transport');

    if (!serverUrl && transport !== 'stdio') {
      toast({
        variant: 'destructive',
        title: 'Missing URL',
        description: 'Please enter a server URL to test the connection',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Test connection
      const testResponse = await fetch('/api/mcp/servers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl,
          transport,
        }),
      });

      const testData = await testResponse.json();

      if (!testResponse.ok) {
        setTestResult({
          success: false,
          message: testData.error || 'Connection test failed',
        });
        return;
      }

      // Auto-detect auth if possible
      const detectResponse = await fetch('/api/mcp/detect-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl }),
      });

      const detectData = await detectResponse.json();

      setTestResult({
        success: true,
        message: testData.message || 'Connection successful',
        detectedAuth: detectData.authType,
      });

      if (detectData.authType) {
        toast({
          variant: 'default',
          title: 'Auth Type Detected',
          description: `Detected ${detectData.authType} authentication`,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddEnvVar = () => {
    if (!envVarInput.trim()) return;

    const [key, ...valueParts] = envVarInput.split('=');
    const value = valueParts.join('=');

    if (!key || !value) {
      toast({
        variant: 'destructive',
        title: 'Invalid format',
        description: 'Use format: KEY=value',
      });
      return;
    }

    const currentVars = form.getValues('environmentVariables') || {};
    form.setValue('environmentVariables', {
      ...currentVars,
      [key.trim()]: value.trim(),
    });
    setEnvVarInput('');
  };

  const handleRemoveEnvVar = (key: string) => {
    const currentVars = form.getValues('environmentVariables') || {};
    const { [key]: _, ...rest } = currentVars;
    form.setValue('environmentVariables', rest);
  };

  const onSubmit = async (data: MCPServerConfig) => {
    setIsLoading(true);

    try {
      const endpoint = editingServer?.id
        ? `/api/mcp/servers/${editingServer.id}`
        : '/api/mcp/servers';

      const method = editingServer?.id ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save server configuration');
      }

      const savedServer = await response.json();

      toast({
        variant: 'default',
        title: 'Success',
        description: `MCP server ${editingServer ? 'updated' : 'created'} successfully`,
      });

      onSuccess?.(savedServer);
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save server',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {editingServer ? 'Edit MCP Server' : 'Add MCP Server'}
          </DialogTitle>
          <DialogDescription>
            Configure a Model Context Protocol server for AI integrations
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Basic Information</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="My MCP Server" {...field} />
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
                        placeholder="Brief description of this server..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!isPlatformAdmin}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            User - Personal use only
                          </div>
                        </SelectItem>
                        {organizationId && (
                          <SelectItem value="organization">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              Organization - Shared with team
                            </div>
                          </SelectItem>
                        )}
                        {isPlatformAdmin && (
                          <SelectItem value="system">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              System - Available to all users
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {selectedScope === 'system'
                        ? 'System-wide servers are available to all platform users'
                        : selectedScope === 'organization'
                        ? 'Organization servers are shared with all members'
                        : 'User servers are private to your account'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Transport Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Transport Configuration</h3>

              <FormField
                control={form.control}
                name="transport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transport Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transport" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sse">
                          <div className="flex items-center gap-2">
                            <Link className="h-4 w-4" />
                            SSE (Server-Sent Events)
                          </div>
                        </SelectItem>
                        <SelectItem value="http">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            HTTP
                          </div>
                        </SelectItem>
                        {selectedScope === 'system' && (
                          <SelectItem value="stdio">
                            <div className="flex items-center gap-2">
                              <Terminal className="h-4 w-4" />
                              STDIO (Local Process)
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedScope !== 'system' && (
                      <FormDescription>
                        User and organization scopes only support SSE and HTTP transports
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedTransport !== 'stdio' && (
                <FormField
                  control={form.control}
                  name="serverUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Server URL *</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="https://api.example.com/mcp"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTestConnection}
                          disabled={isTesting || !field.value}
                        >
                          {isTesting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Test'
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {testResult && (
                <Alert variant={testResult.success ? 'default' : 'destructive'}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {testResult.message}
                    {testResult.detectedAuth && (
                      <div className="mt-1 text-sm">
                        Detected auth: {testResult.detectedAuth}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {selectedTransport === 'stdio' && selectedScope === 'system' && (
                <>
                  <FormField
                    control={form.control}
                    name="stdioCommand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Command *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="node /path/to/server.js"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Command to start the MCP server process
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="workingDirectory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Working Directory</FormLabel>
                        <FormControl>
                          <Input placeholder="/path/to/working/dir" {...field} />
                        </FormControl>
                        <FormDescription>
                          Optional working directory for the process
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Environment Variables</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder="KEY=value"
                        value={envVarInput}
                        onChange={(e) => setEnvVarInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEnvVar();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddEnvVar}
                      >
                        Add
                      </Button>
                    </div>
                    {form.watch('environmentVariables') &&
                      Object.keys(form.watch('environmentVariables') || {}).length > 0 && (
                        <div className="space-y-1 mt-2">
                          {Object.entries(form.watch('environmentVariables') || {}).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center justify-between p-2 bg-muted rounded-md"
                              >
                                <code className="text-sm">
                                  {key}={value}
                                </code>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveEnvVar(key)}
                                >
                                  Remove
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      )}
                  </div>
                </>
              )}
            </div>

            {/* Authentication */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Authentication</h3>

              <FormField
                control={form.control}
                name="authType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authentication Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select auth type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="oauth">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            OAuth 2.0
                          </div>
                        </SelectItem>
                        <SelectItem value="bearer">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            Bearer Token
                          </div>
                        </SelectItem>
                        {selectedScope === 'system' && (
                          <SelectItem value="none">
                            <div className="flex items-center gap-2">
                              None (No Authentication)
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedScope !== 'system' && (
                      <FormDescription>
                        User and organization scopes require authentication
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedAuthType === 'bearer' && (
                <FormField
                  control={form.control}
                  name="bearerToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bearer Token *</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter bearer token"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This token will be securely stored and encrypted
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedAuthType === 'oauth' && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    OAuth configuration will be completed after creating the server
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingServer ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>{editingServer ? 'Update Server' : 'Create Server'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
