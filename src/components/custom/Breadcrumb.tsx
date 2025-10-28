'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import type { FC } from 'react';
import { Fragment } from 'react';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useDocument } from '@/hooks/queries/useDocument';
import { useOrganization } from '@/hooks/queries/useOrganization';
import { useProject } from '@/hooks/queries/useProject';

interface BreadcrumbProps {
    className?: string;
}

// Custom BreadCrumb component. It's capitalized in order to avoid name conflict with shadcn/ui component.
const BreadCrumb: FC<BreadcrumbProps> = () => {
    const pathSegments = usePathname().split('/').filter(Boolean);

    const params = useParams<{ orgId: string; projectId: string; documentId: string }>();

    const orgId = params?.orgId;
    const projectId = params?.projectId;
    const documentId = params?.documentId;

    const orgName = useOrganization(orgId).data?.name || 'Undefined Organization Name';
    const projectName = useProject(projectId).data?.name || 'Undefined Project Name';
    const documentName = useDocument(documentId).data?.name || 'Undefined Document Name';

    const breadcrumbs: { label: string; link: string }[] = [];

    // Handle edge cases to route correctly
    for (let i = 0; i < pathSegments.length; i++) {
        switch (pathSegments[i]) {
            case 'org':
                i++;
                breadcrumbs.push({
                    label: orgName,
                    link: '/' + pathSegments.slice(0, i + 1).join('/'),
                });
                break;
            case 'project':
                i++;
                breadcrumbs.push({
                    label: projectName,
                    link: '/' + pathSegments.slice(0, i + 1).join('/'),
                });
                break;
            case 'documents':
                i++;
                breadcrumbs.push({
                    label: documentName,
                    link: '/' + pathSegments.slice(0, i + 1).join('/'),
                });
                break;
            case 'requirements':
                break;
            default:
                breadcrumbs.push({
                    label:
                        pathSegments[i].charAt(0).toUpperCase() +
                        pathSegments[i].slice(1),
                    link: '/' + pathSegments.slice(0, i + 1).join('/'),
                });
        }
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {breadcrumbs.map((segment, index, array) => (
                    <Fragment key={segment.label}>
                        <BreadcrumbItem>
                            {index !== array.length - 1 ? (
                                <BreadcrumbLink asChild>
                                    <Link href={segment.link}>{segment.label}</Link>
                                </BreadcrumbLink>
                            ) : (
                                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                        {index !== array.length - 1 && <BreadcrumbSeparator />}
                    </Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
};

export default BreadCrumb;
