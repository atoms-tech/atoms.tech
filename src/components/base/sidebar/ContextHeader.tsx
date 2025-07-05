'use client';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrganization } from '@/lib/providers/organization.provider';
import { cn } from '@/lib/utils';

import { WorkspaceContext } from '../../../hooks/useWorkspaceContext';

interface ContextHeaderProps {
    context: WorkspaceContext;
    className?: string;
}

export function ContextHeader({ context, className }: ContextHeaderProps) {
    const { organizations, currentOrganization } = useOrganization();

    const renderBreadcrumb = () => {
        if (context.level === 'home') {
            return (
                <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">🏠</span>
                    <span className="text-sm font-medium">Home</span>
                </div>
            );
        }

        // For org contexts, show org switcher
        if (context.level === 'org' || context.level === 'project' || context.level === 'document') {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-auto p-1 hover:bg-accent/50 justify-start"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-medium">
                                        {currentOrganization?.name?.charAt(0) || '?'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium truncate max-w-[120px]">
                                        {currentOrganization?.name || 'Organization'}
                                    </span>
                                    {context.level !== 'org' && (
                                        <>
                                            <span className="text-muted-foreground">›</span>
                                            <span className="text-sm text-muted-foreground">
                                                {context.level === 'project' ? 'Project' : 'Document'}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        <div className="px-2 py-1.5">
                            <p className="text-xs text-muted-foreground">Switch Organization</p>
                        </div>
                        <DropdownMenuSeparator />
                        {organizations.map((org) => (
                            <DropdownMenuItem key={org.id} asChild>
                                <Link
                                    href={`/org/${org.id}`}
                                    className="flex items-center gap-2"
                                >
                                    <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                                        <span className="text-xs font-medium">
                                            {org.name.charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">
                                            {org.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground capitalize">
                                            {org.type}
                                        </div>
                                    </div>
                                    {org.id === currentOrganization?.id && (
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                    )}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/home/user" className="text-sm">
                                ← Back to Home
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        return null;
    };

    return (
        <div className={cn('px-3 py-2 border-b border-border/50', className)}>
            {renderBreadcrumb()}
        </div>
    );
}
