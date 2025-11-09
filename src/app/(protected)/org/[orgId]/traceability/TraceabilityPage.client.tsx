'use client';

import {
    ArrowRight,
    ChevronDown,
    ChevronRight,
    GitBranch,
    Network,
    Plus,
    Search,
    Trash2,
    Unlink,
    Zap,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import TraceLinksContent from '@/components/custom/TraceLinks/TraceLinksContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import LayoutView from '@/components/views/LayoutView';
import { useAuthenticatedProjectsByMembershipForOrg } from '@/hooks/queries/useAuthenticatedProjects';
import { useProjectRequirements } from '@/hooks/queries/useRequirement';
import {
    useCreateRelationship,
    useDeleteRelationship,
    useRequirementTree,
} from '@/hooks/queries/useRequirementRelationships';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';
import { Requirement } from '@/types';

interface TraceabilityPageClientProps {
    orgId: string;
}

// Type for requirement with documents relationship from useProjectRequirements
type RequirementWithDocuments = Requirement & {
    documents: {
        id: string;
        project_id: string;
        name: string;
    };
};

export default function TraceabilityPageClient({ orgId }: TraceabilityPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useUser();
    const { toast } = useToast();

    // Initialize from URL params
    const [selectedProject, setSelectedProject] = useState<string>(
        searchParams.get('projectId') || '',
    );
    const [activeTab, setActiveTab] = useState<string>(
        searchParams.get('tab') || 'hierarchy',
    );
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedParent, setSelectedParent] = useState<string>('');
    const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
    const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
    // Track requirementId locally to avoid race conditions with URL updates
    const [currentRequirementId, setCurrentRequirementId] = useState<string>(
        searchParams.get('requirementId') || '',
    );

    // Mutations for creating and deleting relationships
    const createRelationshipMutation = useCreateRelationship();
    const deleteRelationshipMutation = useDeleteRelationship();

    // Fetch organization projects via server API (avoids client-side RLS issues)
    const { data: projects, isLoading: projectsLoading } =
        useAuthenticatedProjectsByMembershipForOrg(orgId, user?.id ?? '');
    // Use organizations from provider (prefetched server-side)
    const { organizations } = useOrganization();
    const orgsLoading = false;

    // Fetch requirement tree for hierarchy visualization
    const {
        data: requirementTree,
        isLoading: treeLoading,
        refetch: _refetchTree,
    } = useRequirementTree(selectedProject);

    // Fetch requirements for selected project
    const { data: requirements, isLoading: requirementsLoading } = useProjectRequirements(
        selectedProject,
    ) as { data: RequirementWithDocuments[] | undefined; isLoading: boolean };

    // Filter requirements based on search term
    const filteredRequirements = useMemo(() => {
        return (
            requirements?.filter(
                (req) =>
                    req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    req.external_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    req.description?.toLowerCase().includes(searchTerm.toLowerCase()),
            ) || []
        );
    }, [requirements, searchTerm]);

    // Get available children (excluding the selected parent to prevent cycles)
    const availableChildren = filteredRequirements.filter(
        (req) => req.id !== selectedParent,
    );

    // Keep local requirementId in sync when URL changes
    useEffect(() => {
        const fromUrl = searchParams.get('requirementId') || '';
        setCurrentRequirementId(fromUrl);
    }, [searchParams]);

    // Update URL when project or tab changes, preserving existing requirement/document params (and local requirementId)
    const updateURL = useCallback(
        (projectId: string, tab: string) => {
            const params = new URLSearchParams(searchParams); // start with current params
            if (projectId) {
                params.set('projectId', projectId);
            } else {
                params.delete('projectId');
            }
            if (tab) {
                params.set('tab', tab);
            }
            // Ensure requirementId is preserved even if not yet reflected in searchParams
            if (currentRequirementId) {
                params.set('requirementId', currentRequirementId);
            }
            router.replace(`/org/${orgId}/traceability?${params.toString()}`, {
                scroll: false,
            });
        },
        [router, orgId, searchParams, currentRequirementId],
    );

    // Navigate directly to Manage tab for a chosen requirement
    const openInManage = useCallback(
        (requirementId: string) => {
            const params = new URLSearchParams(searchParams);
            if (selectedProject) params.set('projectId', selectedProject);
            params.set('tab', 'manage');
            params.set('requirementId', requirementId);
            setCurrentRequirementId(requirementId);
            router.replace(`/org/${orgId}/traceability?${params.toString()}`);
            setActiveTab('manage');
        },
        [router, orgId, searchParams, selectedProject],
    );

    // Sync URL when state changes
    useEffect(() => {
        if (selectedProject || activeTab !== 'hierarchy') {
            updateURL(selectedProject, activeTab);
        }
    }, [selectedProject, activeTab, updateURL]);

    const handleProjectChange = useCallback((newProjectId: string) => {
        setSelectedProject(newProjectId);
    }, []);

    const handleTabChange = useCallback((newTab: string) => {
        setActiveTab(newTab);
    }, []);

    const handleParentSelect = useCallback((reqId: string) => {
        setSelectedParent(reqId);
        setSelectedChildren([]); // Clear children when parent changes
    }, []);

    const handleChildSelect = useCallback((childId: string) => {
        setSelectedChildren((prev) => {
            if (prev.includes(childId)) {
                return prev.filter((id) => id !== childId);
            } else {
                return [...prev, childId];
            }
        });
    }, []);

    const handleClearSelection = useCallback(() => {
        setSelectedParent('');
        setSelectedChildren([]);
    }, []);

    // Tree view helpers
    type TreeNode = {
        requirement_id: string;
        parent_id: string | null;
        depth: number;
        has_children?: boolean;
        path?: string;
        title?: string;
    };

    const sortedTree: TreeNode[] = useMemo(() => {
        const nodes = (requirementTree as unknown as TreeNode[]) || [];

        // Filter to show only nodes that are part of the hierarchy:
        // - has_children: parent nodes with children
        // - depth > 0: child nodes at any level
        // This includes all nodes in the tree structure
        const filteredNodes = nodes.filter((node) => node.has_children || node.depth > 0);

        // Remove duplicate nodes: keep only unique requirement_id
        // This prevents showing the same node multiple times
        const uniqueNodes = Array.from(
            new Map(filteredNodes.map((node) => [node.requirement_id, node])).values(),
        );

        return uniqueNodes.sort((a, b) => (a.path || '').localeCompare(b.path || ''));
    }, [requirementTree]);

    const visibleTree: TreeNode[] = useMemo(() => {
        const visible: TreeNode[] = [];
        const stack: boolean[] = [];
        for (const node of sortedTree) {
            const depth = node.depth ?? 0;
            while (stack.length > depth) stack.pop();
            const hidden = stack.some(Boolean);
            if (!hidden) {
                visible.push(node);
            }
            const isCollapsed = collapsedNodes.has(node.requirement_id);
            stack.push(isCollapsed);
        }
        return visible;
    }, [sortedTree, collapsedNodes]);

    const toggleNodeCollapse = useCallback((id: string) => {
        setCollapsedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const collapseAllToTopLevel = useCallback(() => {
        if (!sortedTree || sortedTree.length === 0) return;
        // Find minimum depth in the filtered tree (top-level after filtering out depth=0)
        const minDepth = Math.min(...sortedTree.map((n) => n.depth ?? 1));
        const next = new Set<string>();
        for (const n of sortedTree) {
            if ((n.depth ?? 1) === minDepth && n.has_children) {
                next.add(n.requirement_id);
            }
        }
        setCollapsedNodes(next);
    }, [sortedTree]);

    const expandAll = useCallback(() => {
        setCollapsedNodes(new Set());
    }, []);

    // Handle deleting a relationship
    const handleDeleteRelationship = useCallback(
        async (node: {
            requirement_id: string;
            title: string;
            parent_id: string | null;
        }) => {
            if (!node.parent_id || !node.requirement_id) {
                toast({
                    title: 'Unable to disconnect',
                    description: 'Invalid relationship data. Please try again.',
                    variant: 'destructive',
                });
                return;
            }

            const deleteRequest = {
                ancestorId: node.parent_id,
                descendantId: node.requirement_id,
            };

            try {
                await deleteRelationshipMutation.mutateAsync(deleteRequest);
                // Tree will automatically refetch due to cache invalidation
                toast({
                    title: 'Relationship removed',
                    description: 'The requirement was disconnected successfully.',
                    variant: 'default',
                });
            } catch (error) {
                console.error('Failed to delete relationship:', error);
                toast({
                    title: 'Failed to remove relationship',
                    description: 'Please try again.',
                    variant: 'destructive',
                });
            }
        },
        [deleteRelationshipMutation, toast],
    );

    const createParentChildRelationship = useCallback(async () => {
        if (!selectedParent || selectedChildren.length === 0) return;

        try {
            // Create relationships for each selected child
            const promises = selectedChildren.map((childId) =>
                createRelationshipMutation.mutateAsync({
                    ancestorId: selectedParent,
                    descendantId: childId,
                }),
            );

            const results = await Promise.all(promises);

            // Check for any failures - results is an array of success responses
            const failedResults = results.filter((result) => result.success === false);

            if (failedResults.length > 0) {
                const errorMessages = failedResults
                    .map((result) => result.message || result.error)
                    .join('\n');
                toast({
                    title: 'Some relationships failed',
                    description: errorMessages,
                    variant: 'destructive',
                });
            }

            // Show success message for successful ones
            const successfulResults = results.filter((result) => result.success === true);
            if (successfulResults.length > 0) {
                const totalCreated = successfulResults.reduce(
                    (sum, result) => sum + (result.relationshipsCreated || 0),
                    0,
                );
                toast({
                    title: 'Relationships created',
                    description: `Successfully created ${totalCreated} relationship record(s).`,
                    variant: 'default',
                });

                // Clear selections after successful creation
                setSelectedParent('');
                setSelectedChildren([]);

                // Tree will automatically refetch due to cache invalidation
            }
        } catch (error) {
            console.error('Failed to create relationships:', error);
            toast({
                title: 'Failed to create relationships',
                description: error instanceof Error ? error.message : 'Unknown error',
                variant: 'destructive',
            });
        }
    }, [selectedParent, selectedChildren, createRelationshipMutation, toast]);

    return (
        <LayoutView>
            <div className="flex h-full w-full flex-col p-4">
                <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="flex h-full flex-col gap-4"
                >
                    <div className="flex items-center gap-4">
                        {/* Organization Selector */}
                        <Select
                            value={orgId}
                            onValueChange={(newOrgId) => {
                                // reset local state when switching orgs
                                setSelectedProject('');
                                setActiveTab('hierarchy');
                                setSelectedParent('');
                                setSelectedChildren([]);
                                setSearchTerm('');
                                router.push(`/org/${newOrgId}/traceability`);
                            }}
                            disabled={orgsLoading}
                        >
                            <SelectTrigger className="w-72">
                                <SelectValue
                                    placeholder={
                                        orgsLoading
                                            ? 'Loading organizations...'
                                            : 'Select Organization'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {organizations?.map((org) => (
                                    <SelectItem key={org.id} value={org.id}>
                                        {org.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Project Selector */}
                        <Select
                            value={selectedProject}
                            onValueChange={handleProjectChange}
                            disabled={projectsLoading}
                        >
                            <SelectTrigger className="w-72">
                                <SelectValue
                                    placeholder={
                                        projectsLoading
                                            ? 'Loading projects...'
                                            : 'Select Project'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {projects?.map((project) => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <TabsList className="w-fit">
                            <TabsTrigger
                                value="hierarchy"
                                className="flex items-center gap-1"
                            >
                                <GitBranch className="h-4 w-4" />
                                <span className="font-semibold">Hierarchy</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="matrix"
                                className="flex items-center gap-1"
                            >
                                <Network className="h-4 w-4" />
                                <span className="font-semibold">Tree View</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="manage"
                                className="flex items-center gap-1"
                            >
                                <Zap className="h-4 w-4" />
                                <span className="font-semibold">Manage</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Requirements Area */}
                    {selectedProject && (
                        <>
                            <TabsContent value="hierarchy" className="flex-1 h-full">
                                <Card className="h-full flex flex-col">
                                    <CardHeader className="py-4 flex-shrink-0">
                                        <CardTitle className="text-lg font-bold">
                                            Requirements Hierarchy
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 flex-1 overflow-y-auto">
                                        <div className="relative">
                                            <Input
                                                placeholder="Search requirements by name, ID, or description..."
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(e.target.value)
                                                }
                                                className="pl-9"
                                            />
                                            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            {searchTerm && (
                                                <button
                                                    onClick={() => setSearchTerm('')}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    aria-label="Clear search"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        <Card className="border-dashed">
                                            <CardHeader className="py-3">
                                                <CardTitle className="text-base">
                                                    1. Select Parent Requirement
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <Select
                                                    value={selectedParent}
                                                    onValueChange={handleParentSelect}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Choose parent requirement..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filteredRequirements.map(
                                                            (req) => (
                                                                <SelectItem
                                                                    key={req.id}
                                                                    value={req.id}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            {req.external_id ||
                                                                                req.id.slice(
                                                                                    0,
                                                                                    8,
                                                                                )}
                                                                        </Badge>
                                                                        <span className="text-sm">
                                                                            {req.name}
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </CardContent>
                                        </Card>

                                        {selectedParent && (
                                            <Card className="border-dashed">
                                                <CardHeader className="py-3">
                                                    <CardTitle className="text-base">
                                                        2. Select Child Requirements
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    <div className="text-sm text-muted-foreground">
                                                        <span className="mr-2">
                                                            Parent:
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className="mr-2"
                                                        >
                                                            {requirements?.find(
                                                                (r) =>
                                                                    r.id ===
                                                                    selectedParent,
                                                            )?.external_id ||
                                                                selectedParent.slice(
                                                                    0,
                                                                    8,
                                                                )}
                                                        </Badge>
                                                        <span className="font-medium text-foreground">
                                                            {
                                                                requirements?.find(
                                                                    (r) =>
                                                                        r.id ===
                                                                        selectedParent,
                                                                )?.name
                                                            }
                                                        </span>
                                                    </div>

                                                    {selectedChildren.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedChildren.map(
                                                                (childId) => (
                                                                    <Badge
                                                                        key={childId}
                                                                        className="text-xs"
                                                                        variant="secondary"
                                                                    >
                                                                        {requirements?.find(
                                                                            (r) =>
                                                                                r.id ===
                                                                                childId,
                                                                        )?.external_id ||
                                                                            childId.slice(
                                                                                0,
                                                                                8,
                                                                            )}
                                                                    </Badge>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            onClick={
                                                                createParentChildRelationship
                                                            }
                                                            disabled={
                                                                selectedChildren.length ===
                                                                    0 ||
                                                                createRelationshipMutation.isPending
                                                            }
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            {createRelationshipMutation.isPending
                                                                ? 'Creating...'
                                                                : `Create Relationships (${selectedChildren.length})`}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={handleClearSelection}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Clear All
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {selectedParent ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Search className="h-4 w-4" />
                                                    <span>
                                                        Available Child Requirements
                                                    </span>
                                                    <span>
                                                        — Click to select/deselect
                                                    </span>
                                                </div>
                                                {requirementsLoading ? (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        Loading requirements...
                                                    </div>
                                                ) : availableChildren.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {availableChildren.map(
                                                            (requirement) => (
                                                                <div
                                                                    key={requirement.id}
                                                                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                                                                        selectedChildren.includes(
                                                                            requirement.id,
                                                                        )
                                                                            ? 'border-primary bg-muted'
                                                                            : 'hover:bg-muted/50'
                                                                    }`}
                                                                    onClick={() =>
                                                                        handleChildSelect(
                                                                            requirement.id,
                                                                        )
                                                                    }
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <Badge
                                                                                    variant={
                                                                                        selectedChildren.includes(
                                                                                            requirement.id,
                                                                                        )
                                                                                            ? 'default'
                                                                                            : 'outline'
                                                                                    }
                                                                                    className="text-xs font-mono"
                                                                                >
                                                                                    {requirement.external_id ||
                                                                                        requirement.id.slice(
                                                                                            0,
                                                                                            8,
                                                                                        )}
                                                                                </Badge>
                                                                                <h3 className="font-medium text-sm">
                                                                                    {
                                                                                        requirement.name
                                                                                    }
                                                                                </h3>
                                                                                {requirement.documents && (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="text-xs"
                                                                                    >
                                                                                        {' '}
                                                                                        {
                                                                                            requirement
                                                                                                .documents
                                                                                                .name
                                                                                        }
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            {requirement.description && (
                                                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                                                    {
                                                                                        requirement.description
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 ml-4">
                                                                            {selectedChildren.includes(
                                                                                requirement.id,
                                                                            ) && (
                                                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                                            )}
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    e.stopPropagation();
                                                                                    openInManage(
                                                                                        requirement.id,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                View
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        {searchTerm
                                                            ? 'No requirements match your search'
                                                            : 'No available child requirements'}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                                                    All Requirements (select parent
                                                    first):
                                                </h4>
                                                {requirementsLoading ? (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        Loading requirements...
                                                    </div>
                                                ) : filteredRequirements.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {filteredRequirements.map(
                                                            (requirement) => (
                                                                <div
                                                                    key={requirement.id}
                                                                    className="p-3 border rounded-md"
                                                                >
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs font-mono"
                                                                        >
                                                                            {requirement.external_id ||
                                                                                requirement.id.slice(
                                                                                    0,
                                                                                    8,
                                                                                )}
                                                                        </Badge>
                                                                        <h3 className="font-medium text-sm">
                                                                            {
                                                                                requirement.name
                                                                            }
                                                                        </h3>
                                                                        {requirement.documents && (
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="text-xs"
                                                                            >
                                                                                {' '}
                                                                                {
                                                                                    requirement
                                                                                        .documents
                                                                                        .name
                                                                                }
                                                                            </Badge>
                                                                        )}
                                                                        <div className="ml-auto">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    openInManage(
                                                                                        requirement.id,
                                                                                    )
                                                                                }
                                                                            >
                                                                                View in
                                                                                Manage
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                    {requirement.description && (
                                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                                            {
                                                                                requirement.description
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        {searchTerm
                                                            ? 'No requirements match your search'
                                                            : 'No requirements found'}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="matrix" className="flex-1 h-full">
                                <Card className="h-full flex flex-col">
                                    <CardHeader className="py-4 flex-shrink-0">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <CardTitle className="text-lg font-bold">
                                                    Requirements Tree View
                                                </CardTitle>
                                                <CardDescription>
                                                    Toggle nodes to collapse/expand. Use
                                                    actions to change the whole view.
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={collapseAllToTopLevel}
                                                >
                                                    Collapse to top-level
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={expandAll}
                                                >
                                                    Expand all
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 flex-1 overflow-y-auto">
                                        {treeLoading ? (
                                            <div className="flex items-center justify-center py-12 text-muted-foreground">
                                                Loading tree structure...
                                            </div>
                                        ) : requirementTree &&
                                          requirementTree.length > 0 ? (
                                            <div className="space-y-1">
                                                {visibleTree.map((node, index) => {
                                                    const requirement =
                                                        requirements?.find(
                                                            (r) =>
                                                                r.id ===
                                                                node.requirement_id,
                                                        );
                                                    // Determine minimum depth for labeling
                                                    const minDepth =
                                                        sortedTree.length > 0
                                                            ? Math.min(
                                                                  ...sortedTree.map(
                                                                      (n) => n.depth ?? 1,
                                                                  ),
                                                              )
                                                            : 1;
                                                    const relativeDepth =
                                                        node.depth - minDepth;
                                                    const isTopLevel =
                                                        relativeDepth === 0;

                                                    // Depth-based colors for visual hierarchy
                                                    const depthColors = [
                                                        'border-l-blue-500',
                                                        'border-l-green-500',
                                                        'border-l-purple-500',
                                                        'border-l-orange-500',
                                                        'border-l-pink-500',
                                                    ];
                                                    const borderColor = isTopLevel
                                                        ? 'border-l-4 border-l-blue-600 dark:border-l-blue-400'
                                                        : `border-l-2 ${depthColors[relativeDepth % depthColors.length]}`;

                                                    // Get document info for navigation
                                                    const documentId =
                                                        requirement?.document_id;
                                                    const projectId = (
                                                        requirement as RequirementWithDocuments
                                                    )?.documents?.project_id;

                                                    const handleCardClick = () => {
                                                        if (documentId && projectId) {
                                                            router.push(
                                                                `/org/${orgId}/project/${projectId}/documents/${documentId}`,
                                                            );
                                                        }
                                                    };

                                                    return (
                                                        <div
                                                            key={`${node.requirement_id}-${node.parent_id || 'root'}-${index}`}
                                                            className="relative"
                                                            style={{
                                                                marginLeft: `${relativeDepth * 32}px`,
                                                            }}
                                                            onClick={() =>
                                                                openInManage(
                                                                    node.requirement_id,
                                                                )
                                                            }
                                                        >
                                                            {/* Tree connection lines */}
                                                            {!isTopLevel && (
                                                                <>
                                                                    {/* Vertical line from parent */}
                                                                    <div
                                                                        className="absolute left-[-16px] top-0 bottom-1/2 w-px bg-border"
                                                                        style={{
                                                                            left: '-16px',
                                                                        }}
                                                                    />
                                                                    {/* Horizontal line to node */}
                                                                    <div
                                                                        className="absolute left-[-16px] top-1/2 w-4 h-px bg-border"
                                                                        style={{
                                                                            left: '-16px',
                                                                        }}
                                                                    />
                                                                </>
                                                            )}

                                                            <div
                                                                onClick={handleCardClick}
                                                                className={`
                                                                    group relative p-4 border rounded-lg transition-all
                                                                    ${borderColor}
                                                                    ${documentId && projectId ? 'cursor-pointer hover:shadow-md hover:border-primary' : ''}
                                                                    ${isTopLevel ? 'bg-muted/30' : 'bg-background'}
                                                                    hover:bg-muted/50
                                                                `}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            {/* Expand/Collapse button */}
                                                                            {node.has_children ? (
                                                                                <button
                                                                                    type="button"
                                                                                    aria-label={
                                                                                        collapsedNodes.has(
                                                                                            node.requirement_id,
                                                                                        )
                                                                                            ? 'Expand node'
                                                                                            : 'Collapse node'
                                                                                    }
                                                                                    className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-accent z-10"
                                                                                    onClick={(
                                                                                        e,
                                                                                    ) => {
                                                                                        e.stopPropagation();
                                                                                        toggleNodeCollapse(
                                                                                            node.requirement_id,
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    {collapsedNodes.has(
                                                                                        node.requirement_id,
                                                                                    ) ? (
                                                                                        <ChevronRight className="h-4 w-4" />
                                                                                    ) : (
                                                                                        <ChevronDown className="h-4 w-4" />
                                                                                    )}
                                                                                </button>
                                                                            ) : !isTopLevel ? (
                                                                                <div className="inline-flex h-5 w-5 items-center justify-center">
                                                                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                                                                </div>
                                                                            ) : (
                                                                                <span className="inline-block w-5" />
                                                                            )}

                                                                            <Badge
                                                                                variant="outline"
                                                                                className="text-xs font-mono"
                                                                            >
                                                                                {requirement?.external_id ||
                                                                                    node.title ||
                                                                                    node.requirement_id?.slice(
                                                                                        0,
                                                                                        8,
                                                                                    )}
                                                                            </Badge>
                                                                            <Badge
                                                                                variant={
                                                                                    isTopLevel
                                                                                        ? 'default'
                                                                                        : 'secondary'
                                                                                }
                                                                                className="text-xs"
                                                                            >
                                                                                {isTopLevel
                                                                                    ? 'PARENT'
                                                                                    : `CHILD-L${relativeDepth}`}
                                                                            </Badge>
                                                                            <h3 className="font-medium text-sm truncate">
                                                                                {requirement?.name ||
                                                                                    node.title}
                                                                            </h3>
                                                                            {requirement?.documents && (
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="text-xs truncate max-w-[120px]"
                                                                                >
                                                                                    {
                                                                                        requirement
                                                                                            .documents
                                                                                            .name
                                                                                    }
                                                                                </Badge>
                                                                            )}
                                                                            {node.has_children && (
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                                                                >
                                                                                    <Network className="h-3 w-3 mr-1" />
                                                                                    {
                                                                                        visibleTree.filter(
                                                                                            (
                                                                                                n,
                                                                                            ) =>
                                                                                                n.parent_id ===
                                                                                                node.requirement_id,
                                                                                        )
                                                                                            .length
                                                                                    }{' '}
                                                                                    child
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        {requirement?.description && (
                                                                            <p className="text-xs text-muted-foreground line-clamp-2 ml-7">
                                                                                {
                                                                                    requirement.description
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2 ml-4">
                                                                        {/* Open document indicator */}
                                                                        {documentId &&
                                                                            projectId && (
                                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground flex items-center gap-1">
                                                                                    <ArrowRight className="h-3 w-3" />
                                                                                    Open
                                                                                </div>
                                                                            )}
                                                                        {/* Disconnect button - only for children */}
                                                                        {!isTopLevel && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteRelationship(
                                                                                        {
                                                                                            requirement_id:
                                                                                                node.requirement_id,
                                                                                            title:
                                                                                                requirement?.name ||
                                                                                                node.title ||
                                                                                                node.requirement_id.slice(
                                                                                                    0,
                                                                                                    8,
                                                                                                ),
                                                                                            parent_id:
                                                                                                node.parent_id,
                                                                                        },
                                                                                    );
                                                                                }}
                                                                                className="text-xs h-8 px-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            >
                                                                                <Unlink className="h-4 w-4 mr-1" />
                                                                                Unlink
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <Network className="h-12 w-12 mx-auto mb-4" />
                                                <p className="font-medium">
                                                    No hierarchy found
                                                </p>
                                                <p className="text-sm">
                                                    Create some relationships to see the
                                                    tree structure
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="manage" className="flex-1 h-full">
                                {(() => {
                                    const requirementId =
                                        searchParams.get('requirementId') ||
                                        currentRequirementId;
                                    const documentId =
                                        searchParams.get('documentId') || '';

                                    if (!requirementId) {
                                        return (
                                            <Card className="h-full flex flex-col">
                                                <CardHeader className="flex-shrink-0">
                                                    <CardTitle>
                                                        Manage Trace Links
                                                    </CardTitle>
                                                    <CardDescription>
                                                        View and manage trace links for
                                                        individual requirements. Select a
                                                        requirement below to get started.
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="flex-1 overflow-y-auto">
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        <Network className="h-12 w-12 mx-auto mb-4" />
                                                        <p>
                                                            Select a requirement from the
                                                            Hierarchy or Tree View tabs to
                                                            manage its trace links
                                                        </p>
                                                        <p className="text-sm mt-2">
                                                            You can create parent-child
                                                            relationships, manage test
                                                            cases, and view requirement
                                                            hierarchies
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    }

                                    return (
                                        <TraceLinksContent
                                            requirementId={requirementId}
                                            projectId={selectedProject}
                                            orgId={orgId}
                                            documentId={documentId}
                                        />
                                    );
                                })()}
                            </TabsContent>
                        </>
                    )}

                    {!selectedProject && !projectsLoading && (
                        <div className="text-center py-12 text-muted-foreground">
                            <GitBranch className="h-10 w-10 mx-auto mb-3" />
                            <p className="text-base font-medium">
                                Select a project to get started
                            </p>
                            <p className="text-sm">
                                Choose a project to view and manage requirement
                                relationships
                            </p>
                        </div>
                    )}
                </Tabs>
            </div>
        </LayoutView>
    );
}
