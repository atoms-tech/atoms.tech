'use client';

/**
 * ServerMarketplace Component
 *
 * Main marketplace view for browsing and installing MCP servers
 * Features:
 * - 3-tier tabs (First-Party, Curated, All)
 * - Search and filtering
 * - Server cards with details
 * - Installation flow
 */

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CuratedServer, CurationTier } from '@/services/mcp/curation-engine.service';
import { ServerCard } from './ServerCard';
import { ServerDetailModal } from './ServerDetailModal';
import { Search, Filter, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ServerMarketplaceProps {
  organizations?: Array<{ id: string; name: string }>;
  installedServers?: string[]; // namespaces of installed servers
}

export function ServerMarketplace({
  organizations = [],
  installedServers = [],
}: ServerMarketplaceProps) {
  const { toast } = useToast();
  const [tier, setTier] = useState<CurationTier>('first-party');
  const [servers, setServers] = useState<CuratedServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServer, setSelectedServer] = useState<CuratedServer | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Fetch servers from API
  const fetchServers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tier,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory && { category: selectedCategory }),
      });

      const response = await fetch(`/api/mcp/marketplace?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setServers(result.data.servers);

        // Extract unique categories
        const cats = Array.from(
          new Set(
            result.data.servers
              .map((s: CuratedServer) => s.category)
              .filter(Boolean)
          )
        ) as string[];
        setCategories(cats);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch servers');
      }
    } catch (error) {
      console.error('Error fetching servers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load marketplace servers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [tier, searchQuery, selectedCategory, toast]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Handle server installation
  const handleInstall = async (
    server: CuratedServer,
    scope: 'user' | 'organization',
    orgId?: string
  ) => {
    try {
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
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          variant: 'default',
          title: 'Server Installed',
          description: `${server.name} has been successfully installed`,
        });

        // Optionally refresh or update state
        fetchServers();
      } else {
        throw new Error(result.error?.message || 'Installation failed');
      }
    } catch (error) {
      console.error('Error installing server:', error);
      toast({
        title: 'Installation Failed',
        description: error instanceof Error ? error.message : 'Failed to install server',
        variant: 'destructive',
      });
    }
  };

  // Handle view details
  const handleViewDetails = (server: CuratedServer) => {
    setSelectedServer(server);
    setDetailModalOpen(true);
  };

  // Filter servers by search query
  const filteredServers = servers.filter((server) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      server.name.toLowerCase().includes(query) ||
      server.description.toLowerCase().includes(query) ||
      server.namespace.toLowerCase().includes(query) ||
      server.publisher.toLowerCase().includes(query)
    );
  });

  // Check if server is installed
  const isServerInstalled = (namespace: string) => {
    return installedServers.includes(namespace);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">MCP Server Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Browse and install Model Context Protocol servers
        </p>
      </div>

      {/* Tier Tabs */}
      <Tabs value={tier} onValueChange={(v) => setTier(v as CurationTier)}>
        <TabsList>
          <TabsTrigger value="first-party">
            First-Party
            <Badge variant="outline" className="ml-2 bg-blue-600 text-white border-0">
              Official
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="curated">
            Curated
            <Badge variant="outline" className="ml-2 bg-green-600 text-white border-0">
              Verified
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all">All Servers</TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button variant="outline" size="icon" onClick={fetchServers}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Server Grid */}
        <TabsContent value={tier} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredServers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No servers found matching your search'
                  : 'No servers available in this category'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServers.map((server) => (
                <ServerCard
                  key={server.namespace}
                  server={server}
                  onInstall={handleViewDetails}
                  onViewDetails={handleViewDetails}
                  isInstalled={isServerInstalled(server.namespace)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <ServerDetailModal
        server={selectedServer}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedServer(null);
        }}
        onInstall={handleInstall}
        organizations={organizations}
      />
    </div>
  );
}
