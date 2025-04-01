'use client';

import { ChevronLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { FC } from 'react';
import { Fragment } from 'react';

import { Button } from '@/components/ui/button';
import { useBreadcrumbData } from '@/hooks/useBreadcrumbData';
import { cn } from '@/lib/utils';

interface BreadcrumbProps {
    className?: string;
}

const Breadcrumb: FC<BreadcrumbProps> = ({ className }) => {
    const router = useRouter();
    const pathname = usePathname();
    const pathSegments = pathname.split('/').filter(Boolean);

    // Always call useBreadcrumbData
    const { orgName, projectName, documentName } =
        useBreadcrumbData(pathSegments);

    const getBreadcrumbs = () => {
        // Handle the new URL structure
        if (
            pathSegments[0] === 'org' &&
            pathSegments[1] === 'project' &&
            pathSegments.length >= 3
        ) {
            // New structure: /org/[orgId]/project/[projectId]/...
            const section = pathSegments[3];

            if (pathSegments.length >= 4) {
                if (section === 'documents' && documentName) {
                    return [
                        orgName || 'Organization',
                        projectName || 'Project',
                        'Documents',
                        documentName,
                    ];
                } else if (section === 'requirements') {
                    return [
                        orgName || 'Organization',
                        projectName || 'Project',
                        'Requirements',
                        pathSegments[4],
                    ];
                }
            }

            return [orgName || 'Organization', projectName || 'Project'];
        }

        // Handle the old URL structure
        if (pathSegments.length >= 3) {
            const section = pathSegments[3];

            if (pathSegments[2] === 'externalDocs') {
                return [orgName || 'Organization', 'External Docs'];
            }

            if (pathSegments.length >= 4) {
                if (section === 'documents' && documentName) {
                    return [
                        orgName || 'Organization',
                        projectName || 'Project',
                        'Documents',
                        documentName,
                    ];
                } else if (section === 'requirements') {
                    return [
                        orgName || 'Organization',
                        projectName || 'Project',
                        'Requirements',
                        pathSegments[4],
                    ];
                }
            }

            return [orgName || 'Organization', projectName || 'Project'];
        }

        // Default case - just show the path segments with proper formatting
        return pathSegments.map((segment, index) => {
            if (segment === 'org') return 'Organization';
            if (segment === 'project') return 'Project';
            if (index === 1 && pathSegments[0] === 'org')
                return orgName || 'Organization';
            if (index === 2 && pathSegments[1] === 'project')
                return projectName || 'Project';
            return segment.charAt(0).toUpperCase() + segment.slice(1);
        });
    };

    const breadcrumbs = getBreadcrumbs();

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
                onClick={() => router.back()}
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
