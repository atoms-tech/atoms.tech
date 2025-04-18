'use client';

import { ArrowDown, ArrowUp, FileBox, FolderArchive } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjectDocuments } from '@/hooks/queries/useDocument';
import { useProject } from '@/lib/providers/project.provider';
import { Document } from '@/types/base/documents.types';

import ProjectMembers from './ProjectMembers';

// Dynamically import the CreatePanel with no SSR
const CreatePanel = dynamic(
    () =>
        import('@/components/base/panels/CreatePanel').then(
            (mod) => mod.CreatePanel,
        ),
    {
        ssr: false,
        loading: () => (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
                Loading...
            </div>
        ),
    },
);

export default function ProjectPage() {
    const router = useRouter();
    const params = useParams<{ orgId: string; projectId: string }>();
    const { project } = useProject();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | null>(
        null,
    );
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showCreateDocumentPanel, setShowCreateDocumentPanel] =
        useState(false);
    const { data: documents, isLoading: documentsLoading } =
        useProjectDocuments(project?.id || '');

    useEffect(() => {
        // Trigger refetch of users in ProjectMembers when the dashboard loads
        const projectMembersComponent = document.querySelector(
            '[data-component="ProjectMembers"]',
        );
        if (projectMembersComponent) {
            projectMembersComponent.dispatchEvent(new CustomEvent('refetch'));
        }
    }, []);

    const handleDocumentClick = (doc: Document) => {
        router.push(
            `/org/${params.orgId}/project/${params.projectId}/documents/${doc.id}`,
        );
    };

    const sortedDocuments = [...(documents || [])].sort((a, b) => {
        if (!sortBy) return 0;
        const dateA =
            sortBy && a[sortBy] ? new Date(a[sortBy] as string).getTime() : 0;
        const dateB =
            sortBy && b[sortBy] ? new Date(b[sortBy] as string).getTime() : 0;
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const filteredDocuments = sortedDocuments.filter((doc) =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Project Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        {project?.name || 'Project Dashboard'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {project?.description ||
                            'Manage your project resources and details'}
                    </p>
                </div>
            </div>

            {/* Tabs Menu */}
            <Tabs
                defaultValue="overview"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger
                        value="overview"
                        className="flex items-center gap-2"
                    >
                        <FolderArchive className="h-4 w-4" />
                        <span>Overview</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="documents"
                        className="flex items-center gap-2"
                    >
                        <FileBox className="h-4 w-4" />
                        <span>Documents</span>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Project Details</CardTitle>
                                    <CardDescription>
                                        Basic information about your project
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Name:
                                            </span>
                                            <span className="font-medium">
                                                {project?.name}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Status:
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    project?.status === 'active'
                                                        ? 'border-green-500 text-green-500'
                                                        : 'border-gray-500 text-gray-500'
                                                }
                                            >
                                                {project?.status}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">
                                                Visibility:
                                            </span>
                                            <span className="font-medium">
                                                {project?.visibility}
                                            </span>
                                        </div>
                                        {project?.description && (
                                            <div>
                                                <span className="text-muted-foreground">
                                                    Description:
                                                </span>
                                                <p className="mt-1">
                                                    {project.description}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <ProjectMembers
                                projectId={project?.id || ''}
                                data-component="ProjectMembers"
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <div className="flex w-full md:w-auto space-x-2">
                            <Input
                                type="text"
                                placeholder="Search documents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full md:w-64"
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="default"
                                        className="w-9 h-9"
                                    >
                                        <FolderArchive className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {['created_at', 'updated_at'].map(
                                        (field) => (
                                            <DropdownMenuItem
                                                key={field}
                                                onSelect={(e) =>
                                                    e.preventDefault()
                                                } // Prevent menu from closing
                                                onClick={() => {
                                                    setSortBy(
                                                        field as
                                                            | 'created_at'
                                                            | 'updated_at',
                                                    );
                                                    setSortOrder((prev) =>
                                                        prev === 'desc'
                                                            ? 'asc'
                                                            : 'desc',
                                                    );
                                                }}
                                            >
                                                <span
                                                    className={`mr-2 inline-block w-4 h-4 rounded-full ${
                                                        sortBy === field
                                                            ? 'bg-primary'
                                                            : 'bg-gray-200'
                                                    }`}
                                                ></span>
                                                {field.replace('_', ' ')}
                                                {sortBy === field &&
                                                    (sortOrder === 'desc' ? (
                                                        <ArrowUp className="ml-2 w-4 h-4 text-primary" />
                                                    ) : (
                                                        <ArrowDown className="ml-2 w-4 h-4 text-primary" />
                                                    ))}
                                            </DropdownMenuItem>
                                        ),
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <Button
                            variant="default"
                            onClick={() => setShowCreateDocumentPanel(true)}
                        >
                            Add Requirement Document
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDocuments?.map((doc) => (
                            <div
                                key={doc.id}
                                className="p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                                onClick={() => handleDocumentClick(doc)}
                            >
                                <h3 className="font-medium truncate">
                                    {doc.name}
                                </h3>
                                {doc.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                        {doc.description}
                                    </p>
                                )}
                            </div>
                        ))}
                        {filteredDocuments?.length === 0 &&
                            !documentsLoading && (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    No documents found
                                </div>
                            )}
                    </div>
                </TabsContent>
            </Tabs>

            {showCreateDocumentPanel && (
                <CreatePanel
                    isOpen={true}
                    projectId={project?.id || ''}
                    onClose={() => setShowCreateDocumentPanel(false)}
                    showTabs="document"
                />
            )}
        </div>
    );
}
