import { getClient as getSupabaseClient } from './adapters/supabase.client';
import { createAuthDomain } from './domains/auth';
import { createOrganizationsDomain } from './domains/organizations';
import { createProjectsDomain } from './domains/projects';
import { createPipelinesDomain } from './domains/pipelines';
import { createOcrDomain } from './domains/ocr';
import { createOrgInvitationsDomain } from './domains/orgInvitations';
import { createDocumentsDomain } from './domains/documents';
import { createPropertiesDomain } from './domains/properties';
import { createRequirementsDomain } from './domains/requirements';
import { createTraceLinksDomain } from './domains/traceLinks';
import { createAssignmentsDomain } from './domains/assignments';
import { createAuditLogsDomain } from './domains/auditLogs';
import { createNotificationsDomain } from './domains/notifications';
import { createExternalDocumentsDomain } from './domains/externalDocuments';
import { createRealtimeDomain } from './domains/realtime';
import { createTestingDomain } from './domains/testing';
import { createTestMatrixViewsDomain } from './domains/testMatrixViews';
import { createRecentDomain } from './domains/recent';
import { createStorageDomain } from './domains/storage';
import { createDiagramsDomain } from './domains/diagrams';

export function atomsApiClient() {
  const supabase = getSupabaseClient();

    return {
    auth: createAuthDomain(supabase),
    organizations: createOrganizationsDomain(supabase),
    projects: createProjectsDomain(supabase),
    pipelines: createPipelinesDomain(supabase),
    ocr: createOcrDomain(supabase),
    orgInvitations: createOrgInvitationsDomain(supabase),
    documents: createDocumentsDomain(supabase),
    properties: createPropertiesDomain(supabase),
    requirements: createRequirementsDomain(supabase),
    traceLinks: createTraceLinksDomain(supabase),
    assignments: createAssignmentsDomain(supabase),
    auditLogs: createAuditLogsDomain(supabase),
    notifications: createNotificationsDomain(supabase),
    externalDocuments: createExternalDocumentsDomain(supabase),
    realtime: createRealtimeDomain(supabase),
    testing: createTestingDomain(supabase),
    testMatrixViews: createTestMatrixViewsDomain(supabase),
      recent: createRecentDomain(supabase),
      storage: createStorageDomain(),
      diagrams: createDiagramsDomain(supabase),
    };
  }

export type AtomsApiClient = ReturnType<typeof atomsApiClient>;
