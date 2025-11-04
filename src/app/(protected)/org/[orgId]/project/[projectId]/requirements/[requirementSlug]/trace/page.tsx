'use client';

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { Check, Network, Plus, Search, Trash2, Trash } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import {
    useCreateTraceLinks,
    useDeleteTraceLink,
} from '@/hooks/mutations/useTraceLinkMutations';
import {
    useDocumentRequirements,
    useRequirement,
    useRequirementsByIds,
} from '@/hooks/queries/useRequirement';
// import relationship hooks
import {
    useCreateRelationship,
    useDeleteRelationship,
    useRequirementAncestors,
    useRequirementDescendants,
    useRequirementTree,
} from '@/hooks/queries/useRequirementRelationships';
import type { RequirementTreeNode } from '@/hooks/queries/useRequirementRelationships';
import { useReverseTraceLinks, useTraceLinks } from '@/hooks/queries/useTraceability';
import { useUser } from '@/lib/providers/user.provider';

type TraceRelationship = 'parent_of' | 'child_of';

type SelectedRequirement = {
    id: string;
    name: string;
    description: string | null;
    external_id?: string | null;
    relationship: TraceRelationship;
};

export default function TracePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const { profile } = useUser();

    const [isOpen, setIsOpen] = useState(false);
    const [selectedRequirements, setSelectedRequirements] = useState<
        SelectedRequirement[]
    >([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    const requirementId = params.requirementSlug as string;
    const projectId = params.projectId as string;

    // Get documentId from URL query parameter
    const documentId = searchParams.get('documentId') || '';

    const { data: requirements, isLoading: isLoadingRequirements } =
        useDocumentRequirements(documentId);
    const { data: outgoingLinks } = useTraceLinks(requirementId, 'requirement');
    const { data: incomingLinks } = useReverseTraceLinks(requirementId, 'requirement');

    // Main requirement hooks
    const {
        data: currentRequirement,
        isLoading: isLoadingCurrentRequirement,
        refetch: refetchCurrentRequirement,
    } = useRequirement(requirementId);
    const {
        data: requirementAncestors,
        isLoading: isLoadingAncestors,
        refetch: refetchAncestors,
    } = useRequirementAncestors(requirementId);
    const {
        data: requirementDescendants,
        isLoading: isLoadingDescendants,
        refetch: refetchDescendants,
    } = useRequirementDescendants(requirementId);
    const { data: requirementTree, isLoading: isLoadingTree } =
        useRequirementTree(projectId);

    // Extract requirement IDs from trace links
    const linkedRequirementIds = useMemo(() => {
        const sourceIds = incomingLinks?.map((link) => link.source_id) || [];
        const targetIds = outgoingLinks?.map((link) => link.target_id) || [];
        return [...sourceIds, ...targetIds];
    }, [incomingLinks, outgoingLinks]);

    // Fetch the actual requirements for the trace links
    const { data: linkedRequirements, isLoading: _isLoadingLinkedRequirements } =
        useRequirementsByIds(linkedRequirementIds);

    const createTraceLinksMutation = useCreateTraceLinks();
    const deleteTraceLinkMutation = useDeleteTraceLink();

    // add relationship hooks and state
    const createRelationshipMutation = useCreateRelationship();
    const deleteRelationshipMutation = useDeleteRelationship();

    // state for managing parent/child relationship dialogs
    const [isAddParentOpen, setIsAddParentOpen] = useState(false);
    const [isAddChildOpen, setIsAddChildOpen] = useState(false);
    const [isAddTestCaseOpen, setIsAddTestCaseOpen] = useState(false);

    // state for selected requirements in relationship dialogs
    const [selectedParentRequirement, setSelectedParentRequirement] =
        useState<SelectedRequirement | null>(null);
    const [selectedChildRequirement, setSelectedChildRequirement] =
        useState<SelectedRequirement | null>(null);
    const [selectedTestCase, setSelectedTestCase] = useState<any | null>(null);

    // state for search in parent/child dialogs
    const [parentSearchQuery, setParentSearchQuery] = useState('');
    const [childSearchQuery, setChildSearchQuery] = useState('');

    // Filter out requirements that already have trace links or are the current requirement
    const availableRequirements =
        requirements?.filter((req) => {
            if (req.id === requirementId) return false;

            // Check if this requirement is already linked (either as source or target)
            const isSourceInOutgoing = outgoingLinks?.some(
                (link) => link.target_id === req.id,
            );
            const isTargetInIncoming = incomingLinks?.some(
                (link) => link.source_id === req.id,
            );

            // Filter by search query if present
            const matchesSearch =
                searchQuery === '' ||
                req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (req.description &&
                    req.description.toLowerCase().includes(searchQuery.toLowerCase()));

            return !isSourceInOutgoing && !isTargetInIncoming && matchesSearch;
        }) || [];

    const handleAddRequirement = (requirement: SelectedRequirement) => {
        setSelectedRequirements([...selectedRequirements, requirement]);
    };

    const handleRemoveRequirement = (id: string) => {
        setSelectedRequirements(selectedRequirements.filter((req) => req.id !== id));
    };

    const handleDeleteTraceLink = (id: string) => {
        if (!profile) return;

        deleteTraceLinkMutation.mutate(
            {
                id,
                deletedBy: profile.id,
            },
            {
                onSuccess: () => {
                    toast({
                        title: 'Trace link deleted',
                        description: 'The trace link has been successfully deleted.',
                        variant: 'default',
                    });
                },
                onError: (error) => {
                    toast({
                        title: 'Failed to delete trace link',
                        description: error.message,
                        variant: 'destructive',
                    });
                },
            },
        );
    };

    const handleCreateTraceLinks = async () => {
        try {
            const traceLinks = selectedRequirements.map((req) => {
                if (req.relationship === 'parent_of') {
                    return {
                        source_id: requirementId,
                        source_type: 'requirement' as const,
                        target_id: req.id,
                        target_type: 'requirement' as const,
                        link_type: 'parent_of' as const,
                        created_by: profile?.id,
                        updated_by: profile?.id,
                    };
                } else {
                    // child_of
                    return {
                        source_id: req.id,
                        source_type: 'requirement' as const,
                        target_id: requirementId,
                        target_type: 'requirement' as const,
                        link_type: 'child_of' as const,
                        created_by: profile?.id,
                        updated_by: profile?.id,
                    };
                }
            });

            await createTraceLinksMutation.mutateAsync(traceLinks);

            toast({
                title: 'Success',
                description: `Created ${traceLinks.length} trace links`,
                variant: 'default',
            });

            setSelectedRequirements([]);
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to create trace links', error);
            toast({
                title: 'Error',
                description: 'Failed to create trace links',
                variant: 'destructive',
            });
        }
    };

    const handleAddParent = async () => {
        if (!selectedParentRequirement || !profile) {
            toast({
                title: 'Error',
                description: 'Please select a parent requirement',
                variant: 'destructive',
            });
            return;
        }

        try {
            // ancestorId = parent UUID, descendantId = current requirement UUID
            await createRelationshipMutation.mutateAsync({
                ancestorId: selectedParentRequirement.id,
                descendantId: requirementId,
            });

            // Refetch data to update the hierarchy immediately
            await Promise.all([
                refetchAncestors(),
                refetchDescendants(),
                refetchCurrentRequirement(),
            ]);
            // Refetch full requirement data after a short delay to ensure IDs are updated
            setTimeout(async () => {
                await Promise.all([
                    refetchAncestors(),
                    refetchDescendants(),
                    refetchAncestorRequirements(),
                    refetchDescendantRequirements(),
                ]);
            }, 100);

            toast({
                title: 'Success',
                description: `Added ${selectedParentRequirement.name} as parent requirement`,
                variant: 'default',
            });

            setSelectedParentRequirement(null);
            setIsAddParentOpen(false);
            setParentSearchQuery('');
        } catch (error) {
            console.error('Failed to create parent relationship', error);
            console.error('Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            });

            toast({
                title: 'Error',
                description: `Failed to create parent relationship. Please check the console for details.`,
                variant: 'destructive',
            });
        }
    };

    const handleAddChild = async () => {
        if (!selectedChildRequirement || !profile) {
            toast({
                title: 'Error',
                description: 'Please select a child requirement',
                variant: 'destructive',
            });
            return;
        }

        try {
            // ancestorId = current requirement UUID, descendantId = child UUID
            await createRelationshipMutation.mutateAsync({
                ancestorId: requirementId, // UUID from requirements.id
                descendantId: selectedChildRequirement.id, // UUID from requirements.id
            });

            // Refetch data to update the hierarchy immediately
            await Promise.all([
                refetchDescendants(),
                refetchAncestors(),
                refetchCurrentRequirement(),
            ]);

            toast({
                title: 'Success',
                description: `Added ${selectedChildRequirement.name} as child requirement`,
                variant: 'default',
            });

            setSelectedChildRequirement(null);
            setIsAddChildOpen(false);
            setChildSearchQuery('');
        } catch (error) {
            console.error('Failed to create child relationship', error);
            console.error('Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            });

            toast({
                title: 'Error',
                description: `Failed to create child relationship. Please check the console for details.`,
                variant: 'destructive',
            });
        }
    };

    // test case button functionality
    const handleAddTestCase = async () => {
        if (!selectedTestCase || !profile) {
            toast({
                title: 'Error',
                description: 'Please select a test case',
                variant: 'destructive',
            });
            return;
        }

        try {
            // Create trace link between requirement and test case
            // Note: Using 'relates_to' as test_case entity type is not yet supported
            await createTraceLinksMutation.mutateAsync([
                {
                    source_id: requirementId,
                    source_type: 'requirement' as const,
                    target_id: selectedTestCase.id,
                    target_type: 'requirement' as const, // MOCK DATA: Using requirement as placeholder - replace when test_case entity type is supported
                    link_type: 'relates_to' as const,
                    created_by: profile.id,
                    updated_by: profile.id,
                },
            ]);

            toast({
                title: 'Success',
                description: `Added ${selectedTestCase.name} as test case`,
                variant: 'default',
            });

            setSelectedTestCase(null);
            setIsAddTestCaseOpen(false);
        } catch (error) {
            console.error('Failed to create test case relationship', error);
            toast({
                title: 'Error',
                description: 'Failed to create test case relationship',
                variant: 'destructive',
            });
        }
    };

    // mock data for ui implementation
    // define the relationship display type to avoid typescript errors
    type RelationshipDisplay = {
        id: string;
        sourceId: string;
        sourceName: string;
        sourceDescription?: string;
        targetId: string;
        targetName: string;
        targetDescription?: string;
        relationshipType: 'parent-child' | 'interface';
        direction: 'incoming' | 'outgoing' | 'test';
    };

    // Real test cases from trace links (when test case entity type is supported)
    const realTestCases = useMemo(() => {
        // Filter trace links that are test cases
        // MOCK DATA: Currently placeholder - replace with real test case data when available
        return [
            {
                id: '-',
                name: '-',
                title: '-',
                description: '-',
                type: '-',
                status: '-',
                requirements: '-',
                lastExecution: '-',
                duration: '-',
                relationship: 'tests' as const,
            },
        ];
    }, [outgoingLinks, incomingLinks]);

    // combine real requirements data w mock test cases for display
    const allRelationships: RelationshipDisplay[] = [
        // incoming relationships (parents)
        ...(incomingLinks?.map((link) => {
            const requirement = linkedRequirements?.find(
                (req) => req.id === link.source_id,
            );
            return {
                id: link.id,
                sourceId: link.source_id,
                sourceName: requirement?.external_id || requirement?.name || 'Loading...',
                sourceDescription: requirement?.description || undefined,
                targetId: requirementId,
                targetName: 'Current Requirement',
                targetDescription: undefined,
                relationshipType: 'parent-child' as const,
                direction: 'incoming' as const,
            };
        }) || []),
        // outgoing relationships (children)
        ...(outgoingLinks?.map((link) => {
            const requirement = linkedRequirements?.find(
                (req) => req.id === link.target_id,
            );
            return {
                id: link.id,
                sourceId: requirementId,
                sourceName: 'Current Requirement',
                sourceDescription: undefined,
                targetId: link.target_id,
                targetName: requirement?.external_id || requirement?.name || 'Loading...',
                targetDescription: requirement?.description || undefined,
                relationshipType: 'parent-child' as const,
                direction: 'outgoing' as const,
            };
        }) || []),
        // mock test case relationships
        ...realTestCases.map((tc) => ({
            id: tc.id,
            sourceId: requirementId,
            sourceName: 'Current Requirement',
            sourceDescription: undefined,
            targetId: tc.id,
            targetName: tc.name,
            targetDescription: tc.description,
            relationshipType: 'interface' as const,
            direction: 'test' as const,
        })),
    ];

    // Extract ancestor and descendant IDs to fetch full requirement data
    const ancestorIds = useMemo(() => {
        return (requirementAncestors || []).map((a) => a.requirementId);
    }, [requirementAncestors]);

    const descendantIds = useMemo(() => {
        return (requirementDescendants || []).map((d) => d.requirementId);
    }, [requirementDescendants]);

    // Fetch full requirement data for ancestors and descendants to get external_id
    const { data: ancestorRequirements, refetch: refetchAncestorRequirements } =
        useRequirementsByIds(ancestorIds);
    const { data: descendantRequirements, refetch: refetchDescendantRequirements } =
        useRequirementsByIds(descendantIds);

    const realParentRequirements = useMemo(() => {
        if (!requirementAncestors) return [];
        // Maps RequirementNode[] from API to UI format with full requirement data
        return requirementAncestors.map((ancestor) => {
            const fullReq = ancestorRequirements?.find(
                (r) => r.id === ancestor.requirementId,
            );
            return {
                id: ancestor.requirementId,
                name: ancestor.title,
                external_id: fullReq?.external_id || null,
                description: fullReq?.description || '',
                type: fullReq?.type || 'Requirement',
            };
        });
    }, [requirementAncestors, ancestorRequirements]);

    const realChildRequirements = useMemo(() => {
        if (!requirementDescendants) return [];
        // Only show DIRECT children (depth === 1, directParent === true)
        // Exclude grandchildren and deeper descendants
        const directChildren = requirementDescendants.filter(
            (desc) => desc.depth === 1 && desc.directParent,
        );

        // Fallback: if no direct children with directParent flag, try all at depth 1
        const filteredDescendants =
            directChildren.length > 0
                ? directChildren
                : requirementDescendants.filter((desc) => desc.depth === 1);

        // Maps RequirementNode[] from API to UI format with full requirement data
        return filteredDescendants.map((descendant) => {
            const fullReq = descendantRequirements?.find(
                (r) => r.id === descendant.requirementId,
            );
            return {
                id: descendant.requirementId,
                name: descendant.title,
                external_id: fullReq?.external_id || null,
                description: fullReq?.description || '',
                type: fullReq?.type || 'Requirement',
            };
        });
    }, [requirementDescendants, descendantRequirements]);

    // Build hierarchy from real data: parents above, current centered, children below
    // Uses parent_id from requirementTree to build accurate parent-child relationships
    const realHierarchy = useMemo(() => {
        if (!currentRequirement) {
            return null;
        }

        // Build recursive tree based ONLY on parent_id relationships
        // ensures each requirement appears only under its immediate parent
        const buildChildTree = (
            parentId: string,
            allTreeNodes: RequirementTreeNode[],
            allRequirements: any[],
        ): any[] => {
            // Find all nodes where parent_id matches the current parentId
            const childNodes = allTreeNodes.filter((node) => node.parent_id === parentId);

            return childNodes.map((treeNode) => {
                // Find full requirement data for this child
                const fullReq = allRequirements.find(
                    (r) => r.id === treeNode.requirement_id,
                );
                const externalId = fullReq?.external_id || '';
                const displayName = externalId
                    ? `${externalId} ${treeNode.title}`
                    : treeNode.title;

                // Recursively find children of this child (grandchildren)
                // This ensures grandchildren only appear under their direct parent
                const grandchildren = buildChildTree(
                    treeNode.requirement_id,
                    allTreeNodes,
                    allRequirements,
                );

                return {
                    id: treeNode.requirement_id,
                    name: displayName,
                    type: fullReq?.type || '-',
                    external_id: externalId,
                    isCurrent: false,
                    children: grandchildren,
                };
            });
        };

        // Build parent hierarchy (ancestors) with external_id
        const parents = (requirementAncestors || []).map((ancestor) => {
            const fullReq = ancestorRequirements?.find(
                (r) => r.id === ancestor.requirementId,
            );
            const externalId = fullReq?.external_id || '';
            const displayName = externalId
                ? `${externalId} ${ancestor.title}`
                : ancestor.title;
            return {
                id: ancestor.requirementId,
                name: displayName,
                type: fullReq?.type || '-',
                external_id: externalId,
                isCurrent: false,
                children: [],
            };
        });

        // Current requirement (centered/highlighted)
        const currentExternalId = currentRequirement.external_id || '';
        const currentDisplayName = currentExternalId
            ? `${currentExternalId} ${currentRequirement.name || '-'}`
            : currentRequirement.name || '-';

        // Build children tree using parent_id from requirementTree
        // ensures accurate parent-child relationships based on parentId
        let children: any[] = [];

        // Combine all requirement data sources for lookup
        const allReqs = [
            ...(descendantRequirements || []),
            ...(ancestorRequirements || []),
            currentRequirement,
        ];

        if (requirementTree && requirementTree.length > 0) {
            // Find all direct children of current requirement using parent_id
            const directChildNodes = requirementTree.filter(
                (node) => node.parent_id === currentRequirement.id,
            );

            console.log('[Hierarchy] Using requirementTree to find children');
            console.log(
                '[Hierarchy] requirementTree total nodes:',
                requirementTree.length,
            );
            console.log('[Hierarchy] directChildNodes found:', directChildNodes.length);
            console.log('[Hierarchy] directChildNodes:', directChildNodes);

            // Build children tree recursively based on parent_id
            children = directChildNodes.map((childNode) => {
                const fullReq = allReqs.find((r) => r.id === childNode.requirement_id);
                const externalId = fullReq?.external_id || '';
                const displayName = externalId
                    ? `${externalId} ${childNode.title}`
                    : childNode.title;

                // Recursively find grandchildren using parent_id
                const grandchildren = buildChildTree(
                    childNode.requirement_id,
                    requirementTree,
                    allReqs,
                );

                return {
                    id: childNode.requirement_id,
                    name: displayName,
                    type: fullReq?.type || '-',
                    external_id: externalId,
                    isCurrent: false,
                    children: grandchildren,
                };
            });
        }

        // if requirementTree doesn't have the relationships
        if (
            children.length === 0 &&
            requirementDescendants &&
            requirementDescendants.length > 0
        ) {
            console.log('[Hierarchy] Falling back to requirementDescendants');
            console.log('[Hierarchy] requirementDescendants:', requirementDescendants);

            // Filter for direct children (depth === 1, directParent === true)
            let directChildren = (requirementDescendants || []).filter(
                (desc) => desc.depth === 1 && desc.directParent === true,
            );

            if (directChildren.length === 0) {
                directChildren = (requirementDescendants || []).filter(
                    (desc) => desc.depth === 1,
                );
            }

            if (directChildren.length === 0 && requirementDescendants.length > 0) {
                console.warn(
                    '[Hierarchy] No direct children found, using all descendants as fallback',
                );
                directChildren = requirementDescendants;
            }

            console.log(
                '[Hierarchy] directChildren from descendants:',
                directChildren.length,
            );
            console.log('[Hierarchy] directChildren:', directChildren);

            // Build children from descendants
            children = directChildren.map((child) => {
                const fullReq = descendantRequirements?.find(
                    (r) => r.id === child.requirementId,
                );
                const externalId = fullReq?.external_id || '';
                const displayName = externalId
                    ? `${externalId} ${child.title}`
                    : child.title;

                // Try to build grandchildren if we have requirementTree
                let grandchildren: any[] = [];
                if (requirementTree && requirementTree.length > 0) {
                    grandchildren = buildChildTree(
                        child.requirementId,
                        requirementTree,
                        allReqs,
                    );
                }

                return {
                    id: child.requirementId,
                    name: displayName,
                    type: fullReq?.type || '-',
                    external_id: externalId,
                    isCurrent: false,
                    children: grandchildren,
                };
            });
        }

        const current = {
            id: currentRequirement.id,
            name: currentDisplayName,
            type: currentRequirement.type || '-',
            external_id: currentExternalId,
            isCurrent: true,
            children: children,
        };

        // Check if we have relationships (parents OR children)
        const hasRelationships = parents.length > 0 || current.children.length > 0;

        // if we have requirementDescendants or requirementAncestors
        const hasAncestors = requirementAncestors && requirementAncestors.length > 0;
        const hasDescendants =
            requirementDescendants && requirementDescendants.length > 0;

        // If hasRelationships is false but we have ancestors/descendants data, force hasRelationships to true
        // handles cases where the tree structure might not match the actual relationships
        const finalHasRelationships = hasRelationships || hasAncestors || hasDescendants;

        if (!hasRelationships && (hasAncestors || hasDescendants)) {
            console.warn(
                '[Hierarchy] WARNING: hasRelationships was false but we have ancestors/descendants data!',
            );
            console.warn(
                '[Hierarchy] Forcing hasRelationships to true based on actual data.',
            );
        }

        // Always return consistent structure
        return {
            parents,
            current,
            hasRelationships: finalHasRelationships,
        };
    }, [
        currentRequirement,
        requirementAncestors,
        requirementDescendants,
        ancestorRequirements,
        descendantRequirements,
        requirementTree,
    ]);

    const renderHierarchyNode = (node: any, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);

        const toggleExpanded = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (hasChildren) {
                setExpandedNodes((prev) => {
                    const newSet = new Set(prev);
                    if (newSet.has(node.id)) {
                        newSet.delete(node.id);
                    } else {
                        newSet.add(node.id);
                    }
                    return newSet;
                });
            }
        };

        const handleNodeClick = () => {
            // Navigate to the requirement's trace page if it's not the current requirement
            if (node.id !== requirementId) {
                const orgId = params.orgId as string;
                const projectId = params.projectId as string;
                const documentId = searchParams.get('documentId') || '';
                const traceUrl = `/org/${orgId}/project/${projectId}/requirements/${node.id}/trace${documentId ? `?documentId=${documentId}` : ''}`;
                router.push(traceUrl);
            }
        };

        // Calculate indentation based on level
        const indentLevel = level * 24;

        return (
            <div key={node.id}>
                <div
                    className={`flex items-center gap-2 py-2 px-3 hover:bg-primary/10 transition-colors cursor-pointer ${
                        node.isCurrent ? 'bg-primary/20 border-l-2 border-primary' : ''
                    }`}
                    style={{ marginLeft: `${indentLevel}px` }}
                    onClick={handleNodeClick}
                >
                    {/* tree line connector - gray */}
                    {level > 0 && (
                        <div className="flex items-center">
                            <div className="w-4 h-0.5 bg-muted-foreground"></div>
                        </div>
                    )}

                    {/* expand/collapse icon */}
                    {hasChildren && (
                        <div
                            className="text-muted-foreground transition-transform duration-200"
                            onClick={toggleExpanded}
                            style={{
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M6 4L10 8L6 12"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    )}

                    <span
                        className={`font-medium ${node.isCurrent ? 'text-primary' : 'text-foreground'}`}
                    >
                        {node.name}
                    </span>
                    <span className="text-xs text-muted-foreground">({node.type})</span>
                </div>

                {/* render children with proper indentation */}
                {hasChildren && isExpanded && (
                    <div className="border-l border-border ml-3">
                        {node.children.map((child: any) => (
                            <div key={child.id}>
                                {renderHierarchyNode(child, level + 1)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div
                className="container mx-auto px-8 py-8 space-y-6"
                style={{ paddingLeft: '4rem', paddingRight: '2rem' }}
            >
                {/* header section */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Trace Links
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Manage trace links for this requirement.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {/* network diagram button */}
                        <Link
                            href={`/org/${params.orgId}/project/${params.projectId}/requirements/${params.requirementSlug}/trace/diagram`}
                            passHref
                        >
                            <Button
                                variant="outline"
                                className="bg-transparent border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                                style={{ borderRadius: 0 }}
                            >
                                <Network className="h-4 w-4 mr-2" />
                                View Diagram
                            </Button>
                        </Link>

                        {/* manage traces button */}
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    style={{ borderRadius: 0 }}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Manage Traces
                                </Button>
                            </DialogTrigger>
                            <DialogContent
                                className="sm:max-w-[600px] max-h-[80vh] bg-card border-border text-card-foreground"
                                style={{ borderRadius: 0 }}
                            >
                                <DialogHeader>
                                    <DialogTitle className="text-card-foreground">
                                        Create Trace Links
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                        Select requirements to create trace links with
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-medium text-card-foreground">
                                                Available Requirements
                                            </h4>
                                            <div className="relative w-[200px]">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search requirements..."
                                                    className="pl-8 h-9 bg-background border-border text-foreground placeholder-muted-foreground"
                                                    style={{ borderRadius: 0 }}
                                                    value={searchQuery}
                                                    onChange={(e) =>
                                                        setSearchQuery(e.target.value)
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {isLoadingRequirements ? (
                                            <div className="text-center py-4 text-muted-foreground">
                                                Loading requirements...
                                            </div>
                                        ) : availableRequirements.length === 0 ? (
                                            <div className="text-center py-4 text-muted-foreground">
                                                No available requirements to link
                                            </div>
                                        ) : (
                                            <div className="max-h-[200px] overflow-y-auto bg-background p-2">
                                                {availableRequirements.map((req) => {
                                                    const isSelected =
                                                        selectedRequirements.some(
                                                            (selected) =>
                                                                selected.id === req.id,
                                                        );
                                                    return (
                                                        <div
                                                            key={req.id}
                                                            className="p-3 flex justify-between items-start hover:bg-accent border-b border-border last:border-b-0"
                                                        >
                                                            <div className="space-y-1 flex-1 min-w-0 mr-3">
                                                                <div className="font-medium text-foreground truncate">
                                                                    {req.name}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground line-clamp-2">
                                                                    {req.description ||
                                                                        'No description'}
                                                                </div>
                                                            </div>
                                                            {isSelected ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                                                    onClick={() =>
                                                                        handleRemoveRequirement(
                                                                            req.id,
                                                                        )
                                                                    }
                                                                    style={{
                                                                        borderRadius: 0,
                                                                    }}
                                                                >
                                                                    <Check
                                                                        size={16}
                                                                        className="mr-1"
                                                                    />{' '}
                                                                    Added
                                                                </Button>
                                                            ) : (
                                                                <Select
                                                                    onValueChange={(
                                                                        value: TraceRelationship,
                                                                    ) => {
                                                                        handleAddRequirement(
                                                                            {
                                                                                id: req.id,
                                                                                name: req.name,
                                                                                description:
                                                                                    req.description,
                                                                                external_id:
                                                                                    req.external_id,
                                                                                relationship:
                                                                                    value,
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    <SelectTrigger
                                                                        className="w-[120px] bg-background border-border text-foreground"
                                                                        style={{
                                                                            borderRadius: 0,
                                                                        }}
                                                                    >
                                                                        <SelectValue placeholder="Relation" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-card border-border">
                                                                        <SelectItem
                                                                            value="parent_of"
                                                                            className="text-card-foreground hover:bg-accent"
                                                                        >
                                                                            Parent of
                                                                        </SelectItem>
                                                                        <SelectItem
                                                                            value="child_of"
                                                                            className="text-card-foreground hover:bg-accent"
                                                                        >
                                                                            Child of
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {selectedRequirements.length > 0 && (
                                        <div className="space-y-2 mt-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-medium text-card-foreground">
                                                    Selected Requirements
                                                </h4>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground hover:text-foreground"
                                                    onClick={() =>
                                                        setSelectedRequirements([])
                                                    }
                                                    style={{ borderRadius: 0 }}
                                                >
                                                    Clear All
                                                </Button>
                                            </div>
                                            <div className="max-h-[200px] overflow-y-auto bg-background">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="border-border">
                                                            <TableHead className="w-[120px] text-muted-foreground">
                                                                Relationship
                                                            </TableHead>
                                                            <TableHead className="w-[100px] text-muted-foreground">
                                                                ID
                                                            </TableHead>
                                                            <TableHead className="text-muted-foreground">
                                                                Description
                                                            </TableHead>
                                                            <TableHead className="w-[50px]"></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {selectedRequirements.map(
                                                            (req) => (
                                                                <TableRow
                                                                    key={req.id}
                                                                    className="border-border"
                                                                >
                                                                    <TableCell className="text-foreground">
                                                                        {req.relationship ===
                                                                        'parent_of'
                                                                            ? 'Parent of'
                                                                            : 'Child of'}
                                                                    </TableCell>
                                                                    <TableCell className="font-medium text-foreground">
                                                                        {req.external_id ||
                                                                            req.id.split(
                                                                                '-',
                                                                            )[1]}
                                                                    </TableCell>
                                                                    <TableCell className="text-muted-foreground">
                                                                        {req.name}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                                            onClick={() =>
                                                                                handleRemoveRequirement(
                                                                                    req.id,
                                                                                )
                                                                            }
                                                                            style={{
                                                                                borderRadius: 0,
                                                                            }}
                                                                        >
                                                                            <Trash2
                                                                                size={16}
                                                                            />
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ),
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsOpen(false)}
                                        className="bg-transparent border-border text-muted-foreground hover:bg-accent"
                                        style={{ borderRadius: 0 }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateTraceLinks}
                                        disabled={
                                            selectedRequirements.length === 0 ||
                                            createTraceLinksMutation.isPending
                                        }
                                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                                        style={{ borderRadius: 0 }}
                                    >
                                        {createTraceLinksMutation.isPending
                                            ? 'Creating...'
                                            : 'Create Trace Links'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* requirement hierarchy section */}
                <div className="bg-card border border-border mb-8">
                    <div className="p-4">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl"></span>
                            <h2 className="text-xl font-semibold text-card-foreground">
                                Relationship Hierarchy
                            </h2>
                        </div>
                        <div className="mt-4">
                            {isLoadingAncestors ||
                            isLoadingDescendants ||
                            isLoadingCurrentRequirement ? (
                                <p className="text-muted-foreground text-center py-4">
                                    Loading...
                                </p>
                            ) : !realHierarchy ? (
                                <p className="text-muted-foreground text-center py-4">
                                    Loading requirement...
                                </p>
                            ) : !realHierarchy.hasRelationships ? (
                                // Show only current requirement if no relationships
                                <div>
                                    {renderHierarchyNode(realHierarchy.current)}
                                    <p className="text-muted-foreground text-center mt-4 text-sm">
                                        No relationships found yet
                                    </p>
                                    {/* Debug info */}
                                    {process.env.NODE_ENV === 'development' && (
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            Debug: Ancestors:{' '}
                                            {requirementAncestors?.length || 0},
                                            Descendants:{' '}
                                            {requirementDescendants?.length || 0}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {/* Parents above (if any) */}
                                    {realHierarchy.parents.length > 0 && (
                                        <div className="space-y-1">
                                            {realHierarchy.parents.map((parent) => (
                                                <div key={parent.id}>
                                                    {renderHierarchyNode(parent)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Current requirement (centered/highlighted) */}
                                    {renderHierarchyNode(realHierarchy.current)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* requirement details section */}
                <div className="bg-card border border-border mb-8">
                    <div className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl"></span>
                                <div>
                                    <h2 className="text-xl font-semibold text-card-foreground">
                                        {currentRequirement?.name || '-'}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Requirement Details
                                    </p>
                                </div>
                            </div>
                            <span
                                className={`px-3 py-1 text-xs font-medium border ${
                                    currentRequirement?.status === 'approved'
                                        ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
                                        : currentRequirement?.status === 'rejected' ||
                                            currentRequirement?.status === 'deleted'
                                          ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                                          : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'
                                }`}
                            >
                                {currentRequirement?.status
                                    ? String(currentRequirement.status)
                                          .replaceAll('_', ' ')
                                          .replace(/\b\w/g, (c) => c.toUpperCase())
                                    : '-'}
                            </span>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                                        {currentRequirement?.external_id || '—'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                        Description
                                    </h3>
                                    <p className="text-foreground text-sm">
                                        {currentRequirement?.description || '-'}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                        Details
                                    </h3>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-foreground">
                                            Type:{' '}
                                            {currentRequirement?.type &&
                                            String(currentRequirement.type).trim()
                                                ? String(currentRequirement.type).trim()
                                                : '-'}
                                        </p>
                                        <p className="text-foreground">
                                            Status:{' '}
                                            {currentRequirement?.status
                                                ? String(currentRequirement.status)
                                                      .replaceAll('_', ' ')
                                                      .replace(/\b\w/g, (c) =>
                                                          c.toUpperCase(),
                                                      )
                                                : '-'}
                                        </p>
                                        <p className="text-foreground">
                                            Priority:{' '}
                                            {currentRequirement?.priority || '-'}
                                        </p>
                                        <p className="text-foreground">
                                            Source:{' '}
                                            {currentRequirement?.external_id || '-'}
                                        </p>
                                        <p className="text-foreground">
                                            Created:{' '}
                                            {currentRequirement?.created_at
                                                ? new Date(
                                                      currentRequirement.created_at,
                                                  ).toLocaleDateString()
                                                : '-'}
                                        </p>
                                        <p className="text-foreground">
                                            Updated:{' '}
                                            {currentRequirement?.updated_at
                                                ? new Date(
                                                      currentRequirement.updated_at,
                                                  ).toLocaleDateString()
                                                : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                        Rationale
                                    </h3>
                                    <p className="text-foreground text-sm">
                                        {(() => {
                                            const props: any =
                                                (currentRequirement as any)?.properties ||
                                                {};
                                            const raw =
                                                props.Rationale ?? props.rationale;
                                            if (!raw) return '-';
                                            if (typeof raw === 'string') return raw;
                                            if (typeof (raw as any)?.value === 'string')
                                                return (raw as any).value;
                                            if (Array.isArray(raw)) {
                                                const parts = raw
                                                    .map((r) =>
                                                        typeof r === 'string'
                                                            ? r
                                                            : typeof (r as any)?.value ===
                                                                'string'
                                                              ? (r as any).value
                                                              : '',
                                                    )
                                                    .filter(Boolean);
                                                return parts.length
                                                    ? parts.join(', ')
                                                    : '-';
                                            }
                                            if (Array.isArray((raw as any)?.value)) {
                                                const parts = (raw as any).value
                                                    .map((r: any) =>
                                                        typeof r === 'string'
                                                            ? r
                                                            : String(r),
                                                    )
                                                    .filter(Boolean);
                                                return parts.length
                                                    ? parts.join(', ')
                                                    : '-';
                                            }
                                            try {
                                                return String(raw);
                                            } catch {
                                                return '-';
                                            }
                                        })()}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                        Tags
                                    </h3>
                                    <div className="flex gap-2 flex-wrap">
                                        {(() => {
                                            const normalizeToStrings = (
                                                input: any,
                                            ): string[] => {
                                                if (!input) return [];
                                                if (Array.isArray(input)) {
                                                    return input
                                                        .flatMap((item) => {
                                                            if (typeof item === 'string')
                                                                return item.split(/[;,]/);
                                                            if (
                                                                typeof (item as any)
                                                                    ?.value === 'string'
                                                            )
                                                                return (
                                                                    (item as any)
                                                                        .value as string
                                                                ).split(/[;,]/);
                                                            return String(item).split(
                                                                /[;,]/,
                                                            );
                                                        })
                                                        .map((s) => s.trim())
                                                        .filter(Boolean);
                                                }
                                                if (typeof input === 'string')
                                                    return input
                                                        .split(/[;,]/)
                                                        .map((s) => s.trim())
                                                        .filter(Boolean);
                                                if (typeof input?.value === 'string')
                                                    return (input.value as string)
                                                        .split(/[;,]/)
                                                        .map((s) => s.trim())
                                                        .filter(Boolean);
                                                return [String(input)].filter(Boolean);
                                            };

                                            const rawTagsCol = (currentRequirement as any)
                                                ?.tags;
                                            const props: any =
                                                (currentRequirement as any)?.properties ||
                                                {};
                                            const rawTagsProp = props.Tags ?? props.tags;
                                            const tagsArray = [
                                                ...normalizeToStrings(rawTagsCol),
                                                ...normalizeToStrings(rawTagsProp),
                                            ];
                                            const unique = Array.from(new Set(tagsArray));
                                            return unique.length > 0 ? (
                                                unique.map(
                                                    (tag: string, index: number) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 bg-muted text-muted-foreground text-xs"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ),
                                                )
                                            ) : (
                                                <span className="text-muted-foreground text-sm">
                                                    -
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* parent and child requirements side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* parent requirements section */}
                    <div className="bg-card border border-border">
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl"></span>
                                    <h2 className="text-xl font-semibold text-card-foreground">
                                        Parent Requirements
                                    </h2>
                                </div>
                                <Dialog
                                    open={isAddParentOpen}
                                    onOpenChange={setIsAddParentOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-transparent border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                                            style={{ borderRadius: 0 }}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            ADD PARENT
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent
                                        className="sm:max-w-[500px] bg-card border-border text-card-foreground"
                                        style={{ borderRadius: 0 }}
                                    >
                                        <DialogHeader>
                                            <DialogTitle className="text-card-foreground">
                                                Add Parent Requirement
                                            </DialogTitle>
                                            <DialogDescription className="text-muted-foreground">
                                                Select a requirement to be the parent of
                                                the current requirement.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-card-foreground">
                                                    Available Requirements
                                                </h4>
                                                <Input
                                                    placeholder="Search requirements..."
                                                    value={parentSearchQuery}
                                                    onChange={(e) =>
                                                        setParentSearchQuery(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="bg-background border-border"
                                                />
                                                <div className="max-h-[300px] overflow-y-auto bg-background">
                                                    {requirements
                                                        ?.filter(
                                                            (req) =>
                                                                req.id !==
                                                                    requirementId &&
                                                                (parentSearchQuery ===
                                                                    '' ||
                                                                    req.name
                                                                        .toLowerCase()
                                                                        .includes(
                                                                            parentSearchQuery.toLowerCase(),
                                                                        ) ||
                                                                    (req.external_id &&
                                                                        req.external_id
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                parentSearchQuery.toLowerCase(),
                                                                            ))),
                                                        )
                                                        .map((req) => (
                                                            <div
                                                                key={req.id}
                                                                className={`p-3 flex justify-between items-start hover:bg-primary/10 cursor-pointer border-b border-border last:border-b-0 ${
                                                                    selectedParentRequirement?.id ===
                                                                    req.id
                                                                        ? 'bg-primary/20'
                                                                        : ''
                                                                }`}
                                                                onClick={() =>
                                                                    setSelectedParentRequirement(
                                                                        {
                                                                            id: req.id,
                                                                            name: req.name,
                                                                            description:
                                                                                req.description,
                                                                            external_id:
                                                                                req.external_id,
                                                                            relationship:
                                                                                'parent_of',
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                <div className="space-y-1">
                                                                    <div className="font-medium text-foreground">
                                                                        {req.external_id
                                                                            ? `${req.external_id} ${req.name}`
                                                                            : req.name}
                                                                    </div>
                                                                    <div className="text-sm text-muted-foreground">
                                                                        {req.description ||
                                                                            'No description'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    {requirements &&
                                                        requirements.filter(
                                                            (req) =>
                                                                req.id !==
                                                                    requirementId &&
                                                                (parentSearchQuery ===
                                                                    '' ||
                                                                    req.name
                                                                        .toLowerCase()
                                                                        .includes(
                                                                            parentSearchQuery.toLowerCase(),
                                                                        ) ||
                                                                    (req.external_id &&
                                                                        req.external_id
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                parentSearchQuery.toLowerCase(),
                                                                            ))),
                                                        ).length === 0 && (
                                                            <p className="text-muted-foreground text-center py-4">
                                                                No requirements found
                                                            </p>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIsAddParentOpen(false);
                                                    setParentSearchQuery('');
                                                    setSelectedParentRequirement(null);
                                                }}
                                                className="bg-transparent border-border text-muted-foreground hover:bg-accent"
                                                style={{ borderRadius: 0 }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleAddParent}
                                                disabled={
                                                    !selectedParentRequirement ||
                                                    createRelationshipMutation.isPending
                                                }
                                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                                                style={{ borderRadius: 0 }}
                                            >
                                                {createRelationshipMutation.isPending
                                                    ? 'Adding...'
                                                    : 'Add Parent'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="mt-4">
                                {isLoadingAncestors ? (
                                    <p className="text-muted-foreground text-center">
                                        Loading...
                                    </p>
                                ) : realParentRequirements.length > 0 ? (
                                    <div className="space-y-3">
                                        {realParentRequirements.map((req) => (
                                            <div
                                                key={req.id}
                                                className="flex items-center justify-between p-3 bg-background border border-border"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-foreground font-medium">
                                                        {req.external_id
                                                            ? `${req.external_id} ${req.name}`
                                                            : req.name}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {req.description}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ({req.type})
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        if (!profile) return;
                                                        if (!req.id || !requirementId) {
                                                            toast({
                                                                title: 'Error',
                                                                description:
                                                                    'Missing requirement IDs',
                                                                variant: 'destructive',
                                                            });
                                                            return;
                                                        }
                                                        deleteRelationshipMutation.mutate(
                                                            {
                                                                ancestorId: req.id,
                                                                descendantId:
                                                                    requirementId,
                                                            },
                                                            {
                                                                onSuccess: async () => {
                                                                    // Refetch data to update the hierarchy immediately
                                                                    await Promise.all([
                                                                        refetchAncestors(),
                                                                        refetchDescendants(),
                                                                        refetchCurrentRequirement(),
                                                                    ]);
                                                                    // Refetch full requirement data after a short delay
                                                                    setTimeout(
                                                                        async () => {
                                                                            await Promise.all(
                                                                                [
                                                                                    refetchAncestors(),
                                                                                    refetchDescendants(),
                                                                                    refetchAncestorRequirements(),
                                                                                    refetchDescendantRequirements(),
                                                                                ],
                                                                            );
                                                                        },
                                                                        100,
                                                                    );
                                                                    toast({
                                                                        title: 'Success',
                                                                        description:
                                                                            'Parent relationship deleted',
                                                                        variant:
                                                                            'default',
                                                                    });
                                                                },
                                                                onError: (error) => {
                                                                    toast({
                                                                        title: 'Error',
                                                                        description:
                                                                            error.message ||
                                                                            'Failed to delete relationship',
                                                                        variant:
                                                                            'destructive',
                                                                    });
                                                                },
                                                            },
                                                        );
                                                    }}
                                                    disabled={
                                                        deleteRelationshipMutation.isPending
                                                    }
                                                    className="text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                                                    style={{ borderRadius: 0 }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center">
                                        No parent requirements
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* child requirements section */}
                    <div className="bg-card border border-border">
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl"></span>
                                    <h2 className="text-xl font-semibold text-card-foreground">
                                        Child Requirements
                                    </h2>
                                </div>
                                <Dialog
                                    open={isAddChildOpen}
                                    onOpenChange={setIsAddChildOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-transparent border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                                            style={{ borderRadius: 0 }}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            ADD CHILD
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent
                                        className="sm:max-w-[500px] bg-card border-border text-card-foreground"
                                        style={{ borderRadius: 0 }}
                                    >
                                        <DialogHeader>
                                            <DialogTitle className="text-card-foreground">
                                                Add Child Requirement
                                            </DialogTitle>
                                            <DialogDescription className="text-muted-foreground">
                                                Select a requirement to be the child of
                                                the current requirement.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-card-foreground">
                                                    Available Requirements
                                                </h4>
                                                <Input
                                                    placeholder="Search requirements..."
                                                    value={childSearchQuery}
                                                    onChange={(e) =>
                                                        setChildSearchQuery(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="bg-background border-border"
                                                />
                                                <div className="max-h-[300px] overflow-y-auto bg-background">
                                                    {requirements
                                                        ?.filter(
                                                            (req) =>
                                                                req.id !==
                                                                    requirementId &&
                                                                (childSearchQuery ===
                                                                    '' ||
                                                                    req.name
                                                                        .toLowerCase()
                                                                        .includes(
                                                                            childSearchQuery.toLowerCase(),
                                                                        ) ||
                                                                    (req.external_id &&
                                                                        req.external_id
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                childSearchQuery.toLowerCase(),
                                                                            ))),
                                                        )
                                                        .map((req) => (
                                                            <div
                                                                key={req.id}
                                                                className={`p-3 flex justify-between items-start hover:bg-primary/10 cursor-pointer border-b border-border last:border-b-0 ${
                                                                    selectedChildRequirement?.id ===
                                                                    req.id
                                                                        ? 'bg-primary/20'
                                                                        : ''
                                                                }`}
                                                                onClick={() =>
                                                                    setSelectedChildRequirement(
                                                                        {
                                                                            id: req.id,
                                                                            name: req.name,
                                                                            description:
                                                                                req.description,
                                                                            external_id:
                                                                                req.external_id,
                                                                            relationship:
                                                                                'child_of',
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                <div className="space-y-1">
                                                                    <div className="font-medium text-foreground">
                                                                        {req.external_id
                                                                            ? `${req.external_id} ${req.name}`
                                                                            : req.name}
                                                                    </div>
                                                                    <div className="text-sm text-muted-foreground">
                                                                        {req.description ||
                                                                            'No description'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    {requirements &&
                                                        requirements.filter(
                                                            (req) =>
                                                                req.id !==
                                                                    requirementId &&
                                                                (childSearchQuery ===
                                                                    '' ||
                                                                    req.name
                                                                        .toLowerCase()
                                                                        .includes(
                                                                            childSearchQuery.toLowerCase(),
                                                                        ) ||
                                                                    (req.external_id &&
                                                                        req.external_id
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                childSearchQuery.toLowerCase(),
                                                                            ))),
                                                        ).length === 0 && (
                                                            <p className="text-muted-foreground text-center py-4">
                                                                No requirements found
                                                            </p>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIsAddChildOpen(false);
                                                    setChildSearchQuery('');
                                                    setSelectedChildRequirement(null);
                                                }}
                                                className="bg-transparent border-border text-muted-foreground hover:bg-accent"
                                                style={{ borderRadius: 0 }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleAddChild}
                                                disabled={
                                                    !selectedChildRequirement ||
                                                    createRelationshipMutation.isPending
                                                }
                                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                                                style={{ borderRadius: 0 }}
                                            >
                                                {createRelationshipMutation.isPending
                                                    ? 'Adding...'
                                                    : 'Add Child'}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="mt-4">
                                {isLoadingDescendants ? (
                                    <p className="text-muted-foreground text-center">
                                        Loading...
                                    </p>
                                ) : realChildRequirements.length > 0 ? (
                                    <div className="space-y-3">
                                        {realChildRequirements.map((req) => (
                                            <div
                                                key={req.id}
                                                className="flex items-center justify-between p-3 bg-background border border-border"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-foreground font-medium">
                                                        {req.external_id
                                                            ? `${req.external_id} ${req.name}`
                                                            : req.name}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {req.description}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ({req.type})
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        if (!profile) return;
                                                        if (!requirementId || !req.id) {
                                                            toast({
                                                                title: 'Error',
                                                                description:
                                                                    'Missing requirement IDs',
                                                                variant: 'destructive',
                                                            });
                                                            return;
                                                        }
                                                        deleteRelationshipMutation.mutate(
                                                            {
                                                                ancestorId: requirementId,
                                                                descendantId: req.id,
                                                            },
                                                            {
                                                                onSuccess: async () => {
                                                                    // Refetch data to update the hierarchy immediately
                                                                    await Promise.all([
                                                                        refetchDescendants(),
                                                                        refetchAncestors(),
                                                                        refetchCurrentRequirement(),
                                                                    ]);
                                                                    toast({
                                                                        title: 'Success',
                                                                        description:
                                                                            'Child relationship deleted',
                                                                        variant:
                                                                            'default',
                                                                    });
                                                                },
                                                                onError: (error) => {
                                                                    toast({
                                                                        title: 'Error',
                                                                        description:
                                                                            error.message ||
                                                                            'Failed to delete relationship',
                                                                        variant:
                                                                            'destructive',
                                                                    });
                                                                },
                                                            },
                                                        );
                                                    }}
                                                    disabled={
                                                        deleteRelationshipMutation.isPending
                                                    }
                                                    className="text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                                                    style={{ borderRadius: 0 }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center">
                                        No child requirements
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* test cases section */}
                <div className="bg-card border border-border mb-8">
                    <div className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl"></span>
                                <h2 className="text-xl font-semibold text-card-foreground">
                                    Test Cases
                                </h2>
                            </div>
                            <Dialog
                                open={isAddTestCaseOpen}
                                onOpenChange={setIsAddTestCaseOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-transparent border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                                        style={{ borderRadius: 0 }}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        ADD TEST CASE
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] bg-card border-border text-card-foreground">
                                    <DialogHeader>
                                        <DialogTitle className="text-card-foreground">
                                            Add Test Case
                                        </DialogTitle>
                                        <DialogDescription className="text-muted-foreground">
                                            Select a test case to link to this
                                            requirement.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-card-foreground">
                                                Available Test Cases
                                            </h4>
                                            <div className="max-h-[300px] overflow-y-auto bg-background">
                                                {realTestCases.map((tc) => (
                                                    <div
                                                        key={tc.id}
                                                        className={`p-3 flex justify-between items-start hover:bg-primary/10 cursor-pointer border-b border-border last:border-b-0 ${
                                                            selectedTestCase?.id === tc.id
                                                                ? 'bg-primary/20'
                                                                : ''
                                                        }`}
                                                        onClick={() =>
                                                            setSelectedTestCase(tc)
                                                        }
                                                    >
                                                        <div className="space-y-1">
                                                            <div className="font-medium text-foreground">
                                                                {tc.name}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {tc.title}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {tc.description}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span
                                                                className={`px-2 py-1 text-xs font-medium border ${
                                                                    tc.status === 'Passed'
                                                                        ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
                                                                        : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                                                                }`}
                                                            >
                                                                {tc.status}
                                                            </span>
                                                            <span className="px-2 py-1 bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-medium border border-orange-500/30">
                                                                {tc.type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsAddTestCaseOpen(false)}
                                            className="bg-transparent border-border text-muted-foreground hover:bg-accent"
                                            style={{ borderRadius: 0 }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddTestCase}
                                            disabled={
                                                !selectedTestCase ||
                                                createTraceLinksMutation.isPending
                                            }
                                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                                            style={{ borderRadius: 0 }}
                                        >
                                            {createTraceLinksMutation.isPending
                                                ? 'Adding...'
                                                : 'Add Test Case'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="mt-4">
                            <div className="bg-muted overflow-hidden">
                                <div className="grid grid-cols-8 gap-4 p-4 bg-background text-sm font-bold text-foreground border-b border-border">
                                    <div className="text-left">ID</div>
                                    <div className="text-left">Name</div>
                                    <div className="text-center">Type</div>
                                    <div className="text-center">Status</div>
                                    <div className="text-center">Requirements</div>
                                    <div className="text-center">Last Execution</div>
                                    <div className="text-center">Duration</div>
                                    <div className="text-center">Actions</div>
                                </div>
                                {realTestCases.map((tc) => (
                                    <div
                                        key={tc.id}
                                        className="grid grid-cols-8 gap-4 p-4 bg-background border-b border-border last:border-b-0 items-center"
                                    >
                                        <div className="text-foreground font-medium">
                                            {tc.name}
                                        </div>
                                        <div>
                                            <div className="text-foreground font-bold text-sm">
                                                {tc.title}
                                            </div>
                                            <div className="text-muted-foreground text-xs">
                                                {tc.description}
                                            </div>
                                        </div>

                                        {/* type column */}
                                        <div className="flex justify-center">
                                            <span className="px-3 py-1 bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-medium border border-orange-500/30">
                                                {tc.type}
                                            </span>
                                        </div>

                                        {/* status column */}
                                        <div className="flex justify-center">
                                            <span
                                                className={`px-3 py-1 text-xs font-medium border flex items-center gap-1 ${
                                                    tc.status === 'Passed'
                                                        ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30'
                                                        : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                                                }`}
                                            >
                                                {tc.status === 'Passed' ? (
                                                    <>
                                                        <Check className="h-3 w-3" />
                                                        {tc.status}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="h-3 w-3 flex items-center justify-center">
                                                            ×
                                                        </span>
                                                        {tc.status}
                                                    </>
                                                )}
                                            </span>
                                        </div>

                                        {/* requirements column*/}
                                        <div className="flex justify-center">
                                            <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-medium border border-border">
                                                {tc.requirements}
                                            </span>
                                        </div>

                                        {/* last execution column */}
                                        <div className="text-foreground text-center">
                                            {tc.lastExecution}
                                        </div>

                                        {/* duration column */}
                                        <div className="text-foreground text-center">
                                            {tc.duration}
                                        </div>

                                        {/* actions column */}
                                        <div className="flex items-center gap-2 justify-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                                                style={{ borderRadius: 0 }}
                                            >
                                                <Search className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                                                style={{ borderRadius: 0 }}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                                                style={{ borderRadius: 0 }}
                                            >
                                                <Network className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                                                style={{ borderRadius: 0 }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
