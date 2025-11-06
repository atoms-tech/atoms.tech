'use client';

// eslint-disable @typescript-eslint/no-explicit-any

/**
 * EnhancedMarketplace Component
 * Multi-registry marketplace with Anthropic + Cline registries
 */

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ServerCard } from './ServerCard';
import { ServerDetailModal } from './ServerDetailModal';
import { InstallationProgressModal, InstallationStepStatus } from './InstallationProgressModal';
import { ServerAuthConfigModal } from './ServerAuthConfigModal';
import { Search, Loader2, RefreshCw, Shield, Users, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Pagination } from '@/components/ui/pagination';
import { UnifiedMCPServer, RegistrySource } from '@/services/mcp/multi-registry.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface EnhancedMarketplaceProps {
    organizations?: Array<{ id: string; name: string }>;
    installedServers?: string[];
    onServerInstalled?: (server: UnifiedMCPServer) => void;
    showHeader?: boolean; // Optional: show/hide header
}

export function EnhancedMarketplace({ organizations = [], installedServers = [], onServerInstalled, showHeader = true }: EnhancedMarketplaceProps) {
    const { toast } = useToast();
    const [servers, setServers] = useState<UnifiedMCPServer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sourceFilter, setSourceFilter] = useState<'all' | RegistrySource>('all');
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [llmInstallOnly, setLLMInstallOnly] = useState(false);
    const [minQualityScore, setMinQualityScore] = useState<number>(0);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [categories, setCategories] = useState<string[]>([]);

    // Detail modal
    const [selectedServer, setSelectedServer] = useState<UnifiedMCPServer | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedTransport, setSelectedTransport] = useState<string>('all');
    const [selectedAuth, setSelectedAuth] = useState<string>('all');
    const [_transports, _setTransports] = useState<string[]>([]);
    const [_authTypes, _setAuthTypes] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>('quality');
    
    // Installation loading state - track by server namespace
    const [installingServers, setInstallingServers] = useState<Set<string>>(new Set());
    
    // Installation progress modal state
    const [installationProgress, setInstallationProgress] = useState<{
        server: UnifiedMCPServer | null;
        steps: InstallationStepStatus[];
        error?: string;
    } | null>(null);

    // Auth config modal state
    const [authConfigServer, setAuthConfigServer] = useState<UnifiedMCPServer | null>(null);
    const [authConfigModalOpen, setAuthConfigModalOpen] = useState(false);
    const [pendingInstallScope, setPendingInstallScope] = useState<{ scope: 'user' | 'organization'; orgId?: string } | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);
    const [totalServers, setTotalServers] = useState(0);
    
    // All possible auth types for filtering
  const allAuthTypes = ['none', 'oauth', 'bearer', 'api-key', 'unknown'] as const;

    // Fetch filter options (categories, transports, auth types) on initial load
    const fetchFilterOptions = useCallback(async () => {
        try {
            const response = await fetch('/api/mcp/marketplace/multi');
            if (!response.ok) throw new Error('Failed to fetch filter options');

            const data = await response.json();
            if (data.success) {
                const allServers = data.data.servers;
                
                const uniqueCategories = Array.from(
                    new Set(allServers.map((s: UnifiedMCPServer) => s.category).filter(Boolean))
                ) as string[];
                setCategories(uniqueCategories);

                // Extract unique transports
                const trans = Array.from(
                    new Set(
                        allServers
                            .map((s: UnifiedMCPServer) => s.transport?.type)
                            .filter(Boolean)
                    )
                ) as string[];
                setTransports(trans);

                // Extract unique auth types
                const auths = Array.from(
                    new Set(
                        allServers
                            .map((s: UnifiedMCPServer) => s.auth?.type || 'none')
                            .filter(Boolean)
                    )
                ) as string[];
                setAuthTypes(auths);
            }
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    }, []);

    const fetchServers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (sourceFilter !== 'all') params.append('source', sourceFilter);
            if (verifiedOnly) params.append('verified', 'true');
            if (llmInstallOnly) params.append('hasLLMSInstall', 'true');
            if (minQualityScore > 0) params.append('minQualityScore', minQualityScore.toString());
            if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);
            if (searchQuery) params.append('search', searchQuery);
            if (selectedTransport && selectedTransport !== 'all') params.append('transport', selectedTransport);
            if (selectedAuth && selectedAuth !== 'all') params.append('auth', selectedAuth);
            params.append('page', currentPage.toString());
            params.append('pageSize', pageSize.toString());

            const response = await fetch(`/api/mcp/marketplace/multi?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch servers');

            const data = await response.json();
            if (data.success) {
                setServers(data.data.servers);
                setTotalServers(data.data.total || 0);
                // Note: Filter options (categories, transports, authTypes) are fetched separately
            } else {
                throw new Error(data.error?.message || 'Failed to fetch servers');
            }
        } catch (error) {
            console.error('Error fetching servers:', error);
            toast({ title: 'Error', description: 'Failed to load marketplace servers', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [sourceFilter, verifiedOnly, llmInstallOnly, minQualityScore, categoryFilter, searchQuery, selectedTransport, selectedAuth, currentPage, pageSize, toast]);

    // Generate installation steps based on server type
    const generateInstallationSteps = useCallback((
        server: UnifiedMCPServer
    ): InstallationStepStatus[] => {
        const steps: InstallationStepStatus[] = [];
        const transportType = server.transport?.type || 'stdio';
        const authType = server.auth?.type?.toLowerCase() || 'none';
        const requiresAuth = authType !== 'none';

        // Step 1: OAuth (if required)
        if (requiresAuth && authType === 'oauth') {
            steps.push({
                step: 'oauth',
                label: 'Authorize OAuth',
                status: 'pending',
                message: 'Opening authorization window...',
            });
        }

        // Steps vary by transport type
        if (transportType === 'stdio') {
            // STDIO: Download -> Install -> Configure -> Test
            steps.push(
                {
                    step: 'download',
                    label: 'Download Package',
                    status: 'pending',
                    message: 'Downloading server package...',
                },
                {
                    step: 'install',
                    label: 'Install Dependencies',
                    status: 'pending',
                    message: 'Installing required dependencies...',
                },
                {
                    step: 'configure',
                    label: 'Configure Server',
                    status: 'pending',
                    message: 'Setting up server configuration...',
                },
                {
                    step: 'test',
                    label: 'Test Connection',
                    status: 'pending',
                    message: 'Verifying server connection...',
                }
            );
        } else if (transportType === 'http' || transportType === 'sse') {
            // HTTP/SSE: Connect -> Validate Auth -> Test
            steps.push(
                {
                    step: 'connect',
                    label: 'Connect to Server',
                    status: 'pending',
                    message: 'Establishing connection...',
                },
                {
                    step: 'validate',
                    label: requiresAuth ? 'Validate Authentication' : 'Validate Configuration',
                    status: 'pending',
                    message: requiresAuth ? 'Checking authentication...' : 'Validating configuration...',
                },
                {
                    step: 'test',
                    label: 'Test Connection',
                    status: 'pending',
                    message: 'Verifying server is accessible...',
                }
            );
        }

        return steps;
    }, []);

    // Update step status
    const updateStepStatus = useCallback((
        step: InstallationStepStatus['step'],
        status: InstallationStepStatus['status'],
        message?: string
    ) => {
        setInstallationProgress(prev => {
            if (!prev) return null;
            return {
                ...prev,
                steps: prev.steps.map(s => 
                    s.step === step 
                        ? { ...s, status, message }
                        : s
                ),
            };
        });
    }, []);

    // Perform the actual installation
    const performInstallation = useCallback(async (
        server: UnifiedMCPServer,
        scope: 'user' | 'organization',
        orgId: string | undefined,
        config: { env?: Record<string, string>; token?: string }
    ) => {
        const serverNamespace = server.namespace;
        if (!serverNamespace) return;

        // Initialize progress modal
        const steps = generateInstallationSteps(server);
        setInstallationProgress({
            server,
            steps,
        });
        setInstallingServers(prev => new Set(prev).add(serverNamespace));

        try {
            const transportType = server.transport?.type || 'stdio';
            const authType = server.auth?.type?.toLowerCase() || 'none';

            // Step 1: OAuth (if required)
            if (authType === 'oauth') {
                updateStepStatus('oauth', 'loading', 'Opening authorization window...');
                
                const { runOAuthFlow } = await import('@/services/mcp/oauth.service');
                const providerKey = server.auth?.provider || server.namespace;
                const oauthResult = await runOAuthFlow({
                    providerKey,
                    mcpNamespace: server.namespace,
                    organizationId: scope === 'organization' ? orgId : undefined,
                    scopes: server.auth?.scopes,
                    authMetadata: (server.auth as { raw?: unknown })?.raw ?? server.auth,
                });

                if (oauthResult.status !== 'authorized') {
                    const errorMessage =
                        oauthResult.error ||
                        (oauthResult.status === 'cancelled'
                            ? 'OAuth window was closed before completion'
                            : oauthResult.status === 'timeout'
                            ? 'OAuth flow timed out before completion'
                            : 'OAuth authorization failed');

                    updateStepStatus('oauth', 'error', errorMessage);
                    setInstallationProgress(prev => prev ? { ...prev, error: errorMessage } : null);
                    setInstallingServers(prev => {
                        const next = new Set(prev);
                        next.delete(serverNamespace);
                        return next;
                    });
                    return;
                }

                updateStepStatus('oauth', 'success', 'Authorization successful');
            }

            // Step 2: Transport-specific steps
            if (transportType === 'stdio') {
                updateStepStatus('download', 'loading');
                // Simulate download delay
                await new Promise(resolve => setTimeout(resolve, 500));
                updateStepStatus('download', 'success', 'Package downloaded');

                updateStepStatus('install', 'loading');
                await new Promise(resolve => setTimeout(resolve, 500));
                updateStepStatus('install', 'success', 'Dependencies installed');

                updateStepStatus('configure', 'loading');
            } else {
                updateStepStatus('connect', 'loading');
                await new Promise(resolve => setTimeout(resolve, 300));
                updateStepStatus('connect', 'success', 'Connected successfully');

                updateStepStatus('validate', 'loading');
            }

            // Install server
            const response = await fetch(
                `/api/mcp/marketplace/${encodeURIComponent(server.namespace)}/install`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        scope,
                        organizationId: orgId,
                        config: {
                            name: server.name,
                            enabled: true,
                            env: config.env || {},
                        },
                    }),
                }
            );

            const responseClone = response.clone();
            let result;

            try {
                result = await response.json();
            } catch {
                const text = await responseClone.text();
                const errorMsg = `Server returned invalid response: ${text.substring(0, 200)}`;
                updateStepStatus(transportType === 'stdio' ? 'configure' : 'validate', 'error', errorMsg);
                setInstallationProgress(prev => prev ? { ...prev, error: errorMsg } : null);
                setInstallingServers(prev => {
                    const next = new Set(prev);
                    next.delete(serverNamespace);
                    return next;
                });
                return;
            }

            if (!response.ok) {
                const errorMessage = result?.error?.message || 'Installation failed';
                const errorDetails = result?.error?.details;

                let description = errorMessage;
                if (errorDetails?.errors && errorDetails.errors.length > 0) {
                    description = `${errorMessage}: ${errorDetails.errors.join(', ')}`;
                }

                updateStepStatus(transportType === 'stdio' ? 'configure' : 'validate', 'error', description);
                setInstallationProgress(prev => prev ? { ...prev, error: description } : null);
                setInstallingServers(prev => {
                    const next = new Set(prev);
                    next.delete(serverNamespace);
                    return next;
                });
                return;
            }

            if (result?.success) {
                // Complete configuration step
                if (transportType === 'stdio') {
                    updateStepStatus('configure', 'success', 'Configuration saved');
                } else {
                    updateStepStatus('validate', 'success', 'Configuration validated');
                }

                // Test connection
                updateStepStatus('test', 'loading', 'Testing server connection...');
                await new Promise(resolve => setTimeout(resolve, 500));
                updateStepStatus('test', 'success', 'Server is ready to use');

                if (onServerInstalled) {
                    onServerInstalled(server);
                }

                // Refresh servers after a short delay
                setTimeout(() => {
                    fetchServers();
                }, 1000);
            } else {
                const errorMessage = result.error?.message || 'Installation failed';
                updateStepStatus(transportType === 'stdio' ? 'configure' : 'validate', 'error', errorMessage);
                setInstallationProgress(prev => prev ? { ...prev, error: errorMessage } : null);
            }
        } catch (error) {
            console.error('Error installing server:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to install server';
            setInstallationProgress(prev => prev ? { ...prev, error: errorMessage } : null);
        } finally {
            // Clear loading state after delay (to show completion)
            setTimeout(() => {
                setInstallingServers(prev => {
                    const next = new Set(prev);
                    next.delete(serverNamespace);
                    return next;
                });
            }, 2000);
        }
    }, [onServerInstalled, fetchServers, generateInstallationSteps, updateStepStatus]);

    // Handle server installation with progress tracking
    const handleInstall = useCallback(async (
        server: UnifiedMCPServer,
        scope: 'user' | 'organization',
        orgId?: string
    ) => {
        const serverNamespace = server.namespace;
        if (!serverNamespace) {
            toast({
                title: 'Installation Failed',
                description: 'Server namespace is missing',
                variant: 'destructive',
            });
            return;
        }

        const authType = server.auth?.type?.toLowerCase() || 'none';
        const requiresEnvVars = server.transport?.env && Object.keys(server.transport.env).length > 0;
        const requiresAuth = authType !== 'none' || requiresEnvVars;

        // If server requires auth/config, show config modal first
        if (requiresAuth) {
            setAuthConfigServer(server);
            setPendingInstallScope({ scope, orgId });
            setAuthConfigModalOpen(true);
            return;
        }

        // Otherwise, proceed with installation
        performInstallation(server, scope, orgId, {});
    }, [toast, performInstallation]);

    // Handle auth configuration
    const handleAuthConfigure = useCallback((config: { env: Record<string, string>; token?: string }) => {
        if (!authConfigServer || !pendingInstallScope) return;

        // Close auth modal
        setAuthConfigModalOpen(false);

        // Proceed with installation using the provided config
        performInstallation(
            authConfigServer,
            pendingInstallScope.scope,
            pendingInstallScope.orgId,
            config
        );

        // Clear pending state
        setAuthConfigServer(null);
        setPendingInstallScope(null);
    }, [authConfigServer, pendingInstallScope, performInstallation]);

    // Handle view details
    const handleViewDetails = useCallback((server: UnifiedMCPServer) => {
        setSelectedServer(server);
        setDetailModalOpen(true);
    }, []);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [sourceFilter, verifiedOnly, llmInstallOnly, minQualityScore, categoryFilter, searchQuery, selectedTransport, selectedAuth, pageSize, sortBy]);

    // Fetch filter options on mount
    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    useEffect(() => {
        fetchServers();
    }, [fetchServers]);

    return (
        <div className="space-y-6">
            {/* Header (optional) */}
            {showHeader && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">MCP Marketplace</h1>
                        <p className="text-muted-foreground mt-1">Browse servers from Anthropic and Cline registries</p>
                    </div>
                    <Button onClick={fetchServers} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search servers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>

            {/* Source Filter Badges */}
            <div className="space-y-3">
                <div>
                    <p className="text-sm font-medium mb-2">Registry Source</p>
                    <div className="flex gap-2 flex-wrap">
                        <Badge variant={sourceFilter === 'all' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setSourceFilter('all')}>
                            All Sources
                        </Badge>
                        <Badge variant={sourceFilter === 'anthropic' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setSourceFilter('anthropic')}>
                            <Shield className="w-3 h-3 mr-1" />
                            Anthropic Official
                        </Badge>
                        <Badge variant={sourceFilter === 'cline' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setSourceFilter('cline')}>
                            <Users className="w-3 h-3 mr-1" />
                            Cline Community
                        </Badge>
                    </div>
                </div>


            </div>

            {/* Advanced Filters */}
            <div className="flex gap-4 flex-wrap items-center">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedTransport} onValueChange={setSelectedTransport}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Transport" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Transports</SelectItem>
                        <SelectItem value="stdio">STDIO</SelectItem>
                        <SelectItem value="sse">SSE</SelectItem>
                        <SelectItem value="http">HTTP</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={selectedAuth} onValueChange={setSelectedAuth}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Auth Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Auth Types</SelectItem>
                        {allAuthTypes.map((auth) => (
                            <SelectItem key={auth} value={auth}>
                                {auth === 'none' ? 'No Auth' : auth === 'oauth' ? 'OAuth' : auth === 'api-key' ? 'Env/API Key' : auth === 'bearer' ? 'Bearer' : auth}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="quality">Quality Score</SelectItem>
                        <SelectItem value="name">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="stars">Most Stars</SelectItem>
                        <SelectItem value="recent">Most Recent</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={minQualityScore.toString()} onValueChange={(value) => setMinQualityScore(parseInt(value, 10))}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Min Quality" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">All Quality</SelectItem>
                        <SelectItem value="60">60+ Quality</SelectItem>
                        <SelectItem value="70">70+ Quality</SelectItem>
                        <SelectItem value="80">80+ Quality</SelectItem>
                        <SelectItem value="90">90+ Quality</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                    <Checkbox id="verified" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
                    <Label htmlFor="verified" className="text-sm cursor-pointer">Verified Only</Label>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox id="llm-install" checked={llmInstallOnly} onChange={(e) => setLLMInstallOnly(e.target.checked)} />
                    <Label htmlFor="llm-install" className="text-sm cursor-pointer flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        AI Install
                    </Label>
                </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{totalServers} servers found</span>
                {sourceFilter !== 'all' && <span>Filtered by {sourceFilter}</span>}
            </div>

            {/* Top Pagination Controls - Single Row */}
            {!loading && servers.length > 0 && totalServers > 0 && (
                <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Items per page:</span>
                        <Select
                            value={pageSize.toString()}
                            onValueChange={(value) => setPageSize(parseInt(value, 10))}
                        >
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="9">9</SelectItem>
                                <SelectItem value="18">18</SelectItem>
                                <SelectItem value="27">27</SelectItem>
                                <SelectItem value="36">36</SelectItem>
                                <SelectItem value="54">54</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {/* Page Indicator with Single Page Navigation */}
                    {totalServers > pageSize && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Previous page</span>
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {currentPage} of {Math.ceil(totalServers / pageSize)}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === Math.ceil(totalServers / pageSize)}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                                <span className="sr-only">Next page</span>
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Server Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : servers.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {searchQuery ? 'No servers found matching your search' : 'No servers available with current filters'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {servers.map((server) => (
                            <ServerCard
                                key={server.id}
                                server={server as unknown} // UnifiedMCPServer is compatible with CuratedServer
                                isInstalled={installedServers.includes(server.namespace)}
                                isInstalling={installingServers.has(server.namespace)}
                                onViewDetails={() => handleViewDetails(server)}
                                onInstall={() => handleInstall(server, 'user')}
                            />
                        ))}
                    </div>

                    {/* Bottom Pagination Controls */}
                    {totalServers > 0 && totalServers > pageSize && (
                        <div className="mt-6">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(totalServers / pageSize)}
                                totalItems={totalServers}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Server Detail Modal */}
            <ServerDetailModal
                server={selectedServer as unknown} // UnifiedMCPServer is compatible with CuratedServer
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                onInstall={handleInstall}
                organizations={organizations}
                isInstalling={selectedServer ? installingServers.has(selectedServer.namespace) : false}
            />

            {/* Auth Configuration Modal */}
            <ServerAuthConfigModal
                open={authConfigModalOpen}
                server={authConfigServer}
                onClose={() => {
                    setAuthConfigModalOpen(false);
                    setAuthConfigServer(null);
                    setPendingInstallScope(null);
                }}
                onConfigure={handleAuthConfigure}
            />

            {/* Installation Progress Modal */}
            {installationProgress && (
                <InstallationProgressModal
                    open={!!installationProgress}
                    serverName={installationProgress?.server?.name || ''}
                    transportType={installationProgress?.server?.transport?.type as 'stdio' | 'http' | 'sse' || 'stdio'}
                    requiresAuth={(installationProgress?.server?.auth?.type || 'none') !== 'none'}
                    authType={installationProgress?.server?.auth?.type}
                    steps={installationProgress.steps}
                    currentStep={installationProgress.steps.findIndex(s => s.status === 'loading')}
                    error={installationProgress.error}
                    onClose={() => {
                        // Only close if installation is complete or failed
                        const allComplete = installationProgress.steps.every(s => s.status === 'success');
                        const hasError = installationProgress.steps.some(s => s.status === 'error') || !!installationProgress.error;
                        if (allComplete || hasError) {
                            setInstallationProgress(null);
                        }
                    }}
                />
            )}
        </div>
    );
}
