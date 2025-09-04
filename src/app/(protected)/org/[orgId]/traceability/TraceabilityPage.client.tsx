'use client';

import {
    ArrowRight,
    GitBranch,
    Network,
    Plus,
    Search,
    Target,
    Trash2,
    Zap,
} from 'lucide-react';
import { useCallback, useState } from 'react';

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
import { useOrganizationProjects } from '@/hooks/queries/useProject';
import { useProjectRequirements } from '@/hooks/queries/useRequirement';
import {
    useCreateRelationship,
    useRequirementTree,
} from '@/hooks/queries/useRequirementRelationships';
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
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedParent, setSelectedParent] = useState<string>('');
    const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

    // Mutation for creating relationships
    const createRelationshipMutation = useCreateRelationship();

    // Fetch organization projects
    const { data: projects, isLoading: projectsLoading } = useOrganizationProjects(orgId);

    // Fetch requirement tree for hierarchy visualization
    const {
        data: requirementTree,
        isLoading: treeLoading,
        refetch: refetchTree,
    } = useRequirementTree(selectedProject);

    // Fetch requirements for selected project
    const { data: requirements, isLoading: requirementsLoading } = useProjectRequirements(
        selectedProject,
        { enabled: !!selectedProject },
    ) as { data: RequirementWithDocuments[] | undefined; isLoading: boolean };

    // Filter requirements based on search term
    const filteredRequirements =
        requirements?.filter(
            (req) =>
                req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.external_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.description?.toLowerCase().includes(searchTerm.toLowerCase()),
        ) || [];

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

                // Refresh tree to show new hierarchy
                refetchTree();
            }
        } catch (error) {
            console.error('Failed to create relationships:', error);
            alert(
                `Failed to create relationships: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }, [selectedParent, selectedChildren, createRelationshipMutation, refetchTree]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
            <div className="container mx-auto p-6 h-full">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-gray-800 to-slate-900 p-8 mb-8 border border-gray-700 shadow-2xl">
                    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                                <Network className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                    Requirements Traceability
                                </h1>
                                <p className="text-gray-400 mt-1">
                                    Visualize and manage requirement relationships across
                                    your project
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modern Tab Navigation */}
                <Tabs defaultValue="hierarchy" className="space-y-8">
                    <div className="flex justify-center">
                        <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-slate-800/50 backdrop-blur-sm border border-gray-700 p-1 rounded-xl">
                            <TabsTrigger
                                value="hierarchy"
                                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                            >
                                <Target className="h-4 w-4" />
                                Hierarchy
                            </TabsTrigger>
                            <TabsTrigger
                                value="matrix"
                                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                            >
                                <Network className="h-4 w-4" />
                                Tree View
                            </TabsTrigger>
                            <TabsTrigger
                                value="manage"
                                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                            >
                                <Zap className="h-4 w-4" />
                                Manage
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Modern Project Selection */}
                    <div className="bg-slate-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                                <Target className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    Project Selection
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    Choose your project to explore requirement
                                    relationships
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <Select
                                value={selectedProject}
                                onValueChange={setSelectedProject}
                                disabled={projectsLoading}
                            >
                                <SelectTrigger className="w-[350px] bg-slate-700/50 border-gray-600 text-white hover:bg-slate-700/70 transition-colors rounded-xl">
                                    <SelectValue
                                        placeholder={
                                            projectsLoading
                                                ? 'Loading projects...'
                                                : 'Select a project'
                                        }
                                        className="text-white"
                                    />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-gray-700">
                                    {projects?.map((project) => (
                                        <SelectItem
                                            key={project.id}
                                            value={project.id}
                                            className="text-white hover:bg-slate-700 focus:bg-slate-700"
                                        >
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/30 rounded-lg border border-gray-600">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-sm text-gray-300">
                                    {projects
                                        ? `${projects.length} projects`
                                        : 'No projects'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Requirements Display */}
                    {selectedProject && (
                        <>
                            <TabsContent value="hierarchy" className="space-y-8">
                                <div className="bg-slate-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                                            <GitBranch className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">
                                                Requirements Hierarchy
                                            </h2>
                                            <p className="text-gray-400 mt-1">
                                                Create and manage parent-child
                                                relationships between requirements
                                            </p>
                                        </div>
                                    </div>
                                    {/* Modern Search Bar */}
                                    <div className="relative mb-8">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <Input
                                            placeholder="Search requirements by name, ID, or description..."
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            className="pl-12 pr-4 py-3 bg-slate-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm transition-all duration-200"
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-white transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Modern Step Cards */}
                                    <div className="grid gap-6 mb-8">
                                        {/* Step 1: Parent Selection */}
                                        <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl border border-gray-600 p-6 shadow-lg">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold">
                                                        1
                                                    </div>
                                                    <h4 className="text-lg font-semibold text-white">
                                                        Select Parent Requirement
                                                    </h4>
                                                </div>
                                                <Select
                                                    value={selectedParent}
                                                    onValueChange={handleParentSelect}
                                                >
                                                    <SelectTrigger className="w-full bg-slate-700/50 border-gray-600 text-white rounded-xl py-3">
                                                        <SelectValue placeholder="Choose parent requirement..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-slate-800 border-gray-700">
                                                        {filteredRequirements.map(
                                                            (req) => (
                                                                <SelectItem
                                                                    key={req.id}
                                                                    value={req.id}
                                                                    className="text-white hover:bg-slate-700 focus:bg-slate-700"
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
                                            </div>
                                        </div>

                                        {/* Step 2: Child Selection */}
                                        {selectedParent && (
                                            <div className="relative overflow-hidden bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl border border-gray-600 p-6 shadow-lg">
                                                <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full -translate-y-16 -translate-x-16"></div>
                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-bold">
                                                            2
                                                        </div>
                                                        <h4 className="text-lg font-semibold text-white">
                                                            Select Child Requirements
                                                        </h4>
                                                    </div>
                                                    {/* Parent Info Card */}
                                                    <div className="bg-slate-600/30 rounded-xl p-4 mb-4 border border-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <ArrowRight className="h-4 w-4 text-purple-400" />
                                                            <span className="text-sm text-gray-300">
                                                                Parent:
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-purple-500/20 border-purple-400 text-purple-300"
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
                                                            <span className="text-sm text-white font-medium">
                                                                {
                                                                    requirements?.find(
                                                                        (r) =>
                                                                            r.id ===
                                                                            selectedParent,
                                                                    )?.name
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Selected Children Display */}
                                                    {selectedChildren.length > 0 && (
                                                        <div className="bg-emerald-500/10 rounded-xl p-4 mb-4 border border-emerald-500/30">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Target className="h-4 w-4 text-emerald-400" />
                                                                <span className="text-sm text-emerald-300 font-medium">
                                                                    Selected Children (
                                                                    {
                                                                        selectedChildren.length
                                                                    }
                                                                    )
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {selectedChildren.map(
                                                                    (childId) => (
                                                                        <Badge
                                                                            key={childId}
                                                                            className="bg-emerald-500/20 border-emerald-400 text-emerald-300 text-xs"
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
                                                        </div>
                                                    )}
                                                    {/* Action Buttons */}
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            onClick={
                                                                createParentChildRelationship
                                                            }
                                                            disabled={
                                                                selectedChildren.length ===
                                                                    0 ||
                                                                createRelationshipMutation.isPending
                                                            }
                                                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium px-6 py-2 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            {createRelationshipMutation.isPending
                                                                ? 'Creating...'
                                                                : `Create Relationships (${selectedChildren.length})`}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={handleClearSelection}
                                                            className="border-gray-600 text-gray-300 hover:bg-slate-700/50 hover:text-white rounded-xl px-4 py-2 transition-all duration-200"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Clear All
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Modern Requirements Grid */}
                                    {selectedParent && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                                                    <Search className="h-5 w-5 text-white" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-white">
                                                    Available Child Requirements
                                                </h3>
                                                <span className="text-sm text-gray-400">
                                                    Click to select/deselect
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
                                                                className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                                                                    selectedChildren.includes(
                                                                        requirement.id,
                                                                    )
                                                                        ? 'border-gray-400 bg-gray-700 shadow-sm'
                                                                        : 'border-gray-600 hover:border-gray-500 bg-gray-800'
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
                                                                            <h3 className="font-medium text-sm text-gray-100">
                                                                                {
                                                                                    requirement.name
                                                                                }
                                                                            </h3>
                                                                            {requirement.documents && (
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="text-xs"
                                                                                >
                                                                                    📄{' '}
                                                                                    {
                                                                                        requirement
                                                                                            .documents
                                                                                            .name
                                                                                    }
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        {requirement.description && (
                                                                            <p className="text-xs text-gray-400 line-clamp-2">
                                                                                {
                                                                                    requirement.description
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    {selectedChildren.includes(
                                                                        requirement.id,
                                                                    ) && (
                                                                        <div className="ml-4">
                                                                            <ArrowRight className="h-4 w-4 text-gray-300" />
                                                                        </div>
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
                                    )}

                                    {/* All Requirements List (when no parent selected) */}
                                    {!selectedParent && (
                                        <div>
                                            <h4 className="text-sm font-medium mb-3 text-gray-700">
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
                                                                className="p-3 border rounded-lg border-gray-600 bg-gray-800"
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
                                                                    <h3 className="font-medium text-sm text-gray-100">
                                                                        {requirement.name}
                                                                    </h3>
                                                                    {requirement.documents && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs"
                                                                        >
                                                                            📄{' '}
                                                                            {
                                                                                requirement
                                                                                    .documents
                                                                                    .name
                                                                            }
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {requirement.description && (
                                                                    <p className="text-xs text-gray-400 line-clamp-2">
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
                                </div>
                            </TabsContent>

                            <TabsContent value="matrix" className="space-y-6">
                                <div className="bg-slate-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                            <Network className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">
                                                Requirements Hierarchy Tree
                                            </h2>
                                            <p className="text-gray-400 mt-1">
                                                Interactive tree view showing all
                                                requirement relationships
                                            </p>
                                        </div>
                                    </div>

                                    {treeLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                                            <span className="ml-3 text-gray-300">
                                                Loading hierarchy...
                                            </span>
                                        </div>
                                    ) : requirementTree && requirementTree.length > 0 ? (
                                        <div className="space-y-2">
                                            {requirementTree.map((node) => (
                                                <div
                                                    key={node.requirementId}
                                                    className="flex items-center gap-3 p-4 bg-slate-700/30 rounded-xl border border-gray-600 hover:border-gray-500 transition-all"
                                                    style={{
                                                        marginLeft: `${node.depth * 24}px`,
                                                    }}
                                                >
                                                    {/* Depth Indicator */}
                                                    <div className="flex items-center gap-2">
                                                        {node.depth > 0 && (
                                                            <div className="flex items-center">
                                                                {Array.from({
                                                                    length: node.depth,
                                                                }).map((_, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="w-4 h-0.5 bg-gray-500 mr-1"
                                                                    />
                                                                ))}
                                                                <ArrowRight className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                        )}

                                                        {/* Node Icon */}
                                                        <div
                                                            className={`p-1.5 rounded-lg ${
                                                                node.depth === 0
                                                                    ? 'bg-emerald-500/20 text-emerald-300'
                                                                    : node.hasChildren
                                                                      ? 'bg-blue-500/20 text-blue-300'
                                                                      : 'bg-gray-500/20 text-gray-400'
                                                            }`}
                                                        >
                                                            {node.depth === 0 ? (
                                                                <Target className="h-3 w-3" />
                                                            ) : node.hasChildren ? (
                                                                <GitBranch className="h-3 w-3" />
                                                            ) : (
                                                                <div className="h-3 w-3 rounded-full bg-current opacity-60" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Requirement Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-xs font-mono ${
                                                                    node.depth === 0
                                                                        ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                                                                        : 'border-gray-400 text-gray-300'
                                                                }`}
                                                            >
                                                                {requirements?.find(
                                                                    (r) =>
                                                                        r.id ===
                                                                        node.requirementId,
                                                                )?.external_id ||
                                                                    node.requirementId.slice(
                                                                        0,
                                                                        8,
                                                                    )}
                                                            </Badge>
                                                            <h3 className="font-medium text-sm text-white truncate">
                                                                {node.title}
                                                            </h3>

                                                            {/* Depth Badge */}
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs bg-slate-600/50 text-gray-300"
                                                            >
                                                                L{node.depth}
                                                            </Badge>

                                                            {/* Children Count */}
                                                            {node.hasChildren && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-xs bg-blue-500/20 border-blue-400 text-blue-300"
                                                                >
                                                                    +children
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        {/* Path Display */}
                                                        {node.path && node.depth > 0 && (
                                                            <p className="text-xs text-gray-400 truncate">
                                                                Path: {node.path}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Quick Actions */}
                                                    <div className="flex items-center gap-2">
                                                        {node.hasChildren && (
                                                            <div className="px-2 py-1 bg-blue-500/10 rounded-md">
                                                                <span className="text-xs text-blue-300">
                                                                    Parent
                                                                </span>
                                                            </div>
                                                        )}
                                                        {node.parentId && (
                                                            <div className="px-2 py-1 bg-purple-500/10 rounded-md">
                                                                <span className="text-xs text-purple-300">
                                                                    Child
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-400">
                                            <Network className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                                            <p className="text-lg font-medium">
                                                No hierarchy found
                                            </p>
                                            <p className="text-sm">
                                                Create some relationships to see the tree
                                                structure
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="manage" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Manage Relationships</CardTitle>
                                        <CardDescription>
                                            Create and modify requirement dependencies
                                            using closure table
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Plus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
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
                            <GitBranch className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">
                                Select a project to get started
                            </p>
                            <p className="text-sm">
                                Choose a project from above to view and manage requirement
                                relationships
                            </p>
                        </div>
                    )}
                </Tabs>
            </div>
        </div>
    );
}
