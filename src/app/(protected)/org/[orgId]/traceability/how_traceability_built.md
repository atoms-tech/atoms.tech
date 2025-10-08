# Traceability System Architecture

This document describes how the traceability system is built in the atoms.tech project, including requirement retrieval and trace link functionality.

## Overview

The traceability system consists of two main components:

1. **Requirement Relationships** - Hierarchical parent-child relationships between requirements
2. **Trace Links** - Cross-references between different entity types (requirements, tasks, epics, projects)

---

## Database Structure

### Requirements Closure Table

The system uses a **closure table pattern** to efficiently manage hierarchical requirement relationships.

**Table:** `requirements_closure`

```sql
CREATE TABLE requirements_closure (
    ancestor_id UUID NOT NULL,
    descendant_id UUID NOT NULL,
    depth INT NOT NULL,  -- 0 = self, 1 = direct parent-child, 2+ = transitive
    created_at TIMESTAMP DEFAULT now() NOT NULL,
    created_by UUID NOT NULL,
    updated_at TIMESTAMP,
    updated_by UUID,
    PRIMARY KEY (ancestor_id, descendant_id)
);
```

**Key Characteristics:**

- Stores **all** relationships, both direct and transitive
- `depth = 0`: Self-referential (every requirement points to itself)
- `depth = 1`: Direct parent-child relationship
- `depth > 1`: Ancestor-descendant (grandparent, great-grandparent, etc.)
- Enables efficient querying of entire hierarchies without recursive queries

### Trace Links Table

**Table:** `trace_links`

Stores cross-references between different entity types:

- `source_id` / `source_type`: The entity creating the link
- `target_id` / `target_type`: The entity being referenced
- Supports bidirectional tracing

---

## Retrieving All Project Requirements

### Frontend Hook: `useProjectRequirements`

**Location:** `src/hooks/queries/useRequirement.ts:45-77`

```typescript
export function useProjectRequirements(
    projectId: string,
    options?: { enabled?: boolean },
);
```

**How It Works:**

1. Performs a **join** between `requirements` and `documents` tables
2. Filters by `documents.project_id` to get all requirements belonging to the project
3. Excludes soft-deleted requirements (`is_deleted = false`)
4. Returns requirements with document metadata

**SQL Query Structure:**

```sql
SELECT
    requirements.*,
    documents.id,
    documents.project_id,
    documents.name
FROM requirements
INNER JOIN documents ON requirements.document_id = documents.id
WHERE documents.project_id = ?
  AND requirements.is_deleted = false
ORDER BY created_at DESC
```

**Used By:**

- Traceability page (`TraceabilityPage.client.tsx:77-80`)
- Block canvas components
- Requirement analysis tools

---

## Requirement Relationship Functions

### Database Functions (Backend)

The system uses **PostgreSQL stored procedures** to manage relationships with cycle detection:

#### 1. Create Relationship

**Function:** `create_requirement_relationship(p_ancestor_id, p_descendant_id, p_created_by)`

**API Endpoint:** `POST /api/requirements/relationships`

**Location:** `src/app/(protected)/api/requirements/relationships/route.ts:16-76`

**Process:**

1. Validates input parameters
2. Checks for cycles (prevents circular dependencies)
3. Inserts direct relationship (`depth = 1`)
4. Inserts all transitive relationships automatically
5. Returns count of relationships created

**Example:**

```
Parent: A
Child: B

Creates in closure table:
- (A, A, 0) - self
- (B, B, 0) - self
- (A, B, 1) - direct parent-child
```

#### 2. Get Requirement Tree

**Function:** `get_requirement_tree(p_project_id)`

**API Endpoint:** `GET /api/requirements/relationships?type=tree&projectId=xxx`

**Location:** `src/app/(protected)/api/requirements/relationships/route.ts:238-241`

**Returns:** Complete hierarchical tree of all requirements in a project

```typescript
{
    requirement_id: string;
    title: string;
    parent_id: string | null;
    depth: number;
    path: string; // e.g., "parent_id > child_id > grandchild_id"
    has_children: boolean;
}
[];
```

#### 3. Get Descendants

**Function:** `get_requirement_descendants(p_ancestor_id, p_max_depth)`

**API Endpoint:** `GET /api/requirements/relationships?type=descendants&requirementId=xxx`

**Location:** `src/app/(protected)/api/requirements/relationships/route.ts:219-222`

#### 4. Get Ancestors

**Function:** `get_requirement_ancestors(p_descendant_id, p_max_depth)`

**API Endpoint:** `GET /api/requirements/relationships?type=ancestors&requirementId=xxx`

**Location:** `src/app/(protected)/api/requirements/relationships/route.ts:232-235`

#### 5. Delete Relationship

**Function:** `delete_requirement_relationship(p_ancestor_id, p_descendant_id, p_updated_by)`

**API Endpoint:** `DELETE /api/requirements/relationships`

