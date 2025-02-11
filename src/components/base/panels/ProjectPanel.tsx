import type { Column } from '@/components/private';
import { RequirementPanel, TableManager } from '@/components/private';
import { Badge } from '@/components/ui/badge';
import { useRequirements } from '@/hooks/db/useRequirements';
import { useRequirementStore } from '@/lib/store/requirementStore';
import type { Project, Requirement } from '@/types';
import { CalendarIcon, Tags } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProjectPanelProps {
    project: Project;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed':
            return 'border-green-500 text-green-500';
        case 'active':
            return 'border-blue-500 text-blue-500';
        case 'on_hold':
            return 'border-yellow-500 text-yellow-500';
        case 'archived':
            return 'border-gray-500 text-gray-500';
        default:
            return 'border-muted text-muted-foreground';
    }
};

const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
};

export default function ProjectPanel({ project }: ProjectPanelProps) {
    const router = useRouter();
    const {
        requirements = [],
        isLoading,
        deleteRequirement,
        updateRequirement,
    } = useRequirements(project.id);
    const { selectRequirement } = useRequirementStore();

    const requirementColumns: Column<Requirement>[] = [
        {
            header: 'Title',
            accessor: (row) => row.title,
            width: 200,
        },
        {
            header: 'Status',
            accessor: (row) => row.status,
            width: 100,
        },
        {
            header: 'Priority',
            accessor: (row) => row.priority,
            width: 100,
        },
    ];

    const handleRequirementSelect = (requirement: Requirement) => {
        selectRequirement(requirement.id);
    };

    const handleGoToRequirement = (requirement: Requirement) => {
        router.push(`/projects/requirements/${requirement.id}`);
    };

    const handleRequirementDelete = async (requirement: Requirement) => {
        await deleteRequirement(requirement.id);
    };

    const handleRequirementUpdate = async (updatedRequirement: Requirement) => {
        try {
            await updateRequirement(updatedRequirement);
        } catch (error) {
            console.error('Error updating requirement:', error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold">{project.name}</h2>
                    </div>
                    <Badge
                        variant="outline"
                        className={getStatusColor(project.status)}
                    >
                        {project.status}
                    </Badge>
                    <p className="text-muted-foreground">
                        {project.description}
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold flex items-center">
                            <CalendarIcon className="mr-2 h-5 w-5" /> Project
                            Timeline
                        </h3>
                        <p className="text-muted-foreground">
                            Start Date: {formatDate(project.start_date)}
                        </p>
                        <p className="text-muted-foreground">
                            Target End Date:{' '}
                            {formatDate(project.target_end_date)}
                        </p>
                        {project.actual_end_date && (
                            <p className="text-muted-foreground">
                                Actual End Date:{' '}
                                {formatDate(project.actual_end_date)}
                            </p>
                        )}
                    </div>

                    {project.tags && project.tags.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold flex items-center">
                                <Tags className="mr-2 h-5 w-5" /> Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {project.tags.map(
                                    (tag: string, index: number) => (
                                        <Badge key={index} variant="secondary">
                                            {tag}
                                        </Badge>
                                    ),
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8">
                <TableManager
                    title="Requirements"
                    description="Manage project requirements"
                    data={requirements}
                    isLoading={isLoading}
                    columns={requirementColumns}
                    onItemSelect={handleRequirementSelect}
                    handleGoToPage={handleGoToRequirement}
                    onItemDelete={handleRequirementDelete}
                    renderGridItem={(item) => (
                        <div className="p-4 border rounded-lg">
                            <h3 className="font-semibold">{item.title}</h3>
                            <Badge variant="outline" className="mt-2">
                                {item.status}
                            </Badge>
                        </div>
                    )}
                    renderDetails={(item) => (
                        <RequirementPanel
                            requirement={item}
                            onUpdate={handleRequirementUpdate}
                        />
                    )}
                    searchPlaceholder="Search requirements..."
                    emptyMessage="No requirements found for this project."
                />
            </div>
        </div>
    );
}
