import DashboardView, { Column } from '@/components/base/DashboardView';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { Requirement } from '@/types';
import { RequirementSchema } from '@/types/validation';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

type ProjectDashboardProps = {
    projectSlug: string;
};

export default function ProjectDashboard({
    projectSlug,
}: ProjectDashboardProps) {
    const router = useRouter();

    const { data: project, isLoading: projectLoading } = useQuery({
        queryKey: ['project', projectSlug],
        queryFn: async () => {
            const { data: project } = await supabase
                .from('projects')
                .select('*')
                .eq('slug', projectSlug)
                .single();

            if (!project) {
                throw new Error('Project not found');
            }

            return project;
        },
    });

    const { data: documents, isLoading: documentsLoading } = useQuery({
        queryKey: ['documents', project?.id],
        queryFn: async () => {
            if (!project?.id) return [];
            const { data: documents } = await supabase
                .from('documents')
                .select('*')
                .eq('project_id', project.id)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            return documents || [];
        },
        enabled: !!project?.id,
    });

    const { data: requirements, isLoading: requirementsLoading } = useQuery({
        queryKey: ['requirements', projectSlug],
        queryFn: async () => {
            // First get the project ID from the slug
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('slug', projectSlug)
                .single();

            console.log('Project', project);

            if (!project) {
                throw new Error('Project not found');
            }

            // Get all documents belonging to the project
            const { data: docIds } = await supabase
                .from('documents')
                .select('id')
                .eq('project_id', project.id);

            console.log('Documents', docIds);

            // If no documents found, return empty array
            if (!docIds?.length) {
                return [];
            }

            // Get last 5 modified requirements belonging to the documents
            const { data: requirements } = await supabase
                .from('requirements')
                .select('*')
                .in(
                    'document_id',
                    docIds.map((doc) => doc.id),
                )
                .order('updated_at', { ascending: false })
                .limit(5);

            console.log('Requirements', requirements);

            if (!requirements?.length) {
                return [];
            }

            return requirements.map((requirement) =>
                RequirementSchema.parse(requirement),
            );
        },
    });

    const columns: Column<Requirement>[] = [
        {
            header: 'Name',
            accessor: (item: Requirement) => item.name,
        },
        {
            header: 'Priority',
            accessor: (item: Requirement) => item.priority,
            renderCell: (item: Requirement) => (
                <Badge
                    variant="outline"
                    className={
                        item.priority === 'high'
                            ? 'border-red-500 text-red-500'
                            : item.priority === 'medium'
                              ? 'border-yellow-500 text-yellow-500'
                              : 'border-blue-500 text-blue-500'
                    }
                >
                    {item.priority}
                </Badge>
            ),
        },
        {
            header: 'Status',
            accessor: (item: Requirement) => item.status,
            renderCell: (item: Requirement) => (
                <Badge
                    variant="outline"
                    className={
                        item.status === 'active'
                            ? 'border-green-500 text-green-500'
                            : item.status === 'draft'
                              ? 'border-gray-500 text-gray-500'
                              : 'border-yellow-500 text-yellow-500'
                    }
                >
                    {item.status}
                </Badge>
            ),
        },
        {
            header: 'Format',
            accessor: (item: Requirement) => item.format,
        },
    ];

    const handleRowClick = (item: Requirement) => {
        router.push(`/req/${item.id}`);
    };

    const isLoading = projectLoading || documentsLoading || requirementsLoading;

    return (
        <div className="p-6 space-y-8">
            {/* Project Details */}
            <div className="space-y-4">
                <h1 className="text-3xl font-bold">{project?.name}</h1>
                {project?.description && (
                    <p className="text-muted-foreground">
                        {project.description}
                    </p>
                )}
                <div className="flex items-center gap-2">
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
                    <Badge variant="outline">{project?.visibility}</Badge>
                </div>
            </div>

            {/* Documents List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Documents</h2>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/doc/new`)}
                    >
                        Add Document
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents?.map((doc) => (
                        <div
                            key={doc.id}
                            className="p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors"
                            onClick={() => router.push(`/doc/${doc.id}`)}
                        >
                            <h3 className="font-medium truncate">{doc.name}</h3>
                            {doc.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {doc.description}
                                </p>
                            )}
                        </div>
                    ))}
                    {documents?.length === 0 && !isLoading && (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                            No documents found
                        </div>
                    )}
                </div>
            </div>

            {/* Requirements List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                    Recently Modified Requirements
                </h2>
                <DashboardView
                    data={requirements || []}
                    columns={columns}
                    isLoading={isLoading}
                    onRowClick={handleRowClick}
                    emptyMessage="No requirements found for this project."
                />
            </div>
        </div>
    );
}
