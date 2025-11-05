'use client';

/**
 * ServerDetailModal Component
 *
 * Shows detailed information about an MCP server including:
 * - Full description and metadata
 * - Security review status
 * - Validation results
 * - Install options
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CuratedServer } from '@/services/mcp/curation-engine.service';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Github,
  Globe,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  Download,
  Info,
} from 'lucide-react';

interface ServerDetailModalProps {
  server: CuratedServer | null;
  open: boolean;
  onClose: () => void;
  onInstall: (server: CuratedServer, scope: 'user' | 'organization', orgId?: string) => void;
  organizations?: Array<{ id: string; name: string }>;
}

export function ServerDetailModal({
  server,
  open,
  onClose,
  onInstall,
  organizations = [],
}: ServerDetailModalProps) {
  const [installScope, setInstallScope] = useState<'user' | 'organization'>('user');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [installing, setInstalling] = useState(false);

  if (!server) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await onInstall(
        server,
        installScope,
        installScope === 'organization' ? selectedOrgId : undefined
      );
      onClose();
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setInstalling(false);
    }
  };

  const getSecurityIcon = () => {
    if (!server.securityReview) return <Shield className="h-5 w-5 text-gray-400" />;

    switch (server.securityReview.status) {
      case 'approved':
        return <ShieldCheck className="h-5 w-5 text-green-600" />;
      case 'flagged':
        return <ShieldAlert className="h-5 w-5 text-amber-600" />;
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-400" />;
    }
  };

  const getSecurityStatusText = () => {
    if (!server.securityReview) return 'Not Reviewed';

    switch (server.securityReview.status) {
      case 'approved':
        return 'Security Approved';
      case 'pending':
        return 'Security Review Pending';
      case 'flagged':
        return 'Security Concerns';
      case 'rejected':
        return 'Security Rejected';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{server.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {server.namespace}
                {server.publisherVerified && (
                  <CheckCircle2 className="inline-block h-4 w-4 ml-2 text-blue-500" />
                )}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {server.curationTier === 'first-party' && (
                <Badge variant="default" className="bg-blue-600">
                  First-Party
                </Badge>
              )}
              {server.curationTier === 'curated' && (
                <Badge variant="default" className="bg-green-600">
                  Curated
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{server.description}</p>
            </div>

            {/* Publisher Info */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Publisher</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm">{server.publisher}</span>
                {server.publisherVerified && (
                  <Badge variant="outline" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Technical Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Transport</h3>
                <Badge variant="secondary">{server.transport.type.toUpperCase()}</Badge>
                {server.transport.url && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {server.transport.url}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Authentication</h3>
                <Badge variant="secondary">
                  {server.auth?.type === 'oauth2'
                    ? `OAuth: ${server.auth.provider}`
                    : server.auth?.type || 'None'}
                </Badge>
                {server.auth?.scopes && server.auth.scopes.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {server.auth.scopes.length} scope(s)
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Security Review */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                {getSecurityIcon()}
                Security Review
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm font-medium">{getSecurityStatusText()}</span>
                </div>
                {server.securityReview?.reviewedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reviewed:</span>
                    <span className="text-sm">
                      {new Date(server.securityReview.reviewedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {server.securityReview?.notes && (
                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    <Info className="inline h-3 w-3 mr-1" />
                    {server.securityReview.notes}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4">
              {server.stars !== undefined && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    Stars
                  </h3>
                  <p className="text-2xl font-bold">{server.stars.toLocaleString()}</p>
                </div>
              )}
              {server.installCount !== undefined && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    Installs
                  </h3>
                  <p className="text-2xl font-bold">{server.installCount.toLocaleString()}</p>
                </div>
              )}
              {server.curationScore !== undefined && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Quality Score</h3>
                  <p className="text-2xl font-bold">{server.curationScore}/100</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Links */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold mb-2">Links</h3>
              <div className="flex flex-wrap gap-2">
                {server.homepage && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={server.homepage} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 mr-2" />
                      Homepage
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
                {server.repository && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={server.repository} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4 mr-2" />
                      Repository
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Installation Scope */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Install To</h3>
              <RadioGroup value={installScope} onValueChange={(v: string) => setInstallScope(v as 'user' | 'organization')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="user" id="user" />
                  <Label htmlFor="user" className="cursor-pointer">
                    My Account (Personal)
                  </Label>
                </div>
                {organizations.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="organization" id="organization" />
                    <Label htmlFor="organization" className="cursor-pointer">
                      Organization
                    </Label>
                  </div>
                )}
              </RadioGroup>

              {installScope === 'organization' && organizations.length > 0 && (
                <div className="mt-3">
                  <Label htmlFor="org-select" className="text-sm mb-2 block">
                    Select Organization
                  </Label>
                  <select
                    id="org-select"
                    className="w-full border rounded-md p-2 text-sm"
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                  >
                    <option value="">Select an organization...</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleInstall}
            disabled={
              installing ||
              (installScope === 'organization' && !selectedOrgId)
            }
          >
            {installing ? 'Installing...' : 'Install Server'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
