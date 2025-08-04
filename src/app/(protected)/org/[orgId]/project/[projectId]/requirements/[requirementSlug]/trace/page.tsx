'use client';

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
    useRequirementsByIds,
} from '@/hooks/queries/useRequirement';
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
    const { toast } = useToast();
    const { profile } = useUser();

    const [isOpen, setIsOpen] = useState(false);
    const [selectedRequirements, setSelectedRequirements] = useState<
        SelectedRequirement[]
    >([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleteMode, setIsDeleteMode] = useState(false);

    const requirementId = params?.requirementSlug as string || '';

    // Get documentId from URL query parameter instead of document store
    const documentId = searchParams?.get('documentId') || '';
    const { data: requirements, isLoading: isLoadingRequirements } =
        useDocumentRequirements(documentId);
    const { data: outgoingLinks } = useTraceLinks(requirementId, 'requirement');
    const { data: incomingLinks } = useReverseTraceLinks(requirementId, 'requirement');

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

    return (
        <div className="container mx-auto py-6 space-y-6">
            <Card className="bg-background shadow-none">
                <CardHeader className="px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl font-bold">
                                Trace Links
                            </CardTitle>
                            <CardDescription>
                                Manage trace links for this requirement
                            </CardDescription>
                        </div>
                        <Link
                            href={`/org/${params?.orgId}/project/${params?.projectId}/requirements/${params?.requirementSlug}/trace/diagram`}
                            passHref
                        >
                            <Button
                                variant="default"
                                size="icon"
                                className="rounded-full h-10 w-10"
                                title="View Trace Diagram"
                            >
                                <Network className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="px-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Current Trace Links</h3>
                        <div className="flex gap-2">
                            <Button
                                variant={isDeleteMode ? 'destructive' : 'outline'}
                                size="sm"
                                onClick={() => setIsDeleteMode(!isDeleteMode)}
                                title={
                                    isDeleteMode
                                        ? 'Exit delete mode'
                                        : 'Enter delete mode'
                                }
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Trace
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px] max-h-[80vh] bg-background shadow-none">
                                    <DialogHeader>
                                        <DialogTitle>Create Trace Links</DialogTitle>
                                        <DialogDescription>
                                            Select requirements to create trace links with
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-medium">
                                                    Available Requirements
                                                </h4>
                                                <div className="relative w-[200px]">
                                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search requirements..."
                                                        className="pl-8 h-9"
                                                        value={searchQuery}
                                                        onChange={(e) =>
                                                            setSearchQuery(e.target.value)
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            {isLoadingRequirements ? (
                                                <div className="text-center py-4">
                                                    Loading requirements...
                                                </div>
                                            ) : availableRequirements.length === 0 ? (
                                                <div className="text-center py-4 text-muted-foreground">
                                                    No available requirements to link
                                                </div>
                                            ) : (
                                                <div className="max-h-[200px] overflow-y-auto">
                                                    {availableRequirements.map((req) => {
                                                        const isSelected =
                                                            selectedRequirements.some(
                                                                (selected) =>
                                                                    selected.id ===
                                                                    req.id,
                                                            );
                                                        return (
                                                            <div
                                                                key={req.id}
                                                                className="p-3 flex justify-between items-start hover:bg-muted"
                                                            >
                                                                <div className="space-y-1">
                                                                    <div className="font-medium">
                                                                        {req.name}
                                                                    </div>
                                                                    <div className="text-sm text-muted-foreground">
                                                                        {req.description ||
                                                                            'No description'}
                                                                    </div>
                                                                </div>
                                                                {isSelected ? (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleRemoveRequirement(
                                                                                req.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Check
                                                                            size={16}
                                                                            className="mr-1"
                                                                        />{' '}
                                                                        Added
                                                                    </Button>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
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
                                                                            <SelectTrigger className="w-[120px]">
                                                                                <SelectValue placeholder="Relation" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="parent_of">
                                                                                    Parent
                                                                                    of
                                                                                </SelectItem>
                                                                                <SelectItem value="child_of">
                                                                                    Child
                                                                                    of
                                                                                </SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
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
                                                    <h4 className="font-medium">
                                                        Selected Requirements
                                                    </h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSelectedRequirements([])
                                                        }
                                                    >
                                                        Clear All
                                                    </Button>
                                                </div>
                                                <div className="max-h-[200px] overflow-y-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="w-[120px]">
                                                                    Relationship
                                                                </TableHead>
                                                                <TableHead className="w-[100px]">
                                                                    ID
                                                                </TableHead>
                                                                <TableHead>
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
                                                                    >
                                                                        <TableCell>
                                                                            {req.relationship ===
                                                                            'parent_of'
                                                                                ? 'Parent of'
                                                                                : 'Child of'}
                                                                        </TableCell>
                                                                        <TableCell className="font-medium">
                                                                            {req.external_id ||
                                                                                req.id.split(
                                                                                    '-',
                                                                                )[1]}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {req.name}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() =>
                                                                                    handleRemoveRequirement(
                                                                                        req.id,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Trash2
                                                                                    size={
                                                                                        16
                                                                                    }
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
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleCreateTraceLinks}
                                            disabled={
                                                selectedRequirements.length === 0 ||
                                                createTraceLinksMutation.isPending
                                            }
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

                    <div className="space-y-6">
                        <div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {(incomingLinks && incomingLinks.length > 0) ||
                                (outgoingLinks && outgoingLinks.length > 0) ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px]">
                                                    ID
                                                </TableHead>
                                                <TableHead>Requirement</TableHead>
                                                <TableHead className="w-[120px]">
                                                    Relationship
                                                </TableHead>
                                                {isDeleteMode && (
                                                    <TableHead className="w-[80px]">
                                                        Action
                                                    </TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {incomingLinks &&
                                                incomingLinks.map((link) => {
                                                    const requirement =
                                                        linkedRequirements?.find(
                                                            (req) =>
                                                                req.id === link.source_id,
                                                        );
                                                    return (
                                                        <TableRow key={link.id}>
                                                            <TableCell className="font-medium">
                                                                {requirement?.external_id ||
                                                                    link.source_id.split(
                                                                        '-',
                                                                    )[1]}
                                                            </TableCell>
                                                            <TableCell>
                                                                {requirement?.name ||
                                                                    'Loading...'}
                                                            </TableCell>
                                                            <TableCell>Parent</TableCell>
                                                            {isDeleteMode && (
                                                                <TableCell>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive hover:text-destructive/90"
                                                                        onClick={() =>
                                                                            handleDeleteTraceLink(
                                                                                link.id,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deleteTraceLinkMutation.isPending
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            )}
                                                        </TableRow>
                                                    );
                                                })}
                                            {outgoingLinks &&
                                                outgoingLinks.map((link) => {
                                                    const requirement =
                                                        linkedRequirements?.find(
                                                            (req) =>
                                                                req.id === link.target_id,
                                                        );
                                                    return (
                                                        <TableRow key={link.id}>
                                                            <TableCell className="font-medium">
                                                                {requirement?.external_id ||
                                                                    link.target_id.split(
                                                                        '-',
                                                                    )[1]}
                                                            </TableCell>
                                                            <TableCell>
                                                                {requirement?.name ||
                                                                    'Loading...'}
                                                            </TableCell>
                                                            <TableCell>Child</TableCell>
                                                            {isDeleteMode && (
                                                                <TableCell>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive hover:text-destructive/90"
                                                                        onClick={() =>
                                                                            handleDeleteTraceLink(
                                                                                link.id,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            deleteTraceLinkMutation.isPending
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            )}
                                                        </TableRow>
                                                    );
                                                })}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground">
                                        No trace links found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
