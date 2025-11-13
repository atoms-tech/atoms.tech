'use client';

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { ArrowRight, Check, Network, Plus, Search, Trash2, Trash } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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

interface TraceLinksContentProps {
    requirementId: string;
    projectId: string;
    orgId: string;
    documentId?: string;
}

export default function TraceLinksContent({
    requirementId,
    projectId,
    orgId,
    documentId = '',
}: TraceLinksContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { profile } = useUser();

    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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
        const directChildren = requirementDescendants.filter(
            (desc) => desc.depth === 1 && desc.directParent,
        );

        const filteredDescendants =
            directChildren.length > 0
                ? directChildren
                : requirementDescendants.filter((desc) => desc.depth === 1);

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
            await createRelationshipMutation.mutateAsync({
                ancestorId: selectedParentRequirement.id,
                descendantId: requirementId,
            });

            await Promise.all([
                refetchAncestors(),
                refetchDescendants(),
                refetchCurrentRequirement(),
            ]);

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
            toast({
                title: 'Error',
                description: `Failed to create parent relationship.`,
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
            await createRelationshipMutation.mutateAsync({
                ancestorId: requirementId,
                descendantId: selectedChildRequirement.id,
            });

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
            toast({
                title: 'Error',
                description: `Failed to create child relationship.`,
                variant: 'destructive',
            });
        }
    };

    // Real test cases (mock data for now)
    const realTestCases = useMemo(() => {
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
            await createTraceLinksMutation.mutateAsync([
                {
                    source_id: requirementId,
                    source_type: 'requirement' as const,
                    target_id: selectedTestCase.id,
                    target_type: 'requirement' as const,
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

    // Build hierarchy
    const realHierarchy = useMemo(() => {
        if (!currentRequirement) {
            return null;
        }

        const buildChildTree = (
            parentId: string,
            allTreeNodes: RequirementTreeNode[],
            allRequirements: any[],
        ): any[] => {
            const childNodes = allTreeNodes.filter((node) => node.parent_id === parentId);

            return childNodes.map((treeNode) => {
                const fullReq = allRequirements.find(
                    (r) => r.id === treeNode.requirement_id,
                );
                const displayName = treeNode.title;

                const grandchildren = buildChildTree(
                    treeNode.requirement_id,
                    allTreeNodes,
                    allRequirements,
                );

                return {
                    id: treeNode.requirement_id,
                    name: displayName,
                    type: fullReq?.type || '-',
                    external_id: '',
                    isCurrent: false,
                    children: grandchildren,
                };
            });
        };

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

        const currentExternalId = currentRequirement.external_id || '';
        const currentDisplayName = currentExternalId
            ? `${currentExternalId} ${currentRequirement.name || '-'}`
            : currentRequirement.name || '-';

        let children: any[] = [];
        const allReqs = [
            ...(descendantRequirements || []),
            ...(ancestorRequirements || []),
            currentRequirement,
        ];

        if (requirementTree && requirementTree.length > 0) {
            const directChildNodes = requirementTree.filter(
                (node) => node.parent_id === currentRequirement.id,
            );

            children = directChildNodes.map((childNode) => {
                const fullReq = allReqs.find((r) => r.id === childNode.requirement_id);
                const displayName = childNode.title;

                const grandchildren = buildChildTree(
                    childNode.requirement_id,
                    requirementTree,
                    allReqs,
                );

                return {
                    id: childNode.requirement_id,
                    name: displayName,
                    type: fullReq?.type || '-',
                    external_id: '',
                    isCurrent: false,
                    children: grandchildren,
                };
            });
        }

        if (
            children.length === 0 &&
            requirementDescendants &&
            requirementDescendants.length > 0
        ) {
            let directChildren = (requirementDescendants || []).filter(
                (desc) => desc.depth === 1 && desc.directParent === true,
            );

            if (directChildren.length === 0) {
                directChildren = (requirementDescendants || []).filter(
                    (desc) => desc.depth === 1,
                );
            }

            children = directChildren.map((child) => {
                const fullReq = descendantRequirements?.find(
                    (r) => r.id === child.requirementId,
                );
                const displayName = child.title;

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
                    external_id: '',
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

        const hasRelationships = parents.length > 0 || current.children.length > 0;
        const hasAncestors = requirementAncestors && requirementAncestors.length > 0;
        const hasDescendants =
            requirementDescendants && requirementDescendants.length > 0;
        const finalHasRelationships = hasRelationships || hasAncestors || hasDescendants;

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

    const getRelationshipType = (
        nodeId: string,
        isCurrent: boolean,
        hasParent: boolean,
        hasChildren: boolean,
        level: number,
    ) => {
        if (isCurrent) {
            const hasParentActual = realParentRequirements.length > 0;
            const hasChildrenActual = realChildRequirements.length > 0;
            const isGrandchild =
                requirementAncestors?.some((ancestor) => ancestor.depth > 1) || false;

            if (hasParentActual && isGrandchild) {
                return 'Grandchild Requirement';
            }
            if (!hasParentActual && !hasChildrenActual) {
                return 'No Relationships';
            }
            if (!hasParentActual && hasChildrenActual) {
                return 'Parent Requirement';
            }
            if (hasParentActual && !hasChildrenActual) {
                return 'Child Requirement';
            }
            if (hasParentActual && hasChildrenActual) {
                return 'Child/Parent Requirement';
            }
            return 'No Relationships';
        }

        const isGrandchild = level > 1;

        if (hasParent && isGrandchild) {
            return 'Grandchild Requirement';
        }
        if (!hasParent && !hasChildren) {
            return 'No Relationships';
        }
        if (!hasParent && hasChildren) {
            return 'Parent Requirement';
        }
        if (hasParent && !hasChildren) {
            return 'Child Requirement';
        }
        if (hasParent && hasChildren) {
            return 'Child/Parent Requirement';
        }
        return 'No Relationships';
    };

    const renderHierarchyNode = (
        node: any,
        level: number = 0,
        hasParentInTree: boolean = false,
    ) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        const isCurrent = node.isCurrent;

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
            if (node.id !== requirementId) {
                const traceUrl = `/org/${orgId}/traceability?tab=manage&projectId=${projectId}&requirementId=${node.id}${documentId ? `&documentId=${documentId}` : ''}`;
                router.push(traceUrl);
            }
        };

        const nodeHasParent = hasParentInTree || level > 0;
        const relationshipType = getRelationshipType(
            node.id,
            isCurrent,
            nodeHasParent,
            hasChildren,
            level,
        );

        const indentLevel = level * 24;
        const externalId = isCurrent ? node.external_id || '' : '';

        let nameWithoutExternalId = node.name;
        if (isCurrent) {
            if (node.external_id && node.name) {
                if (node.name.startsWith(node.external_id)) {
                    nameWithoutExternalId = node.name
                        .replace(new RegExp(`^${node.external_id}\\s*`), '')
                        .trim();
                }
            }
            if (!nameWithoutExternalId) {
                nameWithoutExternalId = node.name || '-';
            }
        } else {
            nameWithoutExternalId = node.name || '-';
        }

        return (
            <div key={node.id}>
                <div
                    className={`flex items-center gap-2 py-2 px-3 cursor-pointer ${
                        isCurrent ? 'border-l-2 border-primary' : ''
                    }`}
                    style={{ marginLeft: `${indentLevel}px` }}
                    onClick={handleNodeClick}
                >
                    {level > 0 && (
                        <div className="flex items-center">
                            <div className="w-4 h-0.5 bg-muted-foreground"></div>
                        </div>
                    )}

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

                    {isCurrent && (
                        <span className="font-medium text-primary">
                            {externalId || '—'}
                        </span>
                    )}

                    <span className="font-medium text-foreground dark:text-white">
                        {nameWithoutExternalId}
                    </span>

                    <span className="text-xs text-muted-foreground">
                        ({relationshipType})
                    </span>
                </div>

                {hasChildren && isExpanded && (
                    <div className="border-l border-border ml-3">
                        {node.children.map((child: any) => (
                            <div key={child.id}>
                                {renderHierarchyNode(child, level + 1, true)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (isLoadingCurrentRequirement) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Loading requirement...
            </div>
        );
    }

    if (!currentRequirement) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Requirement not found
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Requirement Hierarchy Section */}
            <Card className="border border-border">
                <CardHeader className="py-4">
                    <CardTitle className="text-lg">Requirement Hierarchy</CardTitle>
                </CardHeader>
                <CardContent>
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
                        <div>
                            {renderHierarchyNode(realHierarchy.current)}
                            <p className="text-muted-foreground text-center mt-4 text-sm">
                                No relationships found yet
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {realHierarchy.parents.length > 0 && (
                                <div className="space-y-1">
                                    {realHierarchy.parents.map((parent) => (
                                        <div key={parent.id}>
                                            {renderHierarchyNode(parent)}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {renderHierarchyNode(realHierarchy.current)}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Requirement Details Section */}
            <Card className="border border-border">
                <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">
                                {currentRequirement?.name || '-'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Requirement Details
                            </p>
                        </div>
                        <span
                            className={`px-3 py-1 text-xs font-medium border ${
                                currentRequirement?.status === 'approved' ||
                                currentRequirement?.status === 'active'
                                    ? 'bg-green-500/20 text-muted-foreground border-green-500/30'
                                    : currentRequirement?.status === 'rejected' ||
                                        currentRequirement?.status === 'deleted'
                                      ? 'bg-red-500/20 text-muted-foreground border-red-500/30'
                                      : currentRequirement?.status === 'archived'
                                        ? 'bg-gray-500/20 text-muted-foreground border-gray-500/30'
                                        : 'bg-yellow-500/20 text-muted-foreground border-yellow-500/30'
                            }`}
                        >
                            {currentRequirement?.status
                                ? String(currentRequirement.status)
                                      .replaceAll('_', ' ')
                                      .replace(/\b\w/g, (c) => c.toUpperCase())
                                : '-'}
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <span className="px-2 py-1 bg-primary/10 text-muted-foreground text-xs font-semibold border border-primary/20">
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
                                        {(() => {
                                            const hasParent =
                                                realParentRequirements.length > 0;
                                            const hasChildren =
                                                realChildRequirements.length > 0;
                                            const isGrandchild =
                                                requirementAncestors?.some(
                                                    (ancestor) => ancestor.depth > 1,
                                                ) || false;

                                            if (hasParent && isGrandchild) {
                                                return 'Grandchild Requirement';
                                            }
                                            if (!hasParent && !hasChildren) {
                                                return 'No Relationships';
                                            }
                                            if (!hasParent && hasChildren) {
                                                return 'Parent Requirement';
                                            }
                                            if (hasParent && !hasChildren) {
                                                return 'Child Requirement';
                                            }
                                            if (hasParent && hasChildren) {
                                                return 'Child/Parent Requirement';
                                            }
                                            return '-';
                                        })()}
                                    </p>
                                    <p className="text-foreground">
                                        Priority: {currentRequirement?.priority || '-'}
                                    </p>
                                    <p className="text-foreground">
                                        Source: {currentRequirement?.external_id || '-'}
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
                                            (currentRequirement as any)?.properties || {};
                                        const raw = props.Rationale ?? props.rationale;
                                        if (!raw) return '-';
                                        if (typeof raw === 'string') return raw;
                                        if (typeof (raw as any)?.value === 'string')
                                            return (raw as any).value;
                                        try {
                                            return String(raw);
                                        } catch {
                                            return '-';
                                        }
                                    })()}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Parent and Child Requirements Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Parent Requirements */}
                <Card className="border border-border">
                    <CardHeader className="py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Parent Requirements</CardTitle>
                            <Dialog
                                open={isAddParentOpen}
                                onOpenChange={setIsAddParentOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-1" />
                                        ADD PARENT
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>Add Parent Requirement</DialogTitle>
                                        <DialogDescription>
                                            Select a requirement to be the parent of the
                                            current requirement.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium">
                                                Available Requirements
                                            </h4>
                                            <Input
                                                placeholder="Search requirements..."
                                                value={parentSearchQuery}
                                                onChange={(e) =>
                                                    setParentSearchQuery(e.target.value)
                                                }
                                            />
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {requirements
                                                    ?.filter(
                                                        (req) =>
                                                            req.id !== requirementId &&
                                                            (parentSearchQuery === '' ||
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
                                                            className={`p-3 flex justify-between items-start hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
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
                                                                <div className="font-medium">
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
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddParent}
                                            disabled={
                                                !selectedParentRequirement ||
                                                createRelationshipMutation.isPending
                                            }
                                        >
                                            {createRelationshipMutation.isPending
                                                ? 'Adding...'
                                                : 'Add Parent'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
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
                                        <div
                                            className="flex items-center gap-4 cursor-pointer"
                                            onClick={() => {
                                                const traceUrl = `/org/${orgId}/traceability?tab=manage&projectId=${projectId}&requirementId=${req.id}${documentId ? `&documentId=${documentId}` : ''}`;
                                                router.push(traceUrl);
                                            }}
                                        >
                                            <span className="text-foreground font-medium hover:text-primary">
                                                {req.external_id
                                                    ? `${req.external_id} ${req.name}`
                                                    : req.name}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {req.description}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!profile) return;
                                                deleteRelationshipMutation.mutate(
                                                    {
                                                        ancestorId: req.id,
                                                        descendantId: requirementId,
                                                    },
                                                    {
                                                        onSuccess: async () => {
                                                            await Promise.all([
                                                                refetchAncestors(),
                                                                refetchDescendants(),
                                                                refetchCurrentRequirement(),
                                                            ]);
                                                            toast({
                                                                title: 'Success',
                                                                description:
                                                                    'Parent relationship deleted',
                                                                variant: 'default',
                                                            });
                                                        },
                                                    },
                                                );
                                            }}
                                            disabled={
                                                deleteRelationshipMutation.isPending
                                            }
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
                    </CardContent>
                </Card>

                {/* Child Requirements */}
                <Card className="border border-border">
                    <CardHeader className="py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Child Requirements</CardTitle>
                            <Dialog
                                open={isAddChildOpen}
                                onOpenChange={setIsAddChildOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-1" />
                                        ADD CHILD
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>Add Child Requirement</DialogTitle>
                                        <DialogDescription>
                                            Select a requirement to be the child of the
                                            current requirement.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium">
                                                Available Requirements
                                            </h4>
                                            <Input
                                                placeholder="Search requirements..."
                                                value={childSearchQuery}
                                                onChange={(e) =>
                                                    setChildSearchQuery(e.target.value)
                                                }
                                            />
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {requirements
                                                    ?.filter(
                                                        (req) =>
                                                            req.id !== requirementId &&
                                                            (childSearchQuery === '' ||
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
                                                            className={`p-3 flex justify-between items-start hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
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
                                                                <div className="font-medium">
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
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleAddChild}
                                            disabled={
                                                !selectedChildRequirement ||
                                                createRelationshipMutation.isPending
                                            }
                                        >
                                            {createRelationshipMutation.isPending
                                                ? 'Adding...'
                                                : 'Add Child'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
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
                                        <div
                                            className="flex items-center gap-4 cursor-pointer"
                                            onClick={() => {
                                                const traceUrl = `/org/${orgId}/traceability?tab=manage&projectId=${projectId}&requirementId=${req.id}${documentId ? `&documentId=${documentId}` : ''}`;
                                                router.push(traceUrl);
                                            }}
                                        >
                                            <span className="text-foreground font-medium hover:text-primary">
                                                {req.external_id
                                                    ? `${req.external_id} ${req.name}`
                                                    : req.name}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {req.description}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!profile) return;
                                                deleteRelationshipMutation.mutate(
                                                    {
                                                        ancestorId: requirementId,
                                                        descendantId: req.id,
                                                    },
                                                    {
                                                        onSuccess: async () => {
                                                            await Promise.all([
                                                                refetchDescendants(),
                                                                refetchAncestors(),
                                                                refetchCurrentRequirement(),
                                                            ]);
                                                            toast({
                                                                title: 'Success',
                                                                description:
                                                                    'Child relationship deleted',
                                                                variant: 'default',
                                                            });
                                                        },
                                                    },
                                                );
                                            }}
                                            disabled={
                                                deleteRelationshipMutation.isPending
                                            }
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
                    </CardContent>
                </Card>
            </div>

            {/* Test Cases Section */}
            <Card className="border border-border">
                <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Test Cases</CardTitle>
                        <Dialog
                            open={isAddTestCaseOpen}
                            onOpenChange={setIsAddTestCaseOpen}
                        >
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-1" />
                                    ADD TEST CASE
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Add Test Case</DialogTitle>
                                    <DialogDescription>
                                        Select a test case to link to this requirement.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium">
                                            Available Test Cases
                                        </h4>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {realTestCases.map((tc) => (
                                                <div
                                                    key={tc.id}
                                                    className={`p-3 flex justify-between items-start hover:bg-primary/10 cursor-pointer border-b last:border-b-0 ${
                                                        selectedTestCase?.id === tc.id
                                                            ? 'bg-primary/20'
                                                            : ''
                                                    }`}
                                                    onClick={() =>
                                                        setSelectedTestCase(tc)
                                                    }
                                                >
                                                    <div className="space-y-1">
                                                        <div className="font-medium">
                                                            {tc.name}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {tc.title}
                                                        </div>
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
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleAddTestCase}
                                        disabled={
                                            !selectedTestCase ||
                                            createTraceLinksMutation.isPending
                                        }
                                    >
                                        {createTraceLinksMutation.isPending
                                            ? 'Adding...'
                                            : 'Add Test Case'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No test cases linked yet</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
