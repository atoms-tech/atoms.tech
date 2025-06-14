'use client';

import { ChevronLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { FC } from 'react';
import { Fragment } from 'react';

import { Button } from '@/components/ui/button';
import { useDocument } from '@/hooks/queries/useDocument';
import { useOrganization } from '@/hooks/queries/useOrganization';
import { useProject } from '@/hooks/queries/useProject';
import { cn } from '@/lib/utils';

interface BreadcrumbProps {
    className?: string;
}

const Breadcrumb: FC<BreadcrumbProps> = ({ className }) => {
    const router = useRouter();
    const pathSegments = usePathname().split('/').filter(Boolean);

    const breadcrumbs: string[] = [];

    let orgId = '';
    let projectId = '';
    let documentId = '';

    for (let i = 0; i < pathSegments.length; i++) {
        switch (pathSegments[i]) {
            case 'org':
                i++;
                orgId = i < pathSegments.length ? pathSegments[i] : '';
                break;
            case 'project':
                i++;
                projectId = i < pathSegments.length ? pathSegments[i] : '';
                break;
            case 'documents':
                i++;
                documentId = i < pathSegments.length ? pathSegments[i] : '';
                break;
        }
    }

    const orgName =
        useOrganization(orgId).data?.name || 'Undefined Organization Name';
    const projectName =
        useProject(projectId).data?.name || 'Undefined Project Name';
    const documentName =
        useDocument(documentId).data?.name || 'Undefined Document Name';

    for (let i = 0; i < pathSegments.length; i++) {
        switch (pathSegments[i]) {
            case 'org':
                i++;
                breadcrumbs.push(orgName);
                break;
            case 'project':
                i++;
                breadcrumbs.push(projectName);
                break;
            case 'documents':
                i++;
                breadcrumbs.push(documentName);
                break;
            default:
                breadcrumbs.push(
                    pathSegments[i].charAt(0).toUpperCase() +
                        pathSegments[i].slice(1),
                );
        }
    }

    const goToParentPage = (pathSegments: string[]) => {
        pathSegments.pop();
        // Handles when the parent path cannot be routed to normally
        switch (pathSegments[pathSegments.length - 1]) {
            case 'org':
                pathSegments = ['home', 'user'];
                break;
            case 'project':
            case 'documents':
            case 'requirements':
                pathSegments.pop();
                break;
        }

        router.push('/' + pathSegments.join('/'));
    };

    return (
        <div
            className={cn(
                'flex items-center h-6 gap-1 px-2 bg-muted/50 rounded font-mono text-[10px] text-muted-foreground',
                className,
            )}
        >
            <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-transparent"
                onClick={() => goToParentPage(pathSegments)}
            >
                <ChevronLeft className="h-3 w-3" />
            </Button>
            {breadcrumbs.map((segment, index) => (
                <Fragment key={index}>
                    {index > 0 && <span className="opacity-40">/</span>}
                    <span className="hover:text-foreground cursor-default transition-colors">
                        {segment}
                    </span>
                </Fragment>
            ))}
        </div>
    );
};

export default Breadcrumb;
