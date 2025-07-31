// Mutation of DataTableRow.tsx but decoupled from EditableData implementation.

import { ArrowUpRight, History } from 'lucide-react';
//import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';

import {
    /*CellValue,*/ EditableColumn,
} from '@/components/custom/BlockCanvas/components/EditableTable/types';
//import { RequirementAiAnalysis } from '@/types/base/requirements.types';
import { DynamicRequirement } from '@/components/custom/BlockCanvas/hooks/useRequirementActions';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useDocumentStore } from '@/store/document.store';

interface Props {
    requirement: DynamicRequirement | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    columns: Array<EditableColumn<DynamicRequirement>>;
}

export const RequirementAnalysisSidebar: React.FC<Props> = ({
    requirement,
    open,
    onOpenChange,
    columns,
}) => {
    const router = useRouter();
    const params = useParams();
    const orgId = params.orgId as string;
    const projectId = params.projectId as string;
    const { currentDocument } = useDocumentStore();

    if (!requirement) return null;

    const handleNavigateToRequirement = () => {
        router.push(`/org/${orgId}/project/${projectId}/requirements/${requirement.id}`);
    };

    const handleNavigateToTrace = () => {
        const documentId = currentDocument?.id || params.documentId;
        router.push(
            `/org/${orgId}/project/${projectId}/requirements/${requirement.id}/trace?documentId=${documentId}`,
        );
    };

    const handleNavigateToDiagram = () => {
        const description = String(requirement['Description'] || '');
        if (typeof window !== 'undefined') {
            const documentId = (currentDocument?.id || params.documentId) as string;
            sessionStorage.setItem('pendingDiagramPrompt', description);
            sessionStorage.setItem('pendingDiagramRequirementId', requirement.id);
            sessionStorage.setItem('pendingDiagramDocumentId', documentId);
        }
        const ts = Date.now();
        router.push(`/org/${orgId}/project/${projectId}/canvas?ts=${ts}`);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className="font-mono p-0 gap-0 bg-background/90 border-l shadow-none overflow-scroll"
                data-overlay-disabled
            >
                <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-muted">
                    <div className="px-6 py-4">
                        <SheetHeader className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-[10px] tabular-nums tracking-widest text-muted-foreground">
                                    {String(columns.length).padStart(2, '0')}
                                </div>
                                <SheetTitle className="text-sm font-mono tracking-tight">
                                    REQ-{requirement.id}
                                </SheetTitle>
                            </div>
                        </SheetHeader>
                        <div className="mt-4 flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="group h-8 px-4 text-[10px] font-medium tracking-widest rounded-none border hover:bg-accent transition-all duration-200"
                                onClick={handleNavigateToRequirement}
                            >
                                <span className="text-muted-foreground group-hover:text-accent-foreground transition-colors">
                                    ANALYZE
                                </span>
                                <ArrowUpRight className="ml-2 h-3 w-3 text-muted-foreground/70 group-hover:text-accent-foreground/70 transition-colors" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="group h-8 px-4 text-[10px] font-medium tracking-widest rounded-none border hover:bg-accent transition-all duration-200"
                                onClick={handleNavigateToTrace}
                            >
                                <span className="text-muted-foreground group-hover:text-accent-foreground transition-colors">
                                    TRACE
                                </span>
                                <ArrowUpRight className="ml-2 h-3 w-3 text-muted-foreground/70 group-hover:text-accent-foreground/70 transition-colors" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="group h-8 px-4 text-[10px] font-medium tracking-widest rounded-none border hover:bg-accent transition-all duration-200"
                                onClick={handleNavigateToDiagram}
                            >
                                <span className="text-muted-foreground group-hover:text-accent-foreground transition-colors">
                                    DIAGRAM
                                </span>
                                <ArrowUpRight className="ml-2 h-3 w-3 text-muted-foreground/70 group-hover:text-accent-foreground/70 transition-colors" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="px-6 mb-8">
                    {columns.map((column, index) => (
                        <div
                            key={String(column.accessor)}
                            className="py-3 grid grid-cols-[1fr,auto] gap-4 group hover:bg-muted/50 -mx-6 px-6 transition-all duration-200"
                        >
                            <div className="space-y-0.5">
                                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                                    {column.header}
                                </div>
                                <div className="text-sm tracking-tight">
                                    {String(requirement[column.accessor] || '—')}
                                </div>
                            </div>
                            <div className="self-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="text-[10px] tabular-nums text-muted-foreground/60">
                                    {String(index + 1).padStart(2, '0')}
                                </div>
                            </div>
                        </div>
                    ))}

                    {requirement.ai_analysis?.descriptionHistory?.length ? (
                        <div className="border-t border-dashed border-muted mt-4 pt-4">
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-4">
                                Description History
                            </div>
                            <div className="relative">
                                <div className="absolute top-0 bottom-0 left-[11px] border-l border-dotted border-muted-foreground/40" />
                                {[...(requirement.ai_analysis?.descriptionHistory ?? [])]
                                    .reverse()
                                    .map((historyItem) => {
                                        const date = new Date(historyItem.createdAt);
                                        const formattedDate = new Intl.DateTimeFormat(
                                            'en-US',
                                            {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            },
                                        ).format(date);

                                        return (
                                            <div
                                                key={historyItem.createdAt}
                                                className="flex mb-6 last:mb-0 relative"
                                            >
                                                <div className="mr-4 z-10">
                                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                                                        <History className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-[10px] text-muted-foreground mb-1">
                                                        <span>{formattedDate}</span>
                                                        {historyItem.createdBy && (
                                                            <span className="ml-2 font-medium">
                                                                by {historyItem.createdBy}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm bg-muted/40 p-3 rounded-md">
                                                        {historyItem.description}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    ) : null}
                </div>
            </SheetContent>
        </Sheet>
    );
};