**Location:** `src/app/(protected)/api/requirements/relationships/route.ts:79-180`

**Process:**

1. Validates relationship exists
2. Soft deletes the direct relationship
3. Automatically removes all transitive relationships
4. Returns count of relationships deleted

---

## Frontend Hooks for Relationships

### Location: `src/hooks/queries/useRequirementRelationships.ts`

#### 1. `useRequirementTree(projectId)`

**Purpose:** Retrieve entire requirement hierarchy for a project

**Query Key:** `['requirements', 'tree', projectId]`

**Cache Settings:**

- `staleTime: 5 minutes` - considers data fresh for 5 minutes
- `gcTime: 10 minutes` - keeps in cache for 10 minutes

**Returns:** Array of `RequirementTreeNode`

**Used By:**

- Traceability page tree view (`TraceabilityPage.client.tsx:70-74`)

#### 2. `useCreateRelationship()`

**Purpose:** Create parent-child relationship

**Invalidates:**

- Descendant queries for the parent
- Ancestor queries for the child
- All tree queries

**Used By:**

- Traceability page hierarchy tab (`TraceabilityPage.client.tsx:116-159`)

#### 3. `useDeleteRelationship()`

**Purpose:** Remove parent-child relationship

**Invalidates:**

- Descendant queries for the parent
- Ancestor queries for the child
- All tree queries

**Used By:**

- Traceability page tree view delete button (`TraceabilityPage.client.tsx:162-206`)

#### 4. `useRequirementDescendants(requirementId, maxDepth?)`

**Purpose:** Get all children and descendants of a requirement

**Query Key:** `['requirements', 'descendants', requirementId, maxDepth]`

**Returns:** Array of `RequirementNode`

```typescript
{
    requirementId: string;
    title: string;
    depth: number;
    directParent: boolean;
}
```

#### 5. `useRequirementAncestors(requirementId, maxDepth?)`

**Purpose:** Get all parents and ancestors of a requirement

**Query Key:** `['requirements', 'ancestors', requirementId, maxDepth]`

**Returns:** Array of `RequirementNode`

---

## Trace Links System

### Frontend Hooks for Trace Links

**Location:** `src/hooks/queries/useTraceability.ts`

#### 1. `useTraceLinks(sourceId, sourceType)`

**Purpose:** Get all outgoing trace links from an entity

**Location:** `src/hooks/queries/useTraceability.ts:8-28`

**Query Structure:**

```typescript
buildQuery('trace_links', {
    filters: [
        { field: 'source_id', operator: 'eq', value: sourceId },
        { field: 'source_type', operator: 'eq', value: sourceType },
        { field: 'is_deleted', operator: 'eq', value: false },
    ],
});
```

**Used By:**

- `TraceLinksGraph.tsx:63-66` - visualizing requirement relationships

#### 2. `useReverseTraceLinks(targetId, targetType)`

**Purpose:** Get all incoming trace links to an entity

**Location:** `src/hooks/queries/useTraceability.ts:30-50`

**Query Structure:**

```typescript
buildQuery('trace_links', {
    filters: [
        { field: 'target_id', operator: 'eq', value: targetId },
        { field: 'target_type', operator: 'eq', value: targetType },
        { field: 'is_deleted', operator: 'eq', value: false },
    ],
});
```

**Used By:**

- `TraceLinksGraph.tsx:67-70` - finding parent requirements

### Trace Link Mutations

**Location:** `src/hooks/mutations/useTraceLinkMutations.ts`

#### 1. `useCreateTraceLink()`

**Purpose:** Create single trace link

**Location:** `src/hooks/mutations/useTraceLinkMutations.ts:19-52`

**Process:**

1. Inserts record into `trace_links` table
2. Sets `version = 1` automatically
3. Invalidates queries for both source and target

#### 2. `useCreateTraceLinks()`

**Purpose:** Bulk create multiple trace links

**Location:** `src/hooks/mutations/useTraceLinkMutations.ts:54-90`

#### 3. `useDeleteTraceLink()`

**Purpose:** Soft delete trace link

**Location:** `src/hooks/mutations/useTraceLinkMutations.ts:92-125`

**Process:**

1. Sets `is_deleted = true`
2. Records `deleted_at` timestamp
3. Records `deleted_by` user ID
4. Invalidates relevant queries

---

## Visualization Components

### TraceLinksGraph Component

**Location:** `src/components/TraceLinksGraph.tsx`

**Purpose:** Visual graph representation of requirement relationships using ReactFlow

**How It Works:**

1. **Data Fetching:**
    - Gets current requirement (`useRequirement`)
    - Gets outgoing links (`useTraceLinks`)
    - Gets incoming links (`useReverseTraceLinks`)
    - Fetches linked requirement details (`useRequirementsByIds`)

2. **Graph Layout:**
    - **Parent nodes** positioned above (depth -1)
    - **Current requirement** in center (depth 0)
    - **Child nodes** positioned below (depth +1)

