'use client';

/**
 * ServerCard Component
 *
 * Displays an MCP server in a card format with key information
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CuratedServer } from '@/services/mcp/curation-engine.service';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Shield,
  ShieldAlert,
  Star,
} from 'lucide-react';

interface ServerCardProps {
  server: CuratedServer;
  onInstall?: (server: CuratedServer) => void;
  onViewDetails?: (server: CuratedServer) => void;
  isInstalled?: boolean;
}

export function ServerCard({
  server,
  onInstall,
  onViewDetails,
  isInstalled = false,
}: ServerCardProps) {
  const getTransportBadgeVariant = (type: string) => {
    switch (type) {
      case 'sse':
      case 'http':
        return 'default';
      case 'stdio':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getAuthBadgeVariant = (type: string) => {
    switch (type) {
      case 'oauth2':
        return 'default';
      case 'api-key':
      case 'bearer':
        return 'secondary';
      case 'none':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getTierBadge = () => {
    switch (server.curationTier) {
      case 'first-party':
        return (
          <Badge variant="default" className="bg-blue-600">
            First-Party
          </Badge>
        );
      case 'curated':
        return (
          <Badge variant="default" className="bg-green-600">
            Curated
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSecurityBadge = () => {
    if (!server.securityReview) return null;

    switch (server.securityReview.status) {
      case 'approved':
        return (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <Shield className="h-3 w-3" />
            <span>Security Reviewed</span>
          </div>
        );
      case 'flagged':
        return (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <ShieldAlert className="h-3 w-3" />
            <span>Security Review</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{server.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground truncate">
                {server.namespace}
              </span>
              {server.publisherVerified && (
                <CheckCircle2 className="h-3 w-3 text-blue-500 flex-shrink-0" />
              )}
            </div>
          </div>
          {getTierBadge()}
        </div>
        <CardDescription className="line-clamp-2 mt-2">
          {server.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3">
          {/* Publisher */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Publisher:</span>
            <span className="font-medium truncate ml-2">{server.publisher}</span>
          </div>

          {/* Transport & Auth */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={getTransportBadgeVariant(server.transport.type)}>
              {server.transport.type.toUpperCase()}
            </Badge>
            <Badge variant={getAuthBadgeVariant(server.auth?.type || 'none')}>
              {server.auth?.type === 'oauth2'
                ? `OAuth: ${server.auth.provider}`
                : server.auth?.type || 'No Auth'}
            </Badge>
          </div>

          {/* Category & Tags */}
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

          {/* Security badge */}
          {getSecurityBadge()}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onViewDetails?.(server)}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Details
        </Button>
        <Button
          className="flex-1"
          onClick={() => onInstall?.(server)}
          disabled={isInstalled}
        >
          {isInstalled ? 'Installed' : 'Install'}
        </Button>
      </CardFooter>
    </Card>
  );
}
