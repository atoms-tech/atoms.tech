'use client';

/**
 * UnifiedServerCard Component
 * Displays a unified MCP server from multiple registries
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UnifiedMCPServer } from '@/services/mcp/multi-registry.service';
import { CheckCircle2, Download, Shield, Users, Star, Zap, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface UnifiedServerCardProps {
    server: UnifiedMCPServer;
    isInstalled?: boolean;
    organizations?: Array<{ id: string; name: string }>;
}

export function UnifiedServerCard({ server, isInstalled = false, organizations = [] }: UnifiedServerCardProps) {
    const { toast } = useToast();
    const [installing, setInstalling] = useState(false);

    const handleInstall = async () => {
        setInstalling(true);
        try {
            // TODO: Implement installation flow
            toast({
                title: 'Installation Started',
                description: `Installing ${server.name}...`,
                variant: 'default',
            });
        } catch (error) {
            toast({
                title: 'Installation Failed',
                description: error instanceof Error ? error.message : 'Failed to install server',
                variant: 'destructive',
            });
        } finally {
            setInstalling(false);
        }
    };

    const getQualityBadgeVariant = () => {
        if (server.qualityScore >= 80) return 'default';
        if (server.qualityScore >= 60) return 'secondary';
        return 'outline';
    };

    const getQualityColor = () => {
        if (server.qualityScore >= 80) return 'text-green-600';
        if (server.qualityScore >= 60) return 'text-yellow-600';
        return 'text-gray-600';
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {server.logoUrl && (
                            <img src={server.logoUrl} alt={server.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{server.name}</CardTitle>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-muted-foreground truncate">{server.author}</span>
                                {server.publisherVerified && <CheckCircle2 className="h-3 w-3 text-blue-500 flex-shrink-0" />}
                            </div>
                        </div>
                    </div>
                    
                    {/* Quality Score */}
                    <Badge variant={getQualityBadgeVariant()} className={getQualityColor()}>
                        {server.qualityScore}
                    </Badge>
                </div>
                
                <CardDescription className="line-clamp-2 mt-2">{server.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1">
                <div className="space-y-3">
                    {/* Source Badges */}
                    <div className="flex gap-2 flex-wrap">
                        {server.sources.map((source) => (
                            <Badge key={source} variant="outline" className="text-xs">
                                {source === 'anthropic' ? (
                                    <>
                                        <Shield className="w-3 h-3 mr-1" />
                                        Official
                                    </>
                                ) : (
                                    <>
                                        <Users className="w-3 h-3 mr-1" />
                                        Community
                                    </>
                                )}
                            </Badge>
                        ))}
                        {server.publisherVerified && (
                            <Badge variant="default" className="text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Verified
                            </Badge>
                        )}
                        {server.hasLLMSInstall && (
                            <Badge variant="secondary" className="text-xs">
                                <Zap className="w-3 h-3 mr-1" />
                                AI Install
                            </Badge>
                        )}
                    </div>

                    {/* Category */}
                    {server.category && (
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{server.category}</Badge>
                        </div>
                    )}

                    {/* Metrics */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {server.stars !== undefined && (
                            <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current text-yellow-500" />
                                <span>{server.stars.toLocaleString()}</span>
                            </div>
                        )}
                        {server.installCount !== undefined && (
                            <div className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                <span>{server.installCount.toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    {server.tags && server.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                            {server.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                            {server.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{server.tags.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex gap-2">
                <Button onClick={handleInstall} disabled={isInstalled || installing} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    {isInstalled ? 'Installed' : installing ? 'Installing...' : 'Install'}
                </Button>
                {server.githubUrl && (
                    <Button variant="outline" size="icon" asChild>
                        <a href={server.githubUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

