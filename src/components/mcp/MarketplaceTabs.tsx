'use client';

/**
 * MarketplaceTabs Component
 * 
 * Provides tabbed interface to switch between:
 * - Classic Marketplace (Anthropic only)
 * - Enhanced Marketplace (Multi-registry)
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServerMarketplace } from './ServerMarketplace';
import { EnhancedMarketplace } from './EnhancedMarketplace';
import { Shield, Sparkles } from 'lucide-react';

interface MarketplaceTabsProps {
    organizations?: Array<{ id: string; name: string }>;
    installedServers?: string[];
}

export function MarketplaceTabs({
    organizations = [],
    installedServers = [],
}: MarketplaceTabsProps) {
    const [activeTab, setActiveTab] = useState<'classic' | 'enhanced'>('enhanced');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">MCP Marketplace</h1>
                <p className="text-muted-foreground mt-1">
                    Browse and install Model Context Protocol servers
                </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'classic' | 'enhanced')}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="enhanced" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Enhanced
                        <span className="ml-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            New
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="classic" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Classic
                    </TabsTrigger>
                </TabsList>

                {/* Enhanced Marketplace Tab */}
                <TabsContent value="enhanced" className="mt-6">
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                                    Enhanced Multi-Registry Marketplace
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    Browse 200-300+ servers from both <strong>Anthropic's official registry</strong> and{' '}
                                    <strong>Cline's community marketplace</strong>. Features quality scoring, dual verification,
                                    and AI-optimized installation tracking.
                                </p>
                                <div className="flex gap-4 mt-2 text-xs text-blue-600 dark:text-blue-400">
                                    <span>✓ Quality Scores</span>
                                    <span>✓ Dual Verification</span>
                                    <span>✓ AI Install</span>
                                    <span>✓ Advanced Filters</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <EnhancedMarketplace
                        organizations={organizations}
                        installedServers={installedServers}
                    />
                </TabsContent>

                {/* Classic Marketplace Tab */}
                <TabsContent value="classic" className="mt-6">
                    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    Classic Marketplace
                                </h3>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                    Browse servers from <strong>Anthropic's official registry</strong> only.
                                    Features 3-tier curation (First-Party, Curated, All) and security reviews.
                                </p>
                                <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                                    <span>✓ Official Registry</span>
                                    <span>✓ 3-Tier Curation</span>
                                    <span>✓ Security Reviews</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <ServerMarketplace
                        organizations={organizations}
                        installedServers={installedServers}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

