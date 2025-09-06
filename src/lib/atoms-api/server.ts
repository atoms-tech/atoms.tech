import { getClient as getSupabaseClient } from './adapters/supabase.server';
import { createAssignmentsDomain } from './domains/assignments';
import { createAuditLogsDomain } from './domains/auditLogs';
import { createAuthDomain } from './domains/auth';
import { createDiagramsDomain } from './domains/diagrams';
import { createDocumentsDomain } from './domains/documents';
import { createExternalDocumentsDomain } from './domains/externalDocuments';
import { createNotificationsDomain } from './domains/notifications';
import { createOcrDomain } from './domains/ocr';
import { createOrgInvitationsDomain } from './domains/orgInvitations';
import { createOrganizationsDomain } from './domains/organizations';
import { createPipelinesDomain } from './domains/pipelines';
import { createProjectsDomain } from './domains/projects';
import { createPropertiesDomain } from './domains/properties';
import { createRealtimeDomain } from './domains/realtime';
import { createRecentDomain } from './domains/recent';
import { createRequirementsDomain } from './domains/requirements';
import { createStorageDomain } from './domains/storage';
import { createTestMatrixViewsDomain } from './domains/testMatrixViews';
import { createTestingDomain } from './domains/testing';
import { createTraceLinksDomain } from './domains/traceLinks';

export async function atomsApiServer() {
    const supabase = await getSupabaseClient();

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

export type AtomsApiServer = Awaited<ReturnType<typeof atomsApiServer>>;
