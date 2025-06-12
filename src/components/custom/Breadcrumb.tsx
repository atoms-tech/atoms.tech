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

    const breadcrumbs: string[] = [];

    for (let i = 0; i < pathSegments.length; i++) {
        switch (pathSegments[i]) {
            case 'org':
                i++;
                breadcrumbs.push(orgName || 'Undefined Organization Name');
                break;
            case 'project':
                i++;
                breadcrumbs.push(projectName || 'Undefined Project Name');
                break;
            case 'documents':
                i++;
                breadcrumbs.push(documentName || 'Undefined Document Name');
                break;
            default:
                breadcrumbs.push(pathSegments[i].charAt(0).toUpperCase() + pathSegments[i].slice(1));
        }
    }

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
