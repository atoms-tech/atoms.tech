'use client';

import {
    ArrowRight,
    GitBranch,
    Network,
    Plus,
    Search,
    Trash2,
    Unlink,
    Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

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
    const { user } = useUser();
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedParent, setSelectedParent] = useState<string>('');
    const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

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

    // Handle deleting a relationship
    const handleDeleteRelationship = useCallback(
        async (node: {
            requirement_id: string;
            title: string;
            parent_id: string | null;
        }) => {
            if (!node.parent_id || !node.requirement_id) {
                alert('Cannot delete: Invalid relationship data');
                return;
            }

            const confirmDelete = confirm(
                `Are you sure you want to disconnect "${node.title}" from its parent?\n\n` +
                    `This will break the hierarchy connection and make it an independent node.\n` +
                    `The node itself will NOT be deleted.`,
            );

            if (!confirmDelete) return;

            const deleteRequest = {
                ancestorId: node.parent_id,
                descendantId: node.requirement_id,
            };

            try {
                await deleteRelationshipMutation.mutateAsync(deleteRequest);
                alert('Connection successfully disconnected!');
                // Tree will automatically refetch due to cache invalidation
            } catch (error) {
                console.error('Failed to delete relationship:', error);
                alert('Failed to delete relationship. Please try again.');
            }
        },
        [deleteRelationshipMutation],
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

            // Check for any failures
            const failedResults = results.filter((result) => !result.success);

            if (failedResults.length > 0) {
                // Show error for failed relationships
                const errorMessages = failedResults
                    .map((result) => result.message || result.error)
                    .join('\n');
                alert(`Some relationships failed to create:\n${errorMessages}`);
            } else {
                // All successful
                const totalCreated = results.reduce(
                    (sum, result) => sum + (result.relationshipsCreated || 0),
                    0,
                );
                alert(`Successfully created ${totalCreated} relationship records!`);

                // Clear selections after successful creation
                setSelectedParent('');
                setSelectedChildren([]);

                // Tree will automatically refetch due to cache invalidation
            }
        } catch (error) {
            console.error('Failed to create relationships:', error);
            alert(
                `Failed to create relationships: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }, [selectedParent, selectedChildren, createRelationshipMutation]);

    return (
        <div className="flex h-full w-full flex-col p-4">
            <Tabs defaultValue="hierarchy" className="flex h-full flex-col gap-4">
                <div className="flex items-center gap-4">
                    {/* Organization Selector */}
                    <Select
                        value={orgId}
                        onValueChange={(newOrgId) => {
                            // reset local state when switching orgs
                            setSelectedProject('');
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
                        onValueChange={(projectId) => {
                            setSelectedProject(projectId);
                        }}
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
                        <TabsTrigger value="matrix" className="flex items-center gap-1">
                            <Network className="h-4 w-4" />
                            <span className="font-semibold">Tree View</span>
                        </TabsTrigger>
                        <TabsTrigger value="manage" className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            <span className="font-semibold">Manage</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Requirements Area */}
                {selectedProject && (
                    <>
                        <TabsContent value="hierarchy" className="flex-1">
                            <Card className="h-full">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-lg font-bold">
                                        Requirements Hierarchy
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
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
                                                    {filteredRequirements.map((req) => (
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
                                                    ))}
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
                                                    <span className="mr-2">Parent:</span>
                                                    <Badge
                                                        variant="outline"
                                                        className="mr-2"
                                                    >
                                                        {requirements?.find(
                                                            (r) =>
                                                                r.id === selectedParent,
                                                        )?.external_id ||
                                                            selectedParent.slice(0, 8)}
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
                                                <span>Available Child Requirements</span>
                                                <span>— Click to select/deselect</span>
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
                                                                    {selectedChildren.includes(
                                                                        requirement.id,
                                                                    ) && (
                                                                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-4" />
                                                                    )}
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
                                                All Requirements (select parent first):
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
                                                                        {requirement.name}
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

                        <TabsContent value="matrix" className="flex-1">
                            <Card className="h-full">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-lg font-bold">
                                        Requirements Tree View
                                    </CardTitle>
                                    <CardDescription>
                                        Click on any requirement to select it and access
                                        Expand/Trace actions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {treeLoading ? (
                                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                                            Loading tree structure...
                                        </div>
                                    ) : requirementTree && requirementTree.length > 0 ? (
                                        <div className="space-y-2">
                                            {requirementTree
                                                .filter(
                                                    (node) =>
                                                        node.has_children ||
                                                        node.depth > 0,
                                                )
                                                .sort((a, b) =>
                                                    (a.path || '').localeCompare(
                                                        b.path || '',
                                                    ),
                                                )
                                                .map((node, index) => {
                                                    const requirement =
                                                        requirements?.find(
                                                            (r) =>
                                                                r.id ===
                                                                node.requirement_id,
                                                        );
                                                    return (
                                                        <div
                                                            key={`${node.requirement_id}-${node.parent_id || 'root'}-${index}`}
                                                            className="p-4 border rounded-lg transition-colors hover:bg-muted/50 border-border"
                                                            style={{
                                                                marginLeft: `${node.depth * 24}px`,
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        {node.depth >
                                                                            0 && (
                                                                            <ArrowRight className="h-4 w-4 text-blue-400" />
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
                                                                            variant="secondary"
                                                                            className="text-xs"
                                                                        >
                                                                            {node.depth ===
                                                                            0
                                                                                ? 'PARENT'
                                                                                : `CHILD-L${node.depth}`}
                                                                        </Badge>
                                                                        <h3 className="font-medium text-sm">
                                                                            {requirement?.name ||
                                                                                node.title}
                                                                        </h3>
                                                                        {requirement?.documents && (
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
                                                                    {requirement?.description && (
                                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                                            {
                                                                                requirement.description
                                                                            }
                                                                        </p>
                                                                    )}
                                                                    {node.path &&
                                                                        node.depth >
                                                                            0 && (
                                                                            <p className="text-xs text-muted-foreground truncate mt-1">
                                                                                Path:{' '}
                                                                                {
                                                                                    node.path
                                                                                }
                                                                            </p>
                                                                        )}
                                                                </div>
                                                                {node.depth > 0 && (
                                                                    <div className="ml-4">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleDeleteRelationship(
                                                                                    node,
                                                                                )
                                                                            }
                                                                            className="text-xs h-8 px-3"
                                                                        >
                                                                            <Unlink className="h-4 w-4 mr-1" />{' '}
                                                                            Disconnect
                                                                        </Button>
                                                                    </div>
                                                                )}
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
                                                Create some relationships to see the tree
                                                structure
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="manage" className="flex-1">
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle>Manage Relationships</CardTitle>
                                    <CardDescription>
                                        Create and modify requirement dependencies using
                                        closure table
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Plus className="h-12 w-12 mx-auto mb-4" />
                                        <p>Relationship management coming soon</p>
                                        <p className="text-sm">
                                            This will allow creating parent-child
                                            relationships with cycle prevention
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
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
                            Choose a project to view and manage requirement relationships
                        </p>
                    </div>
                )}
            </Tabs>
        </div>
    );
}
