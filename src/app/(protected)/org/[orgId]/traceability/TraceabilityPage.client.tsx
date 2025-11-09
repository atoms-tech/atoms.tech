'use client';

import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    closestCenter,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
    ArrowRight,
    ChevronDown,
    ChevronRight,
    GitBranch,
    GripVertical,
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

// Tree node type
type TreeNode = {
    requirement_id: string;
    parent_id: string | null;
    depth: number;
    has_children?: boolean;
    path?: string;
    title?: string;
};

// Draggable Tree Node Component
interface DraggableTreeNodeProps {
    node: TreeNode;
    requirement: RequirementWithDocuments | undefined;
    isTopLevel: boolean;
    relativeDepth: number;
    orgId: string;
    visibleTree: TreeNode[];
    collapsedNodes: Set<string>;
    activeId: string | null;
    overId: string | null;
    onToggleCollapse: (id: string) => void;
    onDeleteRelationship: (node: {
        requirement_id: string;
        title: string;
        parent_id: string | null;
    }) => void;
}

function DraggableTreeNode({
    node,
    requirement,
    isTopLevel,
    relativeDepth,
    orgId,
    visibleTree,
    collapsedNodes,
    activeId,
    overId,
    onToggleCollapse,
    onDeleteRelationship,
}: DraggableTreeNodeProps) {
    const router = useRouter();

    // Draggable
    const {
        attributes,
        listeners,
        setNodeRef: setDragRef,
        transform,
        isDragging,
    } = useDraggable({
        id: node.requirement_id,
        data: { node },
    });

    // Droppable
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: node.requirement_id,
        data: { node },
    });

    // Combine refs
    const setNodeRef = (element: HTMLElement | null) => {
        setDragRef(element);
        setDropRef(element);
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        marginLeft: `${relativeDepth * 32}px`,
    };

    // Depth-based colors
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

    // Drop zone styling
    const isValidDrop =
        isOver && overId === node.requirement_id && activeId !== node.requirement_id;
    const dropZoneClass = isValidDrop
        ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950'
        : '';

    const documentId = requirement?.document_id;
    const projectId = (requirement as RequirementWithDocuments)?.documents?.project_id;

    const handleCardClick = () => {
        if (documentId && projectId) {
            router.push(`/org/${orgId}/project/${projectId}/documents/${documentId}`);
        }
    };

    return (
        <div ref={setNodeRef} className="relative" style={style}>
            {/* Tree connection lines */}
            {!isTopLevel && (
                <>
                    <div
                        className="absolute left-[-16px] top-0 bottom-1/2 w-px bg-border"
                        style={{ left: '-16px' }}
                    />
                    <div
                        className="absolute left-[-16px] top-1/2 w-4 h-px bg-border"
                        style={{ left: '-16px' }}
                    />
                </>
            )}

            <div
                {...listeners}
                {...attributes}
                onClick={handleCardClick}
                className={`
                    group relative p-4 border rounded-lg transition-all cursor-grab active:cursor-grabbing
                    ${borderColor}
                    ${dropZoneClass}
                    ${isTopLevel ? 'bg-muted/30' : 'bg-background'}
                    hover:bg-muted/50 hover:shadow-md hover:border-primary
                `}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            {/* Drag indicator */}
                            <div className="p-1">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>

                            {/* Expand/Collapse */}
                            {node.has_children ? (
                                <button
                                    type="button"
                                    aria-label={
                                        collapsedNodes.has(node.requirement_id)
                                            ? 'Expand'
                                            : 'Collapse'
                                    }
                                    className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-accent z-10 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleCollapse(node.requirement_id);
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    {collapsedNodes.has(node.requirement_id) ? (
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

                            <Badge variant="outline" className="text-xs font-mono">
                                {requirement?.external_id ||
                                    node.title ||
                                    node.requirement_id?.slice(0, 8)}
                            </Badge>
                            <Badge
                                variant={isTopLevel ? 'default' : 'secondary'}
                                className="text-xs"
                            >
                                {isTopLevel ? 'PARENT' : `CHILD-L${relativeDepth}`}
                            </Badge>
                            <h3 className="font-medium text-sm truncate">
                                {requirement?.name || node.title}
                            </h3>
                            {requirement?.documents && (
                                <Badge
                                    variant="outline"
                                    className="text-xs truncate max-w-[120px]"
                                >
                                    {requirement.documents.name}
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
                                            (n) => n.parent_id === node.requirement_id,
                                        ).length
                                    }{' '}
                                    child
                                </Badge>
                            )}
                        </div>
                        {requirement?.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 ml-7">
                                {requirement.description}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        {documentId && projectId && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground flex items-center gap-1">
                                <ArrowRight className="h-3 w-3" />
                                Open
                            </div>
                        )}
                        {!isTopLevel && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteRelationship({
                                        requirement_id: node.requirement_id,
                                        title:
                                            requirement?.name ||
                                            node.title ||
                                            node.requirement_id.slice(0, 8),
                                        parent_id: node.parent_id,
                                    });
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="text-xs h-8 px-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
}

// Root Zone Component (drop to create new parent)
function RootZone({
    activeId,
    overId,
}: {
    activeId: string | null;
    overId: string | null;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: 'root-zone',
        data: { isRootZone: true },
    });

    const isActive = isOver && overId === 'root-zone' && activeId;

    return (
        <div
            ref={setNodeRef}
            className={`
                mb-3 p-4 border-2 border-dashed rounded-lg transition-all text-center
                ${
                    isActive
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-muted-foreground/30 bg-muted/20'
                }
            `}
        >
            <div className="flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">Root Zone</span>
                </div>
                <span className="text-xs">
                    Drop tree nodes here to remove their parent relationship
                </span>
            </div>
        </div>
    );
}

// Draggable Requirement Card (for right panel)
interface DraggableRequirementCardProps {
    requirement: RequirementWithDocuments;
    inTree: boolean;
    isOrphan: boolean;
    activeId: string | null;
    overId: string | null;
}

function DraggableRequirementCard({
    requirement,
    inTree,
    isOrphan,
    activeId,
    overId,
}: DraggableRequirementCardProps) {
    // Make it draggable
    const {
        attributes,
        listeners,
        setNodeRef: setDragRef,
        transform,
        isDragging,
    } = useDraggable({
        id: requirement.id,
        data: { requirement, source: 'available' },
    });

    // Make it droppable too (so orphans can be dropped onto orphans)
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: requirement.id,
        data: { requirement, source: 'available' },
    });

    // Combine refs
    const setNodeRef = (element: HTMLElement | null) => {
        setDragRef(element);
        setDropRef(element);
    };

    const style = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.3 : 1,
    };

    const isDropTarget = isOver && overId === requirement.id && activeId;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`
                p-3 border rounded-lg transition-all cursor-grab active:cursor-grabbing
                ${inTree ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50' : 'border-border'}
                ${isDragging ? 'shadow-lg' : 'hover:border-primary hover:bg-accent/50'}
                ${isDropTarget ? 'border-primary border-2 bg-primary/10 shadow-lg' : ''}
            `}
        >
            <div className="flex items-start gap-2">
                <div className="p-0.5">
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-xs font-mono">
                            {requirement.external_id || requirement.id.slice(0, 8)}
                        </Badge>
                        {isOrphan ? (
                            <Badge
                                variant="secondary"
                                className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                            >
                                🆓 Not linked
                            </Badge>
                        ) : (
                            <Badge variant="default" className="text-xs">
                                🔗 In tree
                            </Badge>
                        )}
                    </div>
                    <h4 className="text-sm font-medium line-clamp-1 mb-1">
                        {requirement.name}
                    </h4>
                    {requirement.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {requirement.description}
                        </p>
                    )}
                    <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                            {requirement.documents?.name || 'Unknown doc'}
                        </Badge>
                    </div>
                </div>
            </div>
        </div>
    );
}

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

    // Drag and Drop state
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);

    // Right panel filter state
    const [reqFilter, setReqFilter] = useState<'all' | 'orphans' | 'linked'>('orphans');

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required to start drag
            },
        }),
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

    // Check if dropping would create a cycle
    const wouldCreateCycle = useCallback(
        (draggedId: string, targetId: string): boolean => {
            if (draggedId === targetId) return true;

            // Check if target is a descendant of dragged node
            const checkDescendants = (nodeId: string): boolean => {
                const children = visibleTree.filter((n) => n.parent_id === nodeId);
                for (const child of children) {
                    if (child.requirement_id === targetId) return true;
                    if (checkDescendants(child.requirement_id)) return true;
                }
                return false;
            };

            return checkDescendants(draggedId);
        },
        [visibleTree],
    );

    // Drag handlers
    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        setOverId(event.over?.id as string | null);
    }, []);

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveId(null);
            setOverId(null);

            if (!over || active.id === over.id) return;

            const draggedId = active.id as string;
            const targetId = over.id as string;

            // Check if dropped on root zone
            const droppedOnRootZone = targetId === 'root-zone';

            // Check if dragged from right panel (available requirements)
            const fromRightPanel = active.data.current?.source === 'available';

            // Root zone drop: Remove parent to promote to root (tree nodes only)
            if (droppedOnRootZone) {
                // Orphans from right panel: Show helpful message
                if (fromRightPanel) {
                    alert(
                        'To create first relationship:\n\n' +
                            '1. Drag an orphan requirement from right panel\n' +
                            '2. Drop it onto another orphan requirement\n' +
                            '3. The one you drop onto becomes the PARENT (root)\n' +
                            '4. The one you dragged becomes the CHILD',
                    );
                    return;
                }

                // Tree nodes: Remove parent relationship (promote to root)
                const draggedNode = visibleTree.find(
                    (n) => n.requirement_id === draggedId,
                );

                if (!draggedNode) {
                    // Not in tree at all (shouldn't happen for tree nodes)
                    alert('ℹ️ This requirement is not in the hierarchy tree yet');
                    return;
                }

                if (!draggedNode.parent_id) {
                    // Already a root parent (no parent to remove)
                    alert(
                        'ℹ️ This node is already a root parent (no parent relationship)',
                    );
                    return;
                }

                // Has a parent - remove the relationship
                try {
                    await deleteRelationshipMutation.mutateAsync({
                        ancestorId: draggedNode.parent_id,
                        descendantId: draggedId,
                    });
                    alert('✅ Node promoted to root (parent removed)!');
                } catch (error) {
                    console.error('Failed to promote to root:', error);
                    alert(
                        `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    );
                }
                return;
            }

            // Cycle detection (only for nodes already in tree)
            if (!fromRightPanel && wouldCreateCycle(draggedId, targetId)) {
                alert(
                    '⚠️ Cannot create cycle: Target is a descendant of the dragged node',
                );
                return;
            }

            // Find nodes in full tree (not just visible tree)
            const allTreeNodes = (requirementTree as unknown as TreeNode[]) || [];
            const draggedNode = allTreeNodes.find((n) => n.requirement_id === draggedId);

            // Validate target exists as a requirement (not necessarily in tree)
            const targetRequirement = requirements?.find((r) => r.id === targetId);
            if (!targetRequirement) {
                alert('⚠️ Invalid drop target');
                return;
            }

            // Check if this exact relationship already exists
            if (draggedNode && draggedNode.parent_id === targetId) {
                alert(
                    'ℹ️ This relationship already exists!\n\n' +
                        'This requirement is already a child of the target parent.',
                );
                return;
            }

            try {
                // Delete old relationship (if exists and node is in tree)
                if (draggedNode && draggedNode.parent_id) {
                    await deleteRelationshipMutation.mutateAsync({
                        ancestorId: draggedNode.parent_id,
                        descendantId: draggedId,
                    });
                }

                // Create new relationship
                // Target becomes PARENT, Dragged becomes CHILD
                await createRelationshipMutation.mutateAsync({
                    ancestorId: targetId,
                    descendantId: draggedId,
                });

                if (fromRightPanel) {
                    alert('✅ Successfully added requirement to tree!');
                } else {
                    alert('✅ Successfully moved node!');
                }
            } catch (error) {
                console.error('Failed to move/add node:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                if (errorMessage.includes('Relationship already exists')) {
                    alert(
                        '⚠️ This relationship already exists!\n\n' +
                            'These requirements are already connected.\n' +
                            'Try dragging to a different requirement.',
                    );
                } else if (errorMessage.includes('Circular reference')) {
                    alert(
                        '⚠️ Cannot create circular reference!\n\n' +
                            'This would create a loop in the hierarchy.',
                    );
                } else {
                    alert(`❌ Failed: ${errorMessage}`);
                }
            }
        },
        [
            visibleTree,
            requirements,
            wouldCreateCycle,
            deleteRelationshipMutation,
            createRelationshipMutation,
        ],
    );

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
        setOverId(null);
    }, []);

    return (
        <LayoutView>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
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
<<<<<<< HEAD
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
                                                                    </div>
                                                                    {requirement.description && (
                                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                                            {
                                                                                requirement.description
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
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
                                                                            )
                                                                                ?.external_id ||
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
                                                                onClick={
                                                                    handleClearSelection
                                                                }
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
                                                                        key={
                                                                            requirement.id
                                                                        }
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
                                                        All Requirements (select parent
                                                        first):
                                                    </h4>
                                                    {requirementsLoading ? (
                                                        <div className="text-center py-8 text-muted-foreground">
                                                            Loading requirements...
                                                        </div>
                                                    ) : filteredRequirements.length >
                                                      0 ? (
                                                        <div className="space-y-2">
                                                            {filteredRequirements.map(
                                                                (requirement) => (
                                                                    <div
                                                                        key={
                                                                            requirement.id
                                                                        }
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
                                                                        </div>
                                                                        {requirement.description && (
                                                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                                                {
                                                                                    requirement.description
                                                                                }
                                                                            </p>
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
                                                        Drag nodes to reorganize or drag
                                                        from available requirements
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
                                        <CardContent className="flex-1 overflow-hidden flex gap-4 p-4">
                                            {/* Left: Tree View (60%) */}
                                            <div className="w-[60%] flex flex-col">
                                                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                                                    Hierarchy Tree
                                                </h3>
                                                <div className="flex-1 overflow-y-auto pr-2">
                                                    {/* Root Zone - Drop area for creating parentless nodes */}
                                                    <RootZone
                                                        activeId={activeId}
                                                        overId={overId}
                                                    />

                                                    {treeLoading ? (
                                                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                                                            Loading tree structure...
                                                        </div>
                                                    ) : requirementTree &&
                                                      requirementTree.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {visibleTree.map(
                                                                (node, index) => {
                                                                    const requirement =
                                                                        requirements?.find(
                                                                            (r) =>
                                                                                r.id ===
                                                                                node.requirement_id,
                                                                        );
                                                                    const minDepth =
                                                                        sortedTree.length >
                                                                        0
                                                                            ? Math.min(
                                                                                  ...sortedTree.map(
                                                                                      (
                                                                                          n,
                                                                                      ) =>
                                                                                          n.depth ??
                                                                                          1,
                                                                                  ),
                                                                              )
                                                                            : 1;
                                                                    const relativeDepth =
                                                                        node.depth -
                                                                        minDepth;
                                                                    const isTopLevel =
                                                                        relativeDepth ===
                                                                        0;

                                                                    return (
                                                                        <DraggableTreeNode
                                                                            key={`${node.requirement_id}-${node.parent_id || 'root'}-${index}`}
                                                                            node={node}
                                                                            requirement={
                                                                                requirement
                                                                            }
                                                                            isTopLevel={
                                                                                isTopLevel
                                                                            }
                                                                            relativeDepth={
                                                                                relativeDepth
                                                                            }
                                                                            orgId={orgId}
                                                                            visibleTree={
                                                                                visibleTree
                                                                            }
                                                                            collapsedNodes={
                                                                                collapsedNodes
                                                                            }
                                                                            activeId={
                                                                                activeId
                                                                            }
                                                                            overId={
                                                                                overId
                                                                            }
                                                                            onToggleCollapse={
                                                                                toggleNodeCollapse
                                                                            }
                                                                            onDeleteRelationship={
                                                                                handleDeleteRelationship
                                                                            }
                                                                        />
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-12 text-muted-foreground">
                                                            <Network className="h-12 w-12 mx-auto mb-4" />
                                                            <p className="font-medium">
                                                                No hierarchy found
                                                            </p>
                                                            <p className="text-sm">
                                                                Create some relationships
                                                                to see the tree structure
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Available Requirements (40%) */}
                                            <div className="w-[40%] flex flex-col border-l pl-4">
                                                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                                                    Available Requirements
                                                </h3>

                                                {/* Search */}
                                                <div className="mb-3">
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="Search requirements..."
                                                            value={searchTerm}
                                                            onChange={(e) =>
                                                                setSearchTerm(
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="pl-9 h-9 text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Filter */}
                                                <div className="mb-3">
                                                    <Select
                                                        value={reqFilter}
                                                        onValueChange={(value) =>
                                                            setReqFilter(
                                                                value as
                                                                    | 'all'
                                                                    | 'orphans'
                                                                    | 'linked',
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="h-9 text-sm">
                                                            <SelectValue placeholder="Filter" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">
                                                                All Requirements
                                                            </SelectItem>
                                                            <SelectItem value="orphans">
                                                                Orphans Only
                                                            </SelectItem>
                                                            <SelectItem value="linked">
                                                                Already Linked
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Requirements List */}
                                                <div className="flex-1 overflow-y-auto space-y-2">
                                                    {requirementsLoading ? (
                                                        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                                                            Loading requirements...
                                                        </div>
                                                    ) : filteredRequirements &&
                                                      filteredRequirements.length > 0 ? (
                                                        filteredRequirements
                                                            .filter((req) => {
                                                                // Check if requirement has real relationships (depth > 0)
                                                                // depth=0 is self-reference, meaning orphan
                                                                const hasRealRelationships =
                                                                    (
                                                                        requirementTree as unknown as TreeNode[]
                                                                    )?.some(
                                                                        (n) =>
                                                                            n.requirement_id ===
                                                                                req.id &&
                                                                            n.depth > 0,
                                                                    );
                                                                if (
                                                                    reqFilter ===
                                                                    'orphans'
                                                                )
                                                                    return !hasRealRelationships;
                                                                if (
                                                                    reqFilter === 'linked'
                                                                )
                                                                    return hasRealRelationships;
                                                                return true; // 'all'
                                                            })
                                                            .map((req) => {
                                                                // Check if requirement has real relationships (depth > 0)
                                                                const hasRealRelationships =
                                                                    (
                                                                        requirementTree as unknown as TreeNode[]
                                                                    )?.some(
                                                                        (n) =>
                                                                            n.requirement_id ===
                                                                                req.id &&
                                                                            n.depth > 0,
                                                                    );
                                                                const isOrphan =
                                                                    !hasRealRelationships;

                                                                return (
                                                                    <DraggableRequirementCard
                                                                        key={req.id}
                                                                        requirement={req}
                                                                        inTree={inTree}
                                                                        isOrphan={
                                                                            isOrphan
                                                                        }
                                                                        activeId={
                                                                            activeId
                                                                        }
                                                                        overId={overId}
                                                                    />
                                                                );
                                                            })
                                                    ) : (
                                                        <div className="text-center py-8 text-muted-foreground text-sm">
                                                            <p>No requirements found</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

<<<<<<< HEAD
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

                {/* DragOverlay - Shows preview of dragged item that follows cursor */}
                <DragOverlay>
                    {activeId
                        ? (() => {
                              // Find if it's a tree node or available requirement
                              const treeNode = visibleTree.find(
                                  (n) => n.requirement_id === activeId,
                              );
                              const requirement = requirements?.find(
                                  (r) => r.id === activeId,
                              );

                              if (treeNode && requirement) {
                                  // Dragging from tree
                                  return (
                                      <div className="opacity-90 shadow-2xl border-2 border-primary rounded-lg bg-background p-4 cursor-grabbing max-w-md">
                                          <div className="flex items-center gap-2 mb-2">
                                              <GripVertical className="h-5 w-5 text-primary" />
                                              <Badge
                                                  variant="outline"
                                                  className="text-xs font-mono"
                                              >
                                                  {requirement.external_id ||
                                                      requirement.id.slice(0, 8)}
                                              </Badge>
                                              <Badge
                                                  variant="secondary"
                                                  className="text-xs"
                                              >
                                                  Tree Node
                                              </Badge>
                                          </div>
                                          <h4 className="text-sm font-semibold line-clamp-2">
                                              {treeNode.title}
                                          </h4>
                                          {requirement.description && (
                                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                  {requirement.description}
                                              </p>
                                          )}
                                      </div>
                                  );
                              } else if (requirement) {
                                  // Dragging from available requirements
                                  return (
                                      <div className="opacity-90 shadow-2xl border-2 border-primary rounded-lg bg-background p-3 cursor-grabbing max-w-md">
                                          <div className="flex items-start gap-2">
                                              <GripVertical className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                              <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                      <Badge
                                                          variant="outline"
                                                          className="text-xs font-mono"
                                                      >
                                                          {requirement.external_id ||
                                                              requirement.id.slice(0, 8)}
                                                      </Badge>
                                                      <Badge
                                                          variant="secondary"
                                                          className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                                                      >
                                                          🆓 Available
                                                      </Badge>
                                                  </div>
                                                  <h4 className="text-sm font-medium line-clamp-1 mb-1">
                                                      {requirement.name}
                                                  </h4>
                                                  {requirement.description && (
                                                      <p className="text-xs text-muted-foreground line-clamp-2">
                                                          {requirement.description}
                                                      </p>
                                                  )}
                                              </div>
                                          </div>
                                      </div>
                                  );
                              }
                              return null;
                          })()
                        : null}
                </DragOverlay>
            </DndContext>
        </LayoutView>
    );
}
