'use client';

import { ChevronLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

import { Button } from '@/components/ui/button';
import { useBreadcrumbData } from '@/hooks/useBreadcrumbData';
import { cn } from '@/lib/utils';

interface BreadcrumbProps {
    className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ className }) => {
    const router = useRouter();
    const pathname = usePathname();
    const pathSegments = pathname.split('/').filter(Boolean);

    // Get entity names from React Query cache
    const { orgName, projectName, documentName } =
        useBreadcrumbData(pathSegments);

    const getBreadcrumbs = () => {
        if (pathSegments.length >= 3) {
            const section = pathSegments[3];

            if (pathSegments.length >= 4) {
                if (section === 'documents' && documentName) {
                    return [
                        projectName || 'Project',
                        'Documents',
                        documentName,
                    ];
                } else if (section === 'requirements') {
                    return [
                        projectName || 'Project',
                        'Requirements',
                        pathSegments[4],
                    ];
                }
            }

            return ['Project', projectName || 'Loading...'];
        }

        return pathSegments.map((segment) => {
            if (segment === pathSegments[1]) return orgName || 'Organization';
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
                <React.Fragment key={index}>
                    {index > 0 && <span className="opacity-40">/</span>}
                    <span className="hover:text-foreground cursor-default transition-colors">
                        {segment}
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
};

export default Breadcrumb;
