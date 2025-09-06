Atoms API

Atoms API is a lightweight client/server domain layer that centralizes data access. Each domain wraps Supabase queries (and related logic) behind small, typed methods. The goals are:

- Eliminate direct Supabase usage in UI code
- Keep persistence logic in one place
- Provide consistent error handling and easy-to-test modules

Getting Started

- Client-side:
  import { atomsApiClient } from '@/lib/atoms-api';
  const api = atomsApiClient();
  const docs = await api.documents.listWithFilters({ project_id: projectId });
  const reqs = await api.requirements.listByDocument(documentId);
  const diagrams = await api.diagrams.listByProject(projectId);

- Server-side:
  import { atomsApiServer } from '@/lib/atoms-api/server';
  const api = atomsApiServer();
  await api.projects.create({ name, slug, organization_id: orgId } as any);
  await api.diagrams.upsert({ id, project_id: projectId, organization_id: orgId, name, diagram_data } as any);

Client vs Server

- Use `atomsApiClient()` in React components and client-side hooks.
- Use `atomsApiServer()` in route handlers, server components, and server-only utilities.
- Both expose the same domain methods. Some operations (e.g., storage writes) are intended for server usage and are documented accordingly.

Error Handling

- All domains use `normalizeError` and throw `ApiErrorClass` consistently.
- Catch errors at the call-site and render user-friendly UI states, or let your error boundaries handle them.

Types and Tables

- The generated types live under `src/types/base/database.types.ts`.
- Use `Tables<'table'>`, `TablesInsert<'table'>`, and `TablesUpdate<'table'>` when building new domain methods.

Available Domains (overview)

- auth: `getUser`, `getProfile`, `getByEmail`, `updateProfile`, `listProfiles`, `setApproval`
- organizations: `getById`, `listWithFilters`, `create`, `listMembers`, `addMember`, `removeMember`, `setMemberRole`, `updateMemberCount`, `listForUser`, `listIdsByMembership`, `getPersonalOrg`
- projects: `getById`, `listWithFilters`, `create`, `update`, `softDelete`, `listMembers`, `addMember`, `setMemberRole`, `removeMember`, `listByOrg`, `listForUser`, `listByMembershipForOrg`
- documents: `getById`, `listWithFilters`, `create`, `update`, `softDelete`, `listBlocks`, `getBlockById`, `createBlock`, `updateBlock`, `softDeleteBlock`, `createColumn`, `deleteColumn`, `listColumnsByBlockIds`
- requirements: `getById`, `listWithFilters`, `listByProject`, `listByDocument`, `listByBlock`, `listByBlockIds`, `listByIds`, `create`, `update`, `softDelete`
- properties: `listByDocument`, `listOrgBase`, `createMany`, `getById`, `update`, `softDelete`, `updatePositions`
- testing: `listProjectTests`, `getTestsByIds`, `listRelationsByTest`, `listRelationsByRequirement`, `listRelationsByTests`, `createTest`, `updateTest`, `softDeleteTest`, `createRelation`, `updateRelation`, `deleteRelation`
- testMatrixViews: `listByProject`, `insert`, `update`, `softDelete`, `getById`, `getDefault`, `getFirstActive`, `unsetDefaults`
- recent: `documentsByOrgIds`, `projectsByOrgIds`, `requirementsByOrgIds`
- externalDocuments: `create` (metadata), `upload` (server/CSR routed), `update`, `remove`, `getPublicUrl`
- storage: `getPublicUrl(bucket, path)` (CSR-safe URL construction)
- diagrams: `listByProject`, `getById`, `updateName`, `delete`, `upsert`

Domain Usage Examples

- Auth:
  const user = await api.auth.getUser();
  const profile = user?.id ? await api.auth.getProfile(user.id) : null;
  await api.auth.updateProfile(user!.id, { full_name: 'Ada Lovelace' } as any);
  const list = await api.auth.listProfiles();
  await api.auth.setApproval(user!.id, true);

- Organizations:
  const org = await api.organizations.getById(orgId);
  const members = await api.organizations.listMembers(orgId);
  await api.organizations.addMember({ organization_id: orgId, user_id, role: 'member', status: 'active' } as any);
  await api.organizations.setMemberRole(orgId, user_id, 'admin');
  await api.organizations.updateMemberCount(orgId);

- Projects:
  const p = await api.projects.create({ name, slug, organization_id: orgId } as any);
  await api.projects.update(p.id, { description: 'New desc' } as any);
  await api.projects.addMember(p.id, user_id, 'editor', orgId);
  const projMembers = await api.projects.listMembers(p.id);

- Documents:
  const doc = await api.documents.create({ name: 'Spec', project_id: projectId } as any);
  const blocks = await api.documents.listBlocks(doc.id);
  const col = await api.documents.createColumn({ block_id, property_id, position: 0 } as any);

- Requirements:
  const reqs = await api.requirements.listByDocument(doc.id);
  const r = await api.requirements.create({ document_id: doc.id, name: 'Req A', block_id } as any);
  await api.requirements.update(r.id, { status: 'active' } as any);
  await api.requirements.softDelete(r.id, userId);

- Properties:
  const created = await api.properties.createMany([{ name: 'Priority', org_id: orgId, property_type: 'select' } as any]);
  const prop = await api.properties.getById(created[0].id);
  await api.properties.update(prop!.id, { options: { values: ['P0','P1'] } } as any);

- Diagrams:
  const diags = await api.diagrams.listByProject(projectId);
  const diag = await api.diagrams.getById(diagramId);
  await api.diagrams.updateName(diagramId, 'New Name');
  await api.diagrams.upsert({ id: diagramId, project_id: projectId, organization_id: orgId, diagram_data } as any);

Storage

- Public URLs do not need SDK calls in CSR: `api.storage.getPublicUrl(bucket, path)`.
- For external documents (uploads/deletes), call from SSR (server components/route handlers) or use the provided API routes that proxy storage operations.

Direct Supabase (fallback)

- In rare transitional cases, you may see `(api as any).supabase` used in UI code. Prefer adding a domain method and replacing these usages. Treat this as a migration aid, not a pattern.

Adding a New Domain

- Create under `src/lib/atoms-api/domains/<name>.ts` and export a `create<Name>Domain(supabase)`.
- Wire it into `client.ts` and `server.ts`.
- Use `Tables`, `TablesInsert`, `TablesUpdate` for typed I/O.
- Always wrap errors with `normalizeError(e, 'message')`.
- Keep methods small and focused; expose the shape the UI needs (avoid leaking raw joins).

Conventions

- Keep UI free of direct Supabase imports; call domain methods.
- Prefer soft-delete methods where applicable; name hard-delete methods explicitly.
- Add small DTOs or typed return shapes when joins are involved.
