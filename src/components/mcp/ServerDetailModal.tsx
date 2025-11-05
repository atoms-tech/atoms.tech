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
  Wrench,
  MessageSquare,
  FileText,
  Package,
  Loader2,
} from 'lucide-react';

// Helper type to access dynamic properties on server
type ServerWithExtras = CuratedServer & {
  documentation?: { url?: string };
  tools?: Array<{ name?: string; description?: string }>;
  prompts?: Array<{ name?: string; description?: string }>;
  resources?: Array<{ name?: string; description?: string }>;
};

interface ServerDetailModalProps {
  server: ServerWithExtras | null;
  open: boolean;
  onClose: () => void;
  onInstall: (server: ServerWithExtras, scope: 'user' | 'organization', orgId?: string) => void;
  organizations?: Array<{ id: string; name: string }>;
  isInstalling?: boolean;
}

export function ServerDetailModal({
  server,
  open,
  onClose,
  onInstall,
  organizations = [],
  isInstalling: externalInstalling = false,
}: ServerDetailModalProps) {
  const [installScope, setInstallScope] = useState<'user' | 'organization'>('user');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [installing, setInstalling] = useState(false);

  if (!server) return null;

  const isInstallingState = externalInstalling || installing;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await onInstall(
        server,
        installScope,
        installScope === 'organization' ? selectedOrgId : undefined
      );
      // Only close if installation was successful (handled by parent)
      // onClose will be called by parent after successful install
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl break-words">{server.name}</DialogTitle>
              <DialogDescription className="mt-1 break-words">
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

        <ScrollArea className="max-h-[60vh] pr-4 overflow-x-hidden">
          <div className="space-y-6 min-w-0">
            {/* Description */}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground break-words">{server.description}</p>
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

            {/* Category & Tags */}
            {(server.category || (server.tags && server.tags.length > 0)) && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Category & Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {server.category && (
                    <Badge variant="default">{server.category}</Badge>
                  )}
                  {server.tags && server.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Technical Details */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Transport Configuration</h3>
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <Badge variant="secondary">{server.transport.type.toUpperCase()}</Badge>
                </div>

                {/* STDIO Transport Details */}
                {server.transport.type === 'stdio' && server.transport.command && (
                  <>
                    <div>
                      <span className="text-sm text-muted-foreground">Command:</span>
                      <code className="block text-xs bg-background p-2 rounded mt-1 font-mono break-all whitespace-pre-wrap">
                        {server.transport.command}
                      </code>
                    </div>
                    {server.transport.args && server.transport.args.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">Arguments:</span>
                        <code className="block text-xs bg-background p-2 rounded mt-1 font-mono break-all whitespace-pre-wrap">
                          {server.transport.args.join(' ')}
                        </code>
                      </div>
                    )}
                  </>
                )}

                {/* HTTP/SSE Transport Details */}
                {(server.transport.type === 'http' || server.transport.type === 'sse') && server.transport.url && (
                  <div>
                    <span className="text-sm text-muted-foreground">URL:</span>
                    <code className="block text-xs bg-background p-2 rounded mt-1 font-mono break-all">
                      {server.transport.url}
                    </code>
                  </div>
                )}

                {/* Environment Variables */}
                {server.transport.env && Object.keys(server.transport.env).length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Environment Variables:</span>
                    <div className="mt-1 space-y-1">
                      {Object.entries(server.transport.env).map(([key, value]) => (
                        <div key={key} className="text-xs bg-background p-2 rounded">
                          <code className="font-mono text-blue-600">{key}</code>
                          {value && (
                            <>
                              <span className="text-muted-foreground"> = </span>
                              <code className="font-mono">{value}</code>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Authentication Requirements */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Authentication</h3>
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <Badge variant="secondary">
                    {server.auth?.type === 'oauth'
                      ? `OAuth`
                      : server.auth?.type === 'unknown'
                      ? 'Unknown'
                      : server.auth?.type || 'None'}
                  </Badge>
                </div>

                {/* OAuth Details */}
                {server.auth?.type === 'oauth' && (
                  <>
                    {server.auth.provider && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Provider:</span>
                        <span className="text-sm font-medium">{server.auth.provider}</span>
                      </div>
                    )}
                    {server.auth.scopes && server.auth.scopes.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">Required Scopes:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {server.auth.scopes.map((scope, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Auth Requirements */}
                {server.auth && (
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {server.auth.requiresUserSecret && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Requires user secret/credentials</span>
                      </div>
                    )}
                    {server.auth.requiresOAuthPopup && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Requires OAuth popup authorization</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Security Review */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                {getSecurityIcon()}
                Security Review
              </h3>
              <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <div className="flex items-center gap-2">
                    {getSecurityIcon()}
                    <span className="text-sm font-medium">{getSecurityStatusText()}</span>
                  </div>
                </div>

                {server.securityReview?.reviewedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reviewed:</span>
                    <span className="text-sm">
                      {new Date(server.securityReview.reviewedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {server.securityReview?.reviewer && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reviewer:</span>
                    <span className="text-sm">{server.securityReview.reviewer}</span>
                  </div>
                )}

                {server.securityReview?.notes && (
                  <div className="mt-2 min-w-0">
                    <span className="text-sm text-muted-foreground">Notes:</span>
                    <p className="text-xs text-muted-foreground bg-background p-3 rounded mt-1 break-words">
                      <Info className="inline h-3 w-3 mr-1" />
                      {server.securityReview.notes}
                    </p>
                  </div>
                )}

                {/* Publisher Verification */}
                {server.publisherVerified && (
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified Publisher</span>
                  </div>
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
            {(server.homepage || server.repository || (server as { documentation?: { url?: string } }).documentation?.url || server.license) && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Links</h3>
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
                  {server.documentation?.url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={server.documentation.url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Documentation
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                  {server.license && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://choosealicense.com/licenses/${server.license.toLowerCase()}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        License: {server.license}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Tools */}
            {server.tools && server.tools.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Tools ({server.tools?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {server.tools?.map((tool, idx: number) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm break-words">{tool.name}</p>
                            {tool.description && (
                              <p className="text-xs text-muted-foreground mt-1 break-words">
                                {tool.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs ml-2">
                            {tool.inputSchema?.type || 'object'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Prompts */}
            {server.prompts && server.prompts.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Prompts ({server.prompts?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {server.prompts?.map((prompt, idx: number) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg min-w-0">
                        <p className="font-medium text-sm break-words">{prompt.name}</p>
                        {prompt.description && (
                          <p className="text-xs text-muted-foreground mt-1 break-words">
                            {prompt.description}
                          </p>
                        )}
                        {prompt.arguments && prompt.arguments.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {(prompt.arguments || []).map((arg: any, argIdx: number) => (
                              <Badge key={argIdx} variant="secondary" className="text-xs">
                                {arg.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Resources */}
            {server.resources && server.resources.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Resources ({server.resources?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {server.resources?.map((resource, idx: number) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm break-words">{resource.name}</p>
                            {resource.description && (
                              <p className="text-xs text-muted-foreground mt-1 break-words">
                                {resource.description}
                              </p>
                            )}
                            {resource.uri && (
                              <code className="text-xs bg-background px-2 py-1 rounded mt-1 inline-block break-all max-w-full">
                                {resource.uri}
                              </code>
                            )}
                          </div>
                          {resource.mimeType && (
                            <Badge variant="outline" className="text-xs ml-2">
                              {resource.mimeType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

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
              isInstallingState ||
              (installScope === 'organization' && !selectedOrgId)
            }
          >
            {isInstallingState ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Installing...
              </>
            ) : (
              'Install Server'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
