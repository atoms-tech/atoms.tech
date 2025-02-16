import { useOrganization } from '@/hooks/queries/useOrganization';
import { useProject } from '@/hooks/queries/useProject';
import { useDocument } from '@/hooks/queries/useDocument';

export function useBreadcrumbData(segments: string[]) {
  // Extract IDs from segments
  const orgId = segments[1];
  const projectId = segments[2];
  const documentId = segments[4]; // If present

  // Use existing queries
  const { data: org } = useOrganization(orgId);
  const { data: project } = useProject(projectId);
  const { data: document } = useDocument(documentId);

  return {
    orgName: org?.name,
    projectName: project?.name,
    documentName: document?.name
  };
}
