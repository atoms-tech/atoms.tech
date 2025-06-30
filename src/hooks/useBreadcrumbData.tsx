import { useEffect, useState } from 'react';

import { getCookie } from '@/app/(protected)/org/actions';
import { useDocument } from '@/hooks/queries/useDocument';
import { useOrganization } from '@/hooks/queries/useOrganization';
import { useProject } from '@/hooks/queries/useProject';

export function useBreadcrumbData(segments: string[]) {
    // State to store the preferred organization ID from cookie
    const [_preferredOrgId, setPreferredOrgId] = useState<string | null>(null);

    // Fetch the preferred organization ID from cookie
    useEffect(() => {
        const fetchPreferredOrgId = async () => {
            const cookie = await getCookie('preferred_org_id');
            setPreferredOrgId(cookie?.value || null);
        };

        fetchPreferredOrgId();
    }, []);

    // Extract IDs from segments based on the new URL structure
    let orgId = '';
    let projectId = '';
    let documentId = '';

    // Handle different URL patterns
    if (segments[0] === 'org') {
        if (segments[2] === 'project' && segments.length >= 3) {
            // New structure: /org/[orgId]/project/[projectId]/...
            orgId = segments[1];
            projectId = segments[3];

            if (segments[4] === 'documents' && segments.length >= 5) {
                documentId = segments[5];
            }
        } else if (segments.length >= 2) {
            // Old structure: /org/[orgId]/...
            orgId = segments[1];

            if (segments.length >= 3) {
                if (segments[2] === 'externalDocs') {
                    projectId = '';
                } else {
                    projectId = segments[2];

                    if (segments.length >= 5 && segments[3] === 'documents') {
                        documentId = segments[4];
                    }
                }
            }
        }
    }

    // Use existing queries with appropriate safeguards
    const { data: org } = useOrganization(orgId || '');
    const { data: project } = useProject(projectId || '');
    const { data: document } = useDocument(documentId || '');

    return {
        orgName: org?.name,
        projectName: project?.name,
        documentName: document?.name,
    };
}
