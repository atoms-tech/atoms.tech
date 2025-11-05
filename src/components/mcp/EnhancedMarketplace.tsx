'use client';

/**
 * EnhancedMarketplace Component
 * Multi-registry marketplace with Anthropic + Cline registries
 */

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UnifiedServerCard } from './UnifiedServerCard';
import { Search, Loader2, RefreshCw, Shield, Users, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { UnifiedMCPServer, RegistrySource } from '@/services/mcp/multi-registry.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface EnhancedMarketplaceProps {
    organizations?: Array<{ id: string; name: string }>;
    installedServers?: string[];
}

export function EnhancedMarketplace({ organizations = [], installedServers = [] }: EnhancedMarketplaceProps) {
    const { toast } = useToast();
    const [servers, setServers] = useState<UnifiedMCPServer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sourceFilter, setSourceFilter] = useState<'all' | RegistrySource>('all');
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [llmInstallOnly, setLLMInstallOnly] = useState(false);
    const [minQualityScore, setMinQualityScore] = useState<number>(0);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [categories, setCategories] = useState<string[]>([]);

    const fetchServers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (sourceFilter !== 'all') params.append('source', sourceFilter);
            if (verifiedOnly) params.append('verified', 'true');
            if (llmInstallOnly) params.append('hasLLMSInstall', 'true');
            if (minQualityScore > 0) params.append('minQualityScore', minQualityScore.toString());
            if (categoryFilter) params.append('category', categoryFilter);
            if (searchQuery) params.append('search', searchQuery);

            const response = await fetch(`/api/mcp/marketplace/multi?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch servers');

            const data = await response.json();
            if (data.success) {
                setServers(data.data.servers);
                const uniqueCategories = Array.from(
                    new Set(data.data.servers.map((s: UnifiedMCPServer) => s.category).filter(Boolean))
                ) as string[];
                setCategories(uniqueCategories);
            } else {
                throw new Error(data.error?.message || 'Failed to fetch servers');
            }
        } catch (error) {
            console.error('Error fetching servers:', error);
            toast({ title: 'Error', description: 'Failed to load marketplace servers', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [sourceFilter, verifiedOnly, llmInstallOnly, minQualityScore, categoryFilter, searchQuery, toast]);

    useEffect(() => {
        fetchServers();
    }, [fetchServers]);

    return (
        <div className="space-y-6">
            {/* Header */}
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

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search servers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>

            {/* Source Filter Badges */}
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

            {/* Advanced Filters */}
            <div className="flex gap-4 flex-wrap items-center">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
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
                <span>{servers.length} servers found</span>
                {sourceFilter !== 'all' && <span>• Filtered by {sourceFilter}</span>}
            </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servers.map((server) => (
                        <UnifiedServerCard
                            key={server.id}
                            server={server}
                            isInstalled={installedServers.includes(server.id)}
                            organizations={organizations}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
