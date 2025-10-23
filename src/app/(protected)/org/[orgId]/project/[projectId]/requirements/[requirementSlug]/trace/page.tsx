'use client';

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { Check, Network, Plus, Search, Trash2, Trash } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

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
// testing start - import relationship hooks

// import real data hooks for backend integration
import {
    useCreateRelationship,
    useDeleteRelationship,
    useRequirementAncestors,
    useRequirementDescendants,
    useRequirementTree,
} from '@/hooks/queries/useRequirementRelationships';
import { useReverseTraceLinks, useTraceLinks } from '@/hooks/queries/useTraceability';
// testing end

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
    const { toast } = useToast();
    const { profile } = useUser();

    const [isOpen, setIsOpen] = useState(false);
    const [selectedRequirements, setSelectedRequirements] = useState<
        SelectedRequirement[]
    >([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['sr-001']));

    const requirementId = params.requirementSlug as string;
    const projectId = params.projectId as string;

    // Get documentId from URL query parameter instead of document store
    const documentId = searchParams.get('documentId') || '';
    const { data: requirements, isLoading: isLoadingRequirements } =
        useDocumentRequirements(documentId);
    const { data: outgoingLinks } = useTraceLinks(requirementId, 'requirement');
    const { data: incomingLinks } = useReverseTraceLinks(requirementId, 'requirement');

    // testing start - add real data hooks for backend integration
    const { data: currentRequirement, isLoading: isLoadingCurrentRequirement } =
        useRequirement(requirementId);
    const { data: requirementAncestors, isLoading: isLoadingAncestors } =
        useRequirementAncestors(requirementId);
    const { data: requirementDescendants, isLoading: isLoadingDescendants } =
        useRequirementDescendants(requirementId);
    const { data: requirementTree, isLoading: isLoadingTree } =
        useRequirementTree(projectId);
    // testing end

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

    // testing start - add relationship hooks and state
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
    // testing end

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

    // testing start - add parent button functionality
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
            console.log('Creating parent relationship:', {
                ancestorId: selectedParentRequirement.id,
                descendantId: requirementId,
            });

            await createRelationshipMutation.mutateAsync({
                ancestorId: selectedParentRequirement.id,
                descendantId: requirementId,
            });

            toast({
                title: 'Success',
                description: `Added ${selectedParentRequirement.name} as parent requirement`,
                variant: 'default',
            });

            setSelectedParentRequirement(null);
            setIsAddParentOpen(false);
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
    // testing end

    // testing start - add child button functionality
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
            console.log('Creating child relationship:', {
                ancestorId: requirementId,
                descendantId: selectedChildRequirement.id,
            });

            await createRelationshipMutation.mutateAsync({
                ancestorId: requirementId,
                descendantId: selectedChildRequirement.id,
            });

            toast({
                title: 'Success',
                description: `Added ${selectedChildRequirement.name} as child requirement`,
                variant: 'default',
            });

            setSelectedChildRequirement(null);
            setIsAddChildOpen(false);
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
    // testing end

    // testing start - add test case button functionality
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
                    target_type: 'requirement' as const, // Using requirement as placeholder
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
    // testing end

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

    // comment out mock test cases for real data integration
    // const mockTestCases = [
    //     {
    //         id: 'tc-001',
    //         name: 'TC-001',
    //         title: 'System Integration Test',
    //         description: 'End-to-end flight control system test',
    //         type: 'System',
    //         status: 'Passed',
    //         requirements: 'SYS-001',
    //         lastExecution: '7/30/2024',
    //         duration: '1h 0m 0s',
    //         relationship: 'tests' as const,
    //     },
    //     {
    //         id: 'tc-002',
    //         name: 'TC-002',
    //         title: 'Failure Mode Test',
    //         description: 'Test system behavior under component...',
    //         type: 'System',
    //         status: 'Failed',
    //         requirements: 'SYS-001',
    //         lastExecution: '7/29/2024',
    //         duration: '30m 0s',
    //         relationship: 'tests' as const,
    //     },
    // ];

    // testing start - use real test cases from trace links
    const realTestCases = useMemo(() => {
        // Filter trace links that are test cases (when test case entity type is supported)
        // For now using mock data
        return [
            {
                id: 'tc-001',
                name: 'TC-001',
                title: 'System Integration Test',
                description: 'End-to-end flight control system test',
                type: 'System',
                status: 'Passed',
                requirements: 'SYS-001',
                lastExecution: '7/30/2024',
                duration: '1h 0m 0s',
                relationship: 'tests' as const,
            },
            {
                id: 'tc-002',
                name: 'TC-002',
                title: 'Failure Mode Test',
                description: 'Test system behavior under component...',
                type: 'System',
                status: 'Failed',
                requirements: 'SYS-001',
                lastExecution: '7/29/2024',
                duration: '30m 0s',
                relationship: 'tests' as const,
            },
        ];
    }, [outgoingLinks, incomingLinks]);
    // testing end

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

    // comment out mock parent requirements for real data integration
    // const mockParentRequirements = [
    //     {
    //         id: 'un-001',
    //         name: 'UN-001',
    //         description: 'Continuous Heart Rate Monitoring',
    //         type: 'User Need',
    //     },
    // ];

    // const mockChildRequirements = [
    //     {
    //         id: 'ss-001',
    //         name: 'SS-001',
    //         description: 'Heart Rate Sensor Module',
    //         type: 'Sub-System',
    //     },
    //     {
    //         id: 'ss-002',
    //         name: 'SS-002',
    //         description: 'Signal Processing Module',
    //         type: 'Sub-System',
    //     },
    // ];

    // testing start - use real parent and child requirements from backend
    const realParentRequirements = useMemo(() => {
        if (!requirementAncestors) return [];
        return requirementAncestors.map((ancestor) => ({
            id: ancestor.requirementId,
            name: ancestor.title,
            description: '', // Description not available in RequirementNode
            type: 'Requirement', // Type not available in RequirementNode
        }));
    }, [requirementAncestors]);

    const realChildRequirements = useMemo(() => {
        if (!requirementDescendants) return [];
        return requirementDescendants.map((descendant) => ({
            id: descendant.requirementId,
            name: descendant.title,
            description: '', // Description not available in RequirementNode
            type: 'Requirement', // Type not available in RequirementNode
        }));
    }, [requirementDescendants]);
    // testing end

    // comment out mock hierarchy for real data integration
    // const mockHierarchy = {
    //     id: 'un-001',
    //     name: 'UN-001 Continuous Heart Rate Monitoring',
    //     type: 'User Need',
    //     children: [
    //         {
    //             id: 'sr-001',
    //             name: 'SR-001 Heart Rate Sensor Accuracy',
    //             type: 'System',
    //             isCurrent: true, // highlight current requirement
    //             children: [
    //                 {
    //                     id: 'ss-001',
    //                     name: 'SS-001 Heart Rate Sensor Module',
    //                     type: 'Sub-System',
    //                     children: [
    //                         {
    //                             id: 'c-001',
    //                             name: 'C-001 Optical Heart Rate Sensor',
    //                             type: 'Component',
    //                             children: [],
    //                         },
    //                         {
    //                             id: 'c-002',
    //                             name: 'C-002 Signal Amplifier',
    //                             type: 'Component',
    //                             children: [],
    //                         },
    //                     ],
    //                 },
    //                 {
    //                     id: 'ss-002',
    //                     name: 'SS-002 Signal Processing Module',
    //                     type: 'Sub-System',
    //                     children: [],
    //                 },
    //             ],
    //         },
    //     ],
    // };

    // testing start - use real hierarchy data from backend
    const realHierarchy = useMemo(() => {
        // For now using mock data as fallback
        return {
            id: currentRequirement?.id || 'un-001',
            name: currentRequirement?.name || 'UN-001 Continuous Heart Rate Monitoring',
            type: currentRequirement?.type || 'User Need',
            isCurrent: true,
            children: [
                {
                    id: 'sr-001',
                    name: 'SR-001 Heart Rate Sensor Accuracy',
                    type: 'System',
                    isCurrent: false,
                    children: [
                        {
                            id: 'ss-001',
                            name: 'SS-001 Heart Rate Sensor Module',
                            type: 'Sub-System',
                            children: [
                                {
                                    id: 'c-001',
                                    name: 'C-001 Optical Heart Rate Sensor',
                                    type: 'Component',
                                    children: [],
                                },
                                {
                                    id: 'c-002',
                                    name: 'C-002 Signal Amplifier',
                                    type: 'Component',
                                    children: [],
                                },
                            ],
                        },
                        {
                            id: 'ss-002',
                            name: 'SS-002 Signal Processing Module',
                            type: 'Sub-System',
                            children: [],
                        },
                    ],
                },
            ],
        };
    }, [currentRequirement]);
    // testing end

    const renderHierarchyNode = (node: any, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);

        const toggleExpanded = () => {
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

        return (
            <div key={node.id} className={`${level > 0 ? 'ml-6' : ''}`}>
                <div
                    className={`flex items-center gap-2 py-2 px-3 hover:bg-primary/10 transition-colors cursor-pointer ${
                        node.isCurrent ? 'bg-primary/20 border-l-2 border-primary' : ''
                    }`}
                    onClick={toggleExpanded}
                >
                    {/* tree line connector - neutral gray */}
                    {level > 0 && (
                        <div className="flex items-center">
                            <div className="w-4 h-0.5 bg-muted-foreground"></div>
                        </div>
                    )}

                    {/* expand/collapse icon - using chevron icons instead of triangles */}
                    {hasChildren && (
                        <div
                            className="text-muted-foreground transition-transform duration-200"
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

                    {/* no emoji icons - just clean text */}
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
                        {node.children.map((child: any) =>
                            renderHierarchyNode(child, level + 1),
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* increased padding to avoid nav button overlap */}
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
                                Requirement Hierarchy
                            </h2>
                        </div>
                        <div className="mt-4">{renderHierarchyNode(realHierarchy)}</div>
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
                                        {currentRequirement?.name ||
                                            'SR-001 Heart Rate Sensor Accuracy'}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Requirement Details
                                    </p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium border border-green-500/30">
                                Approved
                            </span>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                        Description
                                    </h3>
                                    <p className="text-foreground text-sm">
                                        {currentRequirement?.description ||
                                            'The heart rate sensor shall have an accuracy of ±2 BPM.'}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                        Details
                                    </h3>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-foreground">
                                            Type:{' '}
                                            {currentRequirement?.type ||
                                                'System Requirement'}
                                        </p>
                                        <p className="text-foreground">
                                            Priority:{' '}
                                            {currentRequirement?.priority || 'High'}
                                        </p>
                                        <p className="text-foreground">
                                            Source: {'UN-001'}
                                        </p>
                                        <p className="text-foreground">
                                            Created:{' '}
                                            {currentRequirement?.created_at
                                                ? new Date(
                                                      currentRequirement.created_at,
                                                  ).toLocaleDateString()
                                                : '1/16/2025'}
                                        </p>
                                        <p className="text-foreground">
                                            Updated:{' '}
                                            {currentRequirement?.updated_at
                                                ? new Date(
                                                      currentRequirement.updated_at,
                                                  ).toLocaleDateString()
                                                : '1/21/2025'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                        Rationale
                                    </h3>
                                    <p className="text-foreground text-sm">{'-'}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                        Tags
                                    </h3>
                                    <div className="flex gap-2">
                                        {currentRequirement?.tags?.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 bg-muted text-muted-foreground text-xs"
                                            >
                                                {tag}
                                            </span>
                                        )) || (
                                            <>
                                                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs">
                                                    sensor
                                                </span>
                                                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs">
                                                    accuracy
                                                </span>
                                            </>
                                        )}
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
                                                <div className="max-h-[300px] overflow-y-auto bg-background">
                                                    {requirements
                                                        ?.filter(
                                                            (req) =>
                                                                req.id !== requirementId,
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
                                                                        {req.name}
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
                                                onClick={() => setIsAddParentOpen(false)}
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
                                {realParentRequirements.length > 0 ? (
                                    <div className="space-y-3">
                                        {realParentRequirements.map((req) => (
                                            <div
                                                key={req.id}
                                                className="flex items-center justify-between p-3 bg-background border border-border"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-foreground font-medium">
                                                        {req.name}
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
                                                <div className="max-h-[300px] overflow-y-auto bg-background">
                                                    {requirements
                                                        ?.filter(
                                                            (req) =>
                                                                req.id !== requirementId,
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
                                                                        {req.name}
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
                                                onClick={() => setIsAddChildOpen(false)}
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
                                {realChildRequirements.length > 0 ? (
                                    <div className="space-y-3">
                                        {realChildRequirements.map((req) => (
                                            <div
                                                key={req.id}
                                                className="flex items-center justify-between p-3 bg-background border border-border"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-foreground font-medium">
                                                        {req.name}
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