3. **Node Styling:**
    - Different colors for different entity types (requirement, task, epic, project)
    - Current node highlighted with dashed border
    - Clickable nodes navigate to requirement detail page

4. **Edge Rendering:**
    - Animated smooth edges with arrow markers
    - Blue gradient stroke style

**Used By:**

- Requirement detail page trace tab (`src/app/(protected)/org/[orgId]/project/[projectId]/requirements/[requirementSlug]/trace/page.tsx`)

### Traceability Page

**Location:** `src/app/(protected)/org/[orgId]/traceability/TraceabilityPage.client.tsx`

**Three Main Tabs:**

#### 1. Hierarchy Tab (lines 319-696)

- Select parent requirement
- Select multiple child requirements
- Create parent-child relationships
- Uses `useCreateRelationship` mutation

#### 2. Tree View Tab (lines 698-948)

- Displays entire requirement hierarchy
- Shows depth levels with visual indentation
- Displays path through hierarchy
- Delete relationships with `useDeleteRelationship`
- Filters to show only hierarchical nodes (`has_children || depth > 0`)

#### 3. Manage Tab (lines 950-970)

- Placeholder for future relationship management features

---

## Query Key Structure

**Location:** `src/lib/constants/queryKeys.ts`

```typescript
queryKeys.requirements = {
    root: ['requirements'],
    list: (filters) => [...root, 'list', filters],
    detail: (id) => [...root, 'detail', id],
    byProject: (projectId) => [...root, 'byProject', projectId],
    byDocument: (documentId) => [...root, 'byDocument', documentId],
    byBlock: (blockId) => [...root, 'byBlock', blockId],
    tree: (projectId) => ['requirements', 'tree', projectId],
    descendants: (id, depth?) => ['requirements', 'descendants', id, depth],
    ancestors: (id, depth?) => ['requirements', 'ancestors', id, depth],
};

queryKeys.traceLinks = {
    bySource: (sourceId, sourceType) => ['traceLinks', 'source', sourceId, sourceType],
    byTarget: (targetId, targetType) => ['traceLinks', 'target', targetId, targetType],
};
```

---

## Data Flow Summary

### Creating Requirement Relationships

```
UI (TraceabilityPage.client.tsx)
    ↓
useCreateRelationship() hook
    ↓
POST /api/requirements/relationships
    ↓
create_requirement_relationship() DB function
    ↓
requirements_closure table (inserts direct + transitive relationships)
    ↓
React Query cache invalidation
    ↓
UI auto-refreshes with new hierarchy
```

### Fetching Requirement Tree

```
UI (TraceabilityPage.client.tsx)
    ↓
useRequirementTree(projectId) hook
    ↓
GET /api/requirements/relationships?type=tree&projectId=xxx
    ↓
get_requirement_tree() DB function
    ↓
Returns complete hierarchy with paths
    ↓
React Query caches result (5 min stale time)
    ↓
UI renders tree view with depth-based indentation
```

### Displaying Trace Links Graph

```
UI (TraceLinksGraph component)
    ↓
Parallel queries:
    - useRequirement(requirementId)
    - useTraceLinks(requirementId, 'requirement')
    - useReverseTraceLinks(requirementId, 'requirement')
    ↓
Extract linked requirement IDs
    ↓
useRequirementsByIds(linkedIds)
    ↓
buildQuery('requirements') with .in(ids)
    ↓
ReactFlow renders graph with parent/current/child layout
```

---

## Key Design Decisions

### 1. Closure Table Pattern

**Benefit:** Eliminates need for recursive queries, provides O(1) hierarchy queries
**Trade-off:** More storage space, more complex insert/delete operations

### 2. Soft Deletes

**Benefit:** Maintains audit trail, enables undo functionality
**Trade-off:** Must always filter `is_deleted = false`

### 3. React Query Caching

**Benefit:** Reduces API calls, improves performance
**Strategy:**

- Tree queries: 5-minute stale time (hierarchies change infrequently)
- Detail queries: Default stale time (may change frequently)

### 4. Database Functions for Relationships

**Benefit:** Ensures data integrity, cycle prevention, atomic operations
**Trade-off:** Logic resides in database, harder to test/debug

### 5. Separate Trace Links vs Relationships

**Benefit:** Clear separation of concerns

- **Relationships:** Hierarchical structure (requirements only)
- **Trace Links:** Cross-references (any entity types)

---

## Future Enhancements

Based on the codebase analysis, potential improvements include:

1. **Manage Tab Implementation** - Currently placeholder (TraceabilityPage.client.tsx:950-970)
2. **Batch Relationship Operations** - Optimize multiple creates/deletes
3. **Relationship History** - Track changes over time using audit fields
4. **Cycle Detection UI** - Better user feedback when cycles are prevented
5. **Relationship Types** - Add relationship type metadata (depends_on, implements, validates, etc.)
